import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ChevronDown, Gavel, Shield, Clock, Users,
  AlertCircle, Star, CheckCircle, ArrowRight, Eye, Lock, Building2,
  FileText, Filter, Search, MapPin, Truck, RefreshCcw, Car, Wrench,
  ArrowLeft, Info, Phone, MessageSquare, X, Camera, CreditCard, Package,
  Calendar, Bell, BarChart3, Download, ExternalLink, Settings, Zap,
  Heart, Share2, Bookmark, AlertTriangle, CheckCircle2, XCircle,
  MinusCircle, HelpCircle, Fuel, Gauge, Hash, Navigation, DollarSign,
  Receipt, ClipboardList, History, Award, TrendingUp, Activity,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { DocumentView, buildFactureData } from "../components/DocumentPDF";

/* ═══════════════════════════════════════════════════════════
   ACHETEURS AUTORISÉS
   ═══════════════════════════════════════════════════════════ */
const ACHETEURS = [
  { id: "garage", label: "Garages", icon: Wrench },
  { id: "marchand", label: "Marchands automobiles", icon: Car },
  { id: "exportateur", label: "Exportateurs", icon: Truck },
  { id: "carrossier", label: "Carrossiers", icon: Building2 },
  { id: "casse", label: "Casse automobile agréée", icon: RefreshCcw },
  { id: "pro_valide", label: "Professionnels validés", icon: Shield },
];

/* ═══════════════════════════════════════════════════════════
   CATÉGORIES ENCHÈRES
   ═══════════════════════════════════════════════════════════ */
const CATEGORIES = [
  { id: "reprise", label: "Reprise client", color: "bg-amber-500", badge: "REPRISE CLIENT" },
  { id: "stock", label: "Stock MKA.P-MS", color: "bg-[#D4AF37]", badge: "STOCK MKA.P-MS" },
  { id: "flotte", label: "Flotte location", color: "bg-blue-500", badge: "FLOTTE" },
  { id: "accidente", label: "Véhicule accidenté", color: "bg-red-500", badge: "ACCIDENTÉ" },
  { id: "mecanique", label: "Véhicule mécanique", color: "bg-orange-500", badge: "MÉCANIQUE" },
  { id: "carrosserie", label: "Véhicule carrosserie", color: "bg-pink-500", badge: "CARROSSERIE" },
  { id: "export", label: "Export", color: "bg-emerald-500", badge: "EXPORT" },
  { id: "lot", label: "Lot professionnel", color: "bg-purple-600", badge: "LOT PRO" },
  { id: "roulant", label: "Véhicule roulant", color: "bg-green-500", badge: "ROULANT" },
  { id: "non_roulant", label: "Véhicule non roulant", color: "bg-slate-600", badge: "NON ROULANT" },
];

/* ═══════════════════════════════════════════════════════════
   ÉTAT VÉHICULE STATUTS
   ═══════════════════════════════════════════════════════════ */
type EtatStatut = "bon" | "moyen" | "a_prevoir" | "a_reparer" | "non_controle";
const ETAT_LABELS: Record<EtatStatut, { label: string; color: string; icon: typeof CheckCircle }> = {
  bon: { label: "Bon", color: "text-green-600 bg-green-50", icon: CheckCircle },
  moyen: { label: "Moyen", color: "text-amber-600 bg-amber-50", icon: MinusCircle },
  a_prevoir: { label: "À prévoir", color: "text-orange-600 bg-orange-50", icon: AlertTriangle },
  a_reparer: { label: "À réparer", color: "text-red-600 bg-red-50", icon: XCircle },
  non_controle: { label: "Non contrôlé", color: "text-slate-500 bg-slate-50", icon: HelpCircle },
};

/* ═══════════════════════════════════════════════════════════
   LOTS DEMO ENRICHIS
   ═══════════════════════════════════════════════════════════ */
interface VehiculeLot { marque: string; modele: string; annee: number; km: number; etat: string; }
interface EtatVehicule {
  mecanique: EtatStatut; carrosserie: EtatStatut; interieur: EtatStatut;
  pneus: EtatStatut; vitrage: EtatStatut; electronique: EtatStatut;
  documents: EtatStatut; roulage: EtatStatut;
}
interface LotType {
  id: number; titre: string; categorie: string; nbVehicules: number;
  miseDepart: number; offreActuelle: number; encheres: number; encherisseurs: number;
  heureDebut: string; heureFin: string; fin: string;
  photo: string; photos: string[];
  photosCategories: { exterieur: string[]; interieur: string[]; moteur: string[]; coffre: string[]; tableau_bord: string[]; dommages: string[]; documents: string[]; pneus: string[] };
  marque: string; modele: string; version: string; annee: string;
  km: string; energie: string; boite: string; puissance: string;
  typeVehicule: "auto" | "moto" | "utilitaire" | "camion" | "quad";
  cylindree?: string; nbRoues?: string; ptac?: string; nbEssieux?: string; hauteur?: string;
  vin: string; localisation: string;
  etatGeneral: string; roulant: boolean;
  etatDetail: EtatVehicule;
  description: string;
  rapportDefauts: string[]; rapportTravaux: string[]; rapportEstimation: number;
  rapportDocuments: string[]; rapportRemarques: string[];
  vehicules: VehiculeLot[];
  badges: string[];
  palier: number;
}

