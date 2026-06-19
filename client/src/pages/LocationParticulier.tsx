import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Search, MapPin, Calendar, CarFront, Car,
  Shield, Lock, Clock, Headphones, FileCheck, ChevronDown, Star,
  CheckCircle2, Globe, Rocket, CreditCard, Users, Heart, Gem,
  ArrowRight, MapPinned, Navigation, Gauge, Package, Filter,
  Palmtree, PartyPopper, Briefcase, Baby, Replace, Ban,
  Navigation2, XCircle, Eye
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE LOCATION PARTICULIER
   Réservée aux particuliers. Totalement séparée de Pro, VTC, Vente.
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  {
    titre: "Citadines",
    modeles: ["Clio", "208", "Corsa", "Yaris"],
    desc: "Idéal ville et petits trajets.",
    photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=240&fit=crop",
    count: 18,
  },
  {
    titre: "Berlines",
    modeles: ["Série 3", "Classe C", "A4"],
    desc: "Confort et longs trajets.",
    photo: "https://images.unsplash.com/photo-1590316536591-92ba019a7b50?w=400&h=240&fit=crop",
    count: 14,
  },
  {
    titre: "SUV & 4x4",
    modeles: ["3008", "Tiguan", "X3", "GLC"],
    desc: "Famille et vacances.",
    photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=240&fit=crop",
    count: 16,
  },
  {
    titre: "Familiales",
    modeles: ["508 SW", "Passat SW", "Talisman Estate"],
    desc: "Grand coffre.",
    photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=240&fit=crop",
    count: 8,
  },
  {
    titre: "Monospaces",
    modeles: ["Scenic", "Touran", "Espace"],
    desc: "Familles nombreuses.",
    photo: "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=400&h=240&fit=crop",
    count: 6,
  },
  {
    titre: "7 Places",
    modeles: ["Grand C4", "Sharan", "Galaxy"],
    desc: "Pour voyages et groupes.",
    photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=240&fit=crop",
    count: 5,
  },
  {
    titre: "Minibus",
    modeles: ["8 places", "9 places"],
    desc: "Petits groupes et familles.",
    photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=240&fit=crop",
    count: 4,
  },
  {
    titre: "Véhicules Premium",
    modeles: ["Audi", "BMW", "Mercedes", "Lexus"],
    desc: "Luxe et prestige.",
    photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=240&fit=crop",
    count: 10,
  },
];

