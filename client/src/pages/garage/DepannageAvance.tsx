import { Link } from "react-router-dom";
import { ChevronLeft, AlertTriangle, MapPin, Camera, Truck, Clock, Phone } from "lucide-react";
const TYPES = ["Panne", "Accident", "Batterie", "Crevaison", "Erreur carburant"];
const SUIVI = [
  { label: "Demande envoyée", fait: true, heure: "14:30" },
  { label: "Dépanneur assigné", fait: true, heure: "14:35" },
  { label: "En route — 15 min", fait: true, heure: "14:36" },
  { label: "Arrivé sur place", fait: false, heure: "" },
];
export default function DepannageAvance() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-red-700 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} /> Dépannage avancé</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">{SUIVI.map((s, i) => (
        <div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center"><div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${s.fait ? "bg-red-600 text-white" : "bg-[#E5E7EB] text-red-500"}`}>{i + 1}</div>{i < SUIVI.length - 1 && <div className={`w-0.5 h-4 ${s.fait ? "bg-red-400" : "bg-[#E5E7EB]"}`} />}</div><div className="pb-2"><p className={`text-sm ${s.fait ? "font-bold text-[#111]" : "text-red-500"}`}>{s.label}</p>{s.heure && <p className="text-[9px] text-red-500">{s.heure}</p>}</div></div>))}</div>
      <div className="mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-center"><p className="text-[10px] text-red-600">Tarif estimé: <span className="font-bold">89 €</span> · Délai: <span className="font-bold">15 min</span></p></div>
    </div>
  );
}
