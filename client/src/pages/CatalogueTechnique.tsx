import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Search, Car, CheckCircle, Cog, Settings,
  Disc, Thermometer, Wind, Fuel, Gauge, Zap, Shield,
  CircuitBoard, Battery, Lightbulb, LifeBuoy,
  ChevronDown, ChevronRight, Download, Eye, List, Image as ImageIcon,
  Home, Wrench, Clock, Database, BookOpen, ShoppingCart, Info
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CATALOGUE TECHNIQUE MKA.P-MS — Version 2027
   Type AutoData / EPC — Recherche plaque/VIN. Tous véhicules, tous systèmes.
   Navigation pro, multi-véhicules, données techniques, schémas éclatés.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── Multi-vehicle demo database ─── */
interface VehicleInfo {
  marque: string; modele: string; version: string; annee: string;
  codeMoteur: string; cylindree: string; puissance: string;
  coupleMax: string; norme: string; transmission: string;
  architecture: string; injection: string; poids: string;
  ptac: string; dimensions: string; empattement: string;
  reservoir: string; carburant: string; extra?: string;
}

const VEHICLE_DB: Record<string, VehicleInfo> = {
  "AB-123-CD": {
    marque: "BMW", modele: "X5 (E70)", version: "3.0d xDrive",
    annee: "2023", codeMoteur: "N57D30A", cylindree: "2 993 cm³",
    puissance: "258 ch / 190 kW", coupleMax: "560 Nm à 1 500 tr/min",
    norme: "Euro 6d", transmission: "BVA 8 rapports ZF",
    architecture: "6 cylindres en ligne turbo", injection: "Common Rail haute pression",
    poids: "2 145 kg", ptac: "2 790 kg", dimensions: "4 886 x 1 938 x 1 762 mm",
    empattement: "2 933 mm", reservoir: "85 litres", carburant: "Diesel",
  },
  "EF-456-GH": {
    marque: "Peugeot", modele: "308 GTi", version: "1.6 THP 270 S&S",
    annee: "2024", codeMoteur: "EP6CDTX", cylindree: "1 598 cm³",
    puissance: "270 ch / 200 kW", coupleMax: "330 Nm à 1 900 tr/min",
    norme: "Euro 6d-ISC-FCM", transmission: "BVM 6 rapports",
    architecture: "4 cylindres en ligne turbo", injection: "Directe haute pression",
    poids: "1 205 kg", ptac: "1 700 kg", dimensions: "4 253 x 1 804 x 1 461 mm",
    empattement: "2 620 mm", reservoir: "53 litres", carburant: "Essence",
  },
  "IJ-789-KL": {
    marque: "Mercedes-Benz", modele: "Classe C (W206)", version: "220d 9G-Tronic",
    annee: "2024", codeMoteur: "OM654", cylindree: "1 993 cm³",
    puissance: "200 ch / 147 kW", coupleMax: "440 Nm à 1 800 tr/min",
    norme: "Euro 6d", transmission: "BVA 9 rapports 9G-Tronic",
    architecture: "4 cylindres en ligne turbo", injection: "Common Rail",
    poids: "1 710 kg", ptac: "2 205 kg", dimensions: "4 751 x 1 820 x 1 437 mm",
    empattement: "2 865 mm", reservoir: "66 litres", carburant: "Diesel",
  },
  "MN-012-OP": {
    marque: "Renault", modele: "Mégane RS", version: "1.8 TCe 300 Trophy",
    annee: "2023", codeMoteur: "M5Pt", cylindree: "1 798 cm³",
    puissance: "300 ch / 221 kW", coupleMax: "420 Nm à 3 200 tr/min",
    norme: "Euro 6d-Full", transmission: "EDC 6 rapports double embrayage",
    architecture: "4 cylindres en ligne turbo", injection: "Directe + indirecte",
    poids: "1 426 kg", ptac: "1 880 kg", dimensions: "4 364 x 1 874 x 1 431 mm",
    empattement: "2 669 mm", reservoir: "50 litres", carburant: "Essence",
  },
};

const DEFAULT_VEHICLE: VehicleInfo = {
  marque: "Peugeot", modele: "3008 GT", version: "1.6 PureTech 225 Hybrid4 EAT8",
  annee: "2024", codeMoteur: "EP6FADTX", cylindree: "1 598 cm³",
  puissance: "225 ch / 165 kW", coupleMax: "300 Nm à 3 000 tr/min",
  norme: "Euro 6d-ISC-FCM", transmission: "BVA 8 rapports EAT8",
  architecture: "4 cylindres en ligne", injection: "Directe haute pression",
  poids: "1 880 kg", ptac: "2 280 kg", dimensions: "4 447 x 1 841 x 1 620 mm",
  empattement: "2 675 mm", reservoir: "53 litres", carburant: "Essence",
  extra: "Batterie hybride 13.2 kWh",
};

function lookupVehicle(plate: string): { vehicle: VehicleInfo; isDemo: boolean } {
  const clean = plate.trim().toUpperCase().replace(/[\s.]/g, "-").replace(/[^A-Z0-9-]/g, "");
  if (VEHICLE_DB[clean]) return { vehicle: VEHICLE_DB[clean], isDemo: false };
  const noDash = clean.replace(/-/g, "");
  for (const [key, val] of Object.entries(VEHICLE_DB)) {
    if (key.replace(/-/g, "") === noDash) return { vehicle: val, isDemo: false };
  }
  return { vehicle: DEFAULT_VEHICLE, isDemo: true };
}

type NavTab = "accueil" | "vehicule" | "pieces" | "donnees" | "schemas" | "temps";

const NAV_TABS: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: "accueil", label: "Accueil", icon: Home },
  { id: "vehicule", label: "Véhicule", icon: Car },
  { id: "pieces", label: "Pièces", icon: Wrench },
  { id: "donnees", label: "Données tech", icon: Database },
  { id: "schemas", label: "Schémas", icon: ImageIcon },
  { id: "temps", label: "Temps", icon: Clock },
];

interface SystemDef {
  id: string;
  label: string;
  cat: string;
  icon: React.ElementType;
  color: string;
}

const SYSTEMS_ALL: SystemDef[] = [
  { id: "moteur", label: "Moteur", cat: "Mecanique", icon: Cog, color: "text-red-500" },
  { id: "distribution", label: "Distribution", cat: "Mecanique", icon: Settings, color: "text-orange-500" },
  { id: "embrayage", label: "Embrayage", cat: "Mecanique", icon: Disc, color: "text-amber-600" },
  { id: "boite", label: "Boîte de vitesses", cat: "Mecanique", icon: Settings, color: "text-yellow-600" },
  { id: "freinage", label: "Freinage", cat: "Mecanique", icon: LifeBuoy, color: "text-blue-500" },
  { id: "direction", label: "Direction", cat: "Mecanique", icon: LifeBuoy, color: "text-indigo-500" },
  { id: "suspension", label: "Suspension", cat: "Mecanique", icon: Settings, color: "text-violet-500" },
  { id: "refroidissement", label: "Refroidissement", cat: "Mecanique", icon: Thermometer, color: "text-cyan-500" },
  { id: "echappement", label: "Échappement", cat: "Mecanique", icon: Wind, color: "text-slate-500" },
  { id: "alimentation", label: "Alimentation carburant", cat: "Mecanique", icon: Fuel, color: "text-green-600" },
  { id: "turbo", label: "Turbo / Compresseur", cat: "Mecanique", icon: Gauge, color: "text-rose-500" },
  { id: "injection", label: "Injection", cat: "Electronique", icon: Zap, color: "text-purple-500" },
  { id: "allumage", label: "Allumage", cat: "Electronique", icon: Zap, color: "text-pink-500" },
  { id: "abs_esp", label: "ABS / ESP / TC", cat: "Electronique", icon: Shield, color: "text-blue-600" },
  { id: "airbags", label: "Airbags / SRS", cat: "Electronique", icon: Shield, color: "text-red-600" },
  { id: "climatisation", label: "Climatisation", cat: "Electronique", icon: Thermometer, color: "text-sky-500" },
  { id: "tableau_bord", label: "Tableau de bord", cat: "Electronique", icon: Gauge, color: "text-emerald-500" },
  { id: "capteurs", label: "Capteurs", cat: "Electronique", icon: CircuitBoard, color: "text-teal-500" },
  { id: "calculateurs", label: "Calculateurs (ECU)", cat: "Electronique", icon: CircuitBoard, color: "text-fuchsia-500" },
  { id: "multiplexage", label: "CAN / LIN / MOST", cat: "Electronique", icon: CircuitBoard, color: "text-lime-600" },
  { id: "diagnostic", label: "Diagnostic OBD", cat: "Electronique", icon: Search, color: "text-gray-500" },
  { id: "batterie", label: "Batterie", cat: "Electrique", icon: Battery, color: "text-green-500" },
  { id: "alternateur", label: "Alternateur", cat: "Electrique", icon: Zap, color: "text-amber-500" },
  { id: "demarreur", label: "Démarreur", cat: "Electrique", icon: Zap, color: "text-orange-600" },
  { id: "eclairage", label: "Éclairage", cat: "Electrique", icon: Lightbulb, color: "text-yellow-500" },
  { id: "fusibles", label: "Fusibles / Relais", cat: "Electrique", icon: Settings, color: "text-gray-500" },
  { id: "cablage", label: "Câblage / Faisceaux", cat: "Electrique", icon: CircuitBoard, color: "text-gray-600" },
  { id: "dimensions", label: "Dimensions", cat: "Carrosserie", icon: Car, color: "text-blue-400" },
  { id: "poids", label: "Poids", cat: "Carrosserie", icon: Settings, color: "text-slate-400" },
  { id: "vitrage", label: "Vitrage", cat: "Carrosserie", icon: Settings, color: "text-sky-400" },
  { id: "ouvrants", label: "Ouvrants / Serrures", cat: "Carrosserie", icon: Settings, color: "text-indigo-400" },
];

const CATEGORIES_SYS = ["Mecanique", "Electronique", "Electrique", "Carrosserie"];

interface PieceData { nom: string; ref: string; prix: string; dispo: boolean; pos?: { x: number; y: number } }
interface SystemData {
  coupleSerrage: { piece: string; valeur: string; outil: string }[];
  tempsBaremes: { operation: string; temps: string; difficulte: string; outilSpecial?: string }[];
  pieces: PieceData[];
  capacites?: { libelle: string; valeur: string }[];
}