const LOTS: LotType[] = [
  {
    id: 1, titre: "Lot 5 véhicules — Reprises garage",
    categorie: "lot", nbVehicules: 5, miseDepart: 8500, offreActuelle: 12400,
    encheres: 14, encherisseurs: 6,
    heureDebut: "09/06/2026 10:00", heureFin: "11/06/2026 18:00", fin: "2j 0h",
    photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&h=400&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80",
      "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=600&q=80",
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80",
    ],
    marque: "Diverses", modele: "Lot mixte", version: "Voir détails", annee: "2016-2020",
    km: "85 000 - 180 000", energie: "Diesel / Essence", boite: "Manuelle / Auto",
    puissance: "90 - 150 ch", typeVehicule: "auto", vin: "VF1****", localisation: "Nanterre (92)",
    etatGeneral: "À remettre en état", roulant: false,
    etatDetail: { mecanique: "a_reparer", carrosserie: "moyen", interieur: "bon", pneus: "a_prevoir", vitrage: "bon", electronique: "moyen", documents: "bon", roulage: "a_reparer" },
    photosCategories: { exterieur: ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80", "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80"], interieur: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80"], moteur: ["https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=600&q=80"], coffre: [], tableau_bord: ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80"], dommages: ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80"], documents: [], pneus: [] },
    description: "Lot de 5 véhicules de reprise nécessitant des travaux mécaniques et carrosserie. Idéal pour garages, marchands ou exportateurs.",
    rapportDefauts: ["Distribution à faire sur 2 véhicules", "Embrayage usé (Mégane)", "Turbo HS (C4 Cactus)", "Boîte de vitesse bruyante (Golf)", "Moteur consommation d'huile (Focus)"],
    rapportTravaux: ["Distribution x2 : ~1 200 €", "Embrayage : ~800 €", "Turbo remplacement : ~1 500 €", "Boîte reconditionnée : ~1 800 €", "Moteur à réviser : ~600 €"],
    rapportEstimation: 5900,
    rapportDocuments: ["Carte grise x5", "Contrôle technique x3 (2 sans)", "Carnet entretien x2"],
    rapportRemarques: ["Véhicules stockés en extérieur", "Kilométrages vérifiés HistoVec", "Lot non divisible"],
    vehicules: [
      { marque: "Peugeot", modele: "308 SW", annee: 2018, km: 95000, etat: "Distribution à faire" },
      { marque: "Renault", modele: "Mégane IV", annee: 2019, km: 85000, etat: "Embrayage usé" },
      { marque: "Citroën", modele: "C4 Cactus", annee: 2017, km: 110000, etat: "Turbo HS" },
      { marque: "Volkswagen", modele: "Golf VII", annee: 2016, km: 140000, etat: "Boîte bruyante" },
      { marque: "Ford", modele: "Focus III", annee: 2018, km: 105000, etat: "Consommation d'huile" },
    ],
    badges: ["LOT PRO", "NON ROULANT", "REPRISE CLIENT"],
    palier: 200,
  },
  {
    id: 2, titre: "BMW 320d — Accident léger AVD",
    categorie: "accidente", nbVehicules: 1, miseDepart: 6000, offreActuelle: 8200,
    encheres: 8, encherisseurs: 4,
    heureDebut: "09/06/2026 14:00", heureFin: "12/06/2026 14:00", fin: "3j 0h",
    photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80",
    ],
    marque: "BMW", modele: "Série 3", version: "320d Sport", annee: "2019",
    km: "78 000", energie: "Diesel", boite: "Automatique", puissance: "190 ch",
    typeVehicule: "auto", vin: "WBA8****", localisation: "Boulogne (92)",
    etatGeneral: "Accident léger avant-droit", roulant: true,
    etatDetail: { mecanique: "bon", carrosserie: "a_reparer", interieur: "bon", pneus: "bon", vitrage: "a_prevoir", electronique: "bon", documents: "bon", roulage: "bon" },
    photosCategories: { exterieur: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80"], interieur: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80"], moteur: [], coffre: [], tableau_bord: [], dommages: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80"], documents: [], pneus: [] },
    description: "BMW 320d accidentée côté avant droit. Mécanique parfaite, carrosserie à refaire. Très bonne affaire pour carrossier.",
    rapportDefauts: ["Aile avant droite enfoncée", "Pare-chocs avant fissuré", "Phare AV droit cassé", "Léger décalage capot"],
    rapportTravaux: ["Aile AV droite : ~350 €", "Pare-chocs AV : ~280 €", "Phare AV droit : ~400 €", "Peinture : ~600 €", "Main d'œuvre : ~500 €"],
    rapportEstimation: 2130,
    rapportDocuments: ["Carte grise", "Contrôle technique OK", "Carnet entretien BMW", "Factures entretien"],
    rapportRemarques: ["Mécanique parfaite", "Entretien BMW suivi", "Pneus neufs", "Boîte auto ZF 8HP parfaite"],
    vehicules: [{ marque: "BMW", modele: "320d Sport", annee: 2019, km: 78000, etat: "Aile + pare-chocs + phare AVD" }],
    badges: ["ENCHÈRE PRO", "CARROSSERIE", "ROULANT"],
    palier: 200,
  },
  {
    id: 3, titre: "Renault Clio V — Bielle coulée",
    categorie: "mecanique", nbVehicules: 1, miseDepart: 2500, offreActuelle: 3800,
    encheres: 11, encherisseurs: 7,
    heureDebut: "08/06/2026 10:00", heureFin: "10/06/2026 18:00", fin: "1j 0h",
    photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=600&h=400&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=600&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
    ],
    marque: "Renault", modele: "Clio V", version: "1.0 TCe 100", annee: "2021",
    km: "45 000", energie: "Essence", boite: "Manuelle", puissance: "100 ch",
    typeVehicule: "auto", vin: "VF1R****", localisation: "Courbevoie (92)",
    etatGeneral: "Panne moteur — bielle coulée", roulant: false,
    etatDetail: { mecanique: "a_reparer", carrosserie: "bon", interieur: "bon", pneus: "bon", vitrage: "bon", electronique: "bon", documents: "bon", roulage: "a_reparer" },
    photosCategories: { exterieur: ["https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=600&q=80"], interieur: [], moteur: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80"], coffre: [], tableau_bord: [], dommages: ["https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=600&q=80"], documents: [], pneus: [] },
    description: "Clio V récente, panne moteur importante. Carrosserie et intérieur impeccables. Idéale pour garage spécialisé ou exportateur.",
    rapportDefauts: ["Bielle coulée — moteur hors service", "Voyant moteur allumé", "Huile dans liquide de refroidissement"],
    rapportTravaux: ["Moteur échange standard : ~2 500 €", "Main d'œuvre : ~800 €", "Fluides et filtres : ~150 €"],
    rapportEstimation: 3450,
    rapportDocuments: ["Carte grise", "Pas de CT (véhicule récent)", "Carnet entretien Renault"],
    rapportRemarques: ["Carrosserie impeccable", "Intérieur comme neuf", "45 000 km réels vérifiés"],
    vehicules: [{ marque: "Renault", modele: "Clio V", annee: 2021, km: 45000, etat: "Bielle coulée — moteur HS" }],
    badges: ["ENCHÈRE PRO", "MÉCANIQUE", "NON ROULANT"],
    palier: 100,
  },
  {
    id: 4, titre: "Lot 3 — Fin de flotte location",
    categorie: "flotte", nbVehicules: 3, miseDepart: 15000, offreActuelle: 19500,
    encheres: 6, encherisseurs: 3,
    heureDebut: "09/06/2026 08:00", heureFin: "13/06/2026 18:00", fin: "4j 0h",
    photo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80",
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80",
    ],
    marque: "Diverses", modele: "Flotte MKA.P-MS", version: "", annee: "2021-2022",
    km: "120 000 - 160 000", energie: "Diesel", boite: "Manuelle / Auto",
    puissance: "110 - 180 ch", typeVehicule: "auto", vin: "VF1****", localisation: "Nanterre (92)",
    etatGeneral: "Fin de cycle — amortis", roulant: true,
    etatDetail: { mecanique: "moyen", carrosserie: "moyen", interieur: "moyen", pneus: "a_prevoir", vitrage: "bon", electronique: "bon", documents: "bon", roulage: "bon" },
    photosCategories: { exterieur: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80", "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80"], interieur: ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80"], moteur: [], coffre: [], tableau_bord: [], dommages: [], documents: [], pneus: [] },
    description: "3 véhicules flotte location MKA.P-MS en fin de cycle. Entretien constructeur suivi. Parfait pour revente ou export.",
    rapportDefauts: ["Kilométrage élevé", "Traces d'usure normales location", "Pneus à remplacer sur 2 véhicules", "Distribution à prévoir (C5 Aircross)"],
    rapportTravaux: ["Pneus x8 : ~520 €", "Distribution C5 Aircross : ~650 €", "Révision complète x3 : ~450 €"],
    rapportEstimation: 1620,
    rapportDocuments: ["Cartes grises x3", "CT OK x3", "Carnet entretien constructeur x3", "Historique location"],
    rapportRemarques: ["Entretien constructeur suivi", "Kilométrages réels vérifiés", "Lot non divisible"],
    vehicules: [
      { marque: "Peugeot", modele: "3008 GT", annee: 2021, km: 125000, etat: "Entretien OK — pneus à changer" },
      { marque: "Renault", modele: "Kadjar", annee: 2022, km: 135000, etat: "Révision complète faite" },
      { marque: "Citroën", modele: "C5 Aircross", annee: 2021, km: 155000, etat: "Distribution à prévoir" },
    ],
    badges: ["LOT PRO", "FLOTTE", "ROULANT"],
    palier: 500,
  },
  {
    id: 5, titre: "Mercedes Classe A 180d — Export",
    categorie: "export", nbVehicules: 1, miseDepart: 9000, offreActuelle: 11200,
    encheres: 9, encherisseurs: 5,
    heureDebut: "09/06/2026 10:00", heureFin: "12/06/2026 10:00", fin: "3j 0h",
    photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&h=400&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80",
    ],
    marque: "Mercedes", modele: "Classe A", version: "180d AMG Line", annee: "2022",
    km: "140 000", energie: "Diesel", boite: "Automatique", puissance: "116 ch",
    typeVehicule: "auto", vin: "WDD1****", localisation: "Sèvres (92)",
    etatGeneral: "Fin de contrat location — haute km", roulant: true,
    etatDetail: { mecanique: "bon", carrosserie: "moyen", interieur: "moyen", pneus: "a_prevoir", vitrage: "bon", electronique: "bon", documents: "bon", roulage: "bon" },
    photosCategories: { exterieur: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80"], interieur: ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80"], moteur: [], coffre: [], tableau_bord: [], dommages: [], documents: [], pneus: [] },
    description: "Mercedes Classe A 180d AMG Line, retour location longue durée. Kilométrage élevé mais mécanique irréprochable. Export possible.",
    rapportDefauts: ["Kilométrage élevé", "Micro-rayures carrosserie", "Siège conducteur légèrement usé", "Pneus avant à remplacer"],
    rapportTravaux: ["Pneus avant x2 : ~300 €", "Lustrage carrosserie : ~200 €", "Nettoyage cuir : ~100 €"],
    rapportEstimation: 600,
    rapportDocuments: ["Carte grise", "CT OK", "Carnet entretien Mercedes", "Historique complet"],
    rapportRemarques: ["Mécanique Mercedes irréprochable", "Boîte DCT parfaite", "Idéal export Afrique"],
    vehicules: [{ marque: "Mercedes", modele: "Classe A 180d AMG Line", annee: 2022, km: 140000, etat: "Fin de location — bon état" }],
    badges: ["ENCHÈRE PRO", "EXPORT", "STOCK MKA.P-MS"],
    palier: 200,
  },
  {
    id: 6, titre: "Citroën C3 Aircross — Carrosserie",
    categorie: "carrosserie", nbVehicules: 1, miseDepart: 4000, offreActuelle: 5100,
    encheres: 5, encherisseurs: 3,
    heureDebut: "09/06/2026 08:00", heureFin: "11/06/2026 18:00", fin: "2j 0h",
    photo: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&h=400&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80",
    ],
    marque: "Citroën", modele: "C3 Aircross", version: "1.2 PureTech 110", annee: "2020",
    km: "92 000", energie: "Essence", boite: "Manuelle", puissance: "110 ch",
    typeVehicule: "auto", vin: "VF7S****", localisation: "Levallois (92)",
    etatGeneral: "Carrosserie endommagée — mécanique OK", roulant: true,
    etatDetail: { mecanique: "bon", carrosserie: "a_reparer", interieur: "bon", pneus: "moyen", vitrage: "bon", electronique: "bon", documents: "bon", roulage: "bon" },
    photosCategories: { exterieur: ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80"], interieur: [], moteur: [], coffre: [], tableau_bord: [], dommages: ["https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80", "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80"], documents: [], pneus: [] },
    description: "C3 Aircross avec carrosserie endommagée sur côté gauche. Mécanique parfaitement fonctionnelle.",
    rapportDefauts: ["Porte AVG enfoncée", "Aile AVG rayée", "Rétroviseur AVG cassé", "Peinture à refaire côté gauche"],
    rapportTravaux: ["Porte AVG : ~400 €", "Aile AVG : ~250 €", "Rétroviseur : ~120 €", "Peinture côté G : ~600 €", "Main d'œuvre : ~350 €"],
    rapportEstimation: 1720,
    rapportDocuments: ["Carte grise", "CT OK", "Carnet entretien"],
    rapportRemarques: ["Mécanique parfaite", "Intérieur propre", "Roulant sans problème"],
    vehicules: [{ marque: "Citroën", modele: "C3 Aircross", annee: 2020, km: 92000, etat: "Carrosserie AVG endommagée" }],
    badges: ["ENCHÈRE PRO", "CARROSSERIE", "ROULANT"],
    palier: 100,
  },
];

