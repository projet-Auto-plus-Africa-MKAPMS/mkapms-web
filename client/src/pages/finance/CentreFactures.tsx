import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Download } from "lucide-react";
const FACTURES = [
  { ref: "FAC-2025-042", type: "Achat véhicule", montant: "25 000 €", date: "15/03/2025" },
  { ref: "FAC-2025-038", type: "Location", montant: "890 €", date: "01/03/2025" },
  { ref: "FAC-2025-035", type: "Garage", montant: "630 €", date: "28/02/2025" },
  { ref: "FAC-2025-030", type: "Démarches", montant: "257 €", date: "20/02/2025" },
];
export default function CentreFactures() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Factures</h1></div>
      <div className="px-4 mt-4 space-y-2">{FACTURES.map(f => (
        <div key={f.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3"><div className="flex-1"><h3 className="text-sm text-[#111]">{f.type}</h3><p className="text-[9px] text-[#6B7280]">{f.ref} · {f.date}</p></div><span className="text-sm font-bold text-[#D4AF37]">{f.montant}</span><Download size={14} className="text-red-500" /></div>))}</div>
    </div>
  );
}
