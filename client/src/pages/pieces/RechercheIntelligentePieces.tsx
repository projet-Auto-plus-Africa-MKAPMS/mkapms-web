import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, Package } from "lucide-react";
export default function RechercheIntelligentePieces() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<"plaque"|"vin"|"ref"|"marque">("plaque");
  const [value, setValue] = useState("");
  const rechercher = () => {
    const terme = value.trim();
    if (!terme) return;
    const param = method === "plaque" ? "plaque" : method === "vin" ? "vin" : "q";
    navigate(`/pieces?${param}=${encodeURIComponent(terme)}`);
  };
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Search size={20} className="text-[#D4AF37]" /> Recherche intelligente</h1></div>
      <div className="px-4 mt-4 flex flex-wrap gap-1.5">{(["plaque","vin","ref","marque"] as const).map(m => (<button key={m} onClick={() => setMethod(m)} className={`rounded-lg px-3 py-2 text-xs font-bold ${method === m ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>{m === "plaque" ? "Plaque" : m === "vin" ? "VIN" : m === "ref" ? "Référence" : "Marque/Modèle"}</button>))}</div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4"><input type="text" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") rechercher(); }} placeholder={method === "plaque" ? "AB-123-CD" : method === "vin" ? "VF3XXXXXXXX" : method === "ref" ? "Réf. constructeur ou équipementier" : "Ex: Peugeot 3008"} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /><button type="button" onClick={rechercher} disabled={!value.trim()} className="mt-3 w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"><Search size={14} /> Rechercher</button></div>
    </div>
  );
}
