import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, ChevronDown, Phone, Bell } from "lucide-react";
const ATTENTES = [
  { id: 1, vehicule: "Golf VIII", motif: "Attente devis", depuis: "2 jours", client: "Ahmed K.", tel: "06 11 22 33 44", plaque: "AB-123-CD" },
  { id: 2, vehicule: "Classe A", motif: "Attente validation", depuis: "1 jour", client: "SAS Log+", tel: "01 44 55 66 77", plaque: "EF-456-GH" },
  { id: 3, vehicule: "C4", motif: "Attente pieces", depuis: "3 jours", client: "Pierre D.", tel: "06 99 88 77 66", plaque: "IJ-789-KL" },
  { id: 4, vehicule: "Captur", motif: "Attente paiement", depuis: "1 jour", client: "Marie V.", tel: "06 55 44 33 22", plaque: "MN-012-OP" },
];
export default function VehiculesAttente() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Vehicules en attente</h1></div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2 mb-3">
        <button className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]"><p className="text-lg font-black text-amber-500">4</p><p className="text-[9px] text-[#6B7280]">En attente</p></button>
        <button className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]"><p className="text-lg font-black text-red-500">1</p><p className="text-[9px] text-[#6B7280]">&gt; 48h</p></button>
      </div>
      <div className="px-4 space-y-2">{ATTENTES.map(a => {
        const isExp = expanded === a.id;
        return (
          <div key={a.id} className="rounded-xl bg-white border border-amber-200 overflow-hidden">
            <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-50 grid place-items-center"><Clock size={14} className="text-amber-500" /></div>
              <div className="flex-1 min-w-0"><h3 className="text-sm font-bold text-[#111]">{a.vehicule}</h3><p className="text-[9px] text-[#6B7280]">{a.client} · {a.motif}</p></div>
              <span className="text-[9px] text-amber-600 font-bold">{a.depuis}</span>
              <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
            </button>
            {isExp && (
              <div className="px-3 pb-3 border-t border-amber-100 pt-2">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Plaque</span><p className="font-bold text-[#111]">{a.plaque}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Telephone</span><p className="font-bold text-[#111]">{a.tel}</p></div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1"><Bell size={10} /> Relancer</button>
                  <button className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1"><Phone size={10} /> Appeler</button>
                </div>
              </div>
            )}
          </div>
        );
      })}</div>
    </div>
  );
}
