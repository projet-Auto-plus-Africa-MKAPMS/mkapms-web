import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, AlertTriangle } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   DISPONIBILITÉ CALENDRIER
   L'ancienne version affichait 3 véhicules fabriqués (photos Unsplash) et un
   calendrier d'occupation inventé (jours "occupés" codés en dur). Aucune
   réservation de location réelle n'existe aujourd'hui : `bookingTypeEnum`
   contient bien "rental" mais aucune procédure ne crée jamais ce type de
   réservation (tâche #56, moteur location à construire). Sans réservation
   réelle, un calendrier d'occupation serait nécessairement inventé —
   retiré au profit d'un message honnête et d'un lien vers la recherche de
   location réelle.
   ══════════════════════════════════════════════════════════════════════════ */

export default function CalendrierDispo() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Disponibilité</h1>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Calendrier de disponibilité non disponible</p>
            <p className="text-xs text-amber-700 mt-0.5">
              La réservation de location par date n'est pas encore disponible sur MKA.P-MS : consultez les véhicules de
              location publiés et contactez le propriétaire pour vérifier leur disponibilité.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <Link
          to="/louer"
          className="block w-full rounded-xl bg-[#D4AF37] py-3 text-center text-sm font-bold text-white active:scale-[0.98]"
        >
          Voir les véhicules de location
        </Link>
      </div>
    </div>
  );
}
