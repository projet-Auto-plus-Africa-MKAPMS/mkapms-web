import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MessageSquare, ChevronDown, Star, Check, X, EyeOff } from "lucide-react";
import { trpc } from "../../lib/trpc";

const STATUT_LABEL: Record<string, string> = {
  en_moderation: "En modération",
  signale: "Signalé",
  conteste: "Contesté",
};

/**
 * Modération avis (/superadmin/admin-moderation-avis).
 *
 * Données réelles : trpc.reviewsV2.adminDashboard / moderate
 * (server/routers/reviewsV2.ts, table reviews_v2) — le moteur d'avis
 * universel déjà utilisé par le site public, jamais un second registre
 * inventé pour le back-office. Un motif écrit est obligatoire côté serveur
 * pour masquer ou refuser un avis (§49) : le formulaire le reflète.
 */
export default function AdminModerationAvis() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const utils = trpc.useUtils();
  const dashboard = trpc.reviewsV2.adminDashboard.useQuery();
  const moderate = trpc.reviewsV2.moderate.useMutation({
    onSuccess: () => utils.reviewsV2.adminDashboard.invalidate(),
  });

  const liste = dashboard.data?.pendingReviews ?? [];
  const stats = dashboard.data?.stats;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]" /> Modération avis</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "En modération", v: stats?.pending ?? 0, c: "text-amber-500" },
          { l: "Signalés", v: stats?.reported ?? 0, c: "text-red-500" },
          { l: "Contestés", v: stats?.contested ?? 0, c: "text-slate-500" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </div>
        ))}
      </div>

      {dashboard.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((a) => {
          const isExp = expanded === a.id;
          const reason = reasons[a.id] ?? "";
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="flex gap-0.5">{Array.from({ length: a.ratingGlobal }).map((_, i) => <Star key={i} size={10} className="text-[#D4AF37] fill-[#D4AF37]" />)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{a.authorName ?? `Utilisateur #${a.authorId}`} · {a.univers}</p>
                  <p className="text-[10px] text-[#6B7280]">{STATUT_LABEL[a.status] ?? a.status} · {new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  {a.comment && <p className="text-[10px] text-[#6B7280] mb-2 italic">"{a.comment}"</p>}
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReasons((r) => ({ ...r, [a.id]: e.target.value }))}
                    placeholder="Motif (obligatoire pour masquer/refuser)"
                    className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-[10px] mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderate.mutate({ reviewId: a.id, action: "approve" })}
                      disabled={moderate.isPending}
                      className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Check size={10} /> Publier
                    </button>
                    <button
                      onClick={() => moderate.mutate({ reviewId: a.id, action: "hide", reason })}
                      disabled={moderate.isPending || reason.trim().length < 3}
                      className="flex-1 rounded-lg bg-slate-100 py-1.5 text-[9px] font-bold text-slate-600 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <EyeOff size={10} /> Masquer
                    </button>
                    <button
                      onClick={() => moderate.mutate({ reviewId: a.id, action: "refuse", reason })}
                      disabled={moderate.isPending || reason.trim().length < 3}
                      className="flex-1 rounded-lg bg-red-50 py-1.5 text-[9px] font-bold text-red-600 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <X size={10} /> Refuser
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!dashboard.isLoading && liste.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-8">Aucun avis en attente de modération.</p>
        )}
      </div>
    </div>
  );
}
