/**
 * Points 108-113 — Contrôle continu (PDG / Direction).
 *
 * Cet écran ne montre pas un pourcentage : il montre, contrôle par contrôle, ce
 * qui était attendu et ce qui a été observé. Un contrôle non exécutable est
 * « ignoré », jamais « réussi », et une régression est nommée.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  MinusCircle,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  XCircle,
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

function Pastille({ statut }: { statut: string }) {
  if (statut === "reussi")
    return <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />;
  if (statut === "echec") return <XCircle size={16} className="mt-0.5 shrink-0 text-red-600" />;
  return <MinusCircle size={16} className="mt-0.5 shrink-0 text-black/30" />;
}

export default function CentreControleContinu() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const [message, setMessage] = useState<string | null>(null);

  const etat = trpc.continuousTest.etat.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const catalogue = trpc.continuousTest.catalogue.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const verrou = trpc.continuousTest.verrouDeploiement.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const campagnes = trpc.continuousTest.campagnes.useQuery(
    { limit: 8 },
    { enabled: !!isDirection, refetchOnWindowFocus: false },
  );

  const executer = trpc.continuousTest.executer.useMutation({
    onSuccess: (r) => {
      setMessage(
        `Campagne #${r.runId} : ${r.reussis} réussi(s), ${r.echecs} échec(s), ${r.ignores} ignoré(s), ${r.regressions} régression(s).`,
      );
      etat.refetch();
      verrou.refetch();
      campagnes.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const data = etat.data ?? null;
  const run = data?.dernierRun ?? null;
  const regressions = (data?.resultats ?? []).filter((r) => r.regression);

  return (
    <div className="min-h-screen bg-[#f6f6f7] pb-20">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-black/60">
          <ChevronLeft size={16} /> Retour
        </Link>

        <header className="rounded-2xl bg-[#111] p-5 text-white">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <ShieldCheck size={20} className="text-[#d4af37]" />
            Contrôle continu — ce qui est réellement vérifié
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Chaque contrôle s&apos;exécute sur la plateforme en service et écrit ce qu&apos;il a
            observé. Un contrôle qui ne peut pas s&apos;exécuter est marqué « ignoré », jamais
            « réussi » : un prérequis manquant n&apos;est pas une preuve de bon fonctionnement.
          </p>
        </header>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => executer.mutate({ portee: "complet" })}
            disabled={executer.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <PlayCircle size={15} className={executer.isPending ? "animate-pulse" : ""} />
            Lancer une campagne complète
          </button>
          <button
            type="button"
            onClick={() => {
              etat.refetch();
              verrou.refetch();
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

        {verrou.data ? (
          <div
            className={`mt-4 rounded-2xl border p-4 ${
              verrou.data.autorise
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <p className="text-sm font-black text-[#111]">
              {verrou.data.autorise
                ? "Déploiement autorisé par les contrôles"
                : "Déploiement non couvert par les contrôles"}
            </p>
            <p className="mt-1 text-sm text-black/70">{verrou.data.motif}</p>
            {verrou.data.bloquants.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {verrou.data.bloquants.map((b) => (
                  <li key={b.scenario} className="text-[12px] text-black/70">
                    <span className="font-bold">{b.label}</span> — {b.observe}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Carte
            titre="Dernière campagne"
            valeur={run ? `#${run.id}` : "aucune"}
            detail={run ? new Date(run.date).toLocaleString("fr-FR") : "jamais exécutée"}
          />
          <Carte titre="Réussis" valeur={String(run?.reussis ?? 0)} />
          <Carte titre="Échecs" valeur={String(run?.echecs ?? 0)} detail="défauts réels" />
          <Carte
            titre="Ignorés"
            valeur={String(run?.ignores ?? 0)}
            detail="prérequis manquant"
          />
          <Carte
            titre="Régressions"
            valeur={String(run?.regressions ?? 0)}
            detail="passait avant"
          />
        </div>

        {regressions.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
            <h2 className="flex items-center gap-2 text-sm font-black text-[#111]">
              <AlertTriangle size={16} className="text-red-600" /> Régressions — cela fonctionnait
              avant
            </h2>
            <ul className="mt-2 space-y-2">
              {regressions.map((r) => (
                <li key={r.scenario} className="text-[12px] text-black/70">
                  <span className="font-bold">{r.label}</span> — {r.observe}
                  {r.regression ? (
                    <span className="block text-black/50">
                      Dernier passage réussi : {new Date(r.regression.depuis).toLocaleString("fr-FR")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
          <h2 className="text-sm font-black text-[#111]">Couverture par moteur</h2>
          <p className="mt-1 text-[12px] text-black/50">
            Un moteur n&apos;est « prouvé » que si tous ses contrôles exécutables passent.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(data?.couverture ?? []).map((c) => (
              <div
                key={c.domaine}
                className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-bold text-[#111]">{c.domaine}</p>
                  <p className="text-[11px] text-black/50">
                    {c.scenarios} contrôle(s) · {c.reussis} réussi(s) · {c.echecs} échec(s) ·{" "}
                    {c.ignores} ignoré(s)
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    c.prouve
                      ? "bg-emerald-100 text-emerald-700"
                      : c.echecs > 0
                        ? "bg-red-100 text-red-700"
                        : "bg-black/5 text-black/50"
                  }`}
                >
                  {c.prouve ? "prouvé" : c.echecs > 0 ? "en échec" : "non prouvé"}
                </span>
              </div>
            ))}
          </div>
          {(data?.nonCouverts ?? []).length > 0 ? (
            <p className="mt-3 text-[12px] text-black/60">
              <span className="font-bold">Aucun contrôle ne couvre encore :</span>{" "}
              {(data?.nonCouverts ?? []).join(", ")}. Ces moteurs restent des angles morts —
              l&apos;écran le dit plutôt que de les compter comme sains.
            </p>
          ) : null}
        </section>

        <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
          <h2 className="text-sm font-black text-[#111]">Résultats du dernier contrôle</h2>
          {(data?.resultats ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-black/60">
              Aucune campagne exécutée : rien ne prouve encore que la plateforme fonctionne.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(data?.resultats ?? []).map((r) => (
                <li key={r.scenario} className="flex gap-2 rounded-xl border border-black/5 p-3">
                  <Pastille statut={r.statut} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111]">
                      {r.label}
                      {r.criticite === "critique" ? (
                        <span className="ml-2 rounded-full bg-[#111] px-2 py-0.5 text-[10px] font-bold text-[#d4af37]">
                          critique
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[12px] text-black/60">
                      <span className="font-semibold">Attendu :</span> {r.attendu}
                    </p>
                    <p className="text-[12px] text-black/70">
                      <span className="font-semibold">Observé :</span> {r.observe}
                    </p>
                    <p className="mt-0.5 text-[11px] text-black/40">
                      {r.domaine} · {r.scenario} · {r.dureeMs} ms
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
          <h2 className="text-sm font-black text-[#111]">Contrôles au catalogue</h2>
          <ul className="mt-2 space-y-1">
            {(catalogue.data ?? []).map((s) => (
              <li key={s.id} className="text-[12px] text-black/60">
                <span className="font-bold text-[#111]">{s.label}</span> — {s.attendu}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
          <h2 className="text-sm font-black text-[#111]">Campagnes précédentes</h2>
          <ul className="mt-2 space-y-1">
            {(campagnes.data ?? []).map((c) => (
              <li key={c.id} className="text-[12px] text-black/60">
                #{c.id} · {new Date(c.finishedAt ?? c.startedAt).toLocaleString("fr-FR")} ·{" "}
                {c.trigger} · {c.reussis} réussi(s), {c.echecs} échec(s), {c.ignores} ignoré(s),{" "}
                {c.regressions} régression(s) · {c.dureeMs} ms
              </li>
            ))}
            {(campagnes.data ?? []).length === 0 ? (
              <li className="text-[12px] text-black/50">Aucune campagne enregistrée.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
