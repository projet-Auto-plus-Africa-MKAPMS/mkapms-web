/**
 * Centre de contrôle générique pour un moteur MOS (Identity, Country,
 * Language, Permission, …). Consomme le tRPC `X.dashboard` du moteur
 * ciblé, sans dupliquer aucune logique métier.
 *
 * Accessible : PDG (super_admin) et Directeur (admin) — permission_engine
 * classique côté serveur, cette page ne fait que lire.
 */
import { Navigate, Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { Activity, ChevronLeft, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";

type EngineKey = "identity" | "country" | "language" | "permissionEngine" | "notificationOs" | "documentOs";

/** Mapping moteur → configuration d'affichage. */
const ENGINE_CONFIG: Record<EngineKey, {
  namespace: string;
  label: string;
  color: string;
  tagline: string;
}> = {
  identity: {
    namespace: "identity",
    label: "Identity OS",
    color: "from-violet-500 to-indigo-600",
    tagline: "Identités · Sessions · MFA · Vérifications · Agents Intelligence",
  },
  country: {
    namespace: "country",
    label: "Country OS",
    color: "from-emerald-500 to-teal-600",
    tagline: "Registre mondial des pays — langues, devises, TVA, univers",
  },
  language: {
    namespace: "language",
    label: "Language OS",
    color: "from-sky-500 to-blue-600",
    tagline: "Toutes les langues du monde · Traductions · Préférences utilisateur",
  },
  permissionEngine: {
    namespace: "permissionEngine",
    label: "Permission OS",
    color: "from-amber-500 to-orange-600",
    tagline: "Permissions classiques + intelligentes contextuelles (2 niveaux)",
  },
  notificationOs: {
    namespace: "notificationOs",
    label: "Notification OS",
    color: "from-pink-500 to-rose-600",
    tagline: "Multi-canaux (email, SMS, push, in-app) · Templates multi-langues",
  },
  documentOs: {
    namespace: "documentOs",
    label: "Document OS",
    color: "from-slate-600 to-gray-800",
    tagline: "Factures · Contrats · Devis · Templates multi-langues par pays",
  },
};

/**
 * Utilitaire d'accès dynamique au sous-router tRPC via `namespace`.
 * Chaque moteur MOS expose : meta, healthStatus, dashboard.
 */
function useEngineData(engine: EngineKey) {
  const ns = (trpc as any)[engine];
  const metaQ = ns?.meta?.useQuery(undefined, { staleTime: 60_000 });
  const dashQ = ns?.dashboard?.useQuery(undefined, { staleTime: 15_000, refetchInterval: 30_000 });
  const healthQ = ns?.healthStatus?.useQuery(undefined, { staleTime: 15_000, refetchInterval: 30_000 });
  return { metaQ, dashQ, healthQ };
}

export default function EngineControlCenter({ engineKey }: { engineKey: EngineKey }) {
  const { user } = useAuth();
  const conf = ENGINE_CONFIG[engineKey];
  const { metaQ, dashQ, healthQ } = useEngineData(engineKey);

  // Réservé PDG + Directeur (ces rôles = super_admin | admin | directeur).
  const isAllowed = useMemo(() => {
    const r = user?.role;
    return r === "super_admin" || r === "admin" || r === "directeur";
  }, [user]);
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAllowed) return <Navigate to="/" replace />;

  const meta = metaQ?.data as any;
  const dash = dashQ?.data as any;
  const health = healthQ?.data as any;
  const loading = metaQ?.isLoading || dashQ?.isLoading;

  const refresh = () => {
    metaQ?.refetch();
    dashQ?.refetch();
    healthQ?.refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16" data-testid={`engine-control-${engineKey}`}>
      <div className={`bg-gradient-to-r ${conf.color} text-white`}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link to="/admin/moteurs" className="inline-flex items-center gap-1 text-white/80 text-xs hover:text-white mb-3">
            <ChevronLeft className="h-3 w-3" /> Retour aux moteurs
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{conf.label}</h1>
              <p className="text-sm text-white/80 mt-1">{conf.tagline}</p>
              {meta && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs">
                    v{meta.version}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs">
                    {String(meta.maturityLevel ?? "").replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={refresh}
              className="rounded-full bg-white/20 hover:bg-white/30 p-2"
              data-testid={`refresh-${engineKey}`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-4">
        {/* Cartes de synthèse : santé + version + statut */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Santé"
            value={health?.status ?? "…"}
            hint={health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString("fr-FR") : ""}
            tone={health?.status === "ok" ? "green" : health?.status === "degraded" ? "amber" : "red"}
          />
          <StatCard
            icon={<Sparkles className="h-5 w-5" />}
            label="Maturité"
            value={meta?.maturityLevel ? String(meta.maturityLevel).replace(/_/g, " ") : "…"}
            hint={meta?.contract ?? ""}
            tone="blue"
          />
          <StatCard
            icon={<ShieldAlert className="h-5 w-5" />}
            label="Statut"
            value={dash?.status ?? "…"}
            hint={dash?.lastSyncAt ? `Sync ${new Date(dash.lastSyncAt).toLocaleTimeString("fr-FR")}` : ""}
            tone="violet"
          />
        </div>

        {/* Métriques métier */}
        {dash?.businessMetrics && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Métriques métier</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(dash.businessMetrics).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 border border-slate-100 p-4" data-testid={`metric-${k}`}>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{k.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{String(v ?? "—")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance / charge */}
        {dash?.load && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MiniStat label="Événements (5 min)" value={dash.load.events5m} />
            <MiniStat label="Événements (24 h)" value={dash.load.events24h} />
            <MiniStat label="Temps de réponse" value={`${dash.performance?.lastResponseMs ?? 0} ms`} />
          </div>
        )}

        {/* Événements récents */}
        {dash?.recentEvents?.length ? (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Événements récents</h2>
            <ul className="divide-y divide-slate-100">
              {dash.recentEvents.slice(0, 12).map((e: any, i: number) => (
                <li key={i} className="py-2 flex items-start justify-between gap-4 text-sm">
                  <span className="font-mono text-xs text-slate-600 truncate">{e.action}</span>
                  <span className="text-[11px] text-slate-400 shrink-0">{new Date(e.at).toLocaleString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Erreurs récentes */}
        {dash?.recentErrors?.length ? (
          <div className="mt-6 bg-white rounded-2xl border border-red-200 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-600 mb-4">Erreurs récentes</h2>
            <ul className="divide-y divide-red-50">
              {dash.recentErrors.slice(0, 10).map((e: any, i: number) => (
                <li key={i} className="py-2 text-sm text-red-700">
                  <span className="font-mono text-xs">{new Date(e.at).toLocaleString("fr-FR")}</span> — {e.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Meta */}
        {meta && (
          <div className="mt-6 text-xs text-slate-500 bg-white rounded-xl border border-slate-200 p-4">
            <p><b>Contrat</b> : <code>{meta.contract}</code></p>
            <p><b>Version</b> : {meta.version} — {meta.maturityLevel}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sous-composants ─────────────────────────────────────────────────────
function StatCard({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint?: string; tone: "green" | "amber" | "red" | "blue" | "violet" }) {
  const bg = {
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    red: "bg-red-50 border-red-200 text-red-700",
    blue: "bg-sky-50 border-sky-200 text-sky-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
  }[tone];
  return (
    <div className={`rounded-2xl border ${bg} p-4 shadow-sm`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-70">
        {icon} {label}
      </div>
      <p className="mt-1 text-lg font-bold">{value}</p>
      {hint && <p className="text-[11px] opacity-60 mt-0.5">{hint}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{String(value ?? "—")}</p>
    </div>
  );
}
