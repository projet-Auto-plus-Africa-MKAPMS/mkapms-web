import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Package, Search, Filter, Check, Clock, Truck, Wrench, Camera, Tag, Archive, ChevronDown } from "lucide-react";

const STATUTS = [
  { id: "achat_prevu", label: "Achat prévu", color: "bg-gray-400" },
  { id: "achat_valide", label: "Achat validé", color: "bg-blue-400" },
  { id: "en_transport", label: "En transport", color: "bg-cyan-500" },
  { id: "arrive", label: "Arrivé", color: "bg-indigo-500" },
  { id: "diagnostic", label: "Diagnostic", color: "bg-purple-500" },
  { id: "reparation", label: "Réparation", color: "bg-orange-500" },
  { id: "preparation", label: "Préparation", color: "bg-amber-500" },
  { id: "photos", label: "Photos", color: "bg-pink-500" },
  { id: "publication", label: "Publication", color: "bg-green-500" },
  { id: "reserve", label: "Réservé", color: "bg-[#D4AF37]" },
  { id: "vendu", label: "Vendu", color: "bg-green-700" },
  { id: "livre", label: "Livré", color: "bg-emerald-600" },
  { id: "archive", label: "Archivé", color: "bg-gray-600" },
];

const VEHICULES = [
  { id: 1, nom: "Peugeot 3008 GT", statut: "publication", date: "15/03 14:30", prix: 26000, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=200&h=130&fit=crop" },
  { id: 2, nom: "BMW 320d M Sport", statut: "reparation", date: "14/03 10:00", prix: 28500, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&h=130&fit=crop" },
  { id: 3, nom: "Renault Clio V", statut: "en_transport", date: "13/03 16:45", prix: 14500, photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=200&h=130&fit=crop" },
  { id: 4, nom: "Mercedes Classe E 220d", statut: "reserve", date: "12/03 09:15", prix: 38500, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=200&h=130&fit=crop" },
];

export default function GestionStockVO() {
  const [filterStatut, setFilterStatut] = useState("tous");
  const filtered = filterStatut === "tous" ? VEHICULES : VEHICULES.filter((v) => v.statut === filterStatut);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Tableau de bord</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} /> Gestion Stock VO</h1>
        <p className="mt-1 text-sm text-white/80">{VEHICULES.length} véhicules · 13 statuts horodatés</p>
      </div>

      {/* Statut chips */}
      <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setFilterStatut("tous")} className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-bold ${filterStatut === "tous" ? "bg-blue-800 text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>Tous</button>
        {STATUTS.map((s) => (
          <button key={s.id} onClick={() => setFilterStatut(s.id)} className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-bold flex items-center gap-1 ${filterStatut === s.id ? "bg-blue-800 text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.color}`} />{s.label}
          </button>
        ))}
      </div>

      {/* Vehicles */}
      <div className="px-4 mt-3 space-y-2">
        {filtered.map((v) => {
          const s = STATUTS.find((st) => st.id === v.statut)!;
          return (
            <div key={v.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
              <img src={v.photo} alt="" className="w-16 h-11 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#111] truncate">{v.nom}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-bold text-white ${s.color}`}>{s.label}</span>
                  <span className="text-[8px] text-red-500">{v.date}</span>
                </div>
              </div>
              <span className="text-sm font-black text-blue-800">{v.prix.toLocaleString("fr-FR")} €</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
