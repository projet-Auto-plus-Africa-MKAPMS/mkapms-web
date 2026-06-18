import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Calendar, ChevronRight, Car, Check
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   DISPONIBILITÉ CALENDRIER AVANCÉE
   Calendrier visuel : 🟢 Libre / 🟡 Réservé prochainement / 🔴 Occupé
   ══════════════════════════════════════════════════════════════════════════ */

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

type DayStatus = "libre" | "reserve_bientot" | "occupe" | null;

function generateMonth(year: number, month: number): { day: number; status: DayStatus }[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const days: { day: number; status: DayStatus }[] = [];
  for (let i = 0; i < offset; i++) days.push({ day: 0, status: null });
  for (let d = 1; d <= daysInMonth; d++) {
    let status: DayStatus = "libre";
    if (d >= 5 && d <= 12) status = "occupe";
    else if (d >= 13 && d <= 14) status = "reserve_bientot";
    else if (d >= 20 && d <= 25) status = "occupe";
    days.push({ day: d, status });
  }
  return days;
}

const VEHICULES = [
  { id: 1, nom: "Mercedes Classe E Break", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=200&h=130&fit=crop" },
  { id: 2, nom: "BMW Série 5 530e", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&h=130&fit=crop" },
  { id: 3, nom: "Peugeot 3008 GT", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=200&h=130&fit=crop" },
];

const STATUS_COLORS = {
  libre: "bg-green-400",
  reserve_bientot: "bg-amber-400",
  occupe: "bg-red-400",
};

export default function CalendrierDispo() {
  const [moisIdx, setMoisIdx] = useState(2);
  const [selectedVehicle, setSelectedVehicle] = useState(0);
  const year = 2025;
  const days = generateMonth(year, moisIdx);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Disponibilité</h1>
        <p className="mt-1 text-sm text-white/60">Calendrier en temps réel</p>
      </div>

      {/* Legend */}
      <div className="px-4 mt-4 flex gap-3 justify-center">
        <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-400" /><span className="text-[10px] text-[#6B7280]">Libre</span></div>
        <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="text-[10px] text-[#6B7280]">Bientôt réservé</span></div>
        <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-400" /><span className="text-[10px] text-[#6B7280]">Occupé</span></div>
      </div>

      {/* Vehicle selector */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {VEHICULES.map((v, i) => (
          <button key={v.id} onClick={() => setSelectedVehicle(i)} className={`shrink-0 flex items-center gap-2 rounded-xl p-2 pr-3 transition ${selectedVehicle === i ? "bg-[#111] text-white" : "bg-white text-[#111] border border-[#E5E7EB]"}`}>
            <img src={v.photo} alt="" className="w-10 h-7 rounded object-cover" />
            <span className="text-[11px] font-bold truncate max-w-[100px]">{v.nom}</span>
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="px-4 mt-4 flex items-center justify-between">
        <button onClick={() => setMoisIdx(Math.max(0, moisIdx - 1))} className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center"><ChevronLeft size={16} /></button>
        <h2 className="text-base font-bold text-[#111]">{MOIS[moisIdx]} {year}</h2>
        <button onClick={() => setMoisIdx(Math.min(11, moisIdx + 1))} className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center"><ChevronRight size={16} /></button>
      </div>

      {/* Calendar grid */}
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {JOURS.map((j) => (<div key={j} className="text-center text-[9px] font-bold text-[#6B7280]">{j}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => (
            <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-lg">
              {d.day > 0 ? (
                <>
                  <span className="text-xs font-semibold text-[#111]">{d.day}</span>
                  <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${d.status ? STATUS_COLORS[d.status] : ""}`} />
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-green-600">{days.filter((d) => d.status === "libre").length}</p>
          <p className="text-[9px] text-[#6B7280]">Jours libres</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-amber-600">{days.filter((d) => d.status === "reserve_bientot").length}</p>
          <p className="text-[9px] text-[#6B7280]">Bientôt réservés</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-red-600">{days.filter((d) => d.status === "occupe").length}</p>
          <p className="text-[9px] text-[#6B7280]">Occupés</p>
        </div>
      </div>

      <div className="px-4 mt-4">
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition">
          Réserver les dates disponibles
        </button>
      </div>
    </div>
  );
}
