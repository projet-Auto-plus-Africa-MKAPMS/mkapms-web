import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Search, MapPin, Calendar, CarFront, Truck,
  Shield, Lock, Clock, Headphones, FileCheck, ChevronDown, Star,
  CheckCircle2, Globe, Rocket, CreditCard, Users, Package, Snowflake,
  Bus, ArrowRight, Building2, MapPinned, Navigation, Wrench, Replace,
  KeyRound, Gauge, Weight, Container, SquareStack, Filter,
  Heart, Phone, UserPlus, Receipt
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE LOCATION PRO / ENTREPRISE
   Réservée aux professionnels. Totalement séparée de VTC, Particulier, Vente.
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES_PRO = [
  {
    titre: "Utilitaires légers",
    modeles: ["Kangoo", "Berlingo", "Partner", "Caddy"],
    photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=240&fit=crop",
    icon: Truck,
    count: 12,
  },
  {
    titre: "Fourgons",
    modeles: ["Trafic", "Vivaro", "Transit", "Sprinter"],
    photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=240&fit=crop",
    icon: Package,
    count: 8,
  },
  {
    titre: "Camionnettes grand volume",
    modeles: ["Master", "Boxer", "Ducato"],
    photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=240&fit=crop",
    icon: Container,
    count: 6,
  },
  {
    titre: "Camions",
    modeles: ["7,5 tonnes", "12 tonnes", "19 tonnes"],
    photo: "https://images.unsplash.com/photo-1586191582066-1d5e1dcea015?w=400&h=240&fit=crop",
    icon: Truck,
    count: 5,
  },
  {
    titre: "Bennes",
    modeles: ["Benne simple", "Benne double cabine"],
    photo: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&h=240&fit=crop",
    icon: SquareStack,
    count: 4,
  },
  {
    titre: "Plateaux",
    modeles: ["Porte-voiture", "Dépannage"],
    photo: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&h=240&fit=crop",
    icon: CarFront,
    count: 3,
  },
  {
    titre: "Frigorifiques",
    modeles: ["Transport alimentaire", "Produits sensibles"],
    photo: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=240&fit=crop",
    icon: Snowflake,
    count: 4,
  },
  {
    titre: "Minibus",
    modeles: ["7 places", "9 places", "17 places"],
    photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=240&fit=crop",
    icon: Bus,
    count: 6,
  },
];

