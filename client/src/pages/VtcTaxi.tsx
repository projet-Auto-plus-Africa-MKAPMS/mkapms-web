import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Search, MapPin, Calendar, CarFront,
  Shield, Lock, Clock, Headphones, FileCheck, ChevronDown, Star,
  CheckCircle2, Globe, Rocket, CreditCard, Users, Heart,
  ArrowRight, MapPinned, Navigation, Gauge, Filter,
  Briefcase, Ban, Eye, Award, Settings2, Fuel,
  Navigation2, XCircle, Car, Zap
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE LISTING VTC & TAXI
   Affiche tous les véhicules VTC & Taxi disponibles.
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  {
    titre: "Berlines VTC",
    modeles: ["Classe E", "Série 5", "A6", "Superb"],
    desc: "Confort premium pour vos clients.",
    photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=240&fit=crop",
    count: 14,
  },
  {
    titre: "Berlines Taxi",
    modeles: ["Camry", "Prius", "508", "Passat"],
    desc: "Fiables et économiques.",
    photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=240&fit=crop",
    count: 10,
  },
  {
    titre: "SUV & Vans VTC",
    modeles: ["Classe V", "GLC", "X5", "Q7"],
    desc: "Transport groupe et premium.",
    photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=240&fit=crop",
    count: 8,
  },
  {
    titre: "Électriques VTC",
    modeles: ["Model 3", "Model Y", "EQE", "ID.4"],
    desc: "Zéro émission, confort maximal.",
    photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=240&fit=crop",
    count: 6,
  },
  {
    titre: "Hybrides",
    modeles: ["Camry Hybrid", "530e", "A4 TFSI e"],
    desc: "Économie et écologie.",
    photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=240&fit=crop",
    count: 9,
  },
];

