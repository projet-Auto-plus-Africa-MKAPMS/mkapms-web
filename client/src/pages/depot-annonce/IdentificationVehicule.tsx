import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, Hash, Edit3, Car, Check, Sparkles } from "lucide-react";

export default function IdentificationVehicule() {
  const [method, setMethod] = useState<"plaque"|"vin"|"manuel">("plaque");
  const [value, setValue] = useState("");
  const [found, setFound] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dépôt annonce</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Identification véhicule</h1>
      </div>
      <div className="px-4 mt-4 flex gap-2 mb-4">
        {([["plaque", "Plaque"], ["vin", "VIN"], ["manuel", "Manuel"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => { setMethod(k); setFound(false); }} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${method === k ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>{l}</button>
        ))}
      </div>
      <div className="px-4">
        {method === "plaque" && <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
          <p className="text-xs text-[#6B7280] mb-2">Entrez la plaque d'immatriculation</p>
          <div className="flex gap-2"><input value={value} onChange={e => setValue(e.target.value)} placeholder="AA-123-BB" className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm font-bold text-center uppercase" /><button onClick={() => setFound(true)} className="bg-[#D4AF37] text-white px-4 rounded-lg text-xs font-bold"><Search size={16} /></button></div>
        </div>}
        {method === "vin" && <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
          <p className="text-xs text-[#6B7280] mb-2">Entrez le numéro VIN (17 caractères)</p>
          <div className="flex gap-2"><input value={value} onChange={e => setValue(e.target.value)} placeholder="VF1XXXXXXXXX12345" className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-xs font-mono" /><button onClick={() => setFound(true)} className="bg-[#D4AF37] text-white px-4 rounded-lg text-xs font-bold"><Search size={16} /></button></div>
        </div>}
        {method === "manuel" && <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm space-y-3">
          <p className="text-xs text-[#6B7280] mb-1">Remplissez manuellement</p>
          {["Marque", "Modèle", "Année", "Motorisation", "Énergie"].map(f => (<div key={f}><label className="text-[10px] font-bold text-[#6B7280] uppercase">{f}</label><input placeholder={f} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" /></div>))}
        </div>}
        {found && <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Check size={16} className="text-green-500" /><p className="text-sm font-bold text-green-700">Véhicule identifié</p></div>
          <div className="space-y-1">{[["Marque", "Peugeot"], ["Modèle", "308"], ["Année", "2021"], ["Motorisation", "1.5 BlueHDi 130"], ["Énergie", "Diesel"]].map(([k, v]) => (<div key={k} className="flex justify-between"><span className="text-[10px] text-[#6B7280]">{k}</span><span className="text-[10px] font-bold text-[#111]">{v}</span></div>))}</div>
          <Link to="/depot-annonce/informations-principales" className="mt-3 block w-full py-2.5 bg-[#D4AF37] text-white rounded-xl text-xs font-bold text-center">Continuer</Link>
        </div>}
      </div>
    </div>
  );
}
