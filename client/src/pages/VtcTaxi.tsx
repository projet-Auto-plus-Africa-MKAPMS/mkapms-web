import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Heart, Star, Check, Fuel, Settings2,
  Zap, Users, DoorOpen, Gauge, Calendar, Shield, Clock, Phone,
  CreditCard, Lock, ChevronDown, MapPin, Play, Camera, CarFront,
  Armchair, Boxes, MonitorSmartphone, Wifi, ThermometerSun, ParkingCircle,
  Navigation, Award, Headphones, FileCheck, Rocket, Ban, Smartphone, Globe
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   DONNÉES VÉHICULE DÉMO — Mercedes Classe E Break
   ══════════════════════════════════════════════════════════════════════════ */

const VEHICLE = {
  id: 9201,
  titre: "Mercedes Classe E Break",
  sousTitre: "VTC | 2024 | Diesel | Automatique",
  prix: 63,
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
  badges: ["VTC agréé", "Entretien inclus", "Faible consommation", "Confort Premium"],
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

const GALLERY_TABS = ["Extérieur", "Intérieur", "Coffre", "Tableau de bord", "Sièges", "Équipements", "Vidéo"];

const EQUIPEMENTS = [
  { label: "Sièges en cuir", ok: true },
  { label: "GPS Grand écran", ok: true },
  { label: "Caméra de recul", ok: true },
  { label: "Climatisation automatique", ok: true },
  { label: "Régulateur de vitesse", ok: true },
  { label: "Bluetooth / USB", ok: true },
  { label: "Apple CarPlay", ok: true },
  { label: "Android Auto", ok: true },
  { label: "Aide au stationnement", ok: true },
];

const POURQUOI = [
  { icon: Settings2, label: "Entretien inclus", desc: "Véhicule toujours en parfait état" },
  { icon: Headphones, label: "Assistance 7j/7", desc: "Une équipe disponible à tout moment" },
  { icon: Shield, label: "Assurance incluse", desc: "Tous risques, franchise réduite" },
  { icon: FileCheck, label: "Zéro paperasse", desc: "100% en ligne, 100% sécurisé" },
  { icon: MapPin, label: "Livraison possible", desc: "À l'adresse de votre choix" },
  { icon: Rocket, label: "Réservation instantanée", desc: "Pas d'attente, pas de délai" },
  { icon: Ban, label: "Aucun appel obligatoire", desc: "Tout se fait en ligne" },
  { icon: Lock, label: "Paiement sécurisé", desc: "CB, Apple Pay, Google Pay" },
];

const AVIS = [
  { nom: "Alexandre D.", metier: "Chauffeur VTC", note: 5, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", commentaire: "Véhicule impeccable, réservation en 2 minutes. Je recommande à 100% pour les chauffeurs VTC." },
  { nom: "Sophie M.", metier: "Chauffeur Taxi", note: 5, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", commentaire: "Service au top ! La Mercedes était comme neuve. Processus rapide et sans stress." },
  { nom: "Karim B.", metier: "Chauffeur VTC", note: 4, photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", commentaire: "Très bon rapport qualité-prix. L'assistance 24/7 est un vrai plus." },
  { nom: "Marie L.", metier: "Chauffeur VTC Premium", note: 5, photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face", commentaire: "La Classe E est parfaite pour le VTC premium. Mes clients adorent." },
];

const FAQ_DATA = [
  { q: "Comment récupérer le véhicule ?", a: "Après paiement, vous recevez votre confirmation par email avec l'adresse et l'heure de retrait. Présentez votre pièce d'identité et votre justificatif de réservation. Le véhicule vous est remis immédiatement." },
  { q: "Quels documents sont nécessaires ?", a: "Pièce d'identité en cours de validité, permis de conduire (minimum 2 ans), carte VTC ou licence taxi, justificatif de domicile de moins de 3 mois." },
  { q: "Comment fonctionne la caution ?", a: "Une empreinte bancaire de 500 € est prise lors de la réservation (non débitée). Elle est libérée sous 7 jours ouvrés après restitution du véhicule en bon état." },
  { q: "Peut-on annuler la réservation ?", a: "Annulation gratuite jusqu'à 48h avant la prise en charge. Entre 48h et 24h : 50% du montant. Moins de 24h : montant total." },
  { q: "Comment modifier une réservation ?", a: "Depuis votre espace client ou en contactant notre support 7j/7. Les modifications sont gratuites sous réserve de disponibilité du véhicule." },
];

const AUTRES_VEHICULES = [
  { id: 9202, titre: "Tesla Model 3 Long Range", type: "VTC", prix: 135, dispo: true, photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=280&fit=crop" },
  { id: 9204, titre: "BMW Série 5 530e", type: "VTC", prix: 140, dispo: true, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=280&fit=crop" },
  { id: 9203, titre: "Toyota Camry Hybride", type: "Taxi", prix: 95, dispo: true, photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=280&fit=crop" },
  { id: 9206, titre: "Skoda Superb Combi", type: "VTC", prix: 85, dispo: false, photo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=280&fit=crop" },
  { id: 9207, titre: "Mercedes Classe V 250d", type: "VTC", prix: 160, dispo: true, photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=280&fit=crop" },
  { id: 9208, titre: "Volkswagen ID.4 Pro", type: "VTC", prix: 115, dispo: true, photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=280&fit=crop" },
];

const KM_OPTIONS = [
  { km: 150, extra: 0, label: "150 km" },
  { km: 200, extra: 10, label: "200 km" },
  { km: 9999, extra: 20, label: "Illimité" },
];

const RESERVATION_OPTIONS = [
  { id: "conducteur", label: "Conducteur supplémentaire", prix: 15 },
  { id: "siege", label: "Siège bébé", prix: 7 },
  { id: "livraison", label: "Livraison à domicile", prix: 40 },
  { id: "retour", label: "Retour à domicile", prix: 40 },
];

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ══════════════════════════════════════════════════════════════════════════ */

export default function VtcTaxi() {
  /* ── Galerie ── */
  const [photoIdx, setPhotoIdx] = useState(0);
  const [galleryTab, setGalleryTab] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const prevPhoto = useCallback(() => setPhotoIdx((i) => (i === 0 ? GALLERY.length - 1 : i - 1)), []);
  const nextPhoto = useCallback(() => setPhotoIdx((i) => (i === GALLERY.length - 1 ? 0 : i + 1)), []);

  /* ── Caractéristiques ── */
  const [showAllChars, setShowAllChars] = useState(false);

  /* ── Équipements ── */
  const [showAllEquip, setShowAllEquip] = useState(false);

  /* ── FAQ ── */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* ── Module réservation ── */
  const [step, setStep] = useState(1);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 7);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const [dateDebut, setDateDebut] = useState(formatDate(today));
  const [dateFin, setDateFin] = useState(formatDate(tomorrow));
  const [kmChoice, setKmChoice] = useState(0);
  const [options, setOptions] = useState<Record<string, boolean>>({});

  const nbJours = useMemo(() => {
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [dateDebut, dateFin]);

  const prixLocation = nbJours * (VEHICLE.prix + KM_OPTIONS[kmChoice].extra);
  const prixOptions = Object.entries(options)
    .filter(([, v]) => v)
    .reduce((sum, [id]) => sum + (RESERVATION_OPTIONS.find((o) => o.id === id)?.prix || 0), 0) * nbJours;
  const caution = 500;
  const tva = Math.round((prixLocation + prixOptions) * 0.2 * 100) / 100;
  const total = prixLocation + prixOptions;

  /* ── Favori ── */
  const [fav, setFav] = useState(false);

  /* ── Scroll vers réservation ── */
  const resvRef = useRef<HTMLDivElement>(null);
  const scrollToResv = () => resvRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — BANNIÈRE PRINCIPALE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Header fixe */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur px-4 py-3 border-b border-[#E5E7EB]">
          <Link to="/louer" className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F3F4F6]">
            <ChevronLeft size={20} className="text-[#111]" />
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => setFav(!fav)} className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F3F4F6]">
              <Heart size={18} className={fav ? "fill-red-500 text-red-500" : "text-[#111]"} />
            </button>
          </div>
        </div>

        {/* Photo principale avec badge VTC */}
        <div className="relative">
          <img
            src={GALLERY[photoIdx]}
            alt={VEHICLE.titre}
            className="w-full h-[280px] object-cover"
          />
          {/* Badge VTC & TAXI */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111]/90 px-3 py-1.5 text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/60 backdrop-blur">
              <Shield size={12} /> VTC & TAXI
            </span>
          </div>
          {/* Favori */}
          <button onClick={() => setFav(!fav)} className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur">
            <Heart size={18} className={fav ? "fill-red-500 text-red-500" : "text-[#333]"} />
          </button>
          {/* Compteur */}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {photoIdx + 1} / {GALLERY.length}
          </div>
          {/* Navigation flèches */}
          <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/70 backdrop-blur">
            <ChevronLeft size={18} className="text-[#111]" />
          </button>
          <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/70 backdrop-blur">
            <ChevronRight size={18} className="text-[#111]" />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — GALERIE MINIATURES + TABS
            ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white px-4 pt-2 pb-3">
          {/* Miniatures */}
          <div ref={galleryRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {GALLERY.slice(0, 7).map((img, i) => (
              <button
                key={i}
                onClick={() => setPhotoIdx(i)}
                className={`relative w-14 h-10 shrink-0 rounded-md overflow-hidden border-2 transition ${photoIdx === i ? "border-[#D4AF37]" : "border-transparent opacity-70"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                {i === 6 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Play size={14} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {/* Tabs catégories */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide mt-1">
            {GALLERY_TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setGalleryTab(i); setPhotoIdx(i * 3); }}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold transition ${galleryTab === i ? "bg-[#111] text-white" : "bg-[#F3F4F6] text-[#6B7280]"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — TITRE + NOTE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white px-4 py-4 border-t border-[#F3F4F6]">
        <h1 className="text-xl font-extrabold text-[#111]">{VEHICLE.titre}</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">{VEHICLE.sousTitre}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-[#D4AF37]" fill="#D4AF37" />
            <span className="text-sm font-bold text-[#111]">{VEHICLE.note}</span>
          </div>
          <span className="text-xs text-[#6B7280]">({VEHICLE.nbAvis} avis)</span>
        </div>
        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {VEHICLE.badges.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 rounded-full bg-[#F5F3EF] px-2.5 py-1 text-[11px] font-semibold text-[#111]">
              <Check size={12} className="text-[#D4AF37]" /> {b}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — TARIF
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white px-4 py-4 mt-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-[#111]">{VEHICLE.prix},00 €</span>
          <span className="text-base font-semibold text-[#6B7280]">/ jour</span>
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">Kilométrage inclus : {VEHICLE.kmInclus} km / jour</p>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-xs font-semibold text-[#D4AF37]">{VEHICLE.kmInclus} km inclus par jour</span>
          <span className="text-xs text-[#6B7280]">{VEHICLE.kmSup.toFixed(2)} € / km supp.</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — BOUTON RÉSERVER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-3">
        <button
          onClick={scrollToResv}
          className="w-full rounded-xl bg-[#D4AF37] py-4 text-center text-base font-extrabold text-white shadow-lg active:scale-[0.98] transition"
        >
          RÉSERVER MAINTENANT
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — CARACTÉRISTIQUES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-3">
        <h2 className="text-lg font-bold text-[#111]">Caractéristiques</h2>
        <div className="mt-3 space-y-0">
          {[
            { icon: Fuel, label: "Carburant", value: VEHICLE.carburant },
            { icon: Settings2, label: "Boîte de vitesse", value: VEHICLE.transmission },
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
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-[#6B7280]" />
                  <span className="text-sm text-[#6B7280]">{c.label}</span>
                </div>
                <span className="text-sm font-semibold text-[#111]">{c.value}</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setShowAllChars(!showAllChars)}
          className="mt-3 w-full rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F3F4F6]"
        >
          {showAllChars ? "Masquer" : "Voir plus de détails"}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — ÉQUIPEMENTS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Équipements principaux</h2>
        <div className="mt-3 space-y-2.5">
          {(showAllEquip ? EQUIPEMENTS : EQUIPEMENTS.slice(0, 6)).map((e, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full ${e.ok ? "bg-[#D4AF37]/10" : "bg-[#F3F4F6]"}`}>
                <Check size={12} className={e.ok ? "text-[#D4AF37]" : "text-[#9CA3AF]"} />
              </div>
              <span className="text-sm text-[#111]">{e.label}</span>
            </div>
          ))}
        </div>
        {EQUIPEMENTS.length > 6 && (
          <button
            onClick={() => setShowAllEquip(!showAllEquip)}
            className="mt-3 w-full rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#6B7280] transition hover:bg-[#F3F4F6]"
          >
            {showAllEquip ? "Masquer" : "Voir tous les équipements"}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8 — POURQUOI LOUER CE VÉHICULE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Pourquoi louer chez nous ?</h2>
        <div className="mt-4 space-y-4">
          {POURQUOI.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <Icon size={18} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111]">{p.label}</h3>
                  <p className="text-xs text-[#6B7280]">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 9 — MODULE DE RÉSERVATION AUTOMATIQUE
          ═══════════════════════════════════════════════════════════════════ */}
      <div ref={resvRef} className="mx-4 mt-4 rounded-2xl bg-white border-2 border-[#D4AF37]/30 overflow-hidden shadow-sm">
        <div className="bg-[#111] px-4 py-3">
          <h2 className="text-base font-bold text-white">Réservation</h2>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
          {[
            { n: 1, label: "Dates" },
            { n: 2, label: "Options" },
            { n: 3, label: "Paiement" },
          ].map((s) => (
            <button key={s.n} onClick={() => setStep(s.n)} className="flex items-center gap-1.5">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= s.n ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>
                {s.n}
              </div>
              <span className={`text-xs font-semibold ${step >= s.n ? "text-[#111]" : "text-[#9CA3AF]"}`}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* ÉTAPE 1 — Dates */}
        {step === 1 && (
          <div className="px-4 py-4 space-y-4">
            <h3 className="text-sm font-bold text-[#111]">Dates de location</h3>

            <div>
              <label className="text-xs font-semibold text-[#6B7280]">Lieu de retrait</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                <MapPin size={14} className="text-[#D4AF37]" />
                <span className="text-sm text-[#111]">Lyon, Gare Part-Dieu</span>
                <span className="ml-auto text-xs font-semibold text-[#D4AF37]">Modifier</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#6B7280]">Date de début</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6B7280]">Date de fin</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#111]"
                />
              </div>
            </div>

            <div className="rounded-lg bg-[#F5F3EF] px-3 py-2.5">
              <span className="text-xs text-[#6B7280]">Durée de location</span>
              <p className="text-sm font-bold text-[#111]">{nbJours} jour{nbJours > 1 ? "s" : ""}</p>
            </div>

            {/* Kilométrage */}
            <div>
              <h4 className="text-sm font-bold text-[#111]">Kilométrage</h4>
              <p className="text-xs text-[#6B7280]">Inclus</p>
              <p className="text-sm font-semibold text-[#111]">{KM_OPTIONS[kmChoice].km === 9999 ? "Illimité" : `${KM_OPTIONS[kmChoice].km} km / jour`}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {KM_OPTIONS.map((k, i) => (
                  <button
                    key={i}
                    onClick={() => setKmChoice(i)}
                    className={`rounded-lg border-2 px-2 py-2.5 text-center transition ${kmChoice === i ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}
                  >
                    <span className="block text-sm font-bold text-[#111]">{k.label}</span>
                    {k.extra > 0 && <span className="block text-[10px] text-[#D4AF37]">+{k.extra},00 € / jour</span>}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition"
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ÉTAPE 2 — Options */}
        {step === 2 && (
          <div className="px-4 py-4 space-y-4">
            <h3 className="text-sm font-bold text-[#111]">Options disponibles</h3>
            <div className="space-y-3">
              {RESERVATION_OPTIONS.map((o) => (
                <label key={o.id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-3 cursor-pointer hover:bg-[#F9F9F7] transition">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!options[o.id]}
                      onChange={(e) => setOptions({ ...options, [o.id]: e.target.checked })}
                      className="h-4 w-4 rounded border-[#D4AF37] text-[#D4AF37] accent-[#D4AF37]"
                    />
                    <span className="text-sm text-[#111]">{o.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#111]">+{o.prix},00 € / jour</span>
                </label>
              ))}
            </div>

            {/* Récapitulatif */}
            <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#F5F3EF] px-4 py-3">
                <h4 className="text-sm font-bold text-[#111]">Récapitulatif</h4>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <img src={GALLERY[0]} alt="" className="w-12 h-8 rounded object-cover" />
                  <div>
                    <p className="text-sm font-bold text-[#111]">{VEHICLE.titre}</p>
                    <p className="text-[10px] text-[#6B7280]">{VEHICLE.sousTitre}</p>
                  </div>
                </div>
                <div className="border-t border-[#F3F4F6] pt-2 space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-[#6B7280]">📅 Début</span><span className="text-[#111] font-semibold">{new Date(dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#6B7280]">📅 Fin</span><span className="text-[#111] font-semibold">{new Date(dateFin).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} — {nbJours}j</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Kilométrage inclus</span><span className="text-[#111] font-semibold">{KM_OPTIONS[kmChoice].km === 9999 ? "Illimité" : `${KM_OPTIONS[kmChoice].km} km / jour`}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Options</span><span className="text-[#111] font-semibold">{prixOptions > 0 ? `${prixOptions.toFixed(2)} €` : "Aucune"}</span></div>
                </div>
                <div className="border-t border-[#F3F4F6] pt-2 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Sous-total ({nbJours} jours)</span><span className="font-semibold">{prixLocation.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Kilométrage inclus</span><span className="font-semibold text-[#D4AF37]">Inclus</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Options</span><span className="font-semibold">{prixOptions.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Caution (empreinte bancaire)</span><span className="font-semibold">{caution.toFixed(2)} €</span></div>
                </div>
                <div className="border-t-2 border-[#111] pt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-[#111]">Total à payer</span>
                  <span className="text-xl font-black text-[#111]">{total.toFixed(2)} € <span className="text-xs font-normal text-[#6B7280]">TTC</span></span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border-2 border-[#E5E7EB] py-3 text-sm font-bold text-[#6B7280]">
                ← Retour
              </button>
              <button onClick={() => setStep(3)} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition">
                Continuer vers les options →
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — Paiement */}
        {step === 3 && (
          <div className="px-4 py-4 space-y-4">
            <div className="rounded-xl bg-[#F5F3EF] p-4 text-center">
              <p className="text-2xl font-black text-[#111]">{total.toFixed(2)} € <span className="text-sm font-normal text-[#6B7280]">TTC</span></p>
              <p className="text-xs text-[#6B7280] mt-1">{nbJours} jour{nbJours > 1 ? "s" : ""} — {VEHICLE.titre}</p>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 10 — PAIEMENT INTÉGRÉ
                ═══════════════════════════════════════════════════════════ */}
            <button className="w-full rounded-xl bg-[#D4AF37] py-4 text-base font-extrabold text-white shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition">
              <Lock size={16} /> Continuer vers le paiement
            </button>

            <div className="flex items-center justify-center gap-1">
              <Lock size={12} className="text-[#6B7280]" />
              <span className="text-xs text-[#6B7280]">Paiement 100% sécurisé</span>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              <span className="text-xs font-bold text-[#1a1f71]">VISA</span>
              <span className="text-xs font-bold text-[#eb001b]">Master<span className="text-[#f79e1b]">card</span></span>
              <span className="text-xs font-bold text-[#111]">Apple Pay</span>
              <span className="text-xs font-bold text-[#4285f4]">G<span className="text-[#ea4335]">o</span><span className="text-[#fbbc05]">o</span><span className="text-[#4285f4]">g</span><span className="text-[#34a853]">l</span><span className="text-[#ea4335]">e</span> Pay</span>
            </div>

            <button onClick={() => setStep(2)} className="w-full rounded-xl border-2 border-[#E5E7EB] py-3 text-sm font-bold text-[#6B7280]">
              ← Retour aux options
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 11 — COMMENT ÇA MARCHE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#F5F3EF] px-4 py-3 border-b border-[#E5E7EB]">
          <h2 className="text-base font-bold text-[#111]">Comment ça marche ?</h2>
        </div>
        <div className="px-4 py-4 space-y-0">
          {[
            { n: "1", title: "Réservez en ligne", desc: "Choisissez vos dates, options et payez en toute sécurité." },
            { n: "2", title: "Recevez votre confirmation", desc: "Par email avec tous les détails et votre code de réservation." },
            { n: "3", title: "Récupérez votre véhicule", desc: "Présentez-vous avec votre pièce d'identité et votre code de réservation." },
            { n: "4", title: "Prenez la route", desc: "Votre véhicule est prêt, vous n'avez plus qu'à travailler !" },
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
          SECTION 12 — AVIS CLIENTS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111]">Avis clients</h2>
          <div className="flex items-center gap-1">
            <Star size={14} className="text-[#D4AF37]" fill="#D4AF37" />
            <span className="text-sm font-bold text-[#111]">{VEHICLE.note}/5</span>
            <span className="text-xs text-[#6B7280]">({VEHICLE.nbAvis})</span>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {AVIS.map((a, i) => (
            <div key={i} className="rounded-xl border border-[#F3F4F6] p-3">
              <div className="flex items-center gap-3">
                <img src={a.photo} alt={a.nom} className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#111]">{a.nom}</p>
                  <p className="text-[10px] text-[#6B7280]">{a.metier}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={10} className={j < a.note ? "text-[#D4AF37]" : "text-[#E5E7EB]"} fill={j < a.note ? "#D4AF37" : "none"} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">{a.commentaire}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 13 — FAQ
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Questions fréquentes</h2>
        <div className="mt-3 space-y-0">
          {FAQ_DATA.map((f, i) => (
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

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 14 — AUTRES VÉHICULES DISPONIBLES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Autres véhicules VTC & Taxi</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-3 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          {AUTRES_VEHICULES.map((v) => (
            <Link key={v.id} to={`/vtc-taxi`} className="w-[200px] shrink-0 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-md transition">
              <div className="relative h-[120px]">
                <img src={v.photo} alt={v.titre} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-2 left-2 rounded-full bg-[#111]/80 px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">{v.type}</span>
                {v.dispo ? (
                  <span className="absolute top-2 right-2 rounded-full bg-green-500/90 px-2 py-0.5 text-[9px] font-bold text-white">Dispo</span>
                ) : (
                  <span className="absolute top-2 right-2 rounded-full bg-red-500/90 px-2 py-0.5 text-[9px] font-bold text-white">Réservé</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-[#111] truncate">{v.titre}</h3>
                <p className="text-sm font-bold text-[#D4AF37] mt-1">{v.prix} € <span className="text-[10px] font-normal text-[#6B7280]">/ jour</span></p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 15 — AVANTAGES MKA.P-MS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-2 mb-6 rounded-2xl bg-[#111] p-5">
        <h2 className="text-base font-bold text-white text-center">Avantages MKA.P-MS</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { icon: Lock, label: "Paiement sécurisé" },
            { icon: Rocket, label: "Réservation instantanée" },
            { icon: Headphones, label: "Assistance 24/7" },
            { icon: Shield, label: "Véhicules contrôlés" },
            { icon: Gauge, label: "Kilométrage transparent" },
            { icon: Clock, label: "Réservation rapide" },
            { icon: MapPin, label: "Sans déplacement inutile" },
            { icon: Globe, label: "Processus 100% digital" },
          ].map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20">
                  <Icon size={14} className="text-[#D4AF37]" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">{a.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BESOIN D'AIDE
          ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          BARRE FIXE EN BAS — PRIX + BOUTON RÉSERVER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center justify-between" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div>
          <span className="text-xs text-[#6B7280]">À partir de</span>
          <p className="text-lg font-black text-[#111]">{VEHICLE.prix},00 € <span className="text-xs font-normal text-[#6B7280]">/ jour</span></p>
        </div>
        <button
          onClick={scrollToResv}
          className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-extrabold text-white shadow-lg active:scale-[0.98] transition"
        >
          Réserver maintenant
        </button>
      </div>

    </div>
  );
}
