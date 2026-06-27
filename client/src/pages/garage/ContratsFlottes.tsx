import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Check, Shield, Circle, Truck } from "lucide-react";
const CONTRATS = [
  { type: "Entretien", vehicules: 12, duree: "12 mois", prix: "890 €/mois", actif: true },
  { type: "Maintenance", vehicules: 12, duree: "12 mois", prix: "1 200 €/mois", actif: true },
  { type: "Pneumatiques", vehicules: 12, duree: "12 mois", prix: "350 €/mois", actif: false },
  { type: "Dépannage", vehicules: 12, duree: "12 mois", prix: "180 €/mois", actif: true },
];
export default function ContratsFlottes() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/garage/professionnel" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage Pro</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} /> Contrats flottes</h1></div>
      <div className="px-4 mt-4 space-y-2">{CONTRATS.map(c => (
        <div key={c.type} className={`rounded-xl bg-white border-2 p-4 ${c.actif ? "border-blue-300" : "border-[#E5E7EB]"}`}>
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">Contrat {c.type}</h3>{c.actif ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600">Actif</span> : <button className="rounded-lg bg-blue-800 px-3 py-1 text-[9px] font-bold text-white">Souscrire</button>}</div>
          <div className="mt-1 text-[10px] text-[#6B7280]"><p>{c.vehicules} véhicules · {c.duree}</p><p className="font-bold text-blue-700">{c.prix}</p></div>
        </div>))}</div>
    </div>
  );
}
