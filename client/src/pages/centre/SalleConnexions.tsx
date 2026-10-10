/**
 * Salle des connexions et de l'activation — le plan validé : la plateforme distante (Boutique…) à GAUCHE, la plateforme principale à DROITE,
 * les contacts rouges au CENTRE, les fils visibles et les petits moteurs, les groupes qui s'étendent vers le BAS.
 *
 * Une ligne = sept éléments : moteur réel · interrupteur local · moteur intermédiaire · CONTACT CENTRAL · moteur intermédiaire · interrupteur local · moteur réel.
 * Trois coupures indépendantes (côté distant, centre, côté principal). Rien n'est « connecté » sur la foi d'une animation ni d'un ordre :
 * un contact qui approche est dit « en cours », et il n'est fermé qu'une fois la coupure CONFIRMÉE par la sonde du moteur de vérification.
 */
import { useState, type CSSProperties } from "react";
import { trpc } from "../../lib/trpc";
import { Carte, LIBELLE_AVANCEMENT, LIBELLE_COTE, LIBELLE_DEMANDE, LIBELLE_ETAT_LIGNE, LIBELLE_OBSERVE, Pastille, Toile, Vide, bouton, boutonDanger, heure, useConfirmation, type GroupeVue, type LigneReelle, type LigneVue } from "./commun";
import { CarteConnecteur, VitrineFrontiereElectrique } from "./SallesDeclarees";

const LARGEUR_PLAN = 1010;
/** Les lignes « À venir » restent visibles (désactivées) : cinq par groupe d'emblée, les autres derrière un bouton. */
const RESERVES_VISIBLES = 5;
type Cote = "remote" | "center" | "main";
type Coupure = LigneReelle["coupures"][number];
type Visuel = { etat: "connecte" | "coupe" | "approche" | "echec" | "inconnu"; libelle: string };

/** Ce que l'on peut AFFIRMER d'une coupure : seulement son résultat observé et confirmé ; une demande en cours est « en cours ». */
export function visuelCoupure(c: Coupure | undefined): Visuel {
  if (!c) return { etat: "inconnu", libelle: "absente" };
  if (c.progress === "failed") return { etat: "echec", libelle: c.requested === "deactivate" ? "coupure non confirmée" : "échec" };
  if (c.progress === "pending" || c.progress === "in_progress") return { etat: "approche", libelle: c.requested === "deactivate" ? "coupure en cours" : "en cours (non confirmé)" };
  if (c.requested === "deactivate" && c.observed === "connected") return { etat: "echec", libelle: "coupure non confirmée" };
  if (c.observed === "connected" && c.progress === "confirmed" && c.requested === "activate") return { etat: "connecte", libelle: "connecté (confirmé)" };
  if (c.observed === "disconnected") return { etat: "coupe", libelle: "coupé" };
  return { etat: "inconnu", libelle: "jamais commandé" };
}
const COULEUR_FIL = { connecte: "#22d3ee", coupe: "#334155", approche: "#fbbf24", echec: "#ef4444", inconnu: "#334155" } as const;

/**
 * Animations du plan. Elles ne sont JAMAIS une preuve : le courant ne circule sur un fil que si la coupure est CONFIRMÉE connectée, le levier d'un
 * contact ne se ferme que sur le résultat observé, et « en cours » balance sans jamais se fermer. Désactivées si la personne demande moins de mouvement.
 */
const STYLE_ANIMATIONS = `
@keyframes centre-courant { from { background-position: 0 0 } to { background-position: 12px 0 } }
@keyframes centre-bascule { 0%,100% { transform: rotate(-34deg) } 50% { transform: rotate(-6deg) } }
@keyframes centre-halo { 0%,100% { box-shadow: 0 0 8px #ef444455 } 50% { box-shadow: 0 0 24px #ef4444 } }
@keyframes centre-alerte { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
@media (prefers-reduced-motion: reduce) { .centre-anim { animation: none !important } }
`;

function styleFil(v: Visuel): CSSProperties {
  const base: CSSProperties = { height: 4, width: "100%", borderRadius: 2 };
  if (v.etat === "connecte") return { ...base, backgroundImage: "repeating-linear-gradient(90deg,#67e8f9 0 7px,#0e7490 7px 12px)", backgroundSize: "12px 100%", boxShadow: "0 0 8px #22d3ee", animation: "centre-courant 0.7s linear infinite" };
  if (v.etat === "approche") return { ...base, backgroundImage: "repeating-linear-gradient(90deg,#fbbf24 0 5px,transparent 5px 12px)", backgroundSize: "12px 100%", animation: "centre-courant 0.35s linear infinite" };
  if (v.etat === "echec") return { ...base, background: "#ef4444", animation: "centre-alerte 1s ease-in-out infinite" };
  return { ...base, background: "#334155" };
}

