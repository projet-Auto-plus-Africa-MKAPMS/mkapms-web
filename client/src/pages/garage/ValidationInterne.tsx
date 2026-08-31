import { Link } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";

const NIVEAUX = ["Mécanicien", "Chef d'atelier", "Responsable"];

export default function ValidationInterne() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Validation interne</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <p className="text-sm font-bold text-[#111]">Chaîne de validation prévue</p>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Aucune validation n'est enregistrée : la plateforme n'a pas encore de dossier de validation d'atelier côté serveur. Les niveaux ci-dessous décrivent la chaîne attendue, pas des validations obtenues.
        </p>
      </div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        {NIVEAUX.map(niveau => (
          <div key={niveau} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0">
            <div className="h-4 w-4 rounded-full border-2 border-[#D4D4D4]" />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#111]">{niveau}</p>
              <p className="text-[9px] text-[#6B7280]">En attente — non enregistré</p>
            </div>
          </div>))}
        <BoutonMoteur
          code="garage_validation_interne"
          className="block w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white text-center"
        >
          Valider
        </BoutonMoteur>
      </div>
    </div>
  );
}
