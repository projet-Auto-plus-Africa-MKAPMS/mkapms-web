/**
 * MKA.P-MS Intelligences — côté direction (PDG seul).
 *
 * Un seul écran pour : parler au système, voir s'il peut réellement répondre,
 * voir tous les moteurs, connaître les commandes et les règles, ouvrir un
 * dossier de développement et demander l'écriture d'un correctif.
 *
 * L'ancienne appellation n'apparaît pas : le moteur s'appelle MKA.P-MS Intelligences.
 */
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  Brain,
  ChevronLeft,
  Code2,
  Cpu,
  Gauge,
  ListChecks,
  Network,
  Play,
  Search,
  Send,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Onglet =
  | "echange"
  | "pilotage"
  | "permissions"
  | "evaluation"
  | "shadow"
  | "fonctions"
  | "plan"
  | "developpeur"
  | "missions"
  | "autonomie"
  | "capacites"
  | "moteurs"
  | "connexion"
  | "surveillance"
  | "support"
  | "memoire"
  | "commandes"
  | "couts"
  | "developpement";

const ONGLETS: { cle: Onglet; label: string }[] = [
  { cle: "echange", label: "Échange" },
  { cle: "pilotage", label: "Actions de direction" },
  { cle: "permissions", label: "Permissions" },
  { cle: "evaluation", label: "Évaluation" },
  { cle: "shadow", label: "Moteur candidat" },
  { cle: "fonctions", label: "Fonctionnalités" },
  { cle: "plan", label: "Plan d'autonomie" },
  { cle: "developpeur", label: "Plateforme développeur" },
  { cle: "missions", label: "Missions" },
  { cle: "autonomie", label: "Autonomie" },
  { cle: "capacites", label: "Capacités" },
  { cle: "moteurs", label: "Moteurs" },
  { cle: "connexion", label: "Connexion des moteurs" },
  { cle: "surveillance", label: "Surveillance 24/7" },
  { cle: "support", label: "Support intelligent" },
  { cle: "memoire", label: "Mémoire" },
  { cle: "commandes", label: "Commandes & règles" },
  { cle: "couts", label: "Consommation" },
  { cle: "developpement", label: "Développement" },
];

const SANTE: Record<string, { pastille: string; texte: string; libelle: string }> = {
  up: { pastille: "bg-emerald-500", texte: "text-emerald-700", libelle: "Répond" },
  ok: { pastille: "bg-emerald-500", texte: "text-emerald-700", libelle: "Normal" },
  degraded: { pastille: "bg-amber-500", texte: "text-amber-700", libelle: "Dégradé" },
  down: { pastille: "bg-red-500", texte: "text-red-700", libelle: "Hors service" },
  unknown: { pastille: "bg-black/30", texte: "text-black/50", libelle: "Inconnu" },
};

interface Bulle {
  role: "moi" | "moteur";
  texte: string;
  ok: boolean;
  motif: string;
  fournisseur: string | null;
  modele: string | null;
  contexte: string[];
}

