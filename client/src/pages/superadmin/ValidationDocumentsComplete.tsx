import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Check, X, Clock, Shield, Eye, Bot } from "lucide-react";
const DOCS = [
  { id: "DOC-001", type: "KBIS", pro: "Garage AutoPlus", statut: "analyse_ia", date: "08/06/2026" },
  { id: "DOC-002", type: "Identité", pro: "Location Express", statut: "validation_humaine", date: "08/06/2026" },
  { id: "DOC-003", type: "Assurance", pro: "Dépannage Rapide", statut: "recu", date: "07/06/2026" },
  { id: "DOC-004", type: "SIRET", pro: "Pièces Auto Pro", statut: "valide", date: "06/06/2026" },
  { id: "DOC-005", type: "TVA", pro: "Garage Premium", statut: "refuse", date: "05/06/2026" },
];
const STATUTS: Record<string, { label: string; color: string }> = {
  recu: { label: "Reçu", color: "bg-blue-100 text-blue-700" },
  analyse_ia: { label: "Analyse IA", color: "bg-purple-100 text-purple-700" },
  validation_humaine: { label: "Validation humaine", color: "bg-yellow-100 text-yellow-700" },
  valide: { label: "Validé", color: "bg-green-100 text-green-700" },
  refuse: { label: "Refusé", color: "bg-red-100 text-red-700" },
};
export default function ValidationDocumentsComplete() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Validation Documents</h1>
        <p className="text-xs text-white/50 mt-1">IA contrôle → puis validation humaine obligatoire</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 mb-4 flex items-center gap-2">
        <Bot size={16} className="text-[#D4AF37]" />
        <p className="text-[10px] text-[#6B7280]"><span className="font-bold text-[#D4AF37]">IA Obligatoire :</span> Faux documents, doublons, incohérences détectés automatiquement. Jamais de validation IA seule.</p>
      </div>
      <div className="px-4 flex gap-2 mb-3 overflow-x-auto">
        {Object.entries(STATUTS).map(([k, v]) => (<span key={k} className={`whitespace-nowrap text-[9px] font-bold px-2.5 py-1 rounded-full ${v.color}`}>{v.label}</span>))}
      </div>
      <div className="px-4 space-y-2">
        {DOCS.map(d => { const s = STATUTS[d.statut]; return (
          <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-[#111]">{d.type}</p><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span></div>
            <p className="text-[10px] text-[#6B7280]">{d.pro} · {d.id} · {d.date}</p>
            {d.statut === "validation_humaine" && <div className="flex gap-2 mt-2"><button className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white text-[10px] font-bold py-1.5 rounded-lg"><Check size={12} /> Valider</button><button className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white text-[10px] font-bold py-1.5 rounded-lg"><X size={12} /> Refuser</button></div>}
          </div>); })}
      </div>
    </div>
  );
}
