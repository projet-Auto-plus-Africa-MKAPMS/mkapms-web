import { useState } from "react";
import { Link } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import {
  ChevronLeft, Search, Car, Star, MapPin, ChevronDown, Heart, Shield
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useCurrency } from "../lib/currency";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE PARTICULIER
   Univers réservé : Particuliers ↔ Particuliers / Particuliers ↔ Pros
   Citadines, Berlines, SUV, Monospaces, Breaks, Cabriolets
   ══════════════════════════════════════════════════════════════════════════ */

const MARQUES_PART = [
  "Audi", "BMW", "Citroën", "Dacia", "DS", "Ford", "Honda", "Hyundai",
  "Kia", "Mercedes-Benz", "Nissan", "Opel", "Peugeot", "Renault",
  "Seat", "Skoda", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

const CATEGORIES = [
  { label: "Citadines", modeles: "Clio, 208, Corsa, Yaris", photo: "/categories/citadine.jpg" },
  { label: "Berlines", modeles: "Série 3, Classe C, A4", photo: "/categories/berline.jpg" },
  { label: "SUV & 4x4", modeles: "3008, Tiguan, X3, GLC", photo: "/categories/suv.jpg" },
  { label: "Monospaces", modeles: "Scenic, Touran, Espace", photo: "/categories/monospace.jpg" },
  { label: "Breaks", modeles: "508 SW, Passat SW, Série 3 Touring", photo: "/categories/break.jpg" },
  { label: "Cabriolets", modeles: "SLK, Z4, Boxster", photo: "/categories/cabriolet.jpg" },
  { label: "Hybrides", modeles: "Prius, Clio E-Tech, 308 PHEV", photo: "/categories/hybride.jpg" },
  { label: "Électriques", modeles: "ZOE, e-208, Spring, Leaf", photo: "/categories/electrique.jpg" },
  { label: "Familiales", modeles: "3008, RAV4, Tiguan, C5 X", photo: "/categories/familiale.jpg" },
  { label: "Premium", modeles: "Classe C, Série 3, A4, XC40", photo: "/categories/premium.jpg" },
  { label: "7 places", modeles: "5008, Touran, Sharan, Galaxy", photo: "/categories/vente_7places.jpg" },
  { label: "Sportives / Coupés", modeles: "911, M3, TT, RC", photo: "/categories/vente_sportive.jpg" },
  { label: "Pick-up / 4x4", modeles: "Hilux, Ranger, L200, Duster", photo: "/categories/vente_pickup.jpg" },
];

const DEMO_ANNONCES = [
  { id: 1, nom: "Peugeot 208 Style", annee: 2022, km: 35000, prix: 14500, carburant: "Essence", boite: "Manuelle", region: "Île-de-France", note: 4.5, photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=260&fit=crop", vendeur: "Particulier" },
  { id: 2, nom: "Renault Clio V Intens", annee: 2023, km: 18000, prix: 16900, carburant: "Essence", boite: "Automatique", region: "Rhône-Alpes", note: 4.7, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop", vendeur: "Professionnel" },
  { id: 3, nom: "BMW Série 3 320d", annee: 2021, km: 62000, prix: 27500, carburant: "Diesel", boite: "Automatique", region: "PACA", note: 4.8, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", vendeur: "Professionnel" },
  { id: 4, nom: "Peugeot 3008 GT Hybrid", annee: 2023, km: 25000, prix: 32000, carburant: "Hybride", boite: "Automatique", region: "Île-de-France", note: 4.6, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop", vendeur: "Particulier" },
  { id: 5, nom: "Volkswagen Golf 8 R-Line", annee: 2022, km: 42000, prix: 24900, carburant: "Essence", boite: "Automatique", region: "Nord", note: 4.4, photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop", vendeur: "Professionnel" },
  { id: 6, nom: "Dacia Sandero Stepway", annee: 2024, km: 8000, prix: 15500, carburant: "GPL", boite: "Manuelle", region: "Bretagne", note: 4.3, photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop", vendeur: "Particulier" },
];

const FAQ = [
  { q: "Comment acheter un véhicule sur MKA.P-MS ?", r: "Parcourez les annonces, consultez les détails, contactez le vendeur via la messagerie interne et finalisez votre achat en toute sécurité." },
  { q: "Comment fonctionne le paiement sécurisé ?", r: "MKA.P-MS propose un paiement sécurisé avec séquestre. Le paiement est bloqué jusqu'à la réception du véhicule." },
  { q: "Puis-je financer mon achat ?", r: "Oui, simulez votre financement avec Finance+ directement sur chaque annonce." },
  { q: "Comment vérifier un vendeur ?", r: "Chaque vendeur dispose d'un score de confiance basé sur ses transactions, avis et documents." },
];

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop";

const ANNEES = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i));

export default function VenteParticulier() {
  const [showFilters, setShowFilters] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { country } = useCurrency();
  const { data: realData, isLoading } = trpc.annonces.list.useQuery({ categorieAnnonce: "particulier", type: "vente", pays: country ?? undefined, limit: 30 });

  const realAnnonces = (realData?.items ?? []).map((a: any) => ({
    id: a.id,
    nom: a.titre || `${a.marque} ${a.modele}`,
    annee: a.annee,
    km: a.kilometrage ?? 0,
    prix: Number(a.prix) || 0,
    carburant: a.carburant || a.energie || "",
    boite: a.boite || "Manuelle",
    region: a.ville || "",
    note: 4.5,
    photo: a.photoPrincipale || PLACEHOLDER_IMG,
    vendeur: a.vendeurType === "professionnel" ? "Professionnel" : "Particulier",
  }));

  const annonces = realAnnonces.length > 0 ? realAnnonces : DEMO_ANNONCES;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* EN-TÊTE */}
      <div className="bg-[#D4AF37] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/70 mb-2">
          <ChevronLeft size={14} /> Retour Vente
        </Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">
          PARTICULIER
        </span>
        <h1 className="text-xl font-black text-white">Achat Particulier</h1>
        <p className="mt-1 text-sm text-white/80">Citadines, berlines, SUV, monospaces, breaks, cabriolets</p>
      </div>

      {/* BARRE DE RECHERCHE DÉPLIANTE */}
      <div className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        {/* Ligne principale */}
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input
            type="text"
            placeholder="Marque, modèle, région…"
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
                {MARQUES_PART.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Catégorie</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes les catégories</option>
                {CATEGORIES.map((c) => <option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>

            {/* Carburant */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Carburant</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Tous</option>
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybride">Hybride</option>
                <option value="Électrique">Électrique</option>
                <option value="GPL">GPL</option>
              </select>
            </div>

            {/* Boîte */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Boîte de vitesses</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Toutes</option>
                <option value="Manuelle">Manuelle</option>
                <option value="Automatique">Automatique</option>
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
                <option value="20000">20 000 km</option>
                <option value="50000">50 000 km</option>
                <option value="100000">100 000 km</option>
                <option value="150000">150 000 km</option>
                <option value="200000">200 000 km</option>
              </select>
            </div>

            {/* Vendeur */}
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Type de vendeur</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white">
                <option value="">Tous</option>
                <option value="particulier">Particulier</option>
                <option value="professionnel">Professionnel</option>
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
                  placeholder="100 000 €"
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
      <div className="px-4 mt-6">
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
                <p className="text-[8px] text-[#6B7280] truncate">{c.modeles}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ANNONCES */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#111]">Annonces récentes</h2>
          {realData && (
            <span className="text-[10px] text-[#6B7280]">
              {realData.total} annonce{realData.total > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {isLoading && <div className="py-8 text-center text-[#6B7280] text-sm">Chargement…</div>}
        <div className="mt-3 space-y-3">
          {annonces.map((a) => (
            <Link
              key={a.id}
              to={getAnnonceUrl(a.id, (a as any).categorieAnnonce, (a as any).vendeurType)}
              className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-[140px]">
                <img
                  src={a.photo}
                  alt={a.nom}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                />
                <span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                  <Heart size={14} className="text-red-500" />
                </span>
                <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${a.vendeur === "Professionnel" ? "bg-blue-800 text-white" : "bg-[#D4AF37] text-white"}`}>
                  {a.vendeur}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-[#6B7280]">
                  <span>{a.annee}</span>
                  <span>{(a.km ?? 0).toLocaleString("fr-FR")} km</span>
                  <span>{a.carburant}</span>
                  <span>{a.boite}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-[#6B7280]">
                  <MapPin size={10} className="text-red-500" /> {a.region}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-black text-[#D4AF37]">
                    {(a.prix ?? 0).toLocaleString("fr-FR")} €
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-[#6B7280]">
                    <Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> {a.note}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 mt-8">
        <h2 className="text-base font-bold text-[#111]">FAQ Achat particulier</h2>
        <div className="mt-3 space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-[#111] pr-2">{f.q}</span>
                <ChevronDown
                  size={14}
                  className={`text-[#D4AF37] shrink-0 transition ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-[#6B7280]">{f.r}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
