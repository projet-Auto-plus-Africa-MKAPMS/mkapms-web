import { useState } from "react";
import { Link } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import { ChevronLeft, Search, Car, Heart, Star, Calculator, ChevronDown } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE VTC & TAXI — Véhicules adaptés avec rentabilité estimée
   ══════════════════════════════════════════════════════════════════════════ */

const MARQUES_VTC = [
  "BMW", "Mercedes-Benz", "Peugeot", "Renault", "Tesla",
  "Toyota", "Volkswagen", "Volvo", "Audi", "Hyundai",
];

const CATEGORIES_VTC = [
  { label: "Berlines Premium", desc: "Classe E, Série 5, A6", photo: "/categories/vtc_berline_premium.jpg" },
  { label: "Électriques", desc: "Tesla, EQS, e-tron", photo: "/categories/vtc_electrique.jpg" },
  { label: "Hybrides", desc: "Camry, 530e, E 300e", photo: "/categories/vtc_hybride.jpg" },
  { label: "Minivans", desc: "Classe V, Multivan, Staria", photo: "/categories/vtc_minivan.jpg" },
  { label: "SUV Premium", desc: "GLC, X3, Q5", photo: "/categories/vtc_suv_premium.jpg" },
  { label: "Taxi classique", desc: "Prius, Camry, 508", photo: "/categories/vtc_taxi_classique.jpg" },
  { label: "Taxi électrique", desc: "Model 3, ZOE, Ioniq 6", photo: "/categories/vtc_taxi_electrique.jpg" },
  { label: "Berline affaires", desc: "Classe E, Série 5, A6", photo: "/categories/vtc_berline_affaires.jpg" },
];

const ANNONCES = [
  { id: 1, nom: "Mercedes Classe E 220d", annee: 2023, km: 45000, prix: 38000, revenuMois: 4500, conso: "5.2 L/100", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop" },
  { id: 2, nom: "BMW Série 5 530e", annee: 2023, km: 30000, prix: 48000, revenuMois: 5500, conso: "1.8 L/100", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop" },
  { id: 3, nom: "Tesla Model 3 LR", annee: 2024, km: 15000, prix: 38500, revenuMois: 5000, conso: "15 kWh/100", photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop" },
  { id: 4, nom: "Toyota Camry Hybride", annee: 2023, km: 35000, prix: 28000, revenuMois: 3800, conso: "4.5 L/100", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop" },
];

const ANNEES = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

export default function VenteVTC() {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* EN-TÊTE */}
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Retour Vente
        </Link>
        <span className="inline-block rounded-full bg-[#D4AF37] px-3 py-0.5 text-[10px] font-bold text-white mb-2">
          VTC & TAXI
        </span>
        <h1 className="text-xl font-black text-white">Achat VTC & Taxi</h1>
        <p className="mt-1 text-sm text-white/60">Véhicules adaptés avec revenus estimés et rentabilité</p>
      </div>

      {/* Bloc rentabilité */}
      <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#D4AF37]/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calculator size={14} className="text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-white">Rentabilité estimée</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <p className="text-[9px] text-white/50">Revenu / jour</p>
            <p className="text-sm font-black text-[#D4AF37]">150 €</p>
          </div>
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <p className="text-[9px] text-white/50">Revenu / mois</p>
            <p className="text-sm font-black text-[#D4AF37]">3 600 €</p>
          </div>
          <div className="rounded-lg bg-white/5 p-2 text-center">
            <p className="text-[9px] text-white/50">ROI estimé</p>
            <p className="text-sm font-black text-green-500">8-12 mois</p>
          </div>
        </div>
      </div>

      {/* BARRE DE RECHERCHE DÉPLIANTE */}
      <div className="mx-4 mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        {/* Ligne principale */}
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input
            type="text"
            placeholder="Marque, modèle, catégorie…"
            className="w-full bg-transparent text-sm outline-none"
          />
          <button onClick={() => setShowFilters(!showFilters)} aria-label="Afficher les filtres">
            <ChevronDown
              size={16}
              className={`text-[#6B7280] transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Filtres dépliants */}
        {showFilters && (
          <div className="mt-3 space-y-3">
            {/* Marque */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Marque</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les marques</option>
                {MARQUES_VTC.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Catégorie</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les catégories</option>
                {CATEGORIES_VTC.map((c) => <option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>

            {/* Énergie */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Énergie</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes</option>
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybride">Hybride</option>
                <option value="Électrique">Électrique</option>
              </select>
            </div>

            {/* Année */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Année (à partir de)</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les années</option>
                {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Kilométrage max */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Kilométrage max</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Sans limite</option>
                <option value="50000">50 000 km</option>
                <option value="100000">100 000 km</option>
                <option value="150000">150 000 km</option>
                <option value="200000">200 000 km</option>
              </select>
            </div>

            {/* Prix min / max */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Prix min</label>
                <input
                  type="number"
                  placeholder="0 €"
                  className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Prix max</label>
                <input
                  type="number"
                  placeholder="80 000 €"
                  className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>

            {/* Bouton Rechercher */}
            <button className="w-full py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition">
              Rechercher
            </button>
          </div>
        )}
      </div>

      {/* CATÉGORIES — scroll horizontal */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES_VTC.map((c) => (
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
      <div className="px-4 mt-4 space-y-3">
        {ANNONCES.map((a) => (
          <Link
            key={a.id}
            to={getAnnonceUrl(9300 + a.id, null, null)}
            className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition"
          >
            <div className="relative h-[130px]">
              <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                <Heart size={14} className="text-red-500" />
              </span>
              <span className="absolute top-2 left-2 rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">
                VTC & Taxi
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
              <p className="text-[10px] text-[#6B7280] mt-0.5">
                {a.annee} · {a.km.toLocaleString("fr-FR")} km · {a.conso}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#F5F3EF] p-2">
                  <p className="text-[9px] text-[#6B7280]">Prix achat</p>
                  <p className="text-sm font-black text-[#111]">{a.prix.toLocaleString("fr-FR")} €</p>
                </div>
                <div className="rounded-lg bg-green-50 p-2">
                  <p className="text-[9px] text-green-600">Revenu / mois</p>
                  <p className="text-sm font-black text-green-700">{a.revenuMois.toLocaleString("fr-FR")} €</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
