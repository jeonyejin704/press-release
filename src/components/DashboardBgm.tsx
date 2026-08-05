"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 대시보드 배경음악.
// 1순위: public/bgm.mp3 파일이 있으면 그 곡을 재생(원하는 노래를 직접 넣을 수 있음).
// 없으면: 따뜻한 여름 느낌의 잔잔한 멜로디를 Web Audio로 실시간 생성(무서운 느낌 X).

// C 장조 펜타토닉 — 밝고 편안한 음계
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33]; // C D E G A C D
// 따뜻한 코드 진행(장조 위주) — I–IV–vi–V
const PAD_CHORDS: number[][] = [
  [130.81, 164.81, 196.0], // C  E  G
  [174.61, 220.0, 261.63], // F  A  C
  [220.0, 261.63, 329.63], // A  C  E
  [196.0, 246.94, 293.66], // G  B  D
];

export function DashboardBgm() {
  const [on, setOn] = useState(false);
  const [usingFile, setUsingFile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const genRef = useRef<{ nodes: OscillatorNode[]; master: GainNode; timers: number[] } | null>(null);

  // ── 생성형(따뜻한 멜로디) 재생 ──────────────────────────────
  function startGenerated() {
    if (genRef.current) return;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AC) return;
    const ctx = ctxRef.current ?? new AC();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.setTargetAtTime(0.06, ctx.currentTime, 1.4);
    const warm = ctx.createBiquadFilter();
    warm.type = "lowpass";
    warm.frequency.value = 1400; // 따뜻하게
    warm.connect(master);
    master.connect(ctx.destination);

    // 부드러운 코드 패드
    const padOscs: OscillatorNode[] = PAD_CHORDS[0].map((f) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.16;
      o.connect(g).connect(warm);
      o.start();
      return o;
    });
    let chordIdx = 0;
    const chordTimer = window.setInterval(() => {
      chordIdx = (chordIdx + 1) % PAD_CHORDS.length;
      PAD_CHORDS[chordIdx].forEach((f, i) => padOscs[i].frequency.setTargetAtTime(f, ctx.currentTime, 1.2));
    }, 6000);

    // 소프트한 멜로디(펜타토닉에서 한 음씩 은은하게)
    const melTimer = window.setInterval(() => {
      const t = ctx.currentTime;
      const f = PENTA[Math.floor(Math.random() * PENTA.length)];
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.08); // 부드러운 어택
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); // 긴 릴리즈
      o.connect(g).connect(warm);
      o.start(t);
      o.stop(t + 1.7);
    }, 1900);

    genRef.current = { nodes: padOscs, master, timers: [chordTimer, melTimer] };
  }

  function stopGenerated() {
    const g = genRef.current;
    const ctx = ctxRef.current;
    if (!g || !ctx) return;
    g.timers.forEach((t) => clearInterval(t));
    g.master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    const nodes = g.nodes;
    window.setTimeout(() => nodes.forEach((o) => { try { o.stop(); } catch { /* noop */ } }), 900);
    genRef.current = null;
  }

  // ── 시작/정지 (파일 우선, 실패 시 생성형) ────────────────────
  function start() {
    const audio = new Audio("/bgm.mp3");
    audio.loop = true;
    audio.volume = 0.45;
    audio.play().then(
      () => { audioRef.current = audio; setUsingFile(true); },
      () => { setUsingFile(false); startGenerated(); }, // 파일 없거나 재생 불가 → 생성형
    );
  }

  function stop() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
    stopGenerated();
  }

  function toggle() {
    const next = !on;
    setOn(next);
    try { localStorage.setItem("pf_bgm", next ? "on" : "off"); } catch { /* ignore */ }
    if (next) start();
    else stop();
  }

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("pf_bgm"); } catch { /* ignore */ }
    if (saved === "on") { setOn(true); start(); }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      onClick={toggle}
      title={usingFile ? "배경음악(내 곡)" : "배경음악(잔잔한 멜로디)"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-pgray-200 bg-white text-pgray-500 hover:bg-pgray-50"
      }`}
    >
      <span className={on ? "animate-pulse" : ""}>{on ? "🎵" : "🔈"}</span>
      {on ? "배경음악 켜짐" : "배경음악"}
    </button>
  );
}
