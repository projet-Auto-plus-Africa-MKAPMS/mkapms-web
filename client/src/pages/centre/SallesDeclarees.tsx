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
