import { Link } from "react-router-dom";
import { ChevronLeft, Check, Car } from "lucide-react";
const ETAPES = [
  { label: "Véhicule acheté", fait: true, date: "10/03 09:00" },
  { label: "Documents uploadés", fait: true, date: "10/03 10:30" },
  { label: "Transport organisé", fait: true, date: "10/03 14:00" },
  { label: "Réception véhicule", fait: true, date: "12/03 11:00" },
  { label: "Diagnostic", fait: true, date: "12/03 14:30" },
  { label: "Travaux", fait: true, date: "13/03 09:00" },
  { label: "Photos", fait: false, date: "" },
  { label: "Publication", fait: false, date: "" },
  { label: "Réservation", fait: false, date: "" },
  { label: "Vente", fait: false, date: "" },
  { label: "Livraison", fait: false, date: "" },
  { label: "Archivage", fait: false, date: "" },
];
export default function WorkflowAchatVO() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente/stock" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Stock</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} /> Workflow Achat VO</h1>
        <p className="mt-1 text-sm text-white/80">12 étapes — Achat → Archivage</p>
      </div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <div className="space-y-0">
          {ETAPES.map((e, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${e.fait ? "bg-blue-600 text-white" : "bg-[#E5E7EB] text-red-500"}`}>{e.fait ? <Check size={12} /> : i + 1}</div>
                {i < ETAPES.length - 1 && <div className={`w-0.5 h-8 ${e.fait ? "bg-blue-600" : "bg-[#E5E7EB]"}`} />}
              </div>
              <div className="pb-4"><p className={`text-sm ${e.fait ? "font-bold text-[#111]" : "text-red-500"}`}>{e.label}</p>{e.date && <p className="text-[9px] text-red-500">{e.date}</p>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
