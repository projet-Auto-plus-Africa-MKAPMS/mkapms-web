/**
 * Centre Cyber-Électrique — éléments communs de la vitrine : types, libellés, aiguilles mesurées, pastilles d'état, confirmation des actions
 * critiques et « toile » du plan de connexions (largeur disponible + défilement vertical sur ordinateur, déplacement + zoom sur tablette et téléphone).
 * La vitrine reflète les états CONFIRMÉS : un ordre n'est jamais présenté comme un résultat, et une valeur absente est « non mesurée ».
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@server/router.js";

export type Sorties = inferRouterOutputs<AppRouter>["frontierOs"];
export type LigneVue = Sorties["lignes"][number];
export type LigneReelle = Extract<LigneVue, { kind: "real" }>;
export type GroupeVue = Sorties["groupes"][number];
export type JaugeVue = Sorties["accueil"]["jauges"][number];

export const date = (d: string | Date | null | undefined) => (d ? new Date(d).toLocaleString("fr-FR") : "—");
export const heure = (d: string | Date | null | undefined) => (d ? new Date(d).toLocaleTimeString("fr-FR") : "—");

export const ETAT_INVENTAIRE: Record<string, { libelle: string; couleur: string }> = {
  incomplet: { libelle: "Incomplet", couleur: "#f87171" },
  prepare: { libelle: "Préparé", couleur: "#fbbf24" },
  installe: { libelle: "Installé", couleur: "#38bdf8" },
  teste: { libelle: "Testé", couleur: "#34d399" },
  connecte: { libelle: "Connecté", couleur: "#22d3ee" },
  a_verifier: { libelle: "À vérifier", couleur: "#c084fc" },
  vide: { libelle: "Vide", couleur: "#64748b" },
  actif: { libelle: "Actif", couleur: "#22d3ee" },
  bloque: { libelle: "Bloqué", couleur: "#f87171" },
  erreur: { libelle: "Erreur", couleur: "#ef4444" },
};

// ───────────────────────── Alarme standard des salles du centre ─────────────────────────
export const ALARME: Record<"vert" | "bleu" | "rouge" | "gris", { libelle: string; couleur: string }> = {
  vert: { libelle: "Normal", couleur: "#34d399" },
  bleu: { libelle: "Surveillance / information", couleur: "#38bdf8" },
  rouge: { libelle: "Danger réel", couleur: "#ef4444" },
  gris: { libelle: "Inactif / non connecté", couleur: "#64748b" },
};
export function AlarmeBadge({ alarme }: { alarme: { niveau: "vert" | "bleu" | "rouge" | "gris"; texte: string } | undefined }) {
  if (!alarme) return null;
  const a = ALARME[alarme.niveau];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-black uppercase" style={{ borderColor: `${a.couleur}88`, background: `${a.couleur}1a`, color: a.couleur }} title={alarme.texte} data-alarme={alarme.niveau}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: a.couleur }} aria-hidden="true" />
      {a.libelle}
    </span>
  );
}
export const LIBELLE_DEMANDE: Record<string, string> = { none: "aucune", activate: "activer", deactivate: "couper" };
export const LIBELLE_OBSERVE: Record<string, string> = { connected: "connecté", disconnected: "déconnecté", unknown: "inconnu" };
export const LIBELLE_AVANCEMENT: Record<string, string> = { idle: "au repos", pending: "en attente", in_progress: "en cours", confirmed: "confirmé", failed: "ÉCHEC" };
export const LIBELLE_COTE: Record<string, string> = { remote: "côté distant", center: "centre", main: "côté principal" };
export const LIBELLE_ETAT_LIGNE: Record<string, string> = { connected: "Connectée (3 coupures confirmées)", disconnected: "Coupée", partial: "Partielle", transition: "En cours de commande", failed: "En erreur", unknown: "Jamais commandée" };

export function Pastille({ etat, declareSeulement }: { etat: string | null | undefined; declareSeulement?: boolean | null }) {
  if (!etat) return null;
  const e = ETAT_INVENTAIRE[etat] ?? { libelle: etat, couleur: "#94a3b8" };
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="rounded-full px-1.5 py-px text-[9px] font-black uppercase" style={{ background: `${e.couleur}22`, color: e.couleur, border: `1px solid ${e.couleur}66` }}>{e.libelle}</span>
      {declareSeulement && <span className="whitespace-nowrap rounded-full border border-slate-500/60 px-1.5 py-px text-[9px] font-bold text-slate-300" title="Rien dans le code relevé ne prouve que ce moteur fonctionne : il est seulement déclaré.">déclaré seul.</span>}
    </span>
  );
}

// ───────────────────────── Aiguilles mesurées ─────────────────────────
const ECHELLE: Record<string, number> = { charge: 2, latence: 500, debit: 60, memoire: 1024, erreurs: 10, temperature: 100 };
const COULEUR_NIVEAU = { ok: "#34d399", alerte: "#f87171", inconnu: "#475569" } as const;

export function Aiguille({ j }: { j: JaugeVue }) {
  const mesuree = j.valeur !== null;
  const pct = mesuree ? Math.max(0, Math.min(100, (j.valeur! / (ECHELLE[j.cle] ?? 100)) * 100)) : 0;
  const angle = -90 + (pct / 100) * 180;
  const couleur = COULEUR_NIVEAU[j.niveau];
  return (
    <figure className="rounded-xl border border-cyan-500/20 bg-[#0f1722] p-3 text-center" data-jauge={j.cle} data-mesuree={mesuree} aria-label={`${j.libelle} : ${mesuree ? `${j.valeur} ${j.unite}` : "non mesurée"}`}>
      <svg viewBox="0 0 120 70" className="mx-auto h-20 w-full max-w-[160px]" role="img" aria-hidden="true">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        {mesuree && <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={couleur} strokeWidth="10" strokeLinecap="round" pathLength={100} strokeDasharray={`${pct} 100`} />}
        <g transform={`rotate(${angle} 60 60)`}><line x1="60" y1="60" x2="60" y2="20" stroke={mesuree ? "#f8fafc" : "#334155"} strokeWidth="3" strokeLinecap="round" /></g>
        <circle cx="60" cy="60" r="5" fill="#e2e8f0" />
      </svg>
      <p className="text-base font-black text-white">{mesuree ? `${Number(j.valeur!.toFixed(2))} ${j.unite}` : "non mesurée"}</p>
      <figcaption className="text-xs font-bold text-cyan-200">{j.libelle}</figcaption>
      <p className="mt-1 text-[11px] leading-tight text-slate-400">{j.note}</p>
      <p className="text-[10px] leading-tight text-slate-500">{j.source ? `source : ${j.source}` : "aucune source de mesure"}{j.mesureLe ? ` · ${heure(j.mesureLe)}` : ""}</p>
    </figure>
  );
}

// ───────────────────────── Confirmation des actions critiques ─────────────────────────
export interface ActionACconfirmer {
  titre: string;
  detail: string;
  executer: () => void;
}
export function useConfirmation() {
  const [attente, setAttente] = useState<ActionACconfirmer | null>(null);
  const demander = useCallback((a: ActionACconfirmer) => setAttente(a), []);
  const dialogue = attente ? (
    <div role="alertdialog" aria-label="Confirmation requise" className="my-3 rounded-xl border-2 border-red-500 bg-[#1f0a0a] p-3">
      <p className="text-sm font-bold text-red-100">Action critique — confirmation requise : {attente.titre}</p>
      <p className="text-xs text-red-200">{attente.detail}</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => { const a = attente; setAttente(null); a.executer(); }} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white">Confirmer</button>
        <button type="button" onClick={() => setAttente(null)} className="rounded-lg border border-slate-500 px-3 py-2 text-xs font-bold text-slate-200">Annuler</button>
      </div>
    </div>
  ) : null;
  return { demander, dialogue };
}

export const Carte = ({ titre, children, className = "" }: { titre?: string; children: ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-slate-700/70 bg-[#0b1220] p-3 ${className}`}>
    {titre && <h3 className="mb-2 text-sm font-black text-white">{titre}</h3>}
    {children}
  </section>
);

export const Vide = ({ children }: { children: ReactNode }) => <p className="rounded-lg border border-dashed border-slate-600 p-3 text-xs text-slate-400">{children}</p>;

export const bouton = "rounded-lg border border-cyan-500/50 bg-[#0e2230] px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-[#123146] disabled:cursor-not-allowed disabled:opacity-40";
export const boutonDanger = "rounded-lg border border-red-500/60 bg-[#2a0f12] px-3 py-1.5 text-xs font-bold text-red-100 hover:bg-[#3a1418] disabled:cursor-not-allowed disabled:opacity-40";

// ───────────────────────── Toile du plan de connexions ─────────────────────────
interface Vue {
  x: number;
  y: number;
  k: number;
}
const K_MIN = 0.35;
const K_MAX = 2.4;
const borne = (k: number) => Math.max(K_MIN, Math.min(K_MAX, k));

/**
 * Ordinateur : le plan s'ajuste à la largeur disponible et la page défile à la verticale. Téléphone et tablette : le plan garde sa taille,
 * se déplace au doigt et se zoome/dézoome (pincement, molette + Ctrl, ou boutons toujours accessibles en haut à droite).
 */
