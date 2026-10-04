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

export function WaitingReply({ action }: { action?: string } = {}) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const interval = window.setInterval(() => setSeconds(Math.floor((performance.now() - start) / 1000)), 250);
    return () => window.clearInterval(interval);
  }, []);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className="alhud-waiting-reply">
    <span role="status" className="alhud-active-line">{action ? `${action}…` : "AL-HUDHUD·M réfléchit…"}</span>
    <span role="timer" aria-live="off" aria-label="Temps d’attente" className="alhud-waiting-time">{time}</span>
  </div>;
}

export interface EtapeTravail {
  etape: string;
  libelle: string;
  statut: string;
  observe: string;
}

const LIBELLES_STATUT: Record<string, string> = {
  en_cours: "en cours",
  fait: "fait",
  partielle: "partielle",
  refuse: "bloquée",
  en_attente_autorisation: "autorisation requise",
  echec: "échec",
  non_execute: "non exécutée",
  non_applicable: "non applicable",
};

/** Steps published by the mission engine while it runs (Travail mode), and kept under the final report. */
export function MissionSteps({ etapes, enCours }: { etapes: EtapeTravail[]; enCours: boolean }) {
  if (!etapes.length) return enCours ? <p className="alhud-mission-steps-empty">Préparation de la mission…</p> : null;
  const faites = etapes.filter((e) => e.statut === "fait").length;
  return <div className="alhud-mission-steps" aria-label="Étapes de la mission">
    <p className="alhud-mission-steps-count">{faites}/{etapes.length} étape{etapes.length > 1 ? "s" : ""} faite{faites > 1 ? "s" : ""}</p>
    <ol>
      {etapes.map((e, i) => <li key={`${e.etape}-${i}`} data-statut={e.statut}>
        <span className={e.statut === "en_cours" ? "alhud-active-line" : undefined}>
          <strong>{e.libelle}</strong> · {LIBELLES_STATUT[e.statut] ?? e.statut}
        </span>
        {e.observe ? <small>{e.observe}</small> : null}
      </li>)}
    </ol>
  </div>;
}
