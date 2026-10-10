/**
 * Centre Cyber-Électrique — les sept nouvelles salles déclarées (migration 0005) : Travail/Dialogue/Contrôle (avec Cyberdéfense et
 * Cyberattaques strictement inertes), Contrôle centrale, Surveillance externe, Salle complète des moteurs, Outils de travail, Salle de
 * réunion (future), Connecteur A. Tout est préparé, rien n'est actif par défaut. « Vitrine électrique » : un interrupteur coupé affiche un
 * fil coupé, une connexion non confirmée n'est jamais montrée connectée.
 */
import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { AlarmeBadge, Carte, Pastille, Vide, bouton, date } from "./commun";

type Moteur = { code: string; name: string; fonction: string; etat: string | null; roomCode: string | null; connectorSet: string | null; manualSwitch: boolean; enMarche: boolean; sante: string };

export function ListeMoteursDeclares({ moteurs, onOuvrirMoteur }: { moteurs: readonly Moteur[]; onOuvrirMoteur: (c: string) => void }) {
  if (moteurs.length === 0) return <Vide>Aucun moteur déclaré ici.</Vide>;
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {moteurs.map((m) => (
        <button key={m.code} type="button" onClick={() => onOuvrirMoteur(m.code)} className="rounded-lg border border-slate-700 bg-[#0b1220] p-2 text-left hover:bg-[#13203a]" data-moteur-declare={m.code}>
          <p className="text-xs font-black text-white">{m.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Pastille etat={m.etat} />
            {m.manualSwitch && <span className="rounded-full border border-amber-400/60 px-1.5 py-px text-[9px] font-bold text-amber-200" title="Cet emplacement a un interrupteur manuel — coupé par défaut, un fil coupé n'affiche jamais une connexion.">interrupteur</span>}
            <span className={`rounded-full border px-1.5 py-px text-[9px] font-bold ${m.enMarche ? "border-cyan-400/60 text-cyan-200" : "border-slate-600 text-slate-400"}`}>{m.enMarche ? "en marche" : "arrêté"}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{m.fonction}</p>
        </button>
      ))}
    </div>
  );
}

// ───────────────────────── Salle 1 — Travail, dialogue et contrôle ─────────────────────────
const ONGLETS_SALLE1 = [
  { cle: "chat", libelle: "Chat", prefixe: "centre:declare.chat." },
  { cle: "controle", libelle: "Contrôle", prefixe: "centre:declare.controle." },
  { cle: "travail", libelle: "Travail", prefixe: "centre:declare.travail." },
  { cle: "cyberdefense", libelle: "Cyberdéfense (inactif)", prefixe: "centre:declare.cyberdefense." },
  { cle: "cyberattaques", libelle: "Cyberattaques (inactif)", prefixe: "centre:declare.cyberattaques." },
] as const;

export function SalleTravailDialogueControle({ onOuvrirMoteur }: { onOuvrirMoteur: (c: string) => void }) {
  const [onglet, setOnglet] = useState<(typeof ONGLETS_SALLE1)[number]["cle"]>("chat");
  const s = trpc.frontierOs.salleDeclaree.useQuery({ roomCode: "travail-dialogue-controle" }, { refetchInterval: 20000 });
  const def = ONGLETS_SALLE1.find((o) => o.cle === onglet)!;
  const moteurs = (s.data?.moteurs ?? []).filter((m) => m.code.startsWith(def.prefixe));
  const inerte = onglet === "cyberdefense" || onglet === "cyberattaques";
  return (
    <section aria-label="Travail, dialogue et contrôle" className="space-y-3">
      <Carte>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black text-white">Salle 1 — Travail, dialogue et contrôle</h2>
          <AlarmeBadge alarme={s.data?.alarme} />
        </div>
        <p className="text-xs text-slate-300">Chat, Contrôle et Travail sont des emplacements préparés pour le dialogue et le pilotage du Centre. Cyberdéfense et Cyberattaques sont de simples PLACEMENTS : aucun mécanisme réel, aucun interrupteur — rien n'y est armé, rien ne peut l'être depuis cette salle.</p>
        <div role="tablist" aria-label="Onglets de la salle" className="mt-2 flex flex-wrap gap-2">
          {ONGLETS_SALLE1.map((o) => <button key={o.cle} role="tab" aria-selected={onglet === o.cle} type="button" onClick={() => setOnglet(o.cle)} className={`${bouton} ${onglet === o.cle ? "ring-2 ring-cyan-400" : ""}`}>{o.libelle}</button>)}
        </div>
      </Carte>
      {inerte && (
        <Carte className="border-red-500/30 bg-red-950/10">
          <p className="text-xs font-bold text-red-200">Onglet strictement inerte : ni surveillance réelle, ni essai réel, ni mécanisme d'interrupteur. Chaque emplacement ci-dessous le rappelle dans sa propre description.</p>
        </Carte>
      )}
      <Carte titre={`${def.libelle} (${moteurs.length} emplacement(s))`}>
        <ListeMoteursDeclares moteurs={moteurs} onOuvrirMoteur={onOuvrirMoteur} />
      </Carte>
    </section>
  );
}