const DEMO_DATA: Record<string, SystemData> = {
  moteur: {
    coupleSerrage: [
      { piece: "Culasse (vis)", valeur: "40 Nm + 90° + 90°", outil: "Clé dynamométrique + rapporteur" },
      { piece: "Bielle (chapeau)", valeur: "30 Nm + 45°", outil: "Clé dynamométrique + rapporteur" },
      { piece: "Palier vilebrequin", valeur: "25 Nm + 60°", outil: "Clé dynamométrique" },
      { piece: "Bougie allumage", valeur: "25 Nm", outil: "Clé à bougie 16mm" },
      { piece: "Injecteur (bride)", valeur: "9 Nm", outil: "Clé dynamométrique" },
      { piece: "Carter huile", valeur: "10 Nm", outil: "Douille Torx T30" },
      { piece: "Couvre-culasse", valeur: "8 Nm", outil: "Douille Torx T25" },
      { piece: "Collecteur admission", valeur: "20 Nm", outil: "Douille 13mm" },
      { piece: "Collecteur échappement", valeur: "25 Nm", outil: "Douille 15mm" },
      { piece: "Bouchon vidange", valeur: "35 Nm", outil: "Clé carré 8mm" },
      { piece: "Support moteur (AV)", valeur: "55 Nm", outil: "Douille 18mm" },
      { piece: "Support moteur (AR)", valeur: "65 Nm", outil: "Douille 18mm + allonge" },
    ],
    tempsBaremes: [
      { operation: "Vidange + filtre huile", temps: "0.5h", difficulte: "Facile", outilSpecial: "Clé filtre à sangle" },
      { operation: "Remplacement bougies x4", temps: "0.8h", difficulte: "Facile", outilSpecial: "Clé à bougie magnétique 16mm" },
      { operation: "Distribution complète", temps: "4.5h", difficulte: "Expert", outilSpecial: "Kit calage PSA EP6" },
      { operation: "Joints de culasse", temps: "6.0h", difficulte: "Expert", outilSpecial: "Extracteur + kit calage" },
      { operation: "Remplacement turbo", temps: "3.5h", difficulte: "Avancé", outilSpecial: "Clé à pipe longue 10/13mm" },
      { operation: "Injecteurs x4", temps: "2.0h", difficulte: "Avancé", outilSpecial: "Extracteur injecteur" },
      { operation: "Pompe à eau", temps: "2.5h", difficulte: "Moyen" },
      { operation: "Courroie accessoire", temps: "0.7h", difficulte: "Facile" },
    ],
    pieces: [
      { nom: "Culasse complète", ref: "PSA 0200 HN", prix: "890 €", dispo: false, pos: { x: 50, y: 15 } },
      { nom: "Bougie allumage", ref: "PSA 9806 043 880", prix: "12 €", dispo: true, pos: { x: 35, y: 25 } },
      { nom: "Injecteur", ref: "Continental A2C59517051", prix: "195 €", dispo: false, pos: { x: 65, y: 20 } },
      { nom: "Bobine allumage", ref: "PSA 9808 653 680", prix: "58 €", dispo: true, pos: { x: 40, y: 35 } },
      { nom: "Filtre à huile", ref: "PSA 1109 CK", prix: "15 €", dispo: true, pos: { x: 70, y: 60 } },
      { nom: "Filtre à air", ref: "PSA 1444 TT", prix: "22 €", dispo: true, pos: { x: 80, y: 30 } },
      { nom: "Kit distribution", ref: "Gates KP15606XS", prix: "185 €", dispo: true, pos: { x: 25, y: 50 } },
      { nom: "Pompe à eau", ref: "SKF VKPC 83649", prix: "89 €", dispo: true, pos: { x: 30, y: 65 } },
      { nom: "Thermostat", ref: "PSA 1336 Z7", prix: "42 €", dispo: false, pos: { x: 55, y: 70 } },
      { nom: "Turbo complet", ref: "Garrett 784011-5005S", prix: "890 €", dispo: false, pos: { x: 15, y: 40 } },
      { nom: "Joint culasse", ref: "Elring 150.131", prix: "78 €", dispo: true, pos: { x: 50, y: 45 } },
      { nom: "Capteur PMH", ref: "PSA 1920 LS", prix: "35 €", dispo: true, pos: { x: 60, y: 55 } },
      { nom: "Courroie accessoire", ref: "Gates 6PK1078", prix: "25 €", dispo: true, pos: { x: 20, y: 75 } },
      { nom: "Galet tendeur", ref: "INA F-553470", prix: "45 €", dispo: true, pos: { x: 35, y: 80 } },
      { nom: "Sonde lambda", ref: "Bosch 0 258 017 217", prix: "85 €", dispo: true, pos: { x: 75, y: 75 } },
    ],
    capacites: [
      { libelle: "Huile moteur", valeur: "4.25 L — 0W-30 (PSA B71 2312)" },
      { libelle: "Liquide refroidissement", valeur: "6.5 L — Type D (REVKOGEL 2000)" },
      { libelle: "Huile boîte", valeur: "1.9 L — 75W-80 (PSA 9730A6)" },
    ],
  },
  distribution: {
    coupleSerrage: [
      { piece: "Galet tendeur", valeur: "27 Nm", outil: "Clé dynamométrique + clé Allen 6mm" },
      { piece: "Poulie vilebrequin", valeur: "40 Nm + 90° + 15°", outil: "Clé dynamométrique + outil blocage" },
      { piece: "Vis pignon AAC", valeur: "55 Nm", outil: "Clé dynamométrique + blocage AAC" },
      { piece: "Tendeur hydraulique", valeur: "10 Nm", outil: "Clé dynamométrique" },
      { piece: "Cache distribution", valeur: "8 Nm", outil: "Douille Torx T25" },
    ],
    tempsBaremes: [
      { operation: "Kit distribution complet", temps: "4.5h", difficulte: "Expert", outilSpecial: "Kit calage PSA EP6 / DW10" },
      { operation: "Remplacement chaîne", temps: "5.0h", difficulte: "Expert", outilSpecial: "Outil blocage + compresseur chaîne" },
      { operation: "Galet tendeur seul", temps: "3.0h", difficulte: "Avancé" },
      { operation: "Joint spi vilebrequin", temps: "4.0h", difficulte: "Expert" },
    ],
    pieces: [
      { nom: "Kit courroie distribution", ref: "Gates KP15606XS-1", prix: "185 €", dispo: true, pos: { x: 50, y: 30 } },
      { nom: "Galet tendeur", ref: "INA 534 0005 10", prix: "62 €", dispo: true, pos: { x: 30, y: 45 } },
      { nom: "Galet enrouleur", ref: "INA 532 0004 10", prix: "38 €", dispo: true, pos: { x: 70, y: 45 } },
      { nom: "Pompe à eau", ref: "SKF VKPC 83649", prix: "89 €", dispo: true, pos: { x: 50, y: 65 } },
      { nom: "Poulie vilebrequin", ref: "PSA 0515 R7", prix: "125 €", dispo: false, pos: { x: 50, y: 80 } },
      { nom: "Joint spi AV", ref: "Corteco 20033420B", prix: "18 €", dispo: true, pos: { x: 35, y: 70 } },
    ],
  },
  embrayage: {
    coupleSerrage: [
      { piece: "Volant moteur", valeur: "60 Nm + 60°", outil: "Clé dynamométrique + blocage volant" },
      { piece: "Mécanisme embrayage", valeur: "22 Nm", outil: "Clé dynamométrique, serrage en étoile" },
      { piece: "Butée hydraulique", valeur: "8 Nm", outil: "Douille 10mm" },
      { piece: "Vis boîte/moteur", valeur: "55 Nm", outil: "Douille 18mm" },
    ],
    tempsBaremes: [
      { operation: "Kit embrayage complet", temps: "4.0h", difficulte: "Expert", outilSpecial: "Outil centrage embrayage + vérin" },
      { operation: "Volant moteur bimasse", temps: "4.5h", difficulte: "Expert", outilSpecial: "Outil centrage + blocage" },
      { operation: "Butée hydraulique", temps: "3.5h", difficulte: "Avancé" },
      { operation: "Câble embrayage (mécanique)", temps: "0.5h", difficulte: "Facile" },
    ],
    pieces: [
      { nom: "Kit embrayage complet", ref: "Valeo 826 818", prix: "420 €", dispo: true, pos: { x: 50, y: 40 } },
      { nom: "Volant moteur bimasse", ref: "LuK 415 0744 10", prix: "580 €", dispo: false, pos: { x: 50, y: 70 } },
      { nom: "Butée hydraulique", ref: "Valeo 810 042", prix: "95 €", dispo: true, pos: { x: 30, y: 55 } },
      { nom: "Disque embrayage", ref: "Sachs 1878 654 434", prix: "145 €", dispo: true, pos: { x: 50, y: 25 } },
      { nom: "Mécanisme pression", ref: "Sachs 3082 654 204", prix: "185 €", dispo: true, pos: { x: 70, y: 35 } },
    ],
  },
  boite: {
    coupleSerrage: [
      { piece: "Bouchon remplissage", valeur: "30 Nm", outil: "Clé Allen 8mm" },
      { piece: "Bouchon vidange BV", valeur: "30 Nm", outil: "Clé Allen 8mm" },
      { piece: "Carter de boîte", valeur: "22 Nm", outil: "Douille Torx T40" },
      { piece: "Capteur vitesse", valeur: "8 Nm", outil: "Douille 10mm" },
    ],
    tempsBaremes: [
      { operation: "Vidange boîte manuelle", temps: "0.7h", difficulte: "Facile" },
      { operation: "Vidange boîte auto (EAT8)", temps: "1.5h", difficulte: "Moyen", outilSpecial: "Station de vidange BVA" },
      { operation: "Remplacement BV complète", temps: "8.0h", difficulte: "Expert", outilSpecial: "Vérin de fosse + support BV" },
      { operation: "Joint spi sortie de boîte", temps: "5.0h", difficulte: "Expert" },
      { operation: "Capteur de vitesse", temps: "0.3h", difficulte: "Facile" },
    ],
    pieces: [
      { nom: "Huile BV manuelle 75W-80", ref: "PSA 9730.A6 (2L)", prix: "45 €", dispo: true, pos: { x: 50, y: 75 } },
      { nom: "Huile BVA (ATF)", ref: "PSA 9736.22 (7L)", prix: "120 €", dispo: true, pos: { x: 50, y: 60 } },
      { nom: "Capteur vitesse", ref: "PSA 2529 24", prix: "52 €", dispo: true, pos: { x: 70, y: 40 } },
      { nom: "Joint carter BV", ref: "PSA 2216 39", prix: "28 €", dispo: true, pos: { x: 30, y: 50 } },
      { nom: "Solénoïde EAT8", ref: "PSA AL4-SOL-01", prix: "185 €", dispo: false, pos: { x: 55, y: 30 } },
    ],
  },
  freinage: {
    coupleSerrage: [
      { piece: "Étrier de frein AV", valeur: "105 Nm", outil: "Douille 18mm" },
      { piece: "Étrier de frein AR", valeur: "45 Nm", outil: "Douille 13mm" },
      { piece: "Disque (vis fixation)", valeur: "8 Nm", outil: "Torx T30" },
      { piece: "Flexible de frein", valeur: "18 Nm", outil: "Clé à tuyauter 11mm" },
      { piece: "Maître-cylindre", valeur: "22 Nm", outil: "Douille 13mm" },
      { piece: "Vis de purge", valeur: "10 Nm", outil: "Clé 7mm ou 8mm" },
    ],
    tempsBaremes: [
      { operation: "Plaquettes AV (les 2 côtés)", temps: "0.7h", difficulte: "Facile", outilSpecial: "Repousse-piston" },
      { operation: "Disques + plaquettes AV", temps: "1.2h", difficulte: "Moyen", outilSpecial: "Repousse-piston" },
      { operation: "Disques + plaquettes AR", temps: "1.5h", difficulte: "Moyen", outilSpecial: "Repousse-piston rotationnel" },
      { operation: "Purge liquide de frein", temps: "0.5h", difficulte: "Facile", outilSpecial: "Purgeur à pression" },
      { operation: "Remplacement flexible", temps: "0.8h", difficulte: "Moyen" },
      { operation: "Remplacement maître-cylindre", temps: "1.5h", difficulte: "Avancé" },
    ],
    pieces: [
      { nom: "Plaquettes AV", ref: "TRW GDB1960", prix: "42 €", dispo: true, pos: { x: 25, y: 35 } },
      { nom: "Plaquettes AR", ref: "TRW GDB2074", prix: "38 €", dispo: true, pos: { x: 75, y: 35 } },
      { nom: "Disque AV (x2)", ref: "TRW DF6273S", prix: "95 €", dispo: true, pos: { x: 25, y: 55 } },
      { nom: "Disque AR (x2)", ref: "TRW DF6274", prix: "72 €", dispo: true, pos: { x: 75, y: 55 } },
      { nom: "Liquide de frein DOT4", ref: "PSA 9979.A3 (1L)", prix: "18 €", dispo: true, pos: { x: 50, y: 75 } },
      { nom: "Flexible AV", ref: "TRW PHD1182", prix: "28 €", dispo: true, pos: { x: 35, y: 45 } },
      { nom: "Étrier AV gauche", ref: "TRW BHW375E", prix: "245 €", dispo: false, pos: { x: 20, y: 25 } },
    ],
  },
  suspension: {
    coupleSerrage: [
      { piece: "Amortisseur AV (écrou tige)", valeur: "44 Nm", outil: "Clé 6 pans + contre-clé" },
      { piece: "Amortisseur AR (fixation haute)", valeur: "65 Nm", outil: "Douille 18mm" },
      { piece: "Bras de suspension", valeur: "110 Nm", outil: "Douille 18mm" },
      { piece: "Rotule de direction", valeur: "50 Nm", outil: "Douille 16mm + extracteur" },
      { piece: "Barre stabilisatrice (biellette)", valeur: "45 Nm", outil: "Douille 16mm" },
      { piece: "Silent-bloc (bras)", valeur: "110 Nm", outil: "Douille 18mm" },
    ],
    tempsBaremes: [
      { operation: "Amortisseur AV (1 côté)", temps: "1.2h", difficulte: "Moyen", outilSpecial: "Compresseur de ressort" },
      { operation: "Amortisseurs AV (paire)", temps: "2.0h", difficulte: "Moyen", outilSpecial: "Compresseur de ressort" },
      { operation: "Amortisseurs AR (paire)", temps: "1.5h", difficulte: "Moyen" },
      { operation: "Bras de suspension AV", temps: "1.0h", difficulte: "Moyen" },
      { operation: "Biellette barre stab.", temps: "0.5h", difficulte: "Facile" },
      { operation: "Rotule de direction", temps: "1.0h", difficulte: "Moyen", outilSpecial: "Extracteur rotule" },
    ],
    pieces: [
      { nom: "Amortisseur AV (unité)", ref: "Monroe G16499", prix: "125 €", dispo: true, pos: { x: 25, y: 30 } },
      { nom: "Amortisseur AR (unité)", ref: "Monroe G2206", prix: "85 €", dispo: true, pos: { x: 75, y: 30 } },
      { nom: "Ressort AV", ref: "Lesjöfors 4095865", prix: "68 €", dispo: true, pos: { x: 30, y: 50 } },
      { nom: "Bras suspension AV", ref: "Lemförder 3906 801", prix: "145 €", dispo: true, pos: { x: 40, y: 65 } },
      { nom: "Biellette barre stab.", ref: "TRW JTS578", prix: "28 €", dispo: true, pos: { x: 55, y: 70 } },
      { nom: "Rotule direction", ref: "TRW JBJ777", prix: "45 €", dispo: true, pos: { x: 65, y: 55 } },
      { nom: "Coupelle amortisseur", ref: "SNR KB655.31", prix: "35 €", dispo: true, pos: { x: 25, y: 20 } },
    ],
  },
  injection: {
    coupleSerrage: [
      { piece: "Injecteur (bride)", valeur: "9 Nm", outil: "Clé dynamométrique" },
      { piece: "Rampe commune (fixation)", valeur: "25 Nm", outil: "Douille 13mm" },
      { piece: "Raccord haute pression", valeur: "30 Nm", outil: "Clé 17mm" },
      { piece: "Pompe HP (fixation)", valeur: "22 Nm", outil: "Douille Torx T40" },
    ],
    tempsBaremes: [
      { operation: "Remplacement injecteur (x1)", temps: "1.5h", difficulte: "Avancé", outilSpecial: "Extracteur injecteur + jauge" },
      { operation: "Remplacement injecteurs (x4)", temps: "3.5h", difficulte: "Expert", outilSpecial: "Extracteur injecteur + diagnostic" },
      { operation: "Pompe haute pression", temps: "2.5h", difficulte: "Expert", outilSpecial: "Kit calage + outil blocage" },
      { operation: "Nettoyage injecteurs", temps: "1.0h", difficulte: "Moyen", outilSpecial: "Banc de test injecteurs" },
    ],
    pieces: [
      { nom: "Injecteur essence", ref: "Continental A2C59517051", prix: "195 €", dispo: false, pos: { x: 40, y: 30 } },
      { nom: "Rampe commune", ref: "Bosch 0 445 214 229", prix: "320 €", dispo: false, pos: { x: 50, y: 50 } },
      { nom: "Pompe HP", ref: "Continental A2C53384022", prix: "580 €", dispo: false, pos: { x: 30, y: 60 } },
      { nom: "Capteur pression rail", ref: "Bosch 0 281 002 863", prix: "95 €", dispo: true, pos: { x: 65, y: 40 } },
      { nom: "Régulateur pression", ref: "Bosch 0 281 002 507", prix: "125 €", dispo: true, pos: { x: 70, y: 65 } },
    ],
  },
  batterie: {
    coupleSerrage: [
      { piece: "Cosse batterie +", valeur: "6 Nm", outil: "Clé 10mm" },
      { piece: "Cosse batterie -", valeur: "6 Nm", outil: "Clé 10mm" },
      { piece: "Support batterie", valeur: "10 Nm", outil: "Douille 13mm" },
    ],
    tempsBaremes: [
      { operation: "Remplacement batterie", temps: "0.3h", difficulte: "Facile" },
      { operation: "Nettoyage cosses", temps: "0.2h", difficulte: "Facile", outilSpecial: "Brosse cosses" },
      { operation: "Test batterie + alternateur", temps: "0.3h", difficulte: "Facile", outilSpecial: "Testeur batterie digital" },
    ],
    pieces: [
      { nom: "Batterie 12V 70Ah", ref: "Varta E11 (574 012)", prix: "145 €", dispo: true, pos: { x: 50, y: 50 } },
      { nom: "Cosse batterie +", ref: "PSA 5642 RJ", prix: "18 €", dispo: true, pos: { x: 35, y: 30 } },
      { nom: "Câble masse", ref: "PSA 5640 JL", prix: "25 €", dispo: true, pos: { x: 65, y: 30 } },
      { nom: "Support batterie", ref: "PSA 5636 01", prix: "12 €", dispo: true, pos: { x: 50, y: 75 } },
    ],
  },
  direction: {
    coupleSerrage: [
      { piece: "Biellette de direction", valeur: "55 Nm", outil: "Clé 18mm + contre-écrou" },
      { piece: "Rotule axiale", valeur: "70 Nm", outil: "Clé à pipe 22mm" },
      { piece: "Rotule de direction", valeur: "50 Nm", outil: "Douille 16mm + extracteur" },
      { piece: "Crémaillère (fixation)", valeur: "90 Nm", outil: "Douille 18mm" },
      { piece: "Pompe DA (fixation)", valeur: "22 Nm", outil: "Douille 13mm" },
      { piece: "Soufflet crémaillère", valeur: "3 Nm", outil: "Collier auto-serrant" },
    ],
    tempsBaremes: [
      { operation: "Biellette direction (1 côté)", temps: "0.7h", difficulte: "Moyen" },
      { operation: "Rotule direction (1 côté)", temps: "1.0h", difficulte: "Moyen", outilSpecial: "Extracteur rotule" },
      { operation: "Crémaillère complète", temps: "3.5h", difficulte: "Expert", outilSpecial: "Vérin + support crémaillère" },
      { operation: "Pompe direction assistée", temps: "1.5h", difficulte: "Avancé" },
      { operation: "Soufflet crémaillère", temps: "1.0h", difficulte: "Moyen" },
      { operation: "Parallélisme (réglage)", temps: "0.5h", difficulte: "Facile", outilSpecial: "Banc de géométrie laser" },
    ],
    pieces: [
      { nom: "Biellette direction G", ref: "TRW JAR1060", prix: "48 €", dispo: true, pos: { x: 20, y: 45 } },
      { nom: "Biellette direction D", ref: "TRW JAR1061", prix: "48 €", dispo: true, pos: { x: 80, y: 45 } },
      { nom: "Rotule direction G", ref: "TRW JBJ777", prix: "42 €", dispo: true, pos: { x: 15, y: 65 } },
      { nom: "Rotule direction D", ref: "TRW JBJ778", prix: "42 €", dispo: true, pos: { x: 85, y: 65 } },
      { nom: "Pompe DA électrique", ref: "TRW JER162", prix: "380 €", dispo: false, pos: { x: 70, y: 25 } },
      { nom: "Soufflet crémaillère", ref: "PSA 4066 56", prix: "15 €", dispo: true, pos: { x: 40, y: 35 } },
    ],
  },
  refroidissement: {
    coupleSerrage: [
      { piece: "Pompe à eau", valeur: "10 Nm", outil: "Douille 10mm" },
      { piece: "Thermostat (boîtier)", valeur: "8 Nm", outil: "Douille Torx T25" },
      { piece: "Ventilateur (fixation)", valeur: "6 Nm", outil: "Douille 8mm" },
      { piece: "Bouchon bocal", valeur: "Manuel", outil: "Main (¼ tour)" },
      { piece: "Calorstat", valeur: "12 Nm", outil: "Douille 10mm" },
      { piece: "Durite (collier)", valeur: "3 Nm", outil: "Tournevis plat / collier auto" },
    ],
    tempsBaremes: [
      { operation: "Pompe à eau", temps: "2.5h", difficulte: "Avancé", outilSpecial: "Kit calage distribution" },
      { operation: "Thermostat / calorstat", temps: "1.0h", difficulte: "Moyen" },
      { operation: "Ventilateur moteur", temps: "0.8h", difficulte: "Facile" },
      { operation: "Radiateur complet", temps: "2.0h", difficulte: "Avancé" },
      { operation: "Purge circuit refroidissement", temps: "0.5h", difficulte: "Facile" },
      { operation: "Durite supérieure", temps: "0.5h", difficulte: "Facile" },
    ],
    pieces: [
      { nom: "Pompe à eau", ref: "SKF VKPC 83649", prix: "89 €", dispo: true, pos: { x: 70, y: 25 } },
      { nom: "Thermostat", ref: "PSA 1336 Z7", prix: "42 €", dispo: true, pos: { x: 80, y: 10 } },
      { nom: "Ventilateur moteur", ref: "PSA 1253 K2", prix: "185 €", dispo: false, pos: { x: 50, y: 25 } },
      { nom: "Bocal expansion", ref: "PSA 1323 F9", prix: "28 €", dispo: true, pos: { x: 15, y: 50 } },
      { nom: "Calorstat complet", ref: "Gates TH43988G1", prix: "55 €", dispo: true, pos: { x: 40, y: 65 } },
      { nom: "Durite supérieure", ref: "PSA 1343 GQ", prix: "32 €", dispo: true, pos: { x: 55, y: 5 } },
    ],
    capacites: [
      { libelle: "Liquide refroidissement", valeur: "6.5 L — Type D (REVKOGEL 2000)" },
      { libelle: "Pression circuit", valeur: "1.4 bar (bouchon)" },
      { libelle: "Température thermostat", valeur: "89°C ouverture / 102°C pleine" },
    ],
  },
  climatisation: {
    coupleSerrage: [
      { piece: "Compresseur (fixation)", valeur: "25 Nm", outil: "Douille 13mm" },
      { piece: "Condenseur", valeur: "8 Nm", outil: "Douille 10mm" },
      { piece: "Raccord réfrigérant", valeur: "15 Nm", outil: "Clé 19mm" },
    ],
    tempsBaremes: [
      { operation: "Recharge climatisation", temps: "0.5h", difficulte: "Facile", outilSpecial: "Station de clim R134a/R1234yf" },
      { operation: "Compresseur de clim", temps: "2.5h", difficulte: "Avancé", outilSpecial: "Station clim + extracteur" },
      { operation: "Condenseur", temps: "2.0h", difficulte: "Avancé" },
      { operation: "Filtre d'habitacle", temps: "0.2h", difficulte: "Facile" },
      { operation: "Évaporateur", temps: "6.0h", difficulte: "Expert", outilSpecial: "Démontage tableau de bord" },
    ],
    pieces: [
      { nom: "Compresseur clim", ref: "Sanden SD7C16 1367", prix: "450 €", dispo: false, pos: { x: 40, y: 40 } },
      { nom: "Condenseur", ref: "Valeo 818 104", prix: "185 €", dispo: true, pos: { x: 50, y: 20 } },
      { nom: "Filtre habitacle", ref: "PSA 1608 058 680", prix: "18 €", dispo: true, pos: { x: 70, y: 60 } },
      { nom: "Détendeur", ref: "Valeo 509 643", prix: "65 €", dispo: true, pos: { x: 60, y: 50 } },
      { nom: "Gaz R1234yf (charge)", ref: "Standard 450g", prix: "85 €", dispo: true, pos: { x: 30, y: 70 } },
    ],
  },
};

