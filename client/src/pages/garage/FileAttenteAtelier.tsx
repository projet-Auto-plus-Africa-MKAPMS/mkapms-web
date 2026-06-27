import { Link } from "react-router-dom";
import { ChevronLeft, List, AlertTriangle, Clock, Check, Package } from "lucide-react";
const VEHICULES = [
  { vehicule: "BMW 320d", client: "Jean D.", priorite: "Urgent", motif: "Freinage", color: "border-red-300" },
  { vehicule: "Peugeot 208", client: "Marie L.", priorite: "Normal", motif: "Révision", color: "border-[#E5E7EB]" },
  { vehicule: "Clio V", client: "SAS Auto+", priorite: "Programmé", motif: "Distribution", color: "border-blue-300" },
  { vehicule: "Golf VIII", client: "Ahmed K.", priorite: "Attente pièces", motif: "Embrayage", color: "border-amber-300" },
  { vehicule: "C3", client: "Paul M.", priorite: "Attente client", motif: "Devis envoyé", color: "border-gray-300" },
];
export default function FileAttenteAtelier() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><List size={20} className="text-[#D4AF37]" /> File d'attente</h1></div>
      <div className="px-4 mt-4 space-y-2">{VEHICULES.map(v => (
        <div key={v.vehicule} className={`rounded-xl bg-white border-2 p-4 ${v.color}`}>
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{v.vehicule}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${v.priorite === "Urgent" ? "bg-red-50 text-red-600" : v.priorite === "Normal" ? "bg-green-50 text-green-600" : v.priorite === "Programmé" ? "bg-blue-50 text-blue-600" : v.priorite === "Attente pièces" ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-600"}`}>{v.priorite}</span></div>
          <p className="text-[10px] text-[#6B7280] mt-0.5">{v.client} · {v.motif}</p>
        </div>))}</div>
    </div>
  );
}
