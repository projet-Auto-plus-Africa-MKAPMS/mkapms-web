import { Link } from "react-router-dom";
import { ChevronLeft, Bell, AlertTriangle } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";

const SEUILS = [
  { piece: "Plaquettes Bosch", min: 5 },
  { piece: "Huile 5W30 5L", min: 8 },
  { piece: "Filtre habitacle charbon", min: 5 },
];

export default function CommandesAutomatiques() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> Commandes automatiques</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <p className="text-sm font-bold text-[#111] flex items-center gap-2"><AlertTriangle size={14} className="text-[#D4AF37]" /> Seuils de réapprovisionnement</p>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Aucun stock d'atelier n'est tenu côté serveur : les quantités réelles ne sont donc pas affichées et aucune alerte de rupture n'est déclenchée. Seuls les seuils de référence sont listés.
        </p>
      </div>
      <div className="px-4 mt-3 space-y-2">{SEUILS.map(s => (
        <div key={s.piece} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111]">{s.piece}</h3>
          <p className="text-[10px] text-[#6B7280]">Seuil minimum conseillé : {s.min} — stock réel non connu</p>
          <div className="mt-2 flex gap-2">
            <BoutonMoteur
              code="garage_reappro_auto"
              className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-xs font-bold text-white text-center"
            >
              Activer la commande auto
            </BoutonMoteur>
            <BoutonMoteur
              code="garage_commande_piece"
              className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-1.5 text-xs font-bold text-[#111] text-center"
              query={{ piece: s.piece }}
            >
              Commander
            </BoutonMoteur>
          </div>
        </div>))}
      </div>
    </div>
  );
}
