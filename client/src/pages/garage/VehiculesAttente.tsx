import { Link } from "react-router-dom";
import { ChevronLeft, Clock, FileText, Euro, Package, Check } from "lucide-react";
const ATTENTES = [
  { vehicule: "Golf VIII", motif: "Attente devis", depuis: "2 jours", client: "Ahmed K." },
  { vehicule: "Classe A", motif: "Attente validation", depuis: "1 jour", client: "SAS Log+" },
  { vehicule: "C4", motif: "Attente pièces", depuis: "3 jours", client: "Pierre D." },
  { vehicule: "Captur", motif: "Attente paiement", depuis: "1 jour", client: "Marie V." },
];
export default function VehiculesAttente() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Véhicules en attente</h1></div>
      <div className="px-4 mt-4 space-y-2">{ATTENTES.map(a => (
        <div key={a.vehicule} className="rounded-xl bg-white border border-amber-200 p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{a.vehicule}</h3><span className="text-[9px] text-amber-600 font-bold">{a.depuis}</span></div>
          <p className="text-[10px] text-[#6B7280]">{a.client} · {a.motif}</p>
          <button className="mt-2 w-full rounded-lg bg-[#D4AF37] py-1.5 text-xs font-bold text-white">Relancer</button>
        </div>))}</div>
    </div>
  );
}
