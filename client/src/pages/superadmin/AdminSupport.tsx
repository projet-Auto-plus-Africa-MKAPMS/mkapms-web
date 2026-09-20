import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Headphones, ChevronDown, Clock, Check, AlertCircle } from "lucide-react";
import { trpc } from "../../lib/trpc";

const PRIORITE_LABEL: Record<string, string> = { critique: "Critique", elevee: "Élevée", normale: "Normale", faible: "Faible" };

/**
 * Support (/superadmin/admin-support).
 *
 * Données réelles : trpc.supportOs.queue/stats/setPriority +
 * trpc.support.respond/setStatus (server/support-os/index.ts,
 * server/routers/support.ts, table support_tickets) — la vraie file de
 * tickets déjà alimentée par le centre d'aide public, jamais un second
 * registre inventé pour le back-office.
 */
export default function AdminSupport() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reponses, setReponses] = useState<Record<number, string>>({});
  const utils = trpc.useUtils();
  const queueQ = trpc.supportOs.queue.useQuery();
  const statsQ = trpc.supportOs.stats.useQuery();
  const respond = trpc.support.respond.useMutation({
    onSuccess: () => { utils.supportOs.queue.invalidate(); utils.supportOs.stats.invalidate(); },
  });
  const setPriority = trpc.supportOs.setPriority.useMutation({
    onSuccess: () => { utils.supportOs.queue.invalidate(); utils.supportOs.stats.invalidate(); },
  });

  const tickets = queueQ.data ?? [];
  const stats = statsQ.data;
  const resolus = stats?.byStatus.find((s) => s.status === "resolu")?.n ?? 0;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Headphones size={20} className="text-[#D4AF37]" /> Support</h1>
      </div>

      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Ouverts", v: stats?.open ?? 0, c: "text-red-500" },
          { l: "Critiques", v: stats?.openCritical ?? 0, c: "text-amber-500" },
          { l: "Résolus", v: resolus, c: "text-green-500" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[8px] text-[#6B7280]">{s.l}</p>
          </div>
        ))}
      </div>

      {queueQ.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {tickets.map((t) => {
          const isExp = expanded === t.id;
          const reponse = reponses[t.id] ?? "";
          return (
            <div key={t.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : t.id)} className="w-full text-left p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full grid place-items-center ${t.status === "ouvert" ? "bg-red-50" : t.status === "en_cours" ? "bg-amber-50" : "bg-green-50"}`}>
                    {t.status === "ouvert" ? <AlertCircle size={14} className="text-red-500" /> : t.status === "en_cours" ? <Clock size={14} className="text-amber-500" /> : <Check size={14} className="text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111] truncate">{t.sujet}</p>
                    <p className="text-[10px] text-[#6B7280]">{t.contactNom} · {new Date(t.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className={`text-[9px] font-bold ${t.priority === "critique" ? "text-red-600" : "text-[#6B7280]"}`}>{PRIORITE_LABEL[t.priority] ?? t.priority}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <p className="text-[10px] text-[#6B7280] mb-2">{t.message}</p>
                  <textarea
                    value={reponse}
                    onChange={(e) => setReponses((r) => ({ ...r, [t.id]: e.target.value }))}
                    placeholder="Votre réponse au client…"
                    rows={2}
                    className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-[10px] mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond.mutate({ id: t.id, response: reponse, status: "en_cours" })}
                      disabled={respond.isPending || reponse.trim().length < 1}
                      className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white disabled:opacity-50"
                    >
                      Répondre
                    </button>
                    <button
                      onClick={() => respond.mutate({ id: t.id, response: reponse || "Résolu.", status: "resolu" })}
                      disabled={respond.isPending}
                      className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white disabled:opacity-50"
                    >
                      Résoudre
                    </button>
                    <button
                      onClick={() => setPriority.mutate({ id: t.id, priority: "critique" })}
                      disabled={setPriority.isPending || t.priority === "critique"}
                      className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] disabled:opacity-50"
                    >
                      Escalader
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!queueQ.isLoading && tickets.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-8">Aucun ticket ouvert.</p>
        )}
      </div>
    </div>
  );
}
