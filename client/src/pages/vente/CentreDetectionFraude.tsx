import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, AlertTriangle, Check, X, Eye } from "lucide-react";
const VERIFS = [
  { label: "Annonces dupliquées", statut: "ok", detail: "Aucun doublon détecté", compte: "", motif: "", vehicules: 0 },
  { label: "Documents vérifiés", statut: "ok", detail: "Tous conformes", compte: "", motif: "", vehicules: 0 },
  { label: "Kilométrage cohérent", statut: "ok", detail: "Historique vérifié", compte: "", motif: "", vehicules: 0 },
  { label: "Comptes suspects", statut: "alerte", detail: "1 compte en surveillance", compte: "jdupont87", motif: "Connexions depuis 4 appareils différents en 24h", vehicules: 3 },
];
export default function CentreDetectionFraude() {
  const [ouvert, setOuvert] = useState<string | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-red-700 px-4 pt-6 pb-5"><Link to="/vente/resume-vendeur" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Détection fraude</h1><p className="mt-1 text-sm text-white/80">Analyse automatique</p></div>
      <div className="px-4 mt-4 space-y-2">{VERIFS.map(v => (
        <div key={v.label} className={`rounded-xl bg-white border p-4 ${v.statut === "alerte" ? "border-red-300" : "border-[#E5E7EB]"}`}>
          <div className="flex items-center gap-3">
            {v.statut === "ok" ? <Check size={16} className="text-green-600" /> : <AlertTriangle size={16} className="text-red-500" />}
            <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{v.label}</h3><p className="text-[10px] text-[#6B7280]">{v.detail}</p></div>
            {v.statut === "alerte" && (
              <button onClick={() => setOuvert((prev) => (prev === v.label ? null : v.label))} className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 flex items-center gap-1">
                <Eye size={10} /> {ouvert === v.label ? "Masquer" : "Voir"}
              </button>
            )}
          </div>
          {ouvert === v.label && v.statut === "alerte" && (
            <div className="mt-2 rounded-lg bg-red-50 p-2 text-[10px] text-red-700 space-y-0.5">
              <p><span className="font-bold">Compte :</span> {v.compte}</p>
              <p><span className="font-bold">Motif :</span> {v.motif}</p>
              <p><span className="font-bold">Annonces concernées :</span> {v.vehicules}</p>
            </div>
          )}
        </div>))}</div>
    </div>
  );
}