// Generate placeholder data for systems without explicit data
function getSystemData(sysId: string): SystemData {
  if (DEMO_DATA[sysId]) return DEMO_DATA[sysId];
  const sys = SYSTEMS_ALL.find(s => s.id === sysId);
  const label = sys?.label || sysId;
  return {
    coupleSerrage: [
      { piece: `${label} — fixation principale`, valeur: "25 Nm", outil: "Clé dynamométrique" },
      { piece: `${label} — fixation secondaire`, valeur: "15 Nm", outil: "Douille Torx T30" },
      { piece: `${label} — raccord`, valeur: "10 Nm", outil: "Douille 10mm" },
    ],
    tempsBaremes: [
      { operation: `Remplacement ${label}`, temps: "2.0h", difficulte: "Moyen" },
      { operation: `Diagnostic ${label}`, temps: "0.5h", difficulte: "Facile", outilSpecial: "Valise diag" },
      { operation: `Réparation ${label}`, temps: "3.0h", difficulte: "Avancé" },
    ],
    pieces: [
      { nom: `${label} complet`, ref: `REF-${sysId.toUpperCase()}-001`, prix: "250 €", dispo: true, pos: { x: 50, y: 40 } },
      { nom: `Joint ${label}`, ref: `REF-${sysId.toUpperCase()}-002`, prix: "18 €", dispo: true, pos: { x: 35, y: 60 } },
      { nom: `Capteur ${label}`, ref: `REF-${sysId.toUpperCase()}-003`, prix: "75 €", dispo: true, pos: { x: 65, y: 55 } },
      { nom: `Support ${label}`, ref: `REF-${sysId.toUpperCase()}-004`, prix: "45 €", dispo: false, pos: { x: 50, y: 75 } },
    ],
  };
}

/* ─── SVG Technical Exploded Diagram (Mode Image) — Style EPC/Autodata ─── */

/* SVG technical drawings per system — pure vector schematics */
function DistributionSVG({ highlight }: { highlight: number | null }) {
  const hl = (n: number) => highlight === n ? "#D4AF37" : "#1a2744";
  const hlW = (n: number) => highlight === n ? 2.5 : 1.2;
  return (
    <svg viewBox="0 0 500 450" className="w-full h-full">
      {/* Pignon arbre a cames (1) */}
      <circle cx="180" cy="80" r="38" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      <circle cx="180" cy="80" r="28" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} strokeDasharray="4,2" />
      <circle cx="180" cy="80" r="8" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      {/* Teeth on sprocket */}
      {Array.from({length:18}).map((_,i)=>{const a=i*20*Math.PI/180;return <line key={i} x1={180+34*Math.cos(a)} y1={80+34*Math.sin(a)} x2={180+40*Math.cos(a)} y2={80+40*Math.sin(a)} stroke={hl(0)} strokeWidth={hlW(0)} />})}
      <text x="180" y="32" textAnchor="middle" className="text-[11px] font-bold" fill="#c0392b">1</text>
      <text x="225" y="55" className="text-[9px]" fill="#555">(100 Nm)</text>

      {/* Galet tendeur (2) */}
      <circle cx="100" cy="200" r="22" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <circle cx="100" cy="200" r="10" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <line x1="100" y1="178" x2="100" y2="160" stroke={hl(1)} strokeWidth={hlW(1)} />
      <rect x="85" y="148" width="30" height="14" rx="3" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <text x="100" y="165" textAnchor="middle" className="text-[11px] font-bold" fill="#c0392b">2</text>
      <text x="135" y="195" className="text-[9px]" fill="#555">(25 Nm)</text>

      {/* Galet enrouleur (3) */}
      <circle cx="115" cy="320" r="20" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="115" cy="320" r="9" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <text x="115" y="355" textAnchor="middle" className="text-[11px] font-bold" fill="#c0392b">3</text>
      <text x="148" y="315" className="text-[9px]" fill="#555">(45 Nm)</text>

      {/* Pignon vilebrequin (4) */}
      <circle cx="200" cy="390" r="30" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      <circle cx="200" cy="390" r="18" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} strokeDasharray="3,2" />
      <circle cx="200" cy="390" r="6" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      {Array.from({length:14}).map((_,i)=>{const a=i*25.7*Math.PI/180;return <line key={i} x1={200+26*Math.cos(a)} y1={390+26*Math.sin(a)} x2={200+32*Math.cos(a)} y2={390+32*Math.sin(a)} stroke={hl(3)} strokeWidth={hlW(3)} />})}
      <text x="200" y="432" textAnchor="middle" className="text-[11px] font-bold" fill="#c0392b">4</text>
      <text x="240" y="410" className="text-[9px]" fill="#555">(20 Nm)</text>

      {/* Galet guide (5) */}
      <circle cx="310" cy="280" r="18" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <circle cx="310" cy="280" r="7" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <text x="340" y="270" className="text-[11px] font-bold" fill="#c0392b">5</text>
      <text x="335" y="300" className="text-[9px]" fill="#555">(40 Nm)</text>

      {/* Support galet (6) */}
      <rect x="280" cy="340" width="50" height="18" rx="4" fill="none" stroke={hl(5)} strokeWidth={hlW(5)} y="340" />
      <line x1="305" y1="340" x2="305" y2="300" stroke={hl(5)} strokeWidth={hlW(5)} strokeDasharray="3,2" />
      <text x="340" y="355" className="text-[11px] font-bold" fill="#c0392b">6</text>

      {/* Pompe a eau (7) */}
      <ellipse cx="55" cy="120" rx="30" ry="22" fill="none" stroke={hl(6)} strokeWidth={hlW(6)} />
      <circle cx="55" cy="120" r="8" fill="none" stroke={hl(6)} strokeWidth={hlW(6)} />
      <line x1="25" y1="120" x2="12" y2="120" stroke={hl(6)} strokeWidth={hlW(6)} />
      <text x="12" y="110" className="text-[11px] font-bold" fill="#c0392b">7</text>

      {/* Joint pompe a eau (8) */}
      <ellipse cx="55" cy="120" rx="34" ry="26" fill="none" stroke={hl(7)} strokeWidth={hlW(7)} strokeDasharray="4,3" />
      <text x="55" y="160" textAnchor="middle" className="text-[11px] font-bold" fill="#c0392b">8</text>

      {/* Joint (9) */}
      <path d="M85,250 Q90,240 100,242" fill="none" stroke={hl(8)} strokeWidth={hlW(8)} />
      <circle cx="85" cy="258" r="10" fill="none" stroke={hl(8)} strokeWidth={hlW(8)} strokeDasharray="2,2" />
      <text x="65" y="262" className="text-[11px] font-bold" fill="#c0392b">9</text>

      {/* Vis M8x25 (10) */}
      <rect x="260" y="170" width="6" height="20" rx="1" fill="none" stroke={hl(9)} strokeWidth={hlW(9)} />
      <rect x="255" y="165" width="16" height="8" rx="2" fill="none" stroke={hl(9)} strokeWidth={hlW(9)} />
      <text x="285" y="180" className="text-[11px] font-bold" fill="#c0392b">10</text>

      {/* Courroie distribution (11) */}
      <path d="M180,118 Q130,160 100,178" fill="none" stroke={hl(10)} strokeWidth={hlW(10) + 1} />
      <path d="M100,222 Q108,280 115,300" fill="none" stroke={hl(10)} strokeWidth={hlW(10) + 1} />
      <path d="M135,330 Q180,360 200,360" fill="none" stroke={hl(10)} strokeWidth={hlW(10) + 1} />
      <path d="M220,380 Q280,350 310,298" fill="none" stroke={hl(10)} strokeWidth={hlW(10) + 1} />
      <path d="M315,262 Q300,180 240,110" fill="none" stroke={hl(10)} strokeWidth={hlW(10) + 1} />
      <text x="280" y="220" className="text-[11px] font-bold" fill="#c0392b">11</text>

      {/* Vis M10x55 (12) */}
      <rect x="140" y="70" width="7" height="25" rx="1" fill="none" stroke={hl(11)} strokeWidth={hlW(11)} />
      <polygon points="137,68 152,68 148,60 141,60" fill="none" stroke={hl(11)} strokeWidth={hlW(11)} />
      <text x="130" y="58" className="text-[11px] font-bold" fill="#c0392b">12</text>
      <line x1="142" y1="65" x2="135" y2="58" stroke="#c0392b" strokeWidth="0.5" />

      {/* Nm annotations with star */}
      <text x="325" y="385" className="text-[9px]" fill="#555">(50 Nm)</text>
      <text x="20" y="95" className="text-[9px]" fill="#555">(25 Nm)</text>
    </svg>
  );
}

