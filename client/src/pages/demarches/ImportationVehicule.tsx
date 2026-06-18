import { Link } from "react-router-dom";
import { ChevronLeft, Globe, Upload, Check, Clock } from "lucide-react";
const DOCS = [{ label: "Facture d'achat", statut: "valide" }, { label: "Quitus fiscal", statut: "en_attente" }, { label: "Certificat conformité", statut: "non_envoye" }, { label: "Contrôle technique", statut: "non_envoye" }];
export default function ImportationVehicule() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-red-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Globe size={20} /> Importation véhicule</h1></div>
      <div className="px-4 mt-4 space-y-2">{DOCS.map(d => (
        <div key={d.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">{d.statut === "valide" ? <Check size={14} className="text-green-600" /> : d.statut === "en_attente" ? <Clock size={14} className="text-amber-500" /> : <Upload size={14} className="text-[#9CA3AF]" />}<span className="flex-1 text-sm text-[#111]">{d.label}</span></div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-red-700 py-3 text-sm font-bold text-white active:scale-[0.98]">Soumettre le dossier import</button></div>
    </div>
  );
}
