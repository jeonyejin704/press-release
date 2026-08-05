"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 잔잔한 앰비언트 배경음악을 Web Audio API로 실시간 생성한다(오디오 파일 불필요).
// 저음역의 부드러운 코드 패드가 7초마다 천천히 진행(I–vi–IV–V 느낌)하며 반복된다.
const CHORDS: number[][] = [
  [130.81, 164.81, 196.0, 246.94], // C  E  G  B  (Cmaj7)
  [110.0, 130.81, 164.81, 196.0], // A  C  E  G  (Am7)
  [87.31, 130.81, 174.61, 220.0], // F  C  F  A  (F)
  [98.0, 146.83, 196.0, 246.94], // G  D  G  B  (G)
];

export function DashboardBgm() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ oscs: OscillatorNode[]; master: GainNode; timer: number } | null>(null);

  function start() {
    if (nodesRef.current) return;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AC) return;
    const ctx = ctxRef.current ?? new AC();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.setTargetAtTime(0.05, ctx.currentTime, 1.6); // 부드러운 페이드 인

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900; // 고음 감쇠 → 포근한 음색
    filter.connect(master);
    master.connect(ctx.destination);

    // 아주 느린 트레몰로(숨쉬는 듯한 음량 흔들림)
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();

    const oscs: OscillatorNode[] = CHORDS[0].map((f) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.25;
      o.connect(g).connect(filter);
      o.start();
      return o;
    });

    let idx = 0;
    const timer = window.setInterval(() => {
      idx = (idx + 1) % CHORDS.length;
      const chord = CHORDS[idx];
      oscs.forEach((o, i) => o.frequency.setTargetAtTime(chord[i], ctx.currentTime, 1.4));
    }, 7000);

    nodesRef.current = { oscs: [...oscs, lfo], master, timer };
  }

  function stop() {
    const n = nodesRef.current;
    const ctx = ctxRef.current;
    if (!n || !ctx) return;
    clearInterval(n.timer);
    n.master.gain.setTargetAtTime(0, ctx.currentTime, 0.4); // 페이드 아웃
    const oscs = n.oscs;
    window.setTimeout(() => oscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } }), 900);
    nodesRef.current = null;
  }

  function toggle() {
    const next = !on;
    setOn(next);
    try { localStorage.setItem("pf_bgm", next ? "on" : "off"); } catch { /* ignore */ }
    if (next) start();
    else stop();
  }

  // 이전에 켜둔 적이 있으면 대시보드 진입 시 자동 재생(메뉴 클릭이라는 사용자 동작 직후라 재생 허용됨)
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("pf_bgm"); } catch { /* ignore */ }
    if (saved === "on") {
      setOn(true);
      start();
    }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      onClick={toggle}
      title="대시보드 배경음악"
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        on
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-pgray-200 bg-white text-pgray-500 hover:bg-pgray-50"
      }`}
    >
      <span className={on ? "animate-pulse" : ""}>{on ? "🎵" : "🔈"}</span>
      {on ? "배경음악 켜짐" : "배경음악"}
    </button>
  );
}
