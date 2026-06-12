import { useMemo, useState } from "react";
import { trpc } from "../lib/trpc";
import VehicleCard from "../components/VehicleCard";

const SEGMENTS = [
  { value: "", label: "Toutes catégories", desc: "" },
  { value: "particulier", label: "Particulier", desc: "Disponible 24 h après paiement" },
  { value: "vtc_taxi", label: "VTC / Taxi", desc: "VTC 48 h · Taxi le jour même" },
  { value: "professionnel", label: "Pro / Utilitaire", desc: "Disponible 48 h après paiement" },
];

export default function Louer() {
  const [segment, setSegment] = useState("");
  const input = useMemo(
    () => ({ type: "location" as const, segmentLocation: (segment || undefined) as any, limit: 48 }),
    [segment],
  );
  const list = trpc.annonces.list.useQuery(input);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Louer un véhicule</h1>
      <p className="mt-1 text-sm text-slate-500">
        Particuliers, professionnels, VTC, utilitaires — réservation 100 % sécurisée.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {SEGMENTS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSegment(s.value)}
            className={`card p-4 text-left transition ${
              segment === s.value ? "ring-2 ring-brand" : "hover:shadow-md"
            }`}
          >
            <div className="font-bold text-slate-900">{s.label}</div>
            {s.desc && <div className="mt-1 text-xs text-slate-500">{s.desc}</div>}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {list.isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card aspect-[4/5] animate-pulse bg-slate-100" />
            ))
          : list.data?.items.map((v) => <VehicleCard key={v.id} v={v as any} />)}
        {list.data && list.data.items.length === 0 && (
          <p className="col-span-full py-12 text-center text-slate-500">
            Aucune offre de location disponible pour cette catégorie.
          </p>
        )}
      </div>
    </div>
  );
}