const VEHICULES = [
  { id: 9201, titre: "Mercedes Classe E Break", annee: 2024, boite: "Automatique", carburant: "Diesel", places: 5, prixJour: 63, prixSemaine: 380, prixMois: 1350, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", categorie: "Berline VTC", badge: "VTC agréé" },
  { id: 9202, titre: "Tesla Model 3 Long Range", annee: 2024, boite: "Automatique", carburant: "Électrique", places: 5, prixJour: 75, prixSemaine: 450, prixMois: 1500, photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop", categorie: "Électrique VTC", badge: "Électrique" },
  { id: 9203, titre: "Toyota Camry Hybride", annee: 2023, boite: "Automatique", carburant: "Hybride", places: 5, prixJour: 52, prixSemaine: 312, prixMois: 1100, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop", categorie: "Berline Taxi", badge: "Taxi" },
  { id: 9204, titre: "BMW Série 5 530e", annee: 2024, boite: "Automatique", carburant: "Hybride", places: 5, prixJour: 78, prixSemaine: 468, prixMois: 1600, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", categorie: "Berline VTC", badge: "VTC Premium" },
  { id: 9205, titre: "Peugeot 508 GT", annee: 2024, boite: "Automatique", carburant: "Diesel", places: 5, prixJour: 48, prixSemaine: 288, prixMois: 980, photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop", categorie: "Berline Taxi", badge: "Taxi" },
  { id: 9206, titre: "Mercedes Classe V 250d", annee: 2024, boite: "Automatique", carburant: "Diesel", places: 7, prixJour: 95, prixSemaine: 570, prixMois: 1900, photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=260&fit=crop", categorie: "SUV & Van VTC", badge: "VTC Premium" },
  { id: 9207, titre: "Volkswagen ID.4 Pro", annee: 2024, boite: "Automatique", carburant: "Électrique", places: 5, prixJour: 65, prixSemaine: 390, prixMois: 1300, photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=260&fit=crop", categorie: "Électrique VTC", badge: "Électrique" },
  { id: 9208, titre: "Skoda Superb Combi", annee: 2023, boite: "Automatique", carburant: "Diesel", places: 5, prixJour: 50, prixSemaine: 300, prixMois: 1050, photo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=260&fit=crop", categorie: "Berline VTC", badge: "VTC agréé" },
  { id: 9209, titre: "Audi A6 50 TFSI e", annee: 2024, boite: "Automatique", carburant: "Hybride", places: 5, prixJour: 82, prixSemaine: 492, prixMois: 1650, photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=260&fit=crop", categorie: "Hybride", badge: "VTC Premium" },
  { id: 9210, titre: "Toyota Prius+", annee: 2024, boite: "Automatique", carburant: "Hybride", places: 5, prixJour: 45, prixSemaine: 270, prixMois: 920, photo: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=260&fit=crop", categorie: "Hybride", badge: "Taxi" },
];

const SERVICES = [
  { icon: Shield, label: "Assurance incluse", desc: "Tous risques, franchise réduite" },
  { icon: Settings2, label: "Entretien inclus", desc: "Véhicule toujours en parfait état" },
  { icon: MapPin, label: "Livraison possible", desc: "À l'adresse de votre choix" },
  { icon: Headphones, label: "Assistance 7j/7", desc: "Support dédié chauffeurs" },
  { icon: Rocket, label: "Réservation instantanée", desc: "Pas d'attente, pas de délai" },
  { icon: Ban, label: "Aucun appel obligatoire", desc: "Tout se fait en ligne" },
  { icon: Lock, label: "Paiement sécurisé", desc: "CB, Apple Pay, Google Pay" },
  { icon: FileCheck, label: "Documents en ligne", desc: "Carte VTC, licence — tout dématérialisé" },
];

const FAQ = [
  { q: "Quels documents pour louer en VTC ?", a: "Carte VTC en cours de validité, pièce d'identité, permis de conduire (minimum 3 ans), attestation d'assurance RC Pro, justificatif de domicile." },
  { q: "Quels documents pour louer en Taxi ?", a: "Licence taxi valide, pièce d'identité, permis de conduire, justificatif de domicile de moins de 3 mois." },
  { q: "Comment fonctionne la caution ?", a: "Empreinte bancaire de 500 € prise à la réservation (non débitée). Libérée sous 7 jours ouvrés après restitution du véhicule en bon état." },
  { q: "Peut-on annuler ?", a: "Annulation gratuite jusqu'à 48h avant. Entre 48h et 24h : 50%. Moins de 24h : montant total." },
  { q: "Comment récupérer le véhicule ?", a: "En agence avec votre pièce d'identité et code de réservation. Ou livraison à domicile disponible." },
  { q: "L'entretien est-il inclus ?", a: "Oui, tous les véhicules VTC/Taxi sont entretenus par nos soins. Vidange, freins, pneus — tout est inclus dans votre forfait." },
];

const TYPE_FILTER = ["Tous", "VTC", "Taxi", "Électrique", "Hybride", "Premium"];

export default function VtcTaxi() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lieu, setLieu] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [filtre, setFiltre] = useState("Tous");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filteredVehicules = VEHICULES.filter((v) => {
    if (filtre !== "Tous") {
      const badge = v.badge.toLowerCase();
      const f = filtre.toLowerCase();
      if (f === "vtc" && !badge.includes("vtc")) return false;
      if (f === "taxi" && !badge.includes("taxi")) return false;
      if (f === "électrique" && v.carburant !== "Électrique") return false;
      if (f === "hybride" && v.carburant !== "Hybride") return false;
      if (f === "premium" && !badge.includes("premium")) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 max-w-6xl mx-auto">

      {/* BANNIÈRE */}
      <div className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&h=420&fit=crop"
          alt="Location VTC Taxi"
          className="w-full h-[240px] md:h-[320px] lg:h-[400px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111]/90 via-[#111]/40 to-transparent" />
        <Link to="/louer" className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur">
          <ChevronLeft size={20} className="text-[#111]" />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#111] border border-[#D4AF37] px-2.5 py-1 text-[10px] font-bold text-[#D4AF37] mb-2">
            <Shield size={10} /> VTC & TAXI
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">LOCATION VTC & TAXI</h1>
          <p className="mt-1 text-sm text-white/80">Véhicules adaptés pour chauffeurs VTC et Taxi.</p>
          <button
            onClick={() => document.getElementById("search-vtc")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-3 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2"
          >
            <Search size={14} /> Trouver un véhicule
          </button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div id="search-vtc" className="mx-4 -mt-4 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Lieu de retrait</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <MapPin size={14} className="text-red-500 shrink-0" />
              <input type="text" placeholder="Ville, gare, aéroport…" value={lieu} onChange={(e) => setLieu(e.target.value)} className="w-full bg-transparent text-sm text-[#111] placeholder:text-red-500 outline-none" />
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
            <Search size={16} /> Rechercher un véhicule VTC / Taxi
          </button>
        </div>
      </div>

      {/* CATÉGORIES */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-[#111]">Catégories VTC & Taxi</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">Trouvez le véhicule adapté à votre activité.</p>
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
            <Link key={v.id} to={`/louer/vtc-taxi/vehicule/${v.id}`} className="block rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.99] transition hover:shadow-lg">
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

      {/* SERVICES */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-bold text-[#111]">Pourquoi choisir MKA.P-MS ?</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <Icon size={18} className="text-[#D4AF37]" />
                <p className="text-xs font-bold text-[#111] mt-1.5">{s.label}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* COMMENT ÇA MARCHE */}
      <div className="mx-4 mt-8 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#111] px-4 py-3">
          <h2 className="text-base font-bold text-[#D4AF37]">Comment louer un véhicule VTC / Taxi ?</h2>
        </div>
        <div className="px-4 py-4 space-y-0">
          {[
            { n: "1", title: "Choisir un véhicule", desc: "Parcourez les offres et sélectionnez le véhicule adapté à votre activité." },
            { n: "2", title: "Télécharger documents", desc: "Carte VTC / licence taxi, permis, pièce d'identité — tout en ligne." },
            { n: "3", title: "Valider et payer", desc: "Paiement 100% sécurisé : CB, Apple Pay, Google Pay." },
            { n: "4", title: "Récupérer le véhicule", desc: "En agence ou livraison à domicile." },
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

      {/* DOCUMENTS */}
      <div className="bg-white mx-4 mt-4 rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
          <h2 className="text-base font-bold text-[#111]">Documents demandés</h2>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {["Carte VTC / Licence Taxi", "Permis de conduire", "Pièce d'identité", "Justificatif de domicile", "RC Pro (VTC)", "Carte bancaire"].map((doc) => (
              <span key={doc} className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F3EF] px-3 py-1.5 text-xs font-semibold text-[#111]">
                <FileCheck size={12} className="text-[#D4AF37]" /> {doc}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 mt-6 mb-6">
        <h2 className="text-lg font-bold text-[#111] mb-3">Questions fréquentes</h2>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                <span className="text-sm font-semibold text-[#111]">{f.q}</span>
                <ChevronDown size={16} className={`text-red-500 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-[#6B7280] leading-relaxed">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA DEVENIR PARTENAIRE */}
      <div className="mx-4 rounded-2xl bg-[#111] p-5 text-center">
        <Award size={28} className="text-[#D4AF37] mx-auto" />
        <h2 className="text-lg font-black text-white mt-2">Vous êtes chauffeur VTC ou Taxi ?</h2>
        <p className="text-xs text-white/70 mt-1">Rejoignez MKA.P-MS et accédez aux meilleurs véhicules avec entretien inclus.</p>
        <Link to="/inscription-pro" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white">
          Devenir partenaire <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}
