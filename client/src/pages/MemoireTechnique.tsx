/**
 * Points 116-117-118 — Mémoire technique du code (PDG / Direction).
 *
 * Ce que cet écran répond : « si je touche à ce service, qu'est-ce que je mets
 * en jeu ? » et « ce problème, on l'a déjà vu ? ». Il ne montre aucun score :
 * il montre le relevé réel du code, ses angles morts, et les corrections
 * réellement mémorisées.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  Brain,
  ChevronLeft,
  Eye,
  GraduationCap,
  RefreshCw,
  Search,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{titre}</p>
      <p className="mt-1 text-lg font-black text-[#111]">{valeur}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-black/50">{detail}</p> : null}
    </div>
  );
}

export default function MemoireTechnique() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const [message, setMessage] = useState<string | null>(null);
  const [cible, setCible] = useState("");
  const [cibleActive, setCibleActive] = useState<string | null>(null);
  const [probleme, setProbleme] = useState("");
  const [problemeActif, setProblemeActif] = useState<string | null>(null);

  const etat = trpc.codeGraph.etat.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const lecons = trpc.codeGraph.lecons.useQuery(
    { limit: 40 },
    { enabled: !!isDirection, refetchOnWindowFocus: false },
  );
  const classes = trpc.codeGraph.classes.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const impact = trpc.codeGraph.impact.useQuery(
    { cle: cibleActive ?? "" },
    { enabled: !!isDirection && !!cibleActive, refetchOnWindowFocus: false },
  );
  const reconnu = trpc.codeGraph.reconnaitre.useQuery(
    { probleme: problemeActif ?? "" },
    { enabled: !!isDirection && !!problemeActif, refetchOnWindowFocus: false },
  );

  const observer = trpc.codeGraph.observer.useMutation({
    onSuccess: (r) => {
      setMessage(r.motif);
      etat.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const apprendre = trpc.codeGraph.apprendre.useMutation({
    onSuccess: (r) => {
      setMessage(
        `${r.nouvelles} leçon(s) apprise(s), ${r.renforcees} renforcée(s) (journal d'agents : ${r.sources.agent_change}, régressions : ${r.sources.regression}, alertes : ${r.sources.alerte}).`,
      );
      lecons.refetch();
      classes.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const d = etat.data ?? null;
  const snap = d?.snapshot ?? null;

  return (
    <div className="min-h-screen bg-[#f6f6f7] pb-20">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-black/60">
          <ChevronLeft size={16} /> Retour
        </Link>

        <header className="rounded-2xl bg-[#111] p-5 text-white">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <Brain size={20} className="text-[#d4af37]" />
            Mémoire technique du code
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Le relevé est calculé depuis le code réellement déployé : service → moteur → fichiers →
            API → tables → événements → tests → dépendances. Ce qui n&apos;a pas été relevé
            n&apos;est pas deviné : le motif est écrit.
          </p>
        </header>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => observer.mutate()}
            disabled={observer.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <Eye size={15} className={observer.isPending ? "animate-pulse" : ""} />
            Observer le code
          </button>
          <button
            type="button"
            onClick={() => apprendre.mutate()}
            disabled={apprendre.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#111] disabled:opacity-50"
          >
            <GraduationCap size={15} className={apprendre.isPending ? "animate-pulse" : ""} />
            Apprendre des corrections
          </button>
          <button
            type="button"
            onClick={() => {
              etat.refetch();
              lecons.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#111]"
          >
            <RefreshCw size={15} /> Rafraîchir
          </button>
        </div>

        {message ? (
          <p className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-sm text-black/70">
            {message}
          </p>
        ) : null}

        {d && !d.artefact.present ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-black text-[#111]">Relevé du code indisponible</p>
            <p className="mt-1 text-sm text-black/70">{d.artefact.motif}</p>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Carte
            titre="Dernier relevé"
            valeur={snap ? `#${snap.id}` : "aucun"}
            detail={
              snap
                ? `${new Date(snap.generatedAt).toLocaleString("fr-FR")}${snap.perime ? " — périmé" : ""}`
                : "jamais ingéré"
            }
          />
          <Carte titre="Fichiers relevés" valeur={String(snap?.stats.fichiers ?? 0)} />
          <Carte
            titre="Moteurs / tables"
            valeur={`${snap?.stats.moteurs ?? 0} / ${snap?.stats.tables ?? 0}`}
          />
          <Carte
            titre="Liens du graphe"
            valeur={String(snap?.stats.aretes ?? 0)}
            detail="dépendances réelles"
          />
        </div>

        {d && (d.moteursSansTest.length > 0 || d.tablesOrphelines.length > 0) ? (
          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="flex items-center gap-2 text-sm font-black text-[#111]">
              <AlertTriangle size={16} className="text-amber-600" /> Angles morts du code
            </h2>
            {d.moteursSansTest.length > 0 ? (
              <p className="mt-2 text-[12px] text-black/70">
                <span className="font-bold">Moteurs qu&apos;aucun contrôle ne prouve :</span>{" "}
                {d.moteursSansTest.join(", ")}
              </p>
            ) : null}
            {d.tablesOrphelines.length > 0 ? (
              <p className="mt-2 text-[12px] text-black/70">
                <span className="font-bold">Tables sans module propriétaire :</span>{" "}
                {d.tablesOrphelines.join(", ")}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
          <h2 className="text-sm font-black text-[#111]">
            Ce qu&apos;un changement met en jeu (point 117)
          </h2>
          <div className="mt-2 flex gap-2">
            <input
              value={cible}
              onChange={(e) => setCible(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && cible.trim().length > 1) setCibleActive(cible.trim());
              }}
              placeholder="paiement, seo, moteur:payment_engine, table:annonces…"
              className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => cible.trim().length > 1 && setCibleActive(cible.trim())}
              className="inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white"
            >
              <Search size={15} /> Analyser
            </button>
          </div>
          {impact.data ? (
            impact.data.trouve ? (
              <div className="mt-3 space-y-1 text-[12px] text-black/70">
                <p className="font-bold text-[#111]">
                  {impact.data.label} ({impact.data.type})
                </p>
                <p>Fichiers : {impact.data.fichiers.length || "aucun relevé"}</p>
                <p>API : {impact.data.api.join(", ") || "aucune"}</p>
                <p>Tables : {impact.data.tables.join(", ") || "aucune"}</p>
                <p>Événements : {impact.data.evenements.join(", ") || "aucun"}</p>
                <p>Contrôles qui le prouvent : {impact.data.tests.join(", ") || "aucun"}</p>
                <p>Routes servies : {impact.data.routes.join(", ") || "aucune"}</p>
                <p>Dépend de : {impact.data.dependances.join(", ") || "rien"}</p>
                <p>Dont dépendent : {impact.data.dependants.join(", ") || "rien"}</p>
                {impact.data.avertissements.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {impact.data.avertissements.map((a) => (
                      <li key={a} className="rounded-lg bg-amber-50 p-2 text-amber-900">
                        {a}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-[12px] text-black/60">
                Rien de relevé sous cette clé : le périmètre doit être confirmé avant toute
                modification.
              </p>
            )
          ) : null}
        </section>

        <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
          <h2 className="text-sm font-black text-[#111]">
            « Ce problème, on l&apos;a déjà vu ? » (point 118)
          </h2>
          <div className="mt-2 flex gap-2">
            <input
              value={probleme}
              onChange={(e) => setProbleme(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && probleme.trim().length > 2)
                  setProblemeActif(probleme.trim());
              }}
              placeholder="Décris l'anomalie constatée…"
              className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => probleme.trim().length > 2 && setProblemeActif(probleme.trim())}
              className="inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white"
            >
              <Search size={15} /> Vérifier
            </button>
          </div>
          {reconnu.data ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-black/70">{reconnu.data.verdict}</p>
              {reconnu.data.lecons.map((l) => (
                <div key={l.id} className="rounded-xl border border-black/5 bg-[#fafafa] p-3">
                  <p className="text-[12px] font-bold text-[#111]">{l.probleme}</p>
                  {l.proposition ? (
                    <p className="mt-1 text-[12px] text-black/60">Correctif : {l.proposition}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-black/40">
                    {l.source} · validation {l.validation} ·{" "}
                    {new Date(l.lastSeenAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {classes.data && classes.data.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black text-[#111]">Classes d&apos;anomalies mémorisées</h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {classes.data.map((c) => (
                <li
                  key={c.classe}
                  className="flex items-center justify-between rounded-xl border border-black/5 bg-[#fafafa] px-3 py-2 text-[12px]"
                >
                  <span className="font-bold text-[#111]">{c.classe}</span>
                  <span className="text-black/50">
                    {c.occurrences} occurrence(s) · {c.lecons} leçon(s)
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {d && d.observations.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black text-[#111]">
              Ce que l&apos;agent a observé au dernier relevé (point 116)
            </h2>
            <ul className="mt-2 space-y-2">
              {d.observations.map((o) => (
                <li key={`${o.kind}-${o.key}`} className="text-[12px] text-black/70">
                  <span
                    className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      o.kind === "ajout"
                        ? "bg-emerald-100 text-emerald-800"
                        : o.kind === "suppression"
                          ? "bg-red-100 text-red-800"
                          : "bg-black/5 text-black/60"
                    }`}
                  >
                    {o.kind}
                  </span>
                  {o.comprehension}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {lecons.data && lecons.data.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
            <h2 className="text-sm font-black text-[#111]">
              Corrections mémorisées (problème → proposition → résultat)
            </h2>
            <ul className="mt-2 space-y-2">
              {lecons.data.map((l) => (
                <li key={l.id} className="rounded-xl border border-black/5 bg-[#fafafa] p-3">
                  <p className="text-[12px] font-bold text-[#111]">{l.probleme}</p>
                  <p className="mt-1 text-[12px] text-black/60">
                    {l.proposition ?? "aucune proposition enregistrée"}
                  </p>
                  <p className="mt-1 text-[11px] text-black/40">
                    {l.classe} · {l.source} · {l.occurrences} occurrence(s) ·{" "}
                    {l.resultat ?? "résultat non consigné"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
