import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Car, Package, Ship, Wallet, FileCheck, CreditCard, Calculator, AlertTriangle, RefreshCcw } from "lucide-react";
import { trpc } from "../../lib/trpc";

/**
 * Direction — Plan Maître Fournisseurs (LOT 1-7).
 *
 * Consomme `engineRegistry.businessDashboard()`, seul point d'agrégation
 * pour les moteurs Fournisseurs/Véhicules/Pièces/Logistique/Versements/
 * Documents. Avant cet écran, ces moteurs — pourtant réels et testés
 * (256 vérifications) — n'avaient AUCUN consommateur : un moteur qui
 * existe et fonctionne mais que personne ne peut voir n'est pas différent,
 * pour la Direction, d'un moteur qui n'existe pas.
 */

const ICONS: Record<string, typeof Truck> = {
  supplier_engine: Truck,
  vehicle_engine: Car,
  parts_engine: Package,
  logistics_engine: Ship,
  payout_engine: Wallet,
  document_engine: FileCheck,
  payment: CreditCard,
  accounting_internal: Calculator,
  financial_intelligence: AlertTriangle,
};

const HEALTH_LABEL: Record<string, { label: string; color: string }> = {
  ok: { label: "Opérationnel", color: "text-green-600 bg-green-50" },
  degraded: { label: "Dégradé", color: "text-amber-600 bg-amber-50" },
  down: { label: "Hors service", color: "text-red-600 bg-red-50" },
  unknown: { label: "Inconnu", color: "text-slate-500 bg-slate-100" },
};

function labelFromKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v.toLocaleString("fr-FR");
  if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v)) return Number(v).toLocaleString("fr-FR");
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    if (v.length === 0) return "Aucun";
    return v.map((item) => formatValue(item)).join(" · ");
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Rendu générique : businessMetrics si le moteur suit le contrat EngineDashboard, sinon aplati brut — jamais une valeur inventée pour combler une forme différente. */
function SectionBody({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") {
    return <p className="text-xs text-white/40">Aucune donnée.</p>;
  }
  const d = data as Record<string, unknown>;
  const metrics = (d.businessMetrics && typeof d.businessMetrics === "object" ? d.businessMetrics : d) as Record<string, unknown>;
  const entries = Object.entries(metrics).filter(([k]) => !["engine", "label", "version", "maturityLevel", "load", "performance", "errors", "lastSyncAt", "status", "recentEvents", "recentErrors", "businessMetrics"].includes(k));
  if (entries.length === 0) {
    return <p className="text-xs text-white/40">Aucune métrique disponible pour ce moteur.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-lg bg-white/5 p-2.5">
          <p className="text-[9px] text-white/40">{labelFromKey(k)}</p>
          <p className="text-sm font-bold text-white">{formatValue(v)}</p>
        </div>
      ))}
    </div>
  );
}

export default function PlanMaitreFournisseurs() {
  const query = trpc.engineRegistry.businessDashboard.useQuery();

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-24">
      <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-purple-400" /> Plan Maître Fournisseurs</h1>
          <button onClick={() => query.refetch()} className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition" title="Actualiser">
            <RefreshCcw size={14} className={`text-white/70 ${query.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="mt-1 text-xs text-white/40">Fournisseurs, véhicules, pièces, logistique, versements, documents — vue Direction, jamais un chiffre recalculé ici.</p>
        {query.data && <p className="mt-1 text-[10px] text-white/30">Actualisé le {new Date(query.data.checkedAt).toLocaleString("fr-FR")}</p>}
      </div>

      {query.isLoading && <p className="px-4 mt-6 text-sm text-white/40">Chargement…</p>}
      {query.isError && <p className="px-4 mt-6 text-sm text-red-400">Données indisponibles : {query.error.message}</p>}

      <div className="px-4 mt-6 space-y-4">
        {query.data?.sections.map((s) => {
          const Icon = ICONS[s.engine] ?? Truck;
          const health = s.ok && s.data && typeof s.data === "object" && "health" in (s.data as object)
            ? String((s.data as { health: string }).health)
            : s.ok ? "unknown" : "down";
          const hl = HEALTH_LABEL[health] ?? HEALTH_LABEL.unknown;
          return (
            <div key={s.engine} className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Icon size={16} className="text-[#D4AF37]" /> {s.label}
                </h2>
                <span className={`rounded-full px-3 py-1 text-[9px] font-bold ${hl.color}`}>{hl.label}</span>
              </div>
              {s.ok ? <SectionBody data={s.data} /> : (
                <p className="text-xs text-red-400">Indisponible : {s.error ?? "erreur inconnue"}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
