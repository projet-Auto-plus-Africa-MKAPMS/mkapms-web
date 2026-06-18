import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check, AlertTriangle, Search } from "lucide-react";
const VERIFS = [
  { doc: "Carte identité", statut: "conforme", detail: "Format valide, date non expirée" },
  { doc: "Justificatif domicile", statut: "conforme", detail: "Moins de 3 mois" },
  { doc: "Carte grise", statut: "conforme", detail: "Numéro cohérent" },
  { doc: "Certificat cession", statut: "anomalie", detail: "Signature manquante" },
];
export default function VerificationIA() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-purple-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Search size={20} /> Vérification IA</h1><p className="mt-1 text-sm text-white/80">Contrôle automatique des documents</p></div>
      <div className="px-4 mt-4 space-y-2">{VERIFS.map(v => (
        <div key={v.doc} className={`rounded-xl bg-white border-2 p-4 ${v.statut === "anomalie" ? "border-red-300" : "border-green-200"}`}>
          <div className="flex items-center gap-2">{v.statut === "conforme" ? <Check size={14} className="text-green-600" /> : <AlertTriangle size={14} className="text-red-500" />}<h3 className="text-sm font-bold text-[#111]">{v.doc}</h3></div>
          <p className="text-[10px] text-[#6B7280] mt-0.5">{v.detail}</p>
        </div>))}</div>
    </div>
  );
}
