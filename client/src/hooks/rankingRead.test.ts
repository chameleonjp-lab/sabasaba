import { describe, expect, it, vi } from 'vitest';
import { readRankingForRun } from './rankingRead';
import type { RankingRow } from './useGameRanking';
function deferred() {
 let resolve!: (value: RankingRow[]) => void;
 let reject!: (reason?: unknown) => void;
 const promise = new Promise<RankingRow[]>((res, rej) => {resolve=res;reject=rej;});
 return {promise,resolve,reject};
}
function fixture() {
 const runCounter={current:1},requestCounter={current:0};
 const states:boolean[]=[],rows:RankingRow[][]=[],errors:string[]=[];
 const requests=[deferred(),deferred()];let n=0;
 const fetchRows=vi.fn(() => requests[n++].promise);
 const read=() => readRankingForRun({mode:'endless',runId:runCounter.current,runCounter,requestCounter,enabled:true,fetchRows,limit:30,setRows:value=>rows.push(value),setError:value=>errors.push(value),setLoading:value=>states.push(value),errorMessage:'offline'});
 return {read,runCounter,requestCounter,requests,states,rows,errors,fetchRows};
}
describe('actual ranking read handler request and run generations', () => {
 it('keeps a newer read loading when an older read finishes first', async () => {
  const f=fixture(); const old=f.read(), recent=f.read();
  f.requests[0].resolve([{rank:1,displayName:'old',bestScore:1,playCount:1}]);await old;
  expect(f.states).toEqual([true,true]);expect(f.rows).toEqual([]);
  f.requests[1].resolve([]);await recent;
  expect(f.states).toEqual([true,true,false]);expect(f.rows).toEqual([[]]);
  expect(f.fetchRows).toHaveBeenCalledWith('endless',30);
 });
 it('ignores a late older failure after the newer read succeeds', async () => {
  const f=fixture();const old=f.read(),recent=f.read();
  f.requests[1].resolve([]);await recent;
  f.requests[0].reject(Error('old'));await old;
  expect(f.errors).toEqual(['']);expect(f.states).toEqual([true,true,false]);
 });
 it('does not end loading or overwrite rows for a replaced run', async () => {
  const f=fixture();const old=f.read();f.runCounter.current++;f.requestCounter.current++;
  const recent=f.read();f.requests[0].reject(Error('old run'));await old;
  expect(f.states).toEqual([true,true]);expect(f.errors).toEqual([]);
  f.requests[1].resolve([]);await recent;expect(f.states).toEqual([true,true,false]);
 });
});

it('ignores a read invoked with an already obsolete run id before invalidating a newer request', async () => {
 const setLoading=vi.fn(),fetchRows=vi.fn(async()=>[]),setRows=vi.fn(),setError=vi.fn();
 const runCounter={current:2},requestCounter={current:7};
 await readRankingForRun({mode:'normal',runId:1,runCounter,requestCounter,enabled:true,fetchRows,limit:30,setRows,setError,setLoading,errorMessage:'offline'});
 expect(requestCounter.current).toBe(7);
 expect(setLoading).not.toHaveBeenCalled();expect(fetchRows).not.toHaveBeenCalled();
 expect(setRows).not.toHaveBeenCalled();expect(setError).not.toHaveBeenCalled();
});
