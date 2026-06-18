import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, BarChart3, Check, X, Plus, Trash2, Star,
  Fuel, Settings2, Users, Gauge, Shield, Euro
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   COMPARATEUR DE VÉHICULES
   Le client coche Véhicule A / B / C → Comparer prix, caution, km, équipements.
   ══════════════════════════════════════════════════════════════════════════ */

const ALL_VEHICLES = [
  { id: 1, nom: "Mercedes Classe E Break", prix: 63, semaine: 380, mois: 1350, caution: 1000, km: 150, conso: "5.2 L", carb: "Diesel", boite: "Auto", places: 5, note: 4.8, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=300&h=200&fit=crop", equip: ["GPS", "Cuir", "Caméra recul", "Clim auto", "CarPlay"] },
  { id: 2, nom: "BMW Série 5 530e", prix: 140, semaine: 840, mois: 2800, caution: 1500, km: 200, conso: "1.8 L", carb: "Hybride", boite: "Auto", places: 5, note: 4.9, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=300&h=200&fit=crop", equip: ["GPS", "Cuir", "Caméra 360", "Clim auto", "CarPlay", "Head-up"] },
  { id: 3, nom: "Tesla Model 3 LR", prix: 135, semaine: 810, mois: 2700, caution: 1500, km: 200, conso: "15 kWh", carb: "Électrique", boite: "Auto", places: 5, note: 4.7, photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=300&h=200&fit=crop", equip: ["Autopilot", "Écran 15\"", "Caméra 360", "Clim auto", "Supercharge"] },
  { id: 4, nom: "Peugeot 3008 GT", prix: 52, semaine: 312, mois: 1050, caution: 500, km: 200, conso: "1.4 L", carb: "Hybride", boite: "Auto", places: 5, note: 4.7, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=300&h=200&fit=crop", equip: ["GPS", "Caméra recul", "Clim auto", "Toit pano", "CarPlay"] },
  { id: 5, nom: "Renault Clio V", prix: 28, semaine: 168, mois: 580, caution: 300, km: 200, conso: "5.0 L", carb: "Essence", boite: "Manuelle", places: 5, note: 4.5, photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=300&h=200&fit=crop", equip: ["GPS", "Clim", "Bluetooth", "Régulateur"] },
];

export default function Comparateur() {
  const [selected, setSelected] = useState<number[]>([1, 2]);
  const [showAdd, setShowAdd] = useState(false);

  const vehicles = selected.map((id) => ALL_VEHICLES.find((v) => v.id === id)!).filter(Boolean);
  const allEquips = [...new Set(vehicles.flatMap((v) => v.equip))];

  const toggleVehicle = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
      setShowAdd(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Comparateur</h1>
        <p className="mt-1 text-sm text-white/60">Comparez jusqu'à 3 véhicules côte à côte</p>
      </div>

      {/* Selected vehicles header */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {vehicles.map((v) => (
          <div key={v.id} className="shrink-0 w-[140px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden relative">
            <button onClick={() => toggleVehicle(v.id)} className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"><X size={12} className="text-white" /></button>
            <img src={v.photo} alt={v.nom} className="w-full h-[70px] object-cover" />
            <div className="p-2">
              <p className="text-[11px] font-bold text-[#111] truncate">{v.nom}</p>
              <p className="text-xs font-bold text-[#D4AF37]">{v.prix} €/j</p>
            </div>
          </div>
        ))}
        {selected.length < 3 && (
          <button onClick={() => setShowAdd(true)} className="shrink-0 w-[140px] rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 flex flex-col items-center justify-center py-6">
            <Plus size={20} className="text-[#D4AF37]" />
            <span className="text-[10px] font-bold text-[#D4AF37] mt-1">Ajouter</span>
          </button>
        )}
      </div>

      {/* Add vehicle modal */}
      {showAdd && (
        <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111] mb-3">Ajouter un véhicule</h3>
          <div className="space-y-2">
            {ALL_VEHICLES.filter((v) => !selected.includes(v.id)).map((v) => (
              <button key={v.id} onClick={() => toggleVehicle(v.id)} className="w-full flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-2 text-left active:scale-[0.99]">
                <img src={v.photo} alt={v.nom} className="w-14 h-10 rounded object-cover" />
                <div className="flex-1"><p className="text-sm font-bold text-[#111]">{v.nom}</p><p className="text-xs text-[#D4AF37]">{v.prix} €/jour</p></div>
                <Plus size={16} className="text-[#D4AF37]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison table */}
      {vehicles.length >= 2 && (
        <div className="px-4 mt-4 space-y-3">
          {/* Prix */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1"><Euro size={12} /> Prix</h3></div>
            {[
              { label: "Prix / jour", key: "prix" as const, suffix: " €" },
              { label: "Prix / semaine", key: "semaine" as const, suffix: " €" },
              { label: "Prix / mois", key: "mois" as const, suffix: " €" },
              { label: "Caution", key: "caution" as const, suffix: " €" },
              { label: "Km inclus / jour", key: "km" as const, suffix: " km" },
            ].map((row) => {
              const values = vehicles.map((v) => v[row.key]);
              const min = Math.min(...values);
              return (
                <div key={row.label} className="flex items-center px-3 py-2.5 border-b border-[#F3F4F6] last:border-0">
                  <span className="w-[100px] shrink-0 text-xs text-[#6B7280]">{row.label}</span>
                  {vehicles.map((v) => (
                    <span key={v.id} className={`flex-1 text-center text-sm font-bold ${v[row.key] === min && row.key !== "km" ? "text-green-600" : v[row.key] === min && row.key === "km" ? "text-[#111]" : "text-[#111]"}`}>
                      {v[row.key]}{row.suffix}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Caractéristiques */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1"><Gauge size={12} /> Caractéristiques</h3></div>
            {[
              { label: "Carburant", fn: (v: typeof ALL_VEHICLES[0]) => v.carb },
              { label: "Boîte", fn: (v: typeof ALL_VEHICLES[0]) => v.boite },
              { label: "Places", fn: (v: typeof ALL_VEHICLES[0]) => String(v.places) },
              { label: "Consommation", fn: (v: typeof ALL_VEHICLES[0]) => v.conso },
              { label: "Note", fn: (v: typeof ALL_VEHICLES[0]) => `⭐ ${v.note}` },
            ].map((row) => (
              <div key={row.label} className="flex items-center px-3 py-2.5 border-b border-[#F3F4F6] last:border-0">
                <span className="w-[100px] shrink-0 text-xs text-[#6B7280]">{row.label}</span>
                {vehicles.map((v) => (<span key={v.id} className="flex-1 text-center text-sm font-semibold text-[#111]">{row.fn(v)}</span>))}
              </div>
            ))}
          </div>

          {/* Équipements */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1"><Shield size={12} /> Équipements</h3></div>
            {allEquips.map((eq) => (
              <div key={eq} className="flex items-center px-3 py-2 border-b border-[#F3F4F6] last:border-0">
                <span className="w-[100px] shrink-0 text-xs text-[#6B7280]">{eq}</span>
                {vehicles.map((v) => (
                  <span key={v.id} className="flex-1 flex justify-center">
                    {v.equip.includes(eq) ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-300" />}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