// ───────────────────────── Salle 2 — Contrôle centrale ─────────────────────────
export function SalleControleCentrale({ onMessage }: { onMessage: (m: string) => void }) {
  const c = trpc.frontierOs.controleCentrale.useQuery(undefined, { refetchInterval: 15000 });
  const d = c.data;
  if (c.isLoading) return <p className="text-sm">Lecture…</p>;
  if (c.error) return <p role="alert" className="text-sm text-red-300">{c.error.message}</p>;
  if (!d) return null;
  return (
    <section aria-label="Contrôle centrale" className="space-y-3">
      <Carte>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black text-white">Salle 2 — Contrôle centrale</h2>
          <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${d.etatGeneral === "normal" ? "border-emerald-400/60 text-emerald-300" : "border-red-400/60 text-red-300"}`}>{d.etatGeneral === "normal" ? "État général : normal" : "État général : alerte"}</span>
        </div>
        <p className="text-xs text-slate-300">Vue globale mesurée du Centre — jamais une estimation. Dernier relevé : {date(d.horodatage)}.</p>
      </Carte>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Carte titre="Moteurs"><p className="text-xs text-slate-200">En marche : <b className="text-cyan-200">{d.moteursActifs}</b> · arrêtés : <b>{d.moteursArretes}</b></p></Carte>
        <Carte titre="Erreurs et alertes"><p className="text-xs text-slate-200">Moteurs en erreur/bloqués : <b className={d.erreurs ? "text-red-300" : ""}>{d.erreurs}</b> · incidents critiques : <b className={d.alertes ? "text-red-300" : ""}>{d.alertes}</b></p></Carte>
        <Carte titre="Incidents"><p className="text-xs text-slate-200">Incidents ouverts (toutes gravités) : <b>{d.incidentsOuverts}</b></p></Carte>
        <Carte titre="Salles"><p className="text-xs text-slate-200">Salles du Centre : <b>{d.nbSalles}</b></p></Carte>
      </div>
      <Carte titre="Connecteurs préparés (aucun connecté)">
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th>Ensemble</th><th>Moteurs</th><th>Alarme</th></tr></thead><tbody>
          {d.connecteurs.map((x) => <tr key={x.set} className="border-t border-slate-800"><td className="py-1 text-white">{x.set}</td><td>{x.total}</td><td><AlarmeBadge alarme={x.alarme} /></td></tr>)}
        </tbody></table></div>
      </Carte>
      <CarteIdentiteCentre onMessage={onMessage} />
    </section>
  );
}

// ───────────────────────── Salle 3 — Surveillance externe ─────────────────────────
export function SalleSurveillance({ onOuvrirMoteur }: { onOuvrirMoteur: (c: string) => void }) {
  const s = trpc.frontierOs.surveillance.useQuery(undefined, { refetchInterval: 20000 });
  const d = s.data;
  if (s.isLoading) return <p className="text-sm">Lecture…</p>;
  if (!d) return null;
  return (
    <section aria-label="Surveillance externe" className="space-y-3">
      <Carte>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black text-white">Salle 3 — Surveillance externe</h2>
          <AlarmeBadge alarme={d.alarme} />
        </div>
        <p className="text-xs text-slate-300">Observable seulement : ce qui n'est pas réellement mesuré n'est jamais affiché comme une suspicion. « Rien d'observable » est une réponse valide.</p>
        <p className="mt-1 text-[11px] text-amber-200">{d.note}</p>
      </Carte>
      <div className="grid gap-3 md:grid-cols-3">
        <Carte titre="Accès observés"><p className="text-lg font-black text-white">{d.accesObserves}</p></Carte>
        <Carte titre="Scans détectés"><p className="text-lg font-black text-white">{d.scansDetectes}</p></Carte>
        <Carte titre="Anomalies"><p className="text-lg font-black text-white">{d.anomalies}</p></Carte>
      </div>
      <Carte titre={`Emplacements de surveillance (${d.moteurs.length})`}>
        <ListeMoteursDeclares moteurs={d.moteurs} onOuvrirMoteur={onOuvrirMoteur} />
      </Carte>
    </section>
  );
}

// ───────────────────────── Salle 4 — Salle complète des moteurs ─────────────────────────
export function SalleMoteursComplets({ onOuvrirMoteur }: { onOuvrirMoteur: (c: string) => void }) {
  const s = trpc.frontierOs.salleDeclaree.useQuery({ roomCode: "moteurs-complets" }, { refetchInterval: 20000 });
  const tous = trpc.frontierOs.moteursDeclares.useQuery(undefined, { refetchInterval: 30000 });
  const d = s.data;
  return (
    <section aria-label="Salle complète des moteurs" className="space-y-3">
      <Carte>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black text-white">Salle 4 — Salle complète des moteurs</h2>
          <AlarmeBadge alarme={d?.alarme} />
        </div>
        <p className="text-xs text-slate-300">Tous les moteurs déclarés du Centre ({tous.data?.length ?? 0}) : état, mémoire, réparation et extension restent des propositions préparées, jamais appliquées automatiquement. Température logique : non mesurée (aucune source de mesure n'existe pour un moteur déclaré).</p>
      </Carte>
      <Carte titre={`Diagnostic, mémoire, capacité — emplacements méta (${d?.moteurs.length ?? 0})`}>
        <ListeMoteursDeclares moteurs={d?.moteurs ?? []} onOuvrirMoteur={onOuvrirMoteur} />
      </Carte>
      <Carte titre={`Registre complet des moteurs déclarés (${tous.data?.length ?? 0})`}>
        <div className="max-h-[420px] overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[#0b1220] text-slate-400"><tr><th>Moteur</th><th>Salle</th><th>Ensemble</th><th>État</th></tr></thead><tbody>
          {(tous.data ?? []).map((m) => (
            <tr key={m.code} className="cursor-pointer border-t border-slate-800 hover:bg-[#13203a]" onClick={() => onOuvrirMoteur(m.code)}>
              <td className="py-0.5"><span className="font-bold text-white">{m.name}</span> <span className="text-slate-500">{m.code}</span></td>
              <td className="text-slate-300">{m.roomCode ?? "—"}</td>
              <td className="text-slate-300">{m.connectorSet ?? "—"}</td>
              <td><Pastille etat={m.etat} /></td>
            </tr>
          ))}
        </tbody></table></div>
      </Carte>
    </section>
  );
}

// ───────────────────────── Salle 5 — Outils de travail ─────────────────────────
export function SalleOutils({ onOuvrirMoteur }: { onOuvrirMoteur: (c: string) => void }) {
  const s = trpc.frontierOs.salleDeclaree.useQuery({ roomCode: "outils-travail" }, { refetchInterval: 20000 });
  const d = s.data;
  return (
    <section aria-label="Outils de travail" className="space-y-3">
      <Carte>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black text-white">Salle 5 — Outils de travail</h2>
          <AlarmeBadge alarme={d?.alarme} />
        </div>
        <p className="text-xs text-slate-300">Emplacements extensibles pour de futurs outils de réparation, audit, lecture, comparaison, documentation — aucun outil n'est encore branché. De nouveaux emplacements peuvent s'ajouter sans limite fixe.</p>
      </Carte>
      <Carte titre={`Emplacements (${d?.moteurs.length ?? 0})`}>
        <ListeMoteursDeclares moteurs={d?.moteurs ?? []} onOuvrirMoteur={onOuvrirMoteur} />
      </Carte>
    </section>
  );
}

// ───────────────────────── Salle de réunion (future) ─────────────────────────
export function SalleReunion({ onOuvrirMoteur }: { onOuvrirMoteur: (c: string) => void }) {
  const s = trpc.frontierOs.salleDeclaree.useQuery({ roomCode: "salle-reunion" }, { refetchInterval: 20000 });
  const d = s.data;
  return (
    <section aria-label="Salle de réunion" className="space-y-3">
      <Carte>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black text-white">Salle de réunion (future)</h2>
          <AlarmeBadge alarme={d?.alarme} />
        </div>
        <p className="text-xs text-slate-300">Écrans multiples, espace de réunion, appel vidéo et diffusion futurs — aucun service externe n'est actif aujourd'hui.</p>
      </Carte>
      <Carte titre={`Emplacements (${d?.moteurs.length ?? 0})`}>
        <ListeMoteursDeclares moteurs={d?.moteurs ?? []} onOuvrirMoteur={onOuvrirMoteur} />
      </Carte>
    </section>
  );
}

// ───────────────────────── Connecteur A — grand connecteur principal d'intervention ─────────────────────────
export function SalleConnecteurA({ onOuvrirMoteur }: { onOuvrirMoteur: (c: string) => void }) {
  const c = trpc.frontierOs.connecteur.useQuery({ set: "connecteur-a" }, { refetchInterval: 20000 });
  const d = c.data;
  if (c.isLoading) return <p className="text-sm">Lecture…</p>;
  if (!d) return null;
  return (
    <section aria-label="Connecteur A" className="space-y-3">
      <Carte>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-black text-white">{d.libelle}</h2>
          <AlarmeBadge alarme={d.alarme} />
        </div>
        <p className="text-xs text-slate-300">Futures capacités : lire l'état complet de la plateforme, optimiser images/pages, aider au développement, intervenir sur des modules, assister l'IA, diagnostiquer/réparer. <b className="text-amber-200">Non connecté aujourd'hui</b> : préparé et visible, jamais branché sans que le PDG actionne lui-même l'interrupteur principal.</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${d.pourcentage}%` }} /></div>
          <span className="text-xs font-bold text-cyan-200">{d.pourcentage}%</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">{d.note}</p>
      </Carte>
      <Carte titre={`Manques visibles (${d.manquants.length}/${d.total})`}>
        {d.manquants.length === 0 ? <Vide>Aucun manque.</Vide> : <ul className="text-xs text-slate-300">{d.manquants.map((m) => <li key={m}>{m}</li>)}</ul>}
      </Carte>
      <Carte titre={`Moteurs du Connecteur A (${d.total})`}>
        <ListeMoteursDeclares moteurs={d.moteurs} onOuvrirMoteur={onOuvrirMoteur} />
      </Carte>
    </section>
  );
}

