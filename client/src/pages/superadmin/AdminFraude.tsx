import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, AlertTriangle, ChevronDown, Check } from "lucide-react";
import { trpc } from "../../lib/trpc";

const SEVERITE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critique", color: "text-red-600", bg: "bg-red-100" },
  important: { label: "Élevé", color: "text-red-600", bg: "bg-red-100" },
  warning: { label: "Moyen", color: "text-amber-500", bg: "bg-amber-50" },
  info: { label: "Faible", color: "text-slate-500", bg: "bg-slate-50" },
};

/**
 * Anti-fraude (/superadmin/admin-fraude).
 *
 * Données réelles : trpc.smartEngine.unresolvedSuspects / resolveSuspect
 * (server/smart-engine/services/fraud-detection.ts, table
 * smart_suspect_accounts) — le même moteur de détection de comptes suspects
 * déjà construit et alimenté par checkFraud(), jamais un second registre
 * inventé. Le bouton "Bloquer" a été retiré : aucune capacité de suspension
 * de compte n'existe réellement sur la plateforme (userStatusEnum est
 * déclaré mais jamais attaché à la table users, et l'authentification ne
 * revérifie jamais l'état en base) — voir tâche dédiée plutôt qu'un bouton
 * qui écrirait quelque chose sans aucun effet réel.
 */
export default function AdminFraude() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const suspects = trpc.smartEngine.unresolvedSuspects.useQuery();
  const resolve = trpc.smartEngine.resolveSuspect.useMutation({
    onSuccess: () => utils.smartEngine.unresolvedSuspects.invalidate(),
  });

  const liste = suspects.data ?? [];
  const counts = {
    critique: liste.filter((s) => s.severity === "critical").length,
    eleve: liste.filter((s) => (s.severity ?? "warning") === "important").length,
    total: liste.length,
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><AlertTriangle size={20} className="text-red-400" /> Anti-Fraude</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Critiques", v: counts.critique, c: "text-red-500" },
          { l: "Élevés", v: counts.eleve, c: "text-amber-500" },
          { l: "Non résolus", v: counts.total, c: "text-slate-500" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </div>
        ))}
      </div>

      {suspects.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((a) => {
          const isExp = expanded === a.id;
          const sev = SEVERITE_LABEL[a.severity ?? "warning"] ?? SEVERITE_LABEL.warning;
          return (
            <div key={a.id} className={`rounded-xl bg-white border overflow-hidden ${a.severity === "critical" ? "border-red-300" : "border-[#E5E7EB]"}`}>
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${sev.bg}`}><AlertTriangle size={14} className={sev.color} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{a.reason}</p>
                  <p className="text-[10px] text-[#6B7280]">Utilisateur #{a.userId}{a.createdAt ? ` · ${new Date(a.createdAt).toLocaleString("fr-FR")}` : ""}</p>
                </div>
                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${sev.bg} ${sev.color}`}>{sev.label}</span>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  {a.details !== null && (
                    <pre className="text-[9px] text-[#6B7280] mb-2 whitespace-pre-wrap break-words">{JSON.stringify(a.details, null, 2)}</pre>
                  )}
                  <button
                    onClick={() => resolve.mutate({ id: a.id })}
                    disabled={resolve.isPending}
                    className="w-full rounded-lg bg-green-600 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Check size={10} /> {resolve.isPending ? "…" : "Marquer résolu"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!suspects.isLoading && liste.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-8">Aucun compte suspect non résolu.</p>
        )}
      </div>
    </div>
  );
}
