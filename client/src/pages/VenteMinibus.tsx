import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, Bus, Heart, Shield, Users, Star, ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import { getAnnonceUrl } from "../lib/annonceUrl";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE MINIBUS — Univers achat
   Pour groupes, familles, associations et transport collectif.
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { label: "7-8 places", desc: "Monospace, van familial", photo: "/categories/vtc_minivan.jpg" },
  { label: "9 places", desc: "Transit, Sprinter 9pl", photo: "/categories/loc_cover_minibus.jpg" },
  { label: "12-17 places", desc: "Master, Sprinter 17pl", photo: "/categories/loc_cover_minibus.jpg" },
  { label: "Premium / VIP", desc: "V-Class, Viano, Caravelle", photo: "/categories/vtc_minivan.jpg" },
  { label: "Scolaire", desc: "Transport scolaire homologué", photo: "/categories/loc_cover_minibus.jpg" },
  { label: "Électrique", desc: "Minibus zéro émission", photo: "/categories/camion_electrique.jpg" },
  { label: "Accessible PMR", desc: "Rampe, plancher bas", photo: "/categories/loc_cover_minibus.jpg" },
  { label: "Avec chauffeur", desc: "Conducteur inclus", photo: "/categories/vtc_minivan.jpg" },
];

const MARQUES = [
  "Mercedes", "Volkswagen", "Ford", "Renault", "Peugeot", "Citroën",
  "Fiat", "Iveco", "Toyota", "Hyundai", "Kia", "Opel",
];

const ANNONCES = [
  { id: 9200, titre: "Mercedes Sprinter 9pl", annee: 2023, km: 45000, places: 9, boite: "Automatique", prix: 38500, categorie: "9 places", photo: "/categories/loc_cover_minibus.jpg", vendeurType: "professionnel" },
  { id: 9201, titre: "Volkswagen Transporter Caravelle", annee: 2022, km: 32000, places: 9, boite: "Manuelle", prix: 34900, categorie: "9 places", photo: "/categories/vtc_minivan.jpg", vendeurType: "professionnel" },
  { id: 9202, titre: "Ford Transit 9pl Kombi", annee: 2023, km: 28000, places: 9, boite: "Manuelle", prix: 29900, categorie: "9 places", photo: "/categories/loc_cover_minibus.jpg", vendeurType: "particulier" },
  { id: 9203, titre: "Mercedes V-Class VIP 7pl", annee: 2024, km: 12000, places: 7, boite: "Automatique", prix: 62000, categorie: "Premium / VIP", photo: "/categories/vtc_minivan.jpg", vendeurType: "professionnel" },
  { id: 9204, titre: "Renault Master 12pl", annee: 2022, km: 58000, places: 12, boite: "Manuelle", prix: 32500, categorie: "12-17 places", photo: "/categories/loc_cover_minibus.jpg", vendeurType: "professionnel" },
  { id: 9205, titre: "Mercedes Sprinter 17pl", annee: 2023, km: 38000, places: 17, boite: "Automatique", prix: 54000, categorie: "12-17 places", photo: "/categories/loc_cover_minibus.jpg", vendeurType: "professionnel" },
  { id: 9206, titre: "Peugeot Traveller 8pl", annee: 2023, km: 22000, places: 8, boite: "Automatique", prix: 36900, categorie: "7-8 places", photo: "/categories/vtc_minivan.jpg", vendeurType: "particulier" },
  { id: 9207, titre: "Citroën SpaceTourer 8pl", annee: 2022, km: 41000, places: 8, boite: "Automatique", prix: 31500, categorie: "7-8 places", photo: "/categories/vtc_minivan.jpg", vendeurType: "particulier" },
];

const OCCASIONS = [
  { label: "Mariage", icon: Heart },
  { label: "Groupe / Association", icon: Users },
  { label: "Séminaire", icon: Star },
  { label: "Voyage scolaire", icon: Bus },
  { label: "Famille nombreuse", icon: Users },
  { label: "Événement sportif", icon: Shield },
];

const FAQ = [
  { q: "Quel permis pour conduire un minibus ?", a: "Permis B pour les minibus jusqu'à 9 places (PTAC ≤ 3,5t). Au-delà de 9 places, le permis D est requis." },
  { q: "Quelle différence entre 9 places et 12-17 places ?", a: "Les 9 places relèvent du permis B. Les 12-17 places nécessitent le permis D et sont soumis à une réglementation transport en commun." },
  { q: "Puis-je financer l'achat ?", a: "Oui, MKA.P-MS propose Finance+ avec simulation de crédit, LOA et paiement fractionné directement dans la plateforme." },
  { q: "Les minibus sont-ils garantis ?", a: "Les véhicules professionnels et certifiés MKA.P-MS sont couverts par une garantie. Les ventes entre particuliers dépendent du vendeur." },
];

