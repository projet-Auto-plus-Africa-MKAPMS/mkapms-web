/**
 * Registre & Centre de Contrôle des Moteurs MKA.P-MS
 *
 * Page réservée : PDG (super_admin) et Directeur / Administration (admin).
 *
 * C'est l'écran du « moteur principal » (Core Engine + Registre) : tous les
 * moteurs de la plateforme y sont listés un par un, rangés du plus important
 * au plus petit, avec leur état, leur santé, leur version, leurs dépendances
 * et leur dernier signal (heartbeat).
 *
 * - Lecture : PDG + Directeur (directionProcedure côté serveur).
 * - Contrôle d'état (activer / désactiver / lecture seule / maintenance /
 *   staging) : réservé au PDG (super_admin). Le Directeur voit tout mais ne
 *   peut pas changer l'état d'un moteur.
 *
 * Aucune logique métier des moteurs n'est dupliquée ici : la page consomme
 * uniquement le registre central et les contrats déjà enregistrés.
 */
import { Link, Navigate } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import {
  Cpu,
  ChevronLeft,
  RefreshCw,
  Activity,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

type EngineState = "active" | "read_only" | "maintenance" | "disabled" | "staging";

/**
 * Ordre d'importance des moteurs (les plus gros en haut). Le Core Engine est
 * le moteur principal auquel tous les autres sont connectés, il est donc
 * toujours en tête. Les moteurs inconnus (futurs) passent en bas.
 */
const PRIORITY: Record<string, number> = {
  core: 0,
  smart: 1,
  permission: 2,
  redirection: 3,
  payment: 4,
  search: 5,
  workflow: 6,
  knowledge: 7,
};

/** Route réelle du centre de contrôle dédié de chaque moteur (si elle existe). */
const CONTROL_ROUTE: Record<string, string> = {
  core: "/superadmin/core-engine-beta",
  smart: "/superadmin/smart-engine",
  permission: "/superadmin/permission-engine",
  redirection: "/superadmin/redirection-engine",
};

const STATE_LABEL: Record<EngineState, string> = {
  active: "Actif",
  read_only: "Lecture seule",
  maintenance: "Maintenance",
  disabled: "Désactivé",
  staging: "Préproduction",
};

const STATE_STYLE: Record<EngineState, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  read_only: "bg-sky-100 text-sky-700 border-sky-200",
  maintenance: "bg-amber-100 text-amber-700 border-amber-200",
  disabled: "bg-slate-200 text-slate-600 border-slate-300",
  staging: "bg-violet-100 text-violet-700 border-violet-200",
};

const HEALTH_STYLE: Record<string, string> = {
  ok: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  unknown: "bg-slate-400",
};

const HEALTH_LABEL: Record<string, string> = {
  ok: "En bonne santé",
  degraded: "Dégradé",
  down: "Hors service",
  unknown: "Inconnu",
};

const STATE_ORDER: EngineState[] = [
  "active",
  "read_only",
  "staging",
  "maintenance",
  "disabled",
];

export default function EngineRegistryControlCenter() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";

  const health = trpc.engineRegistry.contractsHealth.useQuery(undefined, {
    enabled: isDirection,
    refetchInterval: 15000,
  });
  const stats = trpc.engineRegistry.stats.useQuery(undefined, {
    enabled: isDirection,
    refetchInterval: 15000,
  });
  const utils = trpc.useUtils();
  const setState = trpc.engineRegistry.setState.useMutation({
    onSettled: () => {
      utils.engineRegistry.contractsHealth.invalidate();
      utils.engineRegistry.stats.invalidate();
    },
  });

  // PDG + Directeur uniquement
  if (!user || !isDirection) {
    return <Navigate to="/" replace />;
  }

  const engines = [...(health.data ?? [])].sort((a, b) => {
    const pa = PRIORITY[a.id] ?? 999;
    const pb = PRIORITY[b.id] ?? 999;
    if (pa !== pb) return pa - pb;
    return a.publicName.localeCompare(b.publicName);
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Cpu size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">
              Registre &amp; Contrôle des Moteurs MKA.P-MS
            </h1>
            <p className="text-xs text-white/50">
              Tous les moteurs connectés au moteur principal (Core) — rangés du plus gros au plus petit.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-5">
        {/* Bandeau rôle */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <StatCard label="Moteurs" value={stats.data?.totalEngines ?? engines.length} />
            <StatCard label="Actifs" value={stats.data?.activeEngines ?? engines.filter((e) => e.state === "active").length} />
            <StatCard
              label="Dégradés / HS"
              value={engines.filter((e) => e.health === "degraded" || e.health === "down").length}
              tone="warn"
            />
          </div>
          <div className="flex items-center gap-2">
            {!isPdg && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700">
                <ShieldAlert size={13} /> Lecture seule (Directeur)
              </span>
            )}
            <button
              onClick={() => {
                health.refetch();
                stats.refetch();
              }}
              className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              <RefreshCw size={12} /> Rafraîchir
            </button>
          </div>
        </div>

        {health.isLoading && (
          <p className="py-10 text-center text-sm text-slate-400">Chargement des moteurs…</p>
        )}

        {!health.isLoading && engines.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Aucun moteur enregistré pour le moment.
          </p>
        )}

        <div className="space-y-3">
          {engines.map((e, idx) => {
            const state = (e.state ?? "disabled") as EngineState;
            const route = CONTROL_ROUTE[e.id];
            return (
              <div
                key={e.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#111] text-xs font-black text-[#D4AF37]">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{e.publicName}</h3>
                        {!e.registered && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                            Non enregistré
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        {e.id} · v{e.registeredVersion ?? e.declaredVersion ?? e.version}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${STATE_STYLE[state]}`}
                    >
                      {STATE_LABEL[state]}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      <span className={`h-2 w-2 rounded-full ${HEALTH_STYLE[e.health] ?? HEALTH_STYLE.unknown}`} />
                      {HEALTH_LABEL[e.health] ?? e.health}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="text-slate-400">Dépendances : </span>
                    {e.dependencies?.length ? e.dependencies.join(", ") : "aucune"}
                  </p>
                  <p className="flex items-center gap-1">
                    <Activity size={11} className="text-slate-400" />
                    <span className="text-slate-400">Dernier signal : </span>
                    {e.lastHeartbeat
                      ? new Date(e.lastHeartbeat).toLocaleString("fr-FR")
                      : "—"}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  {route && (
                    <Link
                      to={route}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#111] px-3 py-1.5 text-xs font-semibold text-[#D4AF37]"
                    >
                      <ExternalLink size={12} /> Centre de contrôle
                    </Link>
                  )}

                  {isPdg ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {STATE_ORDER.filter((s) => s !== state).map((s) => (
                        <button
                          key={s}
                          disabled={setState.isPending}
                          onClick={() => setState.mutate({ name: e.id, state: s })}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {STATE_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Contrôle d'état réservé au PDG.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Les moteurs dédiés à chaque univers et sous-section (Achat, Vente, Location, Pièces,
          Garage, Contrôle technique, Livraison…) apparaîtront ici au fur et à mesure de leur
          création — tous connectés au moteur principal.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-2 ${
        tone === "warn"
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-[11px] ${tone === "warn" ? "text-amber-600" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`text-xl font-black ${tone === "warn" ? "text-amber-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
