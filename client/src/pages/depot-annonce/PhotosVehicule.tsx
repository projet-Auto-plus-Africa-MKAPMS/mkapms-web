import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Camera, Check, AlertCircle, Upload, Star } from "lucide-react";

type PhotoSlot = { id: string; label: string; category: string; added: boolean; required: boolean };

const PHOTO_SLOTS: PhotoSlot[] = [
  // Extérieur
  { id: "ext1", label: "Avant gauche (3/4)", category: "Extérieur", added: false, required: true },
  { id: "ext2", label: "Avant droit (3/4)", category: "Extérieur", added: false, required: true },
  { id: "ext3", label: "Arrière gauche (3/4)", category: "Extérieur", added: false, required: true },
  { id: "ext4", label: "Arrière droit (3/4)", category: "Extérieur", added: false, required: true },
  { id: "ext5", label: "Face avant", category: "Extérieur", added: false, required: true },
  { id: "ext6", label: "Face arrière", category: "Extérieur", added: false, required: true },
  // Intérieur
  { id: "int1", label: "Tableau de bord", category: "Intérieur", added: false, required: true },
  { id: "int2", label: "Écran multimédia", category: "Intérieur", added: false, required: false },
  { id: "int3", label: "Volant", category: "Intérieur", added: false, required: false },
  { id: "int4", label: "Sièges avant", category: "Intérieur", added: false, required: true },
  { id: "int5", label: "Sièges arrière", category: "Intérieur", added: false, required: false },
  // Technique
  { id: "tech1", label: "Compartiment moteur", category: "Technique", added: false, required: false },
  { id: "tech2", label: "Coffre", category: "Technique", added: false, required: true },
  { id: "tech3", label: "Pneus", category: "Technique", added: false, required: false },
  { id: "tech4", label: "Jantes", category: "Technique", added: false, required: false },
  // Documents
  { id: "doc1", label: "Carnet entretien", category: "Documents", added: false, required: false },
  { id: "doc2", label: "Factures", category: "Documents", added: false, required: false },
  { id: "doc3", label: "Contrôle technique", category: "Documents", added: false, required: false },
];

export default function PhotosVehicule() {
  const [slots, setSlots] = useState(PHOTO_SLOTS);
  const toggle = (id: string) => setSlots(prev => prev.map(s => s.id === id ? { ...s, added: !s.added } : s));
  const added = slots.filter(s => s.added).length;
  const total = slots.length;
  const score = Math.round((added / total) * 100);
  const categories = [...new Set(slots.map(s => s.category))];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/informations-principales" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Informations</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Camera size={20} className="text-[#D4AF37]" /> Photos véhicule</h1>
        <p className="text-xs text-white/50 mt-1">Guidage photo · Contrôle qualité automatique</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#111]">Score qualité annonce</p>
          <div className="flex items-center gap-1"><Star size={12} className="text-[#D4AF37]" /><span className="text-sm font-black" style={{ color: score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444" }}>{score}/100</span></div>
        </div>
        <div className="w-full bg-[#E5E7EB] rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444" }} /></div>
        <p className="text-[9px] text-[#6B7280] mt-1">{added}/{total} photos · {score >= 80 ? "Excellent !" : score >= 50 ? "Ajoutez plus de photos" : "Photos insuffisantes"}</p>
      </div>
      {categories.map(cat => (
        <div key={cat} className="px-4 mb-4">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">{cat}</h2>
          <div className="grid grid-cols-2 gap-2">
            {slots.filter(s => s.category === cat).map(s => (
              <button key={s.id} onClick={() => toggle(s.id)} className={`rounded-xl border-2 p-3 text-left transition-all ${s.added ? "border-green-400 bg-green-50" : s.required ? "border-[#D4AF37]/40 bg-white" : "border-[#E5E7EB] bg-white"}`}>
                <div className="flex items-center justify-between mb-1">
                  {s.added ? <Check size={14} className="text-green-500" /> : <Upload size={14} className={s.required ? "text-[#D4AF37]" : "text-[#D4D4D4]"} />}
                  {s.required && !s.added && <span className="text-[7px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] px-1.5 py-0.5 rounded">REQUIS</span>}
                </div>
                <p className="text-[10px] font-semibold text-[#111]">{s.label}</p>
                <p className="text-[8px] text-[#6B7280]">{s.added ? "✓ Ajoutée" : "Appuyez pour ajouter"}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="px-4"><Link to="/depot-annonce/videos-annonce" className="block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center">Continuer → Vidéos</Link></div>
    </div>
  );
}
