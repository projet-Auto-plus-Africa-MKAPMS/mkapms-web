import { useState } from "react";
import { Search, Car, Check, Fuel, Calendar, Gauge, Settings, Hash, Shield } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VehicleIdentification — Composant reutilisable d'identification vehicule
   par plaque ou VIN. Affiche toutes les informations techniques du vehicule.
   Utilise partout: depot annonce, estimation, reparation, etc.
   ══════════════════════════════════════════════════════════════════════════ */

interface VehicleData {
  marque: string;
  modele: string;
  version: string;
  annee: string;
  energie: string;
  puissance: string;
  cylindree: string;
  boite: string;
  km: string;
  couleur: string;
  carrosserie: string;
  places: string;
  portes: string;
  vin: string;
  dateCirculation: string;
  co2: string;
  normeEuro: string;
  ptac: string;
}

const DEMO_VEHICLE: VehicleData = {
  marque: "Peugeot",
  modele: "3008",
  version: "GT BlueHDi 130 EAT8",
  annee: "2022",
  energie: "Diesel",
  puissance: "130 ch (96 kW)",
  cylindree: "1 499 cm³",
  boite: "Automatique 8 rapports",
  km: "45 200 km",
  couleur: "Gris Artense",
  carrosserie: "SUV / Crossover",
  places: "5",
  portes: "5",
  vin: "VF3MCYHZRNS012345",
  dateCirculation: "15/03/2022",
  co2: "128 g/km",
  normeEuro: "Euro 6d-Full",
  ptac: "1 825 kg",
};

interface Props {
  onVehicleFound?: (vehicle: VehicleData) => void;
  compact?: boolean;
}

export default function VehicleIdentification({ onVehicleFound, compact }: Props) {
  const [method, setMethod] = useState<"plaque" | "vin">("plaque");
  const [value, setValue] = useState("");
  const [found, setFound] = useState(false);

  const handleSearch = () => {
    if (value.length >= 4) {
      setFound(true);
      onVehicleFound?.(DEMO_VEHICLE);
    }
  };

  return (
    <div className="space-y-3">
      {/* Methode de recherche */}
      <div className="flex gap-2">
        <button onClick={() => { setMethod("plaque"); setFound(false); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${method === "plaque" ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>Plaque</button>
        <button onClick={() => { setMethod("vin"); setFound(false); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${method === "vin" ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>VIN</button>
      </div>

      {/* Champ de saisie */}
      <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={method === "plaque" ? "AA-123-BB" : "VF1XXXXXXXXX12345"}
            className={`flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm font-bold uppercase ${method === "plaque" ? "text-center" : "font-mono text-xs"}`}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch} className={`px-4 rounded-lg text-white text-xs font-bold flex items-center gap-1 ${value.length >= 4 ? "bg-[#D4AF37]" : "bg-[#D4D4D4]"}`}>
            <Search size={14} /> Identifier
          </button>
        </div>
      </div>

      {/* Resultats */}
      {found && (
        <div className="rounded-xl bg-white border-2 border-green-300 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-3 py-2 flex items-center gap-2">
            <Check size={14} className="text-white" />
            <span className="text-xs font-bold text-white">Vehicule identifie avec succes</span>
          </div>

          {/* Vehicule principal */}
          <div className="p-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-[#D4AF37]" />
              <div>
                <p className="text-sm font-black text-[#111]">{DEMO_VEHICLE.marque} {DEMO_VEHICLE.modele}</p>
                <p className="text-[10px] text-[#6B7280]">{DEMO_VEHICLE.version}</p>
              </div>
            </div>
          </div>

          {/* Grille informations techniques */}
          <div className={`p-3 ${compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 sm:grid-cols-3 gap-2"}`}>
            {[
              { icon: Calendar, label: "Annee", val: DEMO_VEHICLE.annee },
              { icon: Fuel, label: "Energie", val: DEMO_VEHICLE.energie },
              { icon: Settings, label: "Puissance", val: DEMO_VEHICLE.puissance },
              { icon: Gauge, label: "Kilometrage", val: DEMO_VEHICLE.km },
              { icon: Settings, label: "Cylindree", val: DEMO_VEHICLE.cylindree },
              { icon: Settings, label: "Boite", val: DEMO_VEHICLE.boite },
              { icon: Car, label: "Carrosserie", val: DEMO_VEHICLE.carrosserie },
              { icon: Car, label: "Couleur", val: DEMO_VEHICLE.couleur },
              { icon: Hash, label: "Places", val: DEMO_VEHICLE.places },
              { icon: Hash, label: "Portes", val: DEMO_VEHICLE.portes },
              { icon: Shield, label: "Norme Euro", val: DEMO_VEHICLE.normeEuro },
              { icon: Shield, label: "CO2", val: DEMO_VEHICLE.co2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg bg-[#F5F3EF] p-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Icon size={10} className="text-[#D4AF37]" />
                    <span className="text-[9px] text-[#6B7280]">{item.label}</span>
                  </div>
                  <p className="text-[10px] font-bold text-[#111]">{item.val}</p>
                </div>
              );
            })}
          </div>

          {/* VIN + Date */}
          <div className="px-3 pb-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#111] p-2">
              <span className="text-[8px] text-white/50">VIN</span>
              <p className="text-[9px] font-mono text-[#D4AF37]">{DEMO_VEHICLE.vin}</p>
            </div>
            <div className="rounded-lg bg-[#111] p-2">
              <span className="text-[8px] text-white/50">1ere circulation</span>
              <p className="text-[9px] font-bold text-white">{DEMO_VEHICLE.dateCirculation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
