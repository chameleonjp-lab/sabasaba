import type { GameMode } from '@/game/types';
import type { RankingRow } from './useGameRanking';
type Counter = { current: number };
type RankingRead = {
  mode: GameMode;
  runId: number;
  runCounter: Counter;
  requestCounter: Counter;
  enabled: boolean;
  fetchRows: (mode: GameMode, limit: number) => Promise<RankingRow[]>;
  limit: number;
  setRows: (rows: RankingRow[]) => void;
  setError: (message: string) => void;
  setLoading: (loading: boolean) => void;
  errorMessage: string;
};
/** A late read must never change either data or loading state for a newer request/run. */
export async function readRankingForRun(options: RankingRead): Promise<void> {
  const {runId, runCounter, requestCounter, setRows, setError, setLoading} = options;
  if (runCounter.current !== runId) return;
  const request = ++requestCounter.current;
  const isCurrent = () => runCounter.current === runId && requestCounter.current === request;
  setLoading(true);
  try {
    if (!options.enabled) { setRows([]); setError(''); return; }
    const rows = await options.fetchRows(options.mode, options.limit);
    if (!isCurrent()) return;
    setRows(rows);
    setError('');
  } catch {
    if (!isCurrent()) return;
    setRows([]);
    setError(options.errorMessage);
  } finally {
    if (isCurrent()) setLoading(false);
  }
}
