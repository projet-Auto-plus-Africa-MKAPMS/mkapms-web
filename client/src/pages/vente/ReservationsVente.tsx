import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, Euro, Eye } from "lucide-react";
import { DocumentView, buildContratData } from "../../components/DocumentPDF";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   RÉSERVATIONS VENTE (/vente/reservations)
   Données réelles : trpc.reservations.mesReservationsRecues /
   repondreReservationRecue (server/routers/reservations.ts, table bookings
   déjà utilisée par le moteur de réservation acheteur) — jamais un second
   registre inventé. La liste RESERVATIONS codée en dur a été retirée.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT_LABEL: Record<string, string> = {
  pending: "Reçue",
  accepted: "Validée",
  rejected: "Refusée",
  cancelled: "Annulée",
  completed: "Terminée",
};
const STATUT_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  accepted: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-blue-50 text-blue-600",
};

export default function ReservationsVente() {
  const [modalDoc, setModalDoc] = useState<any>(null);
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.reservations.mesReservationsRecues.useQuery();
  const repondre = trpc.reservations.repondreReservationRecue.useMutation({
    onSuccess: () => utils.reservations.mesReservationsRecues.invalidate(),
  });
  const reservations = data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente/resume-vendeur" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} /> Réservations Vente</h1>
      </div>

      {isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}
      {!isLoading && reservations.length === 0 && (
        <p className="mx-4 mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">
          Aucune réservation reçue pour l'instant.
        </p>
      )}

      <div className="px-4 mt-4 space-y-2">
        {reservations.map((r) => (
          <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111]">{r.client}</h3>
                <p className="text-[10px] text-[#6B7280]">{r.vehicule} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold h-fit ${STATUT_STYLE[r.statut] ?? "bg-slate-100 text-slate-500"}`}>
                {STATUT_LABEL[r.statut] ?? r.statut}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2"><Euro size={12} className="text-[#D4AF37]" /><span className="text-sm font-bold text-[#D4AF37]">Acompte: {r.acompte} {r.devise}</span></div>
              {r.statut === "accepted" && (
                <button
                  onClick={() => setModalDoc(buildContratData({ vehicule: r.vehicule, client: r.client, type: "Réservation", prix: `${r.acompte} ${r.devise} (Acompte)`, ref: `RES-${r.id}` }))}
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                >
                  <Eye size={12} /> Voir Reçu
                </button>
              )}
            </div>
            {r.statut === "pending" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => repondre.mutate({ bookingId: r.id, accepter: true })}
                  disabled={repondre.isPending}
                  className="rounded-lg bg-green-600 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Valider
                </button>
                <button
                  onClick={() => repondre.mutate({ bookingId: r.id, accepter: false })}
                  disabled={repondre.isPending}
                  className="rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 disabled:opacity-50"
                >
                  Refuser
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {modalDoc && <DocumentView doc={modalDoc} onClose={() => setModalDoc(null)} />}
    </div>
  );
}
