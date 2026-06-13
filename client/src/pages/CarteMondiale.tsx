import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { trpc } from "../lib/trpc";

const CATEGORY_COLORS: Record<string, string> = {
  garage: "#D4AF37",
  boutique: "#16A34A",
  entrepot: "#2563EB",
  siege: "#111111",
  agence: "#7C3AED",
  lavage: "#06B6D4",
  karting: "#F59E0B",
};

const CATEGORY_LABELS: Record<string, string> = {
  garage: "Garage",
  boutique: "Boutique Pièces",
  entrepot: "Entrepôt",
  siege: "Siège",
  agence: "Agence",
  lavage: "Lavage Auto",
  karting: "Karting",
};

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function CarteMondiale() {
  const [filter, setFilter] = useState<string | null>(null);
  const { data: points, isLoading } = trpc.platformMap.publicMap.useQuery();

  const filtered = filter ? (points ?? []).filter((p) => p.category === filter) : (points ?? []);
  const categories = [...new Set((points ?? []).map((p) => p.category))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-[#111]">Carte Mondiale MKA.P-MS</h1>
      <p className="mb-6 text-[#6B7280]">Retrouvez tous nos garages, boutiques, entrepôts et agences dans le monde.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${!filter ? "bg-[#111] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"}`}
        >
          Tous ({points?.length ?? 0})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat === filter ? null : cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === cat ? "text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"}`}
            style={filter === cat ? { backgroundColor: CATEGORY_COLORS[cat] ?? "#111" } : undefined}
          >
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] ?? "#999" }} />
            {CATEGORY_LABELS[cat] ?? cat} ({(points ?? []).filter((p) => p.category === cat).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-[500px] items-center justify-center rounded-xl bg-[#F8F9FA]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] shadow-lg" style={{ height: "600px" }}>
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map((pt) => (
              <Marker
                key={`${pt.category}-${pt.id}`}
                position={[pt.lat, pt.lng]}
                icon={makeIcon(CATEGORY_COLORS[pt.category] ?? "#999")}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <div className="mb-1 text-xs font-semibold uppercase" style={{ color: CATEGORY_COLORS[pt.category] ?? "#111" }}>
                      {CATEGORY_LABELS[pt.category] ?? pt.category}
                    </div>
                    <div className="text-sm font-bold text-[#111]">{pt.name}</div>
                    {pt.city && <div className="text-xs text-[#6B7280]">{pt.city}</div>}
                    {pt.countryCode && <div className="text-xs text-[#6B7280]">{pt.countryCode}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((cat) => {
          const count = (points ?? []).filter((p) => p.category === cat).length;
          return (
            <div key={cat} className="rounded-lg border border-[#E5E7EB] bg-white p-4 text-center">
              <div className="mb-1 text-2xl font-bold" style={{ color: CATEGORY_COLORS[cat] ?? "#111" }}>{count}</div>
              <div className="text-sm text-[#6B7280]">{CATEGORY_LABELS[cat] ?? cat}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
