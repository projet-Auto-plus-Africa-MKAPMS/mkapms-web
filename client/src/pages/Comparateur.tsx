import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, BarChart3, Check, X, Plus, Trash2, Star,
  Fuel, Settings2, Users, Gauge, Shield, Euro, Car,
  Calendar, Zap, Cog
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   COMPARATEUR DE VEHICULES — jusqu'a 4 vehicules
   Prix, km, annee, carburant, puissance, equipements complets
   ══════════════════════════════════════════════════════════════════════════ */

const ALL_VEHICLES = [
  { id: 1, nom: "Mercedes Classe C 220d", prix: 35900, km: 22000, annee: 2023, carb: "Diesel", boite: "Auto", puissance: "200 ch", places: 5, portes: 4, conso: "5.2 L/100km", co2: "118 g/km", note: 4.8, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=300&h=200&fit=crop", equip: ["GPS", "Cuir", "Camera recul", "Clim auto bi-zone", "Apple CarPlay", "Android Auto", "Sieges chauffants", "Regulateur adaptatif", "Aide stationnement", "Phares LED", "Toit ouvrant", "Demarrage sans cle"] },
  { id: 2, nom: "BMW Serie 3 320i", prix: 32000, km: 8000, annee: 2024, carb: "Essence", boite: "Auto", puissance: "184 ch", places: 5, portes: 4, conso: "6.1 L/100km", co2: "139 g/km", note: 4.9, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=300&h=200&fit=crop", equip: ["GPS", "Cuir", "Camera 360", "Clim auto bi-zone", "Apple CarPlay", "Android Auto", "Head-up display", "Sieges chauffants", "Regulateur adaptatif", "Phares LED", "Jantes alliage 18\"", "Demarrage sans cle", "Suspension adaptative"] },
  { id: 3, nom: "Peugeot 3008 GT Hybrid", prix: 28500, km: 15000, annee: 2024, carb: "Hybride", boite: "Auto", puissance: "225 ch", places: 5, portes: 5, conso: "1.4 L/100km", co2: "32 g/km", note: 4.7, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=300&h=200&fit=crop", equip: ["GPS", "Camera recul", "Clim auto bi-zone", "Apple CarPlay", "Android Auto", "Toit panoramique", "Sieges chauffants", "Aide stationnement", "Phares LED", "Hayon electrique", "Regulateur adaptatif"] },
  { id: 4, nom: "Tesla Model 3 Long Range", prix: 38900, km: 12000, annee: 2024, carb: "Electrique", boite: "Auto", puissance: "340 ch", places: 5, portes: 4, conso: "15 kWh/100km", co2: "0 g/km", note: 4.7, photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=300&h=200&fit=crop", equip: ["Autopilot", "Ecran 15\"", "Camera 360", "Clim auto", "Navigation", "Supercharge", "Sieges chauffants", "Phares LED", "Demarrage sans cle", "Coffre electrique", "Mode sentinelle", "Mise a jour OTA"] },
  { id: 5, nom: "Audi A4 40 TDI", prix: 34500, km: 18000, annee: 2023, carb: "Diesel", boite: "Auto", puissance: "204 ch", places: 5, portes: 4, conso: "4.9 L/100km", co2: "128 g/km", note: 4.6, photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=300&h=200&fit=crop", equip: ["GPS", "Cuir", "Camera recul", "Clim auto tri-zone", "Apple CarPlay", "Android Auto", "Sieges chauffants", "Regulateur adaptatif", "Phares Matrix LED", "Virtual cockpit", "Aide stationnement", "Bang & Olufsen"] },
  { id: 6, nom: "Renault Clio V TCe 130", prix: 18500, km: 5000, annee: 2024, carb: "Essence", boite: "Auto", puissance: "130 ch", places: 5, portes: 5, conso: "5.0 L/100km", co2: "114 g/km", note: 4.5, photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=300&h=200&fit=crop", equip: ["GPS", "Clim auto", "Bluetooth", "Regulateur", "Camera recul", "Apple CarPlay", "Android Auto", "Phares LED", "Aide stationnement"] },
  { id: 7, nom: "Volkswagen Golf 8 R-Line", prix: 29900, km: 10000, annee: 2024, carb: "Essence", boite: "Auto", puissance: "150 ch", places: 5, portes: 5, conso: "5.6 L/100km", co2: "127 g/km", note: 4.7, photo: "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=300&h=200&fit=crop", equip: ["GPS", "Digital cockpit", "Camera recul", "Clim auto bi-zone", "Apple CarPlay", "Android Auto", "Sieges sport", "Regulateur adaptatif", "Phares LED IQ", "Aide stationnement", "Hayon electrique", "Harman Kardon"] },
];

export default function Comparateur() {
  const [selected, setSelected] = useState<number[]>([1, 2]);
  const [showAdd, setShowAdd] = useState(false);

  const vehicles = selected.map((id) => ALL_VEHICLES.find((v) => v.id === id)!).filter(Boolean);
  const allEquips = [...new Set(vehicles.flatMap((v) => v.equip))].sort();

  const toggleVehicle = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < 4) {
      setSelected([...selected, id]);
      setShowAdd(false);
    }
  };

  const bestPrice = vehicles.length > 0 ? Math.min(...vehicles.map((v) => v.prix)) : 0;
  const bestKm = vehicles.length > 0 ? Math.min(...vehicles.map((v) => v.km)) : 0;
  const bestYear = vehicles.length > 0 ? Math.max(...vehicles.map((v) => v.annee)) : 0;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Comparateur</h1>
        <p className="mt-1 text-sm text-white/60">Comparez jusqu'a 4 vehicules cote a cote</p>
      </div>

      {/* Selected vehicles header */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {vehicles.map((v) => (
          <div key={v.id} className="shrink-0 w-[130px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden relative">
            <button onClick={() => toggleVehicle(v.id)} className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"><X size={12} className="text-white" /></button>
            <img src={v.photo} alt={v.nom} className="w-full h-[65px] object-cover" />
            <div className="p-2">
              <p className="text-[10px] font-bold text-[#111] truncate">{v.nom}</p>
              <p className="text-xs font-bold text-[#D4AF37]">{v.prix.toLocaleString("fr-FR")} EUR</p>
            </div>
          </div>
        ))}
        {selected.length < 4 && (
          <button onClick={() => setShowAdd(true)} className="shrink-0 w-[130px] rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 flex flex-col items-center justify-center py-6">
            <Plus size={20} className="text-[#D4AF37]" />
            <span className="text-[10px] font-bold text-[#D4AF37] mt-1">Ajouter ({4 - selected.length} restant{4 - selected.length > 1 ? "s" : ""})</span>
          </button>
        )}
      </div>

      {/* Add vehicle picker */}
      {showAdd && (
        <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#111]">Ajouter un vehicule</h3>
            <button onClick={() => setShowAdd(false)} className="text-xs text-slate-400 hover:text-slate-600"><X size={14} /></button>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {ALL_VEHICLES.filter((v) => !selected.includes(v.id)).map((v) => (
              <button key={v.id} onClick={() => toggleVehicle(v.id)} className="w-full flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-2 text-left active:scale-[0.99] hover:border-[#D4AF37] transition">
                <img src={v.photo} alt={v.nom} className="w-14 h-10 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{v.nom}</p>
                  <p className="text-xs text-slate-500">{v.annee} . {v.km.toLocaleString("fr-FR")} km . {v.carb}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-[#D4AF37]">{v.prix.toLocaleString("fr-FR")} EUR</p>
                  <Plus size={14} className="text-[#D4AF37] ml-auto" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison tables */}
      {vehicles.length >= 2 && (
        <div className="px-4 mt-4 space-y-3">
          {/* Prix & Budget */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1"><Euro size={12} /> Prix & Budget</h3></div>
            {[
              { label: "Prix", fn: (v: typeof ALL_VEHICLES[0]) => v.prix, format: (val: number) => `${val.toLocaleString("fr-FR")} EUR`, best: bestPrice },
              { label: "Kilometrage", fn: (v: typeof ALL_VEHICLES[0]) => v.km, format: (val: number) => `${val.toLocaleString("fr-FR")} km`, best: bestKm },
              { label: "Consommation", fn: (v: typeof ALL_VEHICLES[0]) => v.conso, format: null, best: null },
              { label: "Emissions CO2", fn: (v: typeof ALL_VEHICLES[0]) => v.co2, format: null, best: null },
            ].map((row) => (
              <div key={row.label} className="flex items-center px-3 py-2.5 border-b border-[#F3F4F6] last:border-0">
                <span className="w-[90px] shrink-0 text-xs text-[#6B7280]">{row.label}</span>
                {vehicles.map((v) => {
                  const val = row.fn(v);
                  const displayed = row.format ? row.format(val as number) : String(val);
                  const isBest = row.best !== null && val === row.best;
                  return (
                    <span key={v.id} className={`flex-1 text-center text-sm font-bold ${isBest ? "text-green-600" : "text-[#111]"}`}>
                      {displayed}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Caracteristiques techniques */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1"><Gauge size={12} /> Caracteristiques</h3></div>
            {[
              { label: "Annee", fn: (v: typeof ALL_VEHICLES[0]) => String(v.annee) },
              { label: "Carburant", fn: (v: typeof ALL_VEHICLES[0]) => v.carb },
              { label: "Puissance", fn: (v: typeof ALL_VEHICLES[0]) => v.puissance },
              { label: "Boite", fn: (v: typeof ALL_VEHICLES[0]) => v.boite },
              { label: "Places", fn: (v: typeof ALL_VEHICLES[0]) => String(v.places) },
              { label: "Portes", fn: (v: typeof ALL_VEHICLES[0]) => String(v.portes) },
              { label: "Note", fn: (v: typeof ALL_VEHICLES[0]) => `${v.note}/5` },
            ].map((row) => (
              <div key={row.label} className="flex items-center px-3 py-2.5 border-b border-[#F3F4F6] last:border-0">
                <span className="w-[90px] shrink-0 text-xs text-[#6B7280]">{row.label}</span>
                {vehicles.map((v) => (<span key={v.id} className="flex-1 text-center text-sm font-semibold text-[#111]">{row.fn(v)}</span>))}
              </div>
            ))}
          </div>

          {/* Equipements */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2">
              <h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1"><Shield size={12} /> Equipements ({allEquips.length})</h3>
            </div>
            {allEquips.map((eq) => (
              <div key={eq} className="flex items-center px-3 py-2 border-b border-[#F3F4F6] last:border-0">
                <span className="w-[90px] shrink-0 text-[11px] text-[#6B7280]">{eq}</span>
                {vehicles.map((v) => (
                  <span key={v.id} className="flex-1 flex justify-center">
                    {v.equip.includes(eq) ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-300" />}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Score */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1"><Star size={12} /> Score global</h3></div>
            <div className="flex items-center px-3 py-3">
              <span className="w-[90px] shrink-0 text-xs text-[#6B7280]">Equipements</span>
              {vehicles.map((v) => {
                const score = Math.round((v.equip.length / allEquips.length) * 100);
                return (
                  <div key={v.id} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full max-w-[80px] h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[#111]">{score}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {vehicles.length < 2 && (
        <div className="px-4 mt-8 text-center">
          <BarChart3 size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Selectionnez au moins 2 vehicules</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Ajoutez des vehicules pour les comparer</p>
        </div>
      )}
    </div>
  );
}