// ───────────────────────── Carte réutilisable d'un ensemble de connecteur (Connecteur B, connecteurs MKAPMS Shop) ─────────────────────────
export function CarteConnecteur({ set, onOuvrirMoteur }: { set: string; onOuvrirMoteur: (c: string) => void }) {
  const c = trpc.frontierOs.connecteur.useQuery({ set }, { refetchInterval: 20000 });
  const d = c.data;
  if (c.isLoading) return <p className="text-xs text-slate-400">Lecture du connecteur…</p>;
  if (!d) return null;
  return (
    <Carte titre={d.libelle}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AlarmeBadge alarme={d.alarme} />
        <span className="text-[11px] text-slate-400">{d.total} moteur(s)</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${d.pourcentage}%` }} /></div>
        <span className="text-xs font-bold text-cyan-200">{d.pourcentage}%</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">{d.note}</p>
      <details className="mt-2 text-[11px] text-slate-300"><summary className="cursor-pointer">{d.moteurs.length} emplacement(s) préparé(s)</summary>
        <div className="mt-2"><ListeMoteursDeclares moteurs={d.moteurs} onOuvrirMoteur={onOuvrirMoteur} /></div>
      </details>
    </Carte>
  );
}

type ConnecteurVue = {
  set: string;
  libelle: string;
  total: number;
  avecPreuve: number;
  pourcentage: number;
  note: string;
  moteurs: readonly Moteur[];
  alarme: { niveau: "vert" | "bleu" | "rouge" | "gris"; texte: string };
} | undefined;
const SHOP_CONNECTEURS = [
  { set: "shop-woocommerce", court: "WooCommerce" },
  { set: "shop-transporteurs", court: "Transporteurs" },
  { set: "shop-paiement", court: "Paiement" },
  { set: "shop-ia-boutique", court: "IA Boutique" },
  { set: "shop-autres", court: "Autres registres" },
] as const;

function MiniConnecteur({ d, libelle, onOuvrirMoteur }: { d: ConnecteurVue; libelle: string; onOuvrirMoteur: (c: string) => void }) {
  const premier = d?.moteurs[0]?.code;
  return (
    <button
      type="button"
      disabled={!premier}
      onClick={() => premier && onOuvrirMoteur(premier)}
      className="min-h-[82px] rounded-lg border border-slate-700 bg-[#0b1220] p-2 text-left hover:bg-[#13203a] disabled:cursor-default disabled:hover:bg-[#0b1220]"
      data-connecteur-vitrine={d?.set ?? libelle}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-black text-white">{libelle}</p>
        <AlarmeBadge alarme={d?.alarme} />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">{d ? `${d.total} moteur(s) · ${d.pourcentage}%` : "Lecture..."}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-1.5 rounded-full bg-cyan-400" style={{ width: `${d?.pourcentage ?? 0}%` }} />
      </div>
      <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-500">{d?.note ?? "Etat non lu."}</p>
    </button>
  );
}

function TraceFrontiere({ actif = false }: { actif?: boolean }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      <span className={`h-1 flex-1 rounded ${actif ? "bg-cyan-300 shadow-[0_0_10px_#22d3ee]" : "bg-slate-700"}`} />
      <span className="flex h-12 w-16 items-center justify-center rounded-xl border-4 border-red-500 bg-[#1f0a0a] text-[9px] font-black uppercase text-red-100 shadow-[0_0_14px_#ef444433]">
        ouvert
      </span>
      <span className={`h-1 flex-1 rounded ${actif ? "bg-cyan-300 shadow-[0_0_10px_#22d3ee]" : "bg-slate-700"}`} />
    </div>
  );
}

function ResumeConnecteur({ d, nom, onOuvrirMoteur }: { d: ConnecteurVue; nom: string; onOuvrirMoteur: (c: string) => void }) {
  const manquants = d?.moteurs.filter((m) => !["actif", "teste", "connecte"].includes(m.etat ?? "")).length ?? 0;
  const manuels = d?.moteurs.filter((m) => m.manualSwitch).length ?? 0;
  const moteur = d?.moteurs.find((m) => m.manualSwitch)?.code ?? d?.moteurs[0]?.code;
  return (
    <div className="rounded-lg border border-slate-700 bg-[#0b1220] p-2" data-resume-connecteur={d?.set ?? nom}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-black text-white">{nom}</p>
          <p className="text-[10px] text-slate-400">{d ? `${d.total} moteurs · ${manuels} interrupteur(s)` : "Lecture..."}</p>
        </div>
        <AlarmeBadge alarme={d?.alarme} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
        <span className="rounded border border-slate-700 px-1 py-1 text-slate-300">prêt {d?.avecPreuve ?? 0}</span>
        <span className="rounded border border-amber-600/50 px-1 py-1 text-amber-200">manque {manquants}</span>
        <span className="rounded border border-red-700/60 px-1 py-1 text-red-200">ouvert</span>
      </div>
      {moteur && <button type="button" onClick={() => onOuvrirMoteur(moteur)} className="mt-2 text-[10px] font-bold text-cyan-200 underline">inspecter</button>}
    </div>
  );
}

export function VitrineFrontiereElectrique({ onOuvrirMoteur, onMessage }: { onOuvrirMoteur: (c: string) => void; onMessage?: (m: string) => void }) {
  const utils = trpc.useUtils();
  const allumage = trpc.frontierOs.allumageCentral.useMutation({
    onSuccess: async (r) => {
      onMessage?.(r.detail);
      await Promise.all([utils.frontierOs.connecteur.invalidate(), utils.frontierOs.controleCentrale.invalidate(), utils.frontierOs.accueil.invalidate()]);
    },
    onError: (e) => onMessage?.(e.message),
  });
  const connecteurA = trpc.frontierOs.connecteur.useQuery({ set: "connecteur-a" }, { refetchInterval: 20000 });
  const connecteurB = trpc.frontierOs.connecteur.useQuery({ set: "connecteur-b" }, { refetchInterval: 20000 });
  const woo = trpc.frontierOs.connecteur.useQuery({ set: "shop-woocommerce" }, { refetchInterval: 20000 });
  const transporteurs = trpc.frontierOs.connecteur.useQuery({ set: "shop-transporteurs" }, { refetchInterval: 20000 });
  const paiement = trpc.frontierOs.connecteur.useQuery({ set: "shop-paiement" }, { refetchInterval: 20000 });
  const iaBoutique = trpc.frontierOs.connecteur.useQuery({ set: "shop-ia-boutique" }, { refetchInterval: 20000 });
  const autres = trpc.frontierOs.connecteur.useQuery({ set: "shop-autres" }, { refetchInterval: 20000 });
  const shop = [woo.data, transporteurs.data, paiement.data, iaBoutique.data, autres.data];
  const shopTotal = shop.reduce((n, d) => n + (d?.total ?? 0), 0);
  const premierA = connecteurA.data?.moteurs[0]?.code;
  const premierB = connecteurB.data?.moteurs[0]?.code;
  return (
    <Carte titre="Vitrine principale — frontière électrique entre plateformes">
      <p className="text-xs text-slate-300">
        Lecture principale demandée par le PDG : plateformes à gauche, frontière rouge au centre, plateforme principale à droite.
        Tous les contacts sont ouverts par défaut ; cette vitrine ne branche rien et ne remplace pas les moteurs déjà posés.
      </p>
      <div className="mt-3 overflow-auto pb-2" data-testid="vitrine-frontiere-electrique">
        <div className="min-w-[1280px] rounded-2xl border border-slate-700 bg-[#070c14] p-3">
          <div className="mb-3 grid grid-cols-4 gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-2 text-[11px]">
            <span className="font-black uppercase text-emerald-200">Développement sans déconnexion</span>
            <span className="text-slate-300">Ajouts par réserves et moteurs déclarés.</span>
            <span className="text-slate-300">Contacts rouges ouverts par défaut.</span>
            <button
              type="button"
              disabled={allumage.isPending}
              onClick={() => allumage.mutate({ confirme: true })}
              className={`${bouton} justify-center py-1 text-[10px]`}
              data-allumage-central
            >
              {allumage.isPending ? "Allumage..." : "Allumer A → B → central"}
            </button>
          </div>
          <div className="grid items-stretch gap-3" style={{ gridTemplateColumns: "360px 1fr 360px" }}>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-3" data-zone-frontiere="gauche">
              <p className="text-[11px] font-black uppercase tracking-wider text-cyan-200">Côté gauche · plateformes externes</p>
              <h3 className="mt-1 text-sm font-black text-white">MKAPMS Shop + futures plateformes</h3>
              <p className="mt-1 text-[11px] text-slate-400">{shopTotal} moteur(s) de connecteurs préparés, tous non connectés.</p>
              <div className="mt-3 grid gap-2">
                {SHOP_CONNECTEURS.map((x, i) => <MiniConnecteur key={x.set} d={shop[i]} libelle={x.court} onOuvrirMoteur={onOuvrirMoteur} />)}
                <div className="rounded-lg border border-dashed border-slate-700 p-2 text-[11px] text-slate-500">
                  Futures plateformes : emplacements gris, visibles, inertes, extensibles sans connexion automatique.
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-500/40 bg-red-950/10 p-3" data-zone-frontiere="centre">
              <p className="text-center text-[11px] font-black uppercase tracking-widest text-red-200">Frontière électrique · tunnel sécurisé</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ResumeConnecteur d={connecteurB.data} nom="Connecteur B" onOuvrirMoteur={onOuvrirMoteur} />
                <div className="rounded-lg border border-red-700/60 bg-[#1f0a0a] p-2 text-center">
                  <p className="text-[10px] font-black uppercase text-red-100">Contact central</p>
                  <p className="mt-2 text-xl font-black text-red-200">OUVERT</p>
                  <p className="text-[10px] text-slate-400">aucun passage autorisé</p>
                </div>
              </div>
              <div className="mt-4 space-y-5">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Connecteur B · échange plateforme-à-plateforme</span>
                    <button type="button" disabled={!premierB} onClick={() => premierB && onOuvrirMoteur(premierB)} className="text-cyan-200 underline disabled:text-slate-600">ouvrir</button>
                  </div>
                  <TraceFrontiere />
                  <p className="mt-1 text-center text-[10px] text-slate-500">{connecteurB.data?.note ?? "Lecture du Connecteur B..."}</p>
                </div>
                {SHOP_CONNECTEURS.map((x, i) => (
                  <div key={x.set}>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{x.court}</span>
                      <span>{shop[i]?.pourcentage ?? 0}%</span>
                    </div>
                    <TraceFrontiere />
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-950/10 p-2 text-center text-[11px] font-bold text-amber-200">
                Rien ne passe sans observation confirmée. Les contacts rouges restent ouverts tant qu'aucune connexion réelle n'est autorisée.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-3" data-zone-frontiere="droite">
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-200">Côté droit · PDG</p>
              <h3 className="mt-1 text-sm font-black text-white">Plateforme principale MKAPMS Web</h3>
              <p className="mt-1 text-[11px] text-slate-400">Côté principal : lecture, intervention et pilotage restent sous contrôle PDG.</p>
              <button
                type="button"
                disabled={!premierA}
                onClick={() => premierA && onOuvrirMoteur(premierA)}
                className="mt-3 w-full rounded-2xl border-4 border-amber-400/60 bg-amber-950/20 p-4 text-left shadow-[0_0_24px_#f59e0b22] hover:bg-amber-950/30 disabled:cursor-default"
                data-connecteur-a-vitrine
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase text-amber-200">Connecteur A · grand connecteur d'intervention</p>
                    <p className="mt-1 text-[11px] text-slate-300">Zone spéciale, plus grosse, séparée des échanges ordinaires.</p>
                  </div>
                  <AlarmeBadge alarme={connecteurA.data?.alarme} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px]">
                  <span className="rounded border border-amber-400/40 px-1 py-1 text-amber-100">{connecteurA.data?.total ?? 0} moteurs</span>
                  <span className="rounded border border-slate-700 px-1 py-1 text-slate-300">{connecteurA.data?.avecPreuve ?? 0} prêt</span>
                  <span className="rounded border border-red-700/60 px-1 py-1 text-red-200">ouvert</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-3 rounded-full bg-amber-300" style={{ width: `${connecteurA.data?.pourcentage ?? 0}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{connecteurA.data ? `${connecteurA.data.total} moteur(s) · ${connecteurA.data.pourcentage}%` : "Lecture..."}</p>
              </button>
              <div className="mt-3 rounded-lg border border-dashed border-slate-700 p-2 text-[11px] text-slate-500">
                Les listes et salles détaillées restent accessibles, mais la lecture principale reste ce plan gauche-centre-droite.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Carte>
  );
}