/* Enchères remportées demo */
interface EnchereRemportee {
  lotId: number; titre: string; montant: number; date: string;
  statut: "remportee" | "paiement_attente" | "paye" | "retrait_programme" | "livre" | "cloture";
}
const MES_ENCHERES_DEMO: EnchereRemportee[] = [
  { lotId: 10, titre: "Peugeot 208 — Reprise client", montant: 4200, date: "05/06/2026", statut: "paye" },
  { lotId: 11, titre: "Lot 2 utilitaires — Flotte", montant: 8900, date: "02/06/2026", statut: "livre" },
  { lotId: 12, titre: "Dacia Duster — Mécanique", montant: 3100, date: "31/05/2026", statut: "cloture" },
];

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  remportee: { label: "Enchère remportée", color: "text-green-700 bg-green-50" },
  paiement_attente: { label: "Paiement en attente", color: "text-amber-700 bg-amber-50" },
  paye: { label: "Payé", color: "text-blue-700 bg-blue-50" },
  retrait_programme: { label: "Retrait programmé", color: "text-purple-700 bg-purple-50" },
  livre: { label: "Livré", color: "text-green-700 bg-green-50" },
  cloture: { label: "Dossier clôturé", color: "text-slate-600 bg-slate-100" },
};

export default function VenteEncheres() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const [mode, setMode] = useState<"landing" | "lots" | "detail" | "mes_encheres" | "remportes" | "conditions" | "prochaines" | "photos" | "vehicule_detail">("landing");
  const [viewFactureEnchere, setViewFactureEnchere] = useState<EnchereRemportee | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [watchList, setWatchList] = useState<number[]>([]);

  /* Filtres */
  const [filterCat, setFilterCat] = useState("");
  const [filterMarque, setFilterMarque] = useState("");
  const [filterEnergie, setFilterEnergie] = useState("");
  const [filterRoulant, setFilterRoulant] = useState("");
  const [filterPrixMax, setFilterPrixMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  /* Enchère */
  const [enchereInput, setEnchereInput] = useState("");
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [bidHistory] = useState<{ montant: number; heure: string; pro: string }[]>([
    { montant: 12400, heure: "14:32", pro: "Enchérisseur #7" },
    { montant: 12200, heure: "14:15", pro: "Enchérisseur #3" },
    { montant: 12000, heure: "13:48", pro: "Enchérisseur #5" },
    { montant: 11500, heure: "12:20", pro: "Enchérisseur #7" },
    { montant: 11000, heure: "11:05", pro: "Enchérisseur #2" },
    { montant: 10500, heure: "10:30", pro: "Enchérisseur #3" },
    { montant: 10000, heure: "10:00", pro: "Enchérisseur #5" },
  ]);

  /* Photo viewer */
  const [photoIdx, setPhotoIdx] = useState(0);
  const [photoCat, setPhotoCat] = useState("exterieur");
  const [selectedVehiculeIdx, setSelectedVehiculeIdx] = useState<number | null>(null);

  const selectedLot = LOTS.find((l) => l.id === selectedLotId);
  const isPro = user?.accountType === "professionnel" || user?.accountType === "admin";

  const filteredLots = useMemo(() => {
    return LOTS.filter((l) => {
      if (filterCat && l.categorie !== filterCat) return false;
      if (filterMarque && !l.marque.toLowerCase().includes(filterMarque.toLowerCase())) return false;
      if (filterEnergie && !l.energie.toLowerCase().includes(filterEnergie.toLowerCase())) return false;
      if (filterRoulant === "roulant" && !l.roulant) return false;
      if (filterRoulant === "non_roulant" && l.roulant) return false;
      if (filterPrixMax && l.miseDepart > Number(filterPrixMax)) return false;
      return true;
    });
  }, [filterCat, filterMarque, filterEnergie, filterRoulant, filterPrixMax]);

  const ToastEl = toast ? (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-2xl animate-pulse max-w-sm text-center">{toast}</div>
  ) : null;

  /* ════════════════════════════════════════════════════════════
     PAGE D'ACCUEIL — MKA.P-MS Enchères Pro
     ════════════════════════════════════════════════════════════ */
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-[#0a0a14]">{ToastEl}
        {/* HERO */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f3c] via-[#0d0820] to-[#0a0a14]" />
          <div className="absolute inset-0 opacity-10">
            <img src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="relative px-4 py-12 md:py-20 md:px-8 max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 mb-6">
              <Lock size={12} className="text-purple-400" />
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Espace professionnel réservé</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
              MK<span className="text-[#D4AF37]">A</span>.P-MS<br />
              <span className="text-purple-400">ENCHÈRES PRO</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-white/50 max-w-lg mx-auto">
              Véhicules professionnels, reprises, flottes et lots réservés aux professionnels validés.
            </p>
          </div>
        </div>

        {/* 5 BOUTONS PRINCIPAUX */}
        <div className="px-4 md:px-8 max-w-4xl mx-auto -mt-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Enchères en cours", icon: Gavel, mode: "lots" as const, color: "from-purple-600 to-purple-800" },
              { label: "Prochaines ventes", icon: Calendar, mode: "prochaines" as const, color: "from-blue-600 to-blue-800" },
              { label: "Mes enchères", icon: Activity, mode: "mes_encheres" as const, color: "from-amber-600 to-amber-800" },
              { label: "Véhicules remportés", icon: Award, mode: "remportes" as const, color: "from-green-600 to-green-800" },
              { label: "Conditions d'accès", icon: FileText, mode: "conditions" as const, color: "from-slate-600 to-slate-800" },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => {
                  if (!user) { navigate("/connexion"); return; }
                  setMode(b.mode);
                }}
                className={`rounded-2xl bg-gradient-to-br ${b.color} p-5 text-left hover:opacity-90 transition shadow-lg`}
              >
                <b.icon size={22} className="text-white/80 mb-2" />
                <h3 className="text-sm font-bold text-white">{b.label}</h3>
              </button>
            ))}
          </div>
        </div>

        {/* CATÉGORIES */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-12">
          <h2 className="text-lg font-extrabold text-white text-center mb-6">CATÉGORIES DE VÉHICULES</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => { setFilterCat(c.id); setMode("lots"); }}
                className="rounded-xl bg-white/5 border border-white/10 p-4 text-center hover:bg-white/10 transition">
                <span className={`inline-block rounded-full ${c.color} px-3 py-1 text-[9px] font-bold text-white mb-2`}>{c.badge}</span>
                <p className="text-xs text-white/70">{c.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ACCÈS AUTORISÉ */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-12">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 md:p-8">
            <h2 className="text-lg font-extrabold text-white text-center mb-4">QUI PEUT ENCHÉRIR ?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ACHETEURS.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <a.icon size={18} className="text-purple-400 shrink-0" />
                  <span className="text-sm text-white/80">{a.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
              <p className="text-xs text-red-400 font-bold">❌ Particuliers non autorisés — Vérification SIRET/KBIS obligatoire</p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-12 mb-12">
          <div className="grid grid-cols-4 gap-4">
            {[
              { val: `${LOTS.length}`, label: "Lots en cours" },
              { val: `${LOTS.reduce((s, l) => s + l.encherisseurs, 0)}`, label: "Enchérisseurs" },
              { val: `${LOTS.reduce((s, l) => s + l.nbVehicules, 0)}`, label: "Véhicules" },
              { val: `${Math.round(LOTS.reduce((s, l) => s + l.offreActuelle, 0) / 1000)}k €`, label: "Volume" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-[#D4AF37]">{s.val}</p>
                <p className="text-[10px] text-white/40 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     CONDITIONS D'ACCÈS
     ════════════════════════════════════════════════════════════ */
  if (mode === "conditions") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("landing")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-purple-400" /> Conditions d'accès</h1>
        </div>
        <div className="px-4 mt-6 max-w-3xl mx-auto space-y-4">
          {[
            { title: "Qui peut participer ?", items: ["Garages et ateliers mécaniques validés", "Marchands automobiles avec SIRET/KBIS", "Carrossiers agréés", "Exportateurs avec licence", "Centres de recyclage agréés (casse)", "Tout professionnel avec documents vérifiés"], icon: Users },
            { title: "Documents requis", items: ["SIRET ou KBIS valide", "Pièce d'identité du gérant", "Justificatif de domicile professionnel", "Attestation d'assurance RC Pro", "RIB professionnel", "Acceptation des CGV enchères"], icon: FileText },
            { title: "Règles d'enchère", items: ["Enchère minimum = prix de départ", "Palier d'enchère par lot (100€ à 500€)", "Surenchère automatique possible", "Clôture automatique à l'heure prévue", "Prolongation de 5 min si enchère dans la dernière minute", "Enchère irrévocable une fois placée"], icon: Gavel },
            { title: "Après enchère remportée", items: ["Paiement sous 48h obligatoire", "Enlèvement sous 72h après paiement", "Transport possible (frais en sus)", "Facture automatique", "Véhicule vendu en l'état — sans garantie", "Aucune vente à particulier autorisée"], icon: CreditCard },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><s.icon size={16} className="text-purple-400" /> {s.title}</h3>
              <ul className="space-y-2">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-white/60"><CheckCircle size={12} className="text-purple-400 mt-0.5 shrink-0" /> {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MES ENCHÈRES (Tableau de bord pro)
     ════════════════════════════════════════════════════════════ */
  if (mode === "mes_encheres") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("landing")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Activity size={20} className="text-purple-400" /> Tableau de bord</h1>
        </div>

        {/* Stats */}
        <div className="px-4 mt-6 grid grid-cols-4 gap-2">
          {[
            { val: "3", label: "Suivies", color: "text-blue-400" },
            { val: "2", label: "En cours", color: "text-purple-400" },
            { val: "1", label: "Gagnées", color: "text-green-400" },
            { val: "2", label: "Perdues", color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-[9px] text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="px-4 mt-6 space-y-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Enchères suivies</h3>
            {LOTS.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 cursor-pointer" onClick={() => { setSelectedLotId(l.id); setMode("detail"); }}>
                <img src={l.photo} alt="" className="h-10 w-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{l.titre}</p><p className="text-[10px] text-white/40">{l.fin} restant</p></div>
                <p className="text-xs font-bold text-purple-400">{l.offreActuelle.toLocaleString("fr-FR")} €</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Paiements à effectuer</h3>
            <div className="flex items-center gap-3 py-2">
              <DollarSign size={16} className="text-amber-400" />
              <div className="flex-1"><p className="text-xs font-bold text-white">Aucun paiement en attente</p><p className="text-[10px] text-white/40">Vos paiements sont à jour</p></div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Factures et documents</h3>
            {MES_ENCHERES_DEMO.filter((e) => e.statut !== "paiement_attente").map((e) => (
              <div key={e.lotId} onClick={() => setMode("remportes")} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 transition rounded-lg px-2">
                <Receipt size={14} className="text-white/40" />
                <div className="flex-1"><p className="text-xs font-bold text-white">{e.titre}</p><p className="text-[10px] text-white/40">{e.date} — {e.montant.toLocaleString("fr-FR")} €</p></div>
                <button onClick={(ev) => { ev.stopPropagation(); setViewFactureEnchere(e); }} className="text-[10px] text-purple-400 font-bold hover:text-purple-300 transition">PDF</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     VÉHICULES REMPORTÉS
     ════════════════════════════════════════════════════════════ */
  if (mode === "remportes") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("landing")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} className="text-[#D4AF37]" /> Véhicules remportés</h1>
        </div>
        <div className="px-4 mt-6 space-y-3">
          {MES_ENCHERES_DEMO.map((e) => {
            const st = STATUT_LABELS[e.statut];
            return (
              <div key={e.lotId} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{e.titre}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{e.date}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[9px] font-bold ${st.color}`}>{st.label}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-black text-[#D4AF37]">{e.montant.toLocaleString("fr-FR")} €</p>
                  <div className="flex gap-2">
                    <button onClick={() => setViewFactureEnchere(e)} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/20 transition">Facture</button>
                    <button onClick={() => showToast('Documents du lot telecharges')} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/20 transition">Documents</button>
                  </div>
                </div>
                {e.statut === "paye" && (
                  <div className="mt-3 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                    <p className="text-xs text-blue-400">Retrait disponible · Contactez-nous pour programmer l'enlèvement.</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => showToast('Demande de retrait envoyee — nous vous contacterons sous 24h')} className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-blue-700 transition">Programmer retrait</button>
                      <button onClick={() => showToast('Demande de livraison envoyee — devis transport sous 24h')} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/20 transition">Demander livraison</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     PROCHAINES VENTES
     ════════════════════════════════════════════════════════════ */
  if (mode === "prochaines") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("landing")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-blue-400" /> Prochaines ventes</h1>
        </div>
        <div className="px-4 mt-6 space-y-4">
          {[
            { date: "15/06/2026", titre: "Vente lot reprises #24", lots: 8, vehicules: 15, desc: "Reprises garage juin 2026" },
            { date: "20/06/2026", titre: "Vente flotte location MKA.P-MS", lots: 5, vehicules: 12, desc: "Véhicules de location amortis Q2 2026" },
            { date: "25/06/2026", titre: "Vente export Afrique #12", lots: 6, vehicules: 10, desc: "Véhicules préparés pour l'export" },
          ].map((v) => (
            <div key={v.date} className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{v.titre}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{v.desc}</p>
                </div>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold text-blue-400">{v.date}</span>
              </div>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="text-white/60">{v.lots} lots</span>
                <span className="text-white/60">{v.vehicules} véhicules</span>
              </div>
              <button onClick={() => showToast('Inscription confirmee — vous serez notifie le jour de la vente')} className="mt-3 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition">S'inscrire a la vente</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     LISTE DES LOTS — avec filtres
     ════════════════════════════════════════════════════════════ */
  if (mode === "lots") {
    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => { setMode("landing"); setFilterCat(""); }} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <div className="flex items-center gap-2">
            <Gavel size={20} className="text-purple-400" />
            <h1 className="text-xl font-black text-white">Enchères en cours</h1>
          </div>
          <p className="mt-1 text-sm text-white/50">{filteredLots.length} lot(s) disponible(s)</p>
        </div>

        {!isPro && (
          <div className="mx-4 mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300"><span className="font-bold">Accès restreint.</span> Les enchères sont réservées aux professionnels validés (SIRET/KBIS).</p>
          </div>
        )}

        {/* Filtres catégorie */}
        <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFilterCat("")} className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold transition ${!filterCat ? "bg-purple-600 text-white" : "bg-white/5 border border-white/10 text-white/60"}`}>Tous</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? "" : c.id)} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-bold transition ${filterCat === c.id ? `${c.color} text-white` : "bg-white/5 border border-white/10 text-white/60"}`}>{c.badge}</button>
          ))}
        </div>

        {/* Filtres avancés */}
        <div className="px-4 mt-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 text-xs text-purple-400 font-semibold">
            <Filter size={12} /> Filtres avancés {showFilters ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {showFilters && (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              <input className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none" placeholder="Marque" value={filterMarque} onChange={(e) => setFilterMarque(e.target.value)} />
              <select className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none" value={filterEnergie} onChange={(e) => setFilterEnergie(e.target.value)}>
                <option value="">Énergie</option>
                <option value="diesel">Diesel</option>
                <option value="essence">Essence</option>
              </select>
              <select className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none" value={filterRoulant} onChange={(e) => setFilterRoulant(e.target.value)}>
                <option value="">Roulant / Non</option>
                <option value="roulant">Roulant</option>
                <option value="non_roulant">Non roulant</option>
              </select>
              <input className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none" placeholder="Prix max (€)" type="number" value={filterPrixMax} onChange={(e) => setFilterPrixMax(e.target.value)} />
            </div>
          )}
        </div>

        {/* Lots */}
        <div className="px-4 mt-4 space-y-3">
          {filteredLots.map((l) => {
            const cat = CATEGORIES.find((c) => c.id === l.categorie);
            return (
              <div key={l.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/[0.08] transition cursor-pointer" onClick={() => { setSelectedLotId(l.id); setMode("detail"); setPhotoIdx(0); }}>
                <div className="relative h-[160px]">
                  <img src={l.photo} alt={l.titre} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {l.badges.map((b) => {
                      const bc = CATEGORIES.find((c) => c.badge === b);
                      return <span key={b} className={`rounded-full ${bc?.color || "bg-purple-600"} px-2.5 py-1 text-[8px] font-bold text-white`}>{b}</span>;
                    })}
                  </div>
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold text-white flex items-center gap-1"><Clock size={10} /> {l.fin}</span>
                  {l.nbVehicules > 1 && <span className="absolute bottom-3 left-3 rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-bold text-white">{l.nbVehicules} véhicules</span>}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white">{l.titre}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-white/40">
                    <span>{l.km} km</span>
                    <span>·</span>
                    <span>{l.energie}</span>
                    <span>·</span>
                    <span>{l.annee}</span>
                    <span>·</span>
                    <span>{l.localisation}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/40">{l.etatGeneral}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/5 p-2.5 text-center"><p className="text-[8px] text-white/40">Départ</p><p className="text-sm font-bold text-white">{l.miseDepart.toLocaleString("fr-FR")} €</p></div>
                    <div className="rounded-lg bg-purple-500/10 p-2.5 text-center"><p className="text-[8px] text-purple-400">Offre actuelle</p><p className="text-sm font-black text-purple-400">{l.offreActuelle.toLocaleString("fr-FR")} €</p></div>
                    <div className="rounded-lg bg-white/5 p-2.5 text-center"><p className="text-[8px] text-white/40">Enchérisseurs</p><p className="text-sm font-bold text-white">{l.encherisseurs}</p></div>
                  </div>
                  {l.rapportEstimation > 0 && (
                    <p className="mt-2 text-[10px] text-white/30 flex items-center gap-1"><FileText size={10} /> Rapport disponible · Travaux estimés : {l.rapportEstimation.toLocaleString("fr-FR")} €</p>
                  )}
                </div>
              </div>
            );
          })}
          {filteredLots.length === 0 && <p className="text-center text-white/30 py-12">Aucun lot trouvé avec ces filtres.</p>}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     PAGE PRODUIT ENCHÈRE — 6 blocs
     ════════════════════════════════════════════════════════════ */
  if (mode === "detail" && selectedLot) {
    const nextBid = selectedLot.offreActuelle + selectedLot.palier;

    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("lots")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedLot.badges.map((b) => {
              const bc = CATEGORIES.find((c) => c.badge === b);
              return <span key={b} className={`rounded-full ${bc?.color || "bg-purple-600"} px-2.5 py-1 text-[8px] font-bold text-white`}>{b}</span>;
            })}
          </div>
          <h1 className="text-xl font-black text-white">{selectedLot.titre}</h1>
        </div>

        {/* Photo principale — click ouvre galerie */}
        <div className="px-4 mt-4">
          <div className="rounded-2xl overflow-hidden border border-white/10 relative cursor-pointer" onClick={() => { setPhotoCat("exterieur"); setMode("photos"); }}>
            <img src={selectedLot.photo} alt="" className="w-full h-56 md:h-72 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Camera size={16} className="text-white" />
              <span className="text-sm font-bold text-white">Voir toutes les photos</span>
            </div>
            <span className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white">{selectedLot.photos.length} photos</span>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">

          {/* ═══ BLOC 1 — ENCHÈRE EN COURS ═══ */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gavel size={18} className="text-purple-400" />
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Enchère en cours</h2>
              <span className="ml-auto flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-[10px] font-bold text-red-400"><Clock size={10} /> {selectedLot.fin}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[9px] text-white/40">Prix de départ</p><p className="text-lg font-bold text-white">{selectedLot.miseDepart.toLocaleString("fr-FR")} €</p></div>
              <div className="rounded-xl bg-purple-500/20 border border-purple-500/30 p-3"><p className="text-[9px] text-purple-300">Meilleure offre</p><p className="text-xl font-black text-purple-300">{selectedLot.offreActuelle.toLocaleString("fr-FR")} €</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[9px] text-white/40">Offres</p><p className="text-lg font-bold text-white">{selectedLot.encheres}</p></div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-white/40 mb-4">
              <span>Prochaine mise min. : {nextBid.toLocaleString("fr-FR")} €</span>
              <span>{selectedLot.encherisseurs} pro intéressés</span>
            </div>

            {isPro ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <span className="text-sm font-bold text-white/40 mr-2">€</span>
                    <input className="flex-1 text-lg font-bold text-white outline-none bg-transparent placeholder:text-white/20 min-w-0" placeholder={`Min. ${nextBid.toLocaleString("fr-FR")}`} value={enchereInput} onChange={(e) => setEnchereInput(e.target.value.replace(/[^\d]/g, ""))} />
                  </div>
                  <button className="w-full sm:w-auto rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shrink-0" disabled={!enchereInput || Number(enchereInput) < nextBid} onClick={() => setShowBidConfirm(true)}>
                    <Gavel size={16} /> Enchérir
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { if (selectedLot) { setWatchList(prev => prev.includes(selectedLot.id) ? prev.filter(x => x !== selectedLot.id) : [...prev, selectedLot.id]); showToast(watchList.includes(selectedLot.id) ? 'Retiree de votre liste' : 'Ajoutee a votre liste de suivi'); } }} className={`flex-1 rounded-xl py-2.5 text-[10px] font-bold flex items-center justify-center gap-1 ${selectedLot && watchList.includes(selectedLot.id) ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/10 text-white/60'}`}><Bookmark size={12} /> {selectedLot && watchList.includes(selectedLot.id) ? 'Dans ma liste' : 'Ajouter a ma liste'}</button>
                  <button onClick={() => showToast('Rapport PDF genere — telechargement en cours')} className="flex-1 rounded-xl bg-white/5 border border-white/10 py-2.5 text-[10px] font-bold text-white/60 flex items-center justify-center gap-1"><FileText size={12} /> Voir rapport complet</button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                <Lock size={18} className="text-red-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-red-300">Réservé aux professionnels validés</p>
                <p className="text-[10px] text-red-400/60 mt-1">SIRET/KBIS obligatoire pour enchérir</p>
              </div>
            )}
          </div>

          {/* ═══ BLOC 2 — IDENTITÉ VÉHICULE (adapté par type) ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Car size={16} className="text-[#D4AF37]" /> Identité du véhicule</h2>
            <div className="grid grid-cols-2 gap-2">
              {(() => {
                const base = [
                  { label: "Marque", val: selectedLot.marque },
                  { label: "Modèle", val: selectedLot.modele },
                  { label: "Version", val: selectedLot.version },
                  { label: "Année", val: selectedLot.annee },
                  { label: "Kilométrage", val: `${selectedLot.km} km` },
                  { label: "Énergie", val: selectedLot.energie },
                ];
                const tv = selectedLot.typeVehicule;
                if (tv === "moto" || tv === "quad") {
                  base.push(
                    { label: "Cylindrée", val: selectedLot.cylindree || "—" },
                    { label: "Nombre de roues", val: selectedLot.nbRoues || (tv === "quad" ? "4" : "2") },
                    { label: "Puissance", val: selectedLot.puissance },
                    { label: "Type", val: tv === "quad" ? "Quad" : "Moto" },
                  );
                } else if (tv === "camion") {
                  base.push(
                    { label: "Boîte", val: selectedLot.boite },
                    { label: "Puissance", val: selectedLot.puissance },
                    { label: "PTAC", val: selectedLot.ptac || "—" },
                    { label: "Nombre d'essieux", val: selectedLot.nbEssieux || "—" },
                    { label: "Hauteur", val: selectedLot.hauteur || "—" },
                  );
                } else if (tv === "utilitaire") {
                  base.push(
                    { label: "Boîte", val: selectedLot.boite },
                    { label: "Puissance", val: selectedLot.puissance },
                    { label: "PTAC", val: selectedLot.ptac || "—" },
                    { label: "Volume utile", val: selectedLot.hauteur || "—" },
                  );
                } else {
                  base.push(
                    { label: "Boîte", val: selectedLot.boite },
                    { label: "Puissance", val: selectedLot.puissance },
                  );
                }
                base.push(
                  { label: "VIN", val: selectedLot.vin },
                  { label: "Localisation", val: selectedLot.localisation },
                );
                return base;
              })().filter(f => f.val && f.val !== "—").map((f) => (
                <div key={f.label} className="rounded-lg bg-white/5 p-2.5">
                  <p className="text-[9px] text-white/30">{f.label}</p>
                  <p className="text-xs font-bold text-white">{f.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ BLOC 3 — ÉTAT DU VÉHICULE ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><ClipboardList size={16} className="text-[#D4AF37]" /> État du véhicule</h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(selectedLot.etatDetail) as [string, EtatStatut][]).map(([key, val]) => {
                const e = ETAT_LABELS[val];
                const labels: Record<string, string> = {
                  mecanique: "Mécanique", carrosserie: "Carrosserie", interieur: "Intérieur",
                  pneus: "Pneus", vitrage: "Vitrage", electronique: "Électronique",
                  documents: "Documents", roulage: "Roulage",
                };
                return (
                  <div key={key} className="rounded-lg bg-white/5 p-3 flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${e.color}`}>
                      <e.icon size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] text-white/30">{labels[key] || key}</p>
                      <p className={`text-xs font-bold ${e.color.split(" ")[0]}`}>{e.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ BLOC 4 — RAPPORT MKA.P-MS ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><FileText size={16} className="text-[#D4AF37]" /> Rapport MKA.P-MS</h2>

            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-bold text-red-400 uppercase mb-1">Défauts visibles</h4>
                <ul className="space-y-1">{selectedLot.rapportDefauts.map((d) => <li key={d} className="flex items-start gap-2 text-xs text-white/60"><XCircle size={10} className="text-red-400 mt-0.5 shrink-0" /> {d}</li>)}</ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-amber-400 uppercase mb-1">Travaux connus</h4>
                <ul className="space-y-1">{selectedLot.rapportTravaux.map((t) => <li key={t} className="flex items-start gap-2 text-xs text-white/60"><Wrench size={10} className="text-amber-400 mt-0.5 shrink-0" /> {t}</li>)}</ul>
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-[10px] text-amber-400/60">Estimation travaux</p>
                <p className="text-lg font-black text-amber-400">{selectedLot.rapportEstimation.toLocaleString("fr-FR")} €</p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1">Documents disponibles</h4>
                <ul className="space-y-1">{selectedLot.rapportDocuments.map((d) => <li key={d} className="flex items-start gap-2 text-xs text-white/60"><FileText size={10} className="text-blue-400 mt-0.5 shrink-0" /> {d}</li>)}</ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-green-400 uppercase mb-1">Remarques</h4>
                <ul className="space-y-1">{selectedLot.rapportRemarques.map((r) => <li key={r} className="flex items-start gap-2 text-xs text-white/60"><Info size={10} className="text-green-400 mt-0.5 shrink-0" /> {r}</li>)}</ul>
              </div>
            </div>
          </div>

          {/* ═══ BLOC 5 — VÉHICULES DU LOT (cliquables) ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Car size={16} className="text-[#D4AF37]" /> Véhicules ({selectedLot.vehicules.length})</h2>
            <div className="space-y-2">
              {selectedLot.vehicules.map((v, i) => (
                <div key={i} onClick={() => { setSelectedVehiculeIdx(i); setMode("vehicule_detail"); }}
                  className="rounded-xl bg-white/5 p-3 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-lg shrink-0">🚗</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{v.marque} {v.modele}</p>
                    <p className="text-[10px] text-white/40">{v.annee} · {v.km.toLocaleString("fr-FR")} km</p>
                    <p className="text-[10px] text-amber-400">{v.etat}</p>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-purple-400 transition shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* ═══ HISTORIQUE DES OFFRES ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><History size={16} className="text-purple-400" /> Historique des offres</h2>
            <div className="space-y-1.5">
              {bidHistory.map((b, i) => (
                <div key={i} className={`rounded-lg p-2.5 flex items-center justify-between ${i === 0 ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/5"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">{b.heure}</span>
                    <span className="text-xs text-white/60">{b.pro}</span>
                  </div>
                  <span className={`text-xs font-bold ${i === 0 ? "text-purple-400" : "text-white/60"}`}>{b.montant.toLocaleString("fr-FR")} €</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ BLOC 6 — CONDITIONS DE VENTE ═══ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Shield size={16} className="text-[#D4AF37]" /> Conditions de vente</h2>
            <ul className="space-y-2">
              {[
                "Vente réservée aux professionnels validés",
                "Véhicule vendu en l'état — aucune garantie",
                "Paiement intégral sous 48h après adjudication",
                `Palier d'enchère : ${selectedLot.palier} €`,
                "Retrait sous 72h après paiement",
                "Frais de dossier : 150 € HT / lot",
                "Transport possible (frais en sus)",
                "Aucune vente à particulier",
                "Véhicule vendu sans contrôle technique (sauf mention)",
                "Visite sur rendez-vous uniquement",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2 text-xs text-white/50"><Info size={10} className="text-white/30 mt-0.5 shrink-0" /> {c}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* Confirmation enchère modal */}
        {showBidConfirm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowBidConfirm(false)}>
            <div className="bg-[#1a1a2e] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-extrabold text-white">Confirmer votre enchère</h3>
                <button onClick={() => setShowBidConfirm(false)}><X size={20} className="text-white/40" /></button>
              </div>
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-5 text-center mb-4">
                <p className="text-xs text-purple-300/60">Votre enchère</p>
                <p className="text-3xl font-black text-purple-300">{Number(enchereInput).toLocaleString("fr-FR")} €</p>
              </div>
              <p className="text-sm font-bold text-white mb-1">{selectedLot.titre}</p>
              <p className="text-xs text-white/40 mb-4">{selectedLot.etatGeneral}</p>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mb-4">
                <p className="text-[10px] text-amber-400 flex items-start gap-1"><AlertTriangle size={10} className="mt-0.5 shrink-0" /> En confirmant, votre enchère est irrévocable. Si vous remportez le lot, le paiement est obligatoire sous 48h.</p>
              </div>
              <div className="space-y-2">
                <button className="w-full rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700 transition"
                  onClick={() => { setShowBidConfirm(false); showToast(`Enchere de ${Number(enchereInput).toLocaleString('fr-FR')} EUR confirmee !`); setEnchereInput(""); }}>
                  Confirmer l'enchère — {Number(enchereInput).toLocaleString("fr-FR")} €
                </button>
                <button className="w-full rounded-xl bg-white/5 border border-white/10 py-3 text-sm font-semibold text-white/60" onClick={() => setShowBidConfirm(false)}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     GALERIE PHOTOS — par catégorie (extérieur, intérieur, moteur, dommages, etc.)
     ════════════════════════════════════════════════════════════ */
  if (mode === "photos" && selectedLot) {
    const PHOTO_CATS = [
      { id: "exterieur", label: "Extérieur", icon: Car },
      { id: "interieur", label: "Intérieur", icon: Eye },
      { id: "moteur", label: "Moteur", icon: Settings },
      { id: "coffre", label: "Coffre", icon: Package },
      { id: "tableau_bord", label: "Tableau de bord", icon: Gauge },
      { id: "dommages", label: "Dommages", icon: AlertTriangle },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "pneus", label: "Pneus", icon: Navigation },
    ];
    const currentPhotos = selectedLot.photosCategories[photoCat as keyof typeof selectedLot.photosCategories] || [];
    const allPhotosCount = Object.values(selectedLot.photosCategories).reduce((s, arr) => s + arr.length, 0);

    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => { setMode("detail"); setPhotoIdx(0); }} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Camera size={20} className="text-purple-400" /> Photos professionnelles</h1>
          <p className="text-xs text-white/40 mt-1">{allPhotosCount} photos · {selectedLot.titre}</p>
        </div>

        {/* Catégories */}
        <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2">
          {PHOTO_CATS.map((c) => {
            const count = (selectedLot.photosCategories[c.id as keyof typeof selectedLot.photosCategories] || []).length;
            return (
              <button key={c.id} onClick={() => { setPhotoCat(c.id); setPhotoIdx(0); }}
                className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold transition flex items-center gap-1.5 ${photoCat === c.id ? (c.id === "dommages" ? "bg-red-600 text-white" : "bg-purple-600 text-white") : "bg-white/5 border border-white/10 text-white/60"}`}>
                <c.icon size={12} /> {c.label} {count > 0 && <span className="rounded-full bg-white/20 px-1.5 text-[8px]">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Photos grille */}
        <div className="px-4 mt-4">
          {currentPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {currentPhotos.map((p, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-purple-500/50 transition" onClick={() => setPhotoIdx(i)}>
                  <img src={p} alt={`${photoCat} ${i + 1}`} className="w-full h-36 md:h-48 object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Camera size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">Aucune photo dans cette catégorie</p>
            </div>
          )}
        </div>

        {/* Photo plein écran */}
        {currentPhotos.length > 0 && photoIdx < currentPhotos.length && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4" onClick={() => setPhotoIdx(-1)}>
            {photoIdx >= 0 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(-1); }} className="absolute top-4 right-4 z-50"><X size={24} className="text-white/60" /></button>
                <img src={currentPhotos[photoIdx]} alt="" className="max-h-[80vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
                <div className="mt-4 flex gap-4">
                  <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(Math.max(0, photoIdx - 1)); }} className="rounded-full bg-white/10 p-2"><ChevronLeft size={20} className="text-white" /></button>
                  <span className="text-white/60 text-sm self-center">{photoIdx + 1} / {currentPhotos.length}</span>
                  <button onClick={(e) => { e.stopPropagation(); setPhotoIdx(Math.min(currentPhotos.length - 1, photoIdx + 1)); }} className="rounded-full bg-white/10 p-2"><ChevronRight size={20} className="text-white" /></button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     DÉTAIL VÉHICULE INDIVIDUEL (cliqué depuis le lot)
     ════════════════════════════════════════════════════════════ */
  if (mode === "vehicule_detail" && selectedLot && selectedVehiculeIdx !== null) {
    const v = selectedLot.vehicules[selectedVehiculeIdx];
    if (!v) { setMode("detail"); return null; }

    return (
      <div className="min-h-screen bg-[#0a0a14] pb-24">{ToastEl}
        <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
          <button onClick={() => setMode("detail")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour au lot</button>
          <h1 className="text-xl font-black text-white">{v.marque} {v.modele}</h1>
          <p className="text-xs text-white/40 mt-1">Lot : {selectedLot.titre}</p>
        </div>

        <div className="px-4 mt-6 space-y-4">
          {/* Identité */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Car size={16} className="text-[#D4AF37]" /> Identité</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Marque", val: v.marque },
                { label: "Modèle", val: v.modele },
                { label: "Année", val: String(v.annee) },
                { label: "Kilométrage", val: `${v.km.toLocaleString("fr-FR")} km` },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-white/5 p-2.5">
                  <p className="text-[9px] text-white/30">{f.label}</p>
                  <p className="text-xs font-bold text-white">{f.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* État */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><ClipboardList size={16} className="text-[#D4AF37]" /> État</h2>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
              <p className="text-sm font-bold text-amber-400">{v.etat}</p>
            </div>
          </div>

          {/* Lien VO → Enchères */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/30 to-blue-900/20 border border-purple-500/20 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><RefreshCcw size={16} className="text-purple-400" /> Circuit de décision</h2>
            <div className="space-y-2">
              {[
                { label: "Vente classique MKA.P-MS", desc: "Véhicule en bon état → vente directe", icon: Car, color: "bg-green-500/10 border-green-500/20 text-green-400" },
                { label: "Préparation VO", desc: "Remise en état avant vente", icon: Wrench, color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
                { label: "Enchères Pro", desc: "Véhicule à gros travaux → enchère professionnelle", icon: Gavel, color: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
              ].map((opt) => (
                <div key={opt.label} className={`rounded-xl ${opt.color} border p-3 flex items-center gap-3 cursor-pointer hover:opacity-80 transition`}>
                  <opt.icon size={16} className="shrink-0" />
                  <div>
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] opacity-60">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => setMode("detail")} className="flex-1 rounded-xl bg-white/5 border border-white/10 py-3 text-xs font-bold text-white/60 flex items-center justify-center gap-2">
              <ArrowLeft size={14} /> Retour au lot
            </button>
            <button onClick={() => { setPhotoCat("exterieur"); setMode("photos"); }} className="flex-1 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white flex items-center justify-center gap-2">
              <Camera size={14} /> Voir les photos
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Document viewer for factures encheres - rendered as portal-style overlay */
  if (viewFactureEnchere) {
    return (
      <DocumentView
        doc={buildFactureData({ ref: `FA-ENCH-${viewFactureEnchere.lotId}`, objet: viewFactureEnchere.titre, client: "Acheteur MKA.P-MS", montant: `${viewFactureEnchere.montant.toLocaleString("fr-FR")} EUR`, date: viewFactureEnchere.date, statut: viewFactureEnchere.statut === "paye" ? "Paye" : "En attente", type: "Enchere" })}
        onClose={() => setViewFactureEnchere(null)}
      />
    );
  }

  return null;
}
