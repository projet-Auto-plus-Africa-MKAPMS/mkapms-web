import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Search, MapPin, Calendar, CarFront, Car,
  Shield, Lock, Headphones, FileCheck, ChevronDown, Star,
  CheckCircle2, Globe, Rocket, CreditCard, Users, Heart,
  ArrowRight, Gauge, Filter, Ban, Navigation2, Fuel
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE LOCATION MKA.P-MS OFFICIEL
   Véhicules officiels MKA.P-MS sélectionnés, inspectés et garantis.
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  {
    titre: "Berlines",
    modeles: ["308 GT", "Classe C", "Série 3"],
    desc: "Confort premium garanti MKA.P-MS.",
    photo: "/categories/vtc_berline_premium.jpg",
    count: 12,
  },
  {
    titre: "SUV & 4x4",
    modeles: ["GLA", "X1", "Austral", "C5 X"],
    desc: "Polyvalence et espace.",
    photo: "/categories/suv.jpg",
    count: 10,
  },
  {
    titre: "Hybrides",
    modeles: ["Austral E-Tech", "Model Y", "Prius"],
    desc: "Économie et écologie.",
    photo: "/categories/cat_hybride.jpg",
    count: 8,
  },
  {
    titre: "Électriques",
    modeles: ["Model 3", "ZOE", "e-208", "ID.4"],
    desc: "Zéro émission, 100% certifiés.",
    photo: "/categories/cat_electrique.jpg",
    count: 6,
  },
  {
    titre: "Premium",
    modeles: ["Mercedes", "BMW", "Audi", "Lexus"],
    desc: "Haut de gamme, standing maximal.",
    photo: "/categories/pro_premium.jpg",
    count: 5,
  },
  {
    titre: "Familiales",
    modeles: ["C5 X", "3008", "RAV4", "Tiguan"],
    desc: "Grand espace, confort famille.",
    photo: "/categories/cat_familiale.jpg",
    count: 7,
  },
  {
    titre: "Citadines",
    modeles: ["208", "Clio", "Polo", "A1"],
    desc: "Légèreté et maniabilité.",
    photo: "/categories/citadine.jpg",
    count: 9,
  },
  {
    titre: "Breaks",
    modeles: ["508 SW", "Passat SW", "A4 Avant"],
    desc: "Grand coffre, idéal voyages.",
    photo: "/categories/break.jpg",
    count: 4,
  },
  {
    titre: "Cabriolets",
    modeles: ["SLK", "Z4", "Boxster"],
    desc: "Plaisir et liberté.",
    photo: "/categories/cabriolet.jpg",
    count: 3,
  },
  {
    titre: "Monospaces",
    modeles: ["Scenic", "Touran", "Espace"],
    desc: "Confort familles nombreuses.",
    photo: "/categories/monospace.jpg",
    count: 4,
  },
  {
    titre: "7 places",
    modeles: ["5008", "Touran", "Sharan", "Galaxy"],
    desc: "Espace maximal, toute la famille.",
    photo: "/categories/mkapms_7places.jpg",
    count: 5,
  },
  {
    titre: "Sportives / Coupés",
    modeles: ["911", "M4", "TT", "RC"],
    desc: "Sensations et prestige certifiés.",
    photo: "/categories/mkapms_sportive.jpg",
    count: 4,
  },
  {
    titre: "4x4 tout-terrain",
    modeles: ["Defender", "Land Cruiser", "G-Class"],
    desc: "Aventure et robustesse premium.",
    photo: "/categories/mkapms_4x4.jpg",
    count: 3,
  },
];

