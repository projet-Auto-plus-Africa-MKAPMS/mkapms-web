import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Phone,
  Star,
  ShieldCheck,
  Clock,
  BadgeCheck,
  TrendingUp,
  Flag,
  History,
  ChevronRight,
  ChevronLeft,
  FileText,
  FolderCheck,
  Eye as EyeIcon,
  Download,
  CreditCard,
  Send,
  Building2,
  Share2,
  Wrench,
  Truck,
  FileCheck,
  Search,
  Shield,
  Award,
  BarChart3,
  Battery,
  CalendarCheck,
  MapPin,
  Bell,
  Mail,
  Car,
  Store,
  ChevronDown,
  ShoppingCart,
  X,
} from "lucide-react";

/* ── Classification des tiers ── */
type VehicleTier = "officiel" | "elite" | "premium" | "professionnel" | "particulier";

function getVehicleTier(v: any): VehicleTier {
  // Catégorie d'annonce — source de vérité principale
  if (v.categorieAnnonce === "officielle" || v.ownership === "plateforme") return "officiel";
  if (v.tier === "elite") return "elite";
  if (v.boosted && (v.categorieAnnonce === "professionnelle" || v.vendeurType === "professionnel")) return "premium";
  if (v.categorieAnnonce === "professionnelle" || v.vendeurType === "professionnel" || v.vendeurType === "concession") return "professionnel";
  return "particulier";
}
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { ACOMPTE_PALIERS } from "@shared/plans";
import { computeTrustScore, TRUST_LEVEL_LABEL } from "@shared/trust";
import { computeBadges } from "@shared/badges";
import { BadgeChip } from "../components/VehicleCard";

/* ── Catégories photo pour galerie (tous véhicules) ── */
type PhotoCategory = "toutes" | "exterieur" | "interieur" | "sieges" | "coffre" | "tableau_de_bord" | "moteur" | "roues" | "documents" | "autres" | "video360" | "video";
const PHOTO_CATEGORIES: { key: PhotoCategory; label: string }[] = [
  { key: "toutes", label: "Toutes" },
  { key: "exterieur", label: "Extérieur" },
  { key: "interieur", label: "Intérieur" },
  { key: "sieges", label: "Sièges" },
  { key: "tableau_de_bord", label: "Tableau de bord" },
  { key: "coffre", label: "Coffre" },
  { key: "moteur", label: "Moteur" },
  { key: "roues", label: "Roues" },
  { key: "documents", label: "Documents" },
  { key: "autres", label: "Autres" },
  { key: "video360", label: "Vidéo 360°" },
  { key: "video", label: "Vidéo" },
];

