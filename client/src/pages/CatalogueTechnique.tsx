import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Search, Car, CheckCircle, Cog, Settings,
  Disc, Thermometer, Wind, Fuel, Gauge, Zap, Shield,
  CircuitBoard, Battery, Lightbulb, LifeBuoy,
  ChevronDown, ChevronRight, Download, Eye, List, Image as ImageIcon
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CATALOGUE TECHNIQUE MKA.P-MS — Version 2027
   Type AutoData — Recherche plaque/VIN. Tous véhicules, tous systèmes.
   Accordéons par catégorie. Mode Texte + Mode Image (schémas éclatés).
   ══════════════════════════════════════════════════════════════════════════ */

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

/* ─── SVG Exploded Diagram (Mode Image) ─── */
const SYSTEM_IMAGES: Record<string, string> = {
  moteur: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop",
  distribution: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop",
  embrayage: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
  boite: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=800&h=600&fit=crop",
  freinage: "https://images.unsplash.com/photo-1558618047-f4b511e3e5e2?w=800&h=600&fit=crop",
  direction: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  suspension: "https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=800&h=600&fit=crop",
  refroidissement: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&h=600&fit=crop",
  echappement: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800&h=600&fit=crop",
  alimentation: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
  turbo: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop",
  injection: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop",
  allumage: "https://images.unsplash.com/photo-1558618047-f4b511e3e5e2?w=800&h=600&fit=crop",
  abs_esp: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
  airbags: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  climatisation: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&h=600&fit=crop",
  tableau_bord: "https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=800&h=600&fit=crop",
  capteurs: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop",
  calculateurs: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=800&h=600&fit=crop",
  multiplexage: "https://images.unsplash.com/photo-1558618047-f4b511e3e5e2?w=800&h=600&fit=crop",
  diagnostic: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop",
  batterie: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop",
  alternateur: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
  demarreur: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=800&h=600&fit=crop",
  eclairage: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800&h=600&fit=crop",
  fusibles: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&h=600&fit=crop",
  cablage: "https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=800&h=600&fit=crop",
  dimensions: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  poids: "https://images.unsplash.com/photo-1558618047-f4b511e3e5e2?w=800&h=600&fit=crop",
  vitrage: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800&h=600&fit=crop",
  ouvrants: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
};