const VEHICULES = [
  { id: 1, titre: "Renault Clio V", annee: 2024, boite: "Manuelle", carburant: "Essence", places: 5, prixJour: 28, prixSemaine: 168, prixMois: 580, photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=260&fit=crop", categorie: "Citadine" },
  { id: 2, titre: "Peugeot 208 GT", annee: 2024, boite: "Automatique", carburant: "Essence", places: 5, prixJour: 32, prixSemaine: 192, prixMois: 650, photo: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=260&fit=crop", categorie: "Citadine" },
  { id: 3, titre: "BMW Série 3 320d", annee: 2023, boite: "Automatique", carburant: "Diesel", places: 5, prixJour: 55, prixSemaine: 330, prixMois: 1100, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", categorie: "Berline" },
  { id: 4, titre: "Peugeot 3008 GT", annee: 2024, boite: "Automatique", carburant: "Hybride", places: 5, prixJour: 52, prixSemaine: 312, prixMois: 1050, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop", categorie: "SUV" },
  { id: 5, titre: "Volkswagen Tiguan", annee: 2023, boite: "Automatique", carburant: "Diesel", places: 5, prixJour: 58, prixSemaine: 348, prixMois: 1150, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop", categorie: "SUV" },
  { id: 6, titre: "Peugeot 508 SW", annee: 2024, boite: "Automatique", carburant: "Hybride", places: 5, prixJour: 48, prixSemaine: 288, prixMois: 950, photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop", categorie: "Familiale" },
  { id: 7, titre: "Renault Scenic E-Tech", annee: 2024, boite: "Automatique", carburant: "Électrique", places: 5, prixJour: 55, prixSemaine: 330, prixMois: 1100, photo: "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=400&h=260&fit=crop", categorie: "Monospace" },
  { id: 8, titre: "Mercedes Classe C 200", annee: 2023, boite: "Automatique", carburant: "Essence", places: 5, prixJour: 65, prixSemaine: 390, prixMois: 1300, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", categorie: "Premium" },
  { id: 9, titre: "Audi A4 Avant", annee: 2024, boite: "Automatique", carburant: "Diesel", places: 5, prixJour: 62, prixSemaine: 372, prixMois: 1250, photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=260&fit=crop", categorie: "Premium" },
  { id: 10, titre: "Toyota Yaris Hybride", annee: 2024, boite: "Automatique", carburant: "Hybride", places: 5, prixJour: 30, prixSemaine: 180, prixMois: 620, photo: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=260&fit=crop", categorie: "Citadine" },
];

const DESTINATIONS = [
  { label: "Vacances", icon: Palmtree, color: "bg-green-100 text-green-700" },
  { label: "Week-end", icon: Heart, color: "bg-pink-100 text-pink-700" },
  { label: "Mariage", icon: PartyPopper, color: "bg-purple-100 text-purple-700" },
  { label: "Déplacement familial", icon: Users, color: "bg-blue-100 text-blue-700" },
  { label: "Voyage d'affaires", icon: Briefcase, color: "bg-amber-100 text-amber-700" },
  { label: "Remplacement temporaire", icon: Replace, color: "bg-orange-100 text-orange-700" },
];

const SERVICES = [
  { icon: MapPin, label: "Livraison du véhicule", desc: "Livré à l'adresse de votre choix" },
  { icon: Rocket, label: "Retrait rapide", desc: "Véhicule prêt en agence" },
  { icon: Users, label: "Conducteur supplémentaire", desc: "Ajoutez un deuxième conducteur" },
  { icon: Navigation2, label: "GPS", desc: "Navigation intégrée" },
  { icon: Baby, label: "Siège enfant", desc: "Siège bébé ou rehausseur" },
  { icon: Gauge, label: "Extension kilométrique", desc: "Ajustez votre forfait km" },
  { icon: Headphones, label: "Assistance 24h/24", desc: "Support en cas de problème" },
  { icon: Shield, label: "Protection complémentaire", desc: "Franchise réduite ou supprimée" },
];

const FAQ = [
  { q: "Comment louer ?", a: "Choisissez votre véhicule, vos dates, téléchargez vos documents (permis + pièce d'identité), payez en ligne. Confirmation immédiate par email." },
  { q: "Quels documents fournir ?", a: "Permis de conduire en cours de validité (minimum 1 an), pièce d'identité, justificatif de domicile si demandé, carte bancaire." },
  { q: "Comment fonctionne la caution ?", a: "Empreinte bancaire prise à la réservation (non débitée). Libérée sous 7 jours ouvrés après restitution du véhicule en bon état." },
  { q: "Peut-on annuler ?", a: "Annulation gratuite jusqu'à 48h avant la prise en charge. Entre 48h et 24h : 50% du montant. Moins de 24h : montant total." },
  { q: "Comment récupérer le véhicule ?", a: "Présentez-vous en agence avec votre permis, pièce d'identité et code de réservation. Ou choisissez la livraison à domicile." },
  { q: "Puis-je ajouter un conducteur ?", a: "Oui, vous pouvez ajouter un conducteur supplémentaire lors de la réservation ou au retrait du véhicule (supplément applicable)." },
];

const TYPE_PART = ["Tous types", "Citadine", "Berline", "SUV", "Familiale", "Monospace", "7 Places", "Minibus", "Premium"];

export default function LocationParticulier() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [typeVehicule, setTypeVehicule] = useState("Tous types");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filteredVehicules = selectedCat
    ? VEHICULES.filter((v) => v.categorie === selectedCat)
    : VEHICULES;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 max-w-6xl mx-auto">

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — BANNIÈRE PRINCIPALE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=420&fit=crop"
          alt="Location particulier"
          className="w-full h-[240px] md:h-[320px] lg:h-[400px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 via-[#111]/40 to-transparent" />
        <Link to="/louer" className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur">
          <ChevronLeft size={20} className="text-[#111]" />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-2.5 py-1 text-[10px] font-bold text-white mb-2">
            <CarFront size={10} /> PARTICULIER
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">LOCATION POUR PARTICULIERS</h1>
          <p className="mt-1 text-sm text-white/80">Louez facilement le véhicule adapté à votre besoin.</p>
          <button
            onClick={() => document.getElementById("search-part")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-3 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white active:scale-[0.98] transition"
          >
            Trouver mon véhicule
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — RECHERCHE RAPIDE
          ═══════════════════════════════════════════════════════════════════ */}
      <div id="search-part" className="mx-4 -mt-3 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Ville de départ</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <MapPin size={14} className="text-red-500 shrink-0" />
              <input type="text" placeholder="Paris, Lyon, Marseille…" value={lieu} onChange={(e) => setLieu(e.target.value)} className="w-full bg-transparent text-sm text-[#111] placeholder:text-red-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date de départ</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-[#D4AF37] shrink-0" />
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date de retour</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-[#D4AF37] shrink-0" />
                <input type="date" value={dateRetour} onChange={(e) => setDateRetour(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Type de véhicule</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <CarFront size={14} className="text-[#D4AF37] shrink-0" />
              <select value={typeVehicule} onChange={(e) => setTypeVehicule(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none">
                {TYPE_PART.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md">
            <Search size={16} /> Rechercher
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — CATÉGORIES PARTICULIERS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((c) => {
            const isSelected = selectedCat === c.titre;
            return (
              <button
                key={c.titre}
                onClick={() => setSelectedCat(isSelected ? null : c.titre)}
                className={`shrink-0 w-[140px] md:w-[160px] lg:w-[180px] rounded-xl bg-white border-2 overflow-hidden text-left transition active:scale-[0.98] ${isSelected ? "border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/30" : "border-[#E5E7EB]"}`}
              >
                <div className="relative h-[80px] overflow-hidden">
                  <img src={c.photo} alt={c.titre} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white">{c.count} dispo</span>
                </div>
                <div className="px-2.5 py-2">
                  <span className="text-xs font-bold text-[#111] truncate block">{c.titre}</span>
                  <p className="text-[9px] text-[#6B7280] mt-0.5 truncate">{c.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — FILTRES PARTICULIERS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#D4AF37]" />
            <span className="text-sm font-bold text-[#111]">Filtres</span>
          </div>
          <ChevronDown size={16} className={`text-red-500 transition ${showFilters ? "rotate-180" : ""}`} />
        </button>
        {showFilters && (
          <div className="mt-2 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
            {[
              "Boîte automatique", "Boîte manuelle", "Essence", "Diesel",
              "Hybride", "Électrique", "7 places", "GPS", "Siège bébé",
              "Kilométrage illimité", "Disponible immédiatement",
            ].map((f) => (
              <label key={f} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-[#D4AF37] text-[#D4AF37] accent-[#D4AF37]" />
                <span className="text-sm text-[#111]">{f}</span>
              </label>
            ))}
            <button className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-white mt-2">
              Appliquer les filtres
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — VÉHICULES DISPONIBLES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111]">Véhicules disponibles</h2>
          <span className="text-xs font-semibold text-[#6B7280]">{filteredVehicules.length} résultat{filteredVehicules.length > 1 ? "s" : ""}</span>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVehicules.map((v) => (
            <Link key={v.id} to={`/louer/particulier/vehicule/${v.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.99] transition hover:shadow-lg">
              <div className="relative h-[160px] md:h-[180px] lg:h-[200px]">
                <img src={v.photo} alt={v.titre} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-[#D4AF37]/90 px-2.5 py-0.5 text-[9px] font-bold text-white">{v.categorie}</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111]">{v.titre}</h3>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {v.annee}</span>
                  <span className="flex items-center gap-1"><Car size={10} /> {v.boite}</span>
                  <span className="flex items-center gap-1"><Gauge size={10} /> {v.carburant}</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {v.places} pl.</span>
                </div>
                <div className="mt-3 relative">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#6B7280] uppercase">Jour</p>
                      <p className="text-sm font-black text-[#111]">{v.prixJour} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#6B7280] uppercase">3 Jours</p>
                      <p className="text-sm font-black text-[#111]">{Math.round(v.prixJour * 2.7)} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#6B7280] uppercase">Semaine</p>
                      <p className="text-sm font-black text-[#111]">{v.prixSemaine} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#6B7280] uppercase">2 Sem.</p>
                      <p className="text-sm font-black text-[#111]">{Math.round(v.prixSemaine * 1.8)} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#D4AF37] uppercase font-semibold">Mois</p>
                      <p className="text-sm font-black text-[#D4AF37]">{v.prixMois} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-[#D4AF37] uppercase font-semibold">3 Mois</p>
                      <p className="text-sm font-black text-[#D4AF37]">{Math.round(v.prixMois * 2.7)} €</p>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-end">
                    <ChevronRight size={14} className="text-red-500" />
                  </div>
                </div>
                <span className="mt-3 w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition flex items-center justify-center gap-2">
                  Voir les détails <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — RÉSERVATION 100% EN LIGNE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-8 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#D4AF37] px-4 py-3">
          <h2 className="text-base font-bold text-white">Réservation 100% en ligne</h2>
        </div>
        <div className="px-4 py-4 space-y-0">
          {[
            { n: "1", title: "Choisir véhicule", desc: "Parcourez les catégories et trouvez le véhicule idéal." },
            { n: "2", title: "Télécharger documents", desc: "Permis, pièce d'identité — tout en ligne, en 2 minutes." },
            { n: "3", title: "Valider réservation", desc: "Choisissez vos options et confirmez." },
            { n: "4", title: "Payer en ligne", desc: "CB, Apple Pay, Google Pay — paiement 100% sécurisé." },
            { n: "5", title: "Retirer véhicule", desc: "En agence ou livraison à domicile." },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-white">{s.n}</div>
                {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-[#D4AF37]/20 my-1" />}
              </div>
              <div className="pb-4">
                <h3 className="text-sm font-bold text-[#111]">{s.title}</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — DOCUMENTS DEMANDÉS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white mx-4 mt-4 rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
          <h2 className="text-base font-bold text-[#111]">Documents demandés</h2>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {["Permis de conduire", "Pièce d'identité", "Justificatif de domicile", "Carte bancaire"].map((doc) => (
              <span key={doc} className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F3EF] px-3 py-1.5 text-xs font-semibold text-[#111]">
                <FileCheck size={12} className="text-[#D4AF37]" /> {doc}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#6B7280]">Le justificatif de domicile peut être demandé selon les conditions de location. Tous les documents sont vérifiés en ligne.</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8 — SERVICES COMPLÉMENTAIRES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-4 mx-4 rounded-2xl border border-[#E5E7EB]">
        <h2 className="text-base font-bold text-[#111]">Services complémentaires</h2>
        <div className="mt-3 space-y-3">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Icon size={16} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111]">{s.label}</h3>
                  <p className="text-xs text-[#6B7280]">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 9 — DESTINATIONS POPULAIRES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-[#111]">Destinations populaires</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {DESTINATIONS.map((d) => {
            const Icon = d.icon;
            return (
              <button key={d.label} className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition active:scale-[0.97] ${d.color}`}>
                <Icon size={20} />
                <span className="text-[10px] font-bold text-center leading-tight">{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 10 — CARTE INTERACTIVE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-6 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="text-base font-bold text-[#111]">Carte des agences</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">Agences ouvertes, véhicules disponibles et distance.</p>
        </div>
        <div className="relative h-[180px] bg-[#E5E7EB]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPinned size={28} className="text-[#D4AF37] mx-auto" />
              <p className="mt-2 text-sm font-semibold text-[#6B7280]">Carte interactive</p>
              <p className="text-[10px] text-red-500">Agences · Véhicules · Distance</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3">
          <button className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
            <Navigation size={12} /> Voir les véhicules proches
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 11 — AVANTAGES PARTICULIERS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-6 rounded-2xl bg-[#111] p-5">
        <h2 className="text-base font-bold text-white text-center">Avantages Particuliers</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { icon: Rocket, label: "Réservation rapide" },
            { icon: Lock, label: "Paiement sécurisé" },
            { icon: FileCheck, label: "Contrat numérique" },
            { icon: Shield, label: "Véhicules vérifiés" },
            { icon: Headphones, label: "Assistance 24h/24" },
            { icon: XCircle, label: "Annulation simplifiée" },
            { icon: Clock, label: "Retrait rapide" },
            { icon: Eye, label: "Prix transparents" },
          ].map((a, i) => {
            const AIcon = a.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20">
                  <AIcon size={14} className="text-[#D4AF37]" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">{a.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 12 — FAQ PARTICULIERS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white mx-4 mt-6 rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
          <h2 className="text-base font-bold text-[#111]">FAQ Particuliers</h2>
        </div>
        <div className="px-4">
          {FAQ.map((f, i) => (
            <div key={i} className="border-b border-[#F3F4F6] last:border-0">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between py-3.5 text-left"
              >
                <span className="text-sm font-semibold text-[#111] pr-4">{f.q}</span>
                <ChevronDown size={16} className={`shrink-0 text-red-500 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <p className="pb-3 text-xs text-[#6B7280] leading-relaxed">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Besoin d'aide ── */}
      <div className="mx-4 mt-6 mb-6 rounded-2xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <Headphones size={20} className="text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111]">Besoin d'aide ?</h3>
          <p className="text-xs text-[#6B7280]">Chat en ligne ou 09 70 70 50 50</p>
          <p className="text-[10px] text-[#6B7280]">7j/7 de 8h à 20h</p>
        </div>
      </div>

    </div>
  );
}