export function Toile({ largeur, children }: { largeur: number; children: ReactNode }) {
  const cadre = useRef<HTMLDivElement>(null);
  const contenu = useRef<HTMLDivElement>(null);
  const [bureau, setBureau] = useState(() => (typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches : true));
  const [libre, setLibre] = useState(false);
  const [vue, setVue] = useState<Vue>({ x: 0, y: 0, k: 1 });
  const [cadreL, setCadreL] = useState(largeur);
  const [hauteur, setHauteur] = useState(400);
  const pointeurs = useRef(new Map<number, { x: number; y: number }>());
  const geste = useRef<{ debut: { x: number; y: number }; vue: Vue; distance: number; deplace: boolean; mid0: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    const f = () => setBureau(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  useLayoutEffect(() => {
    const el = cadre.current;
    const c = contenu.current;
    if (!el || !c) return;
    const o = new ResizeObserver(() => {
      setCadreL(el.clientWidth);
      setHauteur(c.scrollHeight);
    });
    o.observe(el);
    o.observe(c);
    setCadreL(el.clientWidth);
    setHauteur(c.scrollHeight);
    return () => o.disconnect();
  }, []);

  const modeBureau = bureau && !libre;
  const kBureau = Math.min(1.25, cadreL / largeur);
  const ajuster = useCallback(() => setVue({ x: 0, y: 0, k: Math.min(1, (cadre.current?.clientWidth ?? largeur) / largeur) }), [largeur]);
  useEffect(() => {
    if (!modeBureau) ajuster();
  }, [modeBureau, ajuster]);

  const zoomer = (facteur: number, cx = (cadre.current?.clientWidth ?? 0) / 2, cy = 120) =>
    setVue((v) => {
      const k = borne(v.k * facteur);
      const r = k / v.k;
      return { k, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r };
    });

  const relatif = (x: number, y: number) => {
    const r = cadre.current!.getBoundingClientRect();
    return { x: x - r.left, y: y - r.top };
  };
  const bas = (e: React.PointerEvent) => {
    if (modeBureau) return;
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeurs.current.size === 1) geste.current = { debut: { x: e.clientX, y: e.clientY }, vue, distance: 0, deplace: false, mid0: relatif(e.clientX, e.clientY) };
    if (pointeurs.current.size === 2) {
      const [a, b] = [...pointeurs.current.values()];
      geste.current = { debut: { x: a!.x, y: a!.y }, vue, distance: Math.max(1, Math.hypot(a!.x - b!.x, a!.y - b!.y)), deplace: true, mid0: relatif((a!.x + b!.x) / 2, (a!.y + b!.y) / 2) };
    }
  };
  const bouge = (e: React.PointerEvent) => {
    if (modeBureau || !pointeurs.current.has(e.pointerId) || !geste.current) return;
    pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = geste.current;
    if (pointeurs.current.size >= 2) {
      // Pincement : le point du plan qui était sous le milieu des deux doigts reste sous le milieu des deux doigts.
      const [a, b] = [...pointeurs.current.values()];
      const mid = relatif((a!.x + b!.x) / 2, (a!.y + b!.y) / 2);
      const k = borne(g.vue.k * (Math.hypot(a!.x - b!.x, a!.y - b!.y) / g.distance));
      const px = (g.mid0.x - g.vue.x) / g.vue.k;
      const py = (g.mid0.y - g.vue.y) / g.vue.k;
      setVue({ k, x: mid.x - px * k, y: mid.y - py * k });
      return;
    }
    const dx = e.clientX - g.debut.x;
    const dy = e.clientY - g.debut.y;
    if (!g.deplace && Math.hypot(dx, dy) < 8) return; // un simple appui reste un clic
    if (!g.deplace) {
      g.deplace = true;
      cadre.current?.setPointerCapture(e.pointerId);
    }
    setVue({ ...g.vue, x: g.vue.x + dx, y: g.vue.y + dy });
  };
  const haut = (e: React.PointerEvent) => {
    pointeurs.current.delete(e.pointerId);
    if (pointeurs.current.size === 0) geste.current = null;
    else if (pointeurs.current.size === 1) {
      const [p] = [...pointeurs.current.values()];
      geste.current = { debut: { x: p!.x, y: p!.y }, vue, distance: 0, deplace: true, mid0: relatif(p!.x, p!.y) };
    }
  };
  const molette = (e: React.WheelEvent) => {
    if (modeBureau || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const rect = cadre.current!.getBoundingClientRect();
    zoomer(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div className="relative" data-toile={modeBureau ? "bureau" : "tactile"} data-zoom={modeBureau ? kBureau.toFixed(2) : vue.k.toFixed(2)}>
      <div className="mb-2 flex flex-wrap items-center justify-end gap-1" role="group" aria-label="Zoom et déplacement du plan">
        {!modeBureau && (
          <>
            <button type="button" aria-label="Zoomer" onClick={() => zoomer(1.25)} className={bouton}>＋</button>
            <button type="button" aria-label="Dézoomer" onClick={() => zoomer(1 / 1.25)} className={bouton}>－</button>
            <button type="button" aria-label="Ajuster le plan" onClick={ajuster} className={bouton}>Ajuster</button>
            <span className="text-[10px] text-slate-400" data-testid="zoom">{Math.round(vue.k * 100)} %</span>
          </>
        )}
        {bureau && (
          <button type="button" onClick={() => setLibre((v) => !v)} className={bouton} aria-pressed={libre}>
            {libre ? "Revenir à l'ajustement automatique" : "Zoom libre"}
          </button>
        )}
      </div>
      <div
        ref={cadre}
        className={modeBureau ? "w-full" : "w-full overflow-hidden rounded-xl border border-slate-700/70"}
        style={modeBureau ? { height: hauteur * kBureau } : { height: "min(72vh, 900px)", touchAction: "none" }}
        onPointerDown={bas}
        onPointerMove={bouge}
        onPointerUp={haut}
        onPointerCancel={haut}
        onWheel={molette}
        data-testid="toile"
      >
        <div ref={contenu} style={{ width: largeur, transformOrigin: "0 0", transform: modeBureau ? `scale(${kBureau})` : `translate(${vue.x}px, ${vue.y}px) scale(${vue.k})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
