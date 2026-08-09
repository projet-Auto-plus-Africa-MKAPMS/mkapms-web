import { useState } from "react";
import { Search, Car, Check, Fuel, Calendar, Settings, Hash, AlertCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   VehicleIdentification — Composant reutilisable d'identification vehicule
   par plaque ou VIN. Utilise partout: depot annonce, estimation, reparation.
   L'identification passe par le service reel (API plaque + repli base MKA.P-MS) :
   aucune fiche n'est affichee tant que le vehicule n'est pas reconnu.
   ══════════════════════════════════════════════════════════════════════════ */

export interface VehicleData {
  marque: string;
  modele: string;
  version: string | null;
  annee: number | null;
  carburant: string | null;
  boite: string | null;
  puissance: string | null;
  categorie: string | null;
  plaque?: string;
  vin?: string;
}

interface Props {
  onVehicleFound?: (vehicle: VehicleData) => void;
  compact?: boolean;
}

export default function VehicleIdentification({ onVehicleFound, compact }: Props) {
  const [method, setMethod] = useState<"plaque" | "vin">("plaque");
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const utils = trpc.useUtils();

  const handleSearch = async () => {
    const q = value.replace(/\s/g, "").toUpperCase();
    if (q.length < 4) return;
    setVehicle(null);
    setNotFound(false);
    setQuery(q);
    setSearching(true);
    try {
      const data = await utils.annonces.lookupPlate.fetch({ type: method, query: q });
      if (data?.marque) {
        const v: VehicleData = {
          marque: data.marque,
          modele: data.modele ?? "",
          version: data.version ?? null,
          annee: data.annee ?? null,
          carburant: data.carburant ?? null,
          boite: data.boite ?? null,
          puissance: data.puissance ? String(data.puissance) : null,
          categorie: data.categorie ?? null,
          ...(method === "plaque" ? { plaque: q } : { vin: q }),
        };
        setVehicle(v);
        onVehicleFound?.(v);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const reset = () => {
    setVehicle(null);
    setNotFound(false);
    setQuery("");
  };

  const fields: { icon: typeof Car; label: string; val: string | null }[] = [
    { icon: Calendar, label: "Annee", val: vehicle?.annee ? String(vehicle.annee) : null },
    { icon: Fuel, label: "Energie", val: vehicle?.carburant ?? null },
    { icon: Settings, label: "Puissance", val: vehicle?.puissance ?? null },
    { icon: Settings, label: "Boite", val: vehicle?.boite ?? null },
    { icon: Car, label: "Categorie", val: vehicle?.categorie ?? null },
    { icon: Hash, label: method === "plaque" ? "Plaque" : "VIN", val: query || null },
  ];

  return (
    <div className="space-y-3">
      {/* Methode de recherche */}
      <div className="flex gap-2">
        <button onClick={() => { setMethod("plaque"); reset(); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${method === "plaque" ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>Plaque</button>
        <button onClick={() => { setMethod("vin"); reset(); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${method === "vin" ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>VIN</button>
      </div>

      {/* Champ de saisie */}
      <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); reset(); }}
            placeholder={method === "plaque" ? "AA-123-BB" : "VF1XXXXXXXXX12345"}
            className={`flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm font-bold uppercase ${method === "plaque" ? "text-center" : "font-mono text-xs"}`}
            onKeyDown={(e) => { if (e.key === "Enter") void handleSearch(); }}
          />
          <button
            onClick={() => void handleSearch()}
            disabled={value.replace(/\s/g, "").length < 4 || searching}
            className={`px-4 rounded-lg text-white text-xs font-bold flex items-center gap-1 ${value.replace(/\s/g, "").length >= 4 ? "bg-[#D4AF37]" : "bg-[#D4D4D4]"}`}
          >
            <Search size={14} /> {searching ? "Recherche..." : "Identifier"}
          </button>
        </div>
      </div>

      {/* Vehicule non reconnu — on le dit, on n'invente pas de fiche */}
      {notFound && !searching && (
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-[#B45309] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#111]">Vehicule non identifie</p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Ce {method === "plaque" ? "numero de plaque" : "VIN"} n'a pas ete reconnu. Vous pouvez saisir
              les informations du vehicule a la main.
            </p>
          </div>
        </div>
      )}

      {/* Resultats */}
      {vehicle && (
        <div className="rounded-xl bg-white border-2 border-green-300 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-3 py-2 flex items-center gap-2">
            <Check size={14} className="text-white" />
            <span className="text-xs font-bold text-white">Vehicule identifie</span>
          </div>

          <div className="p-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-[#D4AF37]" />
              <div>
                <p className="text-sm font-black text-[#111]">{vehicle.marque} {vehicle.modele}</p>
                {vehicle.version && <p className="text-[10px] text-[#6B7280]">{vehicle.version}</p>}
              </div>
            </div>
          </div>

          {/* Seules les informations réellement retournées sont affichées */}
          <div className={`p-3 ${compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 sm:grid-cols-3 gap-2"}`}>
            {fields.filter((f) => f.val).map((item) => {
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
        </div>
      )}
    </div>
  );
}
