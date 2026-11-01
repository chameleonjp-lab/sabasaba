import {afterEach,it,expect,vi} from 'vitest';
vi.mock('react',()=>({useRef:(v:unknown)=>({current:v}),useState:(v:any)=>[typeof v==='function'?v():v,()=>{}],useCallback:(f:unknown)=>f,useMemo:(f:()=>unknown)=>f(),useEffect:(f:()=>unknown)=>{f()}}));
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
async function setup(){
 let context:any;const sources:any[]=[];const gains:any[]=[];
 class Context extends EventTarget {
  state='running';currentTime=1;destination={};resume=vi.fn().mockResolvedValue(undefined);
  constructor(){super();context=this;}
  createGain(){const gain={gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect:vi.fn()};gains.push(gain);return gain;}
  createOscillator(){const source={frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect:vi.fn(),start:vi.fn(),stop:vi.fn()};sources.push(source);return source;}
 }
 const storage={getItem:()=>null,setItem:vi.fn()};
 vi.stubGlobal('window',{AudioContext:Context,localStorage:storage});vi.stubGlobal('localStorage',storage);
 vi.stubGlobal('document',{hidden:false,addEventListener:vi.fn(),removeEventListener:vi.fn()});vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));
 const {useGameAudio}=await import('./useGameAudio');const api=useGameAudio();await api.unlock();return {api,context,sources,gains};
}
it('stops scheduled voices when context is interrupted and never replays them',async()=>{
 const {api,context,sources}=await setup();api.play('start');expect(sources).toHaveLength(3);
 context.state='interrupted';context.dispatchEvent(new Event('statechange'));
 for(const source of sources)expect(source.stop).toHaveBeenCalledTimes(2);
 api.play('choice');expect(sources).toHaveLength(3);
});
it('does not play an old gesture after an interrupted pending resume resolves',async()=>{
 const {api,context,sources}=await setup();let resolve!:()=>void;
 context.resume.mockImplementation(()=>new Promise<void>(r=>resolve=r));
 const pending=api.unlockAndPlay('choice');context.state='interrupted';context.dispatchEvent(new Event('statechange'));
 context.state='running';resolve();await pending;expect(sources).toHaveLength(0);
});

it('disconnects every source and gain even when stop throws for an ended source',async()=>{
 const {api,context,sources,gains}=await setup();api.play('start');
 for(const source of sources)source.stop.mockImplementation(()=>{throw new Error('ended')});
 context.state='interrupted';context.dispatchEvent(new Event('statechange'));
 for(const source of sources)expect(source.disconnect).toHaveBeenCalled();
 for(const gain of gains)expect(gain.disconnect).toHaveBeenCalled();
 context.state='running';context.currentTime=2;api.play('choice');expect(sources).toHaveLength(5);
});
