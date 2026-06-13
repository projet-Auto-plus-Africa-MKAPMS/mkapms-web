import { Link } from "react-router-dom";
import { MapPin, Gauge, Calendar, Fuel } from "lucide-react";
import { useCurrency } from "../lib/currency";

export interface VehicleCardData {
  id: number;
  titre: string;
  marque: string;
  modele: string;
  version?: string | null;
  annee?: number | null;
  kilometrage?: number | null;
  carburant?: string | null;
  puissanceCv?: number | null;
  prix: string | number;
  prixJour?: string | number | null;
  type: string;
  ville?: string | null;
  vendeurType?: string | null;
  boosted?: boolean | null;
  photoPrincipale?: string | null;
}

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='280'><rect width='100%' height='100%' fill='#e2e8f0'/><text x='50%' y='50%' fill='#94a3b8' font-family='sans-serif' font-size='20' text-anchor='middle' dominant-baseline='middle'>MKA.P-MS</text></svg>`,
  );

export default function VehicleCard({ v }: { v: VehicleCardData }) {
  const { format: formatPrice } = useCurrency();
  const isLocation = v.type === "location";
  const sellerLabel =
    v.vendeurType === "professionnel"
      ? "MKA.P-MS Garage"
      : v.vendeurType === "concession"
        ? "Concession"
        : "Particulier";
  return (
    <Link to={`/vehicule/${v.id}`} className="card group overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={v.photoPrincipale || PLACEHOLDER}
          alt={v.titre}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
        />
        <span className="badge absolute left-3 top-3 bg-noir/80 text-white">
          {isLocation ? "À louer" : "À vendre"}
        </span>
        {v.boosted && (
          <span className="badge absolute right-3 top-3 bg-gold text-noir">Premium</span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-dark">
          {sellerLabel}
        </p>
        <h3 className="mt-1 truncate text-sm font-bold text-slate-900">{v.titre}</h3>
        <p className="truncate text-xs text-slate-500">{v.version || `${v.marque} ${v.modele}`}</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {v.annee && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} />
              {v.annee}
            </span>
          )}
          {v.kilometrage != null && (
            <span className="inline-flex items-center gap-1">
              <Gauge size={13} />
              {v.kilometrage.toLocaleString("fr-FR")} km
            </span>
          )}
          {v.carburant && (
            <span className="inline-flex items-center gap-1">
              <Fuel size={13} />
              {v.carburant}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div className="text-lg font-extrabold text-slate-900">
            {isLocation && v.prixJour
              ? `${formatPrice(Number(v.prixJour))} /j`
              : formatPrice(Number(v.prix))}
          </div>
          {v.ville && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={13} />
              {v.ville}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
