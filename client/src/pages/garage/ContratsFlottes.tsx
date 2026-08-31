import { Link } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";

const FORMULES = [
  { type: "Entretien", contenu: "Révisions périodiques, vidanges, filtres" },
  { type: "Maintenance", contenu: "Pièces d'usure, réparations mécaniques" },
  { type: "Pneumatiques", contenu: "Montage, équilibrage, remplacement saisonnier" },
  { type: "Dépannage", contenu: "Assistance et remorquage" },
];

export default function ContratsFlottes() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/garage/professionnel" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage Pro</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} /> Contrats flottes</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <p className="text-sm font-bold text-[#111]">Formules de contrat de flotte</p>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          Aucun contrat n'est affiché comme actif et aucun tarif n'est annoncé : le prix d'un contrat de flotte dépend du parc et se chiffre au devis. La souscription passe donc par une demande de devis atelier.
        </p>
      </div>
      <div className="px-4 mt-3 space-y-2">{FORMULES.map(f => (
        <div key={f.type} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111]">Contrat {f.type}</h3>
          <p className="mt-1 text-[10px] text-[#6B7280]">{f.contenu}</p>
          <BoutonMoteur
            code="garage_contrat_flotte_souscrire"
            className="mt-2 block w-full rounded-lg bg-blue-800 py-2 text-xs font-bold text-white text-center"
            query={{ contrat: f.type }}
          >
            Demander un devis
          </BoutonMoteur>
        </div>))}
      </div>
    </div>
  );
}
