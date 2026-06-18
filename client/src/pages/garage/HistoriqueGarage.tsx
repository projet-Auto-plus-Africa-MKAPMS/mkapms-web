import { Link } from "react-router-dom";
import { ChevronLeft, History, FileText, Euro, Wrench, Search, Camera, Shield, Download } from "lucide-react";
const INTERVENTIONS = [
  { date: "15/03/2025", type: "Réparation", desc: "Plaquettes + direction + pneu", montant: 630, or: "OR-2025-0142" },
  { date: "10/01/2025", type: "Contrôle technique", desc: "CT favorable", montant: 65, or: "CT-2025-0089" },
  { date: "15/09/2024", type: "Révision", desc: "Révision complète 60 000 km", montant: 289, or: "OR-2024-0098" },
  { date: "01/06/2024", type: "Pneumatiques", desc: "4 pneus Michelin Primacy 4", montant: 520, or: "OR-2024-0065" },
];
export default function HistoriqueGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><History size={20} className="text-[#D4AF37]" /> Historique garage</h1><p className="mt-1 text-sm text-white/60">Peugeot 3008 GT — AB-123-CD</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-3 text-center text-sm"><span className="text-[#6B7280]">Total dépensé :</span><span className="ml-2 font-black text-[#D4AF37]">{INTERVENTIONS.reduce((s,i) => s + i.montant, 0).toLocaleString("fr-FR")} €</span></div>
      <div className="px-4 mt-3 space-y-2">{INTERVENTIONS.map(i => (
        <div key={i.or} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{i.type}</h3><span className="text-sm font-bold text-[#D4AF37]">{i.montant} €</span></div>
          <p className="text-[10px] text-[#6B7280] mt-0.5">{i.date} · {i.or}</p><p className="text-xs text-[#6B7280] mt-0.5">{i.desc}</p>
          <div className="mt-2 flex gap-2"><button className="rounded-lg bg-[#F5F3EF] px-2 py-1 text-[9px] font-bold text-[#111]">Devis</button><button className="rounded-lg bg-[#F5F3EF] px-2 py-1 text-[9px] font-bold text-[#111]">Facture</button><button className="rounded-lg bg-[#F5F3EF] px-2 py-1 text-[9px] font-bold text-[#111]">Photos</button></div>
        </div>))}</div>
    </div>
  );
}