/* ── Véhicules démo (IDs >= 8000) ── */
const DEMO_VEHICLES: Record<number, any> = Object.fromEntries([
  { id: 8001, titre: "Peugeot 308 GT", marque: "Peugeot", modele: "308", annee: 2023, kilometrage: 12000, carburant: "Essence", prix: 26900, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", motorisation: "1.2 PureTech 130ch GT EAT8", description: "Peugeot 308 GT en excellent état, premier propriétaire. Véhicule révisé et garanti MKA.P-MS.", pointsForts: ["Faible kilométrage (12 000 km)", "Premier propriétaire", "Entretien à jour", "Garantie MKA.P-MS incluse", "Contrôle technique OK"], equipements: ["Climatisation automatique", "GPS intégré", "Caméra de recul", "Régulateur adaptatif", "Sièges chauffants", "Jantes alliage 18\"", "LED full", "Apple CarPlay / Android Auto"], imperfections: ["Micro-rayure pare-chocs arrière (retouchée)", "Usure normale des pneus avant"], photoCategories: { exterieur: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80"], sieges: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80"], coffre: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80"], tableau_de_bord: ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"], roues: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80"], autres: [] }, photoPrincipale: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80" },
  { id: 8002, titre: "Renault Austral Iconic", marque: "Renault", modele: "Austral", annee: 2024, kilometrage: 5000, carburant: "Hybride", prix: 34500, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", motorisation: "1.2 E-Tech 200ch Iconic", description: "Renault Austral Iconic hybride, faible kilométrage. Garantie constructeur.", pointsForts: ["Hybride — économie de carburant", "Seulement 5 000 km", "Garantie constructeur", "Technologie dernier cri", "Finition Iconic haut de gamme"], equipements: ["Toit panoramique", "Affichage tête haute", "Aide au stationnement 360°", "Charge sans fil", "Multimédia 12\"", "Sono Harman Kardon"], imperfections: ["Aucune imperfection constatée"], photoCategories: { exterieur: ["https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80", "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=800&q=80"], sieges: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80"], coffre: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80"], tableau_de_bord: ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"], roues: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80"], autres: [] }, photoPrincipale: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80" },
  { id: 8003, titre: "Citroën C5 X Shine", marque: "Citroën", modele: "C5 X", annee: 2023, kilometrage: 18000, carburant: "Diesel", prix: 31900, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", motorisation: "1.5 BlueHDi 130ch Shine EAT8", description: "Citroën C5 X Shine, confort et élégance. Entretien complet.", pointsForts: ["Confort suspension hydraulique", "Entretien 100% à jour", "Diesel économique", "Grand coffre familial"], equipements: ["Suspension hydraulique", "Matrix LED", "Keyless entry", "Sièges massants", "Aide au stationnement"], imperfections: ["Légère usure siège conducteur"], photoCategories: { exterieur: ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"], sieges: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80"], coffre: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80"], tableau_de_bord: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80"], roues: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80"], autres: [] }, photoPrincipale: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80" },
  { id: 8004, titre: "Mercedes GLA 200", marque: "Mercedes", modele: "GLA", annee: 2022, kilometrage: 22000, carburant: "Essence", prix: 38900, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", motorisation: "1.3 163ch AMG Line 7G-DCT", description: "Mercedes GLA 200, SUV compact premium. Garantie MKA.P-MS.", pointsForts: ["SUV compact premium", "Garantie MKA.P-MS", "Système MBUX complet", "Motorisation efficiente"], equipements: ["MBUX multimédia", "Caméra 360°", "Pack AMG Line", "LED haute performance", "Sièges sport", "Jantes AMG 19\""], imperfections: ["Micro-impact pare-brise (réparé)"], photoCategories: { exterieur: ["https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80", "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80"], sieges: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80"], coffre: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80"], tableau_de_bord: ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"], roues: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80"], autres: ["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80"] }, photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80" },
  { id: 8005, titre: "BMW X1 sDrive18i", marque: "BMW", modele: "X1", annee: 2023, kilometrage: 15000, carburant: "Essence", prix: 35500, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", motorisation: "1.5i 136ch sDrive18i xLine DKG7", description: "BMW X1 sDrive18i, motorisation essence efficiente. État impeccable.", pointsForts: ["État impeccable", "BMW Connected Drive", "Faible consommation", "Design moderne"], equipements: ["BMW Live Cockpit", "Driving Assistant", "Parking Assistant", "LED adaptatifs", "Toit ouvrant", "Sono HiFi"], imperfections: ["Aucune imperfection constatée"], photoCategories: { exterieur: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80", "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80"], sieges: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80"], coffre: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80"], tableau_de_bord: ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"], roues: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80"], autres: [] }, photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80" },
  { id: 9001, titre: "Peugeot 3008 GT Line", marque: "Peugeot", modele: "3008", annee: 2022, kilometrage: 35000, carburant: "Diesel", prix: 28900, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Peugeot 3008 GT Line, SUV familial. Révision complète effectuée.", photoPrincipale: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80" },
  { id: 9002, titre: "Renault Clio V Intens", marque: "Renault", modele: "Clio", annee: 2023, kilometrage: 18000, carburant: "Essence", prix: 16500, type: "vente", ville: "Lyon", vendeurType: "professionnel", description: "Renault Clio V Intens, citadine polyvalente en parfait état.", photoPrincipale: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80" },
  { id: 9003, titre: "BMW Série 3 320d M Sport", marque: "BMW", modele: "Série 3", annee: 2021, kilometrage: 42000, carburant: "Diesel", prix: 35900, type: "vente", ville: "Marseille", vendeurType: "professionnel", boosted: true, description: "BMW Série 3 M Sport, performance et élégance.", photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80" },
  { id: 9004, titre: "Mercedes Classe A 200", marque: "Mercedes", modele: "Classe A", annee: 2022, kilometrage: 25000, carburant: "Essence", prix: 32000, type: "vente", ville: "Toulouse", vendeurType: "professionnel", boosted: true, description: "Mercedes Classe A 200, compacte premium.", photoPrincipale: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80" },
  { id: 9005, titre: "Citroën C3 Aircross", marque: "Citroën", modele: "C3 Aircross", annee: 2023, kilometrage: 12000, carburant: "Essence", prix: 19900, type: "vente", ville: "Bordeaux", vendeurType: "particulier", description: "Citroën C3 Aircross, petit SUV pratique.", photoPrincipale: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80" },
  { id: 9006, titre: "Volkswagen Golf 8 R-Line", marque: "Volkswagen", modele: "Golf", annee: 2022, kilometrage: 30000, carburant: "Essence", prix: 27500, type: "vente", ville: "Nice", vendeurType: "professionnel", boosted: true, description: "VW Golf 8 R-Line, compacte sportive.", photoPrincipale: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80" },
  { id: 9007, titre: "Toyota Yaris Hybride", marque: "Toyota", modele: "Yaris", annee: 2023, kilometrage: 8000, carburant: "Hybride", prix: 21500, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 45, description: "Toyota Yaris Hybride en location. Économique et fiable.", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80" },
  { id: 9008, titre: "Audi A4 Avant S-Line", marque: "Audi", modele: "A4", annee: 2021, kilometrage: 55000, carburant: "Diesel", prix: 31900, type: "vente", ville: "Lille", vendeurType: "professionnel", boosted: true, description: "Audi A4 Avant S-Line, break sportif.", photoPrincipale: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80" },
  { id: 9009, titre: "Dacia Sandero Stepway", marque: "Dacia", modele: "Sandero", annee: 2022, kilometrage: 22000, carburant: "Essence", prix: 14500, type: "vente", ville: "Nantes", vendeurType: "particulier", description: "Dacia Sandero Stepway, rapport qualité-prix imbattable.", photoPrincipale: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80" },
  { id: 9010, titre: "Fiat 500 Lounge", marque: "Fiat", modele: "500", annee: 2021, kilometrage: 32000, carburant: "Essence", prix: 13900, type: "vente", ville: "Strasbourg", vendeurType: "particulier", description: "Fiat 500 Lounge, citadine iconique.", photoPrincipale: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80" },
  { id: 9101, titre: "Peugeot 208 GT", marque: "Peugeot", modele: "208", annee: 2023, kilometrage: 5000, carburant: "Essence", prix: 35, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 35, description: "Peugeot 208 GT disponible en location. Compacte et sportive.", photoPrincipale: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80" },
  { id: 9102, titre: "Renault Captur Intens", marque: "Renault", modele: "Captur", annee: 2022, kilometrage: 15000, carburant: "Diesel", prix: 42, type: "location", ville: "Lyon", vendeurType: "professionnel", prixJour: 42, description: "Renault Captur Intens en location. SUV compact et confortable.", photoPrincipale: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80" },
  { id: 9103, titre: "Citroën C4 Feel", marque: "Citroën", modele: "C4", annee: 2023, kilometrage: 8000, carburant: "Hybride", prix: 48, type: "location", ville: "Marseille", vendeurType: "professionnel", prixJour: 48, description: "Citroën C4 Feel hybride. Confort et économie.", photoPrincipale: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80" },
  { id: 9104, titre: "Mercedes Classe C", marque: "Mercedes", modele: "Classe C", annee: 2022, kilometrage: 20000, carburant: "Diesel", prix: 75, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 75, boosted: true, description: "Mercedes Classe C premium en location. Élégance et performance.", photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80" },
  { id: 9105, titre: "Toyota RAV4 Hybride", marque: "Toyota", modele: "RAV4", annee: 2023, kilometrage: 10000, carburant: "Hybride", prix: 55, type: "location", ville: "Toulouse", vendeurType: "professionnel", prixJour: 55, description: "Toyota RAV4 Hybride. SUV familial en location.", photoPrincipale: "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=800&q=80" },
  { id: 9106, titre: "BMW Série 1 118i", marque: "BMW", modele: "Série 1", annee: 2022, kilometrage: 18000, carburant: "Essence", prix: 60, type: "location", ville: "Bordeaux", vendeurType: "professionnel", prixJour: 60, boosted: true, description: "BMW Série 1 118i en location. Compacte premium.", photoPrincipale: "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80" },
  /* ── VTC / TAXI ── */
  { id: 9201, titre: "Mercedes Classe E 220d", marque: "Mercedes", modele: "Classe E", annee: 2023, kilometrage: 15000, carburant: "Diesel", prix: 120, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 120, segmentLocation: "vtc_taxi", description: "Mercedes Classe E 220d — véhicule idéal pour activité VTC. Confort premium, consommation maîtrisée.", photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80" },
  { id: 9202, titre: "Tesla Model 3 Long Range", marque: "Tesla", modele: "Model 3", annee: 2024, kilometrage: 5000, carburant: "Électrique", prix: 135, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 135, segmentLocation: "vtc_taxi", description: "Tesla Model 3 Long Range pour VTC. Zéro émission, autonomie supérieure.", photoPrincipale: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80" },
  { id: 9203, titre: "Toyota Camry Hybride", marque: "Toyota", modele: "Camry", annee: 2023, kilometrage: 20000, carburant: "Hybride", prix: 95, type: "location", ville: "Lyon", vendeurType: "professionnel", prixJour: 95, segmentLocation: "vtc_taxi", description: "Toyota Camry Hybride — fiabilité et économie pour chauffeurs Taxi/VTC.", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80" },
  /* ── HOMEPAGE ANNONCES ── */
  { id: 9011, titre: "BMW Série 3 320i", marque: "BMW", modele: "Série 3", annee: 2020, kilometrage: 42000, carburant: "Essence", prix: 29500, type: "vente", ville: "Lyon", vendeurType: "professionnel", tier: "elite", description: "BMW Série 3 320i — sportive et élégante. Moteur performant.", photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80" },
  { id: 9012, titre: "Mercedes Classe C", marque: "Mercedes", modele: "Classe C", annee: 2021, kilometrage: 35000, carburant: "Essence", prix: 31900, type: "vente", ville: "Marseille", vendeurType: "professionnel", tier: "elite", description: "Mercedes Classe C — luxe et confort au quotidien.", photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80" },
  { id: 9013, titre: "Volkswagen Golf 8", marque: "Volkswagen", modele: "Golf", annee: 2023, kilometrage: 15000, carburant: "Essence", prix: 24900, type: "vente", ville: "Nice", vendeurType: "professionnel", tier: "elite", description: "Volkswagen Golf 8 — compacte premium, dernière génération.", photoPrincipale: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80" },
  { id: 9014, titre: "Toyota Corolla", marque: "Toyota", modele: "Corolla", annee: 2022, kilometrage: 20000, carburant: "Hybride", prix: 23500, type: "vente", ville: "Toulouse", vendeurType: "professionnel", tier: "elite", description: "Toyota Corolla hybride — fiabilité et économie.", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80" },
  { id: 9020, titre: "Peugeot 508 GT", marque: "Peugeot", modele: "508", annee: 2022, kilometrage: 22000, carburant: "Diesel", prix: 25900, type: "vente", ville: "Bordeaux", vendeurType: "professionnel", description: "Peugeot 508 GT — berline premium française.", photoPrincipale: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80" },
  { id: 9021, titre: "Renault Clio V", marque: "Renault", modele: "Clio", annee: 2021, kilometrage: 28000, carburant: "Essence", prix: 15900, type: "vente", ville: "Lyon", vendeurType: "professionnel", description: "Renault Clio V — citadine polyvalente.", photoPrincipale: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80" },
  { id: 9022, titre: "Toyota C-HR", marque: "Toyota", modele: "C-HR", annee: 2022, kilometrage: 20000, carburant: "Hybride", prix: 23900, type: "vente", ville: "Nantes", vendeurType: "professionnel", description: "Toyota C-HR hybride — design et efficience.", photoPrincipale: "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=800&q=80" },
  { id: 9023, titre: "Kia Sportage", marque: "Kia", modele: "Sportage", annee: 2021, kilometrage: 30000, carburant: "Diesel", prix: 22500, type: "vente", ville: "Lille", vendeurType: "professionnel", description: "Kia Sportage — SUV familial fiable.", photoPrincipale: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80" },
  { id: 9024, titre: "Hyundai Tucson", marque: "Hyundai", modele: "Tucson", annee: 2023, kilometrage: 8000, carburant: "Hybride", prix: 29800, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Hyundai Tucson — SUV moderne et connecté.", photoPrincipale: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80" },
  { id: 9030, titre: "Peugeot 308", marque: "Peugeot", modele: "308", annee: 2021, kilometrage: 25000, carburant: "Essence", prix: 16900, type: "vente", ville: "Paris", vendeurType: "particulier", description: "Peugeot 308 en bon état, révision récente.", photoPrincipale: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80" },
  { id: 9031, titre: "Renault Captur", marque: "Renault", modele: "Captur", annee: 2020, kilometrage: 32000, carburant: "Essence", prix: 14500, type: "vente", ville: "Paris", vendeurType: "particulier", description: "Renault Captur — SUV compact économique.", photoPrincipale: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80" },
  { id: 9032, titre: "Volkswagen Polo", marque: "Volkswagen", modele: "Polo", annee: 2022, kilometrage: 18000, carburant: "Essence", prix: 15900, type: "vente", ville: "Boulogne", vendeurType: "particulier", description: "Volkswagen Polo — citadine allemande fiable.", photoPrincipale: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80" },
  { id: 9033, titre: "Ford Puma", marque: "Ford", modele: "Puma", annee: 2021, kilometrage: 28000, carburant: "Hybride", prix: 19900, type: "vente", ville: "Vincennes", vendeurType: "particulier", description: "Ford Puma hybride — SUV compact et dynamique.", photoPrincipale: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80" },
  { id: 9034, titre: "Citroën C3", marque: "Citroën", modele: "C3", annee: 2020, kilometrage: 35000, carburant: "Essence", prix: 10900, type: "vente", ville: "Nanterre", vendeurType: "particulier", description: "Citroën C3 — citadine confortable.", photoPrincipale: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80" },
  { id: 9040, titre: "Renault Clio", marque: "Renault", modele: "Clio", annee: 2022, kilometrage: 15000, carburant: "Essence", prix: 29, type: "location", ville: "Paris", vendeurType: "particulier", prixJour: 29, description: "Renault Clio en location particulier.", photoPrincipale: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80" },
  { id: 9041, titre: "Peugeot 208", marque: "Peugeot", modele: "208", annee: 2023, kilometrage: 8000, carburant: "Essence", prix: 32, type: "location", ville: "Lyon", vendeurType: "particulier", prixJour: 32, description: "Peugeot 208 en location courte durée.", photoPrincipale: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80" },
  { id: 9042, titre: "Mercedes Classe A", marque: "Mercedes", modele: "Classe A", annee: 2023, kilometrage: 10000, carburant: "Essence", prix: 55, type: "location", ville: "Nice", vendeurType: "professionnel", prixJour: 55, description: "Mercedes Classe A en location professionnelle.", photoPrincipale: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80" },
  { id: 9043, titre: "Tesla Model 3", marque: "Tesla", modele: "Model 3", annee: 2024, kilometrage: 5000, carburant: "Électrique", prix: 75, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 75, segmentLocation: "vtc_taxi", description: "Tesla Model 3 pour VTC — 100% électrique.", photoPrincipale: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80" },
  { id: 9044, titre: "Toyota Corolla", marque: "Toyota", modele: "Corolla", annee: 2022, kilometrage: 20000, carburant: "Hybride", prix: 45, type: "location", ville: "Marseille", vendeurType: "professionnel", prixJour: 45, segmentLocation: "vtc_taxi", description: "Toyota Corolla hybride pour Taxi.", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80" },
  { id: 9050, titre: "Audi A3 Sportback", marque: "Audi", modele: "A3", annee: 2023, kilometrage: 10000, carburant: "Essence", prix: 31200, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Audi A3 Sportback — compacte premium. Stock officiel MKA.P-MS.", photoPrincipale: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80" },
  { id: 9060, titre: "Citroën C4", marque: "Citroën", modele: "C4", annee: 2020, kilometrage: 45000, carburant: "Diesel", prix: 12900, type: "vente", ville: "Lyon", vendeurType: "particulier", description: "Citroën C4 occasion particulier.", photoPrincipale: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80" },
  { id: 9061, titre: "Opel Corsa", marque: "Opel", modele: "Corsa", annee: 2019, kilometrage: 52000, carburant: "Essence", prix: 9500, type: "vente", ville: "Toulouse", vendeurType: "particulier", description: "Opel Corsa — petite citadine économique.", photoPrincipale: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80" },
  { id: 9062, titre: "Ford Focus", marque: "Ford", modele: "Focus", annee: 2018, kilometrage: 60000, carburant: "Diesel", prix: 8900, type: "vente", ville: "Nantes", vendeurType: "particulier", description: "Ford Focus — compacte familiale fiable.", photoPrincipale: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80" },
  { id: 9063, titre: "Dacia Sandero", marque: "Dacia", modele: "Sandero", annee: 2020, kilometrage: 40000, carburant: "Essence", prix: 7900, type: "vente", ville: "Lille", vendeurType: "particulier", description: "Dacia Sandero — rapport qualité-prix imbattable.", photoPrincipale: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80" },
  { id: 9064, titre: "Toyota RAV4", marque: "Toyota", modele: "RAV4", annee: 2021, kilometrage: 22000, carburant: "Hybride", prix: 28900, type: "vente", ville: "Lille", vendeurType: "particulier", description: "Toyota RAV4 hybride — SUV polyvalent.", photoPrincipale: "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=800&q=80" },
  { id: 9065, titre: "Volkswagen Golf 8", marque: "Volkswagen", modele: "Golf", annee: 2022, kilometrage: 42000, carburant: "Essence", prix: 24900, type: "vente", ville: "Nice", vendeurType: "particulier", description: "Volkswagen Golf 8 R-Line — compacte dynamique.", photoPrincipale: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80" },
  { id: 9066, titre: "Dacia Sandero Stepway", marque: "Dacia", modele: "Sandero", annee: 2024, kilometrage: 8000, carburant: "GPL", prix: 15500, type: "vente", ville: "Rennes", vendeurType: "particulier", description: "Dacia Sandero Stepway — économique et pratique.", photoPrincipale: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80" },
  /* ── MOTO ── */
  { id: 9071, titre: "Yamaha MT-07", marque: "Yamaha", modele: "MT-07", annee: 2023, kilometrage: 8000, carburant: "Essence", prix: 6500, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Yamaha MT-07 — roadster polyvalent et accessible.", photoPrincipale: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80" },
  { id: 9072, titre: "Honda CB 500F", marque: "Honda", modele: "CB 500F", annee: 2022, kilometrage: 12000, carburant: "Essence", prix: 5200, type: "vente", ville: "Lyon", vendeurType: "particulier", description: "Honda CB 500F — moto A2, parfaite pour débuter.", photoPrincipale: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=800&q=80" },
  { id: 9073, titre: "BMW R 1250 GS Adventure", marque: "BMW", modele: "R 1250 GS", annee: 2023, kilometrage: 15000, carburant: "Essence", prix: 16500, type: "vente", ville: "Marseille", vendeurType: "professionnel", description: "BMW R 1250 GS Adventure — trail mythique.", photoPrincipale: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80" },
  { id: 9074, titre: "Kawasaki Ninja ZX-6R", marque: "Kawasaki", modele: "Ninja ZX-6R", annee: 2024, kilometrage: 3000, carburant: "Essence", prix: 11900, type: "vente", ville: "Bordeaux", vendeurType: "professionnel", description: "Kawasaki Ninja ZX-6R — sportive 636cc.", photoPrincipale: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=800&q=80" },
  { id: 9075, titre: "Vespa Primavera 125", marque: "Vespa", modele: "Primavera", annee: 2023, kilometrage: 5000, carburant: "Essence", prix: 3800, type: "vente", ville: "Nice", vendeurType: "particulier", description: "Vespa Primavera 125 — scooter iconique italien.", photoPrincipale: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80" },
  { id: 9076, titre: "Harley-Davidson Sportster S", marque: "Harley-Davidson", modele: "Sportster S", annee: 2023, kilometrage: 6000, carburant: "Essence", prix: 14500, type: "vente", ville: "Toulouse", vendeurType: "professionnel", description: "Harley-Davidson Sportster S — custom américain.", photoPrincipale: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80" },
  { id: 9077, titre: "KTM 890 Duke R", marque: "KTM", modele: "890 Duke R", annee: 2024, kilometrage: 2000, carburant: "Essence", prix: 11500, type: "vente", ville: "Strasbourg", vendeurType: "professionnel", description: "KTM 890 Duke R — naked sportif.", photoPrincipale: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=800&q=80" },
  { id: 9078, titre: "Ducati Scrambler Icon", marque: "Ducati", modele: "Scrambler", annee: 2023, kilometrage: 7000, carburant: "Essence", prix: 8900, type: "vente", ville: "Lille", vendeurType: "particulier", description: "Ducati Scrambler Icon — style rétro-moderne.", photoPrincipale: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=800&q=80" },
  /* ── UTILITAIRES ── */
  { id: 9081, titre: "Renault Kangoo Van", marque: "Renault", modele: "Kangoo", annee: 2023, kilometrage: 35000, carburant: "Diesel", prix: 14500, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Renault Kangoo Van — fourgonnette compacte.", photoPrincipale: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=800&q=80" },
  { id: 9082, titre: "Citroën Berlingo Van M", marque: "Citroën", modele: "Berlingo", annee: 2022, kilometrage: 48000, carburant: "Diesel", prix: 13200, type: "vente", ville: "Lyon", vendeurType: "professionnel", description: "Citroën Berlingo Van M — utilitaire polyvalent.", photoPrincipale: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80" },
  { id: 9083, titre: "Renault Master L2H2", marque: "Renault", modele: "Master", annee: 2021, kilometrage: 82000, carburant: "Diesel", prix: 18500, type: "vente", ville: "Marseille", vendeurType: "professionnel", description: "Renault Master L2H2 — grand volume, charge utile importante.", photoPrincipale: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80" },
  { id: 9084, titre: "Ford Transit Custom L2", marque: "Ford", modele: "Transit Custom", annee: 2023, kilometrage: 28000, carburant: "Diesel", prix: 24900, type: "vente", ville: "Bordeaux", vendeurType: "professionnel", description: "Ford Transit Custom L2 — fourgon professionnel.", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80" },
  /* ── CAMIONS ── */
  { id: 9091, titre: "Iveco Daily Benne 35C14", marque: "Iveco", modele: "Daily", annee: 2022, kilometrage: 55000, carburant: "Diesel", prix: 28500, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Iveco Daily Benne 35C14 — PTAC 3.5t, benne robuste.", photoPrincipale: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80" },
  { id: 9092, titre: "MAN TGL 12.250 Frigo", marque: "MAN", modele: "TGL 12.250", annee: 2021, kilometrage: 120000, carburant: "Diesel", prix: 42000, type: "vente", ville: "Lyon", vendeurType: "professionnel", description: "MAN TGL 12.250 Frigorifique — transport sous température dirigée.", photoPrincipale: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80" },
  { id: 9093, titre: "Renault Trucks D 7.5t Plateau", marque: "Renault", modele: "Trucks D", annee: 2023, kilometrage: 38000, carburant: "Diesel", prix: 45000, type: "vente", ville: "Marseille", vendeurType: "professionnel", description: "Renault Trucks D 7.5t Plateau — porteur polyvalent.", photoPrincipale: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80" },
  /* ── VTC VENTE ── */
  { id: 9301, titre: "Mercedes Classe E 220d", marque: "Mercedes", modele: "Classe E", annee: 2023, kilometrage: 45000, carburant: "Diesel", prix: 38000, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Mercedes Classe E 220d — berline premium idéale pour activité VTC.", photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80" },
  { id: 9302, titre: "BMW Série 5 530e", marque: "BMW", modele: "Série 5", annee: 2023, kilometrage: 30000, carburant: "Hybride", prix: 48000, type: "vente", ville: "Lyon", vendeurType: "professionnel", description: "BMW Série 5 530e hybride — performance et économie VTC.", photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80" },
  { id: 9303, titre: "Tesla Model 3 LR", marque: "Tesla", modele: "Model 3", annee: 2024, kilometrage: 15000, carburant: "Électrique", prix: 38500, type: "vente", ville: "Marseille", vendeurType: "professionnel", description: "Tesla Model 3 Long Range — VTC 100% électrique.", photoPrincipale: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80" },
  { id: 9304, titre: "Toyota Camry Hybride", marque: "Toyota", modele: "Camry", annee: 2023, kilometrage: 35000, carburant: "Hybride", prix: 28000, type: "vente", ville: "Toulouse", vendeurType: "professionnel", description: "Toyota Camry Hybride — fiabilité et faible consommation pour Taxi.", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80" },
  /* ── PROMOTIONS ── */
  { id: 9111, titre: "Peugeot 308 GT Line", marque: "Peugeot", modele: "308", annee: 2023, kilometrage: 18000, carburant: "Essence", prix: 23500, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Peugeot 308 GT Line — promotion déstockage -16%.", photoPrincipale: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80" },
  { id: 9112, titre: "Renault Mégane E-Tech", marque: "Renault", modele: "Mégane", annee: 2024, kilometrage: 5000, carburant: "Électrique", prix: 29900, type: "vente", ville: "Lyon", vendeurType: "professionnel", description: "Renault Mégane E-Tech — promotion lancement.", photoPrincipale: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80" },
  { id: 9113, titre: "Dacia Duster Prestige", marque: "Dacia", modele: "Duster", annee: 2023, kilometrage: 22000, carburant: "Essence", prix: 17200, type: "vente", ville: "Marseille", vendeurType: "professionnel", description: "Dacia Duster Prestige — offre spéciale.", photoPrincipale: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80" },
  { id: 9114, titre: "Citroën C5 Aircross", marque: "Citroën", modele: "C5 Aircross", annee: 2022, kilometrage: 42000, carburant: "Diesel", prix: 20500, type: "vente", ville: "Bordeaux", vendeurType: "professionnel", description: "Citroën C5 Aircross — prix réduit destockage.", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80" },
  /* ── ENCHÈRES ── */
  { id: 9121, titre: "Lot 5 véhicules — Reprises garage", marque: "Divers", modele: "Lot 5", annee: 2020, kilometrage: 80000, carburant: "Diesel", prix: 12400, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Lot de 5 véhicules en reprise de garage. Enchère réservée aux professionnels.", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80" },
  { id: 9122, titre: "BMW Série 3 320d — Accident léger", marque: "BMW", modele: "Série 3", annee: 2019, kilometrage: 95000, carburant: "Diesel", prix: 8200, type: "vente", ville: "Lyon", vendeurType: "professionnel", description: "BMW Série 3 320d avec accident léger. À réparer, bonne base.", photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80" },
  { id: 9123, titre: "Renault Clio V — Panne moteur", marque: "Renault", modele: "Clio", annee: 2021, kilometrage: 60000, carburant: "Essence", prix: 3800, type: "vente", ville: "Marseille", vendeurType: "professionnel", description: "Renault Clio V avec panne moteur. Idéal pour pièces ou réparation.", photoPrincipale: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=800&q=80" },
].map((v) => [v.id, { ...v, photos: [{ url: v.photoPrincipale }], contactTelephone: "+33123456789", reference: `DEMO-${v.id}`, vendeur: { id: 999, rating: "4.5", reviewCount: 12 } }]));

export default function Vehicule() {
  const { format: formatPrice } = useCurrency();
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [photoCat, setPhotoCat] = useState<PhotoCategory>("toutes");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [descTab, setDescTab] = useState<string>("description");
  const [mkaEquipOpen, setMkaEquipOpen] = useState<string | null>(null);
  const [acompte, setAcompte] = useState<number>(ACOMPTE_PALIERS[1]);
  const [scrollHidden, setScrollHidden] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [showCote, setShowCote] = useState(false);
  const [priceSlider, setPriceSlider] = useState(40);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [proGalleryOpen, setProGalleryOpen] = useState(false);
  const [proGalleryCat, setProGalleryCat] = useState("exterieur");
  const [proAdIdx1, setProAdIdx1] = useState(0);
  const [proAdIdx2, setProAdIdx2] = useState(0);
  const [proFinanceTab, setProFinanceTab] = useState<"paiement" | "loa">("paiement");
  const [proCaracOpen, setProCaracOpen] = useState(true);
  const [proEquipOpen, setProEquipOpen] = useState(false);
  const [proHistoriqueOpen, setProHistoriqueOpen] = useState(false);
  const [proGarantieOpen, setProGarantieOpen] = useState(false);
  const [proDescOpen, setProDescOpen] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const onScroll = () => {
      setScrollHidden(true);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setScrollHidden(false), 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (scrollTimer.current) clearTimeout(scrollTimer.current); };
  }, []);

  const isDemo = annonceId >= 8000;
  const q = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: !!annonceId && !isDemo });
  const legal = trpc.meta.legal.useQuery();
  const estimateQuery = trpc.annonces.estimate.useQuery(
    {
      marque: q.data?.marque ?? "",
      modele: q.data?.modele ?? "",
      annee: q.data?.annee ?? undefined,
      kilometrage: q.data?.kilometrage ?? undefined,
    },
    { enabled: !!q.data && q.data.type === "vente" && !!q.data.marque && !!q.data.modele },
  );
  const incView = trpc.annonces.incrementView.useMutation();
  const toggleFav = trpc.favoris.toggle.useMutation();
  const reserve = trpc.reservations.create.useMutation({
    onSuccess: (r) => {
      if (r.url) window.location.href = r.url;
    },
  });

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    if (annonceId) incView.mutate({ id: annonceId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annonceId]);

  if (!isDemo && (q.isLoading || (q.isFetching && !q.data))) return <div className="container-page py-16 text-slate-500">Chargement…</div>;
  if (!isDemo && q.isError) return <div className="container-page py-16 text-center text-slate-500">Erreur de chargement. <button className="underline text-[#B8960C] ml-2" onClick={() => q.refetch()}>Réessayer</button></div>;

  const demoV = isDemo ? DEMO_VEHICLES[annonceId] : null;
  const realV = !isDemo ? q.data : null;
  const v = demoV || realV;

  if (!v) return <div className="container-page py-16 text-slate-500">Véhicule introuvable.</div>;

  const photosRaw: { url: string; categorie?: string }[] = v.photos?.length ? v.photos.map((p: any) => ({ url: p.url, categorie: p.categorie || null })) : (v.photoPrincipale ? [{ url: v.photoPrincipale, categorie: null }] : []);
  const photos = photosRaw.map((p) => p.url);
  const isLocation = v.type === "location";
  const isVtcTaxi = v.segmentLocation === "vtc_taxi";
  const tier = getVehicleTier(v);
  const isOfficiel = tier === "officiel" || tier === "premium" || tier === "elite";
  const isMkapmsStock = v.id >= 8000 && v.id <= 8005;

  /* Photos catégorisées — fonctionne pour MKA.P-MS stock ET annonces particulier/pro */
  const hasPhotoCategories = isMkapmsStock && v.photoCategories;
  const userAnnonceHasCategories = !isMkapmsStock && photosRaw.some((p) => p.categorie);
  const isAllPhotos = photoCat === "toutes";
  const categoryPhotos = isAllPhotos
    ? photos
    : hasPhotoCategories
      ? (v.photoCategories[photoCat] || []) as string[]
      : userAnnonceHasCategories
        ? photosRaw.filter((p) => p.categorie === photoCat).map((p) => p.url)
        : [];
  const activeCatPhotos = isAllPhotos ? photos : ((hasPhotoCategories || userAnnonceHasCategories) ? categoryPhotos : photos);
  const activeCatIdx = Math.min(photoIdx, Math.max(0, activeCatPhotos.length - 1));
  const allCategoryPhotos = hasPhotoCategories
    ? Object.values(v.photoCategories as Record<string, string[]>).flat()
    : photos;
  const totalPhotoCount = allCategoryPhotos.length;

  /* Photo height classes per tier (responsive) — réduit légèrement pour MKA.P-MS */
  const photoHeightClass =
    tier === "officiel"
      ? "h-[420px] md:h-[500px] lg:h-[620px] xl:h-[720px]"
      : tier === "elite" || tier === "premium"
        ? "h-[420px] md:h-[500px] lg:h-[650px]"
        : tier === "professionnel"
          ? "h-[280px] md:h-[340px] lg:h-[380px]"
          : "h-[220px] md:h-[250px] lg:h-[280px]";

  /* Badge label */
  const tierBadge =
    tier === "officiel" ? "MKA.P-MS Officiel"
    : tier === "elite" ? "Élite"
    : tier === "premium" ? "Premium"
    : null;

  // Indice de Confiance MKA.P-MS (Partie 5) — calcul transparent.
  const trust = computeTrustScore({
    vendeurProfessionnel: v.vendeurType === "professionnel" || v.vendeurType === "concession",
    rating: v.vendeur ? Number(v.vendeur.rating || 0) : 0,
    reviewCount: v.vendeur?.reviewCount ?? 0,
    photosCount: v.photos?.length ?? photos.length,
    hasDescription: !!v.description && v.description.length > 20,
    hasLocalisation: !!(v.ville || v.codePostal),
    hasContact: !!v.contactTelephone,
  });
  const trustColor =
    trust.niveau === "excellent"
      ? "text-emerald-600"
      : trust.niveau === "bon"
        ? "text-gold-dark"
        : trust.niveau === "moyen"
          ? "text-amber-600"
          : "text-slate-500";
  const whatsapp = `https://wa.me/${(v.contactTelephone || "").replace(/\D/g, "")}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par l'annonce "${v.titre}" (réf #${v.id}) sur MKA.P-MS.`,
  )}`;
  function requireLogin(action: () => void) {
    if (!user) return navigate("/connexion");
    action();
  }

  const details: [string, unknown][] = [
    ["Marque", v.marque],
    ["Modèle", v.modele],
    ["Version", v.version],
    ["Année", v.annee],
    ["Kilométrage", v.kilometrage != null ? `${v.kilometrage.toLocaleString("fr-FR")} km` : null],
    ["Énergie", v.carburant],
    ["Boîte", v.boite],
    ["Couleur", v.couleur],
    ["Portes", v.portes],
    ["Places", v.places],
    ["Puissance", v.puissanceCv ? `${v.puissanceCv} ch` : null],
    ["État", v.etat],
  ];

  const primaryAction = () =>
    requireLogin(() => {
      if (isLocation) {
        navigate("/compte/messages");
      } else {
        document.getElementById("reserver")?.scrollIntoView({ behavior: "smooth" });
      }
    });
  const messageAction = () => requireLogin(() => navigate("/compte/messages"));

  /* ══════════════════════════════════════════════════════════════════
     PAGE MKA.P-MS OFFICIEL — layout dédié, ordre exact de la maquette
     ══════════════════════════════════════════════════════════════════ */
  if (isMkapmsStock && !isLocation) {
    const allPhotos = allCategoryPhotos.length > 0 ? allCategoryPhotos : (v.photoPrincipale ? [v.photoPrincipale] : []);
    const mkaPhotoCategories = [
      { key: "exterieur", label: "Extérieur" },
      { key: "interieur", label: "Intérieur" },
      { key: "sieges", label: "Sièges" },
      { key: "tableau", label: "Tableau de bord" },
      { key: "coffre", label: "Coffre" },
      { key: "moteur", label: "Moteur" },
      { key: "roues", label: "Roues" },
      { key: "documents", label: "Documents" },
      { key: "autres", label: "Autres" },
      { key: "video360_1", label: "Vidéo 360° #1" },
      { key: "video360_2", label: "Vidéo 360° #2" },
      { key: "video360_3", label: "Vidéo 360° #3" },
      { key: "video360_4", label: "Vidéo 360° #4" },
      { key: "video360_5", label: "Vidéo 360° #5" },
      { key: "video_1", label: "Vidéo #1" },
      { key: "video_2", label: "Vidéo #2" },
      { key: "video_3", label: "Vidéo #3" },
      { key: "video_4", label: "Vidéo #4" },
      { key: "video_5", label: "Vidéo #5" },
    ];

    /* === GALERIE PHOTO MKA.P-MS (page séparée — EXACTEMENT même système Pro/Particulier) === */
    if (proGalleryOpen) {
      return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          {/* Header galerie — bien descendu pour éviter la zone notch */}
          <div className="flex items-center justify-between border-b px-4 py-4 pt-14">
            <button onClick={() => { setProGalleryOpen(false); setPhotoCat("toutes" as PhotoCategory); setPhotoIdx(0); }} className="text-[#111] p-2"><ChevronLeft size={28} /></button>
            <span className="text-sm font-bold text-[#111]">{photoIdx + 1}/{allPhotos.length}</span>
            <div className="w-10" />
          </div>
          {/* Catégories — bien descendues */}
          <div className="flex gap-2 overflow-x-auto border-b px-4 py-4">
            {mkaPhotoCategories.map((cat) => (
              <button key={cat.key} onClick={() => setProGalleryCat(cat.key)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${proGalleryCat === cat.key ? "border-red-500 text-red-500" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                {cat.label}
              </button>
            ))}
          </div>
          {/* Photo — swipe gauche/droite avec le doigt */}
          <div className="flex-1 flex items-center justify-center bg-white px-2 relative overflow-hidden"
            onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const startX = (e.currentTarget as any)._touchX;
              const endX = e.changedTouches[0].clientX;
              const diff = startX - endX;
              if (diff > 50) setPhotoIdx((i) => Math.min(allPhotos.length - 1, i + 1));
              if (diff < -50) setPhotoIdx((i) => Math.max(0, i - 1));
            }}
          >
            {allPhotos.length > 0 ? (
              <img src={allPhotos[photoIdx] || ""} alt={v.titre} className="max-w-full object-contain" style={{maxHeight: '55vh'}} />
            ) : (
              <p className="text-slate-400">Aucune photo</p>
            )}
          </div>
          {/* Info en bas */}
          <div className="border-t px-4 py-3">
            <p className="text-lg font-extrabold text-[#111]">{v.titre}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-extrabold text-[#111]">{formatPrice(Number(v.prix))}</span>
              <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Offre équitable</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#111] text-sm font-bold text-white" onClick={messageAction}><Mail size={16} /> Message</button>
              {v.contactTelephone ? (
                <a href={`tel:${v.contactTelephone}`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2d3436] text-sm font-bold text-white"><Phone size={16} /> Appeler</a>
              ) : (
                <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2d3436] text-sm font-bold text-white" onClick={messageAction}><Phone size={16} /> Appeler</button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="pb-40 md:pb-10">
        {/* ── 2. PHOTO VÉHICULE — pleine largeur, bord à bord, comme Pro ── */}
        <div className="w-full">
          <div className="relative w-full overflow-hidden bg-slate-100" style={{ height: "clamp(350px, 58vh, 560px)" }}
            onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
            onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - ((e.currentTarget as any)._touchX || 0); if (dx < -40) setPhotoIdx((i) => Math.min(allPhotos.length - 1, i + 1)); if (dx > 40) setPhotoIdx((i) => Math.max(0, i - 1)); }}
          >
            {allPhotos.length > 0 ? (
              <img
                src={allPhotos[photoIdx] || ""}
                alt={v.titre}
                className="h-full w-full object-cover cursor-pointer"
                onClick={() => { setProGalleryCat("exterieur"); setProGalleryOpen(true); }}
              />
            ) : (
              <div className="grid h-full place-items-center text-slate-400">Pas de photo</div>
            )}
            {/* Swipe gauche/droite — même système que Pro/Particulier */}
            {/* Badge logo MKA.P-MS — haut gauche, compact */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-[#111]/85 px-2 py-1 backdrop-blur-sm shadow">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#D4AF37] text-[9px] font-extrabold text-[#111]">M</span>
              <div className="leading-tight">
                <p className="text-[8px] font-medium uppercase text-slate-300">Véhicule Société</p>
                <p className="text-[10px] font-bold text-[#D4AF37]">MKA.P-MS</p>
              </div>
            </div>
            {/* Compteur photos — bas gauche */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              {allPhotos.length > 0 && (
                <span className="rounded-md bg-white/95 px-2.5 py-1 text-xs font-bold text-noir shadow">{photoIdx + 1}/{allPhotos.length}</span>
              )}
            </div>
            {/* Boutons flottants Appel + WhatsApp — petits, glow or lumineux, comme Pro */}
            <div className={`fixed right-2 flex flex-col gap-2 transition-all duration-500 ${scrollHidden ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100"}`} style={{top: '45%', zIndex: 40}}>
              <a href={`tel:${v.contactTelephone || ""}`} className="flex h-8 w-8 items-center justify-center rounded-full text-white transition" style={{backgroundColor: '#2d3436', zIndex: 20, boxShadow: '0 0 12px rgba(212,175,55,0.6), 0 0 4px rgba(45,52,54,0.9)'}}><Phone size={13} /></a>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full transition" style={{backgroundColor: '#25D366', zIndex: 20, boxShadow: '0 0 16px rgba(212,175,55,0.8), 0 0 6px rgba(37,211,102,0.9), 0 0 30px rgba(212,175,55,0.3)'}}>
                <svg width="14" height="14" viewBox="0 0 448 512" fill="white"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Carte prix montée au-dessus de la photo — même système Pro */}
        <div className="container-page -mt-12 relative z-10">
          <div className="rounded-2xl border-2 border-[#111] bg-white p-5 pb-6 text-center" style={{boxShadow: '0 0 18px rgba(212,175,55,0.35), 0 4px 20px rgba(0,0,0,0.12)'}}>
            <h1 className="text-xl font-extrabold text-[#111] md:text-2xl">{v.titre}</h1>
            {v.motorisation && <p className="mt-1 text-sm text-slate-500">{v.marque} {v.modele} {v.motorisation}</p>}
            <p className="mt-0.5 text-xs text-slate-400">Réf. annonce : DEMO-{v.id}</p>
            <p className="mt-2 text-2xl font-extrabold text-[#B8960C]">{formatPrice(Number(v.prix))}</p>
            <p className="text-xs text-slate-500">Prix TTC · Frais inclus</p>
            <p className="mt-1 text-xs text-slate-500">ou {Math.round(Number(v.prix) / 60)} €/mois</p>
            <div className="mt-2"><span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37] bg-[#FFFDF5] px-3 py-0.5 text-[10px] font-bold text-[#D4AF37]"><ShieldCheck size={10} /> MKA.P-MS Certifié</span></div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(v.ville || "Belloy-en-France 95270")}`, "_blank")}>
              <MapPin size={14} className="text-red-500" />
              <span className="text-xs font-medium text-slate-600">{v.ville || "Belloy-en-France"} · 95270</span>
            </div>
          </div>
        </div>

        <div className="container-page space-y-5 py-5">
          {/* ── 4. Favoris + Partager ── */}
          <div className="flex items-center justify-between px-2">
            <button className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-noir" onClick={() => { setIsFav(!isFav); requireLogin(() => toggleFav.mutate({ annonceId: v.id })); }}><Heart size={18} className={isFav ? "text-red-500 fill-red-500" : ""} /> {isFav ? "Favori" : "Ajouter aux favoris"}</button>
            <button className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-noir" onClick={() => { if (navigator.share) navigator.share({ title: v.titre, url: window.location.href }); }}><Share2 size={18} /> Partager</button>
          </div>

          {/* ── 8. DESCRIPTION — onglets défilables avec TOUTES les catégories ── */}
          <div className="border-t-2 border-b-2 border-[#111]/40 py-5" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15), 0 2px 8px rgba(212,175,55,0.15)'}}>
            <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
              {[
                { key: "description", label: "Description" },
                { key: "points_forts", label: "Points forts" },
                { key: "equipements", label: "Équipements" },
                { key: "imperfections", label: "Imperfections" },
                { key: "carrosserie", label: "Carrosserie" },
                { key: "moteur", label: "Moteur" },
                { key: "confort", label: "Confort" },
                { key: "multimedia", label: "Multimédia" },
                { key: "securite", label: "Sécurité" },
                { key: "autres", label: "Autres" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDescTab(tab.key)}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    descTab === tab.key ? "border-noir bg-white text-noir shadow-sm" : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                  }`}
                >{tab.label}</button>
              ))}
            </div>

            {/* Description */}
            {descTab === "description" && <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">{v.description || "Aucune description fournie."}</p>}

            {/* Points forts */}
            {descTab === "points_forts" && (v.pointsForts ? <ul className="space-y-3">{v.pointsForts.map((pf: string) => <li key={pf} className="flex items-center gap-2 text-base text-slate-700"><ShieldCheck size={16} className="text-[#D4AF37]" /> {pf}</li>)}</ul> : <p className="text-sm text-slate-400">Aucun point fort renseigné.</p>)}

            {/* Équipements */}
            {descTab === "equipements" && (v.equipements ? <div className="grid grid-cols-2 gap-2">{v.equipements.map((eq: string) => <div key={eq} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm"><ShieldCheck size={14} className="text-emerald-600" /> {eq}</div>)}</div> : <p className="text-sm text-slate-400">Aucun équipement renseigné.</p>)}

            {/* Imperfections */}
            {descTab === "imperfections" && (v.imperfections ? <ul className="space-y-3">{v.imperfections.map((imp: string) => <li key={imp} className="flex items-center gap-2 text-base text-slate-600"><Flag size={16} className="text-orange-500" /> {imp}</li>)}</ul> : <p className="text-sm text-slate-400">Aucune imperfection signalée.</p>)}

            {/* Carrosserie et habitacle */}
            {descTab === "carrosserie" && (
              <div className="space-y-0">
                {[
                  { label: "Classe du véhicule", value: v.categorie || "Berline" },
                  { label: "Portes", value: "5" },
                  { label: "Nombre de places", value: "5" },
                  { label: "Couleur", value: v.couleur || "—" },
                  { label: "Sellerie", value: "Tissu" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between border-b border-slate-100 py-3">
                    <span className="text-sm text-slate-600">{r.label}</span>
                    <span className="text-sm font-medium text-[#111]">{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Moteur et consommation */}
            {descTab === "moteur" && (
              <div className="space-y-0">
                {[
                  { label: "Cylindrée", value: v.cylindree || "—" },
                  { label: "Consommation", value: v.consommation || "—" },
                  { label: "Classe d'émission", value: v.classeEmission || "EURO 6" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between border-b border-slate-100 py-3">
                    <span className="text-sm text-slate-600">{r.label}</span>
                    <span className="text-sm font-medium text-[#111]">{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Confort */}
            {descTab === "confort" && (
              <ul className="space-y-3">
                {["Climatisation automatique", "Sièges chauffants", "Rétroviseurs électriques", "Volant multifonction", "Accoudoir central"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#111]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#111]" />{item}</li>
                ))}
              </ul>
            )}

            {/* Multimédia */}
            {descTab === "multimedia" && (
              <ul className="space-y-3">
                {["Écran tactile", "Navigation GPS", "Bluetooth", "Apple CarPlay / Android Auto", "Système audio premium"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#111]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#111]" />{item}</li>
                ))}
              </ul>
            )}

            {/* Sécurité */}
            {descTab === "securite" && (
              <ul className="space-y-3">
                {["ABS", "ESP", "Airbags frontaux et latéraux", "Aide au stationnement", "Caméra de recul", "Régulateur de vitesse"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#111]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#111]" />{item}</li>
                ))}
              </ul>
            )}

            {/* Autres */}
            {descTab === "autres" && (v.equipements ? (
              <ul className="space-y-3">
                {v.equipements.map((item: string) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#111]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#111]" />{item}</li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-400">Aucun équipement supplémentaire.</p>)}
          </div>

          {/* ── BOUTON RÉSERVER (fin et long) ── */}
          <button
            className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white transition hover:bg-[#333]"
            onClick={() => requireLogin(() => document.getElementById("reserver-mkapms")?.scrollIntoView({ behavior: "smooth" }))}
          >
            <CalendarCheck size={16} className="mr-2 inline-block text-red-500" /> Réserver ce véhicule
          </button>

          {/* ── 9. CARACTÉRISTIQUES PRINCIPALES — traits ouverts gauche/droite ── */}
          <div className="border-t-2 border-b-2 border-[#111]/40 py-5" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15), 0 2px 8px rgba(212,175,55,0.15)'}}>
            <h2 className="mb-4 text-lg font-bold text-noir">Caractéristiques principales</h2>
            <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
              {[
                { label: "Marque", value: v.marque },
                { label: "Modèle", value: v.modele },
                { label: "Année", value: v.annee },
                { label: "Kilométrage", value: v.kilometrage ? `${v.kilometrage.toLocaleString("fr-FR")} km` : "—" },
                { label: "Énergie", value: v.carburant },
                { label: "Localisation", value: v.ville },
              ].map((c) => (
                <div key={c.label} className="text-center">
                  <p className="text-xs text-slate-400">{c.label}</p>
                  <p className="text-sm font-bold text-noir">{c.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FINANCEMENT MKA.P-MS — même système que Pro ── */}
          <div className="border-t-2 border-b-2 border-[#111]/40 py-5" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15), 0 2px 8px rgba(212,175,55,0.15)'}}>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><CreditCard size={18} className="text-red-500" /> Financement</h2>
            <div className="mt-3 rounded-xl border border-slate-200 p-5">
              <div className="flex gap-2 mb-3">
                <span onClick={() => setProFinanceTab('paiement')} className={`rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer transition ${proFinanceTab === 'paiement' ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' : 'text-slate-400 hover:text-[#111]'}`}>Paiement en plusieurs fois</span>
                <span onClick={() => setProFinanceTab('loa')} className={`rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer transition ${proFinanceTab === 'loa' ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' : 'text-slate-400 hover:text-[#111]'}`}>LOA</span>
              </div>
              {proFinanceTab === 'paiement' ? (
                <>
                  <p className="text-center text-xl font-extrabold text-[#111]">Dès {Math.round(Number(v.prix) / 60)} €<span className="text-sm font-normal text-slate-500">/mois</span></p>
                  <p className="text-center text-[10px] text-slate-400 mt-1">Sur 60 mois • Sans apport</p>
                </>
              ) : (
                <>
                  <p className="text-center text-xl font-extrabold text-[#111]">Dès {Math.round(Number(v.prix) / 48)} €<span className="text-sm font-normal text-slate-500">/mois</span></p>
                  <p className="text-center text-[10px] text-slate-400 mt-1">LOA sur 48 mois • Apport 10%</p>
                </>
              )}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">● Disponible</span>
              </div>
              <button className="mt-4 w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white" onClick={() => requireLogin(() => navigate("/finance"))}>Faire une offre au vendeur</button>
            </div>
          </div>

          {/* ── 10. VÉHICULE CERTIFIÉ MKA.P-MS — compact, fond premium clair, style plaque vitrée ── */}
          <div className="overflow-hidden rounded-xl border-2 border-[#111] bg-gradient-to-br from-white to-[#FFFDF5]" style={{boxShadow: '0 0 14px rgba(212,175,55,0.25), 0 2px 12px rgba(0,0,0,0.08)'}}>
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#D4AF37]" />
                <h2 className="text-base font-extrabold text-[#111]">Véhicule certifié MKA.P-MS</h2>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">Chaque véhicule est contrôlé avant sa mise en vente.</p>
            </div>
            <div className="grid grid-cols-4 gap-2 px-3 pb-3 md:grid-cols-8">
              {[
                { icon: Wrench, label: "Contrôle mécanique", sub: "120 points", to: "/services" },
                { icon: History, label: "Historique", sub: "vérifié", to: "/historique" },
                { icon: TrendingUp, label: "Essai routier", sub: "effectué", to: "/services" },
                { icon: BarChart3, label: "Kilométrage", sub: "certifié", to: "/services" },
                { icon: FileText, label: "Rapport", sub: "disponible", to: "/historique" },
                { icon: Truck, label: "Livraison", sub: "possible", to: "/services" },
                { icon: Shield, label: "Garantie", sub: "disponible", to: "/services" },
                { icon: Award, label: "Assistance", sub: "administrative", to: "/services" },
              ].map((item) => (
                <Link key={item.label} to={item.to} className="flex flex-col items-center text-center transition hover:scale-105">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10">
                    <item.icon size={18} strokeWidth={2.5} className="text-[#D4AF37]" />
                  </div>
                  <p className="mt-1 text-[10px] font-bold leading-tight text-[#111]">{item.label}</p>
                  <p className="text-[9px] font-medium text-[#D4AF37]">{item.sub}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* ── 11-12. ÉTAT DU VÉHICULE + HISTORIQUE COMPLET ── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* 11. État du véhicule — compact, contour foncé plaque */}
            <div className="overflow-hidden rounded-xl border-2 border-[#111]" style={{boxShadow: '0 0 10px rgba(212,175,55,0.15), 0 2px 6px rgba(0,0,0,0.06)'}}>
              <div className="bg-gradient-to-br from-emerald-50 to-white p-3 text-center">
                <h3 className="flex items-center justify-center gap-2 text-sm font-bold text-noir"><Battery size={16} strokeWidth={2.5} /> État du véhicule</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Batterie hybride</p>
                <p className="mt-0.5 text-3xl font-extrabold text-emerald-600">97 %</p>
                <p className="text-xs font-bold text-emerald-600">Excellent état</p>
                <div className="mx-auto mt-2 flex max-w-[160px] gap-0.5">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-sm ${i < 19 ? "bg-emerald-500" : "bg-slate-200"}`} />
                  ))}
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><ShieldCheck size={12} strokeWidth={2.5} /> Garantie batterie disponible</p>
              </div>
            </div>

            {/* 12. Historique complet — traits haut/bas foncés, ouverts gauche/droite */}
            <div className="border-t-2 border-b-2 border-[#111]/40 overflow-hidden" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15), 0 2px 8px rgba(212,175,55,0.15)'}}>
              <div className="bg-gradient-to-br from-slate-50 to-white p-4">
                <h3 className="text-lg font-bold text-noir">Historique complet</h3>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {["Kilométrage", "Vol", "Gage", "Entretien", "Importation", "Contrôle technique", "Propriétaires", "Sinistres"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm font-medium text-noir">
                      <ShieldCheck size={14} strokeWidth={2.5} className="text-emerald-600" /> {item}
                    </div>
                  ))}
                </div>
                <Link to="/historique" className="mt-4 block w-full rounded-xl bg-[#111] py-3 text-center text-sm font-bold text-white hover:bg-[#333] transition">Voir le rapport complet</Link>
                <p className="mt-1.5 text-center text-xs text-slate-400">À partir de 2,99 €</p>
              </div>
            </div>
          </div>

          {/* ── 13. SERVICES DISPONIBLES — traits haut/bas foncés, ouverts gauche/droite ── */}
          <div className="border-t-2 border-b-2 border-[#111]/40 py-5" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15), 0 2px 8px rgba(212,175,55,0.15)'}}>
            <h2 className="mb-4 text-center text-lg font-bold text-noir">Services disponibles</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { icon: Wrench, label: "Devis garage", to: "/garages" },
                { icon: Truck, label: "Livraison", to: "/services" },
                { icon: FileCheck, label: "Carte grise", to: "/carte-grise" },
                { icon: Search, label: "Contrôle avant achat", to: "/services" },
                { icon: Wrench, label: "Dépannage", to: "/services" },
                { icon: Shield, label: "Garantie", to: "/services" },
                { icon: TrendingUp, label: "Reprise", to: "/services" },
                { icon: CreditCard, label: "Financement", to: "/finance" },
                { icon: Award, label: "Expertise", to: "/services" },
              ].map((svc) => (
                <Link key={svc.label} to={svc.to} className="flex shrink-0 flex-col items-center text-center transition hover:scale-105" style={{ width: "80px" }}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 shadow-sm">
                    <svc.icon size={24} strokeWidth={2} className="text-[#D4AF37]" />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold leading-tight text-noir">{svc.label}</p>
                </Link>
              ))}
            </div>
            <Link to="/services" className="mt-4 block text-center text-sm font-bold text-[#D4AF37]">Voir tous nos services →</Link>
          </div>

          {/* ── SECTION PRIX — même système que Pro/Particulier ── */}
          <div className="border-t border-slate-100 pt-4">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><TrendingUp size={18} className="text-red-500" /> Prix</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-extrabold text-[#111]">{formatPrice(Number(v.prix))}</span>
              <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">Offre équitable</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Le prix est dans la moyenne des véhicules similaires.</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer" onClick={() => setShowPriceHistory(!showPriceHistory)}>
                <span className="text-sm text-[#111]">Historique</span>
                <ChevronRight size={16} className={`text-red-500 transition-transform ${showPriceHistory ? "rotate-90" : ""}`} />
              </div>
              {showPriceHistory && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs font-bold text-[#111]">Historique du prix</p>
                  <div className="space-y-2">
                    {[{date:"Aujourd'hui",prix:Number(v.prix),tag:"Prix actuel"},{date:"Il y a 7 jours",prix:Math.round(Number(v.prix)*1.02),tag:""},{date:"Il y a 30 jours",prix:Math.round(Number(v.prix)*1.05),tag:"Premiere mise en ligne"},{date:"Il y a 60 jours",prix:Math.round(Number(v.prix)*1.08),tag:""}].map((h,i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div><p className="text-xs text-[#111] font-semibold">{h.date}</p>{h.tag && <p className="text-[9px] text-slate-500">{h.tag}</p>}</div>
                        <div className="text-right"><p className="text-xs font-bold text-[#111]">{formatPrice(h.prix)}</p>{i>0 && <p className="text-[9px] text-green-600">-{Math.round((1-Number(v.prix)/h.prix)*100)}%</p>}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-2">
                    <TrendingUp size={14} className="text-green-600" />
                    <p className="text-[10px] text-green-700 font-semibold">Le prix a baisse depuis la mise en ligne</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer" onClick={() => setShowCote(!showCote)}>
                <span className="text-sm text-[#111]">Cote du véhicule</span>
                <span className="text-xs font-semibold text-[#111] underline">Consulter</span>
              </div>
              {showCote && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs font-bold text-[#111]">Cote du vehicule</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500">Estimation basse</p>
                      <p className="text-sm font-bold text-[#111]">{formatPrice(Math.round(Number(v.prix)*0.88))}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-slate-500">Cote moyenne</p>
                      <p className="text-sm font-extrabold text-[#D4AF37]">{formatPrice(Math.round(Number(v.prix)*0.95))}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[10px] text-slate-500">Estimation haute</p>
                      <p className="text-sm font-bold text-[#111]">{formatPrice(Math.round(Number(v.prix)*1.05))}</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-white bg-[#111] shadow" style={{left:'55%'}} />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-[#FFFDF5] border border-[#D4AF37]/30 p-2">
                    <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[9px] font-bold">Offre equitable</span>
                    <p className="text-[10px] text-[#374151]">Le prix est dans la moyenne du marche</p>
                  </div>
                </div>
              )}
            </div>
            <button className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-[#111]" onClick={() => requireLogin(() => setShowAlertPanel(true))}>Créer une alerte prix</button>
            {showAlertPanel && (
              <div className="mt-3 rounded-xl border border-[#D4AF37]/30 bg-[#FFFDF5] p-4">
                <p className="text-sm font-bold text-[#111]">Alerte prix enregistree !</p>
                <p className="mt-1 text-xs text-slate-500">Vous serez notifie si le prix de "{v.titre}" change.</p>
                <div className="mt-2 flex items-center gap-2"><Bell size={14} className="text-[#D4AF37]" /><span className="text-[10px] text-[#374151]">Notifications par email et push</span></div>
                <button className="mt-3 w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-white" onClick={() => setShowAlertPanel(false)}>OK</button>
              </div>
            )}
          </div>

          {/* ── VENDEUR + LOCALISATION — réduit, même plaque premium que Pro ── */}
          <div className="rounded-xl border-2 border-[#111] overflow-hidden" style={{boxShadow: '0 0 14px rgba(212,175,55,0.25), 0 2px 12px rgba(0,0,0,0.08)'}}>
            {/* Vendeur en haut */}
            <div className="p-4">
              <h2 className="text-base font-bold text-noir">Vendeur</h2>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                  <Store size={18} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-noir">MKA.P-MS — Garage franchisé</p>
                  <p className="text-[11px] text-slate-500">Société certifiée</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Star size={12} className="fill-[#D4AF37] text-[#D4AF37]" />
                    <span className="text-xs font-bold text-noir">4,8</span>
                    <span className="text-[10px] text-slate-400">(128 avis)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span className="text-xs text-slate-600">Paiement sécurisé</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-emerald-600" />
                  <span className="text-xs text-slate-600">Réponse en 1h</span>
                </div>
              </div>
              <button className="mt-3 w-full rounded-xl bg-[#111] py-2.5 text-sm font-bold text-white" onClick={() => requireLogin(() => navigate("/compte/messages"))}>Demander un essai routier</button>
            </div>
            {/* Localisation — carte réduite */}
            <div className="border-t border-slate-100">
              <div className="flex items-center gap-2 px-4 pt-2 pb-1">
                <MapPin size={14} className="text-red-500" />
                <h3 className="text-xs font-bold text-noir">Localisation</h3>
              </div>
              <div className="relative h-16 w-full bg-slate-100 cursor-pointer" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(v.ville || "Belloy-en-France 95270")}`, "_blank")}>
                <iframe
                  title="Localisation véhicule"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(v.ville || "Belloy-en-France 95270")}&output=embed&z=13`}
                  className="h-full w-full pointer-events-none"
                  loading="lazy"
                />
              </div>
              <div className="px-4 py-1.5">
                <p className="text-xs font-bold text-noir">{v.ville || "Belloy-en-France"}</p>
                <p className="text-[10px] text-slate-500">95270</p>
              </div>
            </div>
          </div>

          {/* ── ALLER PLUS LOIN ── */}
          <div className="border-t-2 border-[#111]/40 pt-4" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}}>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]">Aller plus loin</h2>
            <div className="mt-3 space-y-3">
              {[
                { icon: <FileText size={18} className="text-red-500" />, title: "Cote du véhicule", desc: "Consultez la cote de ce véhicule", action: () => { setShowCote(true); window.scrollTo({top:0,behavior:'smooth'}); } },
                { icon: <History size={18} className="text-red-500" />, title: "Historique complet", desc: "Consultez l'historique complet", action: () => { setShowPriceHistory(true); window.scrollTo({top:0,behavior:'smooth'}); } },
                { icon: <FileCheck size={18} className="text-red-500" />, title: "Fiche Technique", desc: "Toutes les informations du véhicule", action: () => navigate(`/catalogue-technique`) },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 border-b border-[#111]/15 pb-3 cursor-pointer" onClick={item.action}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">{item.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-[#111] underline">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── PUBLICITÉS — carrousel défilant ── */}
          <div className="overflow-hidden">
            <p className="mb-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Publicités</p>
            <div className="flex animate-[scroll_16s_linear_infinite] gap-3" style={{ width: "fit-content" }}>
              {[
                { src: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=250&fit=crop", title: "Pièces Auto de Qualité", link: "/pieces" },
                { src: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=250&fit=crop", title: "Culasse Moteur Performance", link: "/pieces" },
                { src: "https://images.unsplash.com/photo-1607603750909-408e193868c7?w=400&h=250&fit=crop", title: "Huile Moteur 5W-30", link: "/pieces" },
                { src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=250&fit=crop", title: "Boostez votre visibilité", link: "/abonnements" },
              ].map((pub, i) => (
                <Link key={i} to={pub.link} className="shrink-0 w-72 overflow-hidden rounded-xl block shadow-lg">
                  <img src={pub.src} alt={pub.title} className="h-44 w-full object-cover" loading="lazy" />
                </Link>
              ))}
              {[
                { src: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=250&fit=crop", title: "Pièces Auto de Qualité", link: "/pieces" },
                { src: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=250&fit=crop", title: "Culasse Moteur Performance", link: "/pieces" },
                { src: "https://images.unsplash.com/photo-1607603750909-408e193868c7?w=400&h=250&fit=crop", title: "Huile Moteur 5W-30", link: "/pieces" },
                { src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=250&fit=crop", title: "Boostez votre visibilité", link: "/abonnements" },
              ].map((pub, i) => (
                <Link key={`dup-${i}`} to={pub.link} className="shrink-0 w-72 overflow-hidden rounded-xl block shadow-lg">
                  <img src={pub.src} alt={pub.title} className="h-44 w-full object-cover" loading="lazy" />
                </Link>
              ))}
            </div>
          </div>

          {/* ── FOOTER — après publicités ── */}
          <div className="mt-4 border-t-2 border-[#111]/40 pt-4 text-center space-y-2" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}}>
            <p className="text-xs font-semibold text-[#111] underline cursor-pointer" onClick={() => setShowReport(true)}>Signaler cette annonce</p>
            <p className="text-xs font-semibold text-[#111] underline cursor-pointer">Vos droits et obligations</p>
            <p className="text-[10px] text-slate-400">Réf. pro : {v.vendeur?.id || "MKA"} | Réf. annonce : {v.reference || v.id}</p>
          </div>

        </div>

        {/* Barre fixe mobile MKA.P-MS — décollée, disparaît au scroll */}
        <div className={`fixed inset-x-0 z-30 border-t-2 border-[#D4AF37]/30 bg-white p-3 shadow-[0_-6px_20px_rgba(0,0,0,0.12)] md:hidden transition-all duration-300 ${scrollHidden ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`} style={{ bottom: 'calc(52px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="container-page">
            <div className="grid grid-cols-2 gap-3">
              <button className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#2d3436] text-sm font-bold text-white" onClick={primaryAction}><ShoppingCart size={16} /> Acheter</button>
              <button className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#111] text-sm font-bold text-white" onClick={messageAction}><Mail size={16} /> Message</button>
            </div>
          </div>
        </div>

        {/* Modal signalement */}
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowReport(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-bold text-[#111]">Signaler cette annonce</h3>
              <p className="mt-1 text-xs text-slate-500">Réf. {v.reference || `#${v.id}`} — {v.titre}</p>
              {reportSent ? (
                <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                  <p className="text-sm font-semibold text-green-700">Signalement envoyé</p>
                  <button onClick={() => { setShowReport(false); setReportSent(false); setReportReason(""); }} className="mt-3 rounded-lg bg-[#111] px-4 py-2 text-xs font-bold text-white">Fermer</button>
                </div>
              ) : (
                <>
                  <div className="mt-3 space-y-2">
                    {["Annonce frauduleuse", "Photos non conformes", "Prix incorrect", "Véhicule déjà vendu", "Contenu inapproprié", "Autre"].map((r) => (
                      <button key={r} onClick={() => setReportReason(r)} className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${reportReason === r ? "border-[#D4AF37] bg-[#D4AF37]/10 font-semibold text-[#111]" : "border-slate-200 text-slate-600 hover:border-[#D4AF37]"}`}>{r}</button>
                    ))}
                  </div>
                  <button disabled={!reportReason} onClick={() => setReportSent(true)} className="mt-4 w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40">Envoyer le signalement</button>
                  <button onClick={() => setShowReport(false)} className="mt-2 w-full text-center text-xs text-slate-400">Annuler</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* LIGHTBOX plein écran */}
        {hasPhotoCategories && lightboxOpen && (() => {
          const catPhotos = (v.photoCategories[photoCat] || []) as string[];
          const lbIdx = Math.min(lightboxIdx, Math.max(0, catPhotos.length - 1));
          return (
            <div className="fixed inset-0 z-50 flex flex-col bg-black" onClick={() => { setLightboxOpen(false); setPhotoCat("toutes" as PhotoCategory); setPhotoIdx(0); }}>
              {/* Onglets catégories — descendus sous la barre d'état */}
              <div className="flex items-center justify-between px-4 pb-3" style={{ paddingTop: "max(5rem, calc(env(safe-area-inset-top, 2rem) + 3rem))" }} onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {PHOTO_CATEGORIES.filter((c) => (v.photoCategories[c.key] || []).length > 0).map((c) => (
                    <button key={c.key} onClick={() => { setPhotoCat(c.key); setLightboxIdx(0); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${photoCat === c.key ? "bg-[#D4AF37] text-black" : "border border-white/30 text-white/70 hover:border-[#D4AF37] hover:text-white"}`}>{c.label}</button>
                  ))}
                </div>
                <button onClick={() => { setLightboxOpen(false); setPhotoCat("toutes" as PhotoCategory); setPhotoIdx(0); }} className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 text-lg font-bold">✕</button>
              </div>
              {/* Photo lightbox — légèrement plus petite que plein écran */}
              <div className="relative flex flex-1 items-center justify-center px-4 pb-8" onClick={(e) => e.stopPropagation()}>
                {catPhotos.length > 0 ? <img src={catPhotos[lbIdx]} alt="" className="max-h-[65vh] w-full rounded-xl object-contain" /> : <p className="text-white/60">Aucune photo dans cette catégorie</p>}
                {catPhotos.length > 1 && (
                  <>
                    <button onClick={() => setLightboxIdx((i) => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft size={28} /></button>
                    <button onClick={() => setLightboxIdx((i) => Math.min(catPhotos.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight size={28} /></button>
                  </>
                )}
                {catPhotos.length > 0 && <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{lbIdx + 1} / {catPhotos.length}</span>}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     PAGE PRO — layout dédié vendeurs professionnels (vente uniquement)
     Design identique pour Pro Standard, Pro Premium, Pro Elite, Pro Vérifié
     NE s'applique PAS aux MKA.P-MS Officiel ni aux Particuliers
     ══════════════════════════════════════════════════════════════════ */
  if ((tier === "professionnel" || tier === "particulier" || tier === "elite" || (tier === "premium" && !isMkapmsStock)) && !isLocation) {
    const allPhotos = photos.length > 0 ? photos : (v.photoPrincipale ? [v.photoPrincipale] : []);
    const isParticulier = tier === "particulier";
    const proBadge = isParticulier ? "PARTICULIER" : v.tier === "elite" ? "PRO ELITE" : v.boosted ? "PRO PREMIUM" : "PRO";
    const proPhotoCategories = [
      { key: "toutes", label: "Toutes" },
      { key: "exterieur", label: "Extérieur" },
      { key: "interieur", label: "Intérieur" },
      { key: "sieges", label: "Sièges" },
      { key: "tableau_de_bord", label: "Tableau de bord" },
      { key: "coffre", label: "Coffre" },
      { key: "moteur", label: "Moteur" },
      { key: "roues", label: "Roues" },
      { key: "documents", label: "Documents" },
      { key: "autres", label: "Autres" },
      { key: "video360", label: "Vidéo 360°" },
      { key: "video", label: "Vidéo" },
    ];
    const proAds1 = [
      { title: "Votre pub ici", desc: "Espace disponible" },
      { title: "Garage certifié", desc: "Entretien & réparation" },
      { title: "Pièces détachées", desc: "Neuves & occasion" },
      { title: "Assurance auto", desc: "Devis en 2 min" },
      { title: "Livraison", desc: "France & Afrique" },
    ];
    const proAds2 = [
      { title: "Financement auto", desc: "Crédit simple & rapide" },
      { title: "Carte grise", desc: "En ligne en 24h" },
      { title: "Contrôle technique", desc: "Centre agréé" },
      { title: "Dépannage 24/7", desc: "Assistance partout" },
      { title: "Expertise", desc: "Rapport détaillé" },
    ];

    /* Auto-scroll pub */
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const t1 = setInterval(() => setProAdIdx1((i) => (i + 1) % proAds1.length), 4000);
      const t2 = setInterval(() => setProAdIdx2((i) => (i + 1) % proAds2.length), 5000);
      return () => { clearInterval(t1); clearInterval(t2); };
    }, []);

    /* === GALERIE PHOTO (page séparée) === */
    if (proGalleryOpen) {
      return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          {/* Header galerie — bien descendu pour éviter la zone notch */}
          <div className="flex items-center justify-between border-b px-4 py-4 pt-14">
            <button onClick={() => { setProGalleryOpen(false); setPhotoCat("toutes" as PhotoCategory); setPhotoIdx(0); }} className="text-[#111] p-2"><ChevronLeft size={28} /></button>
            <span className="text-sm font-bold text-[#111]">{activeCatPhotos.length > 0 ? `${activeCatIdx + 1}/${activeCatPhotos.length}` : "0"}</span>
            <div className="w-10" />
          </div>
          {/* Catégories — bien descendues */}
          <div className="flex gap-2 overflow-x-auto border-b px-4 py-4">
            {proPhotoCategories.map((cat) => (
              <button key={cat.key} onClick={() => { setPhotoCat(cat.key as PhotoCategory); setPhotoIdx(0); }} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${photoCat === cat.key ? "border-red-500 text-red-500" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                {cat.label}
              </button>
            ))}
          </div>
          {/* Photo — swipe gauche/droite avec le doigt */}
          <div className="flex-1 flex items-center justify-center bg-white px-2 relative overflow-hidden"
            onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const startX = (e.currentTarget as any)._touchX;
              const endX = e.changedTouches[0].clientX;
              const diff = startX - endX;
              if (diff > 50) setPhotoIdx((i) => Math.min(activeCatPhotos.length - 1, i + 1));
              if (diff < -50) setPhotoIdx((i) => Math.max(0, i - 1));
            }}
          >
            {activeCatPhotos.length > 0 ? (
              <img src={activeCatPhotos[activeCatIdx] || ""} alt={v.titre} className="max-w-full object-contain" style={{maxHeight: '55vh'}} />
            ) : (
              <p className="text-slate-400">Aucune photo dans cette catégorie</p>
            )}
          </div>
          {/* Info en bas */}
          <div className="border-t px-4 py-3">
            <p className="text-lg font-extrabold text-[#111]">{v.titre}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-extrabold text-[#111]">{formatPrice(Number(v.prix))}</span>
              <span className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Offre équitable</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#111] text-sm font-bold text-white" onClick={messageAction}><Mail size={16} /> Message</button>
              {v.contactTelephone ? (
                <a href={`tel:${v.contactTelephone}`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e11d48] text-sm font-bold text-white"><Phone size={16} /> Appeler</a>
              ) : (
                <button className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e11d48] text-sm font-bold text-white" onClick={messageAction}><Phone size={16} /> Appeler</button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="pb-24 md:pb-20">
        {/* ===== PHOTO PRINCIPALE (pleine largeur, clic → galerie, swipe gauche/droite) ===== */}
        <div className="relative w-full h-[55vh] md:h-[58vh] lg:h-[62vh] bg-slate-100 cursor-pointer"
          onClick={() => setProGalleryOpen(true)}
          onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchX;
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 50) { e.preventDefault(); }
            if (diff > 50) setPhotoIdx((i) => Math.min(activeCatPhotos.length - 1, i + 1));
            if (diff < -50) setPhotoIdx((i) => Math.max(0, i - 1));
          }}
        >
          {activeCatPhotos.length > 0 ? (
            <img src={activeCatPhotos[activeCatIdx] || ""} alt={v.titre} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-slate-400">Aucune photo dans cette catégorie</div>
          )}

          {/* Header overlay: retour + partage + favori */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md" style={{border: '1.5px solid #111', boxShadow: '0 0 8px rgba(212,175,55,0.3)'}}>
              <ChevronLeft size={20} className="text-[#111]" />
            </button>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(window.location.href); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md" style={{border: '1.5px solid #111', boxShadow: '0 0 8px rgba(212,175,55,0.3)'}}>
                <Share2 size={18} className="text-[#111]" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsFav(!isFav); requireLogin(() => toggleFav.mutate({ annonceId: v.id })); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md" style={{border: '1.5px solid #111', boxShadow: '0 0 8px rgba(212,175,55,0.3)'}}>
                <Heart size={18} className={isFav ? "text-red-500 fill-red-500" : "text-[#111]"} />
              </button>
            </div>
          </div>

          {/* Badge PRO + Compteur — bas gauche (plus haut car carte overlap) */}
          <div className="absolute bottom-16 left-4 flex items-center gap-2">
            <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-bold text-[#111]">{activeCatPhotos.length > 0 ? `${activeCatIdx + 1}/${activeCatPhotos.length}` : "0"}</span>
            <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-bold text-[#111]">{proBadge}</span>
          </div>

          {/* WhatsApp collé à droite — PRO uniquement — FIXED pour rester visible */}
          {!isParticulier && (
          <a href={whatsapp} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={`fixed right-2 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-500 ${scrollHidden ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`} style={{top: '45%', backgroundColor: '#25D366', zIndex: 40, boxShadow: scrollHidden ? 'none' : '0 0 16px rgba(212,175,55,0.8), 0 0 6px rgba(37,211,102,0.9), 0 0 30px rgba(212,175,55,0.3)'}}>
            <svg width="16" height="16" viewBox="0 0 448 512" fill="white"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
          </a>
          )}

        </div>

        {/* ===== CARTE INFO (overlap sur la photo, style Le Bon Coin) ===== */}
        <div className="container-page -mt-12 relative z-10">
          <div className="rounded-2xl border-2 border-[#111] bg-white p-5 pb-6" style={{boxShadow: '0 0 18px rgba(212,175,55,0.35), 0 4px 20px rgba(0,0,0,0.12)'}}>
            <h1 className="text-center text-xl font-extrabold text-[#111] md:text-2xl">{v.titre}</h1>
            <p className="text-center mt-1 text-xs text-slate-500">{v.ville || "Lyon"} · {v.annee || "2023"} · {v.kilometrage ? `${v.kilometrage.toLocaleString("fr-FR")} km` : ""} · {v.carburant || "Essence"}</p>
            <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-2xl font-extrabold text-[#111]">{formatPrice(Number(v.prix))}</span>
              {estimateQuery.data && Number(v.prix) > 0 && (() => {
                const est = estimateQuery.data;
                const prixNum = Number(v.prix);
                const label = prixNum <= est.mid * 0.97 ? "Bon prix" : prixNum <= est.high ? "Prix équitable" : "Au-dessus";
                return <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">{label}</span>;
              })()}
            </div>
            <p className="text-center mt-1 text-xs text-slate-500">ou {Math.round(Number(v.prix) / 60)} €/mois</p>
            <div className="mt-2 text-center"><span className="inline-flex items-center gap-1 rounded-full border border-green-600 bg-green-50 px-3 py-0.5 text-[10px] font-bold text-green-700"><ShieldCheck size={10} /> {isParticulier ? "Particulier vérifié" : "Pro vérifié"}</span></div>

            {/* VENDEUR PRO — carte maps premium petite + icône */}
            <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent((v.vendeur?.nom || 'MKA Motors') + ' ' + (v.ville || 'Paris'))}`, '_blank')}>
              <div className="w-full h-[50px] bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center">
                <MapPin size={20} className="text-red-500" />
              </div>
              <div className="bg-white px-3 py-2 text-center border-t border-slate-100">
                <p className="text-xs font-bold text-[#111] flex items-center justify-center gap-1"><MapPin size={10} className="text-red-500" /> {v.vendeur?.nom || "MKA Motors"} — {v.ville || "Lyon"}</p>
              </div>
            </div>
          </div>

          {/* BOUTON RÉSERVATION — PRO uniquement */}
          {!isParticulier && (
          <button className="mt-4 w-full rounded-xl bg-[#111] py-3.5 text-sm font-bold text-white shadow-lg" onClick={() => requireLogin(() => navigate("/reservation"))}>
            Réserver ce véhicule
          </button>
          )}

          {/* POINTS FORTS — lignes séparatrices OR lumineux */}
          <div className="mt-5 border-t-2 border-b-2 border-[#111] py-4" style={{boxShadow: '0 2px 8px rgba(212,175,55,0.2), 0 -2px 8px rgba(212,175,55,0.2)'}}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <History size={20} className="mx-auto text-red-500" />
                <p className="mt-1 text-xs text-slate-500">Historique</p>
                <p className="text-xs font-bold text-[#111]">Disponible</p>
              </div>
              <div>
                <ShieldCheck size={20} className="mx-auto text-red-500" />
                <p className="mt-1 text-xs text-slate-500">Vignette</p>
                <p className="text-xs font-bold text-[#111]">Crit'Air {v.critair || "1"}</p>
              </div>
              <div>
                <BarChart3 size={20} className="mx-auto text-red-500" />
                <p className="mt-1 text-xs text-slate-500">Consommation</p>
                <p className="text-xs font-bold text-[#111]">Faible</p>
              </div>
            </div>
          </div>

          {/* CARACTÉRISTIQUES — cliquable ouvre/ferme */}
          <div className="mt-5">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setProCaracOpen(!proCaracOpen)}>
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><BadgeCheck size={18} className="text-red-500" /> Caractéristiques</h2>
              <ChevronDown size={18} className={`text-red-500 transition-transform ${proCaracOpen ? 'rotate-180' : ''}`} />
            </div>
            <p className="mt-1 text-xs text-slate-400 uppercase">{v.titre} {v.version || ""}</p>
            {proCaracOpen && (
              <div className="mt-3 space-y-3">
                {[
                  ["📅", "Année", v.annee],
                  ["🛣️", "Kilométrage", v.kilometrage ? `${v.kilometrage.toLocaleString("fr-FR")} km` : null],
                  ["⚙️", "Boîte de vitesse", v.boite || "Automatique"],
                  ["⛽", "Énergie", v.carburant],
                  ["🚪", "Nombre de portes", v.portes || "5"],
                  ["🐴", "Puissance fiscale", v.puissanceCv ? `${v.puissanceCv} CV` : null],
                  ["💪", "Puissance DIN", v.puissanceCv ? `${v.puissanceCv} ch` : null],
                  ["📊", "Consommation", "5,3 L /100 km"],
                  ["🎨", "Couleur", v.couleur || "Noir"],
                  ["🛡️", "Garantie", v.garantie || "12 mois"],
                ].filter(([, , val]) => val != null).map(([icon, label, val]) => (
                  <div key={label as string} className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="flex items-center gap-2 text-sm text-[#111]"><span>{icon}</span> {label}</span>
                    <span className="text-sm font-bold text-[#111]">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-[#111]" onClick={() => setProCaracOpen(!proCaracOpen)}>{proCaracOpen ? 'Masquer' : 'Voir tout (20)'}</button>
          </div>

          {/* DESCRIPTION — entre caractéristiques et équipements, cliquable s'ouvre en grand */}
          <div className="mt-6 border-t-2 border-[#111]/40 pt-4 cursor-pointer" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}} onClick={() => setProDescOpen(true)}>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><FileText size={18} className="text-red-500" /> Description</h2>
            <p className="mt-2 text-sm text-slate-600 line-clamp-3">{v.description || "Véhicule en excellent état, entretenu régulièrement en concession. Non fumeur. Disponible immédiatement pour essai et vente."}</p>
            <p className="mt-2 text-xs font-semibold text-[#D4AF37]">Lire la suite →</p>
          </div>

          {/* ÉQUIPEMENTS & OPTIONS — cliquable ouvre/ferme */}
          <div className="mt-6 border-t-2 border-[#111]/40 pt-4" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}}>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setProEquipOpen(!proEquipOpen)}>
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><Wrench size={18} className="text-red-500" /> Équipements & options</h2>
              <ChevronDown size={18} className={`text-red-500 transition-transform ${proEquipOpen ? 'rotate-180' : ''}`} />
            </div>
            {proEquipOpen && (
              <ul className="mt-3 space-y-2">
                {(v.equipements || ["GPS / Navigation", "Sièges cuir chauffants", "Caméra de recul", "Aide au stationnement", "Apple CarPlay / Android Auto", "Climatisation automatique", "Jantes alliage 19\""]).map((eq: string) => (
                  <li key={eq} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-600">●</span> {eq}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* FINANCEMENT — PRO uniquement */}
          {!isParticulier && (
          <div className="mt-6 border-t-2 border-[#111]/40 pt-4" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}}>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><CreditCard size={18} className="text-red-500" /> Financement</h2>
            <div className="mt-3 rounded-xl border border-slate-200 p-5">
              <div className="flex gap-2 mb-3">
                <span onClick={() => setProFinanceTab('paiement')} className={`rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer transition ${proFinanceTab === 'paiement' ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' : 'text-slate-400 hover:text-[#111]'}`}>Paiement en plusieurs fois</span>
                <span onClick={() => setProFinanceTab('loa')} className={`rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer transition ${proFinanceTab === 'loa' ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' : 'text-slate-400 hover:text-[#111]'}`}>LOA</span>
              </div>
              {proFinanceTab === 'paiement' ? (
                <>
                  <p className="text-center text-xl font-extrabold text-[#111]">Dès {Math.round(Number(v.prix) / 60)} €<span className="text-sm font-normal text-slate-500">/mois</span></p>
                  <p className="text-center text-[10px] text-slate-400 mt-1">Sur 60 mois • Sans apport</p>
                </>
              ) : (
                <>
                  <p className="text-center text-xl font-extrabold text-[#111]">Dès {Math.round(Number(v.prix) / 48)} €<span className="text-sm font-normal text-slate-500">/mois</span></p>
                  <p className="text-center text-[10px] text-slate-400 mt-1">LOA sur 48 mois • Apport 10%</p>
                </>
              )}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">● Disponible</span>
              </div>
              <button className="mt-4 w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white" onClick={() => requireLogin(() => navigate("/finance"))}>Faire une offre au vendeur</button>
            </div>
          </div>
          )}

          {/* GARANTIES — cliquable → ouvre modal */}
          <div className="mt-6 flex items-center justify-between border-t-2 border-[#111]/40 pt-4 cursor-pointer" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}} onClick={() => setProGarantieOpen(true)}>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><ShieldCheck size={18} className="text-red-500" /> Garanties</h2>
            <ChevronRight size={20} className="text-red-500" />
          </div>

          {/* HISTORIQUE */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><History size={18} className="text-red-500" /> Historique</h2>
            </div>
            <div className="mt-3 space-y-3">
              {[
                { label: "Nombre de propriétaires", val: "2", icon: "👤" },
                { label: "Existence vérifiée", val: "✅", icon: "🚗" },
                { label: "Aucun sinistre détecté", val: "✅", icon: "✓" },
              ].map((h) => (
                <div key={h.label} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-sm text-[#111]">{h.label}</span>
                  <span className="text-sm font-bold text-green-600">{h.val}</span>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white" onClick={() => setProHistoriqueOpen(true)}>Voir l'historique complet</button>
          </div>

          {/* PRIX */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><TrendingUp size={18} className="text-red-500" /> Prix</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-extrabold text-[#111]">{formatPrice(Number(v.prix))}</span>
              <span className="rounded-full border border-slate-300 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">Offre équitable</span>
            </div>
            {estimateQuery.data && (
              <p className="mt-1 text-xs text-slate-500">Le prix est dans la moyenne des véhicules similaires.</p>
            )}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer" onClick={() => setShowPriceHistory(!showPriceHistory)}>
                <span className="text-sm text-[#111]">Historique</span>
                <ChevronRight size={16} className={`text-red-500 transition-transform ${showPriceHistory ? "rotate-90" : ""}`} />
              </div>
              {showPriceHistory && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs font-bold text-[#111]">Historique du prix</p>
                  <div className="space-y-2">
                    {[{date:"Aujourd'hui",prix:Number(v.prix),tag:"Prix actuel"},{date:"Il y a 7 jours",prix:Math.round(Number(v.prix)*1.02),tag:""},{date:"Il y a 30 jours",prix:Math.round(Number(v.prix)*1.05),tag:"Premiere mise en ligne"},{date:"Il y a 60 jours",prix:Math.round(Number(v.prix)*1.08),tag:""}].map((h,i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div><p className="text-xs text-[#111] font-semibold">{h.date}</p>{h.tag && <p className="text-[9px] text-slate-500">{h.tag}</p>}</div>
                        <div className="text-right"><p className="text-xs font-bold text-[#111]">{formatPrice(h.prix)}</p>{i>0 && <p className="text-[9px] text-green-600">-{Math.round((1-Number(v.prix)/h.prix)*100)}%</p>}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-2">
                    <TrendingUp size={14} className="text-green-600" />
                    <p className="text-[10px] text-green-700 font-semibold">Le prix a baisse depuis la mise en ligne</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 cursor-pointer" onClick={() => setShowCote(!showCote)}>
                <span className="text-sm text-[#111]">Cote du véhicule</span>
                <span className="text-xs font-semibold text-[#111] underline">Consulter</span>
              </div>
              {showCote && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs font-bold text-[#111]">Cote du vehicule</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500">Estimation basse</p>
                      <p className="text-sm font-bold text-[#111]">{formatPrice(Math.round(Number(v.prix)*0.88))}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-slate-500">Cote moyenne</p>
                      <p className="text-sm font-extrabold text-[#D4AF37]">{formatPrice(Math.round(Number(v.prix)*0.95))}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[10px] text-slate-500">Estimation haute</p>
                      <p className="text-sm font-bold text-[#111]">{formatPrice(Math.round(Number(v.prix)*1.05))}</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-white bg-[#111] shadow" style={{left:'55%'}} />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-[#FFFDF5] border border-[#D4AF37]/30 p-2">
                    <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[9px] font-bold">Offre equitable</span>
                    <p className="text-[10px] text-[#374151]">Le prix est dans la moyenne du marche</p>
                  </div>
                </div>
              )}
            </div>
            <button className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-[#111]" onClick={() => requireLogin(() => setShowAlertPanel(true))}>Créer une alerte prix</button>
            {showAlertPanel && (
              <div className="mt-3 rounded-xl border border-[#D4AF37]/30 bg-[#FFFDF5] p-4">
                <p className="text-sm font-bold text-[#111]">Alerte prix enregistree !</p>
                <p className="mt-1 text-xs text-slate-500">Vous serez notifie si le prix de "{v.titre}" change.</p>
                <div className="mt-2 flex items-center gap-2"><Bell size={14} className="text-[#D4AF37]" /><span className="text-[10px] text-[#374151]">Notifications par email et push</span></div>
                <button className="mt-3 w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-white" onClick={() => setShowAlertPanel(false)}>OK</button>
              </div>
            )}
          </div>

          {/* SERVICES DISPONIBLES — carousel horizontal */}
          <div className="mt-6 rounded-2xl border-2 border-[#111]/40 bg-white p-4" style={{boxShadow: '0 0 12px rgba(212,175,55,0.15), 0 2px 8px rgba(0,0,0,0.06)'}}>
            <h2 className="text-center text-sm font-extrabold text-[#111] mb-3">Services disponibles</h2>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { icon: <Wrench size={18} />, label: "Devis garage", to: "/garages" },
                { icon: <Truck size={18} />, label: "Livraison", to: "/services" },
                { icon: <FileCheck size={18} />, label: "Carte grise", to: "/carte-grise" },
                { icon: <Search size={18} />, label: "Contrôle", to: "/services" },
                { icon: <ShieldCheck size={18} />, label: "Garantie", to: "/services" },
                { icon: <TrendingUp size={18} />, label: "Reprise", to: "/services" },
                { icon: <CreditCard size={18} />, label: "Financement", to: "/finance" },
                { icon: <Award size={18} />, label: "Expertise", to: "/services" },
                { icon: <Shield size={18} />, label: "Assurance", to: "/services" },
                { icon: <Battery size={18} />, label: "Recharge", to: "/services" },
              ].map((s) => (
                <Link key={s.label} to={s.to} className="flex shrink-0 flex-col items-center transition hover:scale-105" style={{width:"62px"}}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#FFFDF5] text-[#D4AF37]">{s.icon}</div>
                  <p className="mt-1 text-[9px] font-semibold text-[#111] leading-tight text-center">{s.label}</p>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-semibold text-[#D4AF37] cursor-pointer" onClick={() => navigate("/services")}>Voir tous nos services →</p>
          </div>

          {/* PUBLICITÉ — entre Services et Vendeur */}
          <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#111] to-[#222] p-4">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-[#D4AF37] mb-2">Publicité</p>
            <div className="relative h-20 overflow-hidden">
              {proAds1.map((ad, i) => (
                <Link key={i} to="/demande-publicite" className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-700 ${i === proAdIdx1 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                  <p className="text-sm font-bold text-white">{ad.title}</p>
                  <p className="text-[10px] text-slate-400">{ad.desc}</p>
                  <p className="mt-1 text-[9px] font-semibold text-[#D4AF37]">En savoir plus →</p>
                </Link>
              ))}
            </div>
          </div>

          {/* VENDEUR PRO COMPLET — plaque avec carte maps */}
          <div className="mt-6 border-t-2 border-[#111]/40 pt-4" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}}>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]"><Store size={18} className="text-red-500" /> {isParticulier ? "Particulier" : "Professionnel de l'automobile"}</h2>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700"><ShieldCheck size={10} /> {isParticulier ? "Particulier vérifié" : "Pro vérifié"}</span>

            {/* Plaque vendeur — même contour premium que carte prix */}
            <div className="mt-3 rounded-2xl border-2 border-[#111] p-4" style={{boxShadow: '0 0 18px rgba(212,175,55,0.35), 0 4px 20px rgba(0,0,0,0.12)'}}>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-[#111]">
                  {(v.vendeur?.nom || v.marque || "P").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#111]">{v.vendeur?.nom || "MKA Motors"}</p>
                  <p className="text-xs text-slate-500">{isParticulier ? "Vendeur particulier" : "Concessionnaire"}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                    <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                    <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                    <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                    <Star size={10} className="text-slate-300" />
                    <span className="text-[10px] text-slate-500 ml-1">125 avis</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-red-500 cursor-pointer" onClick={() => navigate("/pro")} />
              </div>

              <p className="mt-2 text-[10px] text-slate-500">N° SIRET : 889 512 109 00014</p>
              <p className="mt-1 text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10} className="text-red-500" /> Dernière activité il y a 1 heure</p>

              {/* Mini carte maps */}
              <div className="mt-3 h-28 w-full rounded-xl bg-slate-200 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=150&fit=crop" alt="Carte" className="h-full w-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-red-500 p-1.5"><MapPin size={14} className="text-white" /></div>
                </div>
              </div>

              <button className="mt-3 w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white" onClick={() => requireLogin(() => messageAction())}>Demander un essai</button>
            </div>

            <div className="mt-3 flex items-center justify-between border-b border-[#111]/20 py-2 cursor-pointer" onClick={() => navigate(`/vendeur/${v.vendeur?.id || v.userId || 1}`)}>
              <span className="text-sm text-[#111]">Horaires et à propos</span>
              <span className="text-xs text-red-500 font-semibold">Fermé</span>
              <ChevronRight size={16} className="text-red-500" />
            </div>
            {/* Annonces du pro — carrousel */}
            <div className="mt-4">
              <h3 className="text-sm font-bold text-[#111] mb-2">{isParticulier ? "Autres annonces du vendeur :" : "Les annonces de ce pro :"}</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[8001, 8002, 8003, 8004, 8005].filter((id) => id !== v.id).slice(0, 4).map((id) => {
                  const sim = DEMO_VEHICLES[id];
                  if (!sim) return null;
                  return (
                    <Link key={id} to={`/vehicule/${id}`} className="w-36 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                      <img src={sim.photoPrincipale} alt={sim.titre} className="h-24 w-full object-cover" />
                      <div className="p-2">
                        <p className="text-[10px] font-bold text-[#111] truncate">{sim.titre}</p>
                        <p className="text-xs font-extrabold text-[#111]">{formatPrice(Number(sim.prix))}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            <button className="mt-3 w-full rounded-xl border border-[#111] py-3 text-sm font-bold text-[#111]" onClick={() => navigate("/pro")}>{isParticulier ? "Voir les annonces du vendeur" : "Voir toutes les annonces du pro"}</button>
          </div>

          {/* PUBLICITÉ FIN DE PAGE — auto-défilante (plus grande) */}
          <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37] mb-3">Publicités partenaires</p>
            <div className="relative h-28 overflow-hidden">
              {proAds2.map((ad, i) => (
                <Link key={i} to="/demande-publicite" className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-700 ${i === proAdIdx2 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                  <p className="text-lg font-bold text-white">{ad.title}</p>
                  <p className="text-xs text-slate-400">{ad.desc}</p>
                  <p className="mt-2 text-[10px] font-semibold text-[#D4AF37]">En savoir plus →</p>
                </Link>
              ))}
            </div>
          </div>

          {/* VÉHICULE VOUS INTÉRESSE ? */}
          <div className="mt-6 rounded-xl border-2 border-[#111]/60 bg-red-50/20 p-4" style={{boxShadow: '0 0 12px rgba(212,175,55,0.2), 0 2px 8px rgba(0,0,0,0.08)'}}>
            <p className="text-sm font-bold text-[#111]">Ce {v.titre} vous intéresse ?</p>
            <p className="mt-1 text-xs text-slate-500">Enregistrez la recherche et soyez alerté des nouvelles annonces similaires.</p>
            <button className="mt-3 w-full rounded-xl border-2 border-[#111]/30 bg-white py-2.5 text-xs font-bold text-[#111] flex items-center justify-center gap-2" onClick={() => setShowAlertPanel(!showAlertPanel)}><Bell size={14} className="text-red-500" /> Enregistrer ma recherche</button>
            {showAlertPanel && (
              <div className="mt-3 rounded-xl border border-[#D4AF37]/30 bg-[#FFFDF5] p-4">
                <p className="text-sm font-bold text-[#111]">Alerte enregistrée !</p>
                <p className="mt-1 text-xs text-slate-500">Vous serez notifié dès qu'une annonce similaire à "{v.titre}" est publiée.</p>
                <button className="mt-3 w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-white" onClick={() => setShowAlertPanel(false)}>OK</button>
              </div>
            )}
          </div>

          {/* ALLER PLUS LOIN */}
          <div className="mt-6 border-t-2 border-[#111]/40 pt-4" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}}>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#111]">Aller plus loin</h2>
            <div className="mt-3 space-y-3">
              {[
                { icon: <FileText size={18} className="text-red-500" />, title: "Cote du véhicule", desc: "Consultez la cote de ce véhicule", action: () => { setShowCote(true); window.scrollTo({top:0,behavior:'smooth'}); } },
                { icon: <History size={18} className="text-red-500" />, title: "Historique complet", desc: "Consultez l'historique complet", action: () => { setShowPriceHistory(true); window.scrollTo({top:0,behavior:'smooth'}); } },
                { icon: <FileCheck size={18} className="text-red-500" />, title: "Fiche Technique", desc: "Toutes les informations du véhicule", action: () => navigate(`/catalogue-technique`) },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 border-b border-[#111]/15 pb-3 cursor-pointer" onClick={item.action}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">{item.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-[#111] underline">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CES ANNONCES PEUVENT VOUS INTÉRESSER */}
          <div className="mt-6 border-t-2 border-[#111]/40 pt-4" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#111]">Ces annonces peuvent vous intéresser :</h2>
              <ChevronRight size={20} className="text-red-500" />
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {[8001, 8002, 8003, 8004].filter((id) => id !== v.id).map((id) => {
                const sim = DEMO_VEHICLES[id];
                if (!sim) return null;
                return (
                  <Link key={id} to={`/vehicule/${id}`} className="w-48 shrink-0 overflow-hidden rounded-xl border border-slate-200 hover:border-[#D4AF37] transition">
                    <div className="relative">
                      <img src={sim.photoPrincipale} alt={sim.titre} className="h-44 w-full object-cover" />
                      <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Heart size={16} /></button>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-[#111] truncate">{sim.titre}</p>
                      <p className="text-sm font-extrabold text-[#111] mt-1">{formatPrice(Number(sim.prix))}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{sim.ville || "Paris"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 border-t-2 border-[#111]/40 pt-4 text-center space-y-2" style={{boxShadow: '0 -2px 8px rgba(212,175,55,0.15)'}}>
            <p className="text-xs font-semibold text-[#111] underline cursor-pointer">Signaler cette annonce</p>
            <p className="text-xs font-semibold text-[#111] underline cursor-pointer">Vos droits et obligations</p>
            <p className="text-[10px] text-slate-400">Réf. pro : {v.vendeur?.id || "97103"} | Réf. annonce : {v.reference || v.id}</p>
          </div>
        </div>

        {/* ===== BARRE FIXE EN BAS : Acheter + Message — FLOTTANTS (disparaissent au scroll) */}
        <div className={`fixed left-0 right-0 border-t border-slate-200 bg-white px-4 py-2 flex gap-3 md:bottom-0 transition-all duration-300 ${scrollHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`} style={{zIndex: 35, bottom: 'calc(52px + env(safe-area-inset-bottom, 0px))'}}>
          <button className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2d3436] text-sm font-bold text-white" onClick={() => { if (v.contactTelephone) window.location.href = `tel:${v.contactTelephone}`; }}>
            <Phone size={16} /> Appeler
          </button>
          <button className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#111] text-sm font-bold text-white" onClick={messageAction}>
            <Mail size={16} /> Message
          </button>
        </div>

        {/* WhatsApp est maintenant collé sur la photo principale (voir ci-dessus) */}

        {/* === MODAL HISTORIQUE === */}
        {proHistoriqueOpen && (
          <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 py-4 pt-14 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-[#111]">Historique</h2>
              <button onClick={() => setProHistoriqueOpen(false)} className="text-xl text-slate-500">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Nombre de propriétaires", val: "2" },
                { label: "Existence vérifiée au fichier national", val: "Oui" },
                { label: "Sinistres déclarés", val: "Aucun" },
                { label: "Kilométrage certifié", val: v.kilometrage ? `${v.kilometrage.toLocaleString("fr-FR")} km` : "Non renseigné" },
                { label: "Contrôle technique", val: "Valide" },
                { label: "Vol signalé", val: "Non" },
                { label: "Gage / Opposition", val: "Aucun" },
                { label: "Entretiens réalisés", val: "À jour" },
                { label: "Importation", val: "Non" },
                { label: "Date de 1ère mise en circulation", val: v.annee ? `${v.annee}` : "Non renseigné" },
              ].map((h) => (
                <div key={h.label} className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm text-[#111]">{h.label}</span>
                  <span className="text-sm font-bold text-green-600">{h.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === MODAL GARANTIE === */}
        {proGarantieOpen && (
          <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 py-4 pt-14 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-[#111]">Garanties</h2>
              <button onClick={() => setProGarantieOpen(false)} className="text-xl text-slate-500">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { type: "Moteur", duree: "48 mois", statut: "Active" },
                { type: "Boîte de vitesse", duree: "24 mois", statut: "Active" },
                { type: "Garantie conducteur", duree: "12 mois", statut: "Active" },
                { type: "Suspension", duree: "12 mois", statut: "Active" },
                { type: "Électronique", duree: "24 mois", statut: "Active" },
              ].map((g) => (
                <div key={g.type} className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{g.type}</p>
                    <p className="text-xs text-slate-500">{g.duree}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">{g.statut}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-4">Les garanties sont définies par le vendeur professionnel lors du dépôt de l'annonce.</p>
            </div>
          </div>
        )}

        {/* === MODAL DESCRIPTION === */}
        {proDescOpen && (
          <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 py-4 pt-14 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-[#111]">Description</h2>
              <button onClick={() => setProDescOpen(false)} className="text-xl text-slate-500">✕</button>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#111] leading-relaxed whitespace-pre-wrap">{v.description || `Véhicule en excellent état, entretenu régulièrement en concession.\n\n- CT valide\n- Aucun défaut électronique\n- Vidange faite\n\n${v.titre}\nMoteur ${v.puissanceCv || "136"}ch, Boîte ${v.boite || "Automatique"}\n${v.kilometrage ? v.kilometrage.toLocaleString("fr-FR") + " km" : ""}\n\nINFORMATIONS :\n\nDisponible immédiatement pour essai.\nGarantie constructeur ou vendeur incluse.\nFinancement possible sur place.`}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container-page py-6 pb-32 md:pb-10">
      {/* Fil d'ariane */}
      <div className="mb-4 flex items-center gap-1 text-xs text-slate-400">
        <Link to="/acheter" className="hover:text-noir">Annonces</Link>
        <ChevronRight size={13} />
        <span className="text-slate-500">{v.marque} {v.modele}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* ===== 1. PHOTOS ===== */}
        <section className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className={`card overflow-hidden ${isOfficiel ? "border-[#D4AF37]/40 shadow-lg" : ""}`}>
          <div
              className={`relative w-full ${photoHeightClass} bg-slate-100 cursor-pointer`}
              onClick={() => { setLightboxIdx(activeCatIdx); setLightboxOpen(true); }}
            >
              {/* Photos filtrées par catégorie sélectionnée */}
              {activeCatPhotos.length ? (
                <img src={activeCatPhotos[activeCatIdx] || ""} alt={v.titre} className="h-full w-full object-cover" />
              ) : photos.length ? (
                <img src={photos[photoIdx] || ""} alt={v.titre} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-slate-400">Pas de photo</div>
              )}

              {/* Flèches gauche/droite */}
              {(activeCatPhotos.length > 1 || (!userAnnonceHasCategories && !hasPhotoCategories && photos.length > 1)) && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhotoIdx((i) => Math.max(0, i - 1)); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const max = (hasPhotoCategories || userAnnonceHasCategories) ? activeCatPhotos.length - 1 : photos.length - 1;
                      setPhotoIdx((i) => Math.min(max, i + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              {/* Compteur photos */}
              {((hasPhotoCategories || userAnnonceHasCategories) ? activeCatPhotos.length : photos.length) > 1 && (
                <span className="badge absolute bottom-3 right-3 bg-noir/70 text-white">
                  {((hasPhotoCategories || userAnnonceHasCategories) ? activeCatIdx : photoIdx) + 1} / {(hasPhotoCategories || userAnnonceHasCategories) ? activeCatPhotos.length : photos.length}
                </span>
              )}

              {/* Badges automatiques — coin supérieur gauche, max 3, sans PRO pour MKA.P-MS */}
              {(() => {
                const vehicleBadges = computeBadges({
                  id: v.id, vendeurType: v.vendeurType, type: v.type,
                  status: v.status, boosted: v.boosted, certified: v.certified,
                  tier: v.tier, planCode: v.planCode, createdAt: v.createdAt,
                }).filter((b) => !(isMkapmsStock && (b.code === "vendeur_pro" || b.code === "garage_verifie")));
                return vehicleBadges.length > 0 ? (
                  <div className="absolute left-3 top-3 flex flex-col gap-1">
                    {vehicleBadges.map((b) => <BadgeChip key={b.code} badge={b} />)}
                  </div>
                ) : null;
              })()}
            </div>
            {/* Galerie miniatures */}
            {(() => {
              const thumbPhotos = (hasPhotoCategories || userAnnonceHasCategories) ? activeCatPhotos : photos;
              const thumbIdx = (hasPhotoCategories || userAnnonceHasCategories) ? activeCatIdx : photoIdx;
              return thumbPhotos.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {thumbPhotos.slice(0, typeof window !== "undefined" && window.innerWidth >= 1024 ? 12 : 6).map((p: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg ring-offset-1 ${
                        i === thumbIdx ? "ring-2 ring-gold" : "ring-1 ring-slate-200"
                      }`}
                    >
                      <img src={p} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        </section>

        {/* ===== 2. PRIX + 3. BOUTONS (bloc d'action — à droite sur desktop, sous les photos sur mobile) ===== */}
        <aside className="space-y-5 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
              {isMkapmsStock ? "MKA.P-MS Officiel" : v.vendeurType === "professionnel" ? "Professionnel" : "Particulier"}
            </p>
            <h1 className="mt-1 text-xl font-extrabold text-noir">{v.titre}</h1>
            <p className="text-sm text-slate-500">{v.version || `${v.marque} ${v.modele}`}</p>
            {v.reference && (
              <p className="mt-1 text-xs font-medium text-slate-400">Réf. annonce : {v.reference}</p>
            )}

            {/* PRIX */}
            <div className="mt-3 text-3xl font-extrabold text-noir">
              {isLocation && v.prixJour
                ? `${formatPrice(Number(v.prixJour))} /jour`
                : formatPrice(Number(v.prix))}
            </div>
            {isLocation && (
              <div className="mt-1 text-sm text-slate-500">
                {v.prixSemaine && `${formatPrice(Number(v.prixSemaine))}/sem · `}
                {v.prixMois && `${formatPrice(Number(v.prixMois))}/mois`}
              </div>
            )}

            {/* Positionnement prix vs estimation marché (Partie 5) */}
            {!isLocation && estimateQuery.data && Number(v.prix) > 0 && (() => {
              const est = estimateQuery.data;
              const prixNum = Number(v.prix);
              const label =
                prixNum <= est.mid * 0.97
                  ? { t: "Bon prix", c: "bg-success/10 text-success-dark" }
                  : prixNum <= est.high
                    ? { t: "Prix du marché", c: "bg-gold-soft text-gold-dark" }
                    : { t: "Au-dessus du marché", c: "bg-warning/10 text-amber-700" };
              return (
                <div className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${label.c}`}>
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp size={14} /> {label.t}
                  </span>
                  <span className="ml-1 font-normal opacity-80">
                    · estimation {formatPrice(est.low)} – {formatPrice(est.high)}
                    {est.method === "comparables" ? ` (${est.sampleSize} similaires)` : ""}
                  </span>
                </div>
              );
            })()}

            {/* BOUTONS d'action — adaptés au tier et au type */}
            <div className="mt-5 space-y-2">
              {isMkapmsStock && !isLocation ? (
                /* ── MKA.P-MS Officiel (vente) : WhatsApp + Message en haut ── */
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-whatsapp flex h-[56px] items-center justify-center gap-2 lg:h-[64px]"><MessageSquare size={16} /> WhatsApp</a>
                    <button className="btn-message h-[56px] lg:h-[64px]" onClick={messageAction}><MessageSquare size={16} /> Message</button>
                  </div>
                  <button className="btn-acheter w-full h-[56px] lg:h-[64px]" onClick={primaryAction}>Acheter ce véhicule</button>
                </>
              ) : isLocation ? (
                /* ── LOCATION : tout passe par MKA.P-MS, pas de tel/WhatsApp direct ── */
                isVtcTaxi ? (
                  /* VTC / Taxi — boutons spécifiques activité professionnelle */
                  <>
                    <button className="btn-acheter w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/messages"))}><Send size={16} /> Demander ce véhicule</button>
                    <button className="btn-message w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/documents"))}><FileText size={16} /> Envoyer documents VTC/TAXI</button>
                    <button className="btn-gold w-full h-[54px] lg:h-[60px]" onClick={() => navigate("/finance")}><TrendingUp size={16} /> Simuler mensualité</button>
                    <button className="btn-outline w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/dossiers"))}><EyeIcon size={16} /> Suivre mon dossier</button>
                    <button className="btn-gold w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/contrats"))}><FolderCheck size={16} /> Signer contrat</button>
                    <button className="btn-reserver w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/paiements"))}><CreditCard size={16} /> Payer l'acompte</button>
                  </>
                ) : (
                  /* Location classique — parcours client standard */
                  <>
                    <button className="btn-outline w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/messages"))}><EyeIcon size={16} /> Vérifier disponibilité</button>
                    <button className="btn-acheter w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/messages"))}><Send size={16} /> Faire une demande</button>
                    <button className="btn-message w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/documents"))}><FileText size={16} /> Envoyer mes documents</button>
                    <button className="btn-gold w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/contrats"))}><FolderCheck size={16} /> Signer le contrat</button>
                    <button className="btn-reserver w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/paiements"))}><CreditCard size={16} /> Payer / Réserver</button>
                    <button className="btn-outline w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/locations"))}><EyeIcon size={16} /> Suivre ma location</button>
                  </>
                )
              ) : tier === "professionnel" ? (
                /* ── VENTE PRO : Appeler + Message + WhatsApp + Voir société ── */
                <>
                  {v.contactTelephone ? (
                    <a href={`tel:${v.contactTelephone}`} className="btn-acheter w-full h-[56px] lg:h-[64px] flex items-center justify-center gap-2"><Phone size={16} /> Appeler</a>
                  ) : (
                    <button className="btn-acheter w-full h-[56px] lg:h-[64px]" onClick={messageAction}><Phone size={16} /> Appeler</button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn-message h-[56px] lg:h-[64px]" onClick={messageAction}><MessageSquare size={16} /> Message</button>
                    {v.contactTelephone ? (
                      <a href={`tel:${v.contactTelephone}`} className="btn-appeler h-[56px] lg:h-[64px]"><Phone size={16} /> Appeler</a>
                    ) : (
                      <button className="btn-outline h-[56px] lg:h-[64px]" onClick={messageAction}><Phone size={16} /> Appeler</button>
                    )}
                  </div>
                  {v.contactTelephone && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-whatsapp w-full h-[56px] lg:h-[64px]">WhatsApp</a>
                  )}
                  <button className="btn-outline w-full h-[56px] lg:h-[64px]" onClick={() => navigate("/pro")}><Building2 size={16} /> Voir société</button>
                </>
              ) : (
                /* ── VENTE PARTICULIER : Appeler + Message + WhatsApp ── */
                <>
                  {v.contactTelephone ? (
                    <a href={`tel:${v.contactTelephone}`} className="btn-acheter w-full h-[54px] lg:h-[60px] flex items-center justify-center gap-2"><Phone size={16} /> Appeler</a>
                  ) : (
                    <button className="btn-acheter w-full h-[54px] lg:h-[60px]" onClick={messageAction}><Phone size={16} /> Appeler</button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn-message h-[54px] lg:h-[60px]" onClick={messageAction}><MessageSquare size={16} /> Message</button>
                    {v.contactTelephone ? (
                      <a href={`tel:${v.contactTelephone}`} className="btn-appeler h-[54px] lg:h-[60px]"><Phone size={16} /> Appeler</a>
                    ) : (
                      <button className="btn-outline h-[54px] lg:h-[60px]" onClick={messageAction}><Phone size={16} /> Appeler</button>
                    )}
                  </div>
                  {v.contactTelephone && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-whatsapp w-full h-[54px] lg:h-[60px]">WhatsApp</a>
                  )}
                </>
              )}
              <div className="flex items-center justify-between pt-1">
                <button
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-noir"
                  onClick={() => { setIsFav(!isFav); requireLogin(() => toggleFav.mutate({ annonceId: v.id })); }}
                >
                  <Heart size={16} className={isFav ? "text-red-500 fill-red-500" : ""} /> {isFav ? "Favori" : "Ajouter aux favoris"}
                </button>
                <button
                  onClick={() => requireLogin(() => setShowReport(true))}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500"
                >
                  <Flag size={13} /> Signaler
                </button>
              </div>
            </div>
          </div>

          {/* Réserver avec acompte (vente) — pour NON-MKA.P-MS, position ici ; pour MKA.P-MS, après Finance+ */}
          {!isLocation && !isMkapmsStock && (
            <div id="reserver" className="card p-5">
              <h3 className="font-bold text-noir">Réserver avec acompte</h3>
              <p className="mt-1 text-sm text-slate-500">
                Bloquez ce véhicule 24 h, le temps de finaliser.
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {ACOMPTE_PALIERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAcompte(p)}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      acompte === p
                        ? "border-gold bg-gold-soft text-gold-dark"
                        : "border-slate-300 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {p} €
                  </button>
                ))}
              </div>
              <button
                className="btn-reserver mt-4 w-full"
                disabled={reserve.isPending}
                onClick={() => requireLogin(() => reserve.mutate({ annonceId: v.id, acompte }))}
              >
                {reserve.isPending ? "Redirection…" : "Réserver maintenant"}
              </button>
            </div>
          )}

          {/* Indice de Confiance MKA.P-MS (Partie 5 §4) */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-noir">Indice de Confiance</h3>
              <span className={`text-2xl font-extrabold ${trustColor}`}>{trust.score}<span className="text-sm text-slate-400">/100</span></span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${trust.niveau === "excellent" ? "bg-success" : trust.niveau === "bon" ? "bg-gold" : trust.niveau === "moyen" ? "bg-warning" : "bg-slate-400"}`}
                style={{ width: `${trust.score}%` }}
              />
            </div>
            <p className={`mt-2 text-xs font-semibold ${trustColor}`}>{TRUST_LEVEL_LABEL[trust.niveau]}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {trust.badges.map((b) => (
                <span key={b.code} className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-slate-600">
                  <BadgeCheck size={13} className="text-gold-dark" /> {b.label}
                </span>
              ))}
            </div>
            <Link to="/confiance" className="mt-3 inline-block text-xs font-semibold text-gold-dark">
              Comment ça marche ? →
            </Link>
          </div>

          {/* Finance+ MKA.P-MS — uniquement pour véhicules MKA.P-MS Officiel */}
          {!isLocation && isOfficiel && (
            <div className="card border-[#D4AF37]/20 p-5">
              <h3 className="flex items-center gap-2 font-bold text-noir">
                <Star size={16} className="text-[#D4AF37]" fill="#D4AF37" /> Finance+ MKA.P-MS
              </h3>
              <p className="mt-1 text-[10px] text-slate-500">Financement exclusif MKA.P-MS pour ce véhicule.</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><ShieldCheck size={12} className="text-[#D4AF37]" /> Disponible en LOA</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><ShieldCheck size={12} className="text-[#D4AF37]" /> Disponible en paiement fractionné</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><ShieldCheck size={12} className="text-[#D4AF37]" /> Simulation immédiate</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><ShieldCheck size={12} className="text-[#D4AF37]" /> Réponse rapide</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/finance" className="flex items-center justify-center gap-1 rounded-lg bg-[#D4AF37] py-2 text-[10px] font-bold text-white hover:bg-[#C5A028]">Simuler</Link>
                <Link to="/finance" className="flex items-center justify-center gap-1 rounded-lg border border-[#D4AF37] py-2 text-[10px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">Conditions</Link>
              </div>
            </div>
          )}

          {/* Finance — Demande d'accès pour vendeurs Pro (pas encore activé) */}
          {!isLocation && !isOfficiel && (tier === "professionnel" || tier === "premium") && (
            <div className="card border-slate-200 p-5">
              <h3 className="flex items-center gap-2 font-bold text-noir">
                <CreditCard size={16} className="text-slate-400" /> Financement
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Le financement pour ce véhicule n'est pas encore disponible. Les vendeurs Pro peuvent demander l'accès au programme Finance+ MKA.P-MS.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-slate-400" /> Étude des conditions générales MKA.P-MS</div>
                <div className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-slate-400" /> Validation des documents du vendeur</div>
                <div className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-slate-400" /> Mise à disposition du véhicule pour financement</div>
              </div>
              <button
                className="mt-3 w-full rounded-lg border border-[#D4AF37] py-2 text-[10px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition"
                onClick={() => requireLogin(() => navigate("/compte/messages"))}
              >
                Demander l'accès Finance+
              </button>
            </div>
          )}

          {/* Réserver avec acompte — MKA.P-MS Officiel : positionné SOUS Finance+ */}
          {!isLocation && isMkapmsStock && (
            <div id="reserver" className="card border-[#D4AF37]/20 p-5">
              <h3 className="font-bold text-noir">Réserver ce véhicule</h3>
              <p className="mt-1 text-sm text-slate-500">
                Bloquez ce véhicule 24 h, le temps de finaliser votre achat.
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {ACOMPTE_PALIERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAcompte(p)}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      acompte === p
                        ? "border-gold bg-gold-soft text-gold-dark"
                        : "border-slate-300 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {p} €
                  </button>
                ))}
              </div>
              <button
                className="btn-reserver mt-4 w-full"
                disabled={reserve.isPending}
                onClick={() => requireLogin(() => reserve.mutate({ annonceId: v.id, acompte }))}
              >
                {reserve.isPending ? "Redirection…" : "Réserver maintenant"}
              </button>
            </div>
          )}
        </aside>

        {/* ===== 4 → 8 : Infos, Description, Historique, Vendeur, Avis ===== */}
        <section className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-2">
          {/* 4. INFOS VÉHICULE */}
          <div className="card p-5">
            <h2 className="mb-4 font-bold text-noir">Caractéristiques</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
              {details
                .filter(([, val]) => val != null && val !== "")
                .map(([k, val]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-400">{k}</dt>
                    <dd className="text-sm font-medium text-ink">{String(val)}</dd>
                  </div>
                ))}
            </dl>
            {(v.ville || v.codePostal) && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <dt className="text-xs text-slate-400">Localisation</dt>
                <dd className="text-sm font-medium text-ink">
                  {[v.ville, v.codePostal].filter(Boolean).join(" ")}
                </dd>
              </div>
            )}
          </div>

          {/* 5. DESCRIPTION — avec onglets pour MKA.P-MS Officiel */}
          <div className="card p-5">
            {isMkapmsStock ? (
              <>
                <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-100 pb-2 scrollbar-hide">
                  {([
                    { key: "description" as const, label: "Description" },
                    { key: "points_forts" as const, label: "Points forts" },
                    { key: "equipements" as const, label: "Équipements" },
                    { key: "imperfections" as const, label: "Imperfections" },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setDescTab(tab.key)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        descTab === tab.key
                          ? "bg-[#111] text-white"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {descTab === "description" && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {v.description || "Aucune description fournie."}
                  </p>
                )}
                {descTab === "points_forts" && v.pointsForts && (
                  <ul className="space-y-2">
                    {v.pointsForts.map((pf: string) => (
                      <li key={pf} className="flex items-center gap-2 text-sm text-slate-700">
                        <ShieldCheck size={14} className="text-[#D4AF37]" /> {pf}
                      </li>
                    ))}
                  </ul>
                )}
                {descTab === "equipements" && v.equipements && (
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    {v.equipements.map((eq: string) => (
                      <div key={eq} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                        <ShieldCheck size={12} className="text-emerald-600" /> {eq}
                      </div>
                    ))}
                  </div>
                )}
                {descTab === "imperfections" && v.imperfections && (
                  <ul className="space-y-2">
                    {v.imperfections.map((imp: string) => (
                      <li key={imp} className="flex items-center gap-2 text-sm text-slate-600">
                        <Flag size={14} className="text-orange-500" /> {imp}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h2 className="mb-3 font-bold text-noir">Description</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {v.description || "Aucune description fournie par le vendeur."}
                </p>
              </>
            )}
          </div>

          {/* 6. HISTORIQUE */}
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-noir">
              <History size={18} className="text-gold-dark" /> Historique du véhicule
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
              {v.annee != null && (
                <div>
                  <dt className="text-xs text-slate-400">1re mise en circulation</dt>
                  <dd className="text-sm font-medium text-ink">{v.annee}</dd>
                </div>
              )}
              {v.kilometrage != null && (
                <div>
                  <dt className="text-xs text-slate-400">Kilométrage</dt>
                  <dd className="text-sm font-medium text-ink">{v.kilometrage.toLocaleString("fr-FR")} km</dd>
                </div>
              )}
              {v.etat && (
                <div>
                  <dt className="text-xs text-slate-400">État</dt>
                  <dd className="text-sm font-medium text-ink">{String(v.etat)}</dd>
                </div>
              )}
            </dl>
            <Link
              to="/historique"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-dark"
            >
              Vérifier l'historique complet (CarVertical / QR) <ChevronRight size={15} />
            </Link>
          </div>

          {/* 7. VENDEUR */}
          <div className="card p-5">
            <h3 className="font-bold text-noir">Vendeur</h3>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {v.vendeurType === "professionnel" ? "Vendeur Professionnel" : v.contactNom || "Particulier"}
                </p>
                {v.vendeur && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm">
                    <Star size={15} className="fill-gold text-gold" />
                    <span className="font-medium text-slate-700">{Number(v.vendeur.rating || 0).toFixed(1)}</span>
                    <span className="text-slate-400">({v.vendeur.reviewCount || 0} avis)</span>
                  </div>
                )}
              </div>
              <button className="btn-message" onClick={messageAction}>
                <MessageSquare size={16} /> Contacter
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-gold-dark" /> Paiement sécurisé Stripe
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-gold-dark" /> Réponse rapide
              </li>
            </ul>
          </div>

          {/* 8. AVIS */}
          {v.vendeur && (
            <AvisSection targetUserId={v.vendeur.id} canReview={!!user && user.id !== v.vendeur.id} />
          )}

          {/* ═══════════════════════════════════════════════════════════
              10–15. BLOCS ACCOMPAGNEMENT VENTE (VENTE uniquement)
             ═══════════════════════════════════════════════════════════ */}
          {!isLocation && (<>

          {/* 10. BLOC CONFIANCE — différencié par tier */}
          {isOfficiel ? (
            /* ── MKA.P-MS OFFICIEL ── */
            <div className="overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-[#111]">
              <div className="p-6">
                <span className="inline-flex items-center rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-bold text-[#111]">MKA.P-MS OFFICIEL</span>
                <h2 className="mt-3 text-xl font-extrabold text-white">Véhicule certifié MKA.P-MS</h2>
                <p className="mt-1 text-sm text-slate-400">Chaque véhicule est contrôlé avant sa mise en vente.</p>
                <ul className="mt-4 space-y-2">
                  {["Contrôle mécanique", "Historique vérifié", "Essai routier", "Kilométrage contrôlé", "Dossier complet", "Rapport disponible"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-white"><ShieldCheck size={14} className="text-[#D4AF37]" /> {t}</li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-[#D4AF37]/20 bg-[#1a1a1a] p-5">
                <h3 className="text-sm font-bold text-[#D4AF37]">Garantie disponible</h3>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {["Historique complet", "Assistance administrative", "Livraison possible", "Reprise possible"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><ShieldCheck size={12} className="text-[#D4AF37]" /> {t}</li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-[#D4AF37]/20 bg-[#111] p-5">
                <div className="grid grid-cols-2 gap-3 text-center">
                  {[
                    { icon: "🛡️", text: "Achat sécurisé" },
                    { icon: "📋", text: "Documents vérifiés" },
                    { icon: "🚗", text: "Véhicule contrôlé" },
                    { icon: "⭐", text: "Support MKA.P-MS" },
                  ].map((c) => (
                    <div key={c.text} className="rounded-xl bg-[#1a1a1a] border border-[#D4AF37]/10 p-3">
                      <span className="text-lg">{c.icon}</span>
                      <p className="mt-1 text-[10px] font-semibold text-white">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : tier === "professionnel" || tier === "premium" ? (
            /* ── VENDEUR PRO ── */
            <div className="card overflow-hidden">
              <div className="bg-blue-900 p-5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-700 px-2.5 py-0.5 text-[10px] font-bold text-white">VENDEUR PRO</span>
                  {v.garageVerifie && <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white">GARAGE VÉRIFIÉ ✓</span>}
                </div>
                <h2 className="mt-3 text-lg font-extrabold text-white">Professionnel vérifié</h2>
                <p className="mt-1 text-sm text-blue-200">Cette annonce est publiée par un professionnel partenaire MKA.P-MS.</p>
                <ul className="mt-3 space-y-1.5">
                  {["Société vérifiée", "Documents contrôlés", "Historique consultable", "Assistance après-vente", "Garantie selon vendeur"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-white"><ShieldCheck size={14} className="text-blue-300" /> {t}</li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-slate-100 p-5">
                <h3 className="text-sm font-bold text-[#111]">Pourquoi choisir un professionnel ?</h3>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  {["Plus de choix", "Factures disponibles", "Historique d'entretien", "Accompagnement administratif", "Financement disponible"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><ShieldCheck size={12} className="text-blue-600" /> {t}</li>
                  ))}
                </ul>
              </div>
              {v.vendeur && (
                <div className="border-t border-slate-100 p-5">
                  <h3 className="text-sm font-bold text-[#111]">Réputation</h3>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-2xl font-extrabold text-[#111]">{Number(v.vendeur.rating || 0).toFixed(1)}</p>
                      <p className="text-[10px] text-slate-500">Note / 5</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-2xl font-extrabold text-[#111]">{v.vendeur.reviewCount || 0}</p>
                      <p className="text-[10px] text-slate-500">Avis clients</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── PARTICULIER ── */
            <div className="card overflow-hidden">
              <div className="bg-white p-5">
                <h2 className="text-lg font-extrabold text-[#111]">Pourquoi acheter sur MKA.P-MS ?</h2>
                <p className="mt-1 text-sm text-slate-500">Achetez en toute confiance</p>
                <ul className="mt-3 space-y-2">
                  {["Historique disponible", "Messagerie sécurisée", "Paiement sécurisé", "Assistance administrative", "Accompagnement MKA.P-MS"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-slate-700"><ShieldCheck size={14} className="text-[#D4AF37]" /> {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              11. BLOC VÉRIFIER L'HISTORIQUE
             ═══════════════════════════════════════════════════════════ */}
          <div className="card p-5">
            <h2 className="text-base font-extrabold text-[#111]">Vérifiez l'historique avant d'acheter</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-4">
              {["Accidents", "Kilométrage", "Vol", "Gage", "Contrôle technique", "Entretiens", "Importation", "Propriétaires"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
                  <ShieldCheck size={12} className="text-emerald-600" /> {t}
                </div>
              ))}
            </div>
            <Link to="/historique" className="btn-gold mt-4 w-full text-sm">VÉRIFIER L'HISTORIQUE</Link>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              12. BLOC SERVICES MKA.P-MS
             ═══════════════════════════════════════════════════════════ */}
          <div className="card p-5">
            <h2 className="text-base font-extrabold text-[#111]">Besoin d'aide ?</h2>
            <p className="mt-1 text-xs text-slate-500">Services disponibles pour ce véhicule</p>
            <ul className="mt-3 space-y-2">
              {["Devis garage", "Dépannage", "Livraison", "Carte grise", "Contrôle avant achat", "Assurance"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-slate-700">
                  <ShieldCheck size={14} className="text-[#D4AF37]" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              13. PUBLICITÉS INTERNES MKA.P-MS
             ═══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { text: "Besoin d'un financement ?", sub: "Voir les solutions", to: "/finance", bg: "bg-[#111]", tc: "text-white", sc: "text-[#D4AF37]" },
              { text: "Besoin d'un garage ?", sub: "Obtenir un devis", to: "/garages", bg: "bg-blue-700", tc: "text-white", sc: "text-blue-200" },
              { text: "Besoin d'une livraison ?", sub: "Comparer les transporteurs", to: "/livraison", bg: "bg-emerald-700", tc: "text-white", sc: "text-emerald-200" },
              { text: "Vérifier l'historique", sub: "À partir de 2,99 €", to: "/historique", bg: "bg-[#D4AF37]", tc: "text-[#111]", sc: "text-[#111]/70" },
              { text: "Carte grise", sub: "Faire ma demande", to: "/carte-grise", bg: "bg-slate-800", tc: "text-white", sc: "text-slate-300" },
              { text: "Contrôle avant achat", sub: "Prendre rendez-vous", to: "/garages", bg: "bg-orange-600", tc: "text-white", sc: "text-orange-100" },
            ].map((ad) => (
              <Link key={ad.text} to={ad.to} className={`rounded-xl ${ad.bg} p-4 transition hover:opacity-90`}>
                <p className={`text-xs font-bold ${ad.tc}`}>{ad.text}</p>
                <p className={`mt-1 text-[10px] ${ad.sc}`}>{ad.sub}</p>
              </Link>
            ))}
          </div>

          {/* ── PUBLICITÉ ── */}
          <div className="rounded-2xl overflow-hidden" style={{height: '110px', background: 'linear-gradient(135deg, #111 0%, #2d3436 100%)'}}>
            <div className="flex items-center justify-between h-full px-5">
              <div>
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Publicité MKA.P-MS</p>
                <p className="text-sm font-extrabold text-white mt-1">Livraison à domicile</p>
                <p className="text-[10px] text-white/60 mt-0.5">Recevez votre véhicule chez vous · Partout en France</p>
                <button className="mt-2 rounded-full bg-[#D4AF37] px-4 py-1 text-[10px] font-bold text-[#111]" onClick={() => navigate("/services")}>En savoir plus</button>
              </div>
              <div className="text-4xl">🚚</div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              14. FAQ
             ═══════════════════════════════════════════════════════════ */}
          <div className="card p-5">
            <h2 className="text-base font-extrabold text-[#111]">Questions fréquentes</h2>
            <div className="mt-3 space-y-3">
              {[
                { q: "Comment acheter ?", a: "Contactez le vendeur via la messagerie MKA.P-MS, négociez le prix, et procédez au paiement sécurisé via la plateforme." },
                { q: "Comment vendre ?", a: "Créez votre annonce gratuitement, ajoutez vos photos et description. Votre véhicule sera visible immédiatement." },
                { q: "Quels documents sont nécessaires ?", a: "Carte grise, contrôle technique de moins de 6 mois, pièce d'identité du vendeur, certificat de non-gage." },
                { q: "Comment sécuriser la transaction ?", a: "MKA.P-MS propose le paiement sécurisé Stripe. Les fonds sont protégés jusqu'à la confirmation de l'acheteur." },
                { q: "Comment vérifier un véhicule ?", a: "Utilisez notre service de vérification d'historique pour consulter les accidents, le kilométrage, les entretiens et plus." },
              ].map((faq) => (
                <details key={faq.q} className="group rounded-lg border border-slate-100 bg-slate-50">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#111] hover:text-[#D4AF37]">{faq.q}</summary>
                  <p className="px-4 pb-3 text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              15. VÉHICULES SIMILAIRES (placeholder)
             ═══════════════════════════════════════════════════════════ */}
          <div className="card p-5">
            <h2 className="text-base font-extrabold text-[#111]">Véhicules similaires</h2>
            <p className="mt-1 text-xs text-slate-500">D'autres véhicules qui pourraient vous intéresser</p>
            <Link to={`/acheter?q=${encodeURIComponent(v.marque || "")}`} className="btn-outline mt-3 w-full text-sm">
              Voir les {v.marque} disponibles →
            </Link>
          </div>

          </>)}
          {/* ═══ FIN BLOCS ACCOMPAGNEMENT VENTE ═══ */}

          {/* ═══════════════════════════════════════════════════════════
              BLOCS ACCOMPAGNEMENT LOCATION (Location uniquement)
             ═══════════════════════════════════════════════════════════ */}
          {isLocation && (<>

          {/* ── BLOC CONFIANCE LOCATION — différencié Normal vs VTC/TAXI ── */}
          {isVtcTaxi ? (
            /* ── VTC / TAXI : bloc professionnel ── */
            <div className="overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-[#111]">
              <div className="p-6">
                <span className="inline-flex items-center rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-bold text-[#111]">VTC / TAXI</span>
                <h2 className="mt-3 text-lg font-extrabold text-white">Véhicule adapté VTC / Taxi</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Ce véhicule est destiné aux professionnels souhaitant exercer ou développer une activité VTC ou Taxi.
                  La demande se fait directement sur MKA.P-MS avec vérification des documents, validation du dossier, contrat et paiement sécurisé.
                </p>
                <ul className="mt-4 space-y-2">
                  {["Véhicule adapté activité professionnelle", "Documents chauffeur vérifiés", "Société ou statut professionnel contrôlé", "Contrat de location sécurisé", "Suivi dossier dans votre espace", "Paiement et factures disponibles sur la plateforme"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-white"><ShieldCheck size={14} className="text-[#D4AF37]" /> {t}</li>
                  ))}
                </ul>
              </div>

              {/* Conditions avant validation */}
              <div className="border-t border-[#D4AF37]/20 bg-[#1a1a1a] p-5">
                <h3 className="text-sm font-bold text-[#D4AF37]">Conditions avant validation</h3>
                <p className="mt-1 text-xs text-slate-400">Avant toute validation, les documents du chauffeur ou de la société sont analysés et contrôlés.</p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                  {["Identité vérifiée", "Permis contrôlé", "Carte VTC/TAXI demandée si nécessaire", "Société vérifiée si compte pro", "Paiement confirmé avant réservation finale"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><ShieldCheck size={12} className="text-[#D4AF37]" /> {t}</li>
                  ))}
                </ul>
              </div>

              {/* Documents chauffeur */}
              <div className="border-t border-[#D4AF37]/20 bg-[#111] p-5">
                <h3 className="text-sm font-bold text-white">Documents chauffeur</h3>
                <ul className="mt-2 space-y-1 text-xs text-slate-400">
                  {["Pièce d'identité", "Permis de conduire", "Carte VTC ou carte Taxi", "Justificatif domicile", "Attestation assurance si nécessaire"].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">• {t}</li>
                  ))}
                </ul>
                <h3 className="mt-4 text-sm font-bold text-white">Documents société (si applicable)</h3>
                <ul className="mt-2 space-y-1 text-xs text-slate-400">
                  {["KBIS", "SIRET", "TVA si disponible", "RIB société", "Assurance professionnelle"].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">• {t}</li>
                  ))}
                </ul>
              </div>

              {/* Étapes VTC/TAXI */}
              <div className="border-t border-[#D4AF37]/20 bg-[#1a1a1a] p-5">
                <h3 className="text-sm font-bold text-[#D4AF37]">Étapes de la demande</h3>
                <ol className="mt-3 space-y-2">
                  {["Choisir véhicule", "Lire les conditions", "Cliquer « Demander ce véhicule »", "Envoyer documents", "Dossier analysé par IA", "Validation humaine par le loueur", "Signature contrat", "Paiement acompte ou première échéance", "Véhicule réservé", "Remise du véhicule"].map((t, i) => (
                    <li key={t} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-bold text-[#111]">{i + 1}</span> {t}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            /* ── LOCATION NORMALE : bloc confiance ── */
            <div className="card overflow-hidden">
              <div className="bg-white p-6">
                <span className="inline-flex items-center rounded-full bg-blue-800 px-3 py-1 text-[10px] font-bold text-white">LOCATION PRO</span>
                <h2 className="mt-3 text-lg font-extrabold text-[#111]">Louez votre véhicule en toute confiance</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Cette annonce est proposée par un professionnel vérifié MKA.P-MS.
                  Toutes les étapes de réservation, documents, contrat et paiement sont suivies directement depuis votre espace utilisateur.
                </p>
                <ul className="mt-4 space-y-2">
                  {["Professionnel vérifié", "Contrat généré sur la plateforme", "Paiement sécurisé", "Documents suivis étape par étape", "État des lieux départ/retour", "Assistance MKA.P-MS disponible"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-slate-700"><ShieldCheck size={14} className="text-blue-600" /> {t}</li>
                  ))}
                </ul>
              </div>

              {/* Documents client */}
              <div className="border-t border-slate-100 p-5">
                <h3 className="text-sm font-bold text-[#111]">Documents à fournir</h3>
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {["Pièce d'identité", "Permis de conduire", "Justificatif domicile", "Moyen de paiement", "Dépôt de garantie si nécessaire"].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">• {t}</li>
                  ))}
                </ul>
              </div>

              {/* Comment ça marche */}
              <div className="border-t border-slate-100 p-5">
                <h3 className="text-sm font-bold text-[#111]">Comment ça marche ?</h3>
                <ol className="mt-3 space-y-2">
                  {["Choisissez votre véhicule", "Envoyez vos documents", "Attendez la validation", "Signez le contrat", "Récupérez le véhicule"].map((t, i) => (
                    <li key={t} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">{i + 1}</span> {t}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* ── PUBLICITÉS INTERNES LOCATION ── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {isVtcTaxi ? (
              /* Pubs internes VTC/TAXI */
              <>
                {[
                  { text: "Véhicules disponibles VTC", sub: "Voir la sélection", to: "/louer?segment=vtc", bg: "bg-[#111]", tc: "text-white", sc: "text-[#D4AF37]" },
                  { text: "Location longue durée", sub: "Solutions sur mesure", to: "/finance", bg: "bg-blue-800", tc: "text-white", sc: "text-blue-200" },
                  { text: "Assurance professionnelle", sub: "Protégez votre activité", to: "/assurance", bg: "bg-emerald-700", tc: "text-white", sc: "text-emerald-200" },
                  { text: "Gestion flotte", sub: "Optimisez votre parc", to: "/pro", bg: "bg-slate-800", tc: "text-white", sc: "text-slate-300" },
                  { text: "Documents chauffeur", sub: "Vérifier vos documents", to: "/compte/documents", bg: "bg-[#D4AF37]", tc: "text-[#111]", sc: "text-[#111]/70" },
                  { text: "Comptabilité Pro", sub: "Factures et exports", to: "/compte/factures", bg: "bg-orange-600", tc: "text-white", sc: "text-orange-100" },
                ].map((ad) => (
                  <Link key={ad.text} to={ad.to} className={`rounded-xl ${ad.bg} p-4 transition hover:opacity-90`}>
                    <p className={`text-xs font-bold ${ad.tc}`}>{ad.text}</p>
                    <p className={`mt-1 text-[10px] ${ad.sc}`}>{ad.sub}</p>
                  </Link>
                ))}
              </>
            ) : (
              /* Pubs internes Location normale */
              <>
                {[
                  { text: "Assurance location", sub: "Roulez couvert", to: "/assurance", bg: "bg-blue-700", tc: "text-white", sc: "text-blue-200" },
                  { text: "Dépannage", sub: "Assistance 24h/24", to: "/garages", bg: "bg-red-600", tc: "text-white", sc: "text-red-100" },
                  { text: "Historique véhicule", sub: "Transparence totale", to: "/historique", bg: "bg-emerald-700", tc: "text-white", sc: "text-emerald-200" },
                  { text: "Pièces auto", sub: "Commander en ligne", to: "/pieces", bg: "bg-slate-800", tc: "text-white", sc: "text-slate-300" },
                  { text: "Garage+", sub: "Trouver un garage", to: "/garages", bg: "bg-[#D4AF37]", tc: "text-[#111]", sc: "text-[#111]/70" },
                ].map((ad) => (
                  <Link key={ad.text} to={ad.to} className={`rounded-xl ${ad.bg} p-4 transition hover:opacity-90`}>
                    <p className={`text-xs font-bold ${ad.tc}`}>{ad.text}</p>
                    <p className={`mt-1 text-[10px] ${ad.sc}`}>{ad.sub}</p>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* ── FAQ LOCATION — différenciée Normal vs VTC/TAXI ── */}
          <div className="card p-5">
            <h2 className="text-base font-extrabold text-[#111]">Questions fréquentes</h2>
            <div className="mt-3 space-y-3">
              {isVtcTaxi ? (
                <>
                  {[
                    { q: "Puis-je louer sans carte VTC ?", a: "Non, la carte VTC ou carte Taxi est obligatoire pour exercer une activité de transport professionnel. Elle sera demandée lors de l'envoi de vos documents." },
                    { q: "Quels documents sont obligatoires ?", a: "Pièce d'identité, permis de conduire, carte VTC ou Taxi, justificatif domicile, et attestation d'assurance si nécessaire. Pour les sociétés : KBIS, SIRET, RIB." },
                    { q: "Est-ce réservé aux sociétés ?", a: "Non, les chauffeurs indépendants (micro-entreprise, auto-entrepreneur) peuvent également faire une demande avec leur statut professionnel." },
                    { q: "Puis-je ajouter plusieurs chauffeurs ?", a: "Oui, si vous êtes une société avec une flotte, vous pouvez ajouter plusieurs chauffeurs autorisés sur le contrat de location." },
                    { q: "Comment fonctionne le contrat ?", a: "Le contrat est généré directement sur MKA.P-MS après validation de votre dossier. Vous le signez électroniquement depuis votre espace." },
                    { q: "Comment suivre mes paiements ?", a: "Tous vos paiements, échéances et factures sont disponibles dans votre espace utilisateur, rubrique 'Mes paiements'." },
                  ].map((faq) => (
                    <details key={faq.q} className="group rounded-lg border border-slate-100 bg-slate-50">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#111] hover:text-[#D4AF37]">{faq.q}</summary>
                      <p className="px-4 pb-3 text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                    </details>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { q: "Quels documents fournir pour louer ?", a: "Pièce d'identité, permis de conduire valide, justificatif de domicile récent et un moyen de paiement. Un dépôt de garantie peut être demandé." },
                    { q: "Quand payer ?", a: "Le paiement se fait au moment de la réservation via la plateforme sécurisée. Vous recevez une confirmation immédiate." },
                    { q: "Comment fonctionne la caution ?", a: "La caution est bloquée sur votre moyen de paiement au moment de la prise en charge et restituée après vérification de l'état du véhicule au retour." },
                    { q: "Que faire en cas de retard ?", a: "Contactez le loueur via la messagerie MKA.P-MS pour signaler tout retard. Des frais supplémentaires peuvent s'appliquer selon les conditions." },
                    { q: "Comment modifier ma demande ?", a: "Rendez-vous dans votre espace utilisateur, rubrique 'Mes locations', pour modifier les dates ou annuler avant la validation." },
                    { q: "Comment annuler une réservation ?", a: "L'annulation est possible depuis votre espace avant le début de la location. Les conditions d'annulation dépendent du loueur." },
                  ].map((faq) => (
                    <details key={faq.q} className="group rounded-lg border border-slate-100 bg-slate-50">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#111] hover:text-[#D4AF37]">{faq.q}</summary>
                      <p className="px-4 pb-3 text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                    </details>
                  ))}
                </>
              )}
            </div>
          </div>

          </>)}
          {/* ═══ FIN BLOCS ACCOMPAGNEMENT LOCATION ═══ */}

          <Link to={isLocation ? "/louer" : "/acheter"} className="block text-center text-sm font-semibold text-gold-dark">
            ← Retour aux annonces
          </Link>
        </section>
      </div>

      {/* Barre d'actions fixe (mobile) — toujours visible, au-dessus de la navigation */}
      {/* ── Modal signalement interne ── */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowReport(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[#111]">Signaler cette annonce</h3>
            <p className="mt-1 text-xs text-slate-500">Réf. {v.reference || `#${v.id}`} — {v.titre}</p>
            {reportSent ? (
              <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-sm font-semibold text-green-700">Signalement envoyé</p>
                <p className="mt-1 text-xs text-green-600">Notre équipe va examiner cette annonce. Merci.</p>
                <button onClick={() => { setShowReport(false); setReportSent(false); setReportReason(""); }} className="mt-3 rounded-lg bg-[#111] px-4 py-2 text-xs font-bold text-white">Fermer</button>
              </div>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  {["Annonce frauduleuse", "Photos non conformes", "Prix incorrect", "Véhicule déjà vendu", "Contenu inapproprié", "Autre"].map((r) => (
                    <button key={r} onClick={() => setReportReason(r)} className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${reportReason === r ? "border-[#D4AF37] bg-[#D4AF37]/10 font-semibold text-[#111]" : "border-slate-200 text-slate-600 hover:border-[#D4AF37]"}`}>{r}</button>
                  ))}
                </div>
                <button
                  disabled={!reportReason}
                  onClick={() => setReportSent(true)}
                  className="mt-4 w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40"
                >Envoyer le signalement</button>
                <button onClick={() => setShowReport(false)} className="mt-2 w-full text-center text-xs text-slate-400 hover:text-slate-600">Annuler</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Barre fixe mobile — adaptée au type, bien séparée de la nav bar */}
      <div className="fixed inset-x-0 z-30 border-t-2 border-[#D4AF37]/30 bg-white p-3 shadow-[0_-6px_20px_rgba(0,0,0,0.12)] md:hidden" style={{ bottom: 'calc(52px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="container-page">
          {isMkapmsStock ? (
            /* MKA.P-MS Officiel : Acheter (gauche) + Contact (droite), PAS de Appeler */
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-acheter h-[52px] text-sm font-bold" onClick={primaryAction}>Acheter</button>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-message flex h-[52px] items-center justify-center gap-2 text-sm font-bold"><Phone size={16} /> Contact</a>
            </div>
          ) : isLocation ? (
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-acheter h-[52px] text-sm font-bold" onClick={() => requireLogin(() => navigate("/compte/messages"))}><Send size={14} /> Demande</button>
              <button className="btn-message h-[52px] text-sm font-bold" onClick={() => requireLogin(() => navigate("/compte/documents"))}><FileText size={14} /> Dossier</button>
            </div>
          ) : (
            /* Pro / Particulier : Acheter + Contact (2 boutons, pas 3) */
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-acheter h-[52px] text-sm font-bold" onClick={primaryAction}>Acheter</button>
              <button className="btn-message h-[52px] text-sm font-bold" onClick={messageAction}><MessageSquare size={14} /> Contact</button>
            </div>
          )}
        </div>
      </div>

      {/* Boutons flottants — UNIQUEMENT pour MKA.P-MS Officiel (vente ET location), milieu droit */}
      {isOfficiel && v.contactTelephone && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 md:right-6">
          <a href={`tel:${v.contactTelephone}`} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111] text-white shadow-lg hover:bg-[#333] lg:h-16 lg:w-16">
            <Phone size={22} className="lg:hidden" /><Phone size={26} className="hidden lg:block" />
          </a>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg hover:bg-[#1ebe57] lg:h-16 lg:w-16">
            <MessageSquare size={22} className="lg:hidden" /><MessageSquare size={26} className="hidden lg:block" />
          </a>
        </div>
      )}

      {/* ── LIGHTBOX simple pour annonces SANS catégories ── */}
      {!hasPhotoCategories && !userAnnonceHasCategories && lightboxOpen && photos.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black" onClick={() => { setLightboxOpen(false); setPhotoCat("toutes" as PhotoCategory); setPhotoIdx(0); }}>
          <div className="flex justify-end px-4" style={{ paddingTop: "max(3rem, calc(env(safe-area-inset-top, 1rem) + 2rem))" }}>
            <button onClick={() => { setLightboxOpen(false); setPhotoCat("toutes" as PhotoCategory); setPhotoIdx(0); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 text-lg font-bold">✕</button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <img src={photos[lightboxIdx] || ""} alt="" className="max-h-[65vh] w-full rounded-xl object-contain" />
            {photos.length > 1 && (
              <>
                <button onClick={() => setLightboxIdx((i) => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft size={28} /></button>
                <button onClick={() => setLightboxIdx((i) => Math.min(photos.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight size={28} /></button>
              </>
            )}
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{lightboxIdx + 1} / {photos.length}</span>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX plein écran — avec catégories (MKA.P-MS + annonces utilisateur) ── */}
      {(hasPhotoCategories || userAnnonceHasCategories) && lightboxOpen && (() => {
        const catPhotos = hasPhotoCategories
          ? (v.photoCategories[photoCat] || []) as string[]
          : photosRaw.filter((p) => p.categorie === photoCat).map((p) => p.url);
        const lbIdx = Math.min(lightboxIdx, Math.max(0, catPhotos.length - 1));
        return (
          <div className="fixed inset-0 z-50 flex flex-col bg-black" onClick={() => { setLightboxOpen(false); setPhotoCat("toutes" as PhotoCategory); setPhotoIdx(0); }}>
            {/* Header lightbox — descendu sous la barre d'état */}
            <div className="flex items-center justify-between px-4 pb-3" style={{ paddingTop: "max(5rem, calc(env(safe-area-inset-top, 2rem) + 3rem))" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {PHOTO_CATEGORIES.filter((c) => {
                  if (hasPhotoCategories) return (v.photoCategories[c.key] || []).length > 0;
                  return photosRaw.some((p) => p.categorie === c.key);
                }).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => { setPhotoCat(c.key); setLightboxIdx(0); }}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      photoCat === c.key
                        ? "bg-[#D4AF37] text-black"
                        : "border border-white/30 text-white/70 hover:border-[#D4AF37] hover:text-white"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <button onClick={() => { setLightboxOpen(false); setPhotoCat("toutes" as PhotoCategory); setPhotoIdx(0); }} className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 text-lg font-bold">✕</button>
            </div>

            {/* Photo principale lightbox — légèrement plus petite */}
            <div className="relative flex flex-1 items-center justify-center px-4 pb-8" onClick={(e) => e.stopPropagation()}>
              {catPhotos.length > 0 ? (
                <img src={catPhotos[lbIdx]} alt="" className="max-h-[65vh] w-full rounded-xl object-contain" />
              ) : (
                <p className="text-white/60">Aucune photo dans cette catégorie</p>
              )}
              {catPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIdx((i) => Math.max(0, i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={() => setLightboxIdx((i) => Math.min(catPhotos.length - 1, i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              )}
              {catPhotos.length > 0 && (
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  {lbIdx + 1} / {catPhotos.length}
                </span>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function AvisSection({ targetUserId, canReview }: { targetUserId: number; canReview: boolean }) {
  const utils = trpc.useUtils();
  const list = trpc.reviews.listForUser.useQuery({ targetUserId });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const create = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setComment("");
      utils.reviews.listForUser.invalidate({ targetUserId });
      utils.annonces.get.invalidate();
    },
  });

  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-800">Avis clients</h3>
      {canReview && (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-600">Laisser un avis</p>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} étoiles`}>
                <Star
                  size={20}
                  className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                />
              </button>
            ))}
          </div>
          <textarea
            className="input mt-2 text-sm"
            rows={2}
            placeholder="Votre commentaire (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            className="btn-primary mt-2 w-full text-sm"
            disabled={create.isPending}
            onClick={() => create.mutate({ targetUserId, rating, comment: comment || undefined })}
          >
            {create.isPending ? "Envoi…" : "Publier mon avis"}
          </button>
          {create.isSuccess && <p className="mt-1 text-xs text-emerald-600">Merci, votre avis est publié.</p>}
        </div>
      )}
      <div className="mt-3 space-y-3">
        {list.data?.map((r) => (
          <div key={r.id} className="border-b border-slate-50 pb-2 last:border-0">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={13}
                  className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                />
              ))}
              <span className="ml-1 text-xs font-medium text-slate-500">{r.authorName ?? "Client"}</span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
          </div>
        ))}
        {list.data && list.data.length === 0 && (
          <p className="text-sm text-slate-500">Aucun avis pour le moment.</p>
        )}
      </div>
    </div>
  );
}
