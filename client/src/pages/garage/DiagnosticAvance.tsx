import { Link } from "react-router-dom";
import { ChevronLeft, Search, FileText, Camera, Download } from "lucide-react";
const CODES = [
  { code: "P0301", desc: "Raté cylindre 1", gravite: "Haute" },
  { code: "P0420", desc: "Efficacité catalyseur", gravite: "Moyenne" },
  { code: "B1234", desc: "Capteur température ext.", gravite: "Basse" },
];
export default function DiagnosticAvance() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Search size={20} className="text-[#D4AF37]" /> Diagnostic avancé</h1></div>
      <div className="px-4 mt-4 space-y-2">{CODES.map(c => (
        <div key={c.code} className={`rounded-xl bg-white border p-3 ${c.gravite === "Haute" ? "border-red-200" : c.gravite === "Moyenne" ? "border-amber-200" : "border-[#E5E7EB]"}`}>
          <div className="flex justify-between"><span className="text-sm font-bold font-mono text-[#111]">{c.code}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${c.gravite === "Haute" ? "bg-red-50 text-red-600" : c.gravite === "Moyenne" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{c.gravite}</span></div>
          <p className="text-xs text-[#6B7280] mt-0.5">{c.desc}</p>
        </div>))}</div>
      <div className="px-4 mt-3 flex gap-2"><button className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Camera size={12} /> Capture écran</button><button className="flex-1 rounded-xl bg-white border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#111] flex items-center justify-center gap-1"><Download size={12} /> Exporter PDF</button></div>
    </div>
  );
}
