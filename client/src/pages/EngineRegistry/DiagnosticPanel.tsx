/**
 * Panneau de diagnostic & remédiation — moteurs dégradés / HS.
 *
 * Répond à la question « pourquoi ce moteur est-il rouge / orange ? ».
 * Affiche : cause exacte (tables manquantes, dépendances KO, feed injoignable),
 * recommandation humaine, et bouton « Relancer la sonde » (PDG uniquement).
 *
 * S'appuie sur `trpc.engineRegistry.diagnose` — aucune duplication avec le
 * reste du Centre.
 */
import { AlertTriangle, RefreshCw, Wrench } from "lucide-react";
import { useState } from "react";
import { trpc } from "../../lib/trpc";

interface Props {
  isPdg: boolean;
}

export function DiagnosticPanel({ isPdg }: Props) {
  const diag = trpc.engineRegistry.diagnose.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const utils = trpc.useUtils();
  const retry = trpc.engineRegistry.retrySupervision.useMutation({
    onSettled: () => {
      utils.engineRegistry.diagnose.invalidate();
      utils.engineRegistry.list.invalidate();
      utils.engineRegistry.stats.invalidate();
    },
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  if (diag.isLoading) {
    return (
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Diagnostic en cours…</p>
      </div>
    );
  }
  const all = diag.data ?? [];
  const problems = all.filter((d) => d.health === "degraded" || d.health === "down");

  if (problems.length === 0) {
    return (
      <div
        data-testid="engine-diagnostic-empty"
        className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-emerald-800">
          Tous les moteurs remontent une santé nominale. Aucun diagnostic à afficher.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="engine-diagnostic-panel"
      className="mb-4 rounded-2xl border border-amber-300 bg-amber-50/60 p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-700" />
        <h2 className="text-sm font-black text-amber-900">
          Diagnostic — {problems.length} moteur(s) à surveiller
        </h2>
      </div>
      <ul className="space-y-2">
        {problems.map((d) => {
          const isOpen = expanded === d.name;
          const badgeTone =
            d.health === "down"
              ? "bg-rose-100 text-rose-700"
              : "bg-amber-100 text-amber-800";
          return (
            <li
              key={d.name}
              data-testid={`engine-diagnostic-row-${d.name}`}
              className="rounded-xl border border-amber-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-900">
                      {d.label ?? d.name}
                    </span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${badgeTone}`}
                    >
                      {d.health}
                    </span>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {d.supervisionSource}
                    </span>
                  </div>
                  {d.recommendation && (
                    <p className="mt-1 text-xs text-slate-700">
                      <span className="font-semibold text-amber-800">→ </span>
                      {d.recommendation}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setExpanded(isOpen ? null : d.name)}
                    className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    data-testid={`engine-diagnostic-toggle-${d.name}`}
                  >
                    {isOpen ? "Masquer" : "Détails"}
                  </button>
                  {isPdg && d.actionable.canRetry && (
                    <button
                      onClick={() => retry.mutate({ name: d.name })}
                      disabled={retry.isPending && retry.variables?.name === d.name}
                      className="flex items-center gap-1 rounded-lg bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                      data-testid={`engine-diagnostic-retry-${d.name}`}
                    >
                      {retry.isPending && retry.variables?.name === d.name ? (
                        <RefreshCw size={11} className="animate-spin" />
                      ) : (
                        <Wrench size={11} />
                      )}
                      {d.actionable.retryLabel ?? "Retenter"}
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="mt-2 space-y-2 border-t border-amber-100 pt-2 text-xs text-slate-700">
                  {d.lastMessage && (
                    <div>
                      <span className="font-semibold text-slate-800">Dernier message :</span>{" "}
                      <span className="text-slate-600">{d.lastMessage}</span>
                    </div>
                  )}
                  {d.probe && (
                    <div>
                      <span className="font-semibold text-slate-800">
                        Sonde base de données :
                      </span>{" "}
                      <span className="text-slate-600">
                        {d.probe.tablesReachable}/{d.probe.tablesExpected} table(s) accessible(s)
                      </span>
                      {d.probe.missing.length > 0 && (
                        <div className="mt-1">
                          <span className="font-semibold text-rose-700">
                            Tables manquantes :
                          </span>{" "}
                          <span className="font-mono text-[11px] text-rose-800">
                            {d.probe.missing.join(", ")}
                          </span>
                        </div>
                      )}
                      {d.probe.failed.length > 0 && (
                        <div className="mt-1">
                          <span className="font-semibold text-rose-700">
                            Requêtes en échec :
                          </span>{" "}
                          <span className="font-mono text-[11px] text-rose-800">
                            {d.probe.failed.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {d.dependencies.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-800">Dépendances :</span>
                      <ul className="ml-3 mt-1 space-y-0.5">
                        {d.dependencies.map((dep) => {
                          const okTone = dep.present && dep.active && dep.health === "ok";
                          return (
                            <li key={dep.name} className="flex items-center gap-2">
                              <span
                                className={`inline-block h-1.5 w-1.5 rounded-full ${
                                  okTone
                                    ? "bg-emerald-500"
                                    : !dep.present
                                      ? "bg-rose-500"
                                      : "bg-amber-500"
                                }`}
                              />
                              <span className="font-mono text-[11px]">{dep.name}</span>
                              <span className="text-[11px] text-slate-500">
                                {!dep.present
                                  ? "absente"
                                  : !dep.active
                                    ? "inactive"
                                    : dep.health}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
