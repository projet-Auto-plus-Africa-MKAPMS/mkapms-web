import { useState } from "react";
import { Link } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import { ChevronLeft, Truck, Heart } from "lucide-react";
import SearchLine from "../components/SearchLine";
import { useVehicleSearch } from "../lib/vehicleSearch";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE CAMIONS — Poids lourds, bennes, frigorifiques, porteurs, etc.
   ══════════════════════════════════════════════════════════════════════════ */

const MARQUES_CAMION = [
  "DAF", "Iveco", "MAN", "Mercedes-Benz", "Renault Trucks",
  "Scania", "Volvo", "Ford Trucks", "Isuzu", "Mitsubishi Fuso",
];

const CATEGORIES = [
  { label: "Porte-voitures", desc: "Transport auto", photo: "/categories/camion_porte_voitures.jpg" },
  { label: "Bennes", desc: "BTP, déchets", photo: "/categories/camion_benne.jpg" },
  { label: "Frigorifiques", desc: "Transport frais", photo: "/categories/camion_frigo.jpg" },
  { label: "Poids lourds", desc: "19t+ porteurs", photo: "/categories/camion_poids_lourd.jpg" },
  { label: "Plateaux", desc: "Matériel & engins", photo: "/categories/camion_plateau.jpg" },
  { label: "Fourgons", desc: "7.5t → 12t", photo: "/categories/camion_fourgon.jpg" },
  { label: "Électriques", desc: "Camions zéro émission", photo: "/categories/camion_electrique.jpg" },
  { label: "Ampliroll / Polybenne", desc: "Bennes amovibles", photo: "/categories/camion_ampliroll.jpg" },
  { label: "Grue auxiliaire", desc: "Chargement intégré", photo: "/categories/camion_grue_auxiliaire.jpg" },
  { label: "Benne TP", desc: "Travaux publics", photo: "/categories/camion_benne_tp.jpg" },
  { label: "Bâchés", desc: "Transport couvert", photo: "/categories/camion_bache.jpg" },
  { label: "Semi-remorques", desc: "Tracteurs routiers", photo: "/categories/camion_semiremorque.jpg" },
  { label: "Citernes", desc: "Liquides & carburants", photo: "/categories/camion_citerne.jpg" },
  { label: "Malaxeurs / Bétonnières", desc: "Béton & matériaux", photo: "/categories/camion_malaxeur.jpg" },
  { label: "Porteurs", desc: "Porteurs 12t → 26t", photo: "/categories/camion_poids_lourd.jpg" },
  { label: "Tracteurs routiers", desc: "Cabines, attelages", photo: "/categories/camion_semiremorque.jpg" },
  { label: "Remorques", desc: "Plateau, frigo, benne", photo: "/categories/camion_plateau.jpg" },
  { label: "Camions-bras", desc: "Grue intégrée, HIAB", photo: "/categories/camion_grue_auxiliaire.jpg" },
  { label: "Camions-pompes", desc: "Pompes à béton", photo: "/categories/camion_malaxeur.jpg" },
  { label: "Camions-grues", desc: "Grue montée sur porteur", photo: "/categories/camion_grue_auxiliaire.jpg" },
  { label: "Camions-hydrocureurs", desc: "Curage, assainissement", photo: "/categories/camion_citerne.jpg" },
  { label: "Camions-nacelles", desc: "Travaux en hauteur", photo: "/categories/camion_ampliroll.jpg" },
  { label: "Camions-forestiers", desc: "Grumiers, porteurs bois", photo: "/categories/camion_poids_lourd.jpg" },
  { label: "Camions-poubelles", desc: "Bennes à ordures", photo: "/categories/camion_benne.jpg" },
  { label: "Camions-citernes alim.", desc: "Alimentaire, laitiers", photo: "/categories/camion_citerne.jpg" },
  { label: "Camions-malaxeurs", desc: "Toupies béton", photo: "/categories/camion_malaxeur.jpg" },
  { label: "Camions-surbaissés", desc: "Transport exceptionnel", photo: "/categories/camion_plateau.jpg" },
  { label: "Camions-frigorifiques", desc: "Multi-température", photo: "/categories/camion_frigo.jpg" },
  { label: "Camions-plateau dép.", desc: "Dépannage & remorquage", photo: "/categories/camion_plateau.jpg" },
  { label: "Camions-VL", desc: "Véhicules légers < 3.5t", photo: "/categories/camion_fourgon.jpg" },
  { label: "Hybrides", desc: "Hybrides & gaz (CNG/LNG)", photo: "/categories/camion_electrique.jpg" },
  { label: "Hydrogène", desc: "Camions à hydrogène", photo: "/categories/camion_electrique.jpg" },
];

