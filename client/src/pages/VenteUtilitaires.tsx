import { useState } from "react";
import { Link } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import { ChevronLeft, Truck, Heart } from "lucide-react";
import SearchLine from "../components/SearchLine";
import { useVehicleSearch } from "../lib/vehicleSearch";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE UTILITAIRES — Kangoo, Berlingo, Trafic, Master, Boxer, etc.
   ══════════════════════════════════════════════════════════════════════════ */

const MARQUES_UTIL = [
  "Citroën", "Fiat", "Ford", "Iveco", "Mercedes-Benz",
  "Opel", "Peugeot", "Renault", "Toyota", "Volkswagen",
];

const CATEGORIES = [
  { label: "Kangoo / Berlingo", desc: "Petits fourgons", photo: "/categories/util_petit_fourgon.jpg" },
  { label: "Trafic / Vivaro", desc: "Fourgons moyens", photo: "/categories/util_fourgon_moyen.jpg" },
  { label: "Master / Boxer", desc: "Grands fourgons", photo: "/categories/util_grand_fourgon.jpg" },
  { label: "Plateau", desc: "Transport matériel", photo: "/categories/util_plateau.jpg" },
  { label: "Benne / Coffre", desc: "Stockage", photo: "/categories/util_benne.jpg" },
  { label: "Pick-up / 4x4", desc: "Hilux, Ranger, L200", photo: "/categories/util_pickup.jpg" },
  { label: "Électriques", desc: "Kangoo E-Tech, Berlingo Électrique", photo: "/categories/util_electrique.jpg" },
  { label: "Bâchés", desc: "Transport matériel couvert", photo: "/categories/util_bache.jpg" },
  { label: "Avec hayon", desc: "Chargement facilité", photo: "/categories/util_hayon.jpg" },
  { label: "Isothermes", desc: "Transport alimentaire", photo: "/categories/util_isotherme.jpg" },
];

const ANNONCES = [
  { id: 1, nom: "Renault Kangoo Van", annee: 2023, km: 35000, prix: 14500, volume: "3.3 m³", charge: "650 kg", photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop" },
  { id: 2, nom: "Citroën Berlingo Van M", annee: 2022, km: 48000, prix: 13200, volume: "3.8 m³", charge: "750 kg", photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop" },
  { id: 3, nom: "Renault Master L2H2", annee: 2021, km: 82000, prix: 18500, volume: "10.8 m³", charge: "1 400 kg", photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop" },
  { id: 4, nom: "Ford Transit Custom L2", annee: 2023, km: 28000, prix: 24900, volume: "6.8 m³", charge: "1 100 kg", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop" },
];

const ANNEES = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

export default function VenteUtilitaires() {
  const [showFilters, setShowFilters] = useState(false);
  const search = useVehicleSearch({ volume: "" });
  const filtered = search.filter(ANNONCES);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* EN-TÊTE */}
      <div className="bg-orange-600 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Retour Vente
        </Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">
          UTILITAIRES
        </span>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Truck size={20} /> Achat Utilitaires
        </h1>
        <p className="mt-1 text-sm text-white/80">Kangoo, Berlingo, Partner, Trafic, Master, Boxer</p>
      </div>

      {/* BARRE DE RECHERCHE DÉPLIANTE */}
      <div className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        {/* Ligne principale */}
        <SearchLine
          value={search.draft.q}
          onChange={(v) => search.set("q", v)}
          onSearch={search.apply}
          placeholder="Marque, modèle, volume…"
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          activeCount={search.activeCount}
          accent="bg-orange-600"
        />

        {/* Filtres dépliants */}
        {showFilters && (
          <div className="mt-3 space-y-3">
            {/* Marque */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Marque</label>
              <select value={search.draft.marque} onChange={(e) => search.set("marque", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les marques</option>
                {MARQUES_UTIL.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Catégorie</label>
              <select value={search.draft.categorie} onChange={(e) => search.set("categorie", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les catégories</option>
                {CATEGORIES.map((c) => <option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>

            {/* Volume de chargement */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Volume de chargement</label>
              <select value={search.draft.extra.volume ?? ""} onChange={(e) => search.setExtra("volume", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Tous</option>
                <option value="3">Jusqu'à 3 m³</option>
                <option value="5">Jusqu'à 5 m³</option>
                <option value="8">Jusqu'à 8 m³</option>
                <option value="12">Jusqu'à 12 m³</option>
                <option value="20">20 m³ et plus</option>
              </select>
            </div>

            {/* Énergie */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Énergie</label>
              <select value={search.draft.energie} onChange={(e) => search.set("energie", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes</option>
                <option value="Diesel">Diesel</option>
                <option value="Électrique">Électrique</option>
                <option value="Essence">Essence</option>
                <option value="Hybride">Hybride</option>
              </select>
            </div>

            {/* Année */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Année (à partir de)</label>
              <select value={search.draft.annee} onChange={(e) => search.set("annee", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les années</option>
                {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Kilométrage max */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Kilométrage max</label>
              <select value={search.draft.kmMax} onChange={(e) => search.set("kmMax", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Sans limite</option>
                <option value="50000">50 000 km</option>
                <option value="100000">100 000 km</option>
                <option value="200000">200 000 km</option>
                <option value="300000">300 000 km</option>
              </select>
            </div>

            {/* Prix min / max */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Prix min</label>
                <input
                  type="number"
                  value={search.draft.prixMin}
                  onChange={(e) => search.set("prixMin", e.target.value)}
                  placeholder="0 €"
                  className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Prix max</label>
                <input
                  type="number"
                  value={search.draft.prixMax}
                  onChange={(e) => search.set("prixMax", e.target.value)}
                  placeholder="80 000 €"
                  className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>

            {/* Bouton Rechercher */}
            <div className="flex gap-2">
              <button type="button" onClick={search.reset} className="rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-xs font-bold text-[#6B7280]">Effacer</button>
              <button type="button" onClick={() => { search.apply(); setShowFilters(false); }} className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition">
                Rechercher
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CATÉGORIES — scroll horizontal */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              className="shrink-0 w-[120px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden text-left active:scale-[0.98] transition"
            >
              <img src={c.photo} alt={c.label} className="w-full h-[60px] object-cover" loading="lazy" />
              <div className="p-2">
                <h3 className="text-[11px] font-bold text-[#111]">{c.label}</h3>
                <p className="text-[8px] text-[#6B7280]">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ANNONCES */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Annonces utilitaires ({filtered.length})</h2>
        {filtered.length === 0 && (
          <p className="mt-3 rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
            Aucun utilitaire ne correspond à ces critères. Modifiez ou effacez les filtres.
          </p>
        )}
        <div className="mt-3 space-y-3">
          {filtered.map((a) => (
            <Link
              key={a.id}
              to={getAnnonceUrl(9080 + a.id, null, null)}
              className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-[130px]">
                <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                  <Heart size={14} className="text-red-500" />
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  {a.annee} · {a.km.toLocaleString("fr-FR")} km
                </p>
                <div className="mt-1 flex gap-2 text-[10px]">
                  <span className="rounded bg-orange-50 px-1.5 py-0.5 font-semibold text-orange-700">{a.volume}</span>
                  <span className="rounded bg-orange-50 px-1.5 py-0.5 font-semibold text-orange-700">{a.charge}</span>
                </div>
                <p className="mt-2 text-lg font-black text-orange-600">{a.prix.toLocaleString("fr-FR")} €</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
