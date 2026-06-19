import { Link } from "react-router-dom";
import { ChevronLeft, User, FileText, Check, Euro, CreditCard, Truck, Download } from "lucide-react";
const DOCS_CLIENT = [
  { label: "Facture de vente", statut: "valide" }, { label: "Contrat de vente", statut: "valide" },
  { label: "Certificat de cession", statut: "valide" }, { label: "Documents livraison", statut: "en_attente" },
  { label: "Demande carte grise", statut: "en_cours" },
];
export default function DossierClient() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><User size={20} /> Dossier Client</h1><p className="mt-1 text-sm text-white/80">Marie L. — Peugeot 3008 GT</p></div>
      <div className="px-4 mt-4 space-y-2">{DOCS_CLIENT.map((d) => (
        <div key={d.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          <FileText size={14} className={d.statut === "valide" ? "text-green-600" : d.statut === "en_cours" ? "text-amber-500" : "text-[#9CA3AF]"} />
          <span className="flex-1 text-sm text-[#111]">{d.label}</span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.statut === "valide" ? "bg-green-50 text-green-600" : d.statut === "en_cours" ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-[#9CA3AF]"}`}>{d.statut === "valide" ? "Validé" : d.statut === "en_cours" ? "En cours" : "En attente"}</span>
          {d.statut === "valide" && <Download size={12} className="text-blue-600" />}
        </div>))}</div>
    </div>
  );
}
