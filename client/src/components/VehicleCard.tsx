import { Link } from "react-router-dom";
import { MapPin, Gauge, Calendar, Fuel } from "lucide-react";
import { useCurrency } from "../lib/currency";
import { computeBadges, type Badge } from "@shared/badges";

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
  tier?: string | null;
  status?: string | null;
  certified?: boolean | null;
  planCode?: string | null;
  createdAt?: string | null;
  urgent?: boolean | null;
  coupDeCoeur?: boolean | null;
  prixEnBaisse?: boolean | null;
  segmentLocation?: string | null;
}

function getCardTier(v: VehicleCardData): "officiel" | "elite" | "premium" | "professionnel" | "particulier" {
  if (v.id >= 8000 && v.id <= 8005) return "officiel";
  if (v.tier === "elite") return "elite";
  if (v.boosted && v.vendeurType === "professionnel") return "premium";
  if (v.vendeurType === "professionnel" || v.vendeurType === "concession") return "professionnel";
  return "particulier";
}

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='280'><rect width='100%' height='100%' fill='#e2e8f0'/><text x='50%' y='50%' fill='#94a3b8' font-family='sans-serif' font-size='20' text-anchor='middle' dominant-baseline='middle'>MKA.P-MS</text></svg>`,
  );

function BadgeChip({ badge }: { badge: Badge }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.color} ${badge.textColor} ${badge.borderColor ? `border ${badge.borderColor}` : ""}`}
    >
      {badge.label}
    </span>
  );
}

export { BadgeChip };

export default function VehicleCard({ v }: { v: VehicleCardData }) {
  const { format: formatPrice } = useCurrency();
  const isLocation = v.type === "location";
  const isMkapmsStock = v.id >= 8000 && v.id <= 8005;
  const sellerLabel =
    isMkapmsStock
      ? "MKA.P-MS Officiel"
      : v.vendeurType === "professionnel"
        ? "Professionnel"
        : v.vendeurType === "concession"
          ? "Concession"
          : "Particulier";
  const tier = getCardTier(v);
  const isOfficielTier = tier === "officiel" || tier === "elite";
  const photoHeight =
    tier === "officiel" || tier === "elite"
      ? "h-[200px] lg:h-[260px]"
      : tier === "premium"
        ? "h-[180px] lg:h-[240px]"
        : tier === "professionnel"
          ? "h-[160px] lg:h-[220px]"
          : "h-[140px] lg:h-[200px]";

  const badges = computeBadges({
    id: v.id,
    vendeurType: v.vendeurType,
    type: v.type,
    status: v.status,
    boosted: v.boosted,
    certified: v.certified,
    tier: v.tier,
    planCode: v.planCode,
    urgent: v.urgent,
    coupDeCoeur: v.coupDeCoeur,
    prixEnBaisse: v.prixEnBaisse,
    createdAt: v.createdAt,
  }).filter((b) => !(isMkapmsStock && (b.code === "vendeur_pro" || b.code === "garage_verifie")));

  return (
    <Link to={`/vehicule/${v.id}`} className={`card group overflow-hidden transition hover:shadow-md ${isOfficielTier ? "border-[#D4AF37]/40 shadow-lg" : ""}`}>
      <div className={`relative ${photoHeight} w-full overflow-hidden bg-slate-100`}>
        <img
          src={v.photoPrincipale || PLACEHOLDER}
          alt={v.titre}
          className="h-full w-full object-cover transition group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges — coin supérieur gauche, max 3 */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {badges.map((b) => (
            <BadgeChip key={b.code} badge={b} />
          ))}
          {v.segmentLocation === "vtc_taxi" && (
            <span className="inline-flex items-center rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-bold text-[#D4AF37] border border-[#D4AF37]">VTC / TAXI</span>
          )}
        </div>
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
