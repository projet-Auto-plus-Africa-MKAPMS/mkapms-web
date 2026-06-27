import { Link } from "react-router-dom";
import { ChevronLeft, Archive, Search, FileText, Car } from "lucide-react";
const ARCHIVES = [
  { vehicule: "Renault Clio IV", ref: "VO-2024-0089", dateVente: "15/12/2024", prix: 12500 },
  { vehicule: "Peugeot 308 SW", ref: "VO-2024-0078", dateVente: "01/11/2024", prix: 18500 },
  { vehicule: "BMW X1 18d", ref: "VO-2024-0065", dateVente: "15/09/2024", prix: 24000 },
];
export default function CentreArchives() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Archive size={20} /> Archives</h1><p className="mt-1 text-sm text-white/80">Conservation longue durée</p></div>
      <div className="px-4 mt-4 space-y-2">{ARCHIVES.map(a => (
        <div key={a.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          <Car size={14} className="text-[#6B7280]" /><div className="flex-1"><h3 className="text-sm text-[#111]">{a.vehicule}</h3><p className="text-[9px] text-[#6B7280]">{a.ref} · Vendu le {a.dateVente}</p></div><span className="text-sm font-bold text-[#6B7280]">{a.prix.toLocaleString("fr-FR")} €</span>
        </div>))}</div>
    </div>
  );
}