function ExplodedDiagram({ pieces, systemLabel, systemId, selectedPiece, onSelect }: { pieces: PieceData[]; systemLabel: string; systemId: string; selectedPiece: number | null; onSelect: (i: number) => void }) {
  const [zoom, setZoom] = useState(1);
  const imgSrc = SYSTEM_IMAGES[systemId] || SYSTEM_IMAGES.moteur;

  return (
    <div className="rounded-xl bg-white border-2 border-[#D4AF37]/30 overflow-hidden">
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-3 py-2 flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5"><ImageIcon size={12} /> Schéma éclaté — {systemLabel}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="h-5 w-5 rounded bg-white/10 text-white text-xs font-bold flex items-center justify-center hover:bg-white/20">−</button>
          <span className="text-[9px] text-white/60">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="h-5 w-5 rounded bg-white/10 text-white text-xs font-bold flex items-center justify-center hover:bg-white/20">+</button>
          <button onClick={() => setZoom(1)} className="text-[8px] text-white/40 hover:text-white/80 ml-1">Reset</button>
        </div>
      </div>
      <div className="relative overflow-auto" style={{ maxHeight: "400px" }}>
        <div className="relative min-h-[350px]" style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}>
          {/* Background image of the system */}
          <img src={imgSrc} alt={`Schéma ${systemLabel}`} className="w-full h-[350px] object-cover" />

          {/* SVG overlay for leader lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {pieces.map((p, i) => {
              const posX = p.pos?.x ?? (20 + (i * 15) % 70);
              const posY = p.pos?.y ?? (20 + (i * 12) % 65);
              return (
                <line key={i} x1="50" y1="50" x2={posX} y2={posY} stroke="#D4AF37" strokeWidth="0.15" strokeDasharray="0.5,0.5" opacity="0.4" />
              );
            })}
          </svg>

          {/* Parts with numbered positions */}
          {pieces.map((p, i) => {
            const isSelected = selectedPiece === i;
            const posX = p.pos?.x ?? (20 + (i * 15) % 70);
            const posY = p.pos?.y ?? (20 + (i * 12) % 65);
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                className={`absolute transition-all duration-200 z-10 group ${isSelected ? "scale-125 z-20" : "hover:scale-110"}`}
                style={{ left: `${posX}%`, top: `${posY}%`, transform: "translate(-50%, -50%)" }}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black border-2 shadow-lg ${isSelected ? "bg-[#D4AF37] text-white border-[#D4AF37] ring-4 ring-[#D4AF37]/30" : p.dispo ? "bg-white text-[#111] border-green-400 group-hover:border-[#D4AF37]" : "bg-white text-[#111] border-red-400 group-hover:border-[#D4AF37]"}`}>
                  {i + 1}
                </div>
                {isSelected && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-9 bg-[#111] text-white rounded-lg px-2.5 py-2 shadow-xl min-w-[160px] z-30 border border-[#D4AF37]/30">
                    <p className="text-[10px] font-bold text-[#D4AF37]">{p.nom}</p>
                    <p className="text-[8px] text-white/60 mt-0.5">{p.ref}</p>
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/10">
                      <span className="text-[10px] font-bold text-white">{p.prix}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${p.dispo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{p.dispo ? "En stock" : "Commande"}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 bg-[#F5F3EF] border-t border-[#E5E7EB]">
        <div className="flex items-center gap-3 text-[8px]">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border-2 border-green-400"></span> En stock</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border-2 border-red-400"></span> Sur commande</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]"></span> Sélectionné</span>
          <span className="ml-auto text-slate-400">Utilisez +/− pour zoomer · Cliquez un numéro</span>
        </div>
      </div>

      {/* Parts list under diagram */}
      <div className="border-t border-[#E5E7EB] max-h-[200px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#F5F3EF] sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left text-[9px] text-slate-500">N°</th>
              <th className="px-2 py-1.5 text-left text-[9px] text-slate-500">Pièce</th>
              <th className="px-2 py-1.5 text-left text-[9px] text-slate-500">Réf. constructeur</th>
              <th className="px-2 py-1.5 text-left text-[9px] text-slate-500">Prix</th>
              <th className="px-2 py-1.5 text-left text-[9px] text-slate-500">Dispo</th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((p, i) => (
              <tr key={i} onClick={() => onSelect(i)} className={`cursor-pointer border-b border-[#F3F4F6] transition ${selectedPiece === i ? "bg-[#D4AF37]/10" : "hover:bg-slate-50"}`}>
                <td className="px-2 py-1.5"><span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${selectedPiece === i ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-600"}`}>{i + 1}</span></td>
                <td className="px-2 py-1.5 font-medium text-[#111]">{p.nom}</td>
                <td className="px-2 py-1.5 text-slate-400 font-mono text-[9px]">{p.ref}</td>
                <td className="px-2 py-1.5 font-bold text-[#D4AF37]">{p.prix}</td>
                <td className="px-2 py-1.5"><span className={`text-[9px] font-bold ${p.dispo ? "text-green-600" : "text-red-500"}`}>{p.dispo ? "Stock" : "Cmd"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
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

  const doSearch = () => { if (plaque.trim().length >= 3) { setFound(true); setOpenCat("Mecanique"); setSelectedSystem("moteur"); } };
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
          <div className="text-right">
            <span className="text-[9px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-1 rounded-full">V.2027</span>
          </div>
        </div>
      </div>

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
          {/* Véhicule identifié */}
          <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm font-bold text-green-400">Véhicule identifié automatiquement</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {[
                ["Marque", "Peugeot"], ["Modèle", "3008 GT"], ["Version", "1.6 PureTech 225 Hybrid4 EAT8"],
                ["Année", "2024"], ["Code moteur", "EP6FADTX"], ["Cylindrée", "1 598 cm³"],
                ["Puissance", "225 ch / 165 kW"], ["Couple max", "300 Nm à 3 000 tr/min"], ["Norme", "Euro 6d-ISC-FCM"],
                ["Transmission", "BVA 8 rapports EAT8"], ["Architecture", "4 cylindres en ligne"], ["Injection", "Directe haute pression"],
                ["Poids à vide", "1 880 kg"], ["PTAC", "2 280 kg"], ["Dimensions", "4 447 x 1 841 x 1 620 mm"],
                ["Empattement", "2 675 mm"], ["Réservoir", "53 litres"], ["Batterie hybride", "13.2 kWh"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/40">{l}</span>
                  <span className="font-bold text-white text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Toggle mode Texte / Image */}
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

          {/* MODE IMAGE — Schéma éclaté */}
          {viewMode === "image" && (
            <ExplodedDiagram
              pieces={data.pieces}
              systemLabel={currentSys?.label || ""}
              systemId={selectedSystem}
              selectedPiece={selectedPiece}
              onSelect={(i) => setSelectedPiece(selectedPiece === i ? null : i)}
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
        </div>
      )}

      {!found && (
        <div className="px-4 mt-12 text-center">
          <Car size={48} className="mx-auto text-[#D4AF37] opacity-30" />
          <h2 className="mt-4 text-lg font-bold text-[#111]">Catalogue Technique MKA.P-MS 2027</h2>
          <p className="mt-2 text-sm text-[#6B7280] max-w-sm mx-auto">Entrez la plaque ou le VIN de n'importe quel véhicule. Le catalogue charge automatiquement toutes les informations techniques, couples de serrage, temps barémés et références pièces.</p>
          <div className="mt-6 grid grid-cols-2 gap-2 max-w-xs mx-auto text-xs">
            {["Tous véhicules", "Anciens & récents", "Motos & quads", "Utilitaires & camions", "26 systèmes", "Outils spéciaux", "Mode texte", "Mode image (schémas)"].map((t) => (
              <div key={t} className="flex items-center gap-1 rounded-lg bg-white border border-[#E5E7EB] px-3 py-2">
                <CheckCircle size={12} className="text-green-500" />
                <span className="text-[#111] font-semibold">{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-[#111] px-4 py-2 inline-flex items-center gap-2">
            <Eye size={14} className="text-[#D4AF37]" />
            <span className="text-xs text-white/80">2 modes : <b className="text-[#D4AF37]">Texte</b> (données techniques) + <b className="text-[#D4AF37]">Image</b> (schémas éclatés numérotés)</span>
          </div>
        </div>
      )}
    </div>
  );
}