const TYPE_FILTER = ["Tous", "7-8 places", "9 places", "12-17 places", "Premium / VIP"];

export default function VenteMinibus() {
  const [showFilters, setShowFilters] = useState(false);
  const [filtre, setFiltre] = useState("Tous");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filtered = ANNONCES.filter((a) => {
    if (selectedCat && a.categorie !== selectedCat) return false;
    if (filtre === "Tous") return true;
    return a.categorie === filtre;
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* BANNIÈRE */}
      <div className="relative overflow-hidden">
        <img
          src="/categories/loc_cover_minibus.jpg"
          alt="Minibus"
          className="w-full h-[240px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 via-[#111]/40 to-transparent" />
        <Link
          to="/acheter"
          className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur"
        >
          <ChevronLeft size={20} className="text-[#111]" />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-700 px-2.5 py-1 text-[10px] font-bold text-white mb-2">
            <Bus size={10} /> MINIBUS
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">ACHAT MINIBUS</h1>
          <p className="mt-1 text-sm text-white/80">Pour groupes, familles, associations et transport collectif.</p>
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input
            type="text"
            placeholder="Marque, modèle, nombre de places…"
            className="w-full bg-transparent text-sm outline-none"
          />
          <button onClick={() => setShowFilters(!showFilters)}>
            <ChevronDown size={16} className={`text-[#6B7280] transition ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>
        {showFilters && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Marque</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                <option value="">Toutes les marques</option>
                {MARQUES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B7280] uppercase">Nombre de places</label>
              <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                <option value="">Tous</option>
                {TYPE_FILTER.filter(f => f !== "Tous").map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Prix min</label>
                <input placeholder="0 €" className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Prix max</label>
                <input placeholder="100 000 €" className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
              </div>
            </div>
            <button className="w-full py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold">Rechercher</button>
          </div>
        )}
      </div>

      {/* CATÉGORIES */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setSelectedCat(selectedCat === c.label ? null : c.label)}
              className={`shrink-0 w-[110px] rounded-xl overflow-hidden border-2 active:scale-[0.98] transition ${selectedCat === c.label ? "border-purple-700" : "border-[#E5E7EB]"}`}
            >
              <img src={c.photo} alt={c.label} className="w-full h-[55px] object-cover" loading="lazy" />
              <div className="p-1.5 bg-white">
                <p className="text-[10px] font-bold text-[#111] leading-tight">{c.label}</p>
                <p className="text-[7px] text-[#6B7280] leading-tight truncate">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* OCCASIONS */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Pour quelle occasion ?</h2>
        <div className="mt-3 flex gap-2 flex-wrap">
          {OCCASIONS.map((o) => {
            const Icon = o.icon;
            return (
              <span key={o.label} className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#111]">
                <Icon size={11} className="text-purple-700" /> {o.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* ANNONCES */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">
          {selectedCat ? `Annonces ${selectedCat}` : "Toutes les annonces"} ({filtered.length})
        </h2>
        <div className="mt-3 space-y-3">
          {filtered.map((a) => (
            <Link
              key={a.id}
              to={getAnnonceUrl(a.id, a.vendeurType === "professionnel" ? "professionnelle" : "particulier", a.vendeurType)}
              className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-[130px]">
                <img src={a.photo} alt={a.titre} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                  <Heart size={14} className="text-red-500" />
                </span>
                <span className="absolute top-2 left-2 rounded-full bg-purple-700 px-2 py-0.5 text-[9px] font-bold text-white">
                  {a.places} places
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{a.titre}</h3>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{a.annee} · {a.km.toLocaleString("fr-FR")} km · {a.boite}</p>
                <p className="mt-2 text-lg font-black text-[#111]">{a.prix.toLocaleString("fr-FR")} €</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 mt-8">
        <h2 className="text-base font-bold text-[#111] flex items-center gap-2">
          <HelpCircle size={16} className="text-purple-700" /> Questions fréquentes
        </h2>
        <div className="mt-3 space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-semibold text-[#111]">{f.q}</span>
                <ChevronRight size={14} className={`text-[#6B7280] transition ${openFaq === i ? "rotate-90" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3 text-xs text-[#6B7280] border-t border-[#E5E7EB] pt-2">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mt-6">
        <Link
          to="/vendre"
          className="block w-full py-3 bg-purple-700 text-white rounded-xl text-sm font-bold text-center active:scale-[0.98]"
        >
          Vendre mon minibus sur MKA.P-MS
        </Link>
      </div>
    </div>
  );
}
