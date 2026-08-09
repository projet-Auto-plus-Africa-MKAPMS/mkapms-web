import { useState } from "react";
import { Link } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import { ChevronLeft, Tag, Heart, Clock } from "lucide-react";
import SearchLine from "../components/SearchLine";
import { useVehicleSearch } from "../lib/vehicleSearch";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE PROMOTIONS — Offres limitées, fins de série, déstockage
   ══════════════════════════════════════════════════════════════════════════ */

const MARQUES_PROMO = [
  "Audi", "BMW", "Citroën", "Dacia", "Ford", "Hyundai",
  "Kia", "Mercedes-Benz", "Opel", "Peugeot", "Renault",
  "Seat", "Skoda", "Toyota", "Volkswagen",
];

const CATEGORIES_PROMO = [
  "Citadines", "Berlines", "SUV & 4x4", "Monospaces", "Breaks",
  "Utilitaires", "Camions", "Motos", "Électriques", "Hybrides",
];

const ANNONCES = [
  { id: 1, nom: "Peugeot 308 GT Line", annee: 2023, km: 18000, prixAvant: 28000, prixApres: 23500, remise: "-16%", fin: "3 jours", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop" },
  { id: 2, nom: "Renault Mégane E-Tech", annee: 2024, km: 5000, prixAvant: 35000, prixApres: 29900, remise: "-15%", fin: "5 jours", photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop" },
  { id: 3, nom: "Dacia Duster Prestige", annee: 2023, km: 22000, prixAvant: 20500, prixApres: 17200, remise: "-16%", fin: "7 jours", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop" },
  { id: 4, nom: "Citroën C5 Aircross", annee: 2022, km: 42000, prixAvant: 25000, prixApres: 20500, remise: "-18%", fin: "2 jours", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop" },
];

const ANNEES = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

export default function VentePromotions() {
  const [showFilters, setShowFilters] = useState(false);
  const search = useVehicleSearch({ remisePct: "" });
  // Le prix qui compte pour l'acheteur est le prix remisé ; la remise est
  // comparée en pourcentage (« 10% et plus »).
  const filtered = search
    .filter(ANNONCES.map((a) => ({ ...a, prix: a.prixApres })))
    .filter((a) => {
      const min = search.applied.extra.remisePct;
      return min ? (Math.abs(parseInt(a.remise, 10)) || 0) >= Number(min) : true;
    });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* EN-TÊTE */}
      <div className="bg-green-600 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Retour Vente
        </Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">
          PROMOTIONS
        </span>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Tag size={20} /> Promotions & Déstockage
        </h1>
        <p className="mt-1 text-sm text-white/80">Offres limitées, fins de série, prix réduits</p>
      </div>

      {/* BARRE DE RECHERCHE DÉPLIANTE */}
      <div className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        {/* Ligne principale */}
        <SearchLine
          value={search.draft.q}
          onChange={(v) => search.set("q", v)}
          onSearch={search.apply}
          placeholder="Marque, modèle, catégorie…"
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          activeCount={search.activeCount}
          accent="bg-green-600"
        />

        {/* Filtres dépliants */}
        {showFilters && (
          <div className="mt-3 space-y-3">
            {/* Marque */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Marque</label>
              <select value={search.draft.marque} onChange={(e) => search.set("marque", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les marques</option>
                {MARQUES_PROMO.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Catégorie</label>
              <select value={search.draft.categorie} onChange={(e) => search.set("categorie", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les catégories</option>
                {CATEGORIES_PROMO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Remise minimum */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Remise minimum</label>
              <select value={search.draft.extra.remisePct ?? ""} onChange={(e) => search.setExtra("remisePct", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les remises</option>
                <option value="5">5% et plus</option>
                <option value="10">10% et plus</option>
                <option value="15">15% et plus</option>
                <option value="20">20% et plus</option>
                <option value="30">30% et plus</option>
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
                <option value="20000">20 000 km</option>
                <option value="50000">50 000 km</option>
                <option value="100000">100 000 km</option>
                <option value="150000">150 000 km</option>
              </select>
            </div>

            {/* Prix max après remise */}
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
                  placeholder="100 000 €"
                  className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>

            {/* Bouton Rechercher */}
            <div className="flex gap-2">
              <button type="button" onClick={search.reset} className="rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-xs font-bold text-[#6B7280]">Effacer</button>
              <button type="button" onClick={() => { search.apply(); setShowFilters(false); }} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition">
                Rechercher
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ANNONCES */}
      <div className="px-4 mt-4 space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
            Aucune promotion ne correspond à ces critères. Modifiez ou effacez les filtres.
          </p>
        )}
        {filtered.map((a) => (
          <Link
            key={a.id}
            to={getAnnonceUrl(9110 + a.id, null, null)}
            className="block rounded-xl bg-white border border-green-200 overflow-hidden hover:shadow-lg transition"
          >
            <div className="relative h-[130px]">
              <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                <Heart size={14} className="text-red-500" />
              </span>
              <span className="absolute top-2 left-2 rounded-full bg-green-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                {a.remise}
              </span>
              <span className="absolute bottom-2 left-2 rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-1">
                <Clock size={10} /> {a.fin}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
              <p className="text-[10px] text-[#6B7280] mt-0.5">
                {a.annee} · {a.km.toLocaleString("fr-FR")} km
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-[#6B7280] line-through">
                  {a.prixAvant.toLocaleString("fr-FR")} €
                </span>
                <span className="text-lg font-black text-green-600">
                  {a.prixApres.toLocaleString("fr-FR")} €
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
