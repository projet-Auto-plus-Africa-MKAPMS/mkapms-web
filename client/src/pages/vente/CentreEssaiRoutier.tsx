import { Link } from "react-router-dom";
import { ChevronLeft, Car, Check, FileText, Calendar, Shield } from "lucide-react";
const CONDITIONS = [{ label: "Permis valide", ok: true }, { label: "Pièce d'identité", ok: true }, { label: "Rendez-vous confirmé", ok: false }];
export default function CentreEssaiRoutier() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Essai routier</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2"><h3 className="text-sm font-bold text-[#111]">Conditions</h3>{CONDITIONS.map(c => (
        <div key={c.label} className="flex items-center gap-2"><span className={`h-5 w-5 rounded-full flex items-center justify-center ${c.ok ? "bg-green-100" : "bg-[#E5E7EB]"}`}>{c.ok ? <Check size={10} className="text-green-600" /> : <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" />}</span><span className="text-sm text-[#111]">{c.label}</span></div>))}</div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4"><h3 className="text-sm font-bold text-[#111] mb-2">Réserver un essai</h3><input type="date" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm mb-2" /><input type="time" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" /></div>
      <div className="px-4 mt-4"><button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Réserver l'essai</button></div>
    </div>
  );
}