function EmbrayageSVG({ highlight }: { highlight: number | null }) {
  const hl = (n: number) => highlight === n ? "#D4AF37" : "#1a2744";
  const hlW = (n: number) => highlight === n ? 2.5 : 1.2;
  return (
    <svg viewBox="0 0 500 450" className="w-full h-full">
      {/* Volant moteur bimasse - grand disque */}
      <circle cx="200" cy="220" r="110" fill="none" stroke="#1a2744" strokeWidth="1.5" />
      <circle cx="200" cy="220" r="95" fill="none" stroke="#1a2744" strokeWidth="0.8" />
      <circle cx="200" cy="220" r="35" fill="none" stroke="#1a2744" strokeWidth="1" />
      {/* Ressorts bimasse */}
      {Array.from({length:6}).map((_,i)=>{const a=i*60*Math.PI/180;return <ellipse key={i} cx={200+70*Math.cos(a)} cy={220+70*Math.sin(a)} rx="12" ry="6" fill="none" stroke="#1a2744" strokeWidth="0.5" transform={`rotate(${i*60},${200+70*Math.cos(a)},${220+70*Math.sin(a)})`} />})}
      {/* Boulons fixation */}
      {Array.from({length:6}).map((_,i)=>{const a=(i*60-30)*Math.PI/180;return <circle key={i} cx={200+28*Math.cos(a)} cy={220+28*Math.sin(a)} r="3.5" fill="none" stroke="#1a2744" strokeWidth="0.6" />})}
      {/* Kit embrayage complet (1) */}
      <circle cx="200" cy="220" r="80" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} strokeDasharray="6,3" />
      <circle cx="85" cy="100" r="11" fill={highlight===0?"#D4AF37":"#c0392b"} />
      <text x="85" y="104" textAnchor="middle" className="text-[10px] font-bold" fill="white">1</text>
      <line x1="96" y1="105" x2="130" y2="150" stroke="#c0392b" strokeWidth="0.8" />
      {/* Volant bimasse (2) */}
      <circle cx="200" cy="220" r="105" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} strokeDasharray="4,2" />
      <circle cx="200" cy="380" r="11" fill={highlight===1?"#D4AF37":"#c0392b"} />
      <text x="200" y="384" textAnchor="middle" className="text-[10px] font-bold" fill="white">2</text>
      <line x1="200" y1="369" x2="200" y2="331" stroke="#c0392b" strokeWidth="0.8" />
      <text x="240" y="395" className="text-[9px]" fill="#555">(60 Nm+60&#xB0;)</text>
      {/* Butee hydraulique (3) */}
      <circle cx="200" cy="220" r="28" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <rect x="188" y="200" width="24" height="10" rx="3" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="55" cy="220" r="11" fill={highlight===2?"#D4AF37":"#c0392b"} />
      <text x="55" y="224" textAnchor="middle" className="text-[10px] font-bold" fill="white">3</text>
      <line x1="66" y1="220" x2="90" y2="220" stroke="#c0392b" strokeWidth="0.8" />
      {/* Disque embrayage (4) - vue eclatee a droite */}
      <ellipse cx="400" cy="130" rx="55" ry="55" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      <ellipse cx="400" cy="130" rx="35" ry="35" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} strokeDasharray="3,2" />
      {/* Garnitures du disque */}
      {Array.from({length:8}).map((_,i)=>{const a=i*45*Math.PI/180;return <line key={i} x1={400+38*Math.cos(a)} y1={130+38*Math.sin(a)} x2={400+52*Math.cos(a)} y2={130+52*Math.sin(a)} stroke={hl(3)} strokeWidth={hlW(3)} />})}
      <circle cx="400" cy="55" r="11" fill={highlight===3?"#D4AF37":"#c0392b"} />
      <text x="400" y="59" textAnchor="middle" className="text-[10px] font-bold" fill="white">4</text>
      <line x1="400" y1="66" x2="400" y2="75" stroke="#c0392b" strokeWidth="0.8" />
      {/* Mecanisme pression (5) - vue eclatee */}
      <ellipse cx="400" cy="320" rx="55" ry="45" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <ellipse cx="400" cy="320" rx="38" ry="30" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      {/* Ressort diaphragme */}
      {Array.from({length:12}).map((_,i)=>{const a=i*30*Math.PI/180;return <line key={i} x1={400+15*Math.cos(a)} y1={320+12*Math.sin(a)} x2={400+34*Math.cos(a)} y2={320+27*Math.sin(a)} stroke={hl(4)} strokeWidth={hlW(4)*0.7} />})}
      <circle cx="470" cy="320" r="11" fill={highlight===4?"#D4AF37":"#c0392b"} />
      <text x="470" y="324" textAnchor="middle" className="text-[10px] font-bold" fill="white">5</text>
      {/* Fleches eclatement */}
      <line x1="310" y1="180" x2="350" y2="150" stroke="#888" strokeWidth="0.6" strokeDasharray="4,3" />
      <line x1="310" y1="260" x2="350" y2="290" stroke="#888" strokeWidth="0.6" strokeDasharray="4,3" />
      <text x="470" y="430" textAnchor="end" className="text-[9px]" fill="#888">Schema EM_001</text>
    </svg>
  );
}

function SuspensionSVG({ highlight }: { highlight: number | null }) {
  const hl = (n: number) => highlight === n ? "#D4AF37" : "#1a2744";
  const hlW = (n: number) => highlight === n ? 2.5 : 1.2;
  return (
    <svg viewBox="0 0 500 450" className="w-full h-full">
      {/* Amortisseur AV complet */}
      {/* Tige */}
      <rect x="195" y="50" width="10" height="120" rx="2" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      {/* Coupelle sup */}
      <ellipse cx="200" cy="45" rx="30" ry="10" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      <rect x="190" y="35" width="20" height="12" rx="3" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      {/* Corps amortisseur */}
      <rect x="180" y="170" width="40" height="130" rx="5" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      <rect x="185" y="175" width="30" height="120" rx="3" fill="none" stroke={hl(0)} strokeWidth="0.6" strokeDasharray="3,2" />
      {/* Ressort helicoidal */}
      {Array.from({length:8}).map((_,i)=><path key={i} d={`M${170},${100+i*15} Q${200},${92+i*15} ${230},${100+i*15}`} fill="none" stroke="#1a2744" strokeWidth="1.8" />)}
      {/* Fixation basse */}
      <circle cx="200" cy="310" r="8" fill="none" stroke="#1a2744" strokeWidth="1" />
      <rect x="185" y="310" width="30" height="20" rx="3" fill="none" stroke="#1a2744" strokeWidth="0.8" />
      {/* Numero 1 */}
      <circle cx="120" cy="55" r="11" fill={highlight===0?"#D4AF37":"#c0392b"} />
      <text x="120" y="59" textAnchor="middle" className="text-[10px] font-bold" fill="white">1</text>
      <line x1="131" y1="55" x2="170" y2="50" stroke="#c0392b" strokeWidth="0.8" />
      <text x="130" y="75" className="text-[9px]" fill="#555">(44 Nm)</text>
      {/* Amortisseur AR (2) - vue reduite */}
      <rect x="380" y="80" width="30" height="100" rx="4" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <rect x="392" y="50" width="6" height="35" rx="1" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <circle cx="395" cy="190" r="6" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <circle cx="440" cy="70" r="11" fill={highlight===1?"#D4AF37":"#c0392b"} />
      <text x="440" y="74" textAnchor="middle" className="text-[10px] font-bold" fill="white">2</text>
      <text x="440" y="90" className="text-[9px]" fill="#555">(65 Nm)</text>
      {/* Bras suspension (3) */}
      <path d="M50,370 L200,340 L200,360 L50,390 Z" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="50" cy="380" r="8" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="200" cy="350" r="6" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="30" cy="350" r="11" fill={highlight===2?"#D4AF37":"#c0392b"} />
      <text x="30" y="354" textAnchor="middle" className="text-[10px] font-bold" fill="white">3</text>
      <text x="100" y="405" className="text-[9px]" fill="#555">(110 Nm)</text>
      {/* Rotule direction (4) */}
      <circle cx="300" cy="370" r="12" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      <rect x="294" y="382" width="12" height="25" rx="2" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      <circle cx="330" cy="400" r="11" fill={highlight===3?"#D4AF37":"#c0392b"} />
      <text x="330" y="404" textAnchor="middle" className="text-[10px] font-bold" fill="white">4</text>
      <text x="330" y="420" className="text-[9px]" fill="#555">(50 Nm)</text>
      {/* Biellette stab (5) */}
      <rect x="380" y="250" width="8" height="80" rx="2" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <circle cx="384" cy="248" r="5" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <circle cx="384" cy="332" r="5" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <circle cx="420" cy="280" r="11" fill={highlight===4?"#D4AF37":"#c0392b"} />
      <text x="420" y="284" textAnchor="middle" className="text-[10px] font-bold" fill="white">5</text>
      <text x="420" y="300" className="text-[9px]" fill="#555">(45 Nm)</text>
      {/* Silent-bloc (6) */}
      <rect x="85" cy="180" width="30" height="18" rx="8" y="410" fill="none" stroke={hl(5)} strokeWidth={hlW(5)} />
      <circle cx="100" cy="419" r="5" fill="none" stroke={hl(5)} strokeWidth={hlW(5)} />
      <circle cx="60" cy="425" r="11" fill={highlight===5?"#D4AF37":"#c0392b"} />
      <text x="60" y="429" textAnchor="middle" className="text-[10px] font-bold" fill="white">6</text>
      <text x="470" y="430" textAnchor="end" className="text-[9px]" fill="#888">Schema SU_001</text>
    </svg>
  );
}

function RefroidissementSVG({ highlight }: { highlight: number | null }) {
  const hl = (n: number) => highlight === n ? "#D4AF37" : "#1a2744";
  const hlW = (n: number) => highlight === n ? 2.5 : 1.2;
  return (
    <svg viewBox="0 0 500 450" className="w-full h-full">
      {/* Radiateur - centre */}
      <rect x="150" y="50" width="200" height="140" rx="6" fill="none" stroke="#1a2744" strokeWidth="1.5" />
      {/* Ailettes radiateur */}
      {Array.from({length:12}).map((_,i)=><line key={i} x1={165+i*15} y1="55" x2={165+i*15} y2="185" stroke="#1a2744" strokeWidth="0.4" />)}
      {/* Durites haut/bas */}
      <path d="M250,50 Q250,30 280,25 L400,25" fill="none" stroke="#1a2744" strokeWidth="1.2" />
      <path d="M250,190 Q250,210 280,215 L400,215" fill="none" stroke="#1a2744" strokeWidth="1.2" />
      {/* Pompe a eau (1) */}
      <ellipse cx="420" cy="120" rx="35" ry="28" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      <circle cx="420" cy="120" r="12" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      {Array.from({length:6}).map((_,i)=>{const a=i*60*Math.PI/180;return <line key={i} x1={420+14*Math.cos(a)} y1={120+11*Math.sin(a)} x2={420+30*Math.cos(a)} y2={120+24*Math.sin(a)} stroke={hl(0)} strokeWidth={hlW(0)*0.7} />})}
      <circle cx="470" cy="85" r="11" fill={highlight===0?"#D4AF37":"#c0392b"} />
      <text x="470" y="89" textAnchor="middle" className="text-[10px] font-bold" fill="white">1</text>
      {/* Thermostat (2) */}
      <circle cx="420" cy="25" r="15" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <path d="M412,17 L428,33" stroke={hl(1)} strokeWidth={hlW(1)} />
      <circle cx="450" cy="45" r="11" fill={highlight===1?"#D4AF37":"#c0392b"} />
      <text x="450" y="49" textAnchor="middle" className="text-[10px] font-bold" fill="white">2</text>
      {/* Ventilateur (3) */}
      <circle cx="250" cy="120" r="50" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} strokeDasharray="5,3" />
      {Array.from({length:5}).map((_,i)=>{const a=i*72*Math.PI/180;return <path key={i} d={`M250,120 Q${250+35*Math.cos(a+0.5)},${120+35*Math.sin(a+0.5)} ${250+45*Math.cos(a)},${120+45*Math.sin(a)}`} fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />})}
      <circle cx="250" cy="120" r="8" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="120" cy="120" r="11" fill={highlight===2?"#D4AF37":"#c0392b"} />
      <text x="120" y="124" textAnchor="middle" className="text-[10px] font-bold" fill="white">3</text>
      {/* Bocal expansion (4) */}
      <rect x="50" y="250" width="40" height="55" rx="5" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      <rect x="62" y="240" width="16" height="12" rx="4" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      <line x1="55" y1="270" x2="85" y2="270" stroke={hl(3)} strokeWidth="0.5" strokeDasharray="2,2" />
      <text x="95" y="285" className="text-[9px]" fill="#555">MIN/MAX</text>
      <circle cx="70" cy="230" r="11" fill={highlight===3?"#D4AF37":"#c0392b"} />
      <text x="70" y="234" textAnchor="middle" className="text-[10px] font-bold" fill="white">4</text>
      {/* Calorstat (5) */}
      <rect x="180" y="320" width="50" height="30" rx="6" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <circle cx="205" cy="335" r="8" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <circle cx="165" cy="350" r="11" fill={highlight===4?"#D4AF37":"#c0392b"} />
      <text x="165" y="354" textAnchor="middle" className="text-[10px] font-bold" fill="white">5</text>
      {/* Durite superieure (6) */}
      <path d="M250,50 C250,30 300,25 350,25" fill="none" stroke={hl(5)} strokeWidth={hlW(5)+1} />
      <circle cx="300" cy="10" r="11" fill={highlight===5?"#D4AF37":"#c0392b"} />
      <text x="300" y="14" textAnchor="middle" className="text-[10px] font-bold" fill="white">6</text>
      {/* Circuit arrows */}
      <polygon points="395,25 405,20 405,30" fill="#1a2744" />
      <polygon points="395,215 405,210 405,220" fill="#1a2744" />
      <text x="470" y="430" textAnchor="end" className="text-[9px]" fill="#888">Schema RE_001</text>
    </svg>
  );
}

