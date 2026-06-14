import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Search, MapPin, BellPlus } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import VehicleCard from "../components/VehicleCard";

const SEGMENTS = [
  { value: "", label: "Toutes catégories", desc: "" },
  { value: "vtc_taxi", label: "VTC / Taxi", desc: "Véhicules conformes VTC et Taxi" },
  { value: "particulier", label: "Particulier", desc: "Disponible 24 h après paiement" },
  { value: "professionnel", label: "Pro / Utilitaire", desc: "Disponible 48 h après paiement" },
];

const ZONES = [
  { value: "", label: "Toute la France" },
  { value: "75", label: "75 — Paris" },
  { value: "13", label: "13 — Bouches-du-Rhône" },
  { value: "69", label: "69 — Rhône (Lyon)" },
  { value: "31", label: "31 — Haute-Garonne (Toulouse)" },
  { value: "33", label: "33 — Gironde (Bordeaux)" },
  { value: "06", label: "06 — Alpes-Maritimes (Nice)" },
  { value: "59", label: "59 — Nord (Lille)" },
];

export default function Louer() {
  const [segment, setSegment] = useState("");
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("");
  const { user } = useAuth();

  const input = useMemo(
    () => ({
      type: "location" as const,
      q: q || undefined,
      segmentLocation: (segment || undefined) as any,
      ville: zone || undefined,
      limit: 48,
    }),
    [segment, q, zone],
  );
  const list = trpc.annonces.list.useQuery(input);

  const allItems = list.data?.items || [];
  const vtcItems = allItems.filter((v: any) => v.vendeurType === "professionnel" || v.boosted);
  const classicItems = allItems.filter((v: any) => v.vendeurType !== "professionnel" && !v.boosted);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Louer un véhicule</h1>
      <p className="mt-1 text-sm text-slate-500">
        {list.data ? `${list.data.total} véhicule(s) disponible(s)` : "Recherche…"}
      </p>

      {/* ── Recherche + Filtres en premier ── */}
      <div className="mt-6 card p-4">
        <h2 className="font-bold text-[#111] mb-3">Rechercher une location</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label flex items-center gap-1"><Search size={14} className="text-[#D4AF37]" /> Recherche</label>
            <input className="input text-sm" placeholder="Marque, modèle…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <label className="label flex items-center gap-1"><MapPin size={14} className="text-[#D4AF37]" /> Zone</label>
            <select className="input text-sm" value={zone} onChange={(e) => setZone(e.target.value)}>
              {ZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select className="input text-sm" value={segment} onChange={(e) => setSegment(e.target.value)}>
              {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Segments visuels ── */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SEGMENTS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSegment(s.value)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${
              segment === s.value ? "border-[#D4AF37] bg-[#D4AF37]/5 ring-1 ring-[#D4AF37]" : "border-[#E5E7EB] hover:shadow-md hover:border-[#D4AF37]"
            }`}
          >
            <div className="font-bold text-sm text-[#111]">{s.label}</div>
            {s.desc && <div className="text-[10px] text-[#6B7280]">{s.desc}</div>}
          </button>
        ))}
      </div>

      {/* ── Carrousel VTC & Taxis en dessous ── */}
      {vtcItems.length > 0 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#111]">
            <Star size={18} className="text-[#D4AF37]" fill="#D4AF37" /> Location VTC & Taxis — Professionnels
          </h2>
          <p className="mt-1 text-xs text-[#6B7280]">Véhicules conformes VTC et Taxi pour professionnels</p>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {vtcItems.map((v: any) => (
              <div key={v.id} className="w-[220px] shrink-0 snap-start">
                <VehicleCard v={v as any} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Annonces classiques en grille ── */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#111]">
          {segment ? SEGMENTS.find((s) => s.value === segment)?.label : "Tous les véhicules en location"}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {list.isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card aspect-[4/5] animate-pulse bg-slate-100" />
              ))
            : (classicItems.length > 0 ? classicItems : allItems).map((v: any) => (
                <VehicleCard key={v.id} v={v as any} />
              ))}
          {list.data && list.data.items.length === 0 && (
            <p className="col-span-full py-12 text-center text-slate-500">
              Aucune offre de location disponible pour cette catégorie.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
