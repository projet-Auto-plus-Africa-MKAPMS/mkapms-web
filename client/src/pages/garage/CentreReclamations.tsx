import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, AlertCircle, Send, Check, Clock, X } from "lucide-react";
const RECLAMATIONS = [
  { id: "REC-001", objet: "Bruit après réparation freins", statut: "en_cours", date: "18/03/2025" },
  { id: "REC-002", objet: "Fuite d'huile après vidange", statut: "resolu", date: "10/03/2025" },
];
export default function CentreReclamations() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><AlertCircle size={20} className="text-[#D4AF37]" /> Réclamations</h1></div>
      <div className="px-4 mt-4 space-y-2">{RECLAMATIONS.map(r => (
        <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{r.objet}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${r.statut === "resolu" ? "bg-green-50 text-green-600" : r.statut === "en_cours" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>{r.statut === "resolu" ? "Résolu" : r.statut === "en_cours" ? "En cours" : "Ouvert"}</span></div>
          <p className="text-[9px] text-[#6B7280] mt-0.5">{r.id} · {r.date}</p>
        </div>))}</div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2"><h3 className="text-sm font-bold text-[#111]">Nouvelle réclamation</h3><input type="text" placeholder="Objet…" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" /><textarea placeholder="Décrivez le problème…" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm h-20" /><button className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2"><Send size={14} /> Envoyer</button></div>
    </div>
  );
}
