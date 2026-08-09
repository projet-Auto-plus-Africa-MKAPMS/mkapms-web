/**
 * MKA.P-MS — « Près de moi » (point 35).
 *
 * Un seul écran pour tous les services locaux : garage, comptable, pièces,
 * contrôle technique, dépannage… Le service choisi arrive dans l'URL
 * (`/pres-de-moi?service=garage`) pour que « contrôle technique près de moi »
 * soit un lien partageable et indexable.
 *
 * Règle affichée telle quelle au visiteur : la distance n'apparaît que si les
 * prestataires portent réellement des coordonnées, et un service sans annuaire
 * dit « non configuré » au lieu de laisser croire que la zone est vide.
 */
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MapPin, Navigation, Star, Phone, Loader2, Info, AlertTriangle } from "lucide-react";
import { trpc } from "../lib/trpc";

const PAYS = ["FR", "BE", "ES", "MA", "TN", "SN", "CI", "ML", "GN"];

export default function PresDeMoi() {
  const [params, setParams] = useSearchParams();
  const service = params.get("service") ?? "garage";
  const [countryCode, setCountryCode] = useState("FR");
  const [city, setCity] = useState("");
  const [radiusKm, setRadiusKm] = useState(50);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const services = trpc.proximity.services.useQuery();
  const results = trpc.proximity.nearby.useQuery({
    service,
    countryCode,
    city: city.trim() || undefined,
    latitude: position?.latitude,
    longitude: position?.longitude,
    radiusKm,
  });

  const current = services.data?.find((s) => s.code === service);

  function locate() {
    if (!navigator.geolocation) {
      setGeoError("Votre navigateur ne partage pas la position : utilisez la recherche par ville.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError("Position refusée ou indisponible : recherche par ville ou par pays.");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Navigation className="w-7 h-7 text-[#D4AF37]" />
        <h1 className="text-2xl font-bold">{current ? `${current.label} près de moi` : "Près de moi"}</h1>
      </div>
      <p className="text-gray-600 mb-6">
        Les professionnels autour de vous, service par service, avec la distance réelle lorsqu'elle est connue.
      </p>

      {/* Choix du service */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(services.data ?? []).map((s) => (
          <button
            key={s.code}
            type="button"
            onClick={() => setParams({ service: s.code })}
            className={`px-3 py-2 rounded-lg border text-sm transition ${
              s.code === service
                ? "bg-[#0B1B33] text-white border-[#0B1B33]"
                : "bg-white text-gray-700 border-gray-300 hover:border-[#D4AF37]"
            }`}
          >
            {s.label}
            {!s.localisable && <span className="ml-1 text-xs opacity-70">(non configuré)</span>}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 grid gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#D4AF37] text-[#0B1B33] font-semibold disabled:opacity-60"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {position ? "Position prise en compte" : "Utiliser ma position"}
        </button>
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300"
          aria-label="Pays"
        >
          {PAYS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville"
          className="px-3 py-2 rounded-lg border border-gray-300"
        />
        <select
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-gray-300"
          aria-label="Rayon de recherche"
        >
          {[10, 25, 50, 100, 200].map((r) => (
            <option key={r} value={r}>
              {r} km
            </option>
          ))}
        </select>
      </div>

      {geoError && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 mb-4 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {results.isLoading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" /> Recherche en cours…
        </div>
      )}

      {results.data && (
        <>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-3 mb-4 text-sm">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{results.data.explication}</span>
          </div>

          {results.data.mode === "non_configure" ? (
            <div className="text-center py-10 text-gray-600">
              <p className="font-semibold mb-1">Service pas encore localisable</p>
              <p className="text-sm">
                Vous pouvez tout de même accéder au service :{" "}
                <Link to={results.data.path} className="text-[#0B1B33] underline">
                  {results.data.label}
                </Link>
                .
              </p>
            </div>
          ) : results.data.results.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              Aucun professionnel référencé pour cette recherche.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {results.data.results.map((r) => (
                <li key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">{r.name}</span>
                    {r.distanceKm !== null && (
                      <span className="text-sm font-semibold text-[#0B1B33] whitespace-nowrap">
                        {r.distanceKm} km
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {[r.address, r.city, r.country].filter(Boolean).join(" · ") || "Adresse non renseignée"}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {r.rating !== null ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="w-4 h-4 fill-current" />
                        {r.rating} <span className="text-gray-500">({r.reviewCount} avis)</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">Pas encore d'avis</span>
                    )}
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="flex items-center gap-1 text-[#0B1B33]">
                        <Phone className="w-4 h-4" /> {r.phone}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
