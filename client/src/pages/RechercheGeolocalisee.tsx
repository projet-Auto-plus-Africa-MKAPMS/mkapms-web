import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Navigation, Car, Bike, Truck, Home, Wrench, ChevronDown, Star, Shield, SlidersHorizontal } from "lucide-react";
import MetaSEO from "../components/MetaSEO";

/* ══════════════════════════════════════════════════════════════════════════
   RECHERCHE GÉOLOCALISÉE MONDIALE
   Détection position → Autour de moi → Distance → Carte → Filtre rayon
   ══════════════════════════════════════════════════════════════════════════ */

const RAYONS = ["5 km", "10 km", "25 km", "50 km", "100 km", "250 km", "Tout le pays"];

const TYPES_RECHERCHE = [
  { label: "Véhicules", icon: Car, color: "#D4AF37" },
  { label: "Motos", icon: Bike, color: "#EF4444" },
  { label: "Utilitaires", icon: Truck, color: "#F97316" },
  { label: "Location", icon: Home, color: "#3B82F6" },
  { label: "Garages", icon: Wrench, color: "#F59E0B" },
];

const RESULTATS_DEMO = [
  { id: 1, nom: "Peugeot 308 GT Line", prix: 18500, annee: 2022, km: 35000, ville: "Paris 15e", distance: 2, badge: "PRO", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=200&fit=crop" },
  { id: 2, nom: "Renault Clio V Intens", prix: 14900, annee: 2023, km: 18000, ville: "Boulogne-B.", distance: 5, badge: "VÉRIFIÉ", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=200&fit=crop" },
  { id: 3, nom: "BMW Série 3 320d", prix: 29500, annee: 2021, km: 52000, ville: "Saint-Denis", distance: 8, badge: "PREMIUM", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=200&fit=crop" },
  { id: 4, nom: "Toyota Yaris Hybrid", prix: 16800, annee: 2023, km: 12000, ville: "Versailles", distance: 15, badge: "PRO", photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=200&fit=crop" },
  { id: 5, nom: "Mercedes GLA 200", prix: 32000, annee: 2022, km: 28000, ville: "Créteil", distance: 12, badge: "ELITE", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=200&fit=crop" },
  { id: 6, nom: "Volkswagen Golf 8", prix: 22900, annee: 2022, km: 42000, ville: "Meaux", distance: 42, badge: "VÉRIFIÉ", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=200&fit=crop" },
];

const BADGE_COLORS: Record<string, string> = { PRO: "bg-blue-600", VÉRIFIÉ: "bg-green-600", PREMIUM: "bg-[#D4AF37]", ELITE: "bg-[#111]" };

export default function RechercheGeolocalisee() {
  const [located, setLocated] = useState(false);
  const [rayon, setRayon] = useState("50 km");
  const [showRayons, setShowRayons] = useState(false);
  const [typeActif, setTypeActif] = useState("Véhicules");
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <MetaSEO title="Recherche géolocalisée" description="Trouvez véhicules, motos, garages et locations autour de vous sur MKA.P-MS. Recherche mondiale géolocalisée." url="https://mkapms.com/recherche" />
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><MapPin size={20} className="text-[#D4AF37]" /> Autour de moi</h1>
        <p className="mt-1 text-xs text-white/50">Recherche géolocalisée mondiale · France · Afrique · Monde</p>
      </div>

      {/* Localisation */}
      {!located ? (
        <div className="mx-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm text-center">
          <Navigation size={28} className="text-[#D4AF37] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#111]">Activez la géolocalisation</p>
          <p className="text-[10px] text-[#6B7280] mt-1">Pour trouver les véhicules les plus proches de vous</p>
          <button onClick={() => setLocated(true)} className="mt-3 w-full py-2.5 bg-[#D4AF37] text-white rounded-xl text-xs font-bold">Autoriser ma position</button>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-[#E5E7EB]" /><span className="text-[9px] text-[#6B7280]">ou</span><div className="h-px flex-1 bg-[#E5E7EB]" />
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
            <Search size={14} className="text-[#6B7280]" />
            <input type="text" placeholder="Entrer une ville ou un pays…" className="w-full bg-transparent text-sm outline-none" onFocus={() => setLocated(true)} />
          </div>
        </div>
      ) : (
        <>
          {/* Position détectée */}
          <div className="mx-4 -mt-3 relative z-10 rounded-xl bg-green-50 border border-green-200 px-3 py-2 shadow-sm flex items-center gap-2">
            <MapPin size={14} className="text-green-500" />
            <p className="text-xs font-bold text-green-700 flex-1">Paris, France</p>
            <button onClick={() => setShowRayons(!showRayons)} className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded-full">
              {rayon} <ChevronDown size={10} />
            </button>
          </div>
          {showRayons && (
            <div className="mx-4 mt-1 flex flex-wrap gap-1.5">
              {RAYONS.map(r => (
                <button key={r} onClick={() => { setRayon(r); setShowRayons(false); }} className={`rounded-full px-3 py-1 text-[10px] font-bold border ${rayon === r ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>{r}</button>
              ))}
            </div>
          )}

          {/* Recherche */}
          <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
              <Search size={14} className="text-[#6B7280]" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Peugeot 206, BMW Série 3, Yamaha MT-07…" className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>

          {/* Types */}
          <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TYPES_RECHERCHE.map(t => { const Icon = t.icon; return (
              <button key={t.label} onClick={() => setTypeActif(t.label)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold border ${typeActif === t.label ? "text-white border-transparent" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`} style={typeActif === t.label ? { backgroundColor: t.color } : {}}>
                <Icon size={12} /> {t.label}
              </button>
            ); })}
          </div>

          {/* Carte placeholder */}
          <div className="mx-4 mt-3 rounded-xl bg-[#E5E7EB] border border-[#D4D4D4] h-[150px] flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 opacity-50" />
            <div className="relative text-center">
              <MapPin size={24} className="text-[#D4AF37] mx-auto mb-1" />
              <p className="text-xs font-bold text-[#111]">Carte interactive</p>
              <p className="text-[8px] text-[#6B7280]">Véhicules · Garages · Agences · Partenaires</p>
            </div>
            {/* Marqueurs simulés */}
            <div className="absolute top-4 left-8"><MapPin size={12} className="text-red-500" /></div>
            <div className="absolute top-12 right-12"><MapPin size={12} className="text-blue-500" /></div>
            <div className="absolute bottom-8 left-16"><MapPin size={12} className="text-green-500" /></div>
            <div className="absolute bottom-4 right-8"><MapPin size={12} className="text-[#D4AF37]" /></div>
          </div>

          {/* Résultats triés par distance */}
          <div className="px-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#111]">{RESULTATS_DEMO.length} résultats dans un rayon de {rayon}</h2>
            </div>
            <p className="text-[9px] text-[#6B7280] mb-3">Tri : Distance → Récent → Qualité → Vérifié → Premium</p>
            <div className="space-y-2">
              {RESULTATS_DEMO.map(r => (
                <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm">
                  <div className="flex">
                    <img src={r.photo} alt={r.nom} className="w-[120px] h-[90px] object-cover" loading="lazy" />
                    <div className="flex-1 p-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#111] leading-tight">{r.nom}</p>
                          <p className="text-[9px] text-[#6B7280]">{r.annee} · {r.km.toLocaleString("fr-FR")} km</p>
                        </div>
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full text-white ${BADGE_COLORS[r.badge] || "bg-gray-400"}`}>{r.badge}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <p className="text-sm font-black text-[#D4AF37]">{r.prix.toLocaleString("fr-FR")} €</p>
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600"><MapPin size={10} /> {r.distance} km — {r.ville}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
