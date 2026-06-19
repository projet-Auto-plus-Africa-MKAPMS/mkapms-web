import { useState, useRef, useCallback } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Heart, Star, Check, Fuel, Settings2,
  Zap, Users, DoorOpen, Gauge, Calendar, Shield, Clock, Lock,
  ChevronDown, MapPin, Play, Headphones, FileCheck, Rocket, Ban,
  Globe, Navigation, Euro, TrendingUp, Briefcase, Calculator,
  Pen, CreditCard, Car, Package, Truck, Bus, HardHat
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE PRODUIT — LOCATION GÉNÉRIQUE
   Fonctionne pour : Pro, Utilitaires, Camions, Minibus
   ══════════════════════════════════════════════════════════════════════════ */

const VEHICLES_DB: Record<string, { titre: string; sousTitre: string; prixJour: number; prixSemaine: number; prixMois: number; note: number; nbAvis: number; annee: number; carburant: string; transmission: string; puissance: string; places: number; badges: string[]; photo: string }> = {
  // PRO
  "8001": { titre: "Renault Kangoo Van", sousTitre: "Utilitaire | 2023 | Diesel | Manuelle", prixJour: 35, prixSemaine: 199, prixMois: 680, note: 4.6, nbAvis: 42, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "95 ch", places: 2, badges: ["Pro", "Livraison possible"], photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=800&h=500&fit=crop" },
  "8002": { titre: "Citroën Berlingo Van", sousTitre: "Utilitaire | 2023 | Diesel | Manuelle", prixJour: 38, prixSemaine: 215, prixMois: 720, note: 4.5, nbAvis: 38, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "100 ch", places: 2, badges: ["Pro", "Volume 3.3 m³"], photo: "https://images.unsplash.com/photo-1581578017306-37ed0ee5e13e?w=800&h=500&fit=crop" },
  "8003": { titre: "Peugeot Partner", sousTitre: "Utilitaire | 2024 | Diesel | Automatique", prixJour: 40, prixSemaine: 230, prixMois: 780, note: 4.7, nbAvis: 55, annee: 2024, carburant: "Diesel", transmission: "Automatique", puissance: "130 ch", places: 3, badges: ["Pro Premium"], photo: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=800&h=500&fit=crop" },
  "8004": { titre: "Renault Trafic", sousTitre: "Fourgon | 2023 | Diesel | Manuelle", prixJour: 55, prixSemaine: 320, prixMois: 1100, note: 4.6, nbAvis: 64, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "150 ch", places: 3, badges: ["Grand volume", "6 m³"], photo: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=500&fit=crop" },
  "8005": { titre: "Ford Transit Custom", sousTitre: "Fourgon | 2024 | Diesel | Automatique", prixJour: 60, prixSemaine: 350, prixMois: 1200, note: 4.8, nbAvis: 72, annee: 2024, carburant: "Diesel", transmission: "Automatique", puissance: "170 ch", places: 3, badges: ["Pro Elite", "Confort"], photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=500&fit=crop" },
  "8006": { titre: "Renault Master L2H2", sousTitre: "Grand volume | 2023 | Diesel | Manuelle", prixJour: 72, prixSemaine: 420, prixMois: 1450, note: 4.5, nbAvis: 31, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "150 ch", places: 3, badges: ["Grand volume", "13 m³"], photo: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=500&fit=crop" },
  "8007": { titre: "Mercedes Sprinter 314", sousTitre: "Grand volume | 2024 | Diesel | Automatique", prixJour: 85, prixSemaine: 490, prixMois: 1650, note: 4.9, nbAvis: 88, annee: 2024, carburant: "Diesel", transmission: "Automatique", puissance: "143 ch", places: 3, badges: ["Pro Elite", "14 m³"], photo: "https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=800&h=500&fit=crop" },
  "8008": { titre: "Fiat Ducato L3H2", sousTitre: "Grand volume | 2023 | Diesel | Manuelle", prixJour: 70, prixSemaine: 400, prixMois: 1380, note: 4.4, nbAvis: 26, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "140 ch", places: 3, badges: ["Grand volume", "15 m³"], photo: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&h=500&fit=crop" },
  "8009": { titre: "Mitsubishi L200", sousTitre: "Pick-up | 2024 | Diesel | Automatique", prixJour: 65, prixSemaine: 380, prixMois: 1300, note: 4.7, nbAvis: 45, annee: 2024, carburant: "Diesel", transmission: "Automatique", puissance: "150 ch", places: 5, badges: ["Pick-up", "Tout-terrain"], photo: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=500&fit=crop" },
  "8010": { titre: "Renault Trafic Frigo", sousTitre: "Frigorifique | 2023 | Diesel | Manuelle", prixJour: 80, prixSemaine: 460, prixMois: 1550, note: 4.6, nbAvis: 19, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "150 ch", places: 3, badges: ["Frigo", "-20 à +20°C"], photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop" },
  // CAMIONS
  "7001": { titre: "DAF LF 7.5t Fourgon", sousTitre: "Porteur | 2023 | Diesel | Manuelle", prixJour: 120, prixSemaine: 700, prixMois: 2400, note: 4.5, nbAvis: 22, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "210 ch", places: 3, badges: ["PTAC 7.5t", "Permis C1"], photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=500&fit=crop" },
  "7002": { titre: "Iveco Eurocargo 12t", sousTitre: "Porteur | 2024 | Diesel | Automatique", prixJour: 150, prixSemaine: 880, prixMois: 3000, note: 4.7, nbAvis: 34, annee: 2024, carburant: "Diesel", transmission: "Automatique", puissance: "280 ch", places: 3, badges: ["PTAC 12t", "Permis C"], photo: "https://images.unsplash.com/photo-1586191582056-3e5bcf014e63?w=800&h=500&fit=crop" },
  "7003": { titre: "Mercedes Atego 19t", sousTitre: "Porteur | 2023 | Diesel | Automatique", prixJour: 180, prixSemaine: 1050, prixMois: 3600, note: 4.8, nbAvis: 41, annee: 2023, carburant: "Diesel", transmission: "Automatique", puissance: "354 ch", places: 3, badges: ["PTAC 19t", "Permis C"], photo: "https://images.unsplash.com/photo-1562674310-37e91a8e6839?w=800&h=500&fit=crop" },
  "7004": { titre: "Renault D-Range Benne", sousTitre: "Benne | 2024 | Diesel | Manuelle", prixJour: 160, prixSemaine: 950, prixMois: 3200, note: 4.6, nbAvis: 28, annee: 2024, carburant: "Diesel", transmission: "Manuelle", puissance: "250 ch", places: 3, badges: ["Benne", "PTAC 16t"], photo: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&h=500&fit=crop" },
  "7005": { titre: "Iveco Daily Benne 3.5t", sousTitre: "Benne | 2023 | Diesel | Manuelle", prixJour: 90, prixSemaine: 520, prixMois: 1800, note: 4.4, nbAvis: 15, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "156 ch", places: 3, badges: ["Benne", "Permis B"], photo: "https://images.unsplash.com/photo-1563720223523-110fd0cc288a?w=800&h=500&fit=crop" },
  "7006": { titre: "Mercedes Sprinter Plateau", sousTitre: "Plateau | 2024 | Diesel | Manuelle", prixJour: 85, prixSemaine: 480, prixMois: 1650, note: 4.5, nbAvis: 20, annee: 2024, carburant: "Diesel", transmission: "Manuelle", puissance: "143 ch", places: 3, badges: ["Plateau", "3.5t"], photo: "https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=800&h=500&fit=crop" },
  "7007": { titre: "Porte-voiture 2 niveaux", sousTitre: "Spécial | 2023 | Diesel | Manuelle", prixJour: 200, prixSemaine: 1200, prixMois: 4200, note: 4.8, nbAvis: 12, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "320 ch", places: 3, badges: ["Porte-voiture", "2 niveaux"], photo: "https://images.unsplash.com/photo-1562674310-37e91a8e6839?w=800&h=500&fit=crop" },
  "7008": { titre: "Mini-pelle 3 tonnes", sousTitre: "Engin | 2024 | Diesel | —", prixJour: 250, prixSemaine: 1400, prixMois: 4500, note: 4.9, nbAvis: 8, annee: 2024, carburant: "Diesel", transmission: "—", puissance: "25 ch", places: 1, badges: ["Engin", "Chantier"], photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop" },
  // MINIBUS
  "6001": { titre: "VW Caravelle 8 places", sousTitre: "Minibus | 2024 | Diesel | Automatique", prixJour: 95, prixSemaine: 560, prixMois: 1900, note: 4.8, nbAvis: 56, annee: 2024, carburant: "Diesel", transmission: "Automatique", puissance: "150 ch", places: 8, badges: ["8 places", "Confort"], photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&h=500&fit=crop" },
  "6002": { titre: "Mercedes Classe V 8 pl.", sousTitre: "Minibus | 2024 | Diesel | Automatique", prixJour: 120, prixSemaine: 700, prixMois: 2400, note: 4.9, nbAvis: 78, annee: 2024, carburant: "Diesel", transmission: "Automatique", puissance: "190 ch", places: 8, badges: ["Premium", "8 places"], photo: "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?w=800&h=500&fit=crop" },
  "6003": { titre: "Mercedes Sprinter 9 pl.", sousTitre: "Minibus | 2023 | Diesel | Automatique", prixJour: 110, prixSemaine: 650, prixMois: 2200, note: 4.7, nbAvis: 45, annee: 2023, carburant: "Diesel", transmission: "Automatique", puissance: "163 ch", places: 9, badges: ["9 places", "Spacieux"], photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop" },
  "6004": { titre: "VW Transporter 9 pl.", sousTitre: "Minibus | 2024 | Diesel | Manuelle", prixJour: 90, prixSemaine: 530, prixMois: 1800, note: 4.6, nbAvis: 34, annee: 2024, carburant: "Diesel", transmission: "Manuelle", puissance: "150 ch", places: 9, badges: ["9 places", "Fiable"], photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&h=500&fit=crop" },
  "6005": { titre: "Ford Transit 9 pl.", sousTitre: "Minibus | 2023 | Diesel | Manuelle", prixJour: 85, prixSemaine: 490, prixMois: 1700, note: 4.5, nbAvis: 28, annee: 2023, carburant: "Diesel", transmission: "Manuelle", puissance: "130 ch", places: 9, badges: ["9 places", "Économique"], photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop" },
  "6006": { titre: "Renault Master 12 pl.", sousTitre: "Minibus | 2024 | Diesel | Manuelle", prixJour: 130, prixSemaine: 760, prixMois: 2600, note: 4.6, nbAvis: 22, annee: 2024, carburant: "Diesel", transmission: "Manuelle", puissance: "165 ch", places: 12, badges: ["12 places", "Grand groupe"], photo: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=500&fit=crop" },
  "6007": { titre: "Mercedes Sprinter 17 pl.", sousTitre: "Minibus | 2024 | Diesel | Automatique", prixJour: 160, prixSemaine: 950, prixMois: 3200, note: 4.8, nbAvis: 35, annee: 2024, carburant: "Diesel", transmission: "Automatique", puissance: "190 ch", places: 17, badges: ["17 places", "Grand groupe"], photo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop" },
  "6008": { titre: "Mercedes V-Class VIP", sousTitre: "Minibus Premium | 2024 | Diesel | Auto", prixJour: 180, prixSemaine: 1050, prixMois: 3600, note: 5.0, nbAvis: 15, annee: 2024, carburant: "Diesel", transmission: "Automatique", puissance: "237 ch", places: 7, badges: ["VIP", "Premium"], photo: "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?w=800&h=500&fit=crop" },
};

const GALLERY_PHOTOS = [
  "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=500&fit=crop",
];

const EQUIPEMENTS = [
  "Climatisation", "Radio Bluetooth", "Régulateur vitesse", "Caméra recul",
  "GPS intégré", "Hayon élévateur", "Cloison séparation", "Antibrouillards",
  "Vitres teintées", "Barres de toit",
];

const AVIS = [
  { nom: "Karim D.", note: 5, texte: "Véhicule impeccable, livré à l'heure. Service professionnel.", date: "il y a 3 jours" },
  { nom: "Sophie M.", note: 4, texte: "Bon rapport qualité/prix pour un utilitaire. Je recommande.", date: "il y a 1 semaine" },
  { nom: "Jean-Marc L.", note: 5, texte: "Parfait pour notre déménagement. Propre et fiable.", date: "il y a 2 semaines" },
];

export default function ProduitLocation() {
  const { id } = useParams();
  const location = useLocation();
  const [imgIdx, setImgIdx] = useState(0);
  const [fav, setFav] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const v = id ? VEHICLES_DB[id] : null;
  const backPath = location.pathname.includes("/pro/") ? "/louer/pro"
    : location.pathname.includes("/utilitaires/") ? "/louer/utilitaires"
    : location.pathname.includes("/camions/") ? "/louer/camions"
    : "/louer/minibus";

  const categoryLabel = location.pathname.includes("/pro/") ? "Location Pro"
    : location.pathname.includes("/utilitaires/") ? "Utilitaires"
    : location.pathname.includes("/camions/") ? "Camions & Engins"
    : "Minibus";

  const accentColor = location.pathname.includes("/pro/") ? "blue-800"
    : location.pathname.includes("/utilitaires/") ? "orange-600"
    : location.pathname.includes("/camions/") ? "[#333]"
    : "purple-700";

  if (!v) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#111]">Véhicule introuvable</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Ce véhicule n'existe pas ou a été retiré.</p>
          <button onClick={() => navigate(-1)} className="mt-4 inline-block rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white">
            Retour aux véhicules
          </button>
        </div>
      </div>
    );
  }

  const photos = [v.photo, ...GALLERY_PHOTOS];

  const scrollTo = useCallback((dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({ left: dir === "right" ? w : -w, behavior: "smooth" });
    setImgIdx((p) => dir === "right" ? Math.min(p + 1, photos.length - 1) : Math.max(p - 1, 0));
  }, [photos.length]);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-[120px] max-w-5xl mx-auto">

      {/* GALERIE */}
      <div className="relative">
        <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {photos.map((p, i) => (
            <img key={i} src={p} alt={`${v.titre} ${i + 1}`} className="w-full h-[260px] md:h-[360px] lg:h-[450px] object-cover shrink-0 snap-center" loading="lazy" />
          ))}
        </div>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur shadow">
          <ChevronLeft size={20} className="text-[#111]" />
        </button>
        <button onClick={() => setFav(!fav)} className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur shadow">
          <Heart size={18} className={fav ? "fill-red-500 text-red-500" : "text-[#6B7280]"} />
        </button>
        {/* Arrows */}
        {imgIdx > 0 && (
          <button onClick={() => scrollTo("left")} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow">
            <ChevronLeft size={16} />
          </button>
        )}
        {imgIdx < photos.length - 1 && (
          <button onClick={() => scrollTo("right")} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow">
            <ChevronRight size={16} />
          </button>
        )}
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full transition ${i === imgIdx ? "bg-white scale-110" : "bg-white/50"}`} />
          ))}
        </div>
      </div>

      {/* INFO */}
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <span className={`text-[10px] font-bold uppercase text-${accentColor}`}>{categoryLabel}</span>
            <h1 className="text-xl font-black text-[#111] leading-tight">{v.titre}</h1>
            <p className="text-xs text-[#6B7280] mt-0.5">{v.sousTitre}</p>
          </div>
          <div className="flex items-center gap-1 bg-[#FEFCE8] px-2 py-1 rounded-lg">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-[#111]">{v.note}</span>
            <span className="text-[10px] text-[#6B7280]">({v.nbAvis})</span>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {v.badges.map((b) => (
            <span key={b} className="rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* TARIFS */}
      <div className="mx-4 mt-5 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#D4AF37] px-4 py-2.5">
          <h2 className="text-sm font-bold text-white">Tarifs de location</h2>
        </div>
        <div className="p-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-3 text-center min-w-[80px]">
              <p className="text-[10px] text-[#6B7280] uppercase">Jour</p>
              <p className="text-lg font-black text-[#111]">{v.prixJour} €</p>
            </div>
            <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-3 text-center min-w-[80px]">
              <p className="text-[10px] text-[#6B7280] uppercase">3 Jours</p>
              <p className="text-lg font-black text-[#111]">{Math.round(v.prixJour * 2.7)} €</p>
            </div>
            <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-3 text-center min-w-[80px]">
              <p className="text-[10px] text-[#6B7280] uppercase">Semaine</p>
              <p className="text-lg font-black text-[#111]">{v.prixSemaine} €</p>
            </div>
            <div className="shrink-0 rounded-lg bg-[#F5F3EF] p-3 text-center min-w-[80px]">
              <p className="text-[10px] text-[#6B7280] uppercase">2 Sem.</p>
              <p className="text-lg font-black text-[#111]">{Math.round(v.prixSemaine * 1.8)} €</p>
            </div>
            <div className="shrink-0 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 text-center min-w-[80px]">
              <p className="text-[10px] text-[#D4AF37] uppercase font-semibold">Mois</p>
              <p className="text-lg font-black text-[#D4AF37]">{v.prixMois} €</p>
            </div>
            <div className="shrink-0 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 p-3 text-center min-w-[80px]">
              <p className="text-[10px] text-[#D4AF37] uppercase font-semibold">3 Mois</p>
              <p className="text-lg font-black text-[#D4AF37]">{Math.round(v.prixMois * 2.7)} €</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[#6B7280]">* km illimité inclus sauf mention contraire. Assurance incluse.</p>
        </div>
      </div>

      {/* CARACTÉRISTIQUES */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-[#E5E7EB] p-4">
        <h2 className="text-base font-bold text-[#111] mb-3">Caractéristiques</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#D4AF37]" />
            <div><p className="text-[10px] text-[#6B7280]">Année</p><p className="text-sm font-bold text-[#111]">{v.annee}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Fuel size={14} className="text-[#D4AF37]" />
            <div><p className="text-[10px] text-[#6B7280]">Carburant</p><p className="text-sm font-bold text-[#111]">{v.carburant}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-[#D4AF37]" />
            <div><p className="text-[10px] text-[#6B7280]">Transmission</p><p className="text-sm font-bold text-[#111]">{v.transmission}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge size={14} className="text-[#D4AF37]" />
            <div><p className="text-[10px] text-[#6B7280]">Puissance</p><p className="text-sm font-bold text-[#111]">{v.puissance}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#D4AF37]" />
            <div><p className="text-[10px] text-[#6B7280]">Places</p><p className="text-sm font-bold text-[#111]">{v.places}</p></div>
          </div>
        </div>
      </div>

      {/* ÉQUIPEMENTS */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-[#E5E7EB] p-4">
        <h2 className="text-base font-bold text-[#111] mb-3">Équipements</h2>
        <div className="grid grid-cols-2 gap-2">
          {EQUIPEMENTS.map((e) => (
            <div key={e} className="flex items-center gap-2">
              <Check size={12} className="text-green-600 shrink-0" />
              <span className="text-xs text-[#374151]">{e}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AVIS */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-[#E5E7EB] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#111]">Avis clients</h2>
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-bold">{v.note}/5</span>
            <span className="text-xs text-[#6B7280]">({v.nbAvis})</span>
          </div>
        </div>
        <div className="space-y-3">
          {AVIS.map((a, i) => (
            <div key={i} className="border-t border-[#F3F4F6] pt-3 first:border-0 first:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111]">{a.nom}</span>
                <span className="text-[10px] text-[#6B7280]">{a.date}</span>
              </div>
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: a.note }).map((_, j) => <Star key={j} size={10} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="mt-1 text-xs text-[#374151]">{a.texte}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CONDITIONS */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-[#E5E7EB] p-4">
        <h2 className="text-base font-bold text-[#111] mb-3">Conditions de location</h2>
        <div className="space-y-2">
          {[
            { icon: FileCheck, label: "Permis de conduire valide" },
            { icon: Shield, label: "Assurance tous risques incluse" },
            { icon: CreditCard, label: "Caution par empreinte bancaire" },
            { icon: Clock, label: "Annulation gratuite 48h avant" },
            { icon: MapPin, label: "Livraison possible (option)" },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-2.5">
              <c.icon size={14} className="text-[#D4AF37] shrink-0" />
              <span className="text-xs text-[#374151]">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PUBLICITÉ */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{height: '110px', background: 'linear-gradient(135deg, #111 0%, #2d3436 100%)'}}>
        <div className="flex items-center justify-between h-full px-5">
          <div>
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Publicité MKA.P-MS</p>
            <p className="text-sm font-extrabold text-white mt-1">Assurance auto tous risques</p>
            <p className="text-[10px] text-white/60 mt-0.5">Protection complète dès 29€/mois</p>
            <button className="mt-2 rounded-full bg-[#D4AF37] px-4 py-1 text-[10px] font-bold text-[#111]" onClick={() => navigate("/services")}>En savoir plus</button>
          </div>
          <div className="text-4xl">🛡️</div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F3F4F6]">
          <h2 className="text-base font-bold text-[#111]">Questions fréquentes</h2>
        </div>
        {[
          { q: "Comment réserver ?", a: "Sélectionnez vos dates, validez le paiement en ligne. Confirmation immédiate par email et SMS." },
          { q: "Quels documents fournir ?", a: "Permis de conduire, pièce d'identité, justificatif de domicile. Pour les pros : KBIS ou SIRET." },
          { q: "Kilométrage inclus ?", a: "Km illimité sur la plupart des formules. Vérifiez les conditions spécifiques sur la fiche tarif." },
          { q: "Que se passe-t-il en cas de panne ?", a: "Assistance 24h/24 incluse. Véhicule de remplacement sous 24h selon disponibilité." },
        ].map((f, i) => (
          <div key={i} className="border-b border-[#F3F4F6] last:border-0">
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-[#111] text-left">{f.q}</span>
              <ChevronDown size={16} className={`text-red-500 transition ${openFaq === i ? "rotate-180" : ""}`} />
            </button>
            {openFaq === i && <p className="px-4 pb-3 text-xs text-[#6B7280]">{f.a}</p>}
          </div>
        ))}
      </div>

      {/* CTA FIXE */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] p-4 z-50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] text-[#6B7280] uppercase">À partir de</p>
            <p className="text-xl font-black text-[#D4AF37]">{v.prixJour} €<span className="text-xs font-normal text-[#6B7280]"> /jour</span></p>
          </div>
          <p className="text-xs text-[#6B7280]">{v.prixMois} € /mois</p>
        </div>
        <button className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-extrabold text-white active:scale-[0.98] transition shadow-lg">
          Réserver maintenant
        </button>
      </div>
    </div>
  );
}
