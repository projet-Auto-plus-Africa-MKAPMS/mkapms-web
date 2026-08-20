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
  ChevronLeft,
  Code2,
  Cpu,
  Gauge,
  ListChecks,
  Play,
  Send,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Onglet =
  | "echange"
  | "missions"
  | "autonomie"
  | "capacites"
  | "moteurs"
  | "commandes"
  | "couts"
  | "developpement";

const ONGLETS: { cle: Onglet; label: string }[] = [
  { cle: "echange", label: "Échange" },
  { cle: "missions", label: "Missions" },
  { cle: "autonomie", label: "Autonomie" },
  { cle: "capacites", label: "Capacités" },
  { cle: "moteurs", label: "Moteurs" },
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