// ───────────────────────── Identité interne du Centre ─────────────────────────
export function CarteIdentiteCentre({ onMessage }: { onMessage: (m: string) => void }) {
  const utils = trpc.useUtils();
  const i = trpc.frontierOs.identiteCentre.useQuery();
  const [nom, setNom] = useState("");
  const definir = trpc.frontierOs.definirIdentiteCentre.useMutation({ onSuccess: async (r) => { onMessage(`Identité interne enregistrée : ${r.nomInterne}`); setNom(""); await utils.frontierOs.identiteCentre.invalidate(); }, onError: (e) => onMessage(e.message) });
  const d = i.data;
  return (
    <Carte titre="Identité interne du Centre">
      <p className="text-xs text-slate-200">Nom interne : <b>{d?.nomInterne ?? "non défini"}</b>{d?.definieLe ? ` (enregistré le ${date(d.definieLe)} par ${d.definiePar})` : ""}</p>
      <p className="text-[11px] text-slate-400">Localisation déclarative : {d?.localisationDeclarative}</p>
      <p className="mt-1 text-[11px] text-amber-200">Ce nom n'est jamais choisi par le code : seul le PDG peut le faire enregistrer ici. Il ne renomme jamais MKAPMS Web ni MKAPMS Shop.</p>
      <form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (nom.trim().length >= 2) definir.mutate({ nom: nom.trim(), confirme: true }); }}>
        <label className="text-xs text-slate-300">Nouveau nom interne<input aria-label="Nom interne du Centre" value={nom} onChange={(e) => setNom(e.target.value)} className="ml-1 rounded border border-slate-600 bg-[#0b1220] px-2 py-1 text-xs" /></label>
        <button type="submit" className={bouton} disabled={definir.isPending || nom.trim().length < 2}>Enregistrer</button>
      </form>
    </Carte>
  );
}
