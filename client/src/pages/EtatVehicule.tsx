import { Link } from "react-router-dom";
import { ChevronLeft, Camera, Shield, Car, AlertTriangle } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   ÉTATS DU VÉHICULE (/louer/etats-vehicule)
   Données réelles : trpc.reservations.mine (server/routers/reservations.ts,
   table bookings), filtrées sur le type "rental" — déclaré depuis toujours
   dans bookingTypeEnum mais qu'aucune procédure ne crée encore : aucun flux
   de réservation de location individuelle n'existe sur la plateforme
   (tâche de fond distincte, #56). En clair : cette liste est réellement
   vide aujourd'hui, pour toute personne, et le restera tant que #56 n'a
   pas construit la création de réservations de location. Afficher un état
   des lieux, une signature ou une caution fabriqués ici serait un mensonge
   sur une réservation qui n'existe pas — jamais fait, contrairement à
   l'ancienne version de cet écran.
   ══════════════════════════════════════════════════════════════════════════ */

export default function EtatVehicule() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.reservations.mine.useQuery(undefined, { enabled: !!user });
  const locations = (data ?? []).filter((b) => b.type === "rental");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white">États & Contrats</h1>
        <p className="mt-1 text-sm text-white/60">Photos, signature numérique, caution</p>
      </div>

      {!user && (
        <div className="px-4 mt-6">
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">Connectez-vous pour voir vos réservations de location.</p>
          <Link to="/connexion" className="mt-3 block w-full rounded-xl bg-[#D4AF37] py-3 text-center text-sm font-bold text-white">Se connecter</Link>
        </div>
      )}

      {user && isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      {user && !isLoading && locations.length === 0 && (
        <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Aucune réservation de location active</p>
              <p className="text-xs text-amber-700 mt-0.5">
                L'état des lieux, la signature du contrat et le suivi de caution apparaîtront ici dès votre première
                réservation de location confirmée.
              </p>
            </div>
          </div>
        </div>
      )}

      {locations.map((b) => (
        <div key={b.id} className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
          <div className="bg-[#111] px-4 py-2.5 flex items-center gap-2">
            <Car size={14} className="text-[#D4AF37]" />
            <h3 className="text-sm font-bold text-white">Réservation #{b.id}</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Statut</p><p className="text-xs font-bold">{b.status}</p></div>
              <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Début</p><p className="text-xs font-bold">{b.startDate ? new Date(b.startDate).toLocaleDateString("fr-FR") : "—"}</p></div>
            </div>
            {b.cautionAmount != null && (
              <div className="flex items-center justify-between rounded-lg bg-[#F5F3EF] p-3">
                <div className="flex items-center gap-2"><Shield size={14} className="text-[#D4AF37]" /><span className="text-sm text-[#111]">Caution</span></div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#111]">{Number(b.cautionAmount).toLocaleString("fr-FR")} {b.cautionCurrency || "EUR"}</p>
                  <p className="text-[9px] text-[#6B7280]">{b.cautionStatus}</p>
                </div>
              </div>
            )}
            <p className="rounded-lg bg-slate-50 p-2.5 text-[10px] text-[#6B7280] flex items-start gap-1.5">
              <Camera size={12} className="shrink-0 mt-0.5" /> État des lieux photo et signature numérique du contrat : bientôt disponibles.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