const VEHICULES_PRO = [
  { id: 1, titre: "Renault Kangoo Van", annee: 2024, km: 8000, volume: "3.3 m³", prixJour: 35, prixSemaine: 210, prixMois: 750, photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop", categorie: "Utilitaire léger" },
  { id: 2, titre: "Citroën Berlingo Van", annee: 2023, km: 15000, volume: "3.7 m³", prixJour: 38, prixSemaine: 228, prixMois: 800, photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=260&fit=crop", categorie: "Utilitaire léger" },
  { id: 3, titre: "Renault Trafic L2H1", annee: 2024, km: 5000, volume: "5.8 m³", prixJour: 55, prixSemaine: 330, prixMois: 1100, photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop", categorie: "Fourgon" },
  { id: 4, titre: "Ford Transit Custom", annee: 2023, km: 22000, volume: "6.0 m³", prixJour: 58, prixSemaine: 348, prixMois: 1150, photo: "https://images.unsplash.com/photo-1586191582066-1d5e1dcea015?w=400&h=260&fit=crop", categorie: "Fourgon" },
  { id: 5, titre: "Renault Master L3H2", annee: 2024, km: 3000, volume: "13 m³", prixJour: 75, prixSemaine: 450, prixMois: 1500, photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop", categorie: "Grand volume" },
  { id: 6, titre: "Mercedes Sprinter 314", annee: 2023, km: 18000, volume: "11 m³", prixJour: 85, prixSemaine: 510, prixMois: 1700, photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=260&fit=crop", categorie: "Fourgon" },
  { id: 7, titre: "Iveco Daily 35S16", annee: 2022, km: 30000, volume: "16 m³", prixJour: 95, prixSemaine: 570, prixMois: 1900, photo: "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&h=260&fit=crop", categorie: "Grand volume" },
  { id: 8, titre: "Mercedes Sprinter 9 pl.", annee: 2024, km: 8000, volume: "9 places", prixJour: 120, prixSemaine: 720, prixMois: 2400, photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop", categorie: "Minibus" },
];

const SERVICES = [
  { icon: Truck, label: "Livraison véhicule", desc: "Livré directement sur votre site" },
  { icon: MapPin, label: "Retrait sur site", desc: "Récupérez en agence ou point partenaire" },
  { icon: Replace, label: "Remplacement véhicule", desc: "Véhicule de remplacement sous 24h" },
  { icon: Headphones, label: "Assistance", desc: "Support dédié 7j/7, 24h/24" },
  { icon: Gauge, label: "Extension kilométrique", desc: "Ajustez votre forfait km à tout moment" },
  { icon: Users, label: "Conducteur supplémentaire", desc: "Ajoutez des conducteurs à votre contrat" },
  { icon: SquareStack, label: "Gestion de flotte", desc: "Dashboard, suivi, facturation centralisée" },
];

const FAQ_PRO = [
  { q: "Comment réserver ?", a: "Sélectionnez votre véhicule, choisissez vos dates, téléchargez vos documents professionnels, payez en ligne. Confirmation immédiate par email." },
  { q: "Quels documents fournir ?", a: "Pour société : KBIS, pièce d'identité, permis, assurance. Pour artisan/auto-entrepreneur : SIRET, permis, pièce d'identité." },
  { q: "Comment fonctionne la caution ?", a: "Empreinte bancaire prise à la réservation (non débitée). Libérée sous 7 jours ouvrés après restitution en bon état." },
  { q: "Peut-on louer plusieurs véhicules ?", a: "Oui, notre espace Grandes Flottes permet de louer 2, 5, 10, 20 véhicules ou plus avec un devis personnalisé." },
  { q: "Comment fonctionne la facturation ?", a: "Facturation professionnelle avec TVA récupérable. Factures mensuelles ou à la réservation selon votre contrat." },
  { q: "Comment récupérer le véhicule ?", a: "En agence avec pièce d'identité et code de réservation, ou livraison directe sur votre site (option payante)." },
];

const TYPE_PRO = ["Tous types", "Utilitaire léger", "Fourgon", "Grand volume", "Camion", "Benne", "Plateau", "Frigorifique", "Minibus"];

export default function LocationPro() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [typeVehicule, setTypeVehicule] = useState("Tous types");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filteredVehicules = selectedCat
    ? VEHICULES_PRO.filter((v) => v.categorie === selectedCat)
    : VEHICULES_PRO;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — BANNIÈRE PRINCIPALE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=420&fit=crop"
          alt="Location professionnelle"
          className="w-full h-[240px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 via-[#111]/40 to-transparent" />
        {/* Retour */}
        <Link to="/louer" className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur">
          <ChevronLeft size={20} className="text-[#111]" />
        </Link>
        {/* Contenu */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-800 px-2.5 py-1 text-[10px] font-bold text-white mb-2">
            <Building2 size={10} /> PRO / ENTREPRISE
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">LOCATION PROFESSIONNELLE</h1>
          <p className="mt-1 text-sm text-white/80">Des véhicules adaptés à votre activité, disponibles immédiatement.</p>
          <button
            onClick={() => document.getElementById("search-pro")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-3 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white active:scale-[0.98] transition"
          >
            Trouver mon véhicule
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — RECHERCHE RAPIDE
          ═══════════════════════════════════════════════════════════════════ */}
      <div id="search-pro" className="mx-4 -mt-3 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Où ?</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <MapPin size={14} className="text-blue-800 shrink-0" />
              <input type="text" placeholder="Ville, zone industrielle, gare…" value={lieu} onChange={(e) => setLieu(e.target.value)} className="w-full bg-transparent text-sm text-[#111] placeholder:text-[#9CA3AF] outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date de départ</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-blue-800 shrink-0" />
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date de retour</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
                <Calendar size={14} className="text-blue-800 shrink-0" />
                <input type="date" value={dateRetour} onChange={(e) => setDateRetour(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Type de véhicule</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <Truck size={14} className="text-blue-800 shrink-0" />
              <select value={typeVehicule} onChange={(e) => setTypeVehicule(e.target.value)} className="w-full bg-transparent text-sm text-[#111] outline-none">
                {TYPE_PRO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button className="w-full rounded-xl bg-blue-800 py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md">
            <Search size={16} /> Rechercher
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — CATÉGORIES PROFESSIONNELLES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-[#111]">Catégories professionnelles</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES_PRO.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCat === c.titre;
            return (
              <button
                key={c.titre}
                onClick={() => setSelectedCat(isSelected ? null : c.titre)}
                className={`shrink-0 w-[140px] rounded-xl bg-white border-2 overflow-hidden text-left transition active:scale-[0.98] ${isSelected ? "border-blue-800 shadow-md ring-2 ring-blue-800/30" : "border-[#E5E7EB]"}`}
              >
                <div className="relative h-[80px] overflow-hidden">
                  <img src={c.photo} alt={c.titre} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white">{c.count} dispo</span>
                </div>
                <div className="px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <Icon size={12} className="text-blue-800" />
                    <span className="text-xs font-bold text-[#111] truncate">{c.titre}</span>
                  </div>
                  <p className="text-[9px] text-[#6B7280] mt-0.5 truncate">{c.modeles.join(" · ")}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — FILTRES PROFESSIONNELS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-blue-800" />
            <span className="text-sm font-bold text-[#111]">Filtres professionnels</span>
          </div>
          <ChevronDown size={16} className={`text-[#6B7280] transition ${showFilters ? "rotate-180" : ""}`} />
        </button>
        {showFilters && (
          <div className="mt-2 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
            {[
              "Carburant", "Boîte manuelle", "Boîte automatique", "Volume utile",
              "Charge utile", "PTAC", "Hayon", "Attelage", "Frigorifique", "Disponible immédiatement",
            ].map((f) => (
              <label key={f} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-blue-800 text-blue-800 accent-blue-800" />
                <span className="text-sm text-[#111]">{f}</span>
              </label>
            ))}
            <button className="w-full rounded-lg bg-blue-800 py-2.5 text-sm font-bold text-white mt-2">
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
        <div className="mt-3 space-y-3">
          {filteredVehicules.map((v) => (
            <Link key={v.id} to={`/louer/pro/vehicule/${v.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.99] transition">
              <div className="relative h-[160px]">
                <img src={v.photo} alt={v.titre} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-blue-800/90 px-2.5 py-0.5 text-[9px] font-bold text-white">{v.categorie}</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111]">{v.titre}</h3>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#6B7280]">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {v.annee}</span>
                  <span className="flex items-center gap-1"><Gauge size={10} /> {v.km.toLocaleString("fr-FR")} km</span>
                  <span className="flex items-center gap-1"><Package size={10} /> {v.volume}</span>
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
                    <div className="shrink-0 rounded-lg bg-blue-800/5 border border-blue-800/20 p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-blue-800 uppercase font-semibold">Mois</p>
                      <p className="text-sm font-black text-blue-800">{v.prixMois} €</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-blue-800/10 border border-blue-800/30 p-2 text-center min-w-[70px]">
                      <p className="text-[9px] text-blue-800 uppercase font-semibold">3 Mois</p>
                      <p className="text-sm font-black text-blue-800">{Math.round(v.prixMois * 2.7)} €</p>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-end">
                    <ChevronRight size={14} className="text-[#9CA3AF]" />
                  </div>
                </div>
                <span className="mt-3 w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98] transition flex items-center justify-center gap-2">
                  Voir les détails <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — RÉSERVATION 100% DIGITALE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-8 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-blue-800 px-4 py-3">
          <h2 className="text-base font-bold text-white">Réservation 100% digitale</h2>
        </div>
        <div className="px-4 py-4 space-y-0">
          {[
            { n: "1", title: "Choisir véhicule", desc: "Parcourez les catégories et sélectionnez votre véhicule pro." },
            { n: "2", title: "Télécharger documents", desc: "KBIS, SIRET, permis, pièce d'identité — tout en ligne." },
            { n: "3", title: "Validation automatique", desc: "Vos documents sont vérifiés automatiquement." },
            { n: "4", title: "Paiement sécurisé", desc: "CB, virement, Apple Pay, Google Pay." },
            { n: "5", title: "Retrait véhicule", desc: "En agence ou livraison sur votre site." },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white">{s.n}</div>
                {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-blue-800/20 my-1" />}
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
          SECTION 7 — DOCUMENTS ENTREPRISE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white mx-4 mt-4 rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
          <h2 className="text-base font-bold text-[#111]">Documents requis</h2>
        </div>
        <div className="px-4 py-4 space-y-4">
          {[
            { titre: "Pour société (SARL, SAS, SA…)", docs: ["KBIS", "Pièce d'identité", "Permis", "Assurance"], color: "bg-blue-800" },
            { titre: "Pour artisan", docs: ["SIRET", "Permis", "Pièce d'identité"], color: "bg-[#D4AF37]" },
            { titre: "Pour auto-entrepreneur", docs: ["SIRET", "Permis", "Pièce d'identité"], color: "bg-green-700" },
          ].map((d, i) => (
            <div key={i}>
              <h3 className="text-sm font-bold text-[#111] flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${d.color}`} />
                {d.titre}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {d.docs.map((doc) => (
                  <span key={doc} className="inline-flex items-center gap-1 rounded-full bg-[#F5F3EF] px-2.5 py-1 text-[11px] font-semibold text-[#111]">
                    <FileCheck size={10} className="text-blue-800" /> {doc}
                  </span>
                ))}
              </div>
            </div>
          ))}
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-800/10">
                  <Icon size={16} className="text-blue-800" />
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
          SECTION 9 — CARTE DES AGENCES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="text-base font-bold text-[#111]">Carte des agences</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">Agences partenaires, points de retrait et véhicules disponibles.</p>
        </div>
        <div className="relative h-[180px] bg-[#E5E7EB]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPinned size={28} className="text-blue-800 mx-auto" />
              <p className="mt-2 text-sm font-semibold text-[#6B7280]">Carte interactive</p>
              <p className="text-[10px] text-[#9CA3AF]">Agences · Points de retrait · Véhicules</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3">
          <button className="w-full rounded-xl bg-blue-800 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
            <Navigation size={12} /> Voir les véhicules proches
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 10 — ESPACE GRANDES FLOTTES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-6 rounded-2xl border-2 border-blue-800 bg-blue-800/5 overflow-hidden">
        <div className="p-5 text-center">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-blue-800/10">
            <SquareStack size={24} className="text-blue-800" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-[#111]">Besoin de plusieurs véhicules ?</h2>
          <p className="mt-2 text-sm text-[#6B7280]">Location de flotte pour entreprises.</p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {["2", "5", "10", "20+"].map((n) => (
              <div key={n} className="rounded-lg bg-white border border-blue-800/20 py-2 text-center">
                <span className="text-lg font-black text-blue-800">{n}</span>
                <p className="text-[9px] text-[#6B7280]">véhicule{n !== "2" ? "s" : "s"}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 rounded-xl bg-blue-800 px-6 py-3 text-sm font-bold text-white active:scale-[0.98] transition shadow-md">
            Demander un devis flotte
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 11 — AVANTAGES PRO
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-6 rounded-2xl bg-[#111] p-5">
        <h2 className="text-base font-bold text-white text-center">Avantages Pro</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { icon: Rocket, label: "Réservation rapide" },
            { icon: FileCheck, label: "Contrat numérique" },
            { icon: Lock, label: "Paiement sécurisé" },
            { icon: SquareStack, label: "Gestion de flotte" },
            { icon: Headphones, label: "Assistance dédiée" },
            { icon: Shield, label: "Véhicules vérifiés" },
            { icon: Receipt, label: "Facturation professionnelle" },
            { icon: Clock, label: "Disponible 24h/24" },
          ].map((a, i) => {
            const AIcon = a.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-800/30">
                  <AIcon size={14} className="text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">{a.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 12 — FAQ PRO
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white mx-4 mt-6 rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
          <h2 className="text-base font-bold text-[#111]">FAQ Professionnels</h2>
        </div>
        <div className="px-4">
          {FAQ_PRO.map((f, i) => (
            <div key={i} className="border-b border-[#F3F4F6] last:border-0">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between py-3.5 text-left"
              >
                <span className="text-sm font-semibold text-[#111] pr-4">{f.q}</span>
                <ChevronDown size={16} className={`shrink-0 text-[#6B7280] transition ${openFaq === i ? "rotate-180" : ""}`} />
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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-800/10">
          <Headphones size={20} className="text-blue-800" />
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
