/**
 * Points 104-107 — Bus d'événements central (PDG / Direction).
 *
 * Publier n'est pas remettre. Cet écran montre les deux séparément : ce qui a
 * été publié, ce qui a été réellement remis à chaque moteur abonné, et ce qui
 * n'a atteint personne.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AlertTriangle, ChevronLeft, Radio, RefreshCw, Send } from "lucide-react";
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

export default function CentreBusEvenements() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const [message, setMessage] = useState<string | null>(null);

  const obs = trpc.eventBus.observabilite.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const passes = trpc.eventBus.passes.useQuery(
    { limit: 5 },
    { enabled: !!isDirection, refetchOnWindowFocus: false },
  );

  const distribuer = trpc.eventBus.distribuer.useMutation({
    onSuccess: (r) => {
      setMessage(
        `${r.evenements} événement(s) repris : ${r.remises} remise(s), ${r.echecs} échec(s), ${r.orphelins} orphelin(s).`,
      );
      obs.refetch();
      passes.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const basculer = trpc.eventBus.basculerAbonnement.useMutation({
    onSuccess: () => obs.refetch(),
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const data = obs.data ?? null;

  return (
    <div className="min-h-screen bg-[#f6f6f7] pb-20">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-black/60">
          <ChevronLeft size={16} /> Retour
        </Link>

        <header className="rounded-2xl bg-[#111] p-5 text-white">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <Radio size={20} className="text-[#d4af37]" />
            Bus d&apos;événements — ce qui circule entre les moteurs
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Un moteur n&apos;écrit jamais dans les tables d&apos;un autre : il publie, le bus
            remet. Publier n&apos;est pas remettre — les deux sont comptés séparément, et un
            événement que personne n&apos;écoute est affiché comme orphelin.
          </p>
        </header>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => distribuer.mutate({ limit: 100 })}
            disabled={distribuer.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <Send size={15} className={distribuer.isPending ? "animate-pulse" : ""} />
            Reprendre les événements en souffrance
          </button>
          <button
            type="button"
            onClick={() => obs.refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#111]"
          >
            <RefreshCw size={15} /> Actualiser
          </button>
        </div>

        {message ? (
          <p className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-sm text-black/70">
            {message}
          </p>
        ) : null}

        {data ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Carte titre="Publiés (7 j)" valeur={String(data.totaux.publies7j)} />
              <Carte titre="Remis (7 j)" valeur={String(data.totaux.remises7j)} />
              <Carte titre="Échecs (7 j)" valeur={String(data.totaux.echecs7j)} />
              <Carte
                titre="En souffrance"
                valeur={String(data.totaux.enAttente)}
                detail="publiés, jamais remis"
              />
            </div>

            <section className="mt-6">
              <h2 className="mb-2 text-sm font-black text-[#111]">Types d&apos;événements</h2>
              <div className="space-y-2">
                {data.types.map((t) => (
                  <div key={t.code} className="rounded-2xl border border-black/5 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#111]">{t.label}</p>
                        <p className="font-mono text-[11px] text-black/40">{t.code}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-black/50">
                        {t.publies7j} publié(s) / 7 j
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-black/60">{t.description}</p>
                    {t.orphelin ? (
                      <p className="mt-2 flex items-center gap-1 text-[12px] font-medium text-orange-700">
                        <AlertTriangle size={13} /> Aucun moteur n&apos;écoute ce type : publier ne
                        produirait aucun effet.
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] text-black/50">
                        Écouté par : {t.abonnes.join(", ")}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-black/40">
                      Champs exigés : {t.champs.join(", ") || "aucun"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="mb-2 text-sm font-black text-[#111]">Abonnements</h2>
              <div className="space-y-2">
                {data.abonnements.map((a) => (
                  <div
                    key={`${a.engine}-${a.eventType}`}
                    className="rounded-2xl border border-black/5 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-[#111]">
                        {a.engine} ← <span className="font-mono text-[12px]">{a.eventType}</span>
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${a.actif ? "bg-emerald-50 text-emerald-700" : "bg-black/5 text-black/50"}`}
                      >
                        {a.actif ? "actif" : "suspendu"}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-black/60">{a.effet}</p>
                    <p className="mt-1 text-[11px] text-black/45">
                      {a.remises7j} remise(s) · {a.echecs7j} échec(s) sur 7 jours
                      {a.dernierUsage
                        ? ` — dernière le ${new Date(a.dernierUsage).toLocaleString("fr-FR")}`
                        : " — jamais sollicité"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {data.enSouffrance.length > 0 ? (
              <section className="mt-6">
                <h2 className="mb-2 text-sm font-black text-[#111]">
                  Événements publiés mais non remis
                </h2>
                <div className="space-y-2">
                  {data.enSouffrance.map((e) => (
                    <div key={e.id} className="rounded-2xl border border-black/5 bg-white p-3">
                      <p className="text-[12px] font-bold text-[#111]">
                        {e.type} <span className="font-normal text-black/40">via {e.source}</span>
                      </p>
                      <p className="text-[11px] text-black/50">
                        {new Date(e.createdAt).toLocaleString("fr-FR")} — {e.statut}
                      </p>
                      {e.erreur ? (
                        <p className="mt-1 text-[12px] text-orange-700">{e.erreur}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <p className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm text-black/60">
            Chargement de l&apos;état du bus…
          </p>
        )}

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-black text-[#111]">Dernières passes de distribution</h2>
          {(passes.data ?? []).length === 0 ? (
            <p className="rounded-xl border border-black/10 bg-white p-3 text-sm text-black/60">
              Aucune passe enregistrée.
            </p>
          ) : (
            <div className="space-y-2">
              {(passes.data ?? []).map((p) => (
                <div key={p.id} className="rounded-2xl border border-black/5 bg-white p-3">
                  <p className="text-[12px] font-bold text-[#111]">
                    Passe #{p.id} — {new Date(p.startedAt).toLocaleString("fr-FR")}
                  </p>
                  <p className="text-[11px] text-black/50">
                    {p.evenements} événement(s) · {p.remises} remise(s) · {p.echecs} échec(s) ·{" "}
                    {p.orphelins} orphelin(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-6 text-[11px] text-black/40">
          Un abonnement suspendu n&apos;est jamais désactivé automatiquement : couper une chaîne
          reste une décision humaine.{" "}
          {basculer.isPending ? "Mise à jour en cours…" : ""}
        </p>
      </div>
    </div>
  );
}
