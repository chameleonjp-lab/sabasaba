import type { RankingRow } from '@/hooks/useGameRanking';
import { getLocale, t } from '@/i18n/runtime';

/** Names alone cannot establish ownership; wait for a verified participant contract. */
export default function RankingList({ rows, loading = false, error = "" }: { rows: RankingRow[]; loading?: boolean; error?: string }) {
  if (loading) return <p className="result-ranking-empty" role="status" data-ranking-state="loading">{t("ランキングを読み込み中…")}</p>;
  if (error) return <p className="result-ranking-empty" role="status" data-ranking-state="error">{error}</p>;
  if (!rows.length) return <p className="result-ranking-empty" role="status" data-ranking-state="empty">{t("まだランキング記録がありません。")}</p>;
  const format = new Intl.NumberFormat(getLocale());
  return <ol className="result-ranking-list">{rows.map((row, index) =>
    <li key={`${row.rank}-${row.displayName}-${index}`}>
      <b>{row.rank}</b><span>{row.displayName}</span><strong>{format.format(Math.round(Number.isFinite(row.bestScore) ? row.bestScore : 0))}</strong>
    </li>
  )}</ol>;
}
