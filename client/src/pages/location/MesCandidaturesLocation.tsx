import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, Clock, Check, X, CreditCard, FileText, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   MES CANDIDATURES DE LOCATION FLOTTE
   Suivi réel des candidatures déposées via CandidatureLocationFlotte.tsx —
   aucune ne devient une réservation confirmée avant décision + acompte payé.
   ══════════════════════════════════════════════════════════════════════════ */

const LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "text-[#6B7280] bg-[#F3F4F6]" },
  submitted: { label: "En attente de décision", color: "text-amber-600 bg-amber-50" },
  approved: { label: "Approuvée — acompte à régler", color: "text-blue-600 bg-blue-50" },
  rejected: { label: "Refusée", color: "text-red-600 bg-red-50" },
  paid: { label: "Confirmée", color: "text-emerald-600 bg-emerald-50" },
  completed: { label: "Terminée", color: "text-[#111] bg-[#F3F4F6]" },
};

export default function MesCandidaturesLocation() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const mineQ = trpc.rentalApplications.mine.useQuery(undefined, { enabled: !!user });
  const payDeposit = trpc.rentalApplications.payDeposit.useMutation();
  const [payingId, setPayingId] = useState<number | null>(null);

  async function payer(id: number) {
    setPayingId(id);
    try {
      const { url } = await payDeposit.mutateAsync({ id });
      window.location.href = url;
    } finally {
      setPayingId(null);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-6">
        <p className="text-sm text-[#6B7280]">Connectez-vous pour voir vos candidatures.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer/pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location Pro</Link>
        <h1 className="text-xl font-black text-white">Mes candidatures de location</h1>
      </div>

      {params.get("paid") === "1" && (
        <div className="mx-4 mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
          Paiement reçu — la confirmation s'affichera ici dès que le webhook Stripe l'aura traité.
        </div>
      )}
      {params.get("canceled") === "1" && (
        <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-700">
          Paiement annulé — vous pouvez réessayer à tout moment tant que votre candidature reste approuvée.
        </div>
      )}

      <div className="px-4 mt-4 space-y-3">
        {mineQ.isLoading && <p className="text-xs text-[#9CA3AF]">Chargement…</p>}
        {mineQ.data && mineQ.data.length === 0 && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-6 text-center space-y-2">
            <FileText size={22} className="mx-auto text-[#9CA3AF]" />
            <p className="text-sm text-[#6B7280]">Aucune candidature pour le moment.</p>
            <Link to="/louer/pro/candidature" className="inline-block rounded-xl bg-[#111] px-5 py-2.5 text-sm font-bold text-white">Déposer une candidature</Link>
          </div>
        )}
        {mineQ.data?.map((a) => {
          const meta = LABELS[a.status] ?? { label: a.status, color: "text-[#6B7280] bg-[#F3F4F6]" };
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#111]">Candidature #{a.id}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
                  {a.status === "paid" || a.status === "completed" ? <Check size={10} /> : a.status === "rejected" ? <X size={10} /> : <Clock size={10} />}
                  {meta.label}
                </span>
              </div>
              <p className="text-[10px] text-[#6B7280]">Déposée le {new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>

              {a.status === "draft" && (
                <Link to="/louer/pro/candidature" className="block text-center rounded-xl border border-[#E5E7EB] py-2 text-xs font-bold text-[#111]">Reprendre ma candidature</Link>
              )}

              {a.status === "rejected" && a.rejectionReason && (
                <p className="text-xs text-red-700 bg-red-50 rounded-lg p-2">{a.rejectionReason}</p>
              )}

              {a.status === "approved" && (
                <div className="space-y-1.5">
                  <p className="text-xs text-[#111]">
                    Acompte à régler : <span className="font-bold">{a.depositAmount ?? "—"} {a.depositCurrency ?? ""}</span> (encaissé immédiatement)
                  </p>
                  <button
                    disabled={payingId === a.id}
                    onClick={() => payer(a.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {payingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    Payer l'acompte
                  </button>
                  {payDeposit.isError && payingId === null && <p className="text-[11px] font-semibold text-red-600">{payDeposit.error.message}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
