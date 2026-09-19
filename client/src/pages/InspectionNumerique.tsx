import { Link } from "react-router-dom";
import { ChevronLeft, ClipboardCheck, AlertTriangle, Car } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   INSPECTION NUMÉRIQUE (/louer/inspection)
   Données réelles : trpc.reservations.mine (server/routers/reservations.ts,
   table bookings), filtrées sur le type "rental" — déclaré depuis toujours
   dans bookingTypeEnum mais qu'aucune procédure ne crée encore : aucun flux
   de réservation de location individuelle n'existe sur la plateforme
   (tâche de fond distincte, #56). Cette liste est donc réellement vide
   aujourd'hui pour tout le monde. La checklist départ/retour n'a aucun
   support de stockage réel : plutôt que de la faire semblant de fonctionner
   (cocher des cases qui ne s'enregistrent nulle part), l'écran affiche
   honnêtement l'absence de réservation, et l'indisponibilité de la
   checklist tant qu'elle n'est pas construite.
   ══════════════════════════════════════════════════════════════════════════ */

export default function InspectionNumerique() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.reservations.mine.useQuery(undefined, { enabled: !!user });
  const locations = (data ?? []).filter((b) => b.type === "rental");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ClipboardCheck size={20} className="text-[#D4AF37]" /> Inspection numérique</h1>
        <p className="mt-1 text-sm text-white/60">Checklist obligatoire avant départ et au retour</p>
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
                La checklist d'inspection départ/retour apparaîtra ici dès votre première réservation de location
                confirmée.
              </p>
            </div>
          </div>
        </div>
      )}

      {locations.map((b) => (
        <div key={b.id} className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100"><Car size={16} className="text-[#6B7280]" /></div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#111]">Réservation #{b.id}</h3>
            <p className="text-[10px] text-[#6B7280]">{b.status}</p>
          </div>
          <p className="text-[9px] text-[#6B7280] text-right">Checklist<br />bientôt disponible</p>
        </div>
      ))}
    </div>
  );
}
