import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Upload, FileText, Check } from "lucide-react";
const DOCS = [{ label: "Certificat de cession (Cerfa)", statut: "valide" }, { label: "Carte grise barrée", statut: "en_attente" }, { label: "Pièce d'identité vendeur", statut: "valide" }];
export default function DeclarationCession() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-green-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Déclaration cession</h1></div>
      <div className="px-4 mt-4 space-y-2">{DOCS.map(d => (
        <div key={d.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">{d.statut === "valide" ? <Check size={14} className="text-green-600" /> : <Upload size={14} className="text-amber-500" />}<span className="flex-1 text-sm text-[#111]">{d.label}</span></div>))}</div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4"><h3 className="text-sm font-bold text-[#111] mb-2">Signature numérique</h3><div className="rounded-lg border-2 border-dashed border-[#E5E7EB] h-20 flex items-center justify-center text-xs text-[#9CA3AF]">Signer ici</div></div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-green-700 py-3 text-sm font-bold text-white active:scale-[0.98]">Valider la cession</button></div>
    </div>
  );
}
