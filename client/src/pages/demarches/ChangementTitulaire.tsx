import { Link } from "react-router-dom";
import { ChevronLeft, Users, Upload, Check, Clock } from "lucide-react";
const DOCS = [{ label: "Carte grise", statut: "valide" }, { label: "Pièce d'identité", statut: "valide" }, { label: "Justificatif domicile", statut: "en_attente" }, { label: "Certificat cession", statut: "non_envoye" }];
const STATUTS = ["Brouillon", "Documents reçus", "Vérification", "Dossier envoyé", "Terminé"];
export default function ChangementTitulaire() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} /> Changement titulaire</h1></div>
      <div className="px-4 mt-4 space-y-2">{DOCS.map(d => (
        <div key={d.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          {d.statut === "valide" ? <Check size={14} className="text-green-600" /> : <Clock size={14} className={d.statut === "en_attente" ? "text-amber-500" : "text-[#9CA3AF]"} />}
          <span className="flex-1 text-sm text-[#111]">{d.label}</span>
          {d.statut !== "valide" && <Upload size={12} className="text-[#D4AF37]" />}
        </div>))}</div>
      <div className="px-4 mt-4"><button className="w-full rounded-xl bg-blue-700 py-3 text-sm font-bold text-white active:scale-[0.98]">Soumettre le dossier</button></div>
    </div>
  );
}
