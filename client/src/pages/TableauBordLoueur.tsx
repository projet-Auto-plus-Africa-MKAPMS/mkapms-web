import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, Car, Check, Clock, Star, FileText } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   TABLEAU DE BORD LOUEUR
   Agrégation réelle des annonces de location possédées par le compte
   connecté (trpc.rentalContracts.myLoueurStats). Le CA et le taux
   d'occupation ne sont pas affichés : reservations.requestLocation n'est
   qu'une demande, jamais un encaissement (aucun paiement de location
   n'existe encore — tâche #44), et aucun calendrier jour par jour n'existe
   pour calculer une occupation réelle. Un chiffre absent plutôt qu'inventé.
   ══════════════════════════════════════════════════════════════════════════ */

export default function TableauBordLoueur() {
  const { user } = useAuth();
  const statsQ = trpc.rentalContracts.myLoueurStats.useQuery(undefined, { enabled: !!user });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Tableau de bord loueur</h1>
        <p className="mt-1 text-sm text-white/60">Vos annonces de location et vos demandes récentes</p>
      </div>

      {!user && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-6 text-center">
          <p className="text-sm text-[#6B7280]">Connectez-vous pour voir votre tableau de bord.</p>
        </div>
      )}

      {user && statsQ.isLoading && <p className="px-4 mt-4 text-xs text-[#9CA3AF]">Chargement…</p>}

      {user && statsQ.data && (
        <>
          {/* Stats grid — uniquement des chiffres réels */}
          <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
              <Car size={16} className="mx-auto text-blue-600" />
              <p className="text-lg font-black mt-1 text-blue-600">{statsQ.data.actifs}</p>
              <p className="text-[8px] text-[#6B7280]">Véhicules actifs</p>
            </div>
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
              <Check size={16} className="mx-auto text-green-600" />
              <p className="text-lg font-black mt-1 text-green-600">{statsQ.data.loues}</p>
              <p className="text-[8px] text-[#6B7280]">Loués</p>
            </div>
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
              <Clock size={16} className="mx-auto text-amber-600" />
              <p className="text-lg font-black mt-1 text-amber-600">{statsQ.data.disponibles}</p>
              <p className="text-[8px] text-[#6B7280]">Disponibles</p>
            </div>
          </div>

          {/* Score qualité — réel (users.rating/reviewCount), jamais inventé */}
          <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#D4AF37]/30 p-4 flex items-center gap-4">
            {statsQ.data.reviewCount > 0 ? (
              <>
                <div className="text-center">
                  <p className="text-3xl font-black text-[#D4AF37]">{Number(statsQ.data.rating).toFixed(1)}</p>
                  <div className="flex gap-0.5 mt-0.5 justify-center">
                    {[1, 2, 3, 4, 5].map((n) => (<Star key={n} size={10} className="text-[#D4AF37]" fill="#D4AF37" />))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Score qualité</p>
                  <p className="text-[10px] text-white/50">{statsQ.data.reviewCount} avis</p>
                </div>
              </>
            ) : (
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Aucun avis pour le moment</p>
                <p className="text-[10px] text-white/50">Le score s'affichera dès votre premier avis client.</p>
              </div>
            )}
          </div>

          {/* Réservations récentes — trpc.rentalContracts.myLoueurStats (serviceTracking réel) */}
          <div className="px-4 mt-4">
            <h2 className="text-base font-bold text-[#111]">Demandes récentes</h2>
            {statsQ.data.reservations.length === 0 && (
              <div className="mt-2 rounded-xl bg-white border border-[#E5E7EB] p-6 text-center">
                <FileText size={22} className="mx-auto text-[#9CA3AF]" />
                <p className="mt-2 text-sm text-[#6B7280]">Aucune demande de réservation pour le moment.</p>
              </div>
            )}
            <div className="mt-2 space-y-2">
              {statsQ.data.reservations.map((r) => (
                <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#111]">{r.vehiculeTitre ?? "Véhicule non identifié"}</h3>
                      <p className="text-[10px] text-[#6B7280]">{r.reference} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">{r.statusLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
