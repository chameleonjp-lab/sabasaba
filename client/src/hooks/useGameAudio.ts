import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameSoundCue } from "@/game/types";

const VOLUME_STORAGE_KEY = "sabasaba.audio-volume.v1";
const AUDIO_STORAGE_KEY = "neon-siege-player-audio-v1";

const externalSampleSources: Partial<Record<GameSoundCue, string>> = {
  boss: `${import.meta.env.BASE_URL}audio/cc0-metal1.wav`,
  kill: `${import.meta.env.BASE_URL}audio/kill-confirm.wav`,
  "kill-bulwark": `${import.meta.env.BASE_URL}audio/kill-confirm.wav`,
  choice: `${import.meta.env.BASE_URL}audio/cc0-switch1.wav`,
};

const readStoredAudio = () => {
  try {
    const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (raw === null) return true;
    return raw !== "off";
  } catch {
    return true;
  }
};

const frequencies: Record<GameSoundCue, number[]> = {
  start: [220, 330, 440],
  attack: [260],
  kill: [150, 420, 840],
  "kill-scout": [560, 760],
  "kill-striker": [190, 310, 470],
  "kill-bulwark": [82, 118, 176],
  xp: [520],
  "level-up": [330, 494, 660],
  evolution: [262, 330, 392, 523, 659],
  warning: [110, 146],
  perfect: [880, 1175],
  dodge: [620, 930],
  boss: [92, 138, 184],
  damage: [86],
  "low-health": [72, 96],
  clear: [392, 523, 659, 784],
  gameover: [196, 147, 110],
  choice: [330, 440],
};

const cueDuration: Record<GameSoundCue, number> = {
  start: 0.12,
  attack: 0.025,
  kill: 0.045,
  "kill-scout": 0.08,
  "kill-striker": 0.11,
  "kill-bulwark": 0.18,
  xp: 0.055,
  "level-up": 0.16,
  evolution: 0.65,
  warning: 0.1,
  perfect: 0.14,
  dodge: 0.11,
  boss: 0.18,
  damage: 0.1,
  "low-health": 0.12,
  clear: 0.2,
  gameover: 0.22,
  choice: 0.09,
};

/**
 * Most cues are synthesized for tight timing. A small number of CC0 samples
 * are layered on the same AudioContext clock after they have been decoded.
 * AudioContext is created and resumed only from an explicit user gesture.
 */