const ANNONCES = [
  { id: 1, nom: "Iveco Daily Benne 35C14", annee: 2022, km: 55000, prix: 28500, ptac: "3.5 t", photo: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&h=260&fit=crop" },
  { id: 2, nom: "MAN TGL 12.250 Frigo", annee: 2021, km: 120000, prix: 42000, ptac: "12 t", photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop" },
  { id: 3, nom: "Renault Trucks D 7.5t Plateau", annee: 2023, km: 38000, prix: 45000, ptac: "7.5 t", photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop" },
];

const ANNEES = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

export default function VenteCamions() {
  const [showFilters, setShowFilters] = useState(false);
  const search = useVehicleSearch({ ptac: "" });
  const filtered = search.filter(ANNONCES);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* EN-TÊTE */}
      <div className="bg-gray-700 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Retour Vente
        </Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">
          CAMIONS
        </span>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Truck size={20} /> Achat Camions
        </h1>
        <p className="mt-1 text-sm text-white/80">Porte-voitures, bennes, frigorifiques, poids lourds</p>
      </div>

      {/* BARRE DE RECHERCHE DÉPLIANTE */}
      <div className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        {/* Ligne principale */}
        <SearchLine
          value={search.draft.q}
          onChange={(v) => search.set("q", v)}
          onSearch={search.apply}
          placeholder="Marque, modèle, PTAC…"
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          activeCount={search.activeCount}
          accent="bg-gray-700"
        />

        {/* Filtres dépliants */}
        {showFilters && (
          <div className="mt-3 space-y-3">
            {/* Marque */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Marque</label>
              <select value={search.draft.marque} onChange={(e) => search.set("marque", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les marques</option>
                {MARQUES_CAMION.map((m) => <option key={m} value={m}>{m}</option>)}
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

            {/* PTAC */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">PTAC</label>
              <select value={search.draft.extra.ptac ?? ""} onChange={(e) => search.setExtra("ptac", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Tous</option>
                <option value="3.5">Jusqu'à 3.5 t</option>
                <option value="7.5">Jusqu'à 7.5 t</option>
                <option value="12">Jusqu'à 12 t</option>
                <option value="19">Jusqu'à 19 t</option>
                <option value="26">Jusqu'à 26 t</option>
                <option value="40">40 t et plus</option>
              </select>
            </div>

            {/* Énergie */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Énergie</label>
              <select value={search.draft.energie} onChange={(e) => search.set("energie", e.target.value)} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes</option>
                <option value="Diesel">Diesel</option>
                <option value="Électrique">Électrique</option>
                <option value="CNG">CNG (Gaz naturel)</option>
                <option value="LNG">LNG</option>
                <option value="Hydrogène">Hydrogène</option>
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
                <option value="500000">500 000 km</option>
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
                  placeholder="200 000 €"
                  className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>

            {/* Bouton Rechercher */}
            <div className="flex gap-2">
              <button type="button" onClick={search.reset} className="rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-xs font-bold text-[#6B7280]">Effacer</button>
              <button type="button" onClick={() => { search.apply(); setShowFilters(false); }} className="flex-1 py-2.5 bg-gray-700 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition">
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
        <h2 className="text-base font-bold text-[#111]">Annonces camions ({filtered.length})</h2>
        {filtered.length === 0 && (
          <p className="mt-3 rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
            Aucun camion ne correspond à ces critères. Modifiez ou effacez les filtres.
          </p>
        )}
        <div className="mt-3 space-y-3">
          {filtered.map((a) => (
            <Link
              key={a.id}
              to={getAnnonceUrl(9090 + a.id, null, null)}
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
                  {a.annee} · {a.km.toLocaleString("fr-FR")} km · PTAC {a.ptac}
                </p>
                <p className="mt-2 text-lg font-black text-gray-700">{a.prix.toLocaleString("fr-FR")} €</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
