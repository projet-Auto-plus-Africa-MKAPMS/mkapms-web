import { Link } from "react-router-dom";
import { ChevronLeft, Bell, FileText, AlertTriangle, Check } from "lucide-react";
const ALERTES = [
  { type: "Document manquant", detail: "Certificat cession — DOS-0142", urgence: "haute" },
  { type: "Dossier validé", detail: "Carte grise BMW 320d terminée", urgence: "info" },
  { type: "Dossier bloqué", detail: "Justificatif domicile expiré", urgence: "haute" },
  { type: "Paiement reçu", detail: "257,66 € — DOS-0142", urgence: "info" },
];
export default function AlertesDemarches() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> Alertes</h1></div>
      <div className="px-4 mt-4 space-y-2">{ALERTES.map(a => (
        <div key={a.detail} className={`rounded-xl bg-white border-2 p-3 ${a.urgence === "haute" ? "border-red-300" : "border-green-200"}`}>
          <div className="flex items-center gap-2">{a.urgence === "haute" ? <AlertTriangle size={12} className="text-red-500" /> : <Check size={12} className="text-green-600" />}<h3 className="text-sm font-bold text-[#111]">{a.type}</h3></div>
          <p className="text-[10px] text-[#6B7280] mt-0.5">{a.detail}</p>
        </div>))}</div>
    </div>
  );
}