/** Un fil entre deux éléments : lumineux et animé (courant) seulement si la coupure est confirmée connectée. */
function Fil({ v, largeur }: { v: Visuel; largeur: number }) {
  return (
    <div className="flex items-center" style={{ width: largeur }} aria-hidden="true" data-fil={v.etat}>
      <div className="centre-anim" style={styleFil(v)} />
    </div>
  );
}

/** Levier d'un contact : fermé (à plat) seulement quand la coupure est confirmée ; en cours il balance sans se fermer ; ouvert il est relevé. */
function Bascule({ etat, largeur }: { etat: Visuel["etat"]; largeur: number }) {
  const ferme = etat === "connecte";
  const angle = ferme ? 0 : etat === "echec" ? -14 : etat === "approche" ? -20 : -34;
  const couleur = ferme ? "#fecaca" : etat === "echec" ? "#fca5a5" : etat === "approche" ? "#fde68a" : "#94a3b8";
  const borne = ferme ? "#ef4444" : etat === "approche" ? "#fbbf24" : "#475569";
  return (
    <svg width={largeur} height={largeur * 0.55} viewBox="0 0 100 55" aria-hidden="true" data-levier={ferme ? "ferme" : etat === "approche" ? "balance" : "ouvert"}>
      <circle cx="12" cy="40" r="7" fill={borne} />
      <circle cx="88" cy="40" r="7" fill={borne} />
      <g className={etat === "approche" ? "centre-anim" : ""} style={{ transformOrigin: "12px 40px", transform: `rotate(${angle}deg)`, transition: "transform .6s ease", animation: etat === "approche" ? "centre-bascule 1.1s ease-in-out infinite" : undefined }}>
        <line x1="12" y1="40" x2="86" y2="40" stroke={couleur} strokeWidth="7" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Ce que la coupure commande VRAIMENT : une liaison réelle (étiquette rouge) ou une liaison JOUÉE par le centre (simulée). Jamais l'un pour l'autre. */
function NatureCoupure({ c }: { c: Coupure | undefined }) {
  if (!c) return null;
  const reel = c.mode === "real";
  return <span data-nature={reel ? "reel" : "simule"} className={`rounded px-1 text-[8px] font-black uppercase leading-tight ${reel ? "bg-red-900 text-red-100" : "bg-slate-800 text-slate-400"}`} title={reel ? "Cette coupure commande une liaison réelle et son état est relu sur cette liaison." : "Cette coupure est SIMULÉE : le centre joue la liaison, rien de réel n'est commandé."}>{reel ? "réel" : "simulé"}</span>;
}

type Element = LigneReelle["chaine"][number];
function Tuile({ el, onOuvrir }: { el: Element; onOuvrir: (code: string) => void }) {
  if (!el.code) {
    return (
      <div className="h-[76px] w-[150px] rounded-lg border border-dashed border-slate-600 p-1.5 text-center" title={`${el.libelle} : absent, à créer`} data-element={el.rang} data-absent="true">
        <p className="text-[9px] uppercase tracking-wide text-slate-500">{el.rang}. {el.libelle}</p>
        <p className="mt-2 text-[11px] font-bold text-slate-500">absent · à créer</p>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => onOuvrir(el.code!)} className="h-[76px] w-[150px] overflow-hidden rounded-lg border bg-[#0b1220] p-1.5 text-left hover:bg-[#13203a]" style={{ borderColor: el.sante === "down" || el.enMarche === false ? "#ef4444" : "#334155" }} title={`${el.libelle} — ${el.nom} (${el.code}) : cliquer pour l'inventaire, l'état, les tests et l'historique`} data-element={el.rang} data-code={el.code}>
      <p className="truncate text-[9px] uppercase tracking-wide text-slate-400">{el.rang}. {el.libelle}</p>
      <p className="line-clamp-2 text-[11px] font-bold leading-tight text-white">{el.nom ?? el.code}</p>
      <div className="mt-0.5">{el.etat ? <Pastille etat={el.etat} declareSeulement={el.declareSeulement} /> : <span className="text-[9px] text-cyan-300">élément du centre{el.enMarche === false ? " · ARRÊTÉ" : ""}</span>}</div>
    </button>
  );
}

/** Petit interrupteur local (côté distant ou côté principal) : affiche le résultat observé, commande la coupure correspondante. */
function Interrupteur({ el, c, intermediaire, onBasculer, onOuvrir }: { el: Element; c: Coupure | undefined; intermediaire: string; onBasculer: (c: Coupure) => void; onOuvrir: (code: string) => void }) {
  const v = visuelCoupure(c);
  const on = v.etat === "connecte";
  return (
    <div className="flex w-[64px] flex-col items-center" data-element={el.rang} data-ligne={intermediaire} data-cote={c?.side} data-etat={v.etat}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Interrupteur ${c ? LIBELLE_COTE[c.side] : ""} : ${v.libelle}`}
        disabled={!c}
        onClick={() => c && onBasculer(c)}
        className="h-7 w-12 rounded-full border p-0.5 transition disabled:opacity-40"
        style={{ borderColor: COULEUR_FIL[v.etat], background: on ? "#064e3b" : "#0f172a", boxShadow: on ? "0 0 8px #22d3ee66" : "none" }}
        title={c ? `${LIBELLE_COTE[c.side]} — demandé : ${LIBELLE_DEMANDE[c.requested]} · observé : ${LIBELLE_OBSERVE[c.observed]} · ${LIBELLE_AVANCEMENT[c.progress]}` : "absent"}
      >
        <span className={`block h-5 w-5 rounded-full transition-all ${v.etat === "approche" ? "animate-pulse" : ""}`} style={{ marginLeft: on || v.etat === "approche" ? "1.25rem" : 0, background: v.etat === "echec" ? "#ef4444" : v.etat === "approche" ? "#fbbf24" : on ? "#34d399" : "#64748b" }} />
      </button>
      <button type="button" onClick={() => el.code && onOuvrir(el.code)} className="mt-0.5 text-[9px] leading-tight text-slate-400 hover:text-cyan-200" title="Ouvrir la fiche de l'interrupteur">{c ? (c.side === "remote" ? "distant" : "principal") : "—"}</button>
      <NatureCoupure c={c} />
      <span className="text-center text-[9px] leading-tight" style={{ color: COULEUR_FIL[v.etat] }}>{v.libelle}</span>
    </div>
  );
}

/** Le contact rouge central de la ligne. Fermé (levier à plat, halo) seulement quand la coupure est confirmée ; le levier balance pendant l'exécution. */
function ContactRouge({ c, intermediaire, onBasculer, onOuvrir, code }: { c: Coupure | undefined; intermediaire: string; onBasculer: (c: Coupure) => void; onOuvrir: (code: string) => void; code: string | null }) {
  const v = visuelCoupure(c);
  const ferme = v.etat === "connecte";
  return (
    <div className="flex w-[92px] flex-col items-center" data-element="4" data-ligne={intermediaire} data-cote="center" data-etat={v.etat}>
      <button
        type="button"
        onClick={() => c && onBasculer(c)}
        disabled={!c}
        aria-label={`Contact central : ${v.libelle}`}
        aria-pressed={ferme}
        className={`centre-anim flex h-[50px] w-[84px] flex-col items-center justify-center rounded-xl border-4 text-center ${v.etat === "echec" ? "" : ""}`}
        style={{ borderColor: v.etat === "echec" ? "#fca5a5" : "#ef4444", background: ferme ? "#7f1d1d" : v.etat === "approche" ? "#451a03" : "#1f0a0a", animation: ferme ? "centre-halo 2.2s ease-in-out infinite" : v.etat === "echec" ? "centre-alerte 1s ease-in-out infinite" : undefined, boxShadow: v.etat === "approche" ? "0 0 12px #fbbf24" : undefined }}
        title={c ? `Contact central — demandé : ${LIBELLE_DEMANDE[c.requested]} · observé : ${LIBELLE_OBSERVE[c.observed]} · ${LIBELLE_AVANCEMENT[c.progress]}${c.lastCheckedAt ? ` · vérifié à ${heure(c.lastCheckedAt)}` : ""}` : "absent"}
      >
        <Bascule etat={v.etat} largeur={62} />
        <span className="-mt-0.5 text-[8px] font-black uppercase leading-none text-red-100">{ferme ? "fermé" : v.etat === "approche" ? "en cours" : v.etat === "echec" ? "alerte" : "ouvert"}</span>
      </button>
      <button type="button" onClick={() => code && onOuvrir(code)} className="mt-0.5 text-[9px] text-slate-400 hover:text-cyan-200">contact central</button>
      <NatureCoupure c={c} />
      <span className="text-center text-[9px] leading-tight" style={{ color: v.etat === "inconnu" || v.etat === "coupe" ? "#94a3b8" : COULEUR_FIL[v.etat] }}>{v.libelle}</span>
    </div>
  );
}

/** Ligne de réserve « À venir » : visible, vide et DÉSACTIVÉE — ni interrupteur actif, ni contact actif, aucun moteur, jamais comptée parmi les installés. */
function Reserve({ l }: { l: LigneVue }) {
  const gris = "#334155";
  return (
    <div className="flex items-center gap-1 rounded-lg border border-dashed border-slate-700 bg-[#0a0f1a] px-2 py-1 opacity-75" data-reserve="true" data-groupe={l.groupe} data-position={l.position} aria-disabled="true" aria-label="Ligne de réserve À venir : vide et désactivée, aucune commande possible">
      <span className="w-12 shrink-0 text-[9px] font-black uppercase leading-tight text-slate-500">À venir</span>
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="flex items-center">
          {i === 1 || i === 5 ? (
            <span className="flex h-6 w-[64px] items-center justify-center" aria-hidden="true"><span className="relative block h-3.5 w-8 rounded-full border border-slate-700 bg-[#0f172a]"><span className="absolute left-0.5 top-0.5 block h-2 w-2 rounded-full bg-slate-600" /></span></span>
          ) : i === 3 ? (
            <span className="flex h-6 w-[84px] items-center justify-center" aria-hidden="true"><span className="flex h-6 w-14 items-center justify-center rounded-lg border-2 border-red-900/60 bg-[#12090a]"><span className="text-[8px] font-black uppercase text-red-900">ouvert</span></span></span>
          ) : (
            <span className="inline-block h-6 w-[96px] rounded border border-dashed border-slate-700" aria-hidden="true" />
          )}
          {i < 6 && <span className="h-[3px] w-3 rounded" style={{ background: gris }} aria-hidden="true" />}
        </span>
      ))}
      <span className="ml-auto shrink-0 text-[9px] leading-tight text-slate-500">vide · désactivée<br />non installée</span>
    </div>
  );
}

export default function SalleConnexions({ onOuvrirMoteur, onMessage }: { onOuvrirMoteur: (code: string) => void; onMessage: (m: string) => void }) {
  const utils = trpc.useUtils();
  const lignes = trpc.frontierOs.lignes.useQuery(undefined, { refetchInterval: 8000 });
  const groupes = trpc.frontierOs.groupes.useQuery(undefined, { refetchInterval: 8000 });
  const accueil = trpc.frontierOs.accueil.useQuery(undefined, { refetchInterval: 20000 });
  const { demander, dialogue } = useConfirmation();
  const [resultat, setResultat] = useState<{ titre: string; r: ResultatAffiche } | null>(null);
  const [reservesOuvertes, setReservesOuvertes] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<number | null>(null);

  const rafraichir = async () => {
    await Promise.all([utils.frontierOs.lignes.invalidate(), utils.frontierOs.groupes.invalidate(), utils.frontierOs.accueil.invalidate(), utils.frontierOs.commandes.invalidate(), utils.frontierOs.audit.invalidate(), utils.frontierOs.incidents.invalidate(), utils.frontierOs.echanges.invalidate(), utils.frontierOs.mesures.invalidate()]);
  };
  const apres = (titre: string) => async (r: ResultatAffiche & { detail: string }) => {
    setResultat({ titre, r });
    onMessage(r.detail);
    await rafraichir();
  };
  const erreur = (e: { message: string }) => onMessage(e.message);
  const coupure = trpc.frontierOs.coupure.useMutation({ onSuccess: apres("Coupure"), onError: erreur });
  const ligne = trpc.frontierOs.ligne.useMutation({ onSuccess: apres("Ligne"), onError: erreur });
  const groupe = trpc.frontierOs.groupe.useMutation({ onSuccess: apres("Grand contact du groupe"), onError: erreur });
  const general = trpc.frontierOs.general.useMutation({ onSuccess: apres("Interrupteur général"), onError: erreur });
  const verrou = trpc.frontierOs.verrouiller.useMutation({ onSuccess: async (r) => { onMessage(r.detail); await rafraichir(); }, onError: erreur });
  const deverrou = trpc.frontierOs.deverrouiller.useMutation({ onSuccess: async (r) => { onMessage(r.detail); await rafraichir(); }, onError: erreur });
  const protocole = trpc.frontierOs.protocole.useMutation({
    onSuccess: async (r) => {
      onMessage(`Protocole ${r.protocole} : ${r.etapes.filter((e) => e.ok).length}/${r.etapes.length} étapes réussies — ${r.ok ? "RÉUSSI" : "ÉCHEC"}.`);
      setResultat({ titre: `Protocole de test (${r.protocole})`, r: { ok: r.ok, statut: r.ok ? "confirmed" : "failed", detail: r.etapes.map((e) => `${e.ok ? "✔" : "✘"} ${e.nom} → ${e.observe}`).join("\n"), enfants: [], ecartees: [] } });
      await rafraichir();
      await utils.frontierOs.sessions.invalidate();
    },
    onError: erreur,
  });
  const essai = trpc.frontierOs.echangeEssai.useMutation({ onSuccess: async (r) => { onMessage(r.livre ? `Échange d'essai LIVRÉ (n° ${r.echangeId}).` : `Échange d'essai REFUSÉ par le transport : ${r.refus?.raison ?? r.etat}${r.refus?.coupure ? ` (coupure ${r.refus.coupure})` : ""}.`); await rafraichir(); }, onError: erreur });

  const basculer = (l: LigneReelle, c: Coupure) => {
    const v = visuelCoupure(c);
    if (v.etat === "connecte" || (c.requested === "activate" && v.etat === "approche")) coupure.mutate({ coupureId: c.id, voulu: "deactivate", confirme: false });
    else demander({ titre: `Activer la coupure « ${LIBELLE_COTE[c.side]} » de « ${l.label} »`, detail: "Simulation : le contact ne sera dit connecté qu'une fois confirmé par la sonde du moteur de vérification.", executer: () => coupure.mutate({ coupureId: c.id, voulu: "activate", confirme: true }) });
  };

  const parGroupe = (g: GroupeVue) => (lignes.data ?? []).filter((l) => l.groupe === g.code);
  const attente = coupure.isPending || ligne.isPending || groupe.isPending || general.isPending || protocole.isPending;

  return (
    <section aria-label="Salle des connexions et de l'activation" className="space-y-3">
      <Carte>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <h2 className="text-base font-black text-white">Interrupteur général</h2>
            <p className="text-[11px] text-slate-400">Demande l'activation de toutes les lignes ADMISSIBLES — jamais une ligne verrouillée, en erreur, vide ou non validée — ou coupe tout. Chaque ligne rend son résultat.</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" disabled={attente} className={bouton} onClick={() => demander({ titre: "Interrupteur général : activer toutes les lignes admissibles", detail: "Simulation : chaque ligne admissible est activée sur ses trois coupures et confirmée ; les autres sont écartées avec leur raison.", executer: () => general.mutate({ voulu: "activate", confirme: true }) })}>Activer tout</button>
            <button type="button" disabled={attente} className={boutonDanger} onClick={() => demander({ titre: "Interrupteur général : couper toutes les lignes", detail: "Toutes les lignes réelles sont coupées (le centre d'abord, puis les deux côtés).", executer: () => general.mutate({ voulu: "deactivate", confirme: true }) })}>Couper tout</button>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Légende : <b className="text-cyan-300">fil lumineux</b> = coupure confirmée connectée · <b className="text-amber-300">fil pointillé</b> = commande en cours, rien ne passe encore · <b className="text-red-300">rouge</b> = échec ou coupure non confirmée · gris = coupé ou jamais commandé.
          Mode : <b>{accueil.data?.mode === "simulation" ? "SIMULATION" : accueil.data?.mode}</b>.
        </p>
      </Carte>
      {dialogue}
      {resultat && <PanneauResultat titre={resultat.titre} r={resultat.r} onFermer={() => setResultat(null)} />}
      {lignes.isLoading && <p className="text-sm text-slate-300">Lecture des lignes…</p>}
      {lignes.error && <p className="text-sm text-red-300">{lignes.error.message}</p>}

      <style>{STYLE_ANIMATIONS}</style>
      <VitrineFrontiereElectrique onOuvrirMoteur={onOuvrirMoteur} />
      <Toile largeur={LARGEUR_PLAN}>
        <div className="space-y-6 p-2" data-plan="connexions">
          <div className="grid items-end text-center" style={{ gridTemplateColumns: "1fr 120px 1fr" }}>
            <p className="text-sm font-black uppercase tracking-wider text-cyan-200">◀ Plateformes distantes (Boutique, Map…)</p>
            <p className="text-sm font-black uppercase tracking-wider text-red-300">Centre</p>
            <p className="text-sm font-black uppercase tracking-wider text-cyan-200">Plateforme principale ▶</p>
          </div>
          {(groupes.data ?? []).map((g) => {
            const gl = parGroupe(g);
            const reelles = gl.filter((l): l is LigneReelle => l.kind === "real");
            const reserves = gl.filter((l) => l.kind === "reserve");
            const ouvert = reservesOuvertes[g.code] ?? false;
            return (
              <div key={g.code} className="rounded-xl border border-slate-700/80 bg-[#0a101b] p-3" data-groupe={g.code}>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <GrandContact g={g} attente={attente} onActiver={() => demander({ titre: `Grand contact rouge « ${g.name} » : fermer les contacts centraux`, detail: "Commande le contact CENTRAL de chaque ligne admissible du groupe (jamais les petits interrupteurs locaux). Simulation.", executer: () => groupe.mutate({ groupe: g.code, voulu: "activate", confirme: true }) })} onCouper={() => demander({ titre: `Grand contact rouge « ${g.name} » : ouvrir les contacts centraux`, detail: "Ouvre le contact central de chaque ligne du groupe.", executer: () => groupe.mutate({ groupe: g.code, voulu: "deactivate", confirme: true }) })} />
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white">{g.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      {g.reelles} ligne(s) réelle(s), dont {g.valides} validée(s) · {g.reserves} réserve(s) « À venir » (au moins {g.reservesAttendues} attendues)
                      {g.plateforme ? ` · ${g.plateforme.name}` : ""}
                      {g.plateforme && g.plateforme.identityStatus === "to_verify" ? " · identité À VÉRIFIER" : ""}
                    </p>
                  </div>
                  {reserves.length > RESERVES_VISIBLES && (
                    <button type="button" className={`${bouton} ml-auto`} onClick={() => setReservesOuvertes((s) => ({ ...s, [g.code]: !ouvert }))} aria-expanded={ouvert}>
                      {ouvert ? `Replier : n'afficher que ${RESERVES_VISIBLES} lignes « À venir »` : `Voir les ${reserves.length - RESERVES_VISIBLES} autres lignes « À venir »`}
                    </button>
                  )}
                </div>
                {reelles.length === 0 && <Vide>Aucune ligne réelle dans ce groupe : aucun moteur n'est encore inventorié ni installé. Les lignes « À venir » attendent le premier.</Vide>}
                <div className="space-y-3">
                  {reelles.map((l) => {
                    const cR = l.coupures.find((c) => c.side === "remote");
                    const cC = l.coupures.find((c) => c.side === "center");
                    const cM = l.coupures.find((c) => c.side === "main");
                    const vR = visuelCoupure(cR);
                    const vC = visuelCoupure(cC);
                    const vM = visuelCoupure(cM);
                    const [e1, e2, e3, e4, e5, e6, e7] = l.chaine;
                    return (
                      <article key={l.id} className="rounded-lg border border-slate-800 bg-[#0b1220] p-2" data-ligne={l.intermediaire} data-etat-ligne={l.etat} data-validite={l.validity}>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-black text-white">{l.label}</h4>
                          <span className={`rounded px-1.5 text-[10px] font-bold ${l.validity === "valid" ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"}`}>{l.validity === "valid" ? "ligne validée" : "non valide"}</span>
                          <span className="rounded bg-slate-800 px-1.5 text-[10px] text-slate-200" data-testid="etat-ligne">{LIBELLE_ETAT_LIGNE[l.etat]}</span>
                          {(() => {
                            const reels = l.coupures.filter((x) => x.mode === "real").length;
                            return <span className={`rounded px-1.5 text-[10px] font-bold ${reels === 0 ? "bg-slate-800 text-slate-300" : "bg-red-950 text-red-200"}`} data-testid="regime-ligne" data-regime={reels === 0 ? "simulation" : reels === l.coupures.length ? "reel" : "mixte"}>{reels === 0 ? "simulation" : reels === l.coupures.length ? "RÉEL" : "MIXTE"}</span>;
                          })()}
                          {l.locked && <span className="rounded bg-amber-950 px-1.5 text-[10px] font-bold text-amber-300">verrouillée</span>}
                          <span className={`rounded px-1.5 text-[10px] ${l.passage.autorise ? "bg-cyan-950 text-cyan-200" : "bg-slate-800 text-slate-300"}`} title={"detail" in l.passage ? String((l.passage as { detail?: string }).detail ?? "") : ""}>
                            {l.passage.autorise ? "les échanges PASSENT" : `rien ne passe${"coupure" in l.passage && l.passage.coupure ? ` (${LIBELLE_COTE[l.passage.coupure]})` : ""}`}
                          </span>
                        </div>
                        <div className="flex items-center" style={{ width: LARGEUR_PLAN - 40 }}>
                          <Tuile el={e1!} onOuvrir={onOuvrirMoteur} />
                          <Fil v={vR} largeur={22} />
                          <Interrupteur el={e2!} c={cR} intermediaire={l.intermediaire ?? ""} onBasculer={(c) => basculer(l, c)} onOuvrir={onOuvrirMoteur} />
                          <Fil v={vR} largeur={22} />
                          <Tuile el={e3!} onOuvrir={onOuvrirMoteur} />
                          <Fil v={vC} largeur={26} />
                          <ContactRouge c={cC} intermediaire={l.intermediaire ?? ""} code={e4!.code} onBasculer={(c) => basculer(l, c)} onOuvrir={onOuvrirMoteur} />
                          <Fil v={vC} largeur={26} />
                          <Tuile el={e5!} onOuvrir={onOuvrirMoteur} />
                          <Fil v={vM} largeur={22} />
                          <Interrupteur el={e6!} c={cM} intermediaire={l.intermediaire ?? ""} onBasculer={(c) => basculer(l, c)} onOuvrir={onOuvrirMoteur} />
                          <Fil v={vM} largeur={22} />
                          <Tuile el={e7!} onOuvrir={onOuvrirMoteur} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <button type="button" disabled={attente || l.validity !== "valid"} className={bouton} onClick={() => demander({ titre: `Activer la ligne « ${l.label} »`, detail: "Les deux côtés locaux d'abord, le contact central en dernier ; chaque coupure doit être confirmée, sinon ce qui a été établi est défait.", executer: () => ligne.mutate({ ligneId: l.id, voulu: "activate", confirme: true }) })}>Activer la ligne</button>
                          <button type="button" disabled={attente} className={boutonDanger} onClick={() => ligne.mutate({ ligneId: l.id, voulu: "deactivate", confirme: false })}>Couper la ligne</button>
                          <button type="button" disabled={attente} className={bouton} onClick={() => essai.mutate({ ligneId: l.id })}>Échange d'essai</button>
                          <button type="button" disabled={attente || l.validity !== "valid"} className={bouton} onClick={() => protocole.mutate({ ligneId: l.id, type: "coupures" })}>Protocole des 9 étapes</button>
                          <button type="button" disabled={attente || l.validity !== "valid"} className={bouton} onClick={() => protocole.mutate({ ligneId: l.id, type: "pannes" })}>Essais de panne</button>
                          {l.locked ? (
                            <button type="button" className={bouton} onClick={() => demander({ titre: `Déverrouiller « ${l.label} »`, detail: "Le déverrouillage ne rebranche rien.", executer: () => deverrou.mutate({ ligneId: l.id, confirme: true }) })}>Déverrouiller</button>
                          ) : (
                            <button type="button" className={bouton} onClick={() => demander({ titre: `Verrouiller « ${l.label} »`, detail: "La ligne est d'abord coupée, puis verrouillée : plus aucune activation ni aucun passage.", executer: () => verrou.mutate({ ligneId: l.id, confirme: true }) })}>Verrouiller</button>
                          )}
                          <button type="button" className={`${bouton} ml-auto`} aria-expanded={detail === l.id} onClick={() => setDetail(detail === l.id ? null : l.id)}>{detail === l.id ? "Masquer" : "Détails"}</button>
                        </div>
                        {l.validity !== "valid" && (
                          <ul className="mt-1 list-disc pl-5 text-[11px] text-amber-200" data-testid="raisons">{l.invalidReasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                        )}
                        {detail === l.id && <DetailLigne l={l} />}
                      </article>
                    );
                  })}
                </div>
                {reserves.length > 0 && (
                  <div className="mt-3 space-y-1" data-testid={`reserves-${g.code}`}>
                    {(ouvert ? reserves : reserves.slice(0, RESERVES_VISIBLES)).map((r) => <Reserve key={r.id} l={r} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Toile>
      <CarteConnecteur set="connecteur-b" onOuvrirMoteur={onOuvrirMoteur} />
    </section>
  );
}

type ResultatAffiche = {
  ok: boolean;
  statut: string;
  code?: string;
  detail: string;
  enfants?: ResultatAffiche[];
  ecartees?: { ligneId: number; label: string; raison: string; detail: string }[];
};

function PanneauResultat({ titre, r, onFermer }: { titre: string; r: ResultatAffiche; onFermer: () => void }) {
  return (
    <div role="status" className={`rounded-xl border-2 p-3 ${r.ok ? "border-emerald-500/60 bg-emerald-950/30" : r.statut === "partial" ? "border-amber-500/70 bg-amber-950/30" : "border-red-500/60 bg-red-950/30"}`} data-testid="resultat-commande" data-statut={r.statut}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-black text-white">{titre} — {r.statut === "confirmed" ? "CONFIRMÉ" : r.statut === "partial" ? "DÉFAILLANCE PARTIELLE" : r.statut === "blocked" ? "BLOQUÉ" : "ÉCHEC"}{r.code ? ` (${r.code})` : ""}</p>
        <button type="button" onClick={onFermer} className="text-xs text-slate-300 underline">Fermer</button>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-xs text-slate-100">{r.detail}</p>
      {r.enfants && r.enfants.length > 0 && (
        <ul className="mt-1 text-[11px] text-slate-200">{r.enfants.map((e, i) => <li key={i}>• {e.statut === "confirmed" ? "✔" : "✘"} {e.statut}{e.code ? ` (${e.code})` : ""} — {e.detail}</li>)}</ul>
      )}
      {r.ecartees && r.ecartees.length > 0 && (
        <div className="mt-1 text-[11px] text-amber-200">
          <p className="font-bold">Lignes écartées (jamais contournées) :</p>
          <ul>{r.ecartees.map((e) => <li key={e.ligneId}>• {e.label} — {e.raison} : {e.detail}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function GrandContact({ g, attente, onActiver, onCouper }: { g: GroupeVue; attente: boolean; onActiver: () => void; onCouper: () => void }) {
  const ferme = g.contact === "connected";
  const partiel = g.contact === "partial";
  const libelle = g.contact === "connected" ? "contacts centraux fermés" : g.contact === "disconnected" ? "contacts centraux ouverts" : g.contact === "partial" ? "PARTIEL" : "jamais commandé";
  const etat: Visuel["etat"] = ferme ? "connecte" : partiel ? "approche" : "coupe";
  return (
    <div className="flex items-center gap-2" data-grand-contact={g.code} data-contact={g.contact}>
      <div
        className="centre-anim flex h-16 w-[104px] flex-col items-center justify-center rounded-2xl border-4 border-red-500 text-center"
        style={{ background: ferme ? "#7f1d1d" : "#1f0a0a", animation: ferme ? "centre-halo 2.2s ease-in-out infinite" : undefined, boxShadow: partiel ? "0 0 12px #fbbf24" : undefined }}
        title={`Grand contact rouge du groupe « ${g.name} » : ${libelle}`}
        data-testid={`grand-contact-${g.code}`}
      >
        <Bascule etat={etat} largeur={74} />
        <span className="-mt-0.5 text-[8px] font-black uppercase leading-none text-red-100">grand contact</span>
      </div>
      <div className="flex flex-col gap-1">
        <button type="button" disabled={attente || g.valides === 0} className={bouton} onClick={onActiver}>Fermer les contacts</button>
        <button type="button" disabled={attente || g.reelles === 0} className={boutonDanger} onClick={onCouper}>Ouvrir les contacts</button>
      </div>
      <span className="max-w-[120px] text-[10px] leading-tight text-slate-300">{libelle}</span>
    </div>
  );
}

function DetailLigne({ l }: { l: LigneReelle }) {
  const echanges = Object.entries(l.echanges);
  return (
    <div className="mt-2 rounded-lg border border-slate-700 bg-[#070b12] p-2 text-[11px] text-slate-200" data-testid="detail-ligne">
      <table className="w-full text-left"><thead className="text-slate-400"><tr><th>Coupure</th><th>Demandé</th><th>Observé</th><th>Avancement</th><th>Mode</th><th>Dernière vérification</th><th>Preuve</th></tr></thead><tbody>
        {l.coupures.map((c) => (
          <tr key={c.id} data-detail-cote={c.side}>
            <td>{LIBELLE_COTE[c.side]}</td><td>{LIBELLE_DEMANDE[c.requested]}</td><td>{LIBELLE_OBSERVE[c.observed]}</td><td>{LIBELLE_AVANCEMENT[c.progress]}{c.error ? ` — ${c.error}` : ""}</td><td>{c.mode === "simulation" ? "simulation" : "réel"}</td><td>{heure(c.lastCheckedAt)}</td><td>{c.lastProof ?? "—"}</td>
          </tr>
        ))}
      </tbody></table>
      <p className="mt-1">Décision de passage : <b>{l.passage.autorise ? "autorisé" : `refusé — ${"raison" in l.passage ? l.passage.raison : ""}`}</b> · Admissible à l'activation générale : <b>{l.admissible.ok ? "oui" : `non — ${l.admissible.detail}`}</b></p>
      <p>Échanges : {echanges.length === 0 ? "aucun" : echanges.map(([e, n]) => `${e} ${n}`).join(" · ")}</p>
    </div>
  );
}