export function useGameAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const externalBuffersRef = useRef<Partial<Record<GameSoundCue, AudioBuffer>>>({});
  const externalLoadingRef = useRef<Partial<Record<GameSoundCue, boolean>>>({});
  const [enabled, setEnabledState] = useState(readStoredAudio);
  const [volume, setVolumeState] = useState(() => {
    try { const raw = localStorage.getItem(VOLUME_STORAGE_KEY); const value = Number(raw); return raw !== null && Number.isFinite(value) && value >= 0 && value <= 1 ? value : 1; } catch { return 1; }
  });
  const enabledRef = useRef(enabled), volumeRef = useRef(volume);
  const sourcesRef = useRef(new Map<AudioScheduledSourceNode, AudioNode[]>());
  const lastCueRef = useRef(new Map<GameSoundCue, number>());
  const playbackEpochRef = useRef(0);
  const stop = useCallback(() => {
    playbackEpochRef.current += 1;
    for (const [source,nodes] of Array.from(sourcesRef.current)) {
      try { source.stop(); } catch { /* An already-ended source still needs disconnection. */ }
      try { source.disconnect(); } catch { /* Continue releasing the other nodes. */ }
      nodes.forEach(node => { try { node.disconnect(); } catch { /* Already disconnected. */ } });
    }
    sourcesRef.current.clear();
  }, []);
  const setVolume = useCallback((next:number) => {
    if (!Number.isFinite(next) || next < 0 || next > 1) return;
    volumeRef.current = next; setVolumeState(next); if (next === 0) stop();
    try { localStorage.setItem(VOLUME_STORAGE_KEY,String(next)); } catch { /* Session preference remains. */ }
  }, [stop]);

  const getContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!contextRef.current) {
      try {
        const context = new AudioContextCtor();
        contextRef.current = context;
        context.addEventListener("statechange", () => {
          if (contextRef.current === context && context.state !== "running") stop();
        });
      } catch {
        return null;
      }
    }
    return contextRef.current;
  }, [stop]);

  const setEnabled = useCallback((next: boolean) => {
    enabledRef.current = next;
    setEnabledState(next);
    if (!next) stop();
    try {
      window.localStorage.setItem(AUDIO_STORAGE_KEY, next ? "on" : "off");
    } catch {
      // Continue with the in-memory preference if storage is unavailable.
    }
  }, [stop]);

  const preloadExternalSamples = useCallback((context: AudioContext) => {
    Object.entries(externalSampleSources).forEach(([cue, source]) => {
      const sampleCue = cue as GameSoundCue;
      if (!source || externalBuffersRef.current[sampleCue] || externalLoadingRef.current[sampleCue]) return;
      externalLoadingRef.current[sampleCue] = true;
      void fetch(source)
        .then((response) => {
          if (!response.ok) throw new Error(`Audio sample request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then((data) => context.decodeAudioData(data))
        .then((buffer) => {
          if (contextRef.current === context) externalBuffersRef.current[sampleCue] = buffer;
        })
        .catch(() => undefined)
        .finally(() => {
          externalLoadingRef.current[sampleCue] = false;
        });
    });
  }, []);

  const play = useCallback((cue: GameSoundCue) => {
    if (!enabledRef.current || volumeRef.current === 0 || document.hidden) return;
    const context = contextRef.current;
    if (!context || context.state !== "running") return;
    const now = context.currentTime;
    if (now - (lastCueRef.current.get(cue) ?? -Infinity) < 0.05) return;
    if (cue === 'clear' || cue === 'gameover' || cue === 'evolution') stop();
    if (sourcesRef.current.size >= 24) return;
    lastCueRef.current.set(cue,now);
    const duration = cueDuration[cue];
    const frequenciesForCue = frequencies[cue];
    const isKillCue = cue === "kill" || cue.startsWith("kill-");
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    const peakGain = cue === "attack" ? 0.018 : isKillCue ? 0.035 : 0.06;
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001,peakGain * volumeRef.current), now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    master.connect(context.destination);

    const externalBuffer = externalBuffersRef.current[cue];
    if (externalBuffer) {
      const sampleGain = context.createGain();
      sampleGain.gain.setValueAtTime(0.0001, now);
      sampleGain.gain.exponentialRampToValueAtTime(Math.max(0.0001,(cue === "boss" ? 0.16 : isKillCue ? 0.14 : 0.12) * volumeRef.current), now + 0.006);
      sampleGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(externalBuffer.duration, 0.72));
      sampleGain.connect(context.destination);
      const sample = context.createBufferSource();
      sample.buffer = externalBuffer;
      sample.connect(sampleGain);
      sourcesRef.current.set(sample,[sampleGain]);
      sample.onended = () => { sample.disconnect(); sampleGain.disconnect(); sourcesRef.current.delete(sample); };
      sample.start(now);
      sample.stop(now + Math.min(externalBuffer.duration, 0.72) + 0.02);
    }

    let remaining = frequenciesForCue.length;
    frequenciesForCue.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = cue === "damage" || cue === "warning" ? "sawtooth" : isKillCue ? "square" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.035);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.72), now + duration);
      oscillator.connect(master);
      sourcesRef.current.set(oscillator,[master]);
      oscillator.onended = () => { oscillator.disconnect(); sourcesRef.current.delete(oscillator); if (--remaining === 0) master.disconnect(); };
      oscillator.start(now + index * 0.035);
      oscillator.stop(now + duration + 0.02);
    });
  }, [stop]);

  const unlock = useCallback(async () => {
    if (!enabledRef.current || volumeRef.current === 0 || document.hidden) return;
    const context = getContext();
    if (!context) return;
    await context.resume().catch(() => undefined);
    preloadExternalSamples(context);
  }, [getContext, preloadExternalSamples]);

  const unlockAndPlay = useCallback(async (cue: GameSoundCue) => {
    const epoch = playbackEpochRef.current;
    await unlock();
    if (epoch === playbackEpochRef.current) play(cue);
  }, [unlock, play]);

  useEffect(() => {
    const hidden = () => { if (document.hidden) { stop(); if (contextRef.current?.state === 'running') void contextRef.current.suspend().catch(() => undefined); } };
    document.addEventListener('visibilitychange',hidden);
    return () => document.removeEventListener('visibilitychange',hidden);
  }, [stop]);
  useEffect(() => () => {
    stop();
    const context = contextRef.current;
    contextRef.current = null;
    if (context) void context.close().catch(() => undefined);
  }, []);

  return useMemo(() => ({ enabled, volume, setVolume, setEnabled, unlock, unlockAndPlay, play }), [enabled, volume, setVolume, play, setEnabled, unlock, unlockAndPlay]);
}