function BoiteSVG({ highlight }: { highlight: number | null }) {
  const hl = (n: number) => highlight === n ? "#D4AF37" : "#1a2744";
  const hlW = (n: number) => highlight === n ? 2.5 : 1.2;
  return (
    <svg viewBox="0 0 500 450" className="w-full h-full">
      {/* Carter boite - forme trapezoidale */}
      <path d="M120,100 L380,100 L400,350 L100,350 Z" fill="none" stroke="#1a2744" strokeWidth="1.5" rx="10" />
      <path d="M135,115 L365,115 L383,335 L117,335 Z" fill="none" stroke="#1a2744" strokeWidth="0.6" strokeDasharray="4,3" />
      {/* Arbre primaire */}
      <line x1="250" y1="100" x2="250" y2="70" stroke="#1a2744" strokeWidth="2" />
      <circle cx="250" cy="65" r="8" fill="none" stroke="#1a2744" strokeWidth="1" />
      {/* Arbre secondaire */}
      <line x1="250" y1="350" x2="250" y2="385" stroke="#1a2744" strokeWidth="2" />
      {/* Pignons internes */}
      {[150,200,250,300,350].map((y,i)=><g key={i}><circle cx="200" cy={y} r={12-i} fill="none" stroke="#1a2744" strokeWidth="0.5" /><circle cx="300" cy={y} r={14-i} fill="none" stroke="#1a2744" strokeWidth="0.5" /></g>)}
      {/* Huile BV manuelle (1) */}
      <circle cx="60" cy="340" r="11" fill={highlight===0?"#D4AF37":"#c0392b"} />
      <text x="60" y="344" textAnchor="middle" className="text-[10px] font-bold" fill="white">1</text>
      <line x1="71" y1="340" x2="100" y2="340" stroke="#c0392b" strokeWidth="0.8" />
      {/* Huile BVA (2) */}
      <circle cx="60" cy="280" r="11" fill={highlight===1?"#D4AF37":"#c0392b"} />
      <text x="60" y="284" textAnchor="middle" className="text-[10px] font-bold" fill="white">2</text>
      <line x1="71" y1="280" x2="115" y2="280" stroke="#c0392b" strokeWidth="0.8" />
      {/* Capteur vitesse (3) */}
      <rect x="385" y="180" width="8" height="25" rx="2" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="389" cy="175" r="5" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="430" cy="175" r="11" fill={highlight===2?"#D4AF37":"#c0392b"} />
      <text x="430" y="179" textAnchor="middle" className="text-[10px] font-bold" fill="white">3</text>
      {/* Joint carter (4) */}
      <path d="M120,100 L380,100 L400,350 L100,350 Z" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} strokeDasharray="8,4" />
      <circle cx="430" cy="250" r="11" fill={highlight===3?"#D4AF37":"#c0392b"} />
      <text x="430" y="254" textAnchor="middle" className="text-[10px] font-bold" fill="white">4</text>
      {/* Solenoide (5) */}
      <rect x="320" y="130" width="35" height="18" rx="4" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <line x1="355" y1="139" x2="380" y2="139" stroke={hl(4)} strokeWidth={hlW(4)} />
      <circle cx="430" cy="130" r="11" fill={highlight===4?"#D4AF37":"#c0392b"} />
      <text x="430" y="134" textAnchor="middle" className="text-[10px] font-bold" fill="white">5</text>
      {/* Bouchons remplissage/vidange */}
      <circle cx="115" cy="150" r="6" fill="none" stroke="#1a2744" strokeWidth="0.8" />
      <text x="115" y="138" textAnchor="middle" className="text-[8px]" fill="#888">R</text>
      <circle cx="115" cy="320" r="6" fill="none" stroke="#1a2744" strokeWidth="0.8" />
      <text x="115" y="308" textAnchor="middle" className="text-[8px]" fill="#888">V</text>
      <text x="470" y="430" textAnchor="end" className="text-[9px]" fill="#888">Schema BV_001</text>
    </svg>
  );
}

function DirectionSVG({ highlight }: { highlight: number | null }) {
  const hl = (n: number) => highlight === n ? "#D4AF37" : "#1a2744";
  const hlW = (n: number) => highlight === n ? 2.5 : 1.2;
  return (
    <svg viewBox="0 0 500 450" className="w-full h-full">
      {/* Cremaillere - barre centrale */}
      <rect x="80" y="200" width="340" height="16" rx="4" fill="none" stroke="#1a2744" strokeWidth="1.5" />
      {/* Dents cremaillere */}
      {Array.from({length:20}).map((_,i)=><line key={i} x1={90+i*16} y1="201" x2={90+i*16} y2="215" stroke="#1a2744" strokeWidth="0.4" />)}
      {/* Colonne direction */}
      <rect x="230" y="50" width="16" height="120" rx="3" fill="none" stroke="#1a2744" strokeWidth="1.2" />
      {/* Volant (simplifie) */}
      <circle cx="238" cy="40" r="25" fill="none" stroke="#1a2744" strokeWidth="1.2" />
      <circle cx="238" cy="40" r="8" fill="none" stroke="#1a2744" strokeWidth="0.8" />
      {/* Pignon */}
      <circle cx="238" cy="195" r="14" fill="none" stroke="#1a2744" strokeWidth="1" />
      {Array.from({length:10}).map((_,i)=>{const a=i*36*Math.PI/180;return <line key={i} x1={238+12*Math.cos(a)} y1={195+12*Math.sin(a)} x2={238+16*Math.cos(a)} y2={195+16*Math.sin(a)} stroke="#1a2744" strokeWidth="0.6" />})}
      {/* Biellette G (1) */}
      <rect x="50" y="225" width="100" height="8" rx="2" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      <circle cx="50" cy="229" r="6" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      <circle cx="30" cy="250" r="11" fill={highlight===0?"#D4AF37":"#c0392b"} />
      <text x="30" y="254" textAnchor="middle" className="text-[10px] font-bold" fill="white">1</text>
      {/* Biellette D (2) */}
      <rect x="350" y="225" width="100" height="8" rx="2" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <circle cx="450" cy="229" r="6" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <circle cx="470" cy="250" r="11" fill={highlight===1?"#D4AF37":"#c0392b"} />
      <text x="470" y="254" textAnchor="middle" className="text-[10px] font-bold" fill="white">2</text>
      {/* Rotule G (3) */}
      <circle cx="50" cy="310" r="12" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <rect x="44" y="322" width="12" height="30" rx="2" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="25" cy="340" r="11" fill={highlight===2?"#D4AF37":"#c0392b"} />
      <text x="25" y="344" textAnchor="middle" className="text-[10px] font-bold" fill="white">3</text>
      {/* Rotule D (4) */}
      <circle cx="450" cy="310" r="12" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      <rect x="444" y="322" width="12" height="30" rx="2" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      <circle cx="475" cy="340" r="11" fill={highlight===3?"#D4AF37":"#c0392b"} />
      <text x="475" y="344" textAnchor="middle" className="text-[10px] font-bold" fill="white">4</text>
      {/* Pompe DA (5) */}
      <ellipse cx="380" cy="100" rx="30" ry="22" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <circle cx="380" cy="100" r="8" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <path d="M350,100 L320,150 L320,200" fill="none" stroke="#1a2744" strokeWidth="0.8" strokeDasharray="4,3" />
      <circle cx="420" cy="80" r="11" fill={highlight===4?"#D4AF37":"#c0392b"} />
      <text x="420" y="84" textAnchor="middle" className="text-[10px] font-bold" fill="white">5</text>
      {/* Soufflet (6) */}
      <path d="M140,195 Q145,190 150,195 Q155,200 160,195 Q165,190 170,195" fill="none" stroke={hl(5)} strokeWidth={hlW(5)} />
      <circle cx="155" cy="175" r="11" fill={highlight===5?"#D4AF37":"#c0392b"} />
      <text x="155" y="179" textAnchor="middle" className="text-[10px] font-bold" fill="white">6</text>
      <text x="470" y="430" textAnchor="end" className="text-[9px]" fill="#888">Schema DI_001</text>
    </svg>
  );
}

function GenericSystemSVG({ pieces, highlight, systemId }: { pieces: PieceData[]; highlight: number | null; systemId: string }) {
  const hl = (n: number) => highlight === n ? "#D4AF37" : "#1a2744";
  const hlW = (n: number) => highlight === n ? 2.5 : 1.2;
  const cx = 250, cy = 200;
  const sysLabel = SYSTEMS_ALL.find(s=>s.id===systemId)?.label || systemId;
  return (
    <svg viewBox="0 0 500 450" className="w-full h-full">
      {/* Technical frame */}
      <rect x="10" y="10" width="480" height="420" rx="2" fill="none" stroke="#c8ccd4" strokeWidth="0.5" />
      <line x1="10" y1="30" x2="490" y2="30" stroke="#c8ccd4" strokeWidth="0.3" />
      <text x="20" y="24" className="text-[9px]" fill="#888">{sysLabel} — Vue eclatee</text>
      {/* Central assembly outline */}
      <rect x={cx-90} y={cy-70} width="180" height="140" rx="10" fill="none" stroke="#1a2744" strokeWidth="1.8" />
      <rect x={cx-80} y={cy-60} width="160" height="120" rx="7" fill="none" stroke="#1a2744" strokeWidth="0.8" strokeDasharray="5,3" />
      {/* Cross-section lines */}
      <line x1={cx-80} y1={cy} x2={cx+80} y2={cy} stroke="#1a2744" strokeWidth="0.3" strokeDasharray="8,4" />
      <line x1={cx} y1={cy-60} x2={cx} y2={cy+60} stroke="#1a2744" strokeWidth="0.3" strokeDasharray="8,4" />
      {/* Component mounting points */}
      {[{x:cx-80,y:cy-60},{x:cx+80,y:cy-60},{x:cx-80,y:cy+60},{x:cx+80,y:cy+60}].map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill="none" stroke="#1a2744" strokeWidth="0.6" />)}
      {/* Internal detail lines */}
      <ellipse cx={cx} cy={cy} rx="40" ry="25" fill="none" stroke="#1a2744" strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r="10" fill="none" stroke="#1a2744" strokeWidth="0.5" />
      {/* Parts arranged around with proper leader lines */}
      {pieces.map((p, i) => {
        const cols = Math.min(pieces.length, 4);
        const row = Math.floor(i / cols);
        const col = i % cols;
        const isTop = row === 0;
        const isLeft = col < cols / 2;
        const px = isLeft ? 40 + col * 80 : 320 + (col - Math.floor(cols/2)) * 80;
        const py = isTop ? 360 + row * 35 : 360 + row * 35;
        const startX = isLeft ? cx - 70 + col * 40 : cx + col * 20;
        const startY = cy + 60 + 10;
        return (
          <g key={i}>
            {/* Leader line from assembly to callout */}
            <line x1={startX} y1={startY} x2={px} y2={py-8} stroke={hl(i)} strokeWidth="0.6" strokeDasharray="3,2" />
            {/* Part callout box */}
            <rect x={px-28} y={py-8} width="56" height="20" rx="3" fill="none" stroke={hl(i)} strokeWidth={hlW(i)} />
            {/* Number circle */}
            <circle cx={px-35} cy={py+2} r="9" fill={highlight === i ? "#D4AF37" : "#c0392b"} />
            <text x={px-35} y={py+6} textAnchor="middle" className="text-[9px] font-bold" fill="white">{i + 1}</text>
            {/* Part name abbreviated */}
            <text x={px} y={py+5} textAnchor="middle" className="text-[7px]" fill="#1a2744">{p.nom.slice(0,12)}</text>
          </g>
        );
      })}
      <text x={cx} y={cy+5} textAnchor="middle" className="text-[11px] font-bold" fill="#1a2744">{sysLabel}</text>
      <text x="470" y="440" textAnchor="end" className="text-[9px]" fill="#888">Schema {systemId.slice(0,2).toUpperCase()}_001</text>
    </svg>
  );
}

