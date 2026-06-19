import { useState, useRef, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Heart, Star, Check, Fuel, Settings2,
  Zap, Users, DoorOpen, Gauge, Calendar, Shield, Clock, Lock,
  ChevronDown, MapPin, Play, Headphones, FileCheck, Rocket, Ban,
  Globe, Navigation, Euro, TrendingUp, Briefcase, Calculator,
  Pen, CreditCard, Car, Package
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE PRODUIT — LOCATION VTC & TAXI
   Orientée TRAVAIL. Le chauffeur doit voir immédiatement :
   mensualité, kilométrage, conditions, revenus estimés, dossier.
   ══════════════════════════════════════════════════════════════════════════ */

const VEHICLE = {
  id: 9201,
  titre: "Mercedes Classe E Break",
  sousTitre: "VTC | 2024 | Diesel | Automatique",
  prixJour: 63,
  prixSemaine: 380,
  prixMois: 1350,
  kmInclus: 150,
  kmSup: 0.25,
  note: 4.8,
  nbAvis: 128,
  annee: 2024,
  km: 32000,
  carburant: "Diesel",
  transmission: "Automatique",
  puissance: "194 ch",
  places: 5,
  portes: 5,
  consommation: "5.2 L/100km",
  critair: 2,
  badges: ["VTC agréé", "Entretien inclus", "Confort Premium"],
};

const GALLERY = [
  "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800&h=500&fit=crop",
];

const EQUIPEMENTS = [
  "Sièges en cuir", "GPS Grand écran", "Caméra de recul", "Climatisation automatique",
  "Régulateur de vitesse", "Bluetooth / USB", "Apple CarPlay / Android Auto",
  "Aide au stationnement", "Grand coffre", "Vitres surteintées",
];

const DOCS_VTC = ["Carte VTC", "Permis de conduire", "Pièce d'identité", "Assurance RC Pro", "Attestation URSSAF"];
const DOCS_TAXI = ["Licence Taxi", "Permis de conduire", "Pièce d'identité", "Carte professionnelle", "Attestation URSSAF"];

const CONDITIONS_VTC = [
  "Carte VTC en cours de validité",
  "Permis B minimum 3 ans",
  "Casier judiciaire vierge",
  "Assurance RC Professionnelle",
  "Véhicule restitué propre intérieur/extérieur",
];
const CONDITIONS_TAXI = [
  "Licence Taxi active",
  "Carte professionnelle valide",
  "Permis B minimum 3 ans",
  "Assurance RC Professionnelle",
  "Équipements Taxi obligatoires fournis",
];

const REVENUS = [
  { label: "CA moyen / semaine", value: "1 200 — 1 800 €" },
  { label: "CA moyen / mois", value: "4 800 — 7 200 €" },
  { label: "Coût location / mois", value: `${VEHICLE.prixMois} €` },
  { label: "Marge nette estimée / mois", value: "3 000 — 5 500 €" },
];

const SERVICES_SUP = [
  { icon: Package, label: "Gestion de flotte", desc: "Dashboard et suivi multi-véhicules" },
  { icon: Calculator, label: "Comptabilité", desc: "Factures automatiques, export comptable" },
  { icon: Shield, label: "Assurance pro", desc: "RC Pro incluse, franchise réduite" },
  { icon: Headphones, label: "Assistance chauffeur", desc: "Support dédié 24h/24, 7j/7" },
];

const AVIS = [
  { nom: "Alexandre D.", metier: "Chauffeur VTC", note: 5, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", commentaire: "Véhicule impeccable, réservation en 2 minutes. Je recommande à 100% pour les chauffeurs VTC." },
  { nom: "Sophie M.", metier: "Chauffeur Taxi", note: 5, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", commentaire: "Service au top ! La Mercedes était comme neuve. Processus rapide et sans stress." },
  { nom: "Karim B.", metier: "Chauffeur VTC", note: 4, photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", commentaire: "Très bon rapport qualité-prix. L'assistance 24/7 est un vrai plus." },
  { nom: "Marie L.", metier: "Chauffeur VTC Premium", note: 5, photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face", commentaire: "La Classe E est parfaite pour le VTC premium. Mes clients adorent." },
];

const FAQ_VTC = [
  { q: "Comment déposer mon dossier VTC ?", a: "Téléchargez vos documents (Carte VTC, permis, ID, assurance RC Pro) directement sur la plateforme. Validation sous 24h." },
  { q: "Quel kilométrage est inclus ?", a: "150 km/jour inclus en formule standard, 200 km ou illimité en option. Le km supplémentaire est facturé 0.25 €." },
  { q: "Comment fonctionne la caution ?", a: "Empreinte bancaire de 1 000 € (non débitée). Libérée sous 7 jours après restitution en bon état." },
  { q: "Puis-je changer de véhicule en cours de contrat ?", a: "Oui, sous réserve de disponibilité. Contactez votre conseiller dédié pour organiser l'échange." },
  { q: "L'assurance est-elle incluse ?", a: "Oui, assurance tous risques incluse avec franchise. Option franchise réduite ou supprimée disponible." },
  { q: "Quels sont les délais de mise à disposition ?", a: "48h après validation du dossier complet et paiement de l'acompte." },
];

const SIMILAIRES = [
  { titre: "BMW Série 5 530e", prix: 140, type: "VTC", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop" },
  { titre: "Tesla Model 3 LR", prix: 135, type: "VTC", photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop" },
  { titre: "Toyota Camry Hybride", prix: 95, type: "Taxi", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop" },
  { titre: "Peugeot 508 GT", prix: 110, type: "VTC", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop" },
  { titre: "Skoda Superb Combi", prix: 85, type: "Taxi", photo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=260&fit=crop" },
];

const KM_OPTIONS = [
  { km: 150, extra: 0, label: "150 km/j" },
  { km: 200, extra: 10, label: "200 km/j" },
  { km: 9999, extra: 20, label: "Illimité" },
];

export default function ProduitVtcTaxi() {
  const nav = useNavigate();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [fav, setFav] = useState(false);
  const [showAllChars, setShowAllChars] = useState(false);
  const [showAllEquip, setShowAllEquip] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [docType, setDocType] = useState<"vtc" | "taxi">("vtc");

  const [step, setStep] = useState(1);
  const today = new Date();
  const nextMonth = new Date(today); nextMonth.setMonth(today.getMonth() + 1);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const [dateDebut, setDateDebut] = useState(formatDate(today));
  const [dateFin, setDateFin] = useState(formatDate(nextMonth));
  const [kmChoice, setKmChoice] = useState(0);

  const nbJours = useMemo(() => {
    const diff = Math.ceil((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [dateDebut, dateFin]);

  const mensualite = VEHICLE.prixMois + KM_OPTIONS[kmChoice].extra * 30;
  const acompte = 500;

  const prevPhoto = useCallback(() => setPhotoIdx((i) => (i === 0 ? GALLERY.length - 1 : i - 1)), []);
  const nextPhoto = useCallback(() => setPhotoIdx((i) => (i === GALLERY.length - 1 ? 0 : i + 1)), []);
  const resvRef = useRef<HTMLDivElement>(null);
  const scrollToResv = () => resvRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">

      {/* ═══════════════════════════════════ BLOC 1 — PHOTOS ═══════════════════════════════════ */}
      <div className="relative">
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur px-4 py-3 border-b border-[#E5E7EB]">
          <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280]">
            <ChevronLeft size={18} /> Retour VTC & Taxi
          </button>
          <button onClick={() => setFav(!fav)} className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F3F4F6]">
            <Heart size={18} className={fav ? "fill-red-500 text-red-500" : "text-[#111]"} />
          </button>
        </div>
        <div className="relative">
          <img src={GALLERY[photoIdx]} alt={VEHICLE.titre} className="w-full h-[280px] object-cover" />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#111]/90 px-3 py-1.5 text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/60 backdrop-blur">
            <Shield size={12} /> VTC & TAXI
          </span>
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">{photoIdx + 1} / {GALLERY.length}</div>
          <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/70 backdrop-blur"><ChevronLeft size={18} /></button>
          <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/70 backdrop-blur"><ChevronRight size={18} /></button>
        </div>
        <div className="bg-white px-4 pt-2 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {GALLERY.slice(0, 8).map((img, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)} className={`w-14 h-10 shrink-0 rounded-md overflow-hidden border-2 transition ${photoIdx === i ? "border-[#D4AF37]" : "border-transparent opacity-70"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════ BLOC 2 — PRIX ═══════════════════════════════════ */}
      <div className="bg-white px-4 py-4 border-t border-[#F3F4F6]">
        <h1 className="text-xl font-extrabold text-[#111]">{VEHICLE.titre}</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">{VEHICLE.sousTitre}</p>
        <div className="mt-2 flex items-center gap-2">
          <Star size={14} className="text-[#D4AF37]" fill="#D4AF37" />
          <span className="text-sm font-bold text-[#111]">{VEHICLE.note}</span>
          <span className="text-xs text-[#6B7280]">({VEHICLE.nbAvis} avis)</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {VEHICLE.badges.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 rounded-full bg-[#F5F3EF] px-2.5 py-1 text-[11px] font-semibold text-[#111]">
              <Check size={12} className="text-[#D4AF37]" /> {b}
            </span>
          ))}
        </div>
        {/* Prix — Mensualité mise en avant */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#F5F3EF] p-2.5 text-center">
            <p className="text-[9px] text-[#6B7280] uppercase">Jour</p>
            <p className="text-base font-black text-[#111]">{VEHICLE.prixJour} €</p>
          </div>
          <div className="rounded-lg bg-[#F5F3EF] p-2.5 text-center">
            <p className="text-[9px] text-[#6B7280] uppercase">Semaine</p>
            <p className="text-base font-black text-[#111]">{VEHICLE.prixSemaine} €</p>
          </div>
          <div className="rounded-lg bg-[#111] p-2.5 text-center border-2 border-[#D4AF37]">
            <p className="text-[9px] text-[#D4AF37] uppercase font-bold">Mensualité</p>
            <p className="text-base font-black text-white">{VEHICLE.prixMois} €</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="font-semibold text-[#D4AF37]">{VEHICLE.kmInclus} km/jour inclus</span>
          <span className="text-[#6B7280]">{VEHICLE.kmSup} €/km supp.</span>
        </div>
      </div>

      {/* ═══════════════════════════════════ BLOC 3 — RÉSERVATION ═══════════════════════════════════ */}
      <div className="px-4 mt-3">
        <button onClick={scrollToResv} className="w-full rounded-xl bg-[#D4AF37] py-4 text-center text-base font-extrabold text-white shadow-lg active:scale-[0.98] transition">
          RÉSERVER CE VÉHICULE
        </button>
      </div>

      {/* ═══════════════════════════════════ REVENUS ESTIMÉS ═══════════════════════════════════ */}
      <div className="mx-4 mt-4 rounded-2xl bg-[#111] p-4">
        <h2 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2"><TrendingUp size={14} /> Revenus estimés chauffeur</h2>
        <div className="mt-3 space-y-2">
          {REVENUS.map((r, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-xs text-white/70">{r.label}</span>
              <span className="text-sm font-bold text-white">{r.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-white/40 text-center">Estimations basées sur les moyennes du marché VTC/Taxi en France.</p>
      </div>

      {/* ═══════════════════════════════════ BLOC 4 — CARACTÉRISTIQUES ═══════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-3">
        <h2 className="text-lg font-bold text-[#111]">Caractéristiques</h2>
        <div className="mt-3">
          {[
            { icon: Fuel, label: "Carburant", value: VEHICLE.carburant },
            { icon: Settings2, label: "Transmission", value: VEHICLE.transmission },
            { icon: Zap, label: "Puissance", value: VEHICLE.puissance },
            { icon: Users, label: "Places", value: String(VEHICLE.places) },
            { icon: DoorOpen, label: "Portes", value: String(VEHICLE.portes) },
            ...(showAllChars ? [
              { icon: Gauge, label: "Consommation", value: VEHICLE.consommation },
              { icon: Shield, label: "Crit'Air", value: String(VEHICLE.critair) },
              { icon: Calendar, label: "Année", value: String(VEHICLE.annee) },
              { icon: Navigation, label: "Kilométrage", value: `${VEHICLE.km.toLocaleString("fr-FR")} km` },
            ] : []),
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
                <div className="flex items-center gap-3"><Icon size={16} className="text-[#6B7280]" /><span className="text-sm text-[#6B7280]">{c.label}</span></div>
                <span className="text-sm font-semibold text-[#111]">{c.value}</span>
              </div>
            );
          })}
        </div>
        <button onClick={() => setShowAllChars(!showAllChars)} className="mt-3 w-full rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#6B7280]">
          {showAllChars ? "Masquer" : "Voir plus de détails"}
        </button>
      </div>

      {/* ═══════════════════════════════════ BLOC 5 — ÉQUIPEMENTS ═══════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Équipements</h2>
        <div className="mt-3 space-y-2.5">
          {(showAllEquip ? EQUIPEMENTS : EQUIPEMENTS.slice(0, 6)).map((e, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37]/10">
                <Check size={12} className="text-[#D4AF37]" />
              </div>
              <span className="text-sm text-[#111]">{e}</span>
            </div>
          ))}
        </div>
        {EQUIPEMENTS.length > 6 && (
          <button onClick={() => setShowAllEquip(!showAllEquip)} className="mt-3 w-full rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#6B7280]">
            {showAllEquip ? "Masquer" : "Voir tous les équipements"}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════ BLOC 6 — CONDITIONS VTC / TAXI ═══════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Conditions de location</h2>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setDocType("vtc")} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${docType === "vtc" ? "bg-[#111] text-[#D4AF37]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>Conditions VTC</button>
          <button onClick={() => setDocType("taxi")} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${docType === "taxi" ? "bg-[#111] text-[#D4AF37]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>Conditions Taxi</button>
        </div>
        <div className="mt-3 space-y-2">
          {(docType === "vtc" ? CONDITIONS_VTC : CONDITIONS_TAXI).map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check size={14} className="text-[#D4AF37] mt-0.5 shrink-0" />
              <span className="text-sm text-[#111]">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════ BLOC 7 — DOCUMENTS ═══════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Documents obligatoires</h2>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setDocType("vtc")} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${docType === "vtc" ? "bg-[#111] text-[#D4AF37]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>Documents VTC</button>
          <button onClick={() => setDocType("taxi")} className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${docType === "taxi" ? "bg-[#111] text-[#D4AF37]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>Documents Taxi</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(docType === "vtc" ? DOCS_VTC : DOCS_TAXI).map((doc) => (
            <span key={doc} className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F3EF] px-3 py-1.5 text-xs font-semibold text-[#111]">
              <FileCheck size={12} className="text-[#D4AF37]" /> {doc}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════ MODULE RÉSERVATION ═══════════════════════════════════ */}
      <div ref={resvRef} className="mx-4 mt-4 rounded-2xl bg-white border-2 border-[#D4AF37]/30 overflow-hidden shadow-sm">
        <div className="bg-[#111] px-4 py-3">
          <h2 className="text-base font-bold text-white">Réservation & Dépôt de dossier</h2>
        </div>
        <div className="flex border-b border-[#F3F4F6]">
          {[{ n: 1, l: "Dates" }, { n: 2, l: "Dossier" }, { n: 3, l: "Contrat" }, { n: 4, l: "Acompte" }].map((s) => (
            <button key={s.n} onClick={() => setStep(s.n)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${step >= s.n ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>{s.n}</div>
              <span className={`text-[10px] font-semibold ${step >= s.n ? "text-[#111]" : "text-[#9CA3AF]"}`}>{s.l}</span>
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="px-4 py-4 space-y-4">
            <h3 className="text-sm font-bold text-[#111]">Période de location</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#6B7280]">Date de début</label>
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111]" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280]">Date de fin</label>
                <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111]" />
              </div>
            </div>
            <div className="rounded-lg bg-[#F5F3EF] px-3 py-2">
              <span className="text-xs text-[#6B7280]">Durée</span>
              <p className="text-sm font-bold text-[#111]">{nbJours} jour{nbJours > 1 ? "s" : ""} ({Math.round(nbJours / 30)} mois)</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111]">Kilométrage inclus</h4>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {KM_OPTIONS.map((k, i) => (
                  <button key={i} onClick={() => setKmChoice(i)} className={`rounded-lg border-2 px-2 py-2.5 text-center transition ${kmChoice === i ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}>
                    <span className="block text-sm font-bold text-[#111]">{k.label}</span>
                    {k.extra > 0 && <span className="block text-[10px] text-[#D4AF37]">+{k.extra} €/j</span>}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition">Continuer →</button>
          </div>
        )}

        {step === 2 && (
          <div className="px-4 py-4 space-y-4">
            <h3 className="text-sm font-bold text-[#111]">Dépôt de dossier</h3>
            <p className="text-xs text-[#6B7280]">Téléchargez vos documents pour valider votre éligibilité.</p>
            <div className="space-y-2">
              {(docType === "vtc" ? DOCS_VTC : DOCS_TAXI).map((doc) => (
                <div key={doc} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-3">
                  <div className="flex items-center gap-2">
                    <FileCheck size={14} className="text-[#D4AF37]" />
                    <span className="text-sm text-[#111]">{doc}</span>
                  </div>
                  <button className="rounded-lg bg-[#F5F3EF] px-3 py-1.5 text-[11px] font-semibold text-[#D4AF37]">Télécharger</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border-2 border-[#E5E7EB] py-3 text-sm font-bold text-[#6B7280]">← Retour</button>
              <button onClick={() => setStep(3)} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Continuer →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="px-4 py-4 space-y-4">
            <h3 className="text-sm font-bold text-[#111]">Signature du contrat</h3>
            <div className="rounded-xl border border-[#E5E7EB] p-4 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Véhicule</span><span className="font-semibold">{VEHICLE.titre}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Durée</span><span className="font-semibold">{nbJours}j ({Math.round(nbJours / 30)} mois)</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Kilométrage</span><span className="font-semibold">{KM_OPTIONS[kmChoice].label}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Mensualité</span><span className="font-bold text-[#D4AF37]">{mensualite} €/mois</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Caution</span><span className="font-semibold">1 000 €</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Assurance</span><span className="font-semibold text-green-600">Incluse</span></div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded accent-[#D4AF37]" />
              <span className="text-xs text-[#6B7280]">J'accepte les conditions générales de location et le contrat de location VTC/Taxi MKA.P-MS.</span>
            </label>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl border-2 border-[#E5E7EB] py-3 text-sm font-bold text-[#6B7280]">← Retour</button>
              <button onClick={() => setStep(4)} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-1.5 active:scale-[0.98]">
                <Pen size={14} /> Signer le contrat
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="px-4 py-4 space-y-4">
            <h3 className="text-sm font-bold text-[#111]">Paiement de l'acompte</h3>
            <div className="rounded-xl bg-[#F5F3EF] p-4 text-center">
              <p className="text-xs text-[#6B7280]">Acompte à payer</p>
              <p className="text-2xl font-black text-[#111]">{acompte} €</p>
              <p className="text-[10px] text-[#6B7280] mt-1">Déduit de votre première mensualité de {mensualite} €</p>
            </div>
            <button className="w-full rounded-xl bg-[#D4AF37] py-4 text-base font-extrabold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-lg">
              <Lock size={16} /> Payer l'acompte
            </button>
            <div className="flex items-center justify-center gap-1"><Lock size={12} className="text-[#6B7280]" /><span className="text-xs text-[#6B7280]">Paiement 100% sécurisé</span></div>
            <div className="flex items-center justify-center gap-4 py-1">
              <span className="text-xs font-bold text-[#1a1f71]">VISA</span>
              <span className="text-xs font-bold text-[#eb001b]">Master<span className="text-[#f79e1b]">card</span></span>
              <span className="text-xs font-bold text-[#111]">Apple Pay</span>
              <span className="text-xs font-bold text-[#4285f4]">Google Pay</span>
            </div>
            <button onClick={() => setStep(3)} className="w-full rounded-xl border-2 border-[#E5E7EB] py-3 text-sm font-bold text-[#6B7280]">← Retour</button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════ BLOC 9 — SERVICES SUPPLÉMENTAIRES ═══════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-4">
        <h2 className="text-lg font-bold text-[#111]">Services supplémentaires</h2>
        <div className="mt-3 space-y-3">
          {SERVICES_SUP.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Icon size={18} className="text-[#D4AF37]" />
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

      {/* ═══════════════════════════════════ BLOC 10 — AVIS ═══════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111]">Avis chauffeurs</h2>
          <div className="flex items-center gap-1">
            <Star size={14} className="text-[#D4AF37]" fill="#D4AF37" />
            <span className="text-sm font-bold text-[#111]">{VEHICLE.note}/5</span>
            <span className="text-xs text-[#6B7280]">({VEHICLE.nbAvis})</span>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {AVIS.map((a, i) => (
            <div key={i} className="rounded-xl border border-[#F3F4F6] p-3">
              <div className="flex items-center gap-3">
                <img src={a.photo} alt={a.nom} className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#111]">{a.nom}</p>
                  <p className="text-[10px] text-[#6B7280]">{a.metier}</p>
                </div>
                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => (<Star key={j} size={10} className={j < a.note ? "text-[#D4AF37]" : "text-[#E5E7EB]"} fill={j < a.note ? "#D4AF37" : "none"} />))}</div>
              </div>
              <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">{a.commentaire}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════ BLOC 11 — FAQ VTC ═══════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">FAQ VTC & Taxi</h2>
        <div className="mt-3">
          {FAQ_VTC.map((f, i) => (
            <div key={i} className="border-b border-[#F3F4F6] last:border-0">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between py-3.5 text-left">
                <span className="text-sm font-semibold text-[#111] pr-4">{f.q}</span>
                <ChevronDown size={16} className={`shrink-0 text-[#6B7280] transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="pb-3 text-xs text-[#6B7280] leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════ BLOC 12 — VÉHICULES SIMILAIRES ═══════════════════════════════════ */}
      <div className="px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Véhicules similaires</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-3 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          {SIMILAIRES.map((v, i) => (
            <Link key={i} to="/louer/vtc-taxi" className="w-[200px] shrink-0 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-md transition">
              <div className="relative h-[120px]">
                <img src={v.photo} alt={v.titre} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-[#111]/80 px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">{v.type}</span>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-[#111] truncate">{v.titre}</h3>
                <p className="text-sm font-bold text-[#D4AF37] mt-1">{v.prix} € <span className="text-[10px] font-normal text-[#6B7280]">/ jour</span></p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Besoin d'aide ── */}
      <div className="mx-4 mb-6 rounded-2xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <Headphones size={20} className="text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#111]">Besoin d'aide ?</h3>
          <p className="text-xs text-[#6B7280]">Chat en ligne ou 09 70 70 50 50</p>
          <p className="text-[10px] text-[#6B7280]">7j/7 de 8h à 20h</p>
        </div>
      </div>

      {/* ═══════════════════════════════════ BARRE FIXE EN BAS ═══════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center justify-between" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div>
          <span className="text-[10px] text-[#6B7280]">Mensualité</span>
          <p className="text-lg font-black text-[#111]">{VEHICLE.prixMois} € <span className="text-xs font-normal text-[#6B7280]">/ mois</span></p>
        </div>
        <button onClick={scrollToResv} className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-extrabold text-white shadow-lg active:scale-[0.98] transition">
          Réserver
        </button>
      </div>
    </div>
  );
}
