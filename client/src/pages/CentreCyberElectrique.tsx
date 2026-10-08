/**
 * Centre Cyber-Électrique MKA.P-MS / Frontier OS — premiers écrans (PDG) : accueil, groupes, salle d'activation, moteurs, sécurité, atelier, mémoire, journal.
 * SIMULATION : aucun bouton de cet écran ne branche ni ne débranche une connexion réelle ; l'état réel des canaux n'est que lu.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";

const ONGLETS = [
  ["accueil", "Accueil"],
  ["groupes", "Groupes"],
  ["activation", "Salle d'Activation"],
  ["moteurs", "Moteurs"],
  ["securite", "Cyber Sécurité"],
  ["atelier", "Atelier de Réparation"],
  ["memoire", "Mémoire"],
  ["journal", "Audit / Logs"],
] as const;
type Onglet = (typeof ONGLETS)[number][0];

const date = (d: string | Date | null | undefined) => (d ? new Date(d).toLocaleString("fr-FR") : "—");
const ETAT_MOTEUR: Record<string, string> = { active: "Actif", inactive: "Inactif", error: "Erreur", locked: "Verrouillé", future: "Futur", maintenance: "Maintenance" };
const ETAT_REEL: Record<string, string> = { connecte: "Réellement branché", coupe: "Câble réel coupé", attente_externe: "En attente externe (Boutique)", sans_canal: "Pas de canal côté plateforme" };
const COULEUR: Record<string, string> = { active: "#34d399", inactive: "#94a3b8", error: "#ef4444", locked: "#f59e0b", future: "#475569", maintenance: "#f59e0b", on: "#34d399", off: "#94a3b8" };

type ParamsAction = { code: string; ligneId?: number; reparationId?: number; libelle: string; critique: boolean };

/** Jauge à aiguille : une mesure calculée, « — » quand elle n'a pas de sens. */
function Jauge({ libelle, valeur, detail }: { libelle: string; valeur: number | null; detail: string }) {
  const v = valeur === null ? 0 : Math.max(0, Math.min(100, valeur));
  const angle = -90 + (v / 100) * 180;
  return (
    <figure className="rounded-xl border border-cyan-500/20 bg-[#0f1722] p-3 text-center" aria-label={`${libelle} : ${valeur === null ? "non mesurable" : `${valeur} pour cent`}`}>
      <svg viewBox="0 0 120 70" className="mx-auto h-20 w-full max-w-[160px]" role="img" aria-hidden="true">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        {valeur !== null && <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#22d3ee" strokeWidth="10" strokeLinecap="round" pathLength={100} strokeDasharray={`${v} 100`} />}
        <g transform={`rotate(${angle} 60 60)`}>
          <line x1="60" y1="60" x2="60" y2="20" stroke={valeur === null ? "#475569" : "#f87171"} strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="60" cy="60" r="5" fill="#e2e8f0" />
      </svg>
      <p className="text-lg font-black text-white">{valeur === null ? "—" : `${valeur} %`}</p>
      <figcaption className="text-xs font-bold text-cyan-200">{libelle}</figcaption>
      <p className="mt-1 text-[11px] leading-tight text-slate-400">{detail}</p>
    </figure>
  );
}

function Maillon({ titre, moteur, onOuvrir }: { titre: string; moteur: { id: number; nom: string; statut: string } | null; onOuvrir: (id: number) => void }) {
  if (!moteur) {
    return (
      <div className="min-w-0 overflow-hidden rounded-lg border border-dashed border-slate-600 p-2 text-center" title={`${titre} : vide`}>
        <p className="truncate text-[10px] uppercase tracking-wide text-slate-500">{titre}</p>
        <p className="truncate text-xs font-bold text-slate-500">vide / à créer</p>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => onOuvrir(moteur.id)} className="w-full min-w-0 overflow-hidden rounded-lg border bg-[#0b1220] p-2 text-center hover:bg-[#13203a]" style={{ borderColor: COULEUR[moteur.statut] ?? "#334155" }} title={`${titre} : ${moteur.nom}`}>
      <p className="truncate text-[10px] uppercase tracking-wide text-slate-400">{titre}</p>
      <p className="truncate text-xs font-bold text-white">{moteur.nom}</p>
      <p className="text-[10px]" style={{ color: COULEUR[moteur.statut] }}>{ETAT_MOTEUR[moteur.statut] ?? moteur.statut}</p>
    </button>
  );
}

const Cable = ({ etat }: { etat: string }) => (
  <div className="hidden h-1 w-full self-center rounded md:block" style={{ background: etat === "on" ? "linear-gradient(90deg,#34d399,#22d3ee,#34d399)" : etat === "locked" ? "#f59e0b" : etat === "error" ? "#ef4444" : "#334155", boxShadow: etat === "on" ? "0 0 10px #22d3ee" : "none" }} aria-hidden="true" />
);

function Interrupteur({ s }: { s: { cote: string; statut: string; manuel: boolean } }) {
  const on = s.statut === "ON";
  return (
    <div className="text-center" title={`Interrupteur ${s.cote} : ${s.statut}${s.manuel ? "" : " (désactivé)"}`}>
      <div className="mx-auto h-7 w-12 rounded-full border p-0.5" style={{ borderColor: COULEUR[on ? "on" : "off"], background: on ? "#064e3b" : "#0f172a" }}>
        <div className="h-5 w-5 rounded-full transition-all" style={{ marginLeft: on ? "1.3rem" : 0, background: s.statut === "locked" ? "#f59e0b" : s.statut === "error" ? "#ef4444" : on ? "#34d399" : "#64748b" }} />
      </div>
      <p className="text-[10px] text-slate-400">{s.statut}</p>
    </div>
  );
}

function Pointage({ p, etat }: { p: { statut: string; couleur: string } | null; etat: string }) {
  const connecte = p?.statut === "connected";
  return (
    <div className="mx-auto flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 text-center md:h-20 md:w-20" style={{ borderColor: "#ef4444", background: connecte ? "#7f1d1d" : "#1f0a0a", boxShadow: connecte ? "0 0 18px #ef4444" : "none" }} title="Grand pointage rouge central : grande coupure / grande alimentation">
      <span className="text-[9px] font-black uppercase leading-tight text-red-200">pointage</span>
      <span className="text-[10px] font-bold text-white">{p ? (connecte ? "connecté" : p.statut === "separated" ? "séparé" : p.statut === "locked" ? "verrouillé" : "erreur") : "—"}</span>
      <span className="sr-only">{etat}</span>
    </div>
  );
}

export default function CentreCyberElectrique() {
  const utils = trpc.useUtils();
  const [onglet, setOnglet] = useState<Onglet>("accueil");
  const [groupeId, setGroupeId] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [enAttente, setEnAttente] = useState<ParamsAction | null>(null);
  const [moteurOuvert, setMoteurOuvert] = useState<number | null>(null);
  const [filtres, setFiltres] = useState({ plateforme: "", type: "", statut: "", q: "" });
  const [futuresVisibles, setFuturesVisibles] = useState(false);

  const accueil = trpc.frontierOs.accueil.useQuery(undefined, { refetchInterval: 20000 });
  const groupes = trpc.frontierOs.groupes.useQuery();
  const boutons = trpc.frontierOs.boutons.useQuery();
  const comptage = trpc.frontierOs.comptage.useQuery();
  // Le groupe affiché par défaut est la Boutique : la requête doit porter sur CE groupe, jamais sur tous les groupes à la fois.
  const groupeParDefaut = (groupes.data ?? []).find((g) => g.code === "boutique")?.id;
  const groupeActif = groupeId ?? groupeParDefaut;
  const lignes = trpc.frontierOs.lignes.useQuery({ groupId: groupeActif }, { enabled: onglet === "activation" && groupeActif !== undefined });
  const moteurs = trpc.frontierOs.moteurs.useQuery({ plateforme: filtres.plateforme || undefined, type: filtres.type || undefined, statut: filtres.statut || undefined, q: filtres.q || undefined, limite: 200 }, { enabled: onglet === "moteurs" });
  const detail = trpc.frontierOs.moteur.useQuery({ id: moteurOuvert ?? 1 }, { enabled: moteurOuvert !== null });
  const salles = trpc.frontierOs.salles.useQuery(undefined, { enabled: onglet === "securite" });
  const atelier = trpc.frontierOs.atelier.useQuery(undefined, { enabled: onglet === "atelier" });
  const memoire = trpc.frontierOs.memoire.useQuery(undefined, { enabled: onglet === "memoire" });
  const journal = trpc.frontierOs.journal.useQuery({ limite: 100 }, { enabled: onglet === "journal" });
  const refus = trpc.frontierOs.journal.useQuery({ limite: 30, resultat: "refused" }, { enabled: onglet === "securite" });

  const rafraichir = async () => {
    await Promise.all([utils.frontierOs.accueil.invalidate(), utils.frontierOs.groupes.invalidate(), utils.frontierOs.lignes.invalidate(), utils.frontierOs.atelier.invalidate(), utils.frontierOs.journal.invalidate(), utils.frontierOs.memoire.invalidate(), utils.frontierOs.moteurs.invalidate()]);
  };
  const appuyer = trpc.frontierOs.appuyer.useMutation({
    onSuccess: async (r) => {
      setMessage(r.detail);
      setEnAttente(null);
      await rafraichir();
    },
    onError: (e) => setMessage(e.message),
  });
  const annuler = trpc.frontierOs.annulerReparation.useMutation({
    onSuccess: async (r) => {
      setMessage(r.detail);
      setEnAttente(null);
      await rafraichir();
    },
    onError: (e) => setMessage(e.message),
  });

  const parCode = useMemo(() => Object.fromEntries((boutons.data ?? []).map((b) => [b.code, b])), [boutons.data]);
  const lancer = (p: ParamsAction) => {
    const b = parCode[p.code];
    if (!b) return setMessage("Bouton introuvable : le centre se prépare, réessayez dans un instant.");
    if (p.critique || b.requiresConfirmation) return setEnAttente({ ...p, critique: true });
    appuyer.mutate({ boutonId: b.id, ligneId: p.ligneId, reparationId: p.reparationId, confirme: false });
  };
  const confirmer = () => {
    if (!enAttente) return;
    if (enAttente.code === "rollback") return annuler.mutate({ id: enAttente.reparationId!, confirme: true });
    const b = parCode[enAttente.code];
    if (b) appuyer.mutate({ boutonId: b.id, ligneId: enAttente.ligneId, reparationId: enAttente.reparationId, confirme: true });
  };

  const aReelles = (lignes.data ?? []).filter((l) => !l.estFuture);
  const futures = (lignes.data ?? []).filter((l) => l.estFuture);
  const groupeCourant = (groupes.data ?? []).find((g) => g.id === groupeActif);

  return (
    <div className="min-h-screen bg-[#070b12] pb-24 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to="/admin" className="text-xs text-cyan-300 hover:underline">← Retour au back-office</Link>
          <Link to="/admin/boutique-cable" className="text-xs text-cyan-300 hover:underline">Câble réel de la Boutique (moteur intermédiaire) →</Link>
        </div>
        <header className="mt-2 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-[#0b1220] to-[#10192b] p-4">
          <h1 className="text-xl font-black text-white">Centre Cyber-Électrique MKA.P-MS · Frontier OS</h1>
          <p className="text-xs text-slate-400">Contrôle, sécurité, réparation et pilotage entre plateformes — tout est moteur. Accès PDG seulement.</p>
          <p role="note" className="mt-2 inline-block rounded border border-amber-400/60 bg-amber-950/40 px-2 py-1 text-xs font-bold text-amber-200">
            MODE SIMULATION — aucune connexion réelle n'est modifiée depuis ce centre. L'état réel des canaux est seulement lu.
          </p>
        </header>

        <nav aria-label="Salles du centre" className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {ONGLETS.map(([cle, libelle]) => (
            <button key={cle} type="button" onClick={() => setOnglet(cle)} aria-current={onglet === cle ? "page" : undefined} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold ${onglet === cle ? "border-cyan-400 bg-cyan-950 text-cyan-100" : "border-slate-700 bg-[#0b1220] text-slate-300 hover:border-cyan-700"}`}>
              {libelle}
            </button>
          ))}
        </nav>
        <p role="status" className="mt-2 min-h-5 text-sm text-cyan-200">{message}</p>

        {enAttente && (
          <div role="alertdialog" aria-label="Confirmation requise" className="mb-3 rounded-xl border-2 border-red-500 bg-[#1f0a0a] p-3">
            <p className="text-sm font-bold text-red-100">Action critique — confirmation requise : {enAttente.libelle}</p>
            <p className="text-xs text-red-200">Simulation : aucune connexion réelle ne sera modifiée. L'action est journalisée.</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={confirmer} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white">Confirmer</button>
              <button type="button" onClick={() => setEnAttente(null)} className="rounded-lg border border-slate-500 px-3 py-2 text-xs font-bold text-slate-200">Annuler</button>
            </div>
          </div>
        )}

        {onglet === "accueil" && (
          <section aria-label="Accueil">
            {accueil.isLoading && <p className="text-sm">Pose de la fondation du centre…</p>}
            {accueil.error && <p className="text-sm text-red-300">{accueil.error.message}</p>}
            {accueil.data && (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  {accueil.data.jauges.map((j) => <Jauge key={j.cle} libelle={j.libelle} valeur={j.valeur} detail={j.detail} />)}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {accueil.data.resume.plateformes} plateformes · {accueil.data.resume.groupes} groupes · {accueil.data.resume.moteurs} moteurs · {accueil.data.resume.lignesReelles} lignes réelles ({accueil.data.resume.lignesValides} valides) · {accueil.data.resume.lignesFutures} lignes futures vides
                </p>
              </>
            )}
            {comptage.data && (
              <article className="mt-4 rounded-xl border border-slate-700 bg-[#0b1220] p-3 text-sm">
                <h2 className="font-black text-white">Analyse de la Boutique — moteurs intermédiaires déjà préparés</h2>
                <p className="text-xs text-slate-400">Relevé en lecture seule du dépôt de la Boutique (commit {comptage.data.instantane.commit.slice(0, 7)}, {comptage.data.instantane.analyseLe}). {comptage.data.moteursBoutique} moteurs déclarés.</p>
                <p className="mt-1 font-bold text-cyan-200">{comptage.data.intermediairesPrepares} moteurs intermédiaires → {comptage.data.lignesReellesPrevues} lignes réelles + {comptage.data.lignesFuturesPrevues} lignes futures vides = {comptage.data.totalLignesPrevues} lignes prévues</p>
                <ul className="mt-2 grid gap-1 text-xs md:grid-cols-2">
                  {comptage.data.detail.map((d) => (
                    <li key={d.id} className="rounded border border-slate-700 p-2"><b>{d.libelle}</b><br />{d.etatDeclare} · {d.preuve}{d.canalPlateforme ? ` · canal plateforme : ${d.canalPlateforme}` : " · aucun canal côté plateforme (à créer)"}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-200">
                  Écarts : canal(aux) de la plateforme sans intermédiaire préparé côté Boutique : {comptage.data.ecarts.canauxPlateformeSansIntermediaireBoutique.join(", ") || "aucun"} · moteur(s) nommé(s) par un contrat mais absent(s) du registre de la Boutique : {comptage.data.ecarts.moteursNommesParContratAbsentsDuRegistre.map((x) => x.moteur).join(", ") || "aucun"}.
                </p>
              </article>
            )}
          </section>
        )}

        {onglet === "groupes" && (
          <section aria-label="Groupes de contrôle" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(groupes.data ?? []).map((g) => (
              <article key={g.id} className="rounded-xl border border-slate-700 bg-[#0b1220] p-3">
                <h2 className="font-black text-white">{g.name}</h2>
                <p className="text-xs text-slate-400">{g.gauche} ⇄ {g.droite} · {ETAT_MOTEUR[g.status] ?? g.status}</p>
                <p className="mt-2 text-sm">{g.lignesReelles} ligne(s) réelle(s) · {g.lignesFutures} future(s) vide(s)</p>
                <p className="text-xs text-slate-400">{g.lignesValides} valide(s) · {g.lignesAllumees} allumée(s) en simulation</p>
                <button type="button" onClick={() => { setGroupeId(g.id); setOnglet("activation"); }} className="mt-2 rounded-lg border border-cyan-600 px-3 py-1.5 text-xs font-bold text-cyan-100">Ouvrir les lignes</button>
              </article>
            ))}
          </section>
        )}

        {onglet === "activation" && (
          <section aria-label="Salle d'Activation">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <label className="text-xs">
                Groupe{" "}
                <select value={groupeCourant?.id ?? ""} onChange={(e) => setGroupeId(Number(e.target.value))} className="rounded border border-slate-600 bg-[#0b1220] px-2 py-1 text-xs">
                  {(groupes.data ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => lancer({ code: "all_on", libelle: "Activer tout (simulation)", critique: true })} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white">Activer tout</button>
              <button type="button" onClick={() => lancer({ code: "all_off", libelle: "Désactiver tout", critique: true })} className="rounded-lg bg-slate-600 px-3 py-2 text-xs font-black text-white">Désactiver tout</button>
              <button type="button" onClick={() => lancer({ code: "diagnostic", libelle: "Lancer diagnostic", critique: false })} className="rounded-lg border border-cyan-600 px-3 py-2 text-xs font-bold text-cyan-100">Lancer diagnostic</button>
            </div>
            {lignes.isLoading && <p className="text-sm">Chargement…</p>}
            <div className="space-y-3">
              {aReelles.map((l) => (
                <article key={l.id} className="rounded-xl border bg-[#0b1220] p-3" style={{ borderColor: l.status === "on" ? "#34d399" : l.status === "locked" ? "#f59e0b" : "#1e293b" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-white">{l.label}</h3>
                    <p className="text-[11px]">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5">{l.status === "on" ? "ALLUMÉE (simulation)" : l.status === "locked" ? "VERROUILLÉE" : l.status === "error" ? "ERREUR" : "ÉTEINTE"}</span>{" "}
                      <span className={`rounded px-1.5 py-0.5 ${l.valide ? "bg-emerald-950 text-emerald-200" : "bg-red-950 text-red-200"}`}>{l.valide ? "valide" : "non valide"}</span>{" "}
                      <span className="rounded bg-slate-800 px-1.5 py-0.5">{ETAT_REEL[l.etatReel]}</span>
                    </p>
                  </div>
                  {/* Ligne : réel G · intermédiaire G · interrupteur G · câble · POINTAGE · câble · interrupteur D · intermédiaire D · réel D */}
                  <div className="mt-3 grid grid-cols-2 items-center gap-2 md:grid-cols-[repeat(2,minmax(0,1fr))_auto_minmax(16px,0.5fr)_auto_minmax(16px,0.5fr)_auto_repeat(2,minmax(0,1fr))]">
                    <Maillon titre={l.maillons[0].titre} moteur={l.maillons[0].moteur} onOuvrir={(id) => { setMoteurOuvert(id); setOnglet("moteurs"); }} />
                    <Maillon titre={l.maillons[1].titre} moteur={l.maillons[1].moteur} onOuvrir={(id) => { setMoteurOuvert(id); setOnglet("moteurs"); }} />
                    <Interrupteur s={l.interrupteurs[0]} />
                    <Cable etat={l.status} />
                    <div className="col-span-2 md:col-span-1"><Pointage p={l.pointage} etat={l.status} /></div>
                    <Cable etat={l.status} />
                    <Interrupteur s={l.interrupteurs[1]} />
                    <Maillon titre={l.maillons[2].titre} moteur={l.maillons[2].moteur} onOuvrir={(id) => { setMoteurOuvert(id); setOnglet("moteurs"); }} />
                    <Maillon titre={l.maillons[3].titre} moteur={l.maillons[3].moteur} onOuvrir={(id) => { setMoteurOuvert(id); setOnglet("moteurs"); }} />
                  </div>
                  {!l.valide && <ul className="mt-2 list-disc pl-5 text-[11px] text-red-200">{l.raisons.slice(0, 4).map((r) => <li key={r}>{r}</li>)}</ul>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[["line_on", "Activer ligne"], ["line_off", "Désactiver ligne"], ["test_current", "Tester courant"], ["lock", "Verrouiller"], ["unlock", "Déverrouiller"], ["pointage_toggle", "Pointage"]].map(([code, nom]) => (
                      <button key={code} type="button" onClick={() => lancer({ code, ligneId: l.id, libelle: `${nom} — ${l.label}`, critique: false })} className="rounded-lg border border-slate-600 px-2.5 py-1.5 text-[11px] font-bold hover:border-cyan-500">{nom}</button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">Test : {l.testStatus === "untested" ? "pas encore testée" : l.testStatus === "passed" ? "réussi" : "échoué"} · contrat : {l.contrat ?? "—"}</p>
                </article>
              ))}
              {aReelles.length === 0 && !lignes.isLoading && <p className="text-sm text-slate-400">Ce groupe n'a encore aucune ligne réelle : aucun moteur intermédiaire n'est préparé de ce côté. Sa réserve de lignes futures vides l'attend.</p>}
            </div>
            <div className="mt-4">
              <button type="button" onClick={() => setFuturesVisibles((v) => !v)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold">
                {futuresVisibles ? "Masquer" : "Afficher"} les {futures.length} lignes futures vides
              </button>
              {futuresVisibles && (
                <ul className="mt-2 grid gap-1 md:grid-cols-2 lg:grid-cols-3">
                  {futures.map((l) => (
                    <li key={l.id} className="rounded-lg border border-dashed border-slate-700 p-2 text-[11px] text-slate-500">
                      <b>{l.label}</b> — OFF · vide · désactivée · non connectée · prête à recevoir un moteur oublié ou futur
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {onglet === "moteurs" && (
          <section aria-label="Moteurs" className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <div>
              <div className="mb-2 flex flex-wrap gap-2 text-xs">
                <select aria-label="Plateforme" value={filtres.plateforme} onChange={(e) => setFiltres({ ...filtres, plateforme: e.target.value })} className="rounded border border-slate-600 bg-[#0b1220] px-2 py-1">
                  <option value="">Toutes les plateformes</option><option value="main">Plateforme Principale</option><option value="shop">Boutique</option>
                </select>
                <select aria-label="Type" value={filtres.type} onChange={(e) => setFiltres({ ...filtres, type: e.target.value })} className="rounded border border-slate-600 bg-[#0b1220] px-2 py-1">
                  <option value="">Tous les types</option><option value="real_platform_engine">Moteur réel</option><option value="intermediary_engine">Intermédiaire</option><option value="switch_engine">Interrupteur</option><option value="button_engine">Bouton</option><option value="pointage_engine">Pointage</option><option value="connection_engine">Ligne</option><option value="security_engine">Sécurité</option><option value="audit_engine">Audit</option><option value="memory_engine">Mémoire</option><option value="repair_engine">Réparation</option>
                </select>
                <select aria-label="Statut" value={filtres.statut} onChange={(e) => setFiltres({ ...filtres, statut: e.target.value })} className="rounded border border-slate-600 bg-[#0b1220] px-2 py-1">
                  <option value="">Tous les statuts</option>{Object.entries(ETAT_MOTEUR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input aria-label="Rechercher un moteur" value={filtres.q} onChange={(e) => setFiltres({ ...filtres, q: e.target.value })} placeholder="Rechercher…" className="rounded border border-slate-600 bg-[#0b1220] px-2 py-1" />
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b1220] text-slate-400"><tr><th className="p-2">Moteur</th><th>Plateforme</th><th>Type</th><th>Statut</th><th>Paire</th><th>Source</th></tr></thead>
                  <tbody>
                    {(moteurs.data ?? []).map((e) => (
                      <tr key={e.id} className="cursor-pointer border-t border-slate-800 hover:bg-[#0f1a2c]" onClick={() => setMoteurOuvert(e.id)}>
                        <td className="p-2"><button type="button" className="text-left font-bold text-cyan-100" onClick={() => setMoteurOuvert(e.id)}>{e.name}</button></td>
                        <td>{e.plateforme}</td><td>{e.type.replace("_engine", "").replace("_", " ")}</td>
                        <td style={{ color: COULEUR[e.status] }}>{ETAT_MOTEUR[e.status]}</td>
                        <td>{e.externe ? (e.paire === "ok" ? "valide" : e.paire ? "invalide" : "aucune") : "interne"}</td>
                        <td className="text-slate-500">{e.source === "inventory" ? "non observé" : e.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{(moteurs.data ?? []).length} moteur(s) affiché(s) (200 au plus). L'état des moteurs de la Boutique est « non observé » : aucune liaison externe n'est ouverte.</p>
            </div>
            <aside aria-label="Détail du moteur" className="rounded-xl border border-slate-700 bg-[#0b1220] p-3 text-xs">
              {moteurOuvert === null && <p className="text-slate-400">Choisissez un moteur pour voir son détail.</p>}
              {moteurOuvert !== null && detail.data === null && <p>Moteur introuvable.</p>}
              {moteurOuvert !== null && detail.data && (
                <div className="space-y-2">
                  <h2 className="text-sm font-black text-white">{detail.data.moteur.name}</h2>
                  <p>{detail.data.moteur.plateforme} · {detail.data.moteur.engineType} · <b style={{ color: COULEUR[detail.data.moteur.status] }}>{ETAT_MOTEUR[detail.data.moteur.status]}</b></p>
                  <p className="text-slate-400">{detail.data.moteur.role}</p>
                  <p className="text-slate-500">Source : {detail.data.moteur.stateSource === "inventory" ? "photo datée de la Boutique (non observé)" : detail.data.moteur.stateSource} · observé le {date(detail.data.moteur.observedAt)}</p>
                  {detail.data.moteur.externe && (
                    <div className="rounded border border-slate-700 p-2">
                      <p className="font-bold">Contrôle par deux moteurs internes</p>
                      {detail.data.paire ? (
                        <>
                          <p>1. {detail.data.paire.primaire?.nom} ({detail.data.paire.primaire?.statut})</p>
                          <p>2. {detail.data.paire.secondaire?.nom} ({detail.data.paire.secondaire?.statut})</p>
                          <p className={detail.data.paire.valide ? "text-emerald-300" : "text-red-300"}>{detail.data.paire.valide ? "Paire valide" : `Paire invalide : ${detail.data.paire.raison}`}</p>
                        </>
                      ) : <p className="text-red-300">Aucune paire : connexion non valide.</p>}
                    </div>
                  )}
                  {detail.data.controle.length > 0 && <p>Contrôle {detail.data.controle.length} moteur(s) externe(s).</p>}
                  {detail.data.lignes.length > 0 && <p>Lignes : {detail.data.lignes.map((l) => l.label || l.code).join(" ; ")}</p>}
                  {detail.data.boutons.length > 0 && <p>Boutons : {detail.data.boutons.map((b) => b.name).join(", ")}</p>}
                  {detail.data.interrupteurs.length > 0 && <p>Interrupteurs : {detail.data.interrupteurs.length}</p>}
                  {detail.data.journal.length > 0 && <p>Dernier événement : {detail.data.journal[0].action} ({date(detail.data.journal[0].createdAt)})</p>}
                  <button type="button" onClick={() => setMoteurOuvert(null)} className="rounded border border-slate-600 px-2 py-1">Fermer</button>
                </div>
              )}
            </aside>
          </section>
        )}

        {onglet === "securite" && (
          <section aria-label="Cyber Sécurité" className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-xl border border-slate-700 bg-[#0b1220] p-3 text-sm"><h2 className="font-black text-white">Tentatives bloquées (24 h)</h2><p className="text-2xl font-black text-red-300">{accueil.data?.comptes.alertes.tentativesRefusees24h ?? "—"}</p></article>
              <article className="rounded-xl border border-slate-700 bg-[#0b1220] p-3 text-sm"><h2 className="font-black text-white">Paires de contrôle valides</h2><p className="text-2xl font-black text-emerald-300">{accueil.data ? `${accueil.data.comptes.pairesValides} / ${accueil.data.comptes.pairesRequises}` : "—"}</p></article>
              <article className="rounded-xl border border-slate-700 bg-[#0b1220] p-3 text-sm"><h2 className="font-black text-white">Accès externes</h2><p className="text-sm text-slate-300">Aucune clé d'accès, aucune API externe pour le moment. Les clés viendront à la fin, bien sécurisées.</p></article>
            </div>
            <article className="rounded-xl border border-slate-700 bg-[#0b1220] p-3">
              <h2 className="text-sm font-black text-white">Dernières tentatives refusées</h2>
              <ul className="mt-1 text-xs">{(refus.data ?? []).map((l) => <li key={l.id} className="border-t border-slate-800 py-1">{date(l.createdAt)} · {l.action} · {l.errorMessage}</li>)}{(refus.data ?? []).length === 0 && <li className="text-slate-500">Aucune tentative refusée.</li>}</ul>
            </article>
            <article className="rounded-xl border border-slate-700 bg-[#0b1220] p-3">
              <h2 className="text-sm font-black text-white">Salles du centre (espace préparé : alertes, accès, permissions, clés, connexions suspectes)</h2>
              <ul className="mt-1 grid gap-1 text-xs md:grid-cols-2">{(salles.data ?? []).map((z) => <li key={z.id} className="rounded border border-slate-800 p-2"><b>{z.name}</b> · accès {z.accessLevel} · danger {z.dangerLevel}/5 · {ETAT_MOTEUR[z.status] ?? z.status}<br /><span className="text-slate-400">{z.description}</span></li>)}</ul>
            </article>
          </section>
        )}

        {onglet === "atelier" && (
          <section aria-label="Atelier de Réparation" className="space-y-2">
            <button type="button" onClick={() => lancer({ code: "diagnostic", libelle: "Lancer diagnostic", critique: false })} className="rounded-lg border border-cyan-600 px-3 py-2 text-xs font-bold text-cyan-100">Lancer diagnostic</button>
            {(atelier.data ?? []).map((r) => (
              <article key={String(r.id)} className="rounded-xl border border-slate-700 bg-[#0b1220] p-3 text-xs">
                <p className="font-bold text-white">{r.issueType} · {r.targetType} #{r.targetId} · {r.repairStatus}{r.resolvedAt ? " (résolue)" : ""}</p>
                <p className="text-slate-300">{r.proposedFix}</p>
                {r.appliedFix && <p className="text-emerald-300">Appliqué : {r.appliedFix}</p>}
                <div className="mt-1 flex gap-1.5">
                  {!r.resolvedAt && <button type="button" onClick={() => lancer({ code: "repair", reparationId: Number(r.id), libelle: `Réparer : ${r.proposedFix}`, critique: true })} className="rounded border border-slate-600 px-2 py-1 font-bold">Réparer</button>}
                  {r.repairStatus === "applied" && r.rollbackAvailable && <button type="button" onClick={() => setEnAttente({ code: "rollback", reparationId: Number(r.id), libelle: `Annuler la réparation #${r.id}`, critique: true })} className="rounded border border-slate-600 px-2 py-1 font-bold">Annuler (rollback)</button>}
                </div>
              </article>
            ))}
            {(atelier.data ?? []).length === 0 && <p className="text-sm text-slate-400">Atelier vide : lancez un diagnostic. Aucune réparation n'est jamais appliquée sans votre confirmation, et chacune peut être annulée.</p>}
          </section>
        )}

        {onglet === "memoire" && (
          <section aria-label="Mémoire" className="space-y-1">
            {(memoire.data ?? []).map((b) => <article key={String(b.id)} className="rounded-lg border border-slate-800 bg-[#0b1220] p-2 text-xs"><b>{b.ownerType}</b> · {b.memoryType} · importance {b.importanceLevel}/5 · {date(b.createdAt)}<br />{b.contentSummary}</article>)}
            {(memoire.data ?? []).length === 0 && <p className="text-sm text-slate-400">Mémoire vide.</p>}
          </section>
        )}

        {onglet === "journal" && (
          <section aria-label="Audit / Logs" className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1220] text-slate-400"><tr><th className="p-2">Date</th><th>Acteur</th><th>Action</th><th>Cible</th><th>Résultat</th><th>Détail</th></tr></thead>
              <tbody>
                {(journal.data ?? []).map((l) => (
                  <tr key={String(l.id)} className="border-t border-slate-800"><td className="p-2">{date(l.createdAt)}</td><td>{l.actorType}</td><td>{l.action}</td><td>{l.targetType}{l.targetId ? ` #${l.targetId}` : ""}</td><td style={{ color: l.result === "ok" ? "#34d399" : l.result === "refused" ? "#f59e0b" : "#ef4444" }}>{l.result}</td><td>{l.errorMessage}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