const VEHICULES = [
  { id: 8001, titre: "Peugeot 308 GT Pack", annee: 2024, boite: "Automatique", carburant: "Essence", places: 5, prixJour: 55, prixSemaine: 330, prixMois: 1200, photo: "/categories/vtc_berline_premium.jpg", categorie: "Berline", badge: "MKA.P-MS Officiel" },
  { id: 8002, titre: "Renault Austral E-Tech", annee: 2024, boite: "Automatique", carburant: "Hybride", places: 5, prixJour: 65, prixSemaine: 390, prixMois: 1400, photo: "/categories/cat_hybride.jpg", categorie: "Hybride", badge: "MKA.P-MS Officiel" },
  { id: 8003, titre: "Tesla Model 3 Standard", annee: 2024, boite: "Automatique", carburant: "Électrique", places: 5, prixJour: 70, prixSemaine: 420, prixMois: 1500, photo: "/categories/cat_electrique.jpg", categorie: "Électrique", badge: "MKA.P-MS Officiel" },
  { id: 8004, titre: "Mercedes GLA 200d", annee: 2024, boite: "Automatique", carburant: "Diesel", places: 5, prixJour: 75, prixSemaine: 450, prixMois: 1650, photo: "/categories/suv.jpg", categorie: "SUV", badge: "MKA.P-MS Officiel" },
  { id: 8005, titre: "BMW Série 3 320i", annee: 2024, boite: "Automatique", carburant: "Essence", places: 5, prixJour: 80, prixSemaine: 480, prixMois: 1750, photo: "/categories/pro_premium.jpg", categorie: "Premium", badge: "MKA.P-MS Officiel" },
  { id: 8006, titre: "Peugeot 3008 GT", annee: 2024, boite: "Automatique", carburant: "Diesel", places: 5, prixJour: 68, prixSemaine: 408, prixMois: 1480, photo: "/categories/cat_familiale.jpg", categorie: "Familiale", badge: "MKA.P-MS Officiel" },
];

const SERVICES = [
  { icon: Shield, label: "Contrôle qualité 200 points", desc: "Inspection complète par nos experts" },
  { icon: CheckCircle2, label: "Historique vérifié", desc: "Kilométrage, sinistres, entretien certifiés" },
  { icon: CreditCard, label: "Finance+ intégré", desc: "Crédit, LOA, paiement fractionné" },
  { icon: ArrowRight, label: "Livraison partout en France", desc: "Livré chez vous ou en agence" },
  { icon: Star, label: "Garantie MKA.P-MS", desc: "Jusqu'à 24 mois de garantie" },
  { icon: Headphones, label: "Conseiller dédié", desc: "Un conseiller vous accompagne" },
  { icon: Lock, label: "Paiement sécurisé", desc: "CB, Apple Pay, Google Pay" },
  { icon: FileCheck, label: "Documents en ligne", desc: "Contrat, facture — tout dématérialisé" },
];

const FAQ = [
  { q: "Qu'est-ce qu'un véhicule MKA.P-MS Officiel ?", a: "Ce sont des véhicules sélectionnés, inspectés sur 200 points et garantis directement par MKA.P-MS. Chaque véhicule a un historique vérifié et est livré en parfait état." },
  { q: "Quelle est la durée minimale de location ?", a: "La durée minimale est d'1 journée. Des tarifs dégressifs s'appliquent à partir de 3 jours, 1 semaine et 1 mois." },
  { q: "Comment fonctionne la caution ?", a: "Empreinte bancaire de 500 € prise à la réservation (non débitée). Libérée sous 7 jours ouvrés après restitution du véhicule en bon état." },
  { q: "La livraison est-elle incluse ?", a: "La livraison est disponible partout en France. Elle peut être incluse selon l'offre choisie ou facturée séparément selon la distance." },
  { q: "Peut-on annuler ?", a: "Annulation gratuite jusqu'à 48h avant. Entre 48h et 24h : 50%. Moins de 24h : montant total." },
];

const TYPE_FILTER = ["Tous", "Berline", "SUV", "Hybride", "Électrique", "Premium"];

