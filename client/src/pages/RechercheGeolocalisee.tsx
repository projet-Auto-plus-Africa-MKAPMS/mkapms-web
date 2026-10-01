import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bike, Building2, Car, ChevronDown, Loader2, MapPin, Navigation, Search, ShieldCheck, Truck, Wrench } from "lucide-react";
import MetaSEO from "../components/MetaSEO";
import VehicleCard, { type VehicleCardData } from "../components/VehicleCard";
import { trpc } from "../lib/trpc";

const RAYONS = [5, 10, 25, 50, 100, 250];
const TYPES_RECHERCHE = [
  { label: "Véhicules", icon: Car },
  { label: "Motos", icon: Bike },
  { label: "Utilitaires", icon: Truck },
  { label: "Location", icon: Building2 },
  { label: "Garages", icon: Wrench },
] as const;

function distanceKm(a: { latitude: number; longitude: number }, latitude: unknown, longitude: unknown): number | null {
  if (latitude == null || longitude == null || latitude === "" || longitude === "") return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(lat - a.latitude);
  const dLng = radians(lng - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}

export default function RechercheGeolocalisee() {
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [rayon, setRayon] = useState(50);
  const [showRayons, setShowRayons] = useState(false);
  const [typeActif, setTypeActif] = useState<(typeof TYPES_RECHERCHE)[number]["label"]>("Véhicules");
  const [query, setQuery] = useState("");
  const [ville, setVille] = useState("");
  const [applied, setApplied] = useState({ query: "", ville: "" });

  const annonces = trpc.annonces.list.useQuery({
    type: typeActif === "Location" ? "location" : "vente",
    q: applied.query.trim() || undefined,
    ville: applied.ville.trim() || undefined,
    famille: typeActif === "Motos" ? "moto" : undefined,
    categorie: typeActif === "Utilitaires" ? "utilitaire" : undefined,
    limit: 100,
  }, { enabled: typeActif !== "Garages" });

  const resultats = useMemo(() => {
    return (annonces.data?.items ?? [])
      .map((annonce) => ({ annonce, distance: position ? distanceKm(position, annonce.latitude, annonce.longitude) : null }))
      .filter(({ distance }) => distance === null || distance <= rayon)
      .sort((a, b) => a.distance === null ? 1 : b.distance === null ? -1 : a.distance - b.distance);
  }, [annonces.data?.items, position, rayon]);

  function localiser() {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n’est pas disponible sur cet appareil. Recherchez par ville.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError("Position refusée ou indisponible. Vous pouvez toujours rechercher par ville.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  function rechercher() {
    setApplied({ query: query.trim(), ville: ville.trim() });
  }

  return (
    <div className="min-h-screen bg-[#F6F4EF] pb-24 text-[#0A1630]">
      <MetaSEO title="Véhicules autour de moi" description="Trouvez les véhicules, motos, utilitaires, locations et professionnels réellement publiés près de vous sur MKA.P-MS." url="https://mkapms.com/recherche" />

      <section className="relative isolate overflow-hidden bg-[#07111F] px-4 pb-20 pt-10 text-white sm:px-8 lg:pb-28 lg:pt-16">
        <img src="/hero/car_hero_2.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#050B14] via-[#07111F]/90 to-[#07111F]/45" />
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur"><Navigation className="h-4 w-4 text-[#E2B82D]" /> Recherche locale mondiale</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight sm:text-6xl">Le bon véhicule, au bon endroit.</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">Explorez les annonces réellement publiées, puis activez votre position pour les classer par proximité.</p>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-12 max-w-6xl px-4 sm:px-6">
        <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,.14)] sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr_auto]">
            <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-[#F3F4F6] px-4 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-[#D4AF37]"><Search className="h-5 w-5 text-black/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rechercher()} className="w-full bg-transparent text-sm font-semibold outline-none" placeholder="Marque, modèle ou mot-clé" /></label>
            <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-[#F3F4F6] px-4 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-[#D4AF37]"><MapPin className="h-5 w-5 text-black/40" /><input value={ville} onChange={(e) => setVille(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rechercher()} className="w-full bg-transparent text-sm font-semibold outline-none" placeholder="Ville" /></label>
            <button type="button" onClick={rechercher} className="min-h-14 rounded-2xl bg-[#D9B323] px-7 text-sm font-black text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:-translate-y-0.5 hover:brightness-105">Rechercher</button>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={localiser} disabled={locating} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 text-sm font-black text-emerald-700 ring-1 ring-emerald-200 disabled:opacity-60">{locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}{position ? "Position détectée" : "Utiliser ma position"}</button>
            <div className="relative">
              <button type="button" onClick={() => setShowRayons((open) => !open)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 text-sm font-bold sm:w-auto">Rayon : {rayon} km <ChevronDown className="h-4 w-4" /></button>
              {showRayons && <div className="absolute right-0 top-full z-30 mt-2 grid w-full grid-cols-3 gap-1 rounded-2xl border border-black/10 bg-white p-2 shadow-xl sm:w-64">{RAYONS.map((r) => <button type="button" key={r} onClick={() => { setRayon(r); setShowRayons(false); }} className={`rounded-xl px-2 py-2 text-xs font-bold ${rayon === r ? "bg-[#D4AF37] text-[#111]" : "hover:bg-black/5"}`}>{r} km</button>)}</div>}
            </div>
          </div>
          {geoError && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{geoError}</p>}
        </section>

        <nav className="mt-6 flex snap-x gap-2 overflow-x-auto pb-2" aria-label="Type de recherche">{TYPES_RECHERCHE.map(({ label, icon: Icon }) => <button type="button" key={label} onClick={() => setTypeActif(label)} className={`flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full px-5 text-sm font-bold transition ${typeActif === label ? "bg-[#0A1630] text-white shadow-lg" : "border border-black/10 bg-white text-black/60"}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>

        {typeActif === "Garages" ? (
          <section className="mt-6 overflow-hidden rounded-[28px] bg-[#0A1630] p-6 text-white sm:p-10"><Wrench className="h-9 w-9 text-[#D4AF37]" /><h2 className="mt-4 text-2xl font-black">Ateliers et professionnels près de vous</h2><p className="mt-2 max-w-2xl text-white/65">Accédez à l’annuaire local réel, avec distance lorsque le professionnel a renseigné ses coordonnées.</p><Link to="/pres-de-moi?service=garage" className="mt-6 inline-flex rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-[#111]">Rechercher un garage</Link></section>
        ) : (
          <section className="mt-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#B18B08]">Stock publié</p><h2 className="mt-1 text-2xl font-black">{annonces.isLoading ? "Recherche en cours…" : `${resultats.length} annonce${resultats.length === 1 ? "" : "s"} disponible${resultats.length === 1 ? "" : "s"}`}</h2></div><p className="text-xs text-black/45">Distance réelle uniquement quand l’annonce possède des coordonnées.</p></div>
            {annonces.isLoading ? <div className="mt-6 flex min-h-48 items-center justify-center rounded-3xl bg-white"><Loader2 className="h-7 w-7 animate-spin text-[#D4AF37]" /></div> : resultats.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{resultats.map(({ annonce, distance }) => {
              const vehicle: VehicleCardData = { ...annonce, createdAt: annonce.createdAt ? new Date(annonce.createdAt).toISOString() : null };
              return <div key={annonce.id} className="relative min-w-0"><VehicleCard v={vehicle} compact />{distance !== null && <span className="absolute right-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-[#0A1630] shadow"><MapPin className="mr-1 inline h-3 w-3 text-[#D4AF37]" />{distance} km</span>}</div>;
            })}</div> : <div className="mt-6 rounded-[28px] border border-black/5 bg-white p-8 text-center shadow-sm"><Car className="mx-auto h-10 w-10 text-[#D4AF37]" /><h3 className="mt-4 text-lg font-black">Aucune annonce pour ces critères</h3><p className="mt-2 text-sm text-black/50">Élargissez le rayon ou consultez tout le catalogue de la plateforme.</p><Link to="/acheter" className="mt-5 inline-flex rounded-xl bg-[#0A1630] px-5 py-3 text-sm font-black text-white">Voir tous les véhicules</Link></div>}
          </section>
        )}

        <section className="mt-10 grid gap-4 rounded-[28px] border border-black/5 bg-white p-6 sm:grid-cols-3 sm:p-8"><div><ShieldCheck className="h-6 w-6 text-emerald-600" /><h3 className="mt-3 font-black">Annonces réelles</h3><p className="mt-1 text-sm text-black/50">Aucun véhicule fictif n’est ajouté aux résultats.</p></div><div><Navigation className="h-6 w-6 text-[#D4AF37]" /><h3 className="mt-3 font-black">Proximité transparente</h3><p className="mt-1 text-sm text-black/50">Une distance n’est affichée que lorsqu’elle peut être calculée.</p></div><div><Car className="h-6 w-6 text-blue-600" /><h3 className="mt-3 font-black">Tout l’écosystème</h3><p className="mt-1 text-sm text-black/50">Vente, location, motos, utilitaires et garages au même endroit.</p></div></section>
      </main>
    </div>
  );
}
