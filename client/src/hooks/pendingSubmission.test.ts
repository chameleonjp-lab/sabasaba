import {afterEach,it,expect,vi} from 'vitest';
vi.mock('react',()=>({useMemo:(f:()=>unknown)=>f()}));
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
async function setup(failStorage=false){
 const stored=new Map<string,string>();
 const storage={getItem:(k:string)=>stored.get(k)??null,setItem:(k:string,v:string)=>{if(failStorage)throw new Error('quota');stored.set(k,v)}};
 vi.stubGlobal('window',{localStorage:storage,setTimeout,clearTimeout});
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
 const {useGameRanking}=await import('./useGameRanking');
 return {api:useGameRanking(),stored};
}
const snapshot={outcome:'clear',score:1,seconds:600,kills:1,level:1,damageHits:0,damageTaken:0} as any;
it('keeps all 21 unsent receipts without evicting the oldest',async()=>{
 const {api,stored}=await setup();
 for(let i=0;i<21;i++)await api.submitRun({playToken:`p${i}`,mode:'normal',displayName:'A',clientRunId:`r${i}`,playCount:1},snapshot).catch(()=>{});
 const pending=JSON.parse(stored.get('sabasaba-ranking-pending-v2')!);
 expect(pending).toHaveLength(21);expect(pending[0].playToken).toBe('p0');
});
it('reports nonpersistent failure and retains receipt for in-memory retry',async()=>{
 const {api}=await setup(true);
 await expect(api.submitRun({playToken:'p',mode:'normal',displayName:'A',clientRunId:'r',playCount:1},snapshot)).rejects.toMatchObject({persisted:false});
 const result=await api.retryPendingSubmissions();expect(result.failed).toBe(1);
});
it('does not remove old persisted receipts when a newer receipt cannot be saved',async()=>{
 const {api,stored}=await setup();
 stored.set('sabasaba-ranking-pending-v2',JSON.stringify([{playToken:'old',mode:'normal',outcome:'clear',score:1}]));
 window.localStorage.setItem=()=>{throw new Error('quota')};
 await api.submitRun({playToken:'new',mode:'normal',displayName:'A',clientRunId:'r',playCount:1},snapshot).catch(()=>{});
 expect(JSON.parse(stored.get('sabasaba-ranking-pending-v2')!)[0].playToken).toBe('old');
 expect((await api.retryPendingSubmissions()).failed).toBe(2);
});
it('keeps the same token for retries and does not retry an acknowledged in-memory receipt',async()=>{
 const {api}=await setup(true);
 await api.submitRun({playToken:'same',mode:'normal',displayName:'A',clientRunId:'r',playCount:1},snapshot).catch(()=>{});
 vi.mocked(fetch).mockResolvedValue({ok:true,text:async()=>JSON.stringify({accepted:true,result_score:1})} as Response);
 expect((await api.retryPendingSubmissions()).submitted).toBe(1);
 expect((await api.retryPendingSubmissions()).submitted).toBe(0);
 expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string).p_play_token).toBe('same');
});