function MoteurSVG({ highlight }: { highlight: number | null }) {
  const hl = (n: number) => highlight === n ? "#D4AF37" : "#1a2744";
  const hlW = (n: number) => highlight === n ? 2.5 : 1.2;
  return (
    <svg viewBox="0 0 500 450" className="w-full h-full">
      {/* Engine block outline */}
      <rect x="120" y="80" width="260" height="280" rx="10" fill="none" stroke="#1a2744" strokeWidth="1.8" />
      <rect x="135" y="95" width="230" height="250" rx="6" fill="none" stroke="#1a2744" strokeWidth="0.8" strokeDasharray="5,3" />

      {/* Culasse (1) */}
      <rect x="140" y="90" width="220" height="40" rx="4" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      <line x1="180" y1="90" x2="180" y2="130" stroke={hl(0)} strokeWidth={hlW(0)} strokeDasharray="2,2" />
      <line x1="250" y1="90" x2="250" y2="130" stroke={hl(0)} strokeWidth={hlW(0)} strokeDasharray="2,2" />
      <line x1="320" y1="90" x2="320" y2="130" stroke={hl(0)} strokeWidth={hlW(0)} strokeDasharray="2,2" />
      <circle cx="125" cy="70" r="11" fill={highlight===0?"#D4AF37":"#c0392b"} />
      <text x="125" y="74" textAnchor="middle" className="text-[10px] font-bold" fill="white">1</text>
      <line x1="135" y1="75" x2="150" y2="90" stroke="#c0392b" strokeWidth="0.8" />

      {/* Bougie (2) */}
      <rect x="195" y="55" width="6" height="40" rx="2" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <circle cx="198" cy="50" r="5" fill="none" stroke={hl(1)} strokeWidth={hlW(1)} />
      <circle cx="170" cy="40" r="11" fill={highlight===1?"#D4AF37":"#c0392b"} />
      <text x="170" y="44" textAnchor="middle" className="text-[10px] font-bold" fill="white">2</text>
      <line x1="180" y1="44" x2="193" y2="50" stroke="#c0392b" strokeWidth="0.8" />

      {/* Injecteur (3) */}
      <rect x="280" y="60" width="5" height="35" rx="1" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <rect x="275" y="55" width="15" height="8" rx="2" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} />
      <circle cx="320" cy="48" r="11" fill={highlight===2?"#D4AF37":"#c0392b"} />
      <text x="320" y="52" textAnchor="middle" className="text-[10px] font-bold" fill="white">3</text>
      <line x1="310" y1="52" x2="290" y2="58" stroke="#c0392b" strokeWidth="0.8" />

      {/* Bobine (4) */}
      <rect x="220" y="40" width="14" height="22" rx="3" fill="none" stroke={hl(3)} strokeWidth={hlW(3)} />
      <line x1="227" y1="62" x2="227" y2="90" stroke={hl(3)} strokeWidth={hlW(3)} strokeDasharray="2,2" />
      <circle cx="248" cy="35" r="11" fill={highlight===3?"#D4AF37":"#c0392b"} />
      <text x="248" y="39" textAnchor="middle" className="text-[10px] font-bold" fill="white">4</text>

      {/* Filtre huile (5) */}
      <ellipse cx="400" cy="280" rx="25" ry="15" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <line x1="380" y1="280" x2="350" y2="280" stroke={hl(4)} strokeWidth={hlW(4)} strokeDasharray="3,2" />
      <circle cx="430" cy="262" r="11" fill={highlight===4?"#D4AF37":"#c0392b"} />
      <text x="430" y="266" textAnchor="middle" className="text-[10px] font-bold" fill="white">5</text>

      {/* Filtre air (6) */}
      <rect x="395" y="120" width="55" height="30" rx="8" fill="none" stroke={hl(5)} strokeWidth={hlW(5)} />
      <line x1="395" y1="135" x2="375" y2="135" stroke={hl(5)} strokeWidth={hlW(5)} strokeDasharray="3,2" />
      <circle cx="460" cy="115" r="11" fill={highlight===5?"#D4AF37":"#c0392b"} />
      <text x="460" y="119" textAnchor="middle" className="text-[10px] font-bold" fill="white">6</text>

      {/* Kit distribution (7) */}
      <circle cx="80" cy="200" r="25" fill="none" stroke={hl(6)} strokeWidth={hlW(6)} />
      <circle cx="80" cy="200" r="12" fill="none" stroke={hl(6)} strokeWidth={hlW(6)} strokeDasharray="3,2" />
      <circle cx="42" cy="180" r="11" fill={highlight===6?"#D4AF37":"#c0392b"} />
      <text x="42" y="184" textAnchor="middle" className="text-[10px] font-bold" fill="white">7</text>

      {/* Pompe eau (8) */}
      <ellipse cx="80" cy="290" rx="22" ry="16" fill="none" stroke={hl(7)} strokeWidth={hlW(7)} />
      <circle cx="42" cy="300" r="11" fill={highlight===7?"#D4AF37":"#c0392b"} />
      <text x="42" y="304" textAnchor="middle" className="text-[10px] font-bold" fill="white">8</text>

      {/* Thermostat (9) */}
      <circle cx="250" cy="340" r="15" fill="none" stroke={hl(8)} strokeWidth={hlW(8)} />
      <path d="M242,332 L258,348" stroke={hl(8)} strokeWidth={hlW(8)} />
      <circle cx="250" cy="375" r="11" fill={highlight===8?"#D4AF37":"#c0392b"} />
      <text x="250" y="379" textAnchor="middle" className="text-[10px] font-bold" fill="white">9</text>

      {/* Turbo (10) */}
      <circle cx="50" cy="140" r="20" fill="none" stroke={hl(9)} strokeWidth={hlW(9)} />
      <path d="M35,128 C40,140 60,140 65,128" fill="none" stroke={hl(9)} strokeWidth={hlW(9)} />
      <circle cx="22" cy="125" r="11" fill={highlight===9?"#D4AF37":"#c0392b"} />
      <text x="22" y="129" textAnchor="middle" className="text-[10px] font-bold" fill="white">10</text>

      {/* Joint culasse (11) */}
      <line x1="145" y1="130" x2="355" y2="130" stroke={hl(10)} strokeWidth={hlW(10)+0.5} strokeDasharray="6,2" />
      <circle cx="395" cy="130" r="11" fill={highlight===10?"#D4AF37":"#c0392b"} />
      <text x="395" y="134" textAnchor="middle" className="text-[10px] font-bold" fill="white">11</text>

      {/* Capteur PMH (12) */}
      <rect x="350" y="220" width="8" height="20" rx="2" fill="none" stroke={hl(11)} strokeWidth={hlW(11)} />
      <circle cx="358" cy="215" r="4" fill="none" stroke={hl(11)} strokeWidth={hlW(11)} />
      <circle cx="395" cy="210" r="11" fill={highlight===11?"#D4AF37":"#c0392b"} />
      <text x="395" y="214" textAnchor="middle" className="text-[10px] font-bold" fill="white">12</text>

      {/* Courroie accessoire (13) */}
      <path d="M100,225 Q90,260 80,280" fill="none" stroke={hl(12)} strokeWidth={hlW(12)+0.5} />
      <circle cx="62" cy="240" r="11" fill={highlight===12?"#D4AF37":"#c0392b"} />
      <text x="62" y="244" textAnchor="middle" className="text-[10px] font-bold" fill="white">13</text>

      {/* Galet tendeur (14) */}
      <circle cx="95" cy="350" r="14" fill="none" stroke={hl(13)} strokeWidth={hlW(13)} />
      <circle cx="95" cy="350" r="5" fill="none" stroke={hl(13)} strokeWidth={hlW(13)} />
      <circle cx="62" cy="365" r="11" fill={highlight===13?"#D4AF37":"#c0392b"} />
      <text x="62" y="369" textAnchor="middle" className="text-[10px] font-bold" fill="white">14</text>

      {/* Sonde lambda (15) */}
      <rect x="370" y="330" width="7" height="30" rx="2" fill="none" stroke={hl(14)} strokeWidth={hlW(14)} />
      <circle cx="373" cy="325" r="5" fill="none" stroke={hl(14)} strokeWidth={hlW(14)} />
      <circle cx="410" cy="345" r="11" fill={highlight===14?"#D4AF37":"#c0392b"} />
      <text x="410" y="349" textAnchor="middle" className="text-[10px] font-bold" fill="white">15</text>

      {/* Carter huile bottom */}
      <path d="M150,360 L350,360 L340,400 L160,400 Z" fill="none" stroke="#1a2744" strokeWidth="1.2" />

      {/* Pistons inside block */}
      {[180,250,320].map((x,i)=>(
        <g key={i}>
          <rect x={x-15} y="160" width="30" height="50" rx="3" fill="none" stroke="#1a2744" strokeWidth="0.6" />
          <line x1={x-12} y1="170" x2={x+12} y2="170" stroke="#1a2744" strokeWidth="0.4" />
          <line x1={x-12} y1="175" x2={x+12} y2="175" stroke="#1a2744" strokeWidth="0.4" />
          <line x1={x} y1="210" x2={x} y2="300" stroke="#1a2744" strokeWidth="0.5" />
        </g>
      ))}

      {/* Schéma reference number */}
      <text x="470" y="430" textAnchor="end" className="text-[9px]" fill="#888">Schéma 10_001</text>
    </svg>
  );
}

function FreinageSVG({ highlight }: { highlight: number | null }) {
  const hl = (n: number) => highlight === n ? "#D4AF37" : "#1a2744";
  const hlW = (n: number) => highlight === n ? 2.5 : 1.2;
  return (
    <svg viewBox="0 0 500 450" className="w-full h-full">
      {/* Disque frein (grand cercle) */}
      <circle cx="200" cy="225" r="120" fill="none" stroke="#1a2744" strokeWidth="1.5" />
      <circle cx="200" cy="225" r="100" fill="none" stroke="#1a2744" strokeWidth="0.8" />
      <circle cx="200" cy="225" r="40" fill="none" stroke="#1a2744" strokeWidth="1" />
      {/* Ventilation holes */}
      {Array.from({length:8}).map((_,i)=>{const a=i*45*Math.PI/180;return <circle key={i} cx={200+65*Math.cos(a)} cy={225+65*Math.sin(a)} r="6" fill="none" stroke="#1a2744" strokeWidth="0.5" />})}
      {/* Bolts */}
      {Array.from({length:5}).map((_,i)=>{const a=(i*72-90)*Math.PI/180;return <circle key={i} cx={200+30*Math.cos(a)} cy={225+30*Math.sin(a)} r="3" fill="none" stroke="#1a2744" strokeWidth="0.6" />})}

      {/* Plaquettes AV (1) */}
      <path d="M305,180 Q330,225 305,270" fill="none" stroke={hl(0)} strokeWidth={hlW(0)+1} />
      <path d="M315,185 Q338,225 315,265" fill="none" stroke={hl(0)} strokeWidth={hlW(0)} />
      <circle cx="360" cy="170" r="11" fill={highlight===0?"#D4AF37":"#c0392b"} />
      <text x="360" y="174" textAnchor="middle" className="text-[10px] font-bold" fill="white">1</text>
      <line x1="349" y1="175" x2="320" y2="190" stroke="#c0392b" strokeWidth="0.8" />

      {/* Plaquettes AR (2) */}
      <path d="M95,185 Q70,225 95,265" fill="none" stroke={hl(1)} strokeWidth={hlW(1)+1} />
      <circle cx="45" cy="175" r="11" fill={highlight===1?"#D4AF37":"#c0392b"} />
      <text x="45" y="179" textAnchor="middle" className="text-[10px] font-bold" fill="white">2</text>

      {/* Disque AV (3) */}
      <circle cx="200" cy="225" r="115" fill="none" stroke={hl(2)} strokeWidth={hlW(2)} strokeDasharray="5,3" />
      <circle cx="200" cy="85" r="11" fill={highlight===2?"#D4AF37":"#c0392b"} />
      <text x="200" y="89" textAnchor="middle" className="text-[10px] font-bold" fill="white">3</text>
      <line x1="200" y1="96" x2="200" y2="110" stroke="#c0392b" strokeWidth="0.8" />

      {/* Disque AR (4) */}
      <circle cx="200" cy="380" r="11" fill={highlight===3?"#D4AF37":"#c0392b"} />
      <text x="200" y="384" textAnchor="middle" className="text-[10px] font-bold" fill="white">4</text>
      <line x1="200" y1="369" x2="200" y2="345" stroke="#c0392b" strokeWidth="0.8" />

      {/* Liquide frein (5) */}
      <rect x="400" y="300" width="35" height="50" rx="5" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <rect x="408" y="292" width="19" height="10" rx="3" fill="none" stroke={hl(4)} strokeWidth={hlW(4)} />
      <circle cx="417" cy="275" r="11" fill={highlight===4?"#D4AF37":"#c0392b"} />
      <text x="417" y="279" textAnchor="middle" className="text-[10px] font-bold" fill="white">5</text>

      {/* Flexible (6) */}
      <path d="M320,225 C350,225 380,260 400,300" fill="none" stroke={hl(5)} strokeWidth={hlW(5)} />
      <circle cx="370" cy="240" r="11" fill={highlight===5?"#D4AF37":"#c0392b"} />
      <text x="370" y="244" textAnchor="middle" className="text-[10px] font-bold" fill="white">6</text>

      {/* Etrier AV (7) */}
      <rect x="310" y="195" width="30" height="60" rx="5" fill="none" stroke={hl(6)} strokeWidth={hlW(6)} />
      <rect x="315" y="200" width="20" height="50" rx="3" fill="none" stroke={hl(6)} strokeWidth={hlW(6)} strokeDasharray="3,2" />
      <circle cx="375" cy="220" r="11" fill={highlight===6?"#D4AF37":"#c0392b"} />
      <text x="375" y="224" textAnchor="middle" className="text-[10px] font-bold" fill="white">7</text>

      <text x="470" y="430" textAnchor="end" className="text-[9px]" fill="#888">Schéma 40_001</text>
    </svg>
  );
}

function getSystemSVG(systemId: string, pieces: PieceData[], highlight: number | null) {
  switch (systemId) {
    case "distribution": return <DistributionSVG highlight={highlight} />;
    case "moteur": return <MoteurSVG highlight={highlight} />;
    case "freinage": return <FreinageSVG highlight={highlight} />;
    case "embrayage": return <EmbrayageSVG highlight={highlight} />;
    case "suspension": return <SuspensionSVG highlight={highlight} />;
    case "boite": return <BoiteSVG highlight={highlight} />;
    case "refroidissement": return <RefroidissementSVG highlight={highlight} />;
    case "direction": return <DirectionSVG highlight={highlight} />;
    default: return <GenericSystemSVG pieces={pieces} highlight={highlight} systemId={systemId} />;
  }
}