export default function LocationMKAPMS() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [filtre, setFiltre] = useState("Tous");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filteredVehicules = VEHICULES.filter((v) => {
    if (filtre !== "Tous") {
      const cat = v.categorie.toLowerCase();
      const f = filtre.toLowerCase();
      if (!cat.includes(f)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 max-w-6xl mx-auto">

      {/* BANNIÈRE */}
      <div className="relative overflow-hidden">
        <img
          src="/categories/cover_mkapms.jpg"
          alt="Location MKA.P-MS Officiel"
          className="w-full h-[240px] md:h-[320px] lg:h-[400px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 via-[#111]/40 to-transparent" />
        <Link to="/louer" className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur">
          <ChevronLeft size={20} className="text-[#111]" />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#111] border border-[#D4AF37] px-2.5 py-1 text-[10px] font-bold text-[#D4AF37] mb-2">
            <Star size={10} /> MKA.P-MS OFFICIEL
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">VÉHICULES MKA.P-MS</h1>
          <p className="mt-1 text-sm text-white/80">Sélectionnés, inspectés, garantis par MKA.P-MS.</p>
          <button
            onClick={() => document.getElementById("search-mkapms")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-3 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2"
          >
            <Search size={14} /> Trouver un véhicule
          </button>
        </div>
      </div>

      {/* AVANTAGES */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        {SERVICES.slice(0, 6).map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-start gap-2">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-[#FFF8E7] flex items-center justify-center">
                <Icon size={14} className="text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#111] leading-tight">{s.label}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5 leading-tight">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* BARRE DE RECHERCHE */}
      <div id="search-mkapms" className="mx-4 mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Lieu de retrait</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <MapPin size={14} className="text-red-500 shrink-0" />
              <input type="text" placeholder="Ville, gare, aéroport…" value={lieu} onChange={(e) => setLieu(e.target.value)} className="w-full bg-transparent text-sm text-[#111] placeholder:text-[#9CA3AF] outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date départ</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-[#D4AF37] shrink-0" />
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date retour</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-[#D4AF37] shrink-0" />
                <input type="date" value={dateRetour} onChange={(e) => setDateRetour(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none" />
              </div>
            </div>
          </div>
          <button className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md">
            <Search size={16} /> Rechercher un véhicule MKA.P-MS
          </button>
        </div>
      </div>

      {/* CATÉGORIES */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-[#111]">Catégories</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">Tous nos véhicules officiels par type.</p>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.titre}
              onClick={() => setSelectedCat(selectedCat === c.titre ? null : c.titre)}
              className={`shrink-0 w-[140px] rounded-xl overflow-hidden border transition ${selectedCat === c.titre ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30" : "border-[#E5E7EB]"}`}
            >
              <img src={c.photo} alt={c.titre} className="h-[80px] w-full object-cover" loading="lazy" />
              <div className="p-2 bg-white">
                <p className="text-xs font-bold text-[#111] truncate">{c.titre}</p>
                <p className="text-[10px] text-[#6B7280]">{c.count} véhicules</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FILTRES */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TYPE_FILTER.map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${filtre === f ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* LISTE DES VÉHICULES */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#111]">Véhicules disponibles</h2>
          <span className="text-xs text-[#6B7280]">{filteredVehicules.length} résultat{filteredVehicules.length > 1 ? "s" : ""}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicules.map((v) => (
            <Link key={v.id} to={`/louer/mkapms/vehicule/${v.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.99] transition hover:shadow-lg">
              <div className="relative h-[160px] md:h-[180px] lg:h-[200px]">
                <img src={v.photo} alt={v.titre} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-[#111] border border-[#D4AF37] px-2.5 py-0.5 text-[9px] font-bold text-[#D4AF37]">{v.badge}</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111]">{v.titre}</h3>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {v.annee}</span>
                  <span className="flex items-center gap-1"><Car size={10} /> {v.boite}</span>
                  <span className="flex items-center gap-1"><Fuel size={10} /> {v.carburant}</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {v.places} pl.</span>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                    <p className="text-[9px] text-[#6B7280] uppercase">Jour</p>
                    <p className="text-sm font-black text-[#111]">{v.prixJour} €</p>
                  </div>
                  <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                    <p className="text-[9px] text-[#6B7280] uppercase">Semaine</p>
                    <p className="text-sm font-black text-[#111]">{v.prixSemaine} €</p>
                  </div>
                  <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                    <p className="text-[9px] text-[#6B7280] uppercase">Mois</p>
                    <p className="text-sm font-black text-[#111]">{v.prixMois} €</p>
                  </div>
                </div>
                <button className="mt-3 w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-extrabold text-white flex items-center justify-center gap-1.5">
                  <Heart size={12} /> Réserver ce véhicule
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-bold text-[#111]">Questions fréquentes</h2>
        <div className="mt-3 space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-semibold text-[#111] pr-4">{item.q}</span>
                <ChevronDown size={16} className={`shrink-0 text-[#6B7280] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-[#6B7280] leading-relaxed">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
