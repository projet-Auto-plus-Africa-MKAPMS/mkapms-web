import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, ChevronDown, AlertTriangle, Lock, Eye } from "lucide-react";
import { trpc } from "../../lib/trpc";

const ACTIONS_HAUTE = ["login_failed", "delete", "refuse", "resolveSuspect"];
const ACTIONS_MOYENNE = ["block", "report", "moderat", "decide"];

function niveau(action: string): "haute" | "moyenne" | "info" {
  if (ACTIONS_HAUTE.some((a) => action.includes(a))) return "haute";
  if (ACTIONS_MOYENNE.some((a) => action.includes(a))) return "moyenne";
  return "info";
}

/**
 * Sécurité (/superadmin/admin-securite).
 *
 * Données réelles : trpc.admin.auditLog (server/audit.ts, table audit_logs)
 * — le même journal de traçabilité « radar Direction » (§11) déjà alimenté
 * par logAction() à chaque action sensible (connexion, échec de connexion,
 * blocage, suppression, modération…), jamais un second registre inventé.
 * Aucun bouton "Bloquer" : aucune capacité de suspension de compte n'existe
 * réellement sur la plateforme (voir tâche dédiée) — un bouton qui
 * n'écrirait rien de réel serait un nouveau bouton fantôme.
 */
export default function AdminSecurite() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const logs = trpc.admin.auditLog.useQuery({ limit: 100 });

  const liste = logs.data ?? [];
  const dansLes24h = liste.filter((l) => l.createdAt && Date.now() - new Date(l.createdAt).getTime() < 24 * 3600 * 1000);
  const counts = {
    critiques: liste.filter((l) => niveau(l.action) === "haute").length,
    recentes: dansLes24h.length,
    total: liste.length,
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Sécurité</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Sensibles", v: counts.critiques, c: "text-red-500" },
          { l: "Dernières 24h", v: counts.recentes, c: "text-amber-500" },
          { l: "Journalisées", v: counts.total, c: "text-slate-500" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </div>
        ))}
      </div>

      {logs.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((e) => {
          const isExp = expanded === e.id;
          const niv = niveau(e.action);
          return (
            <div key={e.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : e.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${niv === "haute" ? "bg-red-50" : niv === "moyenne" ? "bg-amber-50" : "bg-slate-50"}`}>
                  {niv === "haute" ? <AlertTriangle size={14} className="text-red-500" /> : niv === "moyenne" ? <Lock size={14} className="text-amber-500" /> : <Eye size={14} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{e.action}</p>
                  <p className="text-[10px] text-[#6B7280]">{e.actorEmail ?? (e.actorId ? `Utilisateur #${e.actorId}` : "Système")}{e.createdAt ? ` · ${new Date(e.createdAt).toLocaleString("fr-FR")}` : ""}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 text-[10px] text-[#6B7280] space-y-1">
                  {e.entityType && <p>Cible : {e.entityType}{e.entityId ? ` #${e.entityId}` : ""}</p>}
                  {e.ipAddress && <p>IP : {e.ipAddress}</p>}
                  {e.userAgent && <p className="truncate">Appareil : {e.userAgent}</p>}
                  {e.metadata !== null && (
                    <pre className="whitespace-pre-wrap break-words bg-[#F5F3EF] rounded-lg p-2 mt-1">{JSON.stringify(e.metadata, null, 2)}</pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!logs.isLoading && liste.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-8">Aucun événement journalisé.</p>
        )}
      </div>
    </div>
  );
}