export default function CentreIntelligences() {
  const { user } = useAuth();
  const estPdg = user?.role === "super_admin";
  const [onglet, setOnglet] = useState<Onglet>("echange");
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [fil, setFil] = useState<Bulle[]>([]);
  const [besoin, setBesoin] = useState("");
  const [consigne, setConsigne] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [codeProduit, setCodeProduit] = useState<string>("");
  const [objectif, setObjectif] = useState("");
  const [motifNiveau, setMotifNiveau] = useState<Record<string, string>>({});
  const [recherche, setRecherche] = useState("");
  const [termeCherche, setTermeCherche] = useState("");
  const [ticketOuvert, setTicketOuvert] = useState<number | null>(null);
  const [argAction, setArgAction] = useState<Record<string, string>>({});
  const [motifAction, setMotifAction] = useState<Record<string, string>>({});
  const [phraseAction, setPhraseAction] = useState<Record<string, string>>({});
  const [permChoix, setPermChoix] = useState<Record<string, string[]>>({});
  const [motifPerm, setMotifPerm] = useState<Record<string, string>>({});
  const [motifShadow, setMotifShadow] = useState<Record<string, string>>({});
  const [motifFonction, setMotifFonction] = useState<Record<string, string>>({});
  const [motifEtape, setMotifEtape] = useState<Record<string, string>>({});
  const [nomCle, setNomCle] = useState("");
  const [roleCle, setRoleCle] = useState("user");
  const [quotaCle, setQuotaCle] = useState("0");
  const [porteeCle, setPorteeCle] = useState<string[]>([]);
  const [secretCle, setSecretCle] = useState("");

  const etat = trpc.intelligences.etat.useQuery(undefined, {
    enabled: !!estPdg,
    refetchOnWindowFocus: false,
  });
  const actions = trpc.intelligences.actions.useQuery(
    { limit: 40 },
    { enabled: !!estPdg, refetchOnWindowFocus: false },
  );
  const capacites = trpc.intelligences.capacites.useQuery(undefined, {
    enabled: !!estPdg,
    refetchOnWindowFocus: false,
  });

  const demander = trpc.intelligences.demander.useMutation({
    onSuccess: (r) => {
      setSessionId(r.sessionId);
      setFil((f) => [
        ...f,
        {
          role: "moteur",
          texte: r.reponse,
          ok: r.ok,
          motif: r.motif,
          fournisseur: r.fournisseur,
          modele: r.modele,
          contexte: r.contexte,
        },
      ]);
    },
    onError: (e) =>
      setFil((f) => [
        ...f,
        {
          role: "moteur",
          texte: "",
          ok: false,
          motif: e.message,
          fournisseur: null,
          modele: null,
          contexte: [],
        },
      ]),
  });

  const proposer = trpc.intelligences.proposer.useMutation({
    onSuccess: (r) => {
      setMessage(
        r.dossier
          ? `Dossier de développement #${r.dossier.id} ouvert (${r.dossier.status}). Il devra franchir le pipeline avant toute mise en production.`
          : "Dossier non ouvert.",
      );
      if (r.dossier) setDossierId(String(r.dossier.id));
      actions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const coder = trpc.intelligences.coder.useMutation({
    onSuccess: (r) => {
      setCodeProduit(r.ok ? r.code : "");
      setMessage(
        r.ok
          ? `Code produit par ${r.fournisseur} (${r.modele}). Ce n'est pas appliqué au dépôt : à lire, tester puis valider.`
          : `Aucun code produit — ${r.motif}`,
      );
      actions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const autonomie = trpc.intelligences.autonomie.useQuery(undefined, {
    enabled: !!estPdg,
    refetchOnWindowFocus: false,
  });
  const missions = trpc.intelligences.missions.useQuery(undefined, {
    enabled: !!estPdg,
    refetchOnWindowFocus: false,
  });

  const reglerAutonomie = trpc.intelligences.reglerAutonomie.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      autonomie.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const lancerMission = trpc.intelligences.lancerMission.useMutation({
    onSuccess: (m) => {
      setObjectif("");
      setMessage(
        m.statut === "accomplie"
          ? `Mission #${m.id} : toutes les étapes ont été exécutées.`
          : `Mission #${m.id} arrêtée sur « ${m.arretSur} » : ${m.motif}`,
      );
      missions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const memoire = trpc.intelligences.memoire.useQuery(undefined, {
    enabled: !!estPdg,
    refetchOnWindowFocus: false,
  });
  const experiences = trpc.intelligences.experiences.useQuery(
    { limit: 40 },
    { enabled: !!estPdg, refetchOnWindowFocus: false },
  );
  const resultats = trpc.intelligences.memoireRechercher.useQuery(
    { q: termeCherche, limit: 40 },
    { enabled: !!estPdg && termeCherche.trim().length >= 2, refetchOnWindowFocus: false },
  );
  const auditMoteurs = trpc.intelligences.auditMoteurs.useQuery(undefined, {
    enabled: !!estPdg,
    refetchOnWindowFocus: false,
  });

  const domaines = trpc.monitoringOs.domaines.useQuery(undefined, {
    enabled: !!estPdg && onglet === "surveillance",
    refetchOnWindowFocus: false,
  });
  const nonMesures = trpc.monitoringOs.nonMesures.useQuery(undefined, {
    enabled: !!estPdg && onglet === "surveillance",
    refetchOnWindowFocus: false,
  });
  const comparaison = trpc.continuousTest.comparaison.useQuery(undefined, {
    enabled: !!estPdg && onglet === "surveillance",
    refetchOnWindowFocus: false,
  });
  const verrou = trpc.continuousTest.verrouDeploiement.useQuery(undefined, {
    enabled: !!estPdg && onglet === "surveillance",
    refetchOnWindowFocus: false,
  });
  const fileSupport = trpc.supportOs.fileDiagnostiquee.useQuery(
    { limit: 40 },
    { enabled: !!estPdg && onglet === "support", refetchOnWindowFocus: false },
  );
  const dossier = trpc.supportOs.dossier.useQuery(
    { ticketId: ticketOuvert ?? 0 },
    { enabled: !!estPdg && ticketOuvert !== null, refetchOnWindowFocus: false },
  );

  const archiver = trpc.intelligences.memoireArchiver.useMutation({
    onSuccess: (r) => {
      setMessage(`${r.archives} souvenir(s) passé(s) en archive. Aucune suppression.`);
      memoire.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const pilotage = trpc.intelligences.pilotage.useQuery(undefined, {
    enabled: !!estPdg && onglet === "pilotage",
    refetchOnWindowFocus: false,
  });
  const journalActions = trpc.intelligences.journalActions.useQuery(undefined, {
    enabled: !!estPdg && onglet === "pilotage",
    refetchOnWindowFocus: false,
  });
  const executerAction = trpc.intelligences.executerAction.useMutation({
    onSuccess: (r) => {
      setMessage(`${r.detail}`);
      pilotage.refetch();
      journalActions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const permissions = trpc.intelligences.permissions.useQuery(undefined, {
    enabled: !!estPdg && onglet === "permissions",
    refetchOnWindowFocus: false,
  });
  const journalPermissions = trpc.intelligences.journalPermissions.useQuery(undefined, {
    enabled: !!estPdg && onglet === "permissions",
    refetchOnWindowFocus: false,
  });
  const attribuerPermissions = trpc.intelligences.attribuerPermissions.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      permissions.refetch();
      journalPermissions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const evaluation = trpc.intelligences.evaluation.useQuery(undefined, {
    enabled: !!estPdg && onglet === "evaluation",
    refetchOnWindowFocus: false,
  });
  const appels = trpc.intelligences.appels.useQuery(undefined, {
    enabled: !!estPdg && onglet === "evaluation",
    refetchOnWindowFocus: false,
  });
  const noterAppel = trpc.intelligences.noterAppel.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      appels.refetch();
      evaluation.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const shadow = trpc.intelligences.shadow.useQuery(undefined, {
    enabled: !!estPdg && onglet === "shadow",
    refetchOnWindowFocus: false,
  });
  const comparaisons = trpc.intelligences.comparaisonsShadow.useQuery(undefined, {
    enabled: !!estPdg && onglet === "shadow",
    refetchOnWindowFocus: false,
  });
  const reglerShadow = trpc.intelligences.reglerShadow.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      shadow.refetch();
      comparaisons.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const fonctions = trpc.intelligences.fonctions.useQuery(undefined, {
    enabled: !!estPdg && onglet === "fonctions",
    refetchOnWindowFocus: false,
  });
  const reglerFonction = trpc.intelligences.reglerFonction.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      fonctions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const planAutonomie = trpc.intelligences.planAutonomie.useQuery(undefined, {
    enabled: !!estPdg && onglet === "plan",
    refetchOnWindowFocus: false,
  });
  const marquerEtape = trpc.intelligences.marquerEtape.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      planAutonomie.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const developpeur = trpc.intelligences.developpeur.useQuery(undefined, {
    enabled: !!estPdg && onglet === "developpeur",
    refetchOnWindowFocus: false,
  });
  const creerCle = trpc.intelligences.creerCleDeveloppeur.useMutation({
    onSuccess: (r) => {
      setSecretCle(r.secret ?? "");
      setMessage(r.detail);
      developpeur.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const reglerCle = trpc.intelligences.reglerCleDeveloppeur.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      developpeur.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const revoquerCle = trpc.intelligences.revoquerCleDeveloppeur.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      developpeur.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const moteursParCategorie = useMemo(() => {
    const groupes = new Map<string, NonNullable<typeof etat.data>["moteurs"]>();
    for (const m of etat.data?.moteurs ?? []) {
      const liste = groupes.get(m.category) ?? [];
      liste.push(m);
      groupes.set(m.category, liste);
    }
    return [...groupes.entries()];
  }, [etat.data]);

  if (!user) return <Navigate to="/connexion" replace />;
  if (!estPdg) {
    return (
      <div className="mx-auto max-w-xl p-6 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-black/30" />
        <h1 className="mt-3 text-lg font-black text-[#111]">Espace réservé</h1>
        <p className="mt-2 text-sm text-black/60">
          Le côté direction de MKA.P-MS Intelligences est réservé au compte PDG. L'assistant public
          reste accessible à tous.
        </p>
        <Link to="/intelligences" className="mt-4 inline-block text-sm font-bold text-[#8B7500]">
          Ouvrir l'assistant public
        </Link>
      </div>
    );
  }

  const acces = etat.data?.acces;
  const styleAcces = SANTE[acces?.status ?? "unknown"];

  function envoyer() {
    const q = question.trim();
    if (q.length < 2 || demander.isPending) return;
    setFil((f) => [
      ...f,
      { role: "moi", texte: q, ok: true, motif: "", fournisseur: null, modele: null, contexte: [] },
    ]);
    setQuestion("");
    demander.mutate({ question: q, sessionId });
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-4">
      <Link
        to="/admin"
        className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-black/60 hover:text-black"
      >
        <ChevronLeft className="h-4 w-4" /> Administration
      </Link>

      <header className="rounded-2xl border border-black/5 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-black/40">Côté direction — PDG</p>
            <h1 className="flex items-center gap-2 text-xl font-black text-[#111]">
              <Sparkles className="h-5 w-5 text-[#8B7500]" /> MKA.P-MS Intelligences
            </h1>
            <p className="mt-1 text-sm text-black/60">
              Elle lit l'état réel des moteurs, la mémoire du code et les alertes avant de répondre.
              Ce qu'elle ne sait pas, elle le dit.
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-black/5 bg-[#FAFAFA] p-3 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${styleAcces.pastille}`} />
              <span className={`text-sm font-bold ${styleAcces.texte}`}>
                {styleAcces.libelle}
              </span>
            </div>
            <p className="mt-1 max-w-[240px] text-[11px] text-black/50">
              {acces?.message ?? "Vérification de l'accès fournisseur…"}
            </p>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
          {ONGLETS.map((o) => (
            <button
              key={o.cle}
              type="button"
              onClick={() => setOnglet(o.cle)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                onglet === o.cle ? "bg-[#111] text-white" : "bg-black/5 text-black/60"
              }`}
            >
              {o.label}
            </button>
          ))}
        </nav>
      </header>

      {message ? (
        <p className="mt-3 rounded-xl border border-[#8B7500]/20 bg-[#FFFBEA] p-3 text-sm text-[#6B5A00]">
          {message}
        </p>
      ) : null}

      {onglet === "echange" ? (
        <section className="mt-3 rounded-2xl border border-black/5 bg-white p-4">
          <div className="space-y-3">
            {fil.length === 0 ? (
              <p className="text-sm text-black/50">
                Pose ta question. Exemples : « où en est la plateforme ? », « quels moteurs sont en
                défaut et pourquoi ? », « que reste-t-il à faire sur le paiement ? ».
              </p>
            ) : null}
            {fil.map((b, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3 text-sm ${
                  b.role === "moi"
                    ? "border-black/5 bg-[#FAFAFA]"
                    : b.ok
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-red-200 bg-red-50/40"
                }`}
              >
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-black/40">
                  {b.role === "moi" ? "Vous" : "MKA.P-MS Intelligences"}
                  {b.role === "moteur" && b.fournisseur ? ` — ${b.fournisseur} / ${b.modele}` : ""}
                </p>
                {b.ok ? (
                  <p className="whitespace-pre-wrap text-[#111]">{b.texte}</p>
                ) : (
                  <p className="flex items-start gap-2 text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{b.motif || "Aucune réponse et aucun motif : à signaler."}</span>
                  </p>
                )}
                {b.contexte.length > 0 ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-bold text-black/40">
                      Contexte réellement lu ({b.contexte.length})
                    </summary>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-black/50">
                      {b.contexte.map((l, j) => (
                        <li key={j}>• {l}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              placeholder="Écris ta demande…"
              className="flex-1 rounded-xl border border-black/10 p-2 text-sm outline-none focus:border-[#8B7500]"
            />
            <button
              type="button"
              onClick={envoyer}
              disabled={demander.isPending || question.trim().length < 2}
              className="inline-flex items-center gap-1 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {demander.isPending ? "…" : "Envoyer"}
            </button>
          </div>
        </section>
      ) : null}

      {onglet === "fonctions" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Cpu className="h-4 w-4" /> Toutes les fonctionnalités disponibles
            </h2>
            <p className="mt-1 text-[12px] text-black/60">
              Chaque fonctionnalité que les fournisseurs connectés savent faire est construite ici.
              Celles qui n'ont pas été demandées restent <b>éteintes</b> : elles ne consomment rien
              et ne sont jamais appelées tant que vous ne les allumez pas vous-même, avec une raison
              écrite au journal.
            </p>
            <p className="mt-1 text-[11px] text-black/45">
              {fonctions.data?.resume.total ?? 0} fonctionnalité(s) —{" "}
              {fonctions.data?.resume.actives ?? 0} active(s),{" "}
              {fonctions.data?.resume.eteintes ?? 0} éteinte(s),{" "}
              {fonctions.data?.resume.impossibles ?? 0} impossible(s) faute de fournisseur.
            </p>
          </div>

          {(fonctions.data?.fonctions ?? []).map((f) => (
            <div key={f.code} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#111]">{f.libelle}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    f.etat === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : f.etat === "impossible"
                        ? "bg-red-50 text-red-700"
                        : "bg-[#FAFAFA] text-black/60"
                  }`}
                >
                  {f.etat === "active" ? "active" : f.etat === "impossible" ? "impossible" : "éteinte"}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-black/65">{f.apport}</p>
              <p className="mt-1 text-[11px] text-black/50">{f.motif}</p>
              <p className="mt-1 text-[11px] text-black/45">
                Permission {f.permission} — bénéficiaires : {f.beneficiaires.join(", ") || "aucun"}
              </p>
              <p className="mt-1 text-[11px] text-black/45">Précaution : {f.precaution}</p>
              <p className="mt-1 text-[11px] text-black/45">Autonomie : {f.autonomie}</p>
              <input
                value={motifFonction[f.code] ?? ""}
                onChange={(e) => setMotifFonction((m) => ({ ...m, [f.code]: e.target.value }))}
                placeholder="Raison de l'activation ou de l'extinction"
                className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-[12px]"
              />
              <button
                type="button"
                disabled={reglerFonction.isPending || (!f.activable && f.etat !== "active")}
                onClick={() =>
                  reglerFonction.mutate({
                    fonction: f.code,
                    active: f.etat !== "active",
                    motif: motifFonction[f.code] ?? "",
                  })
                }
                className="mt-2 rounded-xl bg-[#111] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
              >
                {f.etat === "active" ? "Éteindre" : "Activer"}
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {onglet === "plan" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Cpu className="h-4 w-4" /> Détacher les fournisseurs externes
            </h2>
            <p className="mt-1 text-[12px] text-black/60">{planAutonomie.data?.verdict ?? "…"}</p>
            <p className="mt-1 text-[11px] text-black/45">
              {planAutonomie.data?.exemples ?? 0} appel(s) mesuré(s),{" "}
              {planAutonomie.data?.exemplesNotes ?? 0} jugé(s) par un humain,{" "}
              {planAutonomie.data?.comparaisons ?? 0} comparaison(s) avec le moteur candidat.
            </p>
          </div>

          {(planAutonomie.data?.etapes ?? []).map((e) => (
            <div key={e.code} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#111]">
                  Mois {e.mois} — {e.titre}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    e.conditionRemplie ? "bg-emerald-50 text-emerald-700" : "bg-[#FAFAFA] text-black/60"
                  }`}
                >
                  {e.conditionRemplie ? "condition vérifiée" : "non atteinte"}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-black/65">{e.condition}</p>
              <p className="mt-1 text-[11px] text-black/50">Constat : {e.constat}</p>
              {e.motif ? (
                <p className="mt-1 text-[11px] text-black/45">Votre note : {e.motif}</p>
              ) : null}
              <input
                value={motifEtape[e.code] ?? ""}
                onChange={(ev) => setMotifEtape((m) => ({ ...m, [e.code]: ev.target.value }))}
                placeholder="Décision écrite"
                className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-[12px]"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(["en_cours", "atteinte", "abandonnee"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={marquerEtape.isPending}
                    onClick={() =>
                      marquerEtape.mutate({
                        etape: e.code,
                        statut: s,
                        motif: motifEtape[e.code] ?? "",
                      })
                    }
                    className="rounded-xl border border-black/10 px-3 py-1.5 text-[12px] font-bold text-black/70"
                  >
                    {s === "en_cours" ? "En cours" : s === "atteinte" ? "Atteinte" : "Abandonnée"}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Ce qui bloque réellement
            </h2>
            {(planAutonomie.data?.obstacles ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-black/50">Aucun obstacle mesuré.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {(planAutonomie.data?.obstacles ?? []).map((o) => (
                  <li key={o} className="rounded-xl border border-black/5 px-3 py-2 text-[12px] text-black/65">
                    {o}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {onglet === "developpeur" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Cpu className="h-4 w-4" /> Clés d'accès à {developpeur.data?.contrat.base ?? "/api/v1"}
            </h2>
            <p className="mt-1 text-[12px] text-black/60">
              {developpeur.data?.contrat.authentification ?? "…"}
            </p>
            <ul className="mt-2 space-y-1">
              {(developpeur.data?.contrat.regles ?? []).map((r) => (
                <li key={r} className="text-[11px] text-black/50">
                  — {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Créer une clé
            </h2>
            <input
              value={nomCle}
              onChange={(e) => setNomCle(e.target.value)}
              placeholder="Nom reconnaissable (ex. application PRO Android)"
              className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-[12px]"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                value={roleCle}
                onChange={(e) => setRoleCle(e.target.value)}
                className="rounded-xl border border-black/10 px-3 py-2 text-[12px]"
              >
                {["user", "pro", "garage", "society", "employee"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                value={quotaCle}
                onChange={(e) => setQuotaCle(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Quota / 24 h"
                className="w-32 rounded-xl border border-black/10 px-3 py-2 text-[12px]"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(developpeur.data?.contrat.capacites ?? []).map((c) => {
                const choisie = porteeCle.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() =>
                      setPorteeCle((p) =>
                        choisie ? p.filter((x) => x !== c.code) : [...p, c.code],
                      )
                    }
                    className={`rounded-xl border px-2.5 py-1 text-[11px] font-bold ${
                      choisie
                        ? "border-[#111] bg-[#111] text-white"
                        : "border-black/10 text-black/60"
                    }`}
                  >
                    {c.libelle}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={creerCle.isPending}
              onClick={() =>
                creerCle.mutate({
                  nom: nomCle,
                  portee: porteeCle,
                  role: roleCle,
                  quotaJour: Number(quotaCle || "0"),
                  motif: "",
                })
              }
              className="mt-2 rounded-xl bg-[#111] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
            >
              Créer (la clé restera fermée)
            </button>
            {secretCle ? (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[11px] font-bold text-amber-800">
                  Copiez ce secret maintenant : il n'est pas conservé et ne sera plus affiché.
                </p>
                <p className="mt-1 break-all font-mono text-[12px] text-amber-900">{secretCle}</p>
              </div>
            ) : null}
          </div>

          {(developpeur.data?.cles ?? []).map((c) => (
            <div key={c.id} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#111]">{c.nom}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    c.active ? "bg-emerald-50 text-emerald-700" : "bg-[#FAFAFA] text-black/60"
                  }`}
                >
                  {c.active ? "ouverte" : "fermée"}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-black/50">{c.prefixe}…</p>
              <p className="mt-1 text-[11px] text-black/50">
                Rôle {c.role} — quota {c.quotaJour}/24 h — {c.appels24h} appel(s) servi(s),{" "}
                {c.refus24h} refus sur 24 h
              </p>
              <p className="mt-1 text-[11px] text-black/45">
                Capacités réellement ouvertes : {c.capacitesEffectives.join(", ") || "aucune"}
              </p>
              {c.capacitesRefusees.map((r) => (
                <p key={r.capacite} className="mt-0.5 text-[11px] text-red-700">
                  {r.capacite} — {r.motif}
                </p>
              ))}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={reglerCle.isPending}
                  onClick={() =>
                    reglerCle.mutate({
                      id: c.id,
                      active: !c.active,
                      motif: c.active ? "Fermée par la direction" : "Ouverte par la direction",
                    })
                  }
                  className="rounded-xl border border-black/10 px-3 py-1.5 text-[12px] font-bold text-black/70"
                >
                  {c.active ? "Fermer" : "Ouvrir"}
                </button>
                <button
                  type="button"
                  disabled={revoquerCle.isPending}
                  onClick={() => revoquerCle.mutate({ id: c.id, motif: "Révoquée par la direction" })}
                  className="rounded-xl border border-red-200 px-3 py-1.5 text-[12px] font-bold text-red-700"
                >
                  Révoquer
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Derniers appels et refus
            </h2>
            {(developpeur.data?.journal ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-black/50">Aucun appel développeur enregistré.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {(developpeur.data?.journal ?? []).map((a) => (
                  <li key={a.id} className="rounded-xl border border-black/5 px-3 py-2">
                    <p className="text-[12px] text-black/70">
                      {a.capacite || "capacité non précisée"} — {a.ok ? "servi" : "refusé"}
                    </p>
                    <p className="text-[11px] text-black/45">{a.motif || "aucun motif"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {onglet === "missions" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Play className="h-4 w-4" /> Un objectif, un plan exécuté
            </h2>
            <p className="mt-1 text-[12px] text-black/60">
              Écrivez ce qui doit être obtenu. Le plan est exécuté étape par étape jusqu'à la
              limite de votre curseur d'autonomie, puis il s'arrête en disant où et pourquoi.
            </p>
            <textarea
              value={objectif}
              onChange={(e) => setObjectif(e.target.value)}
              rows={3}
              placeholder="Ex. : Répare le problème de paiement de la page abonnement."
              className="mt-2 w-full rounded-xl border border-black/10 p-3 text-sm"
            />
            <button
              type="button"
              disabled={objectif.trim().length < 5 || lancerMission.isPending}
              onClick={() => lancerMission.mutate({ objectif: objectif.trim() })}
              className="mt-2 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              {lancerMission.isPending ? "Mission en cours…" : "Lancer la mission"}
            </button>
          </div>

          {(missions.data ?? []).length === 0 ? (
            <p className="rounded-2xl border border-black/5 bg-white p-4 text-sm text-black/50">
              Aucune mission enregistrée.
            </p>
          ) : null}
          {(missions.data ?? []).map((m) => (
            <div key={m.id} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#111]">Mission #{m.id}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    m.statut === "accomplie"
                      ? "bg-emerald-100 text-emerald-800"
                      : m.statut === "echouee"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {m.statut}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-black/70">{m.objectif}</p>
              <p className="mt-1 text-[11px] text-black/45">
                Domaine {m.domaine}
                {m.arretSur ? ` — arrêt sur « ${m.arretSur} »` : ""}
              </p>
              {m.motif ? <p className="mt-1 text-[12px] text-black/60">{m.motif}</p> : null}
              {m.rapport ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[12px] font-bold text-[#8B7500]">
                    Lire le rapport
                  </summary>
                  <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[#FAFAFA] p-3 text-[11px] text-black/70">
                    {m.rapport}
                  </pre>
                </details>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {onglet === "pilotage" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <ListChecks className="h-4 w-4" /> Ce que la direction peut faire d'ici
            </h2>
            <p className="mt-1 text-[12px] text-black/60">
              Chaque action passe par la permission, le niveau d'autonomie et le journal. Les effets
              sensibles ouvrent une demande de confirmation : ils ne s'appliquent pas d'un clic.
            </p>
          </div>

          {(pilotage.data?.actions ?? []).map((a) => (
            <div key={a.code} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#111]">{a.libelle}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    a.disponible ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {a.disponible ? a.permission : "refusée"}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-black/60">{a.effet}</p>
              <p className="mt-1 text-[11px] text-black/45">
                {a.motif}
                {a.confirmation ? " — confirmation humaine exigée." : ""}
              </p>
              {a.argument ? (
                <input
                  value={argAction[a.code] ?? ""}
                  onChange={(e) => setArgAction((m) => ({ ...m, [a.code]: e.target.value }))}
                  placeholder={a.argument}
                  className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-[12px]"
                />
              ) : null}
              {a.lecture ? null : (
                <input
                  value={motifAction[a.code] ?? ""}
                  onChange={(e) => setMotifAction((m) => ({ ...m, [a.code]: e.target.value }))}
                  placeholder="Motif écrit (conservé au journal)"
                  className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-[12px]"
                />
              )}
              {a.confirmation || a.code === "autoriser_action" ? (
                <input
                  value={phraseAction[a.code] ?? ""}
                  onChange={(e) => setPhraseAction((m) => ({ ...m, [a.code]: e.target.value }))}
                  placeholder="Phrase de confirmation exacte"
                  className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-[12px]"
                />
              ) : null}
              <button
                type="button"
                disabled={!a.disponible || executerAction.isPending}
                onClick={() =>
                  executerAction.mutate({
                    code: a.code,
                    argument: argAction[a.code] || undefined,
                    motif: motifAction[a.code] || undefined,
                    phrase: phraseAction[a.code] || undefined,
                  })
                }
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#111] px-3 py-2 text-[12px] font-bold text-white disabled:opacity-40"
              >
                <Play className="h-3.5 w-3.5" /> {a.lecture ? "Consulter" : "Demander"}
              </button>
            </div>
          ))}

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Journal des actions
            </h2>
            {(journalActions.data ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-black/50">Aucune action enregistrée.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {(journalActions.data ?? []).map((j) => (
                  <li key={j.id} className="rounded-xl border border-black/5 px-3 py-2">
                    <p className="text-[12px] text-black/70">
                      {j.commande} — {j.resultat}
                    </p>
                    <p className="text-[11px] text-black/45">{j.detail || "aucun détail"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {onglet === "permissions" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <ShieldCheck className="h-4 w-4" /> Les neuf permissions techniques
            </h2>
            <p className="mt-1 text-[12px] text-black/60">
              Elles existent toutes dans l'architecture, mais aucune n'est distribuée d'office :
              un moteur d'image n'a pas à toucher au paiement. La permission réelle est
              l'intersection du rôle et du moteur appelant.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(permissions.data?.permissions ?? []).map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold text-black/60"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {[
            { titre: "Par rôle", portee: "role" as const, lignes: permissions.data?.roles ?? [] },
            { titre: "Par moteur appelant", portee: "moteur" as const, lignes: permissions.data?.moteurs ?? [] },
          ].map((bloc) => (
            <div key={bloc.portee} className="rounded-2xl border border-black/5 bg-white p-4">
              <h3 className="text-sm font-black text-[#111]">{bloc.titre}</h3>
              <ul className="mt-2 space-y-2">
                {bloc.lignes.map((l) => {
                  const cle = `${l.portee}:${l.cible}`;
                  const choisi = permChoix[cle] ?? l.permissions;
                  return (
                    <li key={cle} className="rounded-xl border border-black/5 px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[12px] font-bold text-[#111]">{l.cible}</p>
                        <span className="text-[11px] text-black/45">
                          {l.origine === "decision" ? "décision de direction" : "défaut"}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(permissions.data?.permissions ?? []).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setPermChoix((m) => ({
                                ...m,
                                [cle]: choisi.includes(p)
                                  ? choisi.filter((x) => x !== p)
                                  : [...choisi, p],
                              }))
                            }
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              choisi.includes(p)
                                ? "bg-[#111] text-white"
                                : "border border-black/10 text-black/50"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      {l.ecart.length > 0 ? (
                        <p className="mt-1 text-[11px] text-amber-700">
                          Écart avec le défaut : {l.ecart.join(", ")}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-black/45">{l.motif || "aucun motif écrit"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          value={motifPerm[cle] ?? ""}
                          onChange={(e) => setMotifPerm((m) => ({ ...m, [cle]: e.target.value }))}
                          placeholder="Motif de la décision"
                          className="min-w-[180px] flex-1 rounded-xl border border-black/10 px-3 py-1.5 text-[12px]"
                        />
                        <button
                          type="button"
                          disabled={attribuerPermissions.isPending}
                          onClick={() =>
                            attribuerPermissions.mutate({
                              portee: l.portee,
                              cible: l.cible,
                              permissions: choisi,
                              motif: motifPerm[cle] ?? "",
                            })
                          }
                          className="rounded-xl bg-[#111] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
                        >
                          Appliquer
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Journal des attributions
            </h2>
            {(journalPermissions.data ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-black/50">Aucune décision enregistrée.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {(journalPermissions.data ?? []).map((j) => (
                  <li key={j.id} className="rounded-xl border border-black/5 px-3 py-2">
                    <p className="text-[12px] text-black/70">
                      {j.argument || "cible non précisée"} — {j.resultat}
                    </p>
                    <p className="text-[11px] text-black/45">{j.detail || "aucun motif écrit"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {onglet === "evaluation" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Gauge className="h-4 w-4" /> Évaluation permanente
            </h2>
            <p className="mt-1 text-[12px] text-black/60">
              {evaluation.data?.appelsObserves ?? 0} appel(s) observé(s) sur{" "}
              {evaluation.data?.jours ?? 30} jours. Un critère sans relevé reste écrit
              « non mesuré » : aucun moteur n'est déclaré supérieur sans preuve.
            </p>
            <ul className="mt-2 space-y-1">
              {(evaluation.data?.global ?? []).map((m) => (
                <li key={m.critere} className="rounded-xl border border-black/5 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-bold text-[#111]">{m.libelle}</p>
                    <span
                      className={`text-[12px] font-bold ${
                        m.mesure ? "text-[#111]" : "text-black/40"
                      }`}
                    >
                      {m.mesure ? `${m.valeur} ${m.unite}` : "non mesuré"}
                    </span>
                  </div>
                  <p className="text-[11px] text-black/45">{m.constat}</p>
                </li>
              ))}
            </ul>
            {(evaluation.data?.manques ?? []).length > 0 ? (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[12px] font-bold text-amber-800">Ce qui manque pour conclure</p>
                <ul className="mt-1 space-y-0.5">
                  {(evaluation.data?.manques ?? []).map((m) => (
                    <li key={m} className="text-[11px] text-amber-800">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {(evaluation.data?.fournisseurs ?? []).map((f) => (
            <div key={f.fournisseur} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#111]">{f.fournisseur}</h3>
                <span className="text-[11px] text-black/45">{f.appels} appel(s)</span>
              </div>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {f.mesures.map((m) => (
                  <li key={m.critere} className="rounded-xl border border-black/5 px-3 py-1.5">
                    <p className="text-[11px] text-black/50">{m.libelle}</p>
                    <p
                      className={`text-[12px] font-bold ${
                        m.mesure ? "text-[#111]" : "text-black/40"
                      }`}
                    >
                      {m.mesure ? `${m.valeur} ${m.unite}` : "non mesuré"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Derniers appels réels
            </h2>
            {(appels.data ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-black/50">
                Aucun appel mesuré pour l'instant.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {(appels.data ?? []).map((a) => (
                  <li key={a.id} className="rounded-xl border border-black/5 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12px] text-black/70">
                        {a.capacite} — {a.fournisseur ?? "aucun fournisseur"} ({a.rang})
                      </p>
                      <span
                        className={`text-[11px] font-bold ${
                          a.ok ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {a.ok ? `${a.dureeMs} ms` : "échec"}
                      </span>
                    </div>
                    {a.motif ? (
                      <p className="text-[11px] text-black/45">{a.motif}</p>
                    ) : null}
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[11px] text-black/40">
                        {a.note ? `noté ${a.note}/5` : "non noté"}
                      </span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          disabled={noterAppel.isPending}
                          onClick={() => noterAppel.mutate({ appelId: a.id, note: n })}
                          className="h-6 w-6 rounded-lg border border-black/10 text-[11px] font-bold text-black/60 hover:bg-black/5"
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {onglet === "shadow" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Cpu className="h-4 w-4" /> Moteur MKA.P-MS en observation
            </h2>
            <p className="mt-1 text-[12px] text-black/60">
              Le candidat traite la même mission que le fournisseur, mais son résultat n'atteint
              jamais le client tant qu'il est seulement observé. La montée se fait par paliers
              prouvés : {(shadow.data?.paliers ?? []).join(" → ")} %.
            </p>
            <p className="mt-1 text-[11px] text-black/45">
              {shadow.data?.resume.observees ?? 0} capacité(s) observée(s),{" "}
              {shadow.data?.resume.servies ?? 0} servant déjà du trafic réel,{" "}
              {shadow.data?.resume.comparaisons ?? 0} comparaison(s) conservée(s).
            </p>
          </div>

          {(shadow.data?.capacites ?? []).map((c) => {
            const cle = c.capacite;
            return (
              <div key={cle} className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-[#111]">{c.libelle}</h3>
                  <span className="rounded-full bg-[#FAFAFA] px-2 py-0.5 text-[11px] font-bold text-black/60">
                    {c.actif ? `observé — ${c.part} % du trafic` : "non observé"}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-black/60">
                  Fournisseur : {c.fournisseurPrincipal ?? "aucun"} — candidat :{" "}
                  {c.candidat ?? c.remplacementMka}
                </p>
                <p className="mt-1 text-[11px] text-black/50">
                  {c.preuves.comparaisons} comparaison(s),{" "}
                  {c.preuves.accordMoyen === null
                    ? "accord non mesuré"
                    : `accord moyen ${c.preuves.accordMoyen} %`},{" "}
                  {c.preuves.echecCandidat === null
                    ? "échec candidat non mesuré"
                    : `${c.preuves.echecCandidat} % d'échecs candidat`}
                </p>
                <p className="mt-1 text-[11px] text-black/45">{c.verdict}</p>
                <input
                  value={motifShadow[cle] ?? ""}
                  onChange={(e) => setMotifShadow((m) => ({ ...m, [cle]: e.target.value }))}
                  placeholder="Motif de la décision"
                  className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-[12px]"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={reglerShadow.isPending}
                    onClick={() =>
                      reglerShadow.mutate({
                        capacite: cle,
                        actif: !c.actif,
                        motif: motifShadow[cle] ?? "",
                      })
                    }
                    className="rounded-xl border border-black/10 px-3 py-1.5 text-[12px] font-bold text-black/70"
                  >
                    {c.actif ? "Arrêter l'observation" : "Observer"}
                  </button>
                  {c.palierSuivant === null ? null : (
                    <button
                      type="button"
                      disabled={reglerShadow.isPending || !c.montePossible}
                      onClick={() =>
                        reglerShadow.mutate({
                          capacite: cle,
                          part: c.palierSuivant ?? 0,
                          actif: true,
                          motif: motifShadow[cle] ?? "",
                        })
                      }
                      className="rounded-xl bg-[#111] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
                    >
                      Monter à {c.palierSuivant} %
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Comparaisons conservées
            </h2>
            {(comparaisons.data ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-black/50">
                Aucune comparaison : rien ne permet encore de départager le candidat et le
                fournisseur.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {(comparaisons.data ?? []).map((c) => (
                  <li key={c.id} className="rounded-xl border border-black/5 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12px] text-black/70">
                        {c.capacite} : {c.fournisseur ?? "aucun"} vs {c.candidat}
                      </p>
                      <span className="text-[11px] font-bold text-black/60">{c.verdict}</span>
                    </div>
                    <p className="text-[11px] text-black/45">
                      {c.dureeFournisseurMs} ms / {c.dureeCandidatMs} ms —{" "}
                      {c.similarite === null ? "similarité non mesurée" : `${c.similarite} % d'accord`}
                      {c.motifCandidat ? ` — ${c.motifCandidat}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {onglet === "autonomie" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <SlidersHorizontal className="h-4 w-4" /> Les 7 niveaux
            </h2>
            <p className="mt-1 text-[12px] text-black/60">
              Les capacités sont construites au maximum ; c'est ce curseur qui décide de ce qui
              peut réellement s'exécuter. Le défaut est « Proposition » : rien ne part sans vous.
            </p>
            <ol className="mt-2 space-y-1">
              {(autonomie.data?.niveaux ?? []).map((n) => (
                <li key={n.niveau} className="rounded-xl border border-black/5 px-3 py-2">
                  <p className="text-[12px] font-bold text-[#111]">
                    {n.niveau}. {n.libelle}
                  </p>
                  <p className="text-[11px] text-black/55">{n.portee}</p>
                </li>
              ))}
            </ol>
          </div>

          {(autonomie.data?.domaines ?? []).map((d) => (
            <div key={d.domaine} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#111]">{d.libelle}</h3>
                <span className="rounded-full bg-[#FAFAFA] px-2 py-0.5 text-[11px] font-bold text-black/60">
                  niveau {d.effectif}
                  {d.effectif !== d.niveau ? ` (réglé à ${d.niveau}, plafonné)` : ""}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-black/60">{d.portee}</p>
              <p className="mt-1 text-[11px] text-black/45">{d.motif}</p>
              <input
                value={motifNiveau[d.domaine] ?? ""}
                onChange={(e) =>
                  setMotifNiveau((m) => ({ ...m, [d.domaine]: e.target.value }))
                }
                placeholder="Raison du changement (obligatoire pour monter)"
                className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-[12px]"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={reglerAutonomie.isPending}
                    onClick={() =>
                      reglerAutonomie.mutate({
                        domaine: d.domaine,
                        niveau: n,
                        motif: motifNiveau[d.domaine] ?? "",
                      })
                    }
                    className={`h-8 w-8 rounded-lg text-[12px] font-bold ${
                      n === d.niveau
                        ? "bg-[#111] text-white"
                        : "border border-black/10 text-black/60 hover:bg-black/5"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Journal des changements
            </h2>
            {(autonomie.data?.journal ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-black/50">Aucun changement enregistré.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {(autonomie.data?.journal ?? []).map((j) => (
                  <li key={j.id} className="rounded-xl border border-black/5 px-3 py-2">
                    <p className="text-[12px] text-black/70">
                      {j.domaine} : {j.avant} → {j.apres}
                    </p>
                    <p className="text-[11px] text-black/45">{j.motif || "aucune raison écrite"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {onglet === "capacites" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Sparkles className="h-4 w-4" /> Équipement au maximum — état constaté
            </h2>
            {capacites.data ? (
              <>
                <p className="mt-2 text-sm text-black/70">
                  {capacites.data.resume.disponibles} / {capacites.data.resume.total} capacités
                  utilisables aujourd'hui — {capacites.data.resume.interneSeulement} limitées au
                  repli interne, {capacites.data.resume.indisponibles} non exécutables.
                </p>
                {capacites.data.resume.manquantes.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-[12px] text-black/60">
                    {capacites.data.resume.manquantes.map((m) => (
                      <li key={m.capacite} className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span>
                          <b>{m.capacite}</b> — {m.motif}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-sm text-black/50">Lecture du registre des capacités…</p>
            )}
          </div>

          {(capacites.data?.capacites ?? []).map((c) => (
            <div key={c.code} className="rounded-2xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#111]">{c.libelle}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    c.etat === "disponible"
                      ? "bg-emerald-100 text-emerald-800"
                      : c.etat === "interne_seulement"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {c.etat === "disponible"
                    ? "Disponible"
                    : c.etat === "interne_seulement"
                      ? "Repli interne seulement"
                      : "Non exécutable"}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-black/60">{c.usage}</p>
              <p className="mt-2 text-[12px] text-black/70">{c.motif}</p>
              <dl className="mt-2 grid gap-1 text-[11px] text-black/50 sm:grid-cols-2">
                <div>
                  <dt className="inline font-bold">Fournisseur retenu : </dt>
                  <dd className="inline">{c.fournisseurRetenu ?? "aucun"}</dd>
                </div>
                <div>
                  <dt className="inline font-bold">Permission exigée : </dt>
                  <dd className="inline">{c.permission}</dd>
                </div>
                <div>
                  <dt className="inline font-bold">Repli : </dt>
                  <dd className="inline">{c.fallback}</dd>
                </div>
                <div>
                  <dt className="inline font-bold">Remplacement MKA.P-MS visé : </dt>
                  <dd className="inline">{c.remplacementMka}</dd>
                </div>
                <div>
                  <dt className="inline font-bold">Moteurs porteurs : </dt>
                  <dd className="inline">{c.moteurs.join(", ")}</dd>
                </div>
                <div>
                  <dt className="inline font-bold">Usage 30 jours : </dt>
                  <dd className="inline">
                    {c.appels30j} appel(s)
                    {c.coutMesure
                      ? ` — ${(c.coutCents / 100).toFixed(2)} €`
                      : " — coût non mesuré (tarif non saisi)"}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </section>
      ) : null}

      {onglet === "moteurs" ? (
        <section className="mt-3 space-y-3">
          {moteursParCategorie.length === 0 ? (
            <p className="rounded-2xl border border-black/5 bg-white p-4 text-sm text-black/50">
              Registre des moteurs vide ou illisible.
            </p>
          ) : null}
          {moteursParCategorie.map(([categorie, liste]) => (
            <div key={categorie} className="rounded-2xl border border-black/5 bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
                <Cpu className="h-4 w-4" /> {categorie} — {liste.length}
              </h2>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {liste.map((m) => {
                  const s = SANTE[m.health] ?? SANTE.unknown;
                  return (
                    <li
                      key={m.name}
                      className="flex items-center justify-between gap-2 rounded-xl border border-black/5 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#111]">{m.label}</p>
                        <p className="truncate text-[11px] text-black/40">
                          {m.name} — état {m.state}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${s.pastille}`} />
                        <span className={`text-[11px] font-bold ${s.texte}`}>{s.libelle}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <Link
            to="/admin/moteurs"
            className="inline-block text-sm font-bold text-[#8B7500] hover:underline"
          >
            Ouvrir le centre de contrôle des moteurs
          </Link>
        </section>
      ) : null}

      {onglet === "connexion" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Network className="h-4 w-4" /> Audit de connexion — {auditMoteurs.data?.controles ?? 0}{" "}
              contrôlé(s) sur {auditMoteurs.data?.total ?? 0}
            </h2>
            <p className="mt-1 text-[12px] text-black/55">
              Audit fait sur le registre central lui-même, pas sur une liste tenue à la main. Un
              moteur n'est « contrôlé » que s'il remplit les six exigences.
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {(auditMoteurs.data?.exigences ?? []).map((e) => (
                <li key={e.code} className="rounded-xl border border-black/5 p-2">
                  <p className="text-[12px] font-bold text-[#111]">{e.libelle}</p>
                  <p className="text-[11px] text-black/50">
                    {auditMoteurs.data?.manquesParExigence?.[e.code] ?? 0} moteur(s) en manque
                  </p>
                </li>
              ))}
            </ul>
            {(auditMoteurs.data?.reserves ?? []).map((r) => (
              <p key={r} className="mt-2 text-[12px] font-bold text-amber-700">
                Réserve : {r}
              </p>
            ))}
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <ul className="space-y-2">
              {(auditMoteurs.data?.moteurs ?? []).map((m) => (
                <li key={m.nom} className="rounded-xl border border-black/5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#111]">{m.libelle}</p>
                      <p className="truncate text-[11px] text-black/40">
                        {m.nom} — {m.categorie} — version {m.version} — état {m.etat}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        m.controle ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {m.controle ? "Contrôlé" : `${m.manques.length} manque(s)`}
                    </span>
                  </div>
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {m.exigences.map((x) => (
                      <li key={x.code} className="text-[11px] text-black/60">
                        <span className={x.rempli ? "text-emerald-700" : "text-amber-700"}>
                          {x.rempli ? "✓" : "—"}
                        </span>{" "}
                        <span className="font-bold">{x.libelle} :</span> {x.preuve}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[11px] text-black/45">
                    {m.appels} appel(s) mesuré(s) auprès de MKA.P-MS Intelligences
                    {m.dernierAppel
                      ? ` — dernier le ${new Date(m.dernierAppel).toLocaleString("fr-FR")}`
                      : " — aucun appel mesuré"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {onglet === "surveillance" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Gauge className="h-4 w-4" /> Quatorze domaines surveillés — état le plus bas :{" "}
              {domaines.data?.pire ?? "…"}
            </h2>
            <p className="mt-1 text-[12px] text-black/55">
              Un domaine qu'on ne sait pas mesurer est écrit « inconnu » avec son motif : jamais
              vert. Les domaines rouges deviennent des événements, pour être vus avant le premier
              client.
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {(domaines.data?.domaines ?? []).map((d) => (
                <li key={d.code} className="rounded-xl border border-black/5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-[#111]">{d.libelle}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        d.niveau === "vert"
                          ? "bg-emerald-50 text-emerald-700"
                          : d.niveau === "orange"
                            ? "bg-amber-50 text-amber-700"
                            : d.niveau === "rouge"
                              ? "bg-red-50 text-red-700"
                              : "bg-black/5 text-black/50"
                      }`}
                    >
                      {d.niveau}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-black/60">{d.constat}</p>
                  <p className="mt-1 text-[11px] text-black/40">
                    {d.mesure === null ? "aucune mesure" : `${d.mesure} ${d.unite}`} — source{" "}
                    {d.source}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] font-bold text-black/70">
              {domaines.data?.detectionTardive.motif ?? ""}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Ce que personne ne mesure encore — {nonMesures.data?.length ?? 0}
            </h2>
            <ul className="mt-2 space-y-1">
              {(nonMesures.data ?? []).map((d) => (
                <li key={d.code} className="text-[12px] text-black/60">
                  <span className="font-bold text-[#111]">{d.libelle} :</span> {d.constat}
                </li>
              ))}
              {nonMesures.data?.length === 0 ? (
                <li className="text-[12px] text-emerald-700">
                  Les quatorze domaines produisent une mesure réelle.
                </li>
              ) : null}
            </ul>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <ListChecks className="h-4 w-4" /> Avant / après les contrôles
            </h2>
            <p className="mt-1 text-sm font-bold text-[#111]">
              {comparaison.data?.verdict ?? "…"}
            </p>
            <p className="mt-1 text-[12px] text-black/55">
              Avant : {comparaison.data?.avant?.reussis ?? "—"} /{" "}
              {comparaison.data?.avant?.total ?? "—"} — Après :{" "}
              {comparaison.data?.apres?.reussis ?? "—"} / {comparaison.data?.apres?.total ?? "—"}
            </p>
            <ul className="mt-2 space-y-1">
              {(comparaison.data?.perdus ?? []).map((p) => (
                <li key={p.scenario} className="text-[12px] text-red-700">
                  <span className="font-bold">{p.label} :</span> réussi avant, {p.apres} après.
                </li>
              ))}
            </ul>
            <p
              className={`mt-3 rounded-xl px-3 py-2 text-[12px] font-bold ${
                verrou.data?.autorise
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {verrou.data?.autorise
                ? "Déploiement pouvant être déclaré terminé."
                : `Déploiement non déclarable : ${verrou.data?.motif ?? "…"}`}
            </p>
          </div>
        </section>
      ) : null}

      {onglet === "support" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <AlertTriangle className="h-4 w-4" /> Demandes clientes — {fileSupport.data?.length ?? 0}
            </h2>
            <p className="mt-1 text-[12px] text-black/55">
              « Déjà connu » signifie qu'une alerte interne existait avant la réclamation. Sinon, le
              client a détecté la panne avant nous.
            </p>
            <ul className="mt-2 space-y-1.5">
              {(fileSupport.data ?? []).map((t) => (
                <li key={t.ticketId}>
                  <button
                    type="button"
                    onClick={() => setTicketOuvert(t.ticketId)}
                    className={`w-full rounded-xl border px-3 py-2 text-left ${
                      ticketOuvert === t.ticketId ? "border-[#8B7500]" : "border-black/5"
                    }`}
                  >
                    <p className="truncate text-sm font-bold text-[#111]">{t.sujet}</p>
                    <p className="text-[11px] text-black/45">
                      {t.domaine} — priorité {t.priorite} —{" "}
                      {t.dejaConnu ? "défaut déjà connu" : "aucune alerte interne avant"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {ticketOuvert !== null && dossier.data ? (
            <div className="rounded-2xl border border-black/5 bg-white p-4">
              <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
                Dossier — {dossier.data.domaineLibelle}
              </h2>
              <p className="mt-1 text-[12px] text-black/55">
                {dossier.data.client
                  ? `${dossier.data.client.nom} — ${dossier.data.client.email}`
                  : "Client non identifié"}
              </p>
              <ul className="mt-2 space-y-1">
                {dossier.data.etapes.map((e) => (
                  <li key={e.etape} className="text-[12px] text-black/65">
                    <span className={e.lu ? "text-emerald-700" : "text-amber-700"}>
                      {e.lu ? "✓" : "—"}
                    </span>{" "}
                    <span className="font-bold">{e.libelle} :</span> {e.constat}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px]">
                <span className="font-bold text-[#111]">Cause probable :</span>{" "}
                {dossier.data.causeProbable}
              </p>
              <p className="mt-1 text-[12px]">
                <span className="font-bold text-[#111]">Solution :</span> {dossier.data.solution}
              </p>
              <p className="mt-2 whitespace-pre-line rounded-xl bg-[#FAFAFA] p-3 text-[12px] text-black/70">
                {dossier.data.reponsePreparee}
              </p>
              {dossier.data.actionProposee ? (
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-800">
                  Action proposée, non exécutée : {dossier.data.actionProposee.libelle} — permission{" "}
                  {dossier.data.actionProposee.permission}
                </p>
              ) : null}
              {dossier.data.manques.map((m) => (
                <p key={m} className="mt-1 text-[11px] text-black/45">
                  Non lu : {m}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {onglet === "memoire" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
                <Brain className="h-4 w-4" /> Mémoires et leur détenteur réel
              </h2>
              <button
                type="button"
                onClick={() => archiver.mutate({ jours: 120 })}
                disabled={archiver.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-[12px] font-bold text-black/70 disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" /> Passer l'historique de plus de 120 jours en
                archive
              </button>
            </div>
            <p className="mt-1 text-[12px] text-black/55">
              Une mémoire détenue par un autre moteur n'est jamais recopiée ici : elle est lue chez
              son détenteur. Aucune suppression, seulement actif → historique → archive.
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {(memoire.data?.etat ?? []).map((c) => (
                <li key={c.code} className="rounded-xl border border-black/5 p-3">
                  <p className="text-sm font-bold text-[#111]">{c.libelle}</p>
                  <p className="text-[11px] text-black/40">détenteur : {c.detenteur}</p>
                  <p className="mt-1 text-[12px] text-black/60">
                    {c.volume === null ? "Volume non mesuré" : `${c.volume} élément(s)`} — {c.motif}
                  </p>
                  <p className="mt-0.5 text-[11px] text-black/45">{c.usage}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Search className="h-4 w-4" /> Recherche dans toutes les mémoires
            </h2>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setTermeCherche(recherche);
              }}
            >
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Un mot, une route, une erreur, un modèle…"
                className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white"
              >
                Chercher
              </button>
            </form>
            {(resultats.data?.nonLues ?? []).map((n) => (
              <p key={n.detenteur} className="mt-2 text-[12px] font-bold text-amber-700">
                {n.detenteur} : non lu — {n.motif}
              </p>
            ))}
            <ul className="mt-2 space-y-1.5">
              {(resultats.data?.trouvailles ?? []).map((t, i) => (
                <li key={`${t.categorie}-${i}`} className="rounded-xl border border-black/5 p-3">
                  <p className="text-sm font-bold text-[#111]">{t.titre}</p>
                  <p className="text-[11px] text-black/40">
                    {t.categorie} — {t.detenteur} — {t.cycle}
                    {t.quand ? ` — ${new Date(t.quand).toLocaleDateString("fr-FR")}` : ""}
                  </p>
                  <p className="mt-1 text-[12px] text-black/60">{t.extrait}</p>
                </li>
              ))}
            </ul>
            {termeCherche.trim().length >= 2 &&
            !resultats.isLoading &&
            (resultats.data?.trouvailles ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-black/50">
                Aucune trace pour « {termeCherche} » dans les mémoires lues.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Expériences retenues après action
            </h2>
            <p className="mt-1 text-[12px] text-black/55">
              Un même problème qui revient ne crée pas une nouvelle ligne : il incrémente son
              compteur. C'est ce qui distingue une mémoire d'un journal.
            </p>
            <ul className="mt-2 space-y-1.5">
              {(experiences.data ?? []).map((x) => (
                <li key={x.id} className="rounded-xl border border-black/5 p-3">
                  <p className="text-sm font-bold text-[#111]">{x.probleme}</p>
                  <p className="text-[11px] text-black/40">
                    {x.domaine} — résultat {x.resultat} — vu {x.occurrences} fois
                  </p>
                  {x.diagnostic ? (
                    <p className="mt-1 text-[12px] text-black/60">{x.diagnostic}</p>
                  ) : null}
                  {x.blocage ? (
                    <p className="mt-0.5 text-[12px] text-amber-700">{x.blocage}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            {(experiences.data ?? []).length === 0 ? (
              <p className="mt-2 text-[12px] text-black/50">
                Aucune expérience encore retenue : rien n'a été exécuté ni signalé.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {onglet === "commandes" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <ListChecks className="h-4 w-4" /> Commandes disponibles
            </h2>
            <ul className="mt-2 space-y-2">
              {(etat.data?.commandes ?? []).map((c) => (
                <li key={c.code} className="rounded-xl border border-black/5 p-3">
                  <p className="text-sm font-bold text-[#111]">
                    {c.libelle}{" "}
                    <span className="text-[11px] font-normal text-black/40">
                      ({c.code} — côté {c.cote})
                    </span>
                  </p>
                  <p className="mt-1 text-[12px] text-black/60">{c.effet}</p>
                  <p className="mt-0.5 text-[12px] text-black/45">Limite : {c.limite}</p>
                  {c.validationHumaine ? (
                    <p className="mt-1 text-[11px] font-bold text-[#8B7500]">
                      Validation humaine obligatoire avant production.
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Règles appliquées
            </h2>
            <ul className="mt-2 space-y-2">
              {(etat.data?.regles ?? []).map((r) => (
                <li key={r.code} className="rounded-xl border border-black/5 p-3">
                  <p className="text-sm font-bold text-[#111]">{r.regle}</p>
                  <p className="mt-0.5 text-[12px] text-black/55">{r.application}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {onglet === "couts" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Gauge className="h-4 w-4" /> Plafonds du jour
            </h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {(etat.data?.plafonds ?? []).map((p) => (
                <li key={p.cote} className="rounded-xl border border-black/5 p-3">
                  <p className="text-sm font-bold text-[#111]">Côté {p.cote}</p>
                  <p className="text-[12px] text-black/55">
                    {p.consommes} appel(s) sur {p.plafond} autorisés aujourd'hui.
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Consommation des 14 derniers jours
            </h2>
            {(etat.data?.usage ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-black/50">Aucun appel enregistré.</p>
            ) : (
              <table className="mt-2 w-full text-left text-[12px]">
                <thead className="text-black/40">
                  <tr>
                    <th className="py-1">Jour</th>
                    <th className="py-1">Côté</th>
                    <th className="py-1">Appels</th>
                    <th className="py-1">Échecs</th>
                    <th className="py-1">Jetons</th>
                  </tr>
                </thead>
                <tbody>
                  {(etat.data?.usage ?? []).map((u) => (
                    <tr key={`${u.jour}-${u.cote}`} className="border-t border-black/5">
                      <td className="py-1">{u.jour}</td>
                      <td className="py-1">{u.cote}</td>
                      <td className="py-1">{u.appels}</td>
                      <td className="py-1">{u.echecs}</td>
                      <td className="py-1">{u.jetons}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Fournisseurs
            </h2>
            <ul className="mt-2 space-y-1.5">
              {(etat.data?.fournisseurs ?? []).map((f) => (
                <li
                  key={f.code}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/5 px-3 py-2 text-[12px]"
                >
                  <span className="font-bold text-[#111]">
                    {f.label}{" "}
                    <span className="font-normal text-black/40">({f.capability})</span>
                  </span>
                  <span className="text-black/55">
                    {f.status}
                    {f.missingEnv.length > 0 ? ` — manque : ${f.missingEnv.join(", ")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {onglet === "developpement" ? (
        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black/50">
              <Code2 className="h-4 w-4" /> Ouvrir un dossier de développement
            </h2>
            <p className="mt-1 text-[12px] text-black/55">
              Le dossier nomme les fichiers, tables, API et contrôles réellement concernés. Il
              n'écrit rien : il devra franchir le pipeline.
            </p>
            <textarea
              value={besoin}
              onChange={(e) => setBesoin(e.target.value)}
              rows={3}
              placeholder="Décris le besoin ou l'anomalie…"
              className="mt-2 w-full rounded-xl border border-black/10 p-2 text-sm outline-none focus:border-[#8B7500]"
            />
            <button
              type="button"
              disabled={proposer.isPending || besoin.trim().length < 10}
              onClick={() => proposer.mutate({ besoin: besoin.trim(), sessionId })}
              className="mt-2 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              {proposer.isPending ? "Analyse…" : "Analyser et ouvrir le dossier"}
            </button>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Demander l'écriture du correctif
            </h2>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="text-[12px] text-black/55">
                Dossier n°
                <input
                  value={dossierId}
                  onChange={(e) => setDossierId(e.target.value.replace(/\D/g, ""))}
                  className="ml-2 w-24 rounded-lg border border-black/10 px-2 py-1 text-sm"
                />
              </label>
              <input
                value={consigne}
                onChange={(e) => setConsigne(e.target.value)}
                placeholder="Consigne précise (facultatif)"
                className="min-w-[220px] flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                disabled={coder.isPending || dossierId.length === 0}
                onClick={() =>
                  coder.mutate({
                    devRequestId: Number(dossierId),
                    consigne: consigne.trim() || undefined,
                    sessionId,
                  })
                }
                className="rounded-xl bg-[#8B7500] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                {coder.isPending ? "Écriture…" : "Écrire le code"}
              </button>
            </div>
            {codeProduit ? (
              <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl bg-[#0F0F0F] p-3 text-[11px] leading-relaxed text-[#E6E6E6]">
                {codeProduit}
              </pre>
            ) : null}
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-black/50">
              Journal des commandes
            </h2>
            {(actions.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-black/50">Aucune commande passée.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {(actions.data ?? []).map((a) => (
                  <li key={a.id} className="rounded-xl border border-black/5 px-3 py-2 text-[12px]">
                    <p className="font-bold text-[#111]">
                      {a.commande} — {a.resultat}
                      {a.devRequestId ? ` — dossier #${a.devRequestId}` : ""}
                    </p>
                    <p className="truncate text-black/50">{a.argument}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/admin/commandes"
              className="mt-2 inline-block text-sm font-bold text-[#8B7500] hover:underline"
            >
              Ouvrir le Centre de Commandes
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
