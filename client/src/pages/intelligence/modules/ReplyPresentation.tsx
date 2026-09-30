import { useEffect, useRef, useState } from "react";

/** Reveals an answer already returned by the existing engine. No second request. */
export function ProgressiveReply({ text, animate, onProgress }: {
  text: string; animate: boolean; onProgress?: () => void;
}) {
  const [visible, setVisible] = useState(() => animate ? 0 : Array.from(text).length);
  const finished = useRef(!animate);
  const progress = useRef(onProgress);
  progress.current = onProgress;
  const characters = Array.from(text);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const length = Array.from(text).length;
    let frame = 0;
    const finish = () => {
      window.cancelAnimationFrame(frame);
      finished.current = true;
      setVisible(length);
    };
    if (!animate || finished.current || media.matches || length === 0) { finish(); return; }
    const start = performance.now();
    const duration = Math.min(2500, Math.max(400, length * 8));
    const tick = (now: number) => {
      const count = Math.min(length, Math.floor(length * (now - start) / duration));
      setVisible(count);
      if (count < length) frame = window.requestAnimationFrame(tick);
      else finished.current = true;
    };
    const changed = () => { if (media.matches) finish(); };
    media.addEventListener("change", changed);
    frame = window.requestAnimationFrame(tick);
    return () => { window.cancelAnimationFrame(frame); media.removeEventListener("change", changed); };
  }, [text, animate]);
  useEffect(() => { progress.current?.(); }, [visible]);
  const complete = visible >= characters.length;
  const lines = characters.slice(0, visible).join("").split("\n");
  return <p className="alhud-progressive-reply whitespace-pre-wrap text-[#111]" data-revealing={!complete}>
    {/* One complete accessible answer; the visual animation stays silent. */}
    <span className="alhud-sr-only">{text}</span>
    <span aria-hidden="true">{lines.map((line, index) => <span key={index}>
      <span className={!complete && index === lines.length - 1 ? "alhud-active-line" : undefined}>{line}</span>
      {index < lines.length - 1 ? "\n" : ""}
    </span>)}</span>
  </p>;
}

export function WaitingReply() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const interval = window.setInterval(() => setSeconds(Math.floor((performance.now() - start) / 1000)), 250);
    return () => window.clearInterval(interval);
  }, []);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className="alhud-waiting-reply">
    <span role="status" className="alhud-active-line">AL-HUDHUD·M réfléchit…</span>
    <span role="timer" aria-live="off" aria-label="Temps d’attente" className="alhud-waiting-time">{time}</span>
  </div>;
}
