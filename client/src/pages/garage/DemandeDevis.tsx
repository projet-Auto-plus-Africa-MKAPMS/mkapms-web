import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Camera, Search, Check, Send } from "lucide-react";
const INTERVENTIONS = ["Révision", "Vidange", "Freinage", "Distribution", "Embrayage", "Climatisation", "Diagnostic", "Pneus", "Carrosserie", "Autre"];
export default function DemandeDevis() {
  const [method, setMethod] = useState<"plaque"|"vin"|"manuelle">("plaque");
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Demande de devis</h1><p className="mt-1 text-sm text-white/60">Devis gratuit en 24h</p></div>
      <div className="px-4 mt-4 flex gap-2">{(["plaque","vin","manuelle"] as const).map(m => (<button key={m} onClick={() => setMethod(m)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${method === m ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>{m === "plaque" ? "Plaque" : m === "vin" ? "VIN" : "Manuelle"}</button>))}</div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        {method === "plaque" && <><label className="text-xs text-[#6B7280]">Plaque d'immatriculation</label><div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="AB-123-CD" className="w-full bg-transparent text-sm outline-none" /></div></>}
        {method === "vin" && <><label className="text-xs text-[#6B7280]">Numéro VIN</label><input type="text" placeholder="VF3XXXXXXXXXX" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></>}
        {method === "manuelle" && <>{["Marque", "Modèle", "Année", "Motorisation"].map(f => (<div key={f}><label className="text-xs text-[#6B7280]">{f}</label><input type="text" placeholder={f} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>))}</>}
        <div><label className="text-xs text-[#6B7280]">Intervention souhaitée</label><div className="mt-1 flex flex-wrap gap-1.5">{INTERVENTIONS.map(i => (<button key={i} className="rounded-full bg-[#F5F3EF] px-3 py-1 text-[10px] font-semibold text-[#111]">{i}</button>))}</div></div>
        <div><label className="text-xs text-[#6B7280]">Décrivez le problème</label><textarea placeholder="Bruit au freinage, voyant allumé..." className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm h-20" /></div>
        <div className="flex gap-2"><button className="flex-1 rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-4 flex flex-col items-center gap-1"><Camera size={16} className="text-[#D4AF37]" /><span className="text-[9px] text-[#6B7280]">Photos</span></button><button className="flex-1 rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-4 flex flex-col items-center gap-1"><Camera size={16} className="text-[#D4AF37]" /><span className="text-[9px] text-[#6B7280]">Vidéo</span></button></div>
        <div className="flex gap-2">{["Normal","Urgent","Très urgent"].map(u => (<button key={u} className={`flex-1 rounded-lg py-2 text-xs font-bold ${u === "Normal" ? "bg-green-50 text-green-600 border border-green-200" : u === "Urgent" ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-red-50 text-red-600 border border-red-200"}`}>{u}</button>))}</div>
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98]"><Send size={14} /> Envoyer ma demande</button>
      </div>
    </div>
  );
}