function ExplodedDiagram({ pieces, systemLabel, systemId, selectedPiece, onSelect, coupleSerrage }: { pieces: PieceData[]; systemLabel: string; systemId: string; selectedPiece: number | null; onSelect: (i: number) => void; coupleSerrage?: { piece: string; valeur: string; outil: string }[] }) {
  const [zoom, setZoom] = useState(1);
  const selectedP = selectedPiece !== null ? pieces[selectedPiece] : null;
  const schemaNum = systemId === "distribution" ? "11_1056" : systemId === "moteur" ? "10_001" : systemId === "freinage" ? "40_001" : `${systemId.slice(0,2).toUpperCase()}_001`;

  return (
    <div className="rounded-xl bg-white border border-[#c8ccd4] overflow-hidden shadow-sm">
      {/* Top bar — Autodata style */}
      <div className="bg-[#1a2744] px-4 py-2 flex items-center justify-between">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5"><ImageIcon size={12} className="text-[#D4AF37]" /> {systemLabel}</h3>
        <span className="text-[10px] text-white/50">Schema {schemaNum}</span>
      </div>

      {/* Main layout: SVG diagram (left) + Parts table (right) */}
      <div className="flex flex-col lg:flex-row">
        {/* SVG Diagram */}
        <div className="lg:w-[55%] border-r border-[#c8ccd4] bg-[#f8f9fb]">
          <div className="relative overflow-auto" style={{ maxHeight: "480px" }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", minHeight: "380px" }}>
              {getSystemSVG(systemId, pieces, selectedPiece)}
            </div>
          </div>
          {/* Zoom controls — bottom of diagram */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-t border-[#c8ccd4] bg-white">
            <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="h-7 w-7 rounded border border-[#c8ccd4] bg-white text-sm font-bold text-[#1a2744] flex items-center justify-center hover:bg-slate-50">+</button>
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="h-7 w-7 rounded border border-[#c8ccd4] bg-white text-sm font-bold text-[#1a2744] flex items-center justify-center hover:bg-slate-50">−</button>
            <button onClick={() => setZoom(1)} className="h-7 w-7 rounded border border-[#c8ccd4] bg-white text-[10px] font-bold text-[#1a2744] flex items-center justify-center hover:bg-slate-50">↻</button>
            <span className="text-[10px] text-slate-400 ml-1">{Math.round(zoom * 100)}%</span>
            <span className="text-[9px] text-slate-300 ml-auto">* Nm : Couple de serrage</span>
          </div>
        </div>

        {/* Parts table — right side */}
        <div className="lg:w-[45%] flex flex-col">
          <div className="bg-[#e8ecf1] px-3 py-2 border-b border-[#c8ccd4]">
            <h4 className="text-[11px] font-bold text-[#1a2744]">{systemLabel}</h4>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: "380px" }}>
            <table className="w-full text-xs">
              <thead className="bg-[#e8ecf1] sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left text-[10px] font-bold text-[#1a2744] border-b border-[#c8ccd4]">N°</th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-bold text-[#1a2744] border-b border-[#c8ccd4]">Reference</th>
                  <th className="px-2 py-1.5 text-left text-[10px] font-bold text-[#1a2744] border-b border-[#c8ccd4]">Designation</th>
                  <th className="px-2 py-1.5 text-right text-[10px] font-bold text-[#1a2744] border-b border-[#c8ccd4]">Qte</th>
                </tr>
              </thead>
              <tbody>
                {pieces.map((p, i) => (
                  <tr
                    key={i}
                    onClick={() => onSelect(i)}
                    className={`cursor-pointer border-b border-[#e8ecf1] transition ${selectedPiece === i ? "bg-[#D4AF37]/15" : "hover:bg-[#f0f2f5]"}`}
                  >
                    <td className="px-2 py-2">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${selectedPiece === i ? "bg-[#D4AF37] text-white" : "bg-[#c0392b] text-white"}`}>{i + 1}</span>
                    </td>
                    <td className="px-2 py-2 font-mono text-[10px] text-[#1a2744]">{p.ref}</td>
                    <td className="px-2 py-2 text-[11px] text-[#333]">{p.nom}</td>
                    <td className="px-2 py-2 text-right text-[11px] font-bold text-[#1a2744]">1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected piece detail panel — bottom (like Autodata "DETAIL DE LA PIECE SELECTIONNEE") */}
      {selectedP && (
        <div className="border-t-2 border-[#1a2744]">
          <div className="bg-[#e8ecf1] px-4 py-1.5">
            <span className="text-[10px] font-bold text-[#1a2744] uppercase tracking-wide">Detail de la piece selectionnee</span>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 bg-white">
            {/* Part illustration placeholder */}
            <div className="shrink-0 h-16 w-16 rounded-lg bg-[#f0f2f5] border border-[#c8ccd4] flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <circle cx="20" cy="20" r="14" fill="none" stroke="#1a2744" strokeWidth="1.5" />
                <circle cx="20" cy="20" r="6" fill="none" stroke="#1a2744" strokeWidth="1" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#c0392b] text-[10px] font-bold text-white">{(selectedPiece ?? 0) + 1}</span>
                <span className="text-xs font-bold text-[#1a2744] font-mono">{selectedP.ref}</span>
              </div>
              <p className="text-sm font-bold text-[#333]">{selectedP.nom}</p>
              {coupleSerrage && (() => {
                const cs = coupleSerrage.find(c => selectedP.nom.toLowerCase().includes(c.piece.toLowerCase().split(" ")[0]) || c.piece.toLowerCase().includes(selectedP.nom.toLowerCase().split(" ")[0]));
                return cs ? <p className="text-[10px] text-slate-500 mt-0.5">Couple : {cs.valeur} — {cs.outil}</p> : null;
              })()}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-400 uppercase">Prix indicatif</p>
              <p className="text-lg font-black text-[#1a2744]">{selectedP.prix} <span className="text-[10px] font-normal text-slate-400">HT</span></p>
              <p className={`text-[10px] font-bold mt-0.5 ${selectedP.dispo ? "text-green-600" : "text-red-500"}`}>
                {selectedP.dispo ? "● En stock" : "○ Sur commande"}
              </p>
              <button className="mt-1.5 rounded bg-[#c0392b] px-3 py-1 text-[10px] font-bold text-white hover:bg-[#a93226] transition">Ajouter au panier</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer — vehicle info bar */}
      <div className="bg-[#f0f2f5] border-t border-[#c8ccd4] px-4 py-2 flex flex-wrap items-center gap-4 text-[9px] text-[#1a2744]">
        <span className="flex items-center gap-1"><Fuel size={10} /> <b>Carburant</b></span>
        <span className="flex items-center gap-1"><Settings size={10} /> <b>Cylindree</b></span>
        <span className="flex items-center gap-1"><Gauge size={10} /> <b>Puissance</b></span>
        <span className="flex items-center gap-1"><Cog size={10} /> <b>Code moteur</b></span>
        <span className="ml-auto text-[8px] text-[#D4AF37] font-bold">MKA.P-MS AutoData V.2027</span>
      </div>
    </div>
  );
}

export default function CatalogueTechnique() {
  const [plaque, setPlaque] = useState("");
  const [found, setFound] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>("Mecanique");
  const [selectedSystem, setSelectedSystem] = useState("moteur");
  const [viewMode, setViewMode] = useState<"texte" | "image">("texte");
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>("accueil");
  const [vehicle, setVehicle] = useState<VehicleInfo>(DEFAULT_VEHICLE);
  const [isDemoVehicle, setIsDemoVehicle] = useState(false);
  const [isAbonne, setIsAbonne] = useState(true);

  const doSearch = () => {
    if (plaque.trim().length >= 3) {
      const { vehicle: v, isDemo } = lookupVehicle(plaque);
      setVehicle(v);
      setIsDemoVehicle(isDemo);
      setFound(true);
      setOpenCat("Mecanique");
      setSelectedSystem("moteur");
      setActiveTab("vehicule");
    }
  };
  const data = getSystemData(selectedSystem);
  const currentSys = SYSTEMS_ALL.find(s => s.id === selectedSystem);

  const handleCatClick = (cat: string) => {
    if (openCat === cat) { setOpenCat(null); return; }
    setOpenCat(cat);
    const firstSys = SYSTEMS_ALL.find(s => s.cat === cat);
    if (firstSys) { setSelectedSystem(firstSys.id); setSelectedPiece(null); }
  };

  const handleSysClick = (sysId: string) => {
    setSelectedSystem(sysId);
    setSelectedPiece(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/atelier-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Atelier Pro</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2"><Search size={20} className="text-[#D4AF37]" /> Catalogue Technique</h1>
            <p className="mt-0.5 text-sm text-white/60">MKA.P-MS AutoData — Version 2027</p>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[9px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-1 rounded-full">V.2027</span>
            <button onClick={() => setIsAbonne(!isAbonne)} className={`block ml-auto mt-1 text-[8px] font-bold px-2 py-0.5 rounded-full ${isAbonne ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
              {isAbonne ? "Mode Admin" : "Mode Client"}
            </button>
          </div>
        </div>
      </div>

      {!isAbonne && (
        <div className="px-4 mt-4">
          <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] border border-[#D4AF37]/30 p-6 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-4">
              <Shield size={32} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">AutoData Premium</h3>
            <p className="text-sm text-white/60 mb-4">Acces reserve aux abonnes Atelier Pro + AutoData</p>
            <div className="space-y-2 text-left max-w-sm mx-auto mb-4">
              {["Schemas eclates interactifs", "Donnees techniques completes", "Couples de serrage", "Temps baremes", "References pieces constructeur"].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-white/70">
                  <CheckCircle size={12} className="text-[#D4AF37]" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <Link to="/compte" className="inline-block rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white">Souscrire a l'abonnement AutoData</Link>
            <p className="mt-3 text-[10px] text-white/40">A partir de 49 EUR/mois — Essai gratuit 7 jours</p>
          </div>
        </div>
      )}

      {isAbonne && <>
      {/* Recherche */}
      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <p className="text-xs text-slate-500 mb-3">Recherche par plaque d'immatriculation ou numéro VIN</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <span className="text-[9px] font-bold text-white bg-blue-600 px-1 rounded">F</span>
              </div>
              <input
                type="text"
                value={plaque}
                onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                placeholder="AB-123-CD ou VF3MCYHZRML..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F5F3EF] pl-10 pr-3 py-3 text-sm font-bold text-center tracking-widest uppercase"
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
              />
            </div>
            <button onClick={doSearch} className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-white"><Search size={16} /></button>
          </div>
        </div>
      </div>

      {found && (
        <div className="px-4 mt-3 space-y-3">
          {/* ═══ PRO NAVIGATION BAR ═══ */}
          <div className="rounded-xl bg-[#1a2744] overflow-hidden">
            <div className="flex items-center overflow-x-auto scrollbar-hide">
              {NAV_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition ${isActive ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]" : "text-white/60 border-transparent hover:text-white hover:bg-white/5"}`}
                  >
                    <Icon size={13} /> {tab.label}
                  </button>
                );
              })}
              <div className="ml-auto pr-3 flex items-center gap-1 shrink-0">
                <span className="text-[9px] text-white/30 font-mono">{vehicle.marque} {vehicle.modele}</span>
              </div>
            </div>
          </div>

          {/* ═══ VEHICLE IDENTIFICATION CARD ═══ */}
          {(activeTab === "accueil" || activeTab === "vehicule") && (
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className={isDemoVehicle ? "text-amber-400" : "text-green-400"} />
                <span className={`text-sm font-bold ${isDemoVehicle ? "text-amber-400" : "text-green-400"}`}>{isDemoVehicle ? "Mode Demo — Utilisez: AB-123-CD, EF-456-GH, IJ-789-KL, MN-012-OP" : "Vehicule identifie automatiquement"}</span>
                <span className="ml-auto text-[9px] text-white/30 font-mono">{plaque}</span>
              </div>
              {isDemoVehicle && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 mb-3 text-[10px] text-amber-300">
                  API SIV/TecDoc non connectee — les donnees affichees sont celles du vehicule de demonstration. Pour les vraies donnees, l&apos;API payante sera activee prochainement.
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {([
                  ["Marque", vehicle.marque], ["Modèle", vehicle.modele], ["Version", vehicle.version],
                  ["Année", vehicle.annee], ["Code moteur", vehicle.codeMoteur], ["Cylindrée", vehicle.cylindree],
                  ["Puissance", vehicle.puissance], ["Couple max", vehicle.coupleMax], ["Norme", vehicle.norme],
                  ["Transmission", vehicle.transmission], ["Architecture", vehicle.architecture], ["Injection", vehicle.injection],
                  ["Poids à vide", vehicle.poids], ["PTAC", vehicle.ptac], ["Dimensions", vehicle.dimensions],
                  ["Empattement", vehicle.empattement], ["Réservoir", vehicle.reservoir], ["Carburant", vehicle.carburant],
                  ...(vehicle.extra ? [["Info", vehicle.extra]] : []),
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">{l}</span>
                    <span className="font-bold text-white text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ TAB: DONNÉES TECHNIQUES ═══ */}
          {activeTab === "donnees" && (
            <div className="space-y-3">
              {/* Specs moteur */}
              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#1a2744] px-4 py-2">
                  <h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5"><Info size={12} /> Spécifications moteur — {vehicle.marque} {vehicle.modele}</h3>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {([
                    ["Code moteur", vehicle.codeMoteur, Cog], ["Cylindrée", vehicle.cylindree, Settings],
                    ["Architecture", vehicle.architecture, Cog], ["Puissance", vehicle.puissance, Gauge],
                    ["Couple max", vehicle.coupleMax, Wrench], ["Injection", vehicle.injection, Fuel],
                    ["Norme antipollution", vehicle.norme, Shield], ["Transmission", vehicle.transmission, Settings],
                  ] as [string, string, React.ElementType][]).map(([label, val, Icon]) => (
                    <div key={label} className="rounded-lg bg-[#f8f9fb] border border-[#e8ecf1] p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={11} className="text-[#1a2744]" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold">{label}</span>
                      </div>
                      <p className="text-xs font-bold text-[#1a2744]">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Couples de serrage principaux */}
              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#1a2744] px-4 py-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5"><Wrench size={12} /> Couples de serrage — tous systèmes</h3>
                  <button className="text-[10px] text-white/40 flex items-center gap-1"><Download size={10} /> PDF</button>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#e8ecf1] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Système</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Pièce</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Couple</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Outil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["moteur", "distribution", "freinage", "embrayage", "suspension"].map(sysId => {
                        const sysData = getSystemData(sysId);
                        const sysLabel = SYSTEMS_ALL.find(s => s.id === sysId)?.label || sysId;
                        return sysData.coupleSerrage.slice(0, 4).map((c, ci) => (
                          <tr key={`${sysId}-${ci}`} className="border-b border-[#e8ecf1] hover:bg-[#f0f2f5]">
                            {ci === 0 && <td className="px-3 py-1.5 font-bold text-[#1a2744]" rowSpan={Math.min(4, sysData.coupleSerrage.length)}>{sysLabel}</td>}
                            <td className="px-3 py-1.5 text-slate-600">{c.piece}</td>
                            <td className="px-3 py-1.5 font-bold text-[#c0392b]">{c.valeur}</td>
                            <td className="px-3 py-1.5 text-slate-400">{c.outil}</td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Intervalles de maintenance */}
              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#1a2744] px-4 py-2">
                  <h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5"><Clock size={12} /> Intervalles de maintenance</h3>
                </div>
                <div className="p-3">
                  <table className="w-full text-xs">
                    <thead className="bg-[#e8ecf1]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Opération</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Intervalle km</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Intervalle temps</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Coût estimé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Vidange moteur + filtre", "15 000 km", "12 mois", "80 — 120 €"],
                        ["Filtre à air", "30 000 km", "24 mois", "20 — 40 €"],
                        ["Filtre habitacle", "15 000 km", "12 mois", "15 — 30 €"],
                        ["Plaquettes frein AV", "30 000 km", "Selon usure", "120 — 200 €"],
                        ["Disques frein AV", "60 000 km", "Selon usure", "200 — 350 €"],
                        ["Courroie distribution", "120 000 km", "6 ans", "500 — 900 €"],
                        ["Courroie accessoire", "80 000 km", "4 ans", "100 — 180 €"],
                        ["Liquide de frein", "40 000 km", "24 mois", "50 — 80 €"],
                        ["Bougies allumage", "60 000 km", "4 ans", "40 — 80 €"],
                        ["Liquide refroidissement", "120 000 km", "5 ans", "60 — 100 €"],
                        ["Huile boîte manuelle", "100 000 km", "—", "40 — 70 €"],
                        ["Vidange BVA (si auto)", "60 000 km", "4 ans", "200 — 400 €"],
                      ].map(([op, km, temps, cout], i) => (
                        <tr key={i} className="border-b border-[#e8ecf1] hover:bg-[#f0f2f5]">
                          <td className="px-3 py-2 text-slate-700 font-medium">{op}</td>
                          <td className="px-3 py-2 font-bold text-[#1a2744]">{km}</td>
                          <td className="px-3 py-2 text-slate-500">{temps}</td>
                          <td className="px-3 py-2 font-bold text-[#D4AF37]">{cout}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Capacités fluides */}
              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#1a2744] px-4 py-2">
                  <h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5"><Fuel size={12} /> Capacités fluides & lubrifiants</h3>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    ["Huile moteur", "4.25 L", "0W-30 (ACEA C2/C3)", "#2ecc71"],
                    ["Liquide refroidissement", "6.5 L", "Type D (REVKOGEL)", "#3498db"],
                    ["Huile boîte manuelle", "1.9 L", "75W-80 (API GL-4+)", "#e67e22"],
                    ["Huile BVA (si EAT8)", "7.0 L", "ATF Esso LT 71141", "#9b59b6"],
                    ["Liquide de frein", "0.5 L", "DOT 4 ESP", "#e74c3c"],
                    ["Liquide direction", "1.0 L", "ATF Dexron III", "#f39c12"],
                    ["Réfrigérant clim", "450 g", "R1234yf", "#1abc9c"],
                    ["Lave-glace", "3.5 L", "Hiver -20°C", "#34495e"],
                  ].map(([label, qte, spec, color], i) => (
                    <div key={i} className="rounded-lg border border-[#e8ecf1] p-3 flex items-center gap-3 hover:bg-[#f8f9fb] transition">
                      <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center" style={{ background: `${color}20` }}>
                        <Fuel size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-[#1a2744]">{label}</p>
                        <p className="text-[9px] text-slate-400">{spec}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-[#1a2744]">{qte}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: TEMPS BARÉMÉS ═══ */}
          {activeTab === "temps" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#1a2744] px-4 py-2">
                  <h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5"><Clock size={12} /> Temps barémés — {vehicle.marque} {vehicle.modele}</h3>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#e8ecf1] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Système</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Opération</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Temps</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Difficulté</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-[#1a2744]">Outil spécial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["moteur", "distribution", "embrayage", "boite", "freinage", "suspension", "injection", "climatisation", "batterie"].map(sysId => {
                        const sysData = getSystemData(sysId);
                        const sysLabel = SYSTEMS_ALL.find(s => s.id === sysId)?.label || sysId;
                        return sysData.tempsBaremes.map((t, ti) => (
                          <tr key={`${sysId}-${ti}`} className="border-b border-[#e8ecf1] hover:bg-[#f0f2f5]">
                            {ti === 0 && <td className="px-3 py-1.5 font-bold text-[#1a2744]" rowSpan={sysData.tempsBaremes.length}>{sysLabel}</td>}
                            <td className="px-3 py-1.5 text-slate-600">{t.operation}</td>
                            <td className="px-3 py-1.5 font-bold text-[#1a2744]">{t.temps}</td>
                            <td className="px-3 py-1.5"><span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${t.difficulte === "Expert" ? "bg-red-50 text-red-600" : t.difficulte === "Avancé" ? "bg-orange-50 text-orange-600" : t.difficulte === "Moyen" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{t.difficulte}</span></td>
                            <td className="px-3 py-1.5 text-slate-400">{t.outilSpecial || "—"}</td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: PIÈCES (grid vue) ═══ */}
          {activeTab === "pieces" && (
            <div className="space-y-3">
              {/* System selector for pieces */}
              <div className="flex flex-wrap gap-1.5">
                {SYSTEMS_ALL.filter(s => DEMO_DATA[s.id]).map(s => {
                  const Icon = s.icon;
                  return (
                    <button key={s.id} onClick={() => { setSelectedSystem(s.id); setSelectedPiece(null); }}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${selectedSystem === s.id ? "bg-[#D4AF37] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-slate-50"}`}
                    >
                      <Icon size={10} className={selectedSystem === s.id ? "text-white" : s.color} /> {s.label}
                    </button>
                  );
                })}
              </div>
              {/* Pieces grid */}
              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#1a2744] px-4 py-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5"><ShoppingCart size={12} /> Pièces — {currentSys?.label}</h3>
                  <span className="text-[9px] text-white/40">{data.pieces.length} références</span>
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {data.pieces.map((p, i) => (
                    <button key={i} onClick={() => setSelectedPiece(selectedPiece === i ? null : i)} className={`rounded-lg border p-2.5 text-left transition hover:shadow-md ${selectedPiece === i ? "border-[#D4AF37] bg-[#D4AF37]/5 ring-1 ring-[#D4AF37]" : p.dispo ? "border-green-200 bg-green-50/30 hover:border-green-400" : "border-red-200 bg-red-50/30 hover:border-red-400"}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#c0392b] text-[9px] font-bold text-white">{i + 1}</span>
                        <p className="text-[10px] font-bold text-[#111] leading-tight flex-1">{p.nom}</p>
                      </div>
                      <p className="text-[8px] text-slate-400 truncate font-mono">{p.ref}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#D4AF37]">{p.prix}</span>
                        <span className={`text-[8px] font-bold ${p.dispo ? "text-green-600" : "text-red-500"}`}>{p.dispo ? "En stock" : "Cmd"}</span>
                      </div>
                      {selectedPiece === i && (
                        <div className="mt-2 pt-2 border-t border-[#E5E7EB] space-y-1">
                          <p className="text-[9px] text-slate-500">Réf: {p.ref}</p>
                          <button className="w-full rounded-lg bg-[#c0392b] py-1.5 text-[9px] font-bold text-white hover:bg-[#a93226] transition flex items-center justify-center gap-1"><ShoppingCart size={10} /> Ajouter au panier</button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB: SCHÉMAS / ACCUEIL / VÉHICULE — show accordion + diagram ═══ */}
          {(activeTab === "schemas" || activeTab === "accueil" || activeTab === "vehicule") && (<>

          {/* Toggle mode Texte / Image */}
          {(activeTab === "schemas" || activeTab === "vehicule") && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111]">Mode d'affichage :</span>
              <div className="flex rounded-xl border border-[#E5E7EB] overflow-hidden">
                <button onClick={() => setViewMode("texte")} className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold transition ${viewMode === "texte" ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280]"}`}>
                  <List size={10} /> Texte
                </button>
                <button onClick={() => setViewMode("image")} className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold transition ${viewMode === "image" ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280]"}`}>
                  <ImageIcon size={10} /> Image
                </button>
              </div>
            </div>
          )}

          {/* Accordéons catégories */}
          <div className="space-y-2">
            {CATEGORIES_SYS.map(cat => {
              const isOpen = openCat === cat;
              const systems = SYSTEMS_ALL.filter(s => s.cat === cat);
              return (
                <div key={cat} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => handleCatClick(cat)}
                    className={`w-full px-4 py-3 flex items-center justify-between transition ${isOpen ? "bg-[#111]" : "bg-white hover:bg-slate-50"}`}
                  >
                    <span className={`text-sm font-bold ${isOpen ? "text-[#D4AF37]" : "text-[#111]"}`}>{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] ${isOpen ? "text-white/50" : "text-slate-400"}`}>{systems.length} systèmes</span>
                      {isOpen ? <ChevronDown size={14} className="text-[#D4AF37]" /> : <ChevronRight size={14} className="text-slate-400" />}
                    </div>
                  </button>

                  {/* Systems list (accordion open) */}
                  {isOpen && (
                    <div className="border-t border-[#E5E7EB] p-2">
                      <div className="flex flex-wrap gap-1.5">
                        {systems.map(s => {
                          const Icon = s.icon;
                          const isActive = selectedSystem === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => handleSysClick(s.id)}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${isActive ? "bg-[#D4AF37] text-white shadow-md" : "bg-[#F5F3EF] text-[#6B7280] hover:bg-[#E5E7EB]"}`}
                            >
                              <Icon size={12} className={isActive ? "text-white" : s.color} /> {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected system name */}
          {currentSys && (
            <div className="flex items-center gap-2 px-1">
              <currentSys.icon size={16} className={currentSys.color} />
              <h2 className="text-base font-black text-[#111]">{currentSys.label}</h2>
              <span className="text-[9px] text-slate-400 ml-auto">{currentSys.cat}</span>
            </div>
          )}

          {/* MODE IMAGE — Schéma éclaté technique (style Autodata/EPC) */}
          {viewMode === "image" && (
            <ExplodedDiagram
              pieces={data.pieces}
              systemLabel={currentSys?.label || ""}
              systemId={selectedSystem}
              selectedPiece={selectedPiece}
              onSelect={(i) => setSelectedPiece(selectedPiece === i ? null : i)}
              coupleSerrage={data.coupleSerrage}
            />
          )}

          {/* MODE TEXTE — Données détaillées */}
          {viewMode === "texte" && (
            <>
              {/* Capacités (si dispo) */}
              {data.capacites && (
                <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <div className="bg-[#111] px-3 py-2">
                    <h3 className="text-xs font-bold text-[#D4AF37]">Capacités & spécifications</h3>
                  </div>
                  <div className="p-3 space-y-1">
                    {data.capacites.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-0">
                        <span className="text-xs text-slate-500">{c.libelle}</span>
                        <span className="text-xs font-bold text-[#111]">{c.valeur}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Couples de serrage */}
              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#111] px-3 py-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#D4AF37]">Couples de serrage</h3>
                  <button className="text-[10px] text-white/40 flex items-center gap-1"><Download size={10} /> PDF</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F5F3EF]">
                      <tr><th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Pièce</th><th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Valeur</th><th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Outil</th></tr>
                    </thead>
                    <tbody>
                      {data.coupleSerrage.map((c, i) => (
                        <tr key={i} className="border-b border-[#F3F4F6] hover:bg-slate-50 cursor-pointer">
                          <td className="px-3 py-2 text-slate-600">{c.piece}</td>
                          <td className="px-3 py-2 font-bold text-[#111]">{c.valeur}</td>
                          <td className="px-3 py-2 text-slate-400">{c.outil}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Temps barémés */}
              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#111] px-3 py-2">
                  <h3 className="text-xs font-bold text-[#D4AF37]">Temps barémés & outils spéciaux</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F5F3EF]">
                      <tr>
                        <th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Opération</th>
                        <th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Temps</th>
                        <th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Niveau</th>
                        <th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Outil spécial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tempsBaremes.map((t, i) => (
                        <tr key={i} className="border-b border-[#F3F4F6] hover:bg-slate-50 cursor-pointer">
                          <td className="px-3 py-2 text-slate-600">{t.operation}</td>
                          <td className="px-3 py-2 font-bold text-[#111]">{t.temps}</td>
                          <td className="px-3 py-2"><span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${t.difficulte === "Expert" ? "bg-red-50 text-red-600" : t.difficulte === "Avancé" ? "bg-orange-50 text-orange-600" : t.difficulte === "Moyen" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{t.difficulte}</span></td>
                          <td className="px-3 py-2 text-slate-400">{t.outilSpecial || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pièces — grille cliquable */}
              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#111] px-3 py-2">
                  <h3 className="text-xs font-bold text-[#D4AF37]">Pièces — cliquez pour commander</h3>
                </div>
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {data.pieces.map((p, i) => (
                    <button key={i} onClick={() => setSelectedPiece(selectedPiece === i ? null : i)} className={`rounded-lg border p-2.5 text-left transition hover:shadow-md ${selectedPiece === i ? "border-[#D4AF37] bg-[#D4AF37]/5 ring-1 ring-[#D4AF37]" : p.dispo ? "border-green-200 bg-green-50/30 hover:border-green-400" : "border-red-200 bg-red-50/30 hover:border-red-400"}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-600">{i + 1}</span>
                        <p className="text-[10px] font-bold text-[#111] leading-tight flex-1">{p.nom}</p>
                      </div>
                      <p className="text-[8px] text-slate-400 truncate">{p.ref}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#D4AF37]">{p.prix}</span>
                        <span className={`text-[8px] font-bold ${p.dispo ? "text-green-600" : "text-red-500"}`}>{p.dispo ? "En stock" : "Cmd"}</span>
                      </div>
                      {selectedPiece === i && (
                        <div className="mt-2 pt-2 border-t border-[#E5E7EB]">
                          <button className="w-full rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Commander cette pièce</button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          </>)}

          {/* ═══ BOTTOM VEHICLE INFO BAR ═══ */}
          <div className="rounded-xl bg-[#1a2744] px-4 py-2.5 flex flex-wrap items-center gap-4 text-[9px] text-white/80">
            <span className="flex items-center gap-1"><Car size={10} className="text-[#D4AF37]" /> <b>{vehicle.marque}</b> {vehicle.modele}</span>
            <span className="flex items-center gap-1"><Fuel size={10} /> {vehicle.carburant}</span>
            <span className="flex items-center gap-1"><Settings size={10} /> {vehicle.cylindree}</span>
            <span className="flex items-center gap-1"><Gauge size={10} /> {vehicle.puissance}</span>
            <span className="flex items-center gap-1"><Cog size={10} /> {vehicle.codeMoteur}</span>
            <span className="ml-auto text-[8px] text-[#D4AF37] font-bold">MKA.P-MS AutoData V.2027</span>
          </div>
        </div>
      )}

      {!found && (
        <div className="px-4 mt-8 space-y-4">
          <div className="text-center">
            <Car size={48} className="mx-auto text-[#D4AF37] opacity-30" />
            <h2 className="mt-4 text-lg font-bold text-[#111]">Catalogue Technique MKA.P-MS 2027</h2>
            <p className="mt-2 text-sm text-[#6B7280] max-w-sm mx-auto">Entrez la plaque ou le VIN de n'importe quel véhicule. Le catalogue charge automatiquement toutes les informations techniques, couples de serrage, temps barémés et références pièces.</p>
          </div>

          {/* Test plates */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-xs font-bold text-[#111] mb-2">Plaques de test disponibles :</h3>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["AB-123-CD", "BMW X5 3.0d xDrive"],
                ["EF-456-GH", "Peugeot 308 GTi"],
                ["IJ-789-KL", "Mercedes Classe C 220d"],
                ["MN-012-OP", "Renault Mégane RS Trophy"],
              ] as [string, string][]).map(([p, desc]) => (
                <button key={p} onClick={() => { setPlaque(p); const { vehicle: v } = lookupVehicle(p); setVehicle(v); setIsDemoVehicle(false); setFound(true); setOpenCat("Mecanique"); setSelectedSystem("moteur"); setActiveTab("vehicule"); }}
                  className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-left hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition"
                >
                  <span className="shrink-0 text-[10px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded font-mono">{p}</span>
                  <span className="text-[10px] text-slate-600 font-medium">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-xs">
            {["Tous véhicules", "Anciens & récents", "Motos & quads", "Utilitaires & camions", "26 systèmes", "Outils spéciaux", "Mode texte", "Mode image (schémas)"].map((t) => (
              <div key={t} className="flex items-center gap-1 rounded-lg bg-white border border-[#E5E7EB] px-3 py-2">
                <CheckCircle size={12} className="text-green-500" />
                <span className="text-[#111] font-semibold">{t}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="rounded-xl bg-[#111] px-4 py-2 inline-flex items-center gap-2">
              <Eye size={14} className="text-[#D4AF37]" />
              <span className="text-xs text-white/80">6 onglets : <b className="text-[#D4AF37]">Véhicule · Pièces · Données tech · Schémas · Temps</b></span>
            </div>
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
