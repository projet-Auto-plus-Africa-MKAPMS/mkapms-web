import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Camera, Euro, Wrench, Car, Check, Upload, ChevronDown } from "lucide-react";
const DOCS = [
  { label: "Facture achat", statut: "valide" }, { label: "Carte grise", statut: "valide" },
  { label: "Contrôle technique", statut: "valide" }, { label: "Factures réparations", statut: "valide" },
  { label: "Factures pièces", statut: "en_attente" }, { label: "Rapport diagnostic", statut: "valide" },
  { label: "Photos avant travaux", statut: "valide" }, { label: "Photos après travaux", statut: "en_attente" },
];
export default function DossierVehicule() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente/stock" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Stock</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} /> Dossier véhicule</h1>
        <p className="mt-1 text-sm text-white/80">Peugeot 3008 GT — 2022</p>
      </div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
        <Car size={20} className="text-blue-600" /><div><h3 className="text-sm font-bold text-[#111]">Peugeot 3008 GT</h3><p className="text-[10px] text-[#6B7280]">2022 · 45 000 km · Hybride · Réf: VO-2025-0042</p></div>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {DOCS.map((d) => (
          <div key={d.label} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3">
            <FileText size={14} className={d.statut === "valide" ? "text-green-600" : "text-amber-500"} />
            <span className="flex-1 text-sm text-[#111]">{d.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.statut === "valide" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{d.statut === "valide" ? "Validé" : "En attente"}</span>
            {d.statut === "en_attente" && <Upload size={12} className="text-[#9CA3AF]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
