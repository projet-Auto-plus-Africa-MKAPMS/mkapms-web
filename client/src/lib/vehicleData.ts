/**
 * MKA.P-MS — Base de données complète des véhicules
 *
 * Marques → Modèles → Versions avec caractéristiques techniques.
 * Auto-remplissage dans le formulaire de dépôt d'annonce.
 */

export interface VersionSpec {
  name: string;
  puissanceCv?: number;
  cylindree?: string;
  consommation?: string;
}

export interface ModelData {
  versions: VersionSpec[];
}

export type VehicleDatabase = Record<string, Record<string, ModelData>>;

/* ── Base de données véhicules ── */
export const VEHICLE_DB: VehicleDatabase = {
  /* ════════════════ PEUGEOT ════════════════ */
  Peugeot: {
    "108": { versions: [
      { name: "Active", puissanceCv: 72, cylindree: "999 cm³", consommation: "4.1 L/100km" },
      { name: "Allure", puissanceCv: 72, cylindree: "999 cm³", consommation: "4.1 L/100km" },
      { name: "Style", puissanceCv: 72, cylindree: "999 cm³", consommation: "4.1 L/100km" },
      { name: "Collection", puissanceCv: 72, cylindree: "999 cm³", consommation: "4.1 L/100km" },
    ]},
    "208": { versions: [
      { name: "Active", puissanceCv: 75, cylindree: "1199 cm³", consommation: "4.8 L/100km" },
      { name: "Active Pack", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.0 L/100km" },
      { name: "Allure", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.0 L/100km" },
      { name: "Allure Pack", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.2 L/100km" },
      { name: "GT", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.4 L/100km" },
      { name: "GT Pack", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.4 L/100km" },
      { name: "e-208 Active", puissanceCv: 136, cylindree: "Électrique", consommation: "15.8 kWh/100km" },
      { name: "e-208 Allure", puissanceCv: 136, cylindree: "Électrique", consommation: "15.8 kWh/100km" },
      { name: "e-208 GT", puissanceCv: 156, cylindree: "Électrique", consommation: "15.5 kWh/100km" },
    ]},
    "2008": { versions: [
      { name: "Active", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.4 L/100km" },
      { name: "Active Pack", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.6 L/100km" },
      { name: "Allure", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.6 L/100km" },
      { name: "Allure Pack", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.6 L/100km" },
      { name: "GT", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.8 L/100km" },
      { name: "GT Pack", puissanceCv: 155, cylindree: "1499 cm³", consommation: "4.1 L/100km" },
      { name: "e-2008 Active", puissanceCv: 136, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
      { name: "e-2008 Allure", puissanceCv: 136, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
      { name: "e-2008 GT", puissanceCv: 156, cylindree: "Électrique", consommation: "16.5 kWh/100km" },
    ]},
    "308": { versions: [
      { name: "Active", puissanceCv: 110, cylindree: "1199 cm³", consommation: "5.3 L/100km" },
      { name: "Active Pack", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" },
      { name: "Allure", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" },
      { name: "Allure Pack", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.0 L/100km" },
      { name: "GT", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.7 L/100km" },
      { name: "GT Pack", puissanceCv: 180, cylindree: "1598 cm³", consommation: "5.9 L/100km" },
      { name: "308 Hybrid 180", puissanceCv: 180, cylindree: "1598 cm³", consommation: "1.2 L/100km" },
      { name: "308 Hybrid 225", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.1 L/100km" },
    ]},
    "308 SW": { versions: [
      { name: "Active", puissanceCv: 110, cylindree: "1199 cm³", consommation: "5.4 L/100km" },
      { name: "Allure", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.6 L/100km" },
      { name: "GT", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.8 L/100km" },
      { name: "GT Pack", puissanceCv: 180, cylindree: "1598 cm³", consommation: "6.0 L/100km" },
    ]},
    "408": { versions: [
      { name: "Allure", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.6 L/100km" },
      { name: "Allure Pack", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.6 L/100km" },
      { name: "GT", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.8 L/100km" },
      { name: "GT Pack", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.4 L/100km" },
    ]},
    "508": { versions: [
      { name: "Active", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.2 L/100km" },
      { name: "Allure", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.2 L/100km" },
      { name: "Allure Pack", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.2 L/100km" },
      { name: "GT", puissanceCv: 180, cylindree: "1997 cm³", consommation: "4.6 L/100km" },
      { name: "GT Pack", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.3 L/100km" },
      { name: "PSE", puissanceCv: 360, cylindree: "1598 cm³", consommation: "2.0 L/100km" },
    ]},
    "508 SW": { versions: [
      { name: "Allure", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.3 L/100km" },
      { name: "GT", puissanceCv: 180, cylindree: "1997 cm³", consommation: "4.8 L/100km" },
      { name: "GT Pack", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.4 L/100km" },
    ]},
    "3008": { versions: [
      { name: "Active", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.9 L/100km" },
      { name: "Active Pack", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.9 L/100km" },
      { name: "Allure", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.9 L/100km" },
      { name: "Allure Pack", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.5 L/100km" },
      { name: "GT", puissanceCv: 180, cylindree: "1598 cm³", consommation: "6.2 L/100km" },
      { name: "GT Pack", puissanceCv: 180, cylindree: "1598 cm³", consommation: "6.2 L/100km" },
      { name: "GT Hybrid 225", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.4 L/100km" },
      { name: "GT Hybrid4 300", puissanceCv: 300, cylindree: "1598 cm³", consommation: "1.5 L/100km" },
    ]},
    "5008": { versions: [
      { name: "Active", puissanceCv: 130, cylindree: "1199 cm³", consommation: "6.0 L/100km" },
      { name: "Allure", puissanceCv: 130, cylindree: "1199 cm³", consommation: "6.0 L/100km" },
      { name: "Allure Pack", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.6 L/100km" },
      { name: "GT", puissanceCv: 180, cylindree: "1598 cm³", consommation: "6.4 L/100km" },
      { name: "GT Pack", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.5 L/100km" },
    ]},
    "Partner": { versions: [
      { name: "Active", puissanceCv: 100, cylindree: "1499 cm³", consommation: "4.7 L/100km" },
      { name: "Allure", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.9 L/100km" },
      { name: "e-Partner", puissanceCv: 136, cylindree: "Électrique", consommation: "21.0 kWh/100km" },
    ]},
    "Rifter": { versions: [
      { name: "Active", puissanceCv: 100, cylindree: "1499 cm³", consommation: "4.8 L/100km" },
      { name: "Allure", puissanceCv: 130, cylindree: "1499 cm³", consommation: "5.0 L/100km" },
      { name: "GT", puissanceCv: 130, cylindree: "1499 cm³", consommation: "5.0 L/100km" },
    ]},
    "Traveller": { versions: [
      { name: "Active", puissanceCv: 120, cylindree: "1499 cm³", consommation: "5.2 L/100km" },
      { name: "Allure", puissanceCv: 150, cylindree: "1997 cm³", consommation: "5.6 L/100km" },
      { name: "e-Traveller", puissanceCv: 136, cylindree: "Électrique", consommation: "26.1 kWh/100km" },
    ]},
  },

  /* ════════════════ RENAULT ════════════════ */
  Renault: {
    "Twingo": { versions: [
      { name: "Life", puissanceCv: 65, cylindree: "999 cm³", consommation: "4.6 L/100km" },
      { name: "Zen", puissanceCv: 65, cylindree: "999 cm³", consommation: "4.6 L/100km" },
      { name: "Intens", puissanceCv: 93, cylindree: "999 cm³", consommation: "5.0 L/100km" },
      { name: "E-Tech Électrique", puissanceCv: 82, cylindree: "Électrique", consommation: "16.0 kWh/100km" },
    ]},
    "Clio": { versions: [
      { name: "Life", puissanceCv: 65, cylindree: "999 cm³", consommation: "4.9 L/100km" },
      { name: "Zen", puissanceCv: 91, cylindree: "999 cm³", consommation: "5.0 L/100km" },
      { name: "Intens", puissanceCv: 100, cylindree: "999 cm³", consommation: "5.2 L/100km" },
      { name: "R.S. Line", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.6 L/100km" },
      { name: "E-Tech Hybrid 145", puissanceCv: 145, cylindree: "1598 cm³", consommation: "4.3 L/100km" },
      { name: "Initiale Paris", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.5 L/100km" },
    ]},
    "Captur": { versions: [
      { name: "Life", puissanceCv: 91, cylindree: "999 cm³", consommation: "5.4 L/100km" },
      { name: "Zen", puissanceCv: 100, cylindree: "999 cm³", consommation: "5.5 L/100km" },
      { name: "Intens", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.8 L/100km" },
      { name: "R.S. Line", puissanceCv: 155, cylindree: "1332 cm³", consommation: "6.0 L/100km" },
      { name: "E-Tech Plug-in 160", puissanceCv: 160, cylindree: "1598 cm³", consommation: "1.5 L/100km" },
      { name: "Initiale Paris", puissanceCv: 155, cylindree: "1332 cm³", consommation: "5.9 L/100km" },
    ]},
    "Mégane": { versions: [
      { name: "Life", puissanceCv: 115, cylindree: "1332 cm³", consommation: "5.4 L/100km" },
      { name: "Zen", puissanceCv: 115, cylindree: "1332 cm³", consommation: "5.4 L/100km" },
      { name: "Intens", puissanceCv: 140, cylindree: "1332 cm³", consommation: "5.7 L/100km" },
      { name: "R.S. Line", puissanceCv: 160, cylindree: "1332 cm³", consommation: "6.0 L/100km" },
      { name: "R.S.", puissanceCv: 300, cylindree: "1798 cm³", consommation: "7.9 L/100km" },
    ]},
    "Mégane E-Tech": { versions: [
      { name: "Equilibre EV40", puissanceCv: 130, cylindree: "Électrique", consommation: "16.1 kWh/100km" },
      { name: "Techno EV60", puissanceCv: 220, cylindree: "Électrique", consommation: "16.1 kWh/100km" },
      { name: "Iconic EV60", puissanceCv: 220, cylindree: "Électrique", consommation: "16.1 kWh/100km" },
    ]},
    "Austral": { versions: [
      { name: "Equilibre", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.6 L/100km" },
      { name: "Techno", puissanceCv: 160, cylindree: "1332 cm³", consommation: "5.9 L/100km" },
      { name: "Iconic", puissanceCv: 200, cylindree: "1199 cm³", consommation: "4.6 L/100km" },
      { name: "Esprit Alpine", puissanceCv: 200, cylindree: "1199 cm³", consommation: "4.6 L/100km" },
    ]},
    "Arkana": { versions: [
      { name: "Zen", puissanceCv: 140, cylindree: "1332 cm³", consommation: "5.8 L/100km" },
      { name: "Intens", puissanceCv: 140, cylindree: "1332 cm³", consommation: "5.8 L/100km" },
      { name: "R.S. Line", puissanceCv: 160, cylindree: "1332 cm³", consommation: "6.0 L/100km" },
      { name: "E-Tech Hybrid 145", puissanceCv: 145, cylindree: "1598 cm³", consommation: "4.7 L/100km" },
    ]},
    "Kadjar": { versions: [
      { name: "Life", puissanceCv: 140, cylindree: "1332 cm³", consommation: "5.9 L/100km" },
      { name: "Zen", puissanceCv: 140, cylindree: "1332 cm³", consommation: "5.9 L/100km" },
      { name: "Intens", puissanceCv: 160, cylindree: "1332 cm³", consommation: "6.1 L/100km" },
      { name: "Black Edition", puissanceCv: 160, cylindree: "1332 cm³", consommation: "6.1 L/100km" },
    ]},
    "Scénic": { versions: [
      { name: "Life", puissanceCv: 140, cylindree: "1332 cm³", consommation: "5.8 L/100km" },
      { name: "Zen", puissanceCv: 140, cylindree: "1332 cm³", consommation: "5.8 L/100km" },
      { name: "Intens", puissanceCv: 160, cylindree: "1332 cm³", consommation: "6.0 L/100km" },
      { name: "E-Tech Électrique", puissanceCv: 220, cylindree: "Électrique", consommation: "19.5 kWh/100km" },
    ]},
    "Espace": { versions: [
      { name: "Techno", puissanceCv: 200, cylindree: "1199 cm³", consommation: "4.6 L/100km" },
      { name: "Iconic", puissanceCv: 200, cylindree: "1199 cm³", consommation: "4.6 L/100km" },
      { name: "Esprit Alpine", puissanceCv: 200, cylindree: "1199 cm³", consommation: "4.6 L/100km" },
    ]},
    "Talisman": { versions: [
      { name: "Life", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.1 L/100km" },
      { name: "Zen", puissanceCv: 160, cylindree: "1332 cm³", consommation: "5.4 L/100km" },
      { name: "Intens", puissanceCv: 160, cylindree: "1749 cm³", consommation: "4.2 L/100km" },
      { name: "Initiale Paris", puissanceCv: 200, cylindree: "1749 cm³", consommation: "4.5 L/100km" },
    ]},
    "Kangoo": { versions: [
      { name: "Life", puissanceCv: 100, cylindree: "1461 cm³", consommation: "4.8 L/100km" },
      { name: "Zen", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.5 L/100km" },
      { name: "Intens", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.5 L/100km" },
      { name: "E-Tech Électrique", puissanceCv: 122, cylindree: "Électrique", consommation: "20.0 kWh/100km" },
    ]},
    "ZOE": { versions: [
      { name: "Life R110", puissanceCv: 109, cylindree: "Électrique", consommation: "17.2 kWh/100km" },
      { name: "Zen R135", puissanceCv: 135, cylindree: "Électrique", consommation: "17.2 kWh/100km" },
      { name: "Intens R135", puissanceCv: 135, cylindree: "Électrique", consommation: "17.2 kWh/100km" },
    ]},
    "5 E-Tech": { versions: [
      { name: "Evolution", puissanceCv: 150, cylindree: "Électrique", consommation: "14.9 kWh/100km" },
      { name: "Techno", puissanceCv: 150, cylindree: "Électrique", consommation: "14.9 kWh/100km" },
      { name: "Iconic", puissanceCv: 150, cylindree: "Électrique", consommation: "14.9 kWh/100km" },
    ]},
  },

  /* ════════════════ CITROËN ════════════════ */
  "Citroën": {
    "C3": { versions: [
      { name: "Live", puissanceCv: 83, cylindree: "1199 cm³", consommation: "4.7 L/100km" },
      { name: "Feel", puissanceCv: 83, cylindree: "1199 cm³", consommation: "4.7 L/100km" },
      { name: "Feel Pack", puissanceCv: 110, cylindree: "1199 cm³", consommation: "5.1 L/100km" },
      { name: "Shine", puissanceCv: 110, cylindree: "1199 cm³", consommation: "5.1 L/100km" },
      { name: "ë-C3", puissanceCv: 113, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
    ]},
    "C3 Aircross": { versions: [
      { name: "Live", puissanceCv: 83, cylindree: "1199 cm³", consommation: "5.0 L/100km" },
      { name: "Feel", puissanceCv: 110, cylindree: "1199 cm³", consommation: "5.3 L/100km" },
      { name: "Shine", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" },
    ]},
    "C4": { versions: [
      { name: "Feel", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.2 L/100km" },
      { name: "Feel Pack", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" },
      { name: "Shine", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" },
      { name: "Shine Pack", puissanceCv: 155, cylindree: "1499 cm³", consommation: "4.0 L/100km" },
      { name: "ë-C4 Feel", puissanceCv: 136, cylindree: "Électrique", consommation: "16.7 kWh/100km" },
      { name: "ë-C4 Shine", puissanceCv: 136, cylindree: "Électrique", consommation: "16.7 kWh/100km" },
    ]},
    "C4 X": { versions: [
      { name: "Feel", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.2 L/100km" },
      { name: "Shine", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" },
      { name: "ë-C4 X", puissanceCv: 136, cylindree: "Électrique", consommation: "16.7 kWh/100km" },
    ]},
    "C5 Aircross": { versions: [
      { name: "Feel", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.7 L/100km" },
      { name: "Feel Pack", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.3 L/100km" },
      { name: "Shine", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.3 L/100km" },
      { name: "Shine Pack", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.3 L/100km" },
      { name: "Hybrid 225 Shine", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.5 L/100km" },
    ]},
    "C5 X": { versions: [
      { name: "Feel", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.6 L/100km" },
      { name: "Shine", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.2 L/100km" },
      { name: "Shine Pack", puissanceCv: 180, cylindree: "1598 cm³", consommation: "5.9 L/100km" },
      { name: "Hybrid 225", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.3 L/100km" },
    ]},
    "Berlingo": { versions: [
      { name: "Live", puissanceCv: 100, cylindree: "1499 cm³", consommation: "4.8 L/100km" },
      { name: "Feel", puissanceCv: 130, cylindree: "1499 cm³", consommation: "5.0 L/100km" },
      { name: "Shine", puissanceCv: 130, cylindree: "1499 cm³", consommation: "5.0 L/100km" },
      { name: "ë-Berlingo", puissanceCv: 136, cylindree: "Électrique", consommation: "21.0 kWh/100km" },
    ]},
    "SpaceTourer": { versions: [
      { name: "Feel", puissanceCv: 120, cylindree: "1499 cm³", consommation: "5.3 L/100km" },
      { name: "Shine", puissanceCv: 150, cylindree: "1997 cm³", consommation: "5.7 L/100km" },
      { name: "ë-SpaceTourer", puissanceCv: 136, cylindree: "Électrique", consommation: "26.1 kWh/100km" },
    ]},
  },

  /* ════════════════ VOLKSWAGEN ════════════════ */
  Volkswagen: {
    "Polo": { versions: [
      { name: "Trendline", puissanceCv: 80, cylindree: "999 cm³", consommation: "4.9 L/100km" },
      { name: "Comfortline", puissanceCv: 95, cylindree: "999 cm³", consommation: "5.1 L/100km" },
      { name: "R-Line", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.3 L/100km" },
      { name: "GTI", puissanceCv: 207, cylindree: "1984 cm³", consommation: "6.9 L/100km" },
    ]},
    "Golf": { versions: [
      { name: "Trendline", puissanceCv: 90, cylindree: "999 cm³", consommation: "5.2 L/100km" },
      { name: "Life", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.4 L/100km" },
      { name: "Style", puissanceCv: 130, cylindree: "1498 cm³", consommation: "5.5 L/100km" },
      { name: "R-Line", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.8 L/100km" },
      { name: "GTI", puissanceCv: 245, cylindree: "1984 cm³", consommation: "7.1 L/100km" },
      { name: "GTI Clubsport", puissanceCv: 300, cylindree: "1984 cm³", consommation: "7.5 L/100km" },
      { name: "R", puissanceCv: 320, cylindree: "1984 cm³", consommation: "7.8 L/100km" },
      { name: "eHybrid", puissanceCv: 204, cylindree: "1395 cm³", consommation: "1.2 L/100km" },
      { name: "GTE", puissanceCv: 245, cylindree: "1395 cm³", consommation: "1.3 L/100km" },
    ]},
    "T-Cross": { versions: [
      { name: "Life", puissanceCv: 95, cylindree: "999 cm³", consommation: "5.4 L/100km" },
      { name: "Style", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.6 L/100km" },
      { name: "R-Line", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.9 L/100km" },
    ]},
    "T-Roc": { versions: [
      { name: "Life", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.6 L/100km" },
      { name: "Style", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.9 L/100km" },
      { name: "R-Line", puissanceCv: 150, cylindree: "1498 cm³", consommation: "6.0 L/100km" },
      { name: "R", puissanceCv: 300, cylindree: "1984 cm³", consommation: "8.0 L/100km" },
    ]},
    "Tiguan": { versions: [
      { name: "Life", puissanceCv: 130, cylindree: "1498 cm³", consommation: "5.8 L/100km" },
      { name: "Elegance", puissanceCv: 150, cylindree: "1498 cm³", consommation: "6.0 L/100km" },
      { name: "R-Line", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.5 L/100km" },
      { name: "R", puissanceCv: 320, cylindree: "1984 cm³", consommation: "8.2 L/100km" },
      { name: "eHybrid", puissanceCv: 245, cylindree: "1395 cm³", consommation: "1.6 L/100km" },
    ]},
    "Touareg": { versions: [
      { name: "Elegance", puissanceCv: 231, cylindree: "2967 cm³", consommation: "7.2 L/100km" },
      { name: "R-Line", puissanceCv: 286, cylindree: "2967 cm³", consommation: "7.5 L/100km" },
      { name: "eHybrid", puissanceCv: 381, cylindree: "2995 cm³", consommation: "2.8 L/100km" },
      { name: "R", puissanceCv: 462, cylindree: "2995 cm³", consommation: "3.0 L/100km" },
    ]},
    "Passat": { versions: [
      { name: "Life", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.5 L/100km" },
      { name: "Elegance", puissanceCv: 190, cylindree: "1984 cm³", consommation: "5.8 L/100km" },
      { name: "R-Line", puissanceCv: 190, cylindree: "1984 cm³", consommation: "5.9 L/100km" },
      { name: "GTE", puissanceCv: 218, cylindree: "1395 cm³", consommation: "1.3 L/100km" },
    ]},
    "Arteon": { versions: [
      { name: "Elegance", puissanceCv: 190, cylindree: "1984 cm³", consommation: "5.9 L/100km" },
      { name: "R-Line", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.0 L/100km" },
      { name: "R", puissanceCv: 320, cylindree: "1984 cm³", consommation: "8.0 L/100km" },
      { name: "eHybrid", puissanceCv: 218, cylindree: "1395 cm³", consommation: "1.3 L/100km" },
    ]},
    "ID.3": { versions: [
      { name: "Pure", puissanceCv: 150, cylindree: "Électrique", consommation: "15.9 kWh/100km" },
      { name: "Pro S", puissanceCv: 204, cylindree: "Électrique", consommation: "15.9 kWh/100km" },
      { name: "GTX", puissanceCv: 299, cylindree: "Électrique", consommation: "16.2 kWh/100km" },
    ]},
    "ID.4": { versions: [
      { name: "Pure", puissanceCv: 170, cylindree: "Électrique", consommation: "16.3 kWh/100km" },
      { name: "Pro", puissanceCv: 204, cylindree: "Électrique", consommation: "16.3 kWh/100km" },
      { name: "GTX", puissanceCv: 299, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
    ]},
    "ID.5": { versions: [
      { name: "Pro", puissanceCv: 204, cylindree: "Électrique", consommation: "16.3 kWh/100km" },
      { name: "GTX", puissanceCv: 299, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
    ]},
    "Touran": { versions: [
      { name: "Life", puissanceCv: 130, cylindree: "1498 cm³", consommation: "5.7 L/100km" },
      { name: "R-Line", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.9 L/100km" },
    ]},
    "Multivan": { versions: [
      { name: "Life", puissanceCv: 150, cylindree: "1984 cm³", consommation: "7.0 L/100km" },
      { name: "Style", puissanceCv: 204, cylindree: "1984 cm³", consommation: "7.2 L/100km" },
      { name: "eHybrid", puissanceCv: 218, cylindree: "1395 cm³", consommation: "1.8 L/100km" },
    ]},
  },

  /* ════════════════ BMW ════════════════ */
  BMW: {
    "Série 1": { versions: [
      { name: "116i", puissanceCv: 109, cylindree: "1499 cm³", consommation: "5.8 L/100km" },
      { name: "118i", puissanceCv: 140, cylindree: "1499 cm³", consommation: "5.9 L/100km" },
      { name: "120i", puissanceCv: 178, cylindree: "1998 cm³", consommation: "6.2 L/100km" },
      { name: "118d", puissanceCv: 150, cylindree: "1995 cm³", consommation: "4.3 L/100km" },
      { name: "120d", puissanceCv: 190, cylindree: "1995 cm³", consommation: "4.5 L/100km" },
      { name: "128ti", puissanceCv: 265, cylindree: "1998 cm³", consommation: "6.8 L/100km" },
      { name: "M135i xDrive", puissanceCv: 306, cylindree: "1998 cm³", consommation: "7.1 L/100km" },
    ]},
    "Série 2 Coupé": { versions: [
      { name: "220i", puissanceCv: 184, cylindree: "1998 cm³", consommation: "6.2 L/100km" },
      { name: "220d", puissanceCv: 190, cylindree: "1995 cm³", consommation: "4.5 L/100km" },
      { name: "M240i xDrive", puissanceCv: 374, cylindree: "2998 cm³", consommation: "7.6 L/100km" },
    ]},
    "Série 2 Active Tourer": { versions: [
      { name: "218i", puissanceCv: 136, cylindree: "1499 cm³", consommation: "6.0 L/100km" },
      { name: "220i", puissanceCv: 170, cylindree: "1499 cm³", consommation: "6.2 L/100km" },
      { name: "218d", puissanceCv: 150, cylindree: "1995 cm³", consommation: "4.4 L/100km" },
      { name: "220d", puissanceCv: 190, cylindree: "1995 cm³", consommation: "4.6 L/100km" },
      { name: "225e xDrive", puissanceCv: 245, cylindree: "1499 cm³", consommation: "0.9 L/100km" },
      { name: "230e xDrive", puissanceCv: 326, cylindree: "1499 cm³", consommation: "0.9 L/100km" },
    ]},
    "Série 3": { versions: [
      { name: "318i", puissanceCv: 156, cylindree: "1998 cm³", consommation: "5.9 L/100km" },
      { name: "320i", puissanceCv: 184, cylindree: "1998 cm³", consommation: "6.2 L/100km" },
      { name: "330i", puissanceCv: 245, cylindree: "1998 cm³", consommation: "6.6 L/100km" },
      { name: "318d", puissanceCv: 150, cylindree: "1995 cm³", consommation: "4.2 L/100km" },
      { name: "320d", puissanceCv: 190, cylindree: "1995 cm³", consommation: "4.4 L/100km" },
      { name: "330d", puissanceCv: 286, cylindree: "2993 cm³", consommation: "5.2 L/100km" },
      { name: "330e", puissanceCv: 292, cylindree: "1998 cm³", consommation: "1.6 L/100km" },
      { name: "M340i xDrive", puissanceCv: 374, cylindree: "2998 cm³", consommation: "7.5 L/100km" },
    ]},
    "Série 4": { versions: [
      { name: "420i", puissanceCv: 184, cylindree: "1998 cm³", consommation: "6.2 L/100km" },
      { name: "430i", puissanceCv: 245, cylindree: "1998 cm³", consommation: "6.6 L/100km" },
      { name: "420d", puissanceCv: 190, cylindree: "1995 cm³", consommation: "4.5 L/100km" },
      { name: "M440i xDrive", puissanceCv: 374, cylindree: "2998 cm³", consommation: "7.6 L/100km" },
    ]},
    "Série 5": { versions: [
      { name: "520i", puissanceCv: 184, cylindree: "1998 cm³", consommation: "6.4 L/100km" },
      { name: "530i", puissanceCv: 252, cylindree: "1998 cm³", consommation: "6.8 L/100km" },
      { name: "520d", puissanceCv: 190, cylindree: "1995 cm³", consommation: "4.5 L/100km" },
      { name: "530d", puissanceCv: 286, cylindree: "2993 cm³", consommation: "5.3 L/100km" },
      { name: "530e", puissanceCv: 292, cylindree: "1998 cm³", consommation: "1.5 L/100km" },
      { name: "M550i xDrive", puissanceCv: 530, cylindree: "4395 cm³", consommation: "9.0 L/100km" },
      { name: "i5 eDrive40", puissanceCv: 340, cylindree: "Électrique", consommation: "16.5 kWh/100km" },
      { name: "i5 M60 xDrive", puissanceCv: 601, cylindree: "Électrique", consommation: "18.2 kWh/100km" },
    ]},
    "Série 7": { versions: [
      { name: "740i", puissanceCv: 380, cylindree: "2998 cm³", consommation: "7.6 L/100km" },
      { name: "740d xDrive", puissanceCv: 340, cylindree: "2993 cm³", consommation: "5.8 L/100km" },
      { name: "i7 eDrive50", puissanceCv: 455, cylindree: "Électrique", consommation: "18.4 kWh/100km" },
      { name: "i7 xDrive60", puissanceCv: 544, cylindree: "Électrique", consommation: "18.4 kWh/100km" },
      { name: "i7 M70 xDrive", puissanceCv: 660, cylindree: "Électrique", consommation: "19.6 kWh/100km" },
    ]},
    "X1": { versions: [
      { name: "sDrive18i", puissanceCv: 136, cylindree: "1499 cm³", consommation: "6.0 L/100km" },
      { name: "sDrive20i", puissanceCv: 170, cylindree: "1499 cm³", consommation: "6.3 L/100km" },
      { name: "xDrive23i", puissanceCv: 218, cylindree: "1499 cm³", consommation: "6.5 L/100km" },
      { name: "sDrive18d", puissanceCv: 150, cylindree: "1995 cm³", consommation: "4.4 L/100km" },
      { name: "xDrive23d", puissanceCv: 211, cylindree: "1995 cm³", consommation: "4.8 L/100km" },
      { name: "xDrive25e", puissanceCv: 245, cylindree: "1499 cm³", consommation: "0.9 L/100km" },
      { name: "iX1 xDrive30", puissanceCv: 313, cylindree: "Électrique", consommation: "16.7 kWh/100km" },
    ]},
    "X3": { versions: [
      { name: "sDrive20i", puissanceCv: 184, cylindree: "1998 cm³", consommation: "6.6 L/100km" },
      { name: "xDrive30i", puissanceCv: 245, cylindree: "1998 cm³", consommation: "7.0 L/100km" },
      { name: "xDrive20d", puissanceCv: 190, cylindree: "1995 cm³", consommation: "5.0 L/100km" },
      { name: "xDrive30d", puissanceCv: 286, cylindree: "2993 cm³", consommation: "5.6 L/100km" },
      { name: "xDrive30e", puissanceCv: 292, cylindree: "1998 cm³", consommation: "1.8 L/100km" },
      { name: "M40i", puissanceCv: 360, cylindree: "2998 cm³", consommation: "8.0 L/100km" },
    ]},
    "X5": { versions: [
      { name: "xDrive40i", puissanceCv: 340, cylindree: "2998 cm³", consommation: "7.9 L/100km" },
      { name: "xDrive30d", puissanceCv: 286, cylindree: "2993 cm³", consommation: "5.8 L/100km" },
      { name: "xDrive40d", puissanceCv: 340, cylindree: "2993 cm³", consommation: "6.0 L/100km" },
      { name: "xDrive45e", puissanceCv: 394, cylindree: "2998 cm³", consommation: "1.8 L/100km" },
      { name: "M50i", puissanceCv: 530, cylindree: "4395 cm³", consommation: "9.5 L/100km" },
    ]},
    "iX": { versions: [
      { name: "xDrive40", puissanceCv: 326, cylindree: "Électrique", consommation: "19.8 kWh/100km" },
      { name: "xDrive50", puissanceCv: 523, cylindree: "Électrique", consommation: "19.8 kWh/100km" },
      { name: "M60", puissanceCv: 619, cylindree: "Électrique", consommation: "21.9 kWh/100km" },
    ]},
    "iX3": { versions: [
      { name: "Inspiring", puissanceCv: 286, cylindree: "Électrique", consommation: "17.8 kWh/100km" },
      { name: "Impressive", puissanceCv: 286, cylindree: "Électrique", consommation: "17.8 kWh/100km" },
    ]},
    "i4": { versions: [
      { name: "eDrive35", puissanceCv: 286, cylindree: "Électrique", consommation: "16.1 kWh/100km" },
      { name: "eDrive40", puissanceCv: 340, cylindree: "Électrique", consommation: "16.1 kWh/100km" },
      { name: "M50", puissanceCv: 544, cylindree: "Électrique", consommation: "18.1 kWh/100km" },
    ]},
  },

  /* ════════════════ MERCEDES-BENZ ════════════════ */
  "Mercedes-Benz": {
    "Classe A": { versions: [
      { name: "A 180", puissanceCv: 136, cylindree: "1332 cm³", consommation: "5.6 L/100km" },
      { name: "A 200", puissanceCv: 163, cylindree: "1332 cm³", consommation: "5.8 L/100km" },
      { name: "A 200 d", puissanceCv: 150, cylindree: "1950 cm³", consommation: "4.1 L/100km" },
      { name: "A 220", puissanceCv: 190, cylindree: "1991 cm³", consommation: "6.0 L/100km" },
      { name: "A 250 e", puissanceCv: 218, cylindree: "1332 cm³", consommation: "1.4 L/100km" },
      { name: "AMG A 35", puissanceCv: 306, cylindree: "1991 cm³", consommation: "7.5 L/100km" },
      { name: "AMG A 45 S", puissanceCv: 421, cylindree: "1991 cm³", consommation: "8.4 L/100km" },
    ]},
    "Classe B": { versions: [
      { name: "B 180", puissanceCv: 136, cylindree: "1332 cm³", consommation: "5.8 L/100km" },
      { name: "B 200", puissanceCv: 163, cylindree: "1332 cm³", consommation: "6.0 L/100km" },
      { name: "B 200 d", puissanceCv: 150, cylindree: "1950 cm³", consommation: "4.3 L/100km" },
      { name: "B 250 e", puissanceCv: 218, cylindree: "1332 cm³", consommation: "1.5 L/100km" },
    ]},
    "Classe C": { versions: [
      { name: "C 180", puissanceCv: 170, cylindree: "1496 cm³", consommation: "5.7 L/100km" },
      { name: "C 200", puissanceCv: 204, cylindree: "1496 cm³", consommation: "5.9 L/100km" },
      { name: "C 200 d", puissanceCv: 163, cylindree: "1993 cm³", consommation: "4.2 L/100km" },
      { name: "C 220 d", puissanceCv: 200, cylindree: "1993 cm³", consommation: "4.4 L/100km" },
      { name: "C 300", puissanceCv: 258, cylindree: "1999 cm³", consommation: "6.5 L/100km" },
      { name: "C 300 d", puissanceCv: 265, cylindree: "1993 cm³", consommation: "4.8 L/100km" },
      { name: "C 300 e", puissanceCv: 313, cylindree: "1999 cm³", consommation: "0.8 L/100km" },
      { name: "AMG C 43", puissanceCv: 408, cylindree: "1999 cm³", consommation: "7.9 L/100km" },
      { name: "AMG C 63 S E", puissanceCv: 680, cylindree: "1991 cm³", consommation: "6.9 L/100km" },
    ]},
    "Classe E": { versions: [
      { name: "E 200", puissanceCv: 204, cylindree: "1999 cm³", consommation: "6.2 L/100km" },
      { name: "E 220 d", puissanceCv: 197, cylindree: "1993 cm³", consommation: "4.5 L/100km" },
      { name: "E 300", puissanceCv: 258, cylindree: "1999 cm³", consommation: "6.6 L/100km" },
      { name: "E 300 d", puissanceCv: 265, cylindree: "1993 cm³", consommation: "5.0 L/100km" },
      { name: "E 300 e", puissanceCv: 313, cylindree: "1999 cm³", consommation: "1.0 L/100km" },
      { name: "AMG E 53", puissanceCv: 457, cylindree: "2999 cm³", consommation: "8.5 L/100km" },
    ]},
    "Classe S": { versions: [
      { name: "S 350 d", puissanceCv: 286, cylindree: "2925 cm³", consommation: "5.4 L/100km" },
      { name: "S 400 d", puissanceCv: 330, cylindree: "2925 cm³", consommation: "5.6 L/100km" },
      { name: "S 450", puissanceCv: 367, cylindree: "2999 cm³", consommation: "7.6 L/100km" },
      { name: "S 500", puissanceCv: 435, cylindree: "2999 cm³", consommation: "7.8 L/100km" },
      { name: "S 580 e", puissanceCv: 510, cylindree: "2999 cm³", consommation: "0.8 L/100km" },
      { name: "AMG S 63 E", puissanceCv: 802, cylindree: "3982 cm³", consommation: "4.4 L/100km" },
    ]},
    "GLA": { versions: [
      { name: "GLA 180", puissanceCv: 136, cylindree: "1332 cm³", consommation: "5.9 L/100km" },
      { name: "GLA 200", puissanceCv: 163, cylindree: "1332 cm³", consommation: "6.1 L/100km" },
      { name: "GLA 200 d", puissanceCv: 150, cylindree: "1950 cm³", consommation: "4.5 L/100km" },
      { name: "GLA 250 e", puissanceCv: 218, cylindree: "1332 cm³", consommation: "1.6 L/100km" },
      { name: "AMG GLA 35", puissanceCv: 306, cylindree: "1991 cm³", consommation: "7.8 L/100km" },
      { name: "AMG GLA 45 S", puissanceCv: 421, cylindree: "1991 cm³", consommation: "8.6 L/100km" },
    ]},
    "GLB": { versions: [
      { name: "GLB 180", puissanceCv: 136, cylindree: "1332 cm³", consommation: "6.0 L/100km" },
      { name: "GLB 200", puissanceCv: 163, cylindree: "1332 cm³", consommation: "6.2 L/100km" },
      { name: "GLB 200 d", puissanceCv: 150, cylindree: "1950 cm³", consommation: "4.6 L/100km" },
      { name: "GLB 250 e", puissanceCv: 218, cylindree: "1332 cm³", consommation: "1.7 L/100km" },
      { name: "AMG GLB 35", puissanceCv: 306, cylindree: "1991 cm³", consommation: "7.9 L/100km" },
    ]},
    "GLC": { versions: [
      { name: "GLC 200", puissanceCv: 204, cylindree: "1999 cm³", consommation: "6.5 L/100km" },
      { name: "GLC 220 d", puissanceCv: 197, cylindree: "1993 cm³", consommation: "4.8 L/100km" },
      { name: "GLC 300", puissanceCv: 258, cylindree: "1999 cm³", consommation: "6.9 L/100km" },
      { name: "GLC 300 d", puissanceCv: 265, cylindree: "1993 cm³", consommation: "5.2 L/100km" },
      { name: "GLC 300 e", puissanceCv: 313, cylindree: "1999 cm³", consommation: "0.8 L/100km" },
      { name: "AMG GLC 43", puissanceCv: 421, cylindree: "1999 cm³", consommation: "8.4 L/100km" },
      { name: "AMG GLC 63 S E", puissanceCv: 680, cylindree: "1991 cm³", consommation: "7.2 L/100km" },
    ]},
    "GLE": { versions: [
      { name: "GLE 300 d", puissanceCv: 272, cylindree: "1993 cm³", consommation: "5.6 L/100km" },
      { name: "GLE 350 d", puissanceCv: 272, cylindree: "2925 cm³", consommation: "6.0 L/100km" },
      { name: "GLE 450", puissanceCv: 367, cylindree: "2999 cm³", consommation: "8.2 L/100km" },
      { name: "GLE 350 de", puissanceCv: 333, cylindree: "1993 cm³", consommation: "1.1 L/100km" },
      { name: "AMG GLE 53", puissanceCv: 457, cylindree: "2999 cm³", consommation: "9.3 L/100km" },
      { name: "AMG GLE 63 S", puissanceCv: 612, cylindree: "3982 cm³", consommation: "12.0 L/100km" },
    ]},
    "EQA": { versions: [
      { name: "EQA 250", puissanceCv: 190, cylindree: "Électrique", consommation: "17.7 kWh/100km" },
      { name: "EQA 250+", puissanceCv: 190, cylindree: "Électrique", consommation: "16.0 kWh/100km" },
      { name: "EQA 300 4MATIC", puissanceCv: 228, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
      { name: "EQA 350 4MATIC", puissanceCv: 292, cylindree: "Électrique", consommation: "17.5 kWh/100km" },
    ]},
    "EQB": { versions: [
      { name: "EQB 250", puissanceCv: 190, cylindree: "Électrique", consommation: "18.1 kWh/100km" },
      { name: "EQB 300 4MATIC", puissanceCv: 228, cylindree: "Électrique", consommation: "18.4 kWh/100km" },
      { name: "EQB 350 4MATIC", puissanceCv: 292, cylindree: "Électrique", consommation: "18.7 kWh/100km" },
    ]},
    "EQC": { versions: [
      { name: "EQC 400 4MATIC", puissanceCv: 408, cylindree: "Électrique", consommation: "21.3 kWh/100km" },
    ]},
    "EQE": { versions: [
      { name: "EQE 300", puissanceCv: 245, cylindree: "Électrique", consommation: "15.7 kWh/100km" },
      { name: "EQE 350+", puissanceCv: 292, cylindree: "Électrique", consommation: "15.9 kWh/100km" },
      { name: "AMG EQE 43", puissanceCv: 476, cylindree: "Électrique", consommation: "17.6 kWh/100km" },
      { name: "AMG EQE 53", puissanceCv: 626, cylindree: "Électrique", consommation: "17.9 kWh/100km" },
    ]},
    "EQS": { versions: [
      { name: "EQS 350+", puissanceCv: 333, cylindree: "Électrique", consommation: "15.7 kWh/100km" },
      { name: "EQS 450+", puissanceCv: 367, cylindree: "Électrique", consommation: "15.7 kWh/100km" },
      { name: "EQS 580 4MATIC", puissanceCv: 523, cylindree: "Électrique", consommation: "17.4 kWh/100km" },
      { name: "AMG EQS 53", puissanceCv: 658, cylindree: "Électrique", consommation: "18.6 kWh/100km" },
    ]},
  },

  /* ════════════════ AUDI ════════════════ */
  Audi: {
    "A1": { versions: [
      { name: "25 TFSI", puissanceCv: 95, cylindree: "999 cm³", consommation: "5.0 L/100km" },
      { name: "30 TFSI", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.2 L/100km" },
      { name: "35 TFSI", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.6 L/100km" },
      { name: "S line 35 TFSI", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.6 L/100km" },
    ]},
    "A3": { versions: [
      { name: "30 TFSI", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.3 L/100km" },
      { name: "35 TFSI", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.6 L/100km" },
      { name: "35 TDI", puissanceCv: 150, cylindree: "1968 cm³", consommation: "4.1 L/100km" },
      { name: "40 TFSI e", puissanceCv: 204, cylindree: "1395 cm³", consommation: "1.2 L/100km" },
      { name: "45 TFSI e", puissanceCv: 245, cylindree: "1395 cm³", consommation: "1.2 L/100km" },
      { name: "S3", puissanceCv: 333, cylindree: "1984 cm³", consommation: "7.4 L/100km" },
      { name: "RS 3", puissanceCv: 400, cylindree: "2480 cm³", consommation: "8.3 L/100km" },
    ]},
    "A4": { versions: [
      { name: "35 TFSI", puissanceCv: 150, cylindree: "1984 cm³", consommation: "5.8 L/100km" },
      { name: "40 TFSI", puissanceCv: 204, cylindree: "1984 cm³", consommation: "6.2 L/100km" },
      { name: "45 TFSI", puissanceCv: 265, cylindree: "1984 cm³", consommation: "6.6 L/100km" },
      { name: "35 TDI", puissanceCv: 163, cylindree: "1968 cm³", consommation: "4.2 L/100km" },
      { name: "40 TDI", puissanceCv: 204, cylindree: "1968 cm³", consommation: "4.5 L/100km" },
      { name: "S4", puissanceCv: 341, cylindree: "2995 cm³", consommation: "5.6 L/100km" },
      { name: "RS 4 Avant", puissanceCv: 450, cylindree: "2894 cm³", consommation: "9.1 L/100km" },
    ]},
    "A5": { versions: [
      { name: "35 TFSI", puissanceCv: 150, cylindree: "1984 cm³", consommation: "5.9 L/100km" },
      { name: "40 TFSI", puissanceCv: 204, cylindree: "1984 cm³", consommation: "6.3 L/100km" },
      { name: "45 TFSI", puissanceCv: 265, cylindree: "1984 cm³", consommation: "6.7 L/100km" },
      { name: "40 TDI", puissanceCv: 204, cylindree: "1968 cm³", consommation: "4.6 L/100km" },
      { name: "S5", puissanceCv: 354, cylindree: "2995 cm³", consommation: "5.8 L/100km" },
      { name: "RS 5", puissanceCv: 450, cylindree: "2894 cm³", consommation: "9.2 L/100km" },
    ]},
    "A6": { versions: [
      { name: "40 TFSI", puissanceCv: 204, cylindree: "1984 cm³", consommation: "6.4 L/100km" },
      { name: "45 TFSI", puissanceCv: 265, cylindree: "1984 cm³", consommation: "6.8 L/100km" },
      { name: "40 TDI", puissanceCv: 204, cylindree: "1968 cm³", consommation: "4.6 L/100km" },
      { name: "50 TDI", puissanceCv: 286, cylindree: "2967 cm³", consommation: "5.3 L/100km" },
      { name: "55 TFSI e", puissanceCv: 367, cylindree: "1984 cm³", consommation: "1.5 L/100km" },
      { name: "S6", puissanceCv: 354, cylindree: "2967 cm³", consommation: "5.7 L/100km" },
      { name: "RS 6 Avant", puissanceCv: 600, cylindree: "3996 cm³", consommation: "11.5 L/100km" },
    ]},
    "Q2": { versions: [
      { name: "30 TFSI", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.4 L/100km" },
      { name: "35 TFSI", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.7 L/100km" },
      { name: "35 TDI", puissanceCv: 150, cylindree: "1968 cm³", consommation: "4.3 L/100km" },
      { name: "SQ2", puissanceCv: 300, cylindree: "1984 cm³", consommation: "7.4 L/100km" },
    ]},
    "Q3": { versions: [
      { name: "35 TFSI", puissanceCv: 150, cylindree: "1498 cm³", consommation: "6.0 L/100km" },
      { name: "40 TFSI", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.4 L/100km" },
      { name: "35 TDI", puissanceCv: 150, cylindree: "1968 cm³", consommation: "4.5 L/100km" },
      { name: "45 TFSI e", puissanceCv: 245, cylindree: "1395 cm³", consommation: "1.5 L/100km" },
      { name: "RS Q3", puissanceCv: 400, cylindree: "2480 cm³", consommation: "8.4 L/100km" },
    ]},
    "Q5": { versions: [
      { name: "40 TFSI", puissanceCv: 204, cylindree: "1984 cm³", consommation: "6.8 L/100km" },
      { name: "45 TFSI", puissanceCv: 265, cylindree: "1984 cm³", consommation: "7.2 L/100km" },
      { name: "40 TDI", puissanceCv: 204, cylindree: "1968 cm³", consommation: "4.8 L/100km" },
      { name: "50 TFSI e", puissanceCv: 299, cylindree: "1984 cm³", consommation: "1.5 L/100km" },
      { name: "SQ5 TDI", puissanceCv: 341, cylindree: "2967 cm³", consommation: "6.1 L/100km" },
    ]},
    "Q7": { versions: [
      { name: "45 TFSI", puissanceCv: 245, cylindree: "1984 cm³", consommation: "7.6 L/100km" },
      { name: "50 TFSI", puissanceCv: 340, cylindree: "2995 cm³", consommation: "8.2 L/100km" },
      { name: "50 TDI", puissanceCv: 286, cylindree: "2967 cm³", consommation: "5.8 L/100km" },
      { name: "55 TFSI e", puissanceCv: 381, cylindree: "2995 cm³", consommation: "2.5 L/100km" },
      { name: "SQ7 TDI", puissanceCv: 435, cylindree: "3956 cm³", consommation: "7.2 L/100km" },
      { name: "RS Q8", puissanceCv: 600, cylindree: "3996 cm³", consommation: "11.6 L/100km" },
    ]},
    "Q8": { versions: [
      { name: "50 TFSI", puissanceCv: 340, cylindree: "2995 cm³", consommation: "8.5 L/100km" },
      { name: "50 TDI", puissanceCv: 286, cylindree: "2967 cm³", consommation: "6.0 L/100km" },
      { name: "55 TFSI e", puissanceCv: 381, cylindree: "2995 cm³", consommation: "2.6 L/100km" },
      { name: "RS Q8", puissanceCv: 600, cylindree: "3996 cm³", consommation: "11.6 L/100km" },
    ]},
    "e-tron GT": { versions: [
      { name: "e-tron GT", puissanceCv: 476, cylindree: "Électrique", consommation: "19.6 kWh/100km" },
      { name: "RS e-tron GT", puissanceCv: 646, cylindree: "Électrique", consommation: "20.2 kWh/100km" },
    ]},
    "Q4 e-tron": { versions: [
      { name: "35 e-tron", puissanceCv: 170, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
      { name: "40 e-tron", puissanceCv: 204, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
      { name: "45 e-tron quattro", puissanceCv: 265, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
      { name: "50 e-tron quattro", puissanceCv: 299, cylindree: "Électrique", consommation: "17.3 kWh/100km" },
    ]},
    "Q8 e-tron": { versions: [
      { name: "50 e-tron", puissanceCv: 340, cylindree: "Électrique", consommation: "20.6 kWh/100km" },
      { name: "55 e-tron", puissanceCv: 408, cylindree: "Électrique", consommation: "20.6 kWh/100km" },
      { name: "SQ8 e-tron", puissanceCv: 503, cylindree: "Électrique", consommation: "24.4 kWh/100km" },
    ]},
  },

  /* ════════════════ TOYOTA ════════════════ */
  Toyota: {
    "Aygo X": { versions: [
      { name: "Active", puissanceCv: 72, cylindree: "999 cm³", consommation: "4.7 L/100km" },
      { name: "Design", puissanceCv: 72, cylindree: "999 cm³", consommation: "4.7 L/100km" },
      { name: "Limited", puissanceCv: 72, cylindree: "999 cm³", consommation: "4.7 L/100km" },
    ]},
    "Yaris": { versions: [
      { name: "Dynamic", puissanceCv: 116, cylindree: "1490 cm³", consommation: "3.8 L/100km" },
      { name: "Design", puissanceCv: 116, cylindree: "1490 cm³", consommation: "3.8 L/100km" },
      { name: "Première", puissanceCv: 130, cylindree: "1490 cm³", consommation: "3.8 L/100km" },
      { name: "GR Sport", puissanceCv: 130, cylindree: "1490 cm³", consommation: "4.0 L/100km" },
    ]},
    "Yaris Cross": { versions: [
      { name: "Dynamic", puissanceCv: 116, cylindree: "1490 cm³", consommation: "4.4 L/100km" },
      { name: "Design", puissanceCv: 116, cylindree: "1490 cm³", consommation: "4.4 L/100km" },
      { name: "Première", puissanceCv: 130, cylindree: "1490 cm³", consommation: "4.4 L/100km" },
      { name: "GR Sport", puissanceCv: 130, cylindree: "1490 cm³", consommation: "4.5 L/100km" },
    ]},
    "Corolla": { versions: [
      { name: "Dynamic", puissanceCv: 140, cylindree: "1798 cm³", consommation: "4.5 L/100km" },
      { name: "Design", puissanceCv: 140, cylindree: "1798 cm³", consommation: "4.5 L/100km" },
      { name: "Première", puissanceCv: 196, cylindree: "1987 cm³", consommation: "4.3 L/100km" },
      { name: "GR Sport", puissanceCv: 196, cylindree: "1987 cm³", consommation: "4.4 L/100km" },
    ]},
    "Corolla Cross": { versions: [
      { name: "Dynamic", puissanceCv: 140, cylindree: "1798 cm³", consommation: "4.5 L/100km" },
      { name: "Design", puissanceCv: 196, cylindree: "1987 cm³", consommation: "4.6 L/100km" },
      { name: "Première", puissanceCv: 196, cylindree: "1987 cm³", consommation: "4.6 L/100km" },
    ]},
    "C-HR": { versions: [
      { name: "Dynamic", puissanceCv: 140, cylindree: "1798 cm³", consommation: "4.8 L/100km" },
      { name: "Design", puissanceCv: 196, cylindree: "1987 cm³", consommation: "4.7 L/100km" },
      { name: "Première", puissanceCv: 196, cylindree: "1987 cm³", consommation: "4.7 L/100km" },
      { name: "GR Sport", puissanceCv: 196, cylindree: "1987 cm³", consommation: "4.8 L/100km" },
    ]},
    "RAV4": { versions: [
      { name: "Dynamic", puissanceCv: 218, cylindree: "2487 cm³", consommation: "5.6 L/100km" },
      { name: "Design", puissanceCv: 218, cylindree: "2487 cm³", consommation: "5.6 L/100km" },
      { name: "Première", puissanceCv: 218, cylindree: "2487 cm³", consommation: "5.6 L/100km" },
      { name: "Plug-in Hybrid", puissanceCv: 306, cylindree: "2487 cm³", consommation: "1.0 L/100km" },
    ]},
    "Highlander": { versions: [
      { name: "Lounge", puissanceCv: 248, cylindree: "2487 cm³", consommation: "6.6 L/100km" },
      { name: "Première", puissanceCv: 248, cylindree: "2487 cm³", consommation: "6.6 L/100km" },
    ]},
    "Land Cruiser": { versions: [
      { name: "Lounge", puissanceCv: 204, cylindree: "2755 cm³", consommation: "7.5 L/100km" },
      { name: "Lounge+", puissanceCv: 204, cylindree: "2755 cm³", consommation: "7.5 L/100km" },
    ]},
    "Camry": { versions: [
      { name: "Dynamic", puissanceCv: 218, cylindree: "2487 cm³", consommation: "4.9 L/100km" },
      { name: "Design", puissanceCv: 218, cylindree: "2487 cm³", consommation: "4.9 L/100km" },
      { name: "Lounge", puissanceCv: 218, cylindree: "2487 cm³", consommation: "4.9 L/100km" },
    ]},
    "bZ4X": { versions: [
      { name: "Dynamic", puissanceCv: 204, cylindree: "Électrique", consommation: "17.0 kWh/100km" },
      { name: "Design", puissanceCv: 218, cylindree: "Électrique", consommation: "18.0 kWh/100km" },
    ]},
    "Supra": { versions: [
      { name: "2.0", puissanceCv: 258, cylindree: "1998 cm³", consommation: "7.5 L/100km" },
      { name: "3.0", puissanceCv: 340, cylindree: "2998 cm³", consommation: "8.1 L/100km" },
    ]},
    "GR86": { versions: [
      { name: "Standard", puissanceCv: 234, cylindree: "2387 cm³", consommation: "8.4 L/100km" },
    ]},
    "Proace City Verso": { versions: [
      { name: "Dynamic", puissanceCv: 100, cylindree: "1499 cm³", consommation: "4.8 L/100km" },
      { name: "Design", puissanceCv: 130, cylindree: "1499 cm³", consommation: "5.0 L/100km" },
    ]},
  },

  /* ════════════════ DACIA ════════════════ */
  Dacia: {
    "Sandero": { versions: [
      { name: "Essential", puissanceCv: 65, cylindree: "999 cm³", consommation: "5.2 L/100km" },
      { name: "Expression", puissanceCv: 90, cylindree: "999 cm³", consommation: "5.3 L/100km" },
      { name: "Extreme", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.5 L/100km" },
    ]},
    "Sandero Stepway": { versions: [
      { name: "Expression", puissanceCv: 90, cylindree: "999 cm³", consommation: "5.4 L/100km" },
      { name: "Extreme", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.6 L/100km" },
      { name: "ECO-G 100", puissanceCv: 100, cylindree: "999 cm³", consommation: "6.1 L/100km" },
    ]},
    "Duster": { versions: [
      { name: "Essential", puissanceCv: 90, cylindree: "999 cm³", consommation: "5.8 L/100km" },
      { name: "Expression", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.9 L/100km" },
      { name: "Extreme", puissanceCv: 150, cylindree: "1332 cm³", consommation: "6.1 L/100km" },
      { name: "Journey", puissanceCv: 150, cylindree: "1499 cm³", consommation: "4.5 L/100km" },
      { name: "Hybrid 140", puissanceCv: 140, cylindree: "1598 cm³", consommation: "4.7 L/100km" },
    ]},
    "Jogger": { versions: [
      { name: "Essential", puissanceCv: 100, cylindree: "999 cm³", consommation: "5.6 L/100km" },
      { name: "Expression", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.7 L/100km" },
      { name: "Extreme", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.7 L/100km" },
      { name: "Hybrid 140", puissanceCv: 140, cylindree: "1598 cm³", consommation: "4.8 L/100km" },
    ]},
    "Spring": { versions: [
      { name: "Essential", puissanceCv: 45, cylindree: "Électrique", consommation: "14.0 kWh/100km" },
      { name: "Expression", puissanceCv: 65, cylindree: "Électrique", consommation: "14.6 kWh/100km" },
      { name: "Extreme", puissanceCv: 65, cylindree: "Électrique", consommation: "14.6 kWh/100km" },
    ]},
    "Logan": { versions: [
      { name: "Essential", puissanceCv: 65, cylindree: "999 cm³", consommation: "5.1 L/100km" },
      { name: "Expression", puissanceCv: 90, cylindree: "999 cm³", consommation: "5.2 L/100km" },
      { name: "Extreme", puissanceCv: 100, cylindree: "999 cm³", consommation: "5.4 L/100km" },
    ]},
  },

  /* ════════════════ TESLA ════════════════ */
  Tesla: {
    "Model 3": { versions: [
      { name: "Propulsion", puissanceCv: 283, cylindree: "Électrique", consommation: "13.9 kWh/100km" },
      { name: "Grande Autonomie", puissanceCv: 366, cylindree: "Électrique", consommation: "14.0 kWh/100km" },
      { name: "Performance", puissanceCv: 510, cylindree: "Électrique", consommation: "14.9 kWh/100km" },
    ]},
    "Model Y": { versions: [
      { name: "Propulsion", puissanceCv: 283, cylindree: "Électrique", consommation: "15.7 kWh/100km" },
      { name: "Grande Autonomie", puissanceCv: 366, cylindree: "Électrique", consommation: "15.7 kWh/100km" },
      { name: "Performance", puissanceCv: 510, cylindree: "Électrique", consommation: "16.0 kWh/100km" },
    ]},
    "Model S": { versions: [
      { name: "Grande Autonomie", puissanceCv: 670, cylindree: "Électrique", consommation: "17.5 kWh/100km" },
      { name: "Plaid", puissanceCv: 1020, cylindree: "Électrique", consommation: "18.5 kWh/100km" },
    ]},
    "Model X": { versions: [
      { name: "Grande Autonomie", puissanceCv: 670, cylindree: "Électrique", consommation: "18.4 kWh/100km" },
      { name: "Plaid", puissanceCv: 1020, cylindree: "Électrique", consommation: "19.5 kWh/100km" },
    ]},
  },

  /* ════════════════ AUTRES MARQUES (modèles principaux) ════════════════ */
  Nissan: {
    "Micra": { versions: [{ name: "Acenta", puissanceCv: 92, cylindree: "999 cm³", consommation: "4.8 L/100km" }, { name: "N-Connecta", puissanceCv: 92, cylindree: "999 cm³", consommation: "4.8 L/100km" }, { name: "Tekna", puissanceCv: 92, cylindree: "999 cm³", consommation: "4.8 L/100km" }] },
    "Juke": { versions: [{ name: "Acenta", puissanceCv: 114, cylindree: "999 cm³", consommation: "5.6 L/100km" }, { name: "N-Connecta", puissanceCv: 114, cylindree: "999 cm³", consommation: "5.6 L/100km" }, { name: "Tekna", puissanceCv: 143, cylindree: "999 cm³", consommation: "5.8 L/100km" }, { name: "Hybrid", puissanceCv: 143, cylindree: "1598 cm³", consommation: "4.8 L/100km" }] },
    "Qashqai": { versions: [{ name: "Acenta", puissanceCv: 140, cylindree: "1332 cm³", consommation: "5.8 L/100km" }, { name: "N-Connecta", puissanceCv: 158, cylindree: "1332 cm³", consommation: "5.9 L/100km" }, { name: "Tekna", puissanceCv: 158, cylindree: "1332 cm³", consommation: "5.9 L/100km" }, { name: "e-Power", puissanceCv: 190, cylindree: "1497 cm³", consommation: "5.3 L/100km" }] },
    "X-Trail": { versions: [{ name: "Acenta", puissanceCv: 204, cylindree: "1497 cm³", consommation: "5.8 L/100km" }, { name: "N-Connecta", puissanceCv: 204, cylindree: "1497 cm³", consommation: "5.8 L/100km" }, { name: "Tekna", puissanceCv: 213, cylindree: "1497 cm³", consommation: "5.9 L/100km" }] },
    "Leaf": { versions: [{ name: "Acenta", puissanceCv: 150, cylindree: "Électrique", consommation: "17.1 kWh/100km" }, { name: "N-Connecta", puissanceCv: 150, cylindree: "Électrique", consommation: "17.1 kWh/100km" }, { name: "Tekna", puissanceCv: 150, cylindree: "Électrique", consommation: "17.1 kWh/100km" }, { name: "e+ N-Connecta", puissanceCv: 217, cylindree: "Électrique", consommation: "18.5 kWh/100km" }] },
    "Ariya": { versions: [{ name: "63 kWh", puissanceCv: 218, cylindree: "Électrique", consommation: "16.9 kWh/100km" }, { name: "87 kWh", puissanceCv: 242, cylindree: "Électrique", consommation: "17.1 kWh/100km" }, { name: "87 kWh e-4ORCE", puissanceCv: 306, cylindree: "Électrique", consommation: "17.5 kWh/100km" }] },
  },
  Ford: {
    "Fiesta": { versions: [{ name: "Trend", puissanceCv: 75, cylindree: "999 cm³", consommation: "5.0 L/100km" }, { name: "Titanium", puissanceCv: 100, cylindree: "999 cm³", consommation: "5.2 L/100km" }, { name: "ST-Line", puissanceCv: 125, cylindree: "999 cm³", consommation: "5.4 L/100km" }, { name: "ST", puissanceCv: 200, cylindree: "1497 cm³", consommation: "6.6 L/100km" }] },
    "Focus": { versions: [{ name: "Trend", puissanceCv: 100, cylindree: "999 cm³", consommation: "5.2 L/100km" }, { name: "Titanium", puissanceCv: 125, cylindree: "999 cm³", consommation: "5.4 L/100km" }, { name: "ST-Line", puissanceCv: 150, cylindree: "1497 cm³", consommation: "5.8 L/100km" }, { name: "ST", puissanceCv: 280, cylindree: "2261 cm³", consommation: "7.9 L/100km" }] },
    "Puma": { versions: [{ name: "Titanium", puissanceCv: 125, cylindree: "999 cm³", consommation: "5.4 L/100km" }, { name: "ST-Line", puissanceCv: 125, cylindree: "999 cm³", consommation: "5.5 L/100km" }, { name: "ST-Line X", puissanceCv: 155, cylindree: "999 cm³", consommation: "5.8 L/100km" }, { name: "ST", puissanceCv: 200, cylindree: "1497 cm³", consommation: "6.8 L/100km" }] },
    "Kuga": { versions: [{ name: "Titanium", puissanceCv: 150, cylindree: "1497 cm³", consommation: "5.8 L/100km" }, { name: "ST-Line", puissanceCv: 150, cylindree: "1497 cm³", consommation: "5.9 L/100km" }, { name: "Vignale", puissanceCv: 190, cylindree: "1997 cm³", consommation: "4.5 L/100km" }, { name: "PHEV ST-Line", puissanceCv: 225, cylindree: "2488 cm³", consommation: "1.2 L/100km" }] },
    "Mustang": { versions: [{ name: "EcoBoost", puissanceCv: 330, cylindree: "2261 cm³", consommation: "9.0 L/100km" }, { name: "GT 5.0 V8", puissanceCv: 450, cylindree: "4951 cm³", consommation: "12.4 L/100km" }, { name: "Mach 1", puissanceCv: 460, cylindree: "4951 cm³", consommation: "12.8 L/100km" }] },
    "Mustang Mach-E": { versions: [{ name: "Standard Range", puissanceCv: 269, cylindree: "Électrique", consommation: "16.5 kWh/100km" }, { name: "Extended Range", puissanceCv: 294, cylindree: "Électrique", consommation: "16.5 kWh/100km" }, { name: "GT", puissanceCv: 487, cylindree: "Électrique", consommation: "18.0 kWh/100km" }] },
    "Explorer": { versions: [{ name: "Standard Range", puissanceCv: 170, cylindree: "Électrique", consommation: "16.5 kWh/100km" }, { name: "Extended Range", puissanceCv: 286, cylindree: "Électrique", consommation: "16.5 kWh/100km" }] },
  },
  Hyundai: {
    "i10": { versions: [{ name: "Initia", puissanceCv: 67, cylindree: "998 cm³", consommation: "4.6 L/100km" }, { name: "Intuitive", puissanceCv: 67, cylindree: "998 cm³", consommation: "4.6 L/100km" }, { name: "Creative", puissanceCv: 84, cylindree: "1197 cm³", consommation: "5.0 L/100km" }, { name: "N Line", puissanceCv: 100, cylindree: "998 cm³", consommation: "5.3 L/100km" }] },
    "i20": { versions: [{ name: "Initia", puissanceCv: 84, cylindree: "1197 cm³", consommation: "5.0 L/100km" }, { name: "Intuitive", puissanceCv: 100, cylindree: "998 cm³", consommation: "5.2 L/100km" }, { name: "Creative", puissanceCv: 120, cylindree: "998 cm³", consommation: "5.5 L/100km" }, { name: "N Line", puissanceCv: 120, cylindree: "998 cm³", consommation: "5.5 L/100km" }, { name: "N", puissanceCv: 204, cylindree: "1598 cm³", consommation: "7.1 L/100km" }] },
    "i30": { versions: [{ name: "Initia", puissanceCv: 110, cylindree: "1353 cm³", consommation: "5.4 L/100km" }, { name: "Intuitive", puissanceCv: 120, cylindree: "998 cm³", consommation: "5.6 L/100km" }, { name: "Creative", puissanceCv: 159, cylindree: "1482 cm³", consommation: "5.8 L/100km" }, { name: "N Line", puissanceCv: 159, cylindree: "1482 cm³", consommation: "5.9 L/100km" }, { name: "N", puissanceCv: 280, cylindree: "1998 cm³", consommation: "8.0 L/100km" }] },
    "Kona": { versions: [{ name: "Intuitive", puissanceCv: 120, cylindree: "998 cm³", consommation: "5.5 L/100km" }, { name: "Creative", puissanceCv: 141, cylindree: "1598 cm³", consommation: "4.7 L/100km" }, { name: "N Line", puissanceCv: 198, cylindree: "1598 cm³", consommation: "5.5 L/100km" }, { name: "Électrique 48 kWh", puissanceCv: 136, cylindree: "Électrique", consommation: "14.7 kWh/100km" }, { name: "Électrique 65 kWh", puissanceCv: 204, cylindree: "Électrique", consommation: "14.7 kWh/100km" }] },
    "Tucson": { versions: [{ name: "Intuitive", puissanceCv: 150, cylindree: "1598 cm³", consommation: "5.8 L/100km" }, { name: "Creative", puissanceCv: 180, cylindree: "1598 cm³", consommation: "4.8 L/100km" }, { name: "N Line", puissanceCv: 180, cylindree: "1598 cm³", consommation: "4.9 L/100km" }, { name: "Plug-in Hybrid", puissanceCv: 265, cylindree: "1598 cm³", consommation: "1.4 L/100km" }] },
    "Santa Fe": { versions: [{ name: "Intuitive", puissanceCv: 180, cylindree: "1598 cm³", consommation: "5.1 L/100km" }, { name: "Creative", puissanceCv: 215, cylindree: "1598 cm³", consommation: "5.3 L/100km" }, { name: "Plug-in Hybrid", puissanceCv: 265, cylindree: "1598 cm³", consommation: "1.6 L/100km" }] },
    "IONIQ 5": { versions: [{ name: "58 kWh Propulsion", puissanceCv: 170, cylindree: "Électrique", consommation: "16.7 kWh/100km" }, { name: "77 kWh Propulsion", puissanceCv: 229, cylindree: "Électrique", consommation: "16.8 kWh/100km" }, { name: "77 kWh AWD", puissanceCv: 325, cylindree: "Électrique", consommation: "17.9 kWh/100km" }, { name: "N", puissanceCv: 650, cylindree: "Électrique", consommation: "19.5 kWh/100km" }] },
    "IONIQ 6": { versions: [{ name: "53 kWh Propulsion", puissanceCv: 151, cylindree: "Électrique", consommation: "14.3 kWh/100km" }, { name: "77 kWh Propulsion", puissanceCv: 229, cylindree: "Électrique", consommation: "14.3 kWh/100km" }, { name: "77 kWh AWD", puissanceCv: 325, cylindree: "Électrique", consommation: "15.1 kWh/100km" }] },
  },
  Kia: {
    "Picanto": { versions: [{ name: "Motion", puissanceCv: 67, cylindree: "998 cm³", consommation: "4.6 L/100km" }, { name: "Active", puissanceCv: 67, cylindree: "998 cm³", consommation: "4.6 L/100km" }, { name: "GT-Line", puissanceCv: 100, cylindree: "998 cm³", consommation: "5.2 L/100km" }] },
    "Rio": { versions: [{ name: "Motion", puissanceCv: 84, cylindree: "1197 cm³", consommation: "5.0 L/100km" }, { name: "Active", puissanceCv: 100, cylindree: "998 cm³", consommation: "5.2 L/100km" }, { name: "GT-Line", puissanceCv: 120, cylindree: "998 cm³", consommation: "5.5 L/100km" }] },
    "Ceed": { versions: [{ name: "Motion", puissanceCv: 110, cylindree: "1353 cm³", consommation: "5.4 L/100km" }, { name: "Active", puissanceCv: 120, cylindree: "998 cm³", consommation: "5.6 L/100km" }, { name: "GT-Line", puissanceCv: 159, cylindree: "1482 cm³", consommation: "5.9 L/100km" }] },
    "Sportage": { versions: [{ name: "Motion", puissanceCv: 150, cylindree: "1598 cm³", consommation: "5.8 L/100km" }, { name: "Active", puissanceCv: 180, cylindree: "1598 cm³", consommation: "4.8 L/100km" }, { name: "GT-Line", puissanceCv: 180, cylindree: "1598 cm³", consommation: "4.9 L/100km" }, { name: "Plug-in Hybrid", puissanceCv: 265, cylindree: "1598 cm³", consommation: "1.1 L/100km" }] },
    "Sorento": { versions: [{ name: "Motion", puissanceCv: 202, cylindree: "1598 cm³", consommation: "5.2 L/100km" }, { name: "Active", puissanceCv: 202, cylindree: "1598 cm³", consommation: "5.2 L/100km" }, { name: "GT-Line", puissanceCv: 202, cylindree: "1598 cm³", consommation: "5.3 L/100km" }, { name: "Plug-in Hybrid", puissanceCv: 265, cylindree: "1598 cm³", consommation: "1.6 L/100km" }] },
    "Niro": { versions: [{ name: "Motion HEV", puissanceCv: 141, cylindree: "1580 cm³", consommation: "4.4 L/100km" }, { name: "Active PHEV", puissanceCv: 183, cylindree: "1580 cm³", consommation: "1.2 L/100km" }, { name: "EV 64 kWh", puissanceCv: 204, cylindree: "Électrique", consommation: "16.2 kWh/100km" }] },
    "EV6": { versions: [{ name: "58 kWh Propulsion", puissanceCv: 170, cylindree: "Électrique", consommation: "16.5 kWh/100km" }, { name: "77 kWh Propulsion", puissanceCv: 229, cylindree: "Électrique", consommation: "16.5 kWh/100km" }, { name: "77 kWh AWD", puissanceCv: 325, cylindree: "Électrique", consommation: "17.2 kWh/100km" }, { name: "GT", puissanceCv: 585, cylindree: "Électrique", consommation: "19.3 kWh/100km" }] },
    "EV9": { versions: [{ name: "76 kWh Propulsion", puissanceCv: 204, cylindree: "Électrique", consommation: "19.4 kWh/100km" }, { name: "99 kWh Propulsion", puissanceCv: 204, cylindree: "Électrique", consommation: "19.4 kWh/100km" }, { name: "99 kWh AWD", puissanceCv: 384, cylindree: "Électrique", consommation: "20.6 kWh/100km" }] },
  },
  Fiat: {
    "500": { versions: [{ name: "Pop", puissanceCv: 69, cylindree: "999 cm³", consommation: "4.6 L/100km" }, { name: "Lounge", puissanceCv: 69, cylindree: "999 cm³", consommation: "4.6 L/100km" }, { name: "Sport", puissanceCv: 69, cylindree: "999 cm³", consommation: "4.6 L/100km" }, { name: "(RED)", puissanceCv: 95, cylindree: "999 cm³", consommation: "5.0 L/100km" }] },
    "500 Électrique": { versions: [{ name: "Action", puissanceCv: 95, cylindree: "Électrique", consommation: "13.0 kWh/100km" }, { name: "Passion", puissanceCv: 118, cylindree: "Électrique", consommation: "14.0 kWh/100km" }, { name: "Icon", puissanceCv: 118, cylindree: "Électrique", consommation: "14.0 kWh/100km" }, { name: "La Prima", puissanceCv: 118, cylindree: "Électrique", consommation: "14.0 kWh/100km" }] },
    "500X": { versions: [{ name: "Pop", puissanceCv: 130, cylindree: "999 cm³", consommation: "5.4 L/100km" }, { name: "Cross", puissanceCv: 130, cylindree: "999 cm³", consommation: "5.5 L/100km" }, { name: "Sport", puissanceCv: 150, cylindree: "1332 cm³", consommation: "5.7 L/100km" }] },
    "Tipo": { versions: [{ name: "Life", puissanceCv: 100, cylindree: "999 cm³", consommation: "5.2 L/100km" }, { name: "City Life", puissanceCv: 100, cylindree: "999 cm³", consommation: "5.2 L/100km" }, { name: "Cross", puissanceCv: 130, cylindree: "999 cm³", consommation: "5.6 L/100km" }, { name: "Sport", puissanceCv: 130, cylindree: "999 cm³", consommation: "5.6 L/100km" }] },
    "Panda": { versions: [{ name: "Pop", puissanceCv: 69, cylindree: "999 cm³", consommation: "4.6 L/100km" }, { name: "Lounge", puissanceCv: 69, cylindree: "999 cm³", consommation: "4.6 L/100km" }, { name: "Cross", puissanceCv: 69, cylindree: "999 cm³", consommation: "4.8 L/100km" }, { name: "Sport", puissanceCv: 69, cylindree: "999 cm³", consommation: "4.8 L/100km" }] },
    "600e": { versions: [{ name: "Red", puissanceCv: 156, cylindree: "Électrique", consommation: "15.0 kWh/100km" }, { name: "La Prima", puissanceCv: 156, cylindree: "Électrique", consommation: "15.0 kWh/100km" }] },
  },
  Opel: {
    "Corsa": { versions: [{ name: "Edition", puissanceCv: 75, cylindree: "1199 cm³", consommation: "4.8 L/100km" }, { name: "Elegance", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.0 L/100km" }, { name: "GS Line", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.2 L/100km" }, { name: "Corsa-e", puissanceCv: 136, cylindree: "Électrique", consommation: "15.8 kWh/100km" }] },
    "Astra": { versions: [{ name: "Edition", puissanceCv: 110, cylindree: "1199 cm³", consommation: "5.3 L/100km" }, { name: "Elegance", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" }, { name: "GS Line", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" }, { name: "Ultimate", puissanceCv: 180, cylindree: "1598 cm³", consommation: "5.9 L/100km" }, { name: "Hybrid 180", puissanceCv: 180, cylindree: "1598 cm³", consommation: "1.2 L/100km" }, { name: "Hybrid 225", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.1 L/100km" }, { name: "Astra-e", puissanceCv: 156, cylindree: "Électrique", consommation: "16.0 kWh/100km" }] },
    "Mokka": { versions: [{ name: "Edition", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.2 L/100km" }, { name: "Elegance", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" }, { name: "GS Line", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.5 L/100km" }, { name: "Mokka-e", puissanceCv: 136, cylindree: "Électrique", consommation: "17.0 kWh/100km" }] },
    "Grandland": { versions: [{ name: "Edition", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.7 L/100km" }, { name: "Elegance", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.3 L/100km" }, { name: "GS Line", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.3 L/100km" }, { name: "Hybrid4 300", puissanceCv: 300, cylindree: "1598 cm³", consommation: "1.5 L/100km" }, { name: "Grandland-e", puissanceCv: 215, cylindree: "Électrique", consommation: "16.5 kWh/100km" }] },
    "Combo Life": { versions: [{ name: "Edition", puissanceCv: 100, cylindree: "1499 cm³", consommation: "4.8 L/100km" }, { name: "Elegance", puissanceCv: 130, cylindree: "1499 cm³", consommation: "5.0 L/100km" }, { name: "Combo-e Life", puissanceCv: 136, cylindree: "Électrique", consommation: "21.0 kWh/100km" }] },
  },
  Volvo: {
    "XC40": { versions: [{ name: "Core", puissanceCv: 163, cylindree: "1969 cm³", consommation: "6.0 L/100km" }, { name: "Plus", puissanceCv: 197, cylindree: "1969 cm³", consommation: "6.2 L/100km" }, { name: "Ultra", puissanceCv: 197, cylindree: "1969 cm³", consommation: "6.2 L/100km" }, { name: "Recharge Pure Electric", puissanceCv: 231, cylindree: "Électrique", consommation: "17.0 kWh/100km" }] },
    "XC60": { versions: [{ name: "Core", puissanceCv: 197, cylindree: "1969 cm³", consommation: "6.5 L/100km" }, { name: "Plus", puissanceCv: 250, cylindree: "1969 cm³", consommation: "6.8 L/100km" }, { name: "Ultra", puissanceCv: 250, cylindree: "1969 cm³", consommation: "6.8 L/100km" }, { name: "Recharge T8 PHEV", puissanceCv: 462, cylindree: "1969 cm³", consommation: "1.8 L/100km" }] },
    "XC90": { versions: [{ name: "Core", puissanceCv: 250, cylindree: "1969 cm³", consommation: "7.0 L/100km" }, { name: "Plus", puissanceCv: 250, cylindree: "1969 cm³", consommation: "7.0 L/100km" }, { name: "Ultra", puissanceCv: 300, cylindree: "1969 cm³", consommation: "7.2 L/100km" }, { name: "Recharge T8 PHEV", puissanceCv: 462, cylindree: "1969 cm³", consommation: "2.0 L/100km" }] },
    "EX30": { versions: [{ name: "Single Motor", puissanceCv: 272, cylindree: "Électrique", consommation: "15.7 kWh/100km" }, { name: "Twin Motor Performance", puissanceCv: 428, cylindree: "Électrique", consommation: "16.7 kWh/100km" }] },
    "EX40": { versions: [{ name: "Single Motor", puissanceCv: 238, cylindree: "Électrique", consommation: "17.0 kWh/100km" }, { name: "Twin Motor", puissanceCv: 408, cylindree: "Électrique", consommation: "18.0 kWh/100km" }] },
    "EX90": { versions: [{ name: "Single Motor", puissanceCv: 279, cylindree: "Électrique", consommation: "18.6 kWh/100km" }, { name: "Twin Motor Performance", puissanceCv: 517, cylindree: "Électrique", consommation: "19.5 kWh/100km" }] },
  },
  "DS Automobiles": {
    "DS 3 Crossback": { versions: [{ name: "So Chic", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.2 L/100km" }, { name: "Grand Chic", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.4 L/100km" }, { name: "Performance Line", puissanceCv: 155, cylindree: "1499 cm³", consommation: "4.0 L/100km" }, { name: "E-TENSE", puissanceCv: 136, cylindree: "Électrique", consommation: "15.8 kWh/100km" }] },
    "DS 4": { versions: [{ name: "Bastille", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.4 L/100km" }, { name: "Trocadéro", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.0 L/100km" }, { name: "Rivoli", puissanceCv: 180, cylindree: "1598 cm³", consommation: "5.9 L/100km" }, { name: "Performance Line", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.3 L/100km" }] },
    "DS 7": { versions: [{ name: "Bastille", puissanceCv: 130, cylindree: "1199 cm³", consommation: "5.9 L/100km" }, { name: "Rivoli", puissanceCv: 130, cylindree: "1499 cm³", consommation: "4.5 L/100km" }, { name: "Performance Line", puissanceCv: 180, cylindree: "1598 cm³", consommation: "6.2 L/100km" }, { name: "E-TENSE 4x4 300", puissanceCv: 300, cylindree: "1598 cm³", consommation: "1.5 L/100km" }] },
    "DS 9": { versions: [{ name: "Rivoli", puissanceCv: 225, cylindree: "1598 cm³", consommation: "1.3 L/100km" }, { name: "Performance Line", puissanceCv: 250, cylindree: "1598 cm³", consommation: "1.4 L/100km" }, { name: "E-TENSE 4x4 360", puissanceCv: 360, cylindree: "1598 cm³", consommation: "1.4 L/100km" }] },
  },
  Skoda: {
    "Fabia": { versions: [{ name: "Active", puissanceCv: 80, cylindree: "999 cm³", consommation: "4.9 L/100km" }, { name: "Ambition", puissanceCv: 95, cylindree: "999 cm³", consommation: "5.0 L/100km" }, { name: "Style", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.2 L/100km" }, { name: "Monte Carlo", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.7 L/100km" }] },
    "Octavia": { versions: [{ name: "Active", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.3 L/100km" }, { name: "Ambition", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.5 L/100km" }, { name: "Style", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.5 L/100km" }, { name: "RS", puissanceCv: 245, cylindree: "1984 cm³", consommation: "7.1 L/100km" }, { name: "RS iV", puissanceCv: 245, cylindree: "1395 cm³", consommation: "1.2 L/100km" }] },
    "Superb": { versions: [{ name: "Ambition", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.6 L/100km" }, { name: "Style", puissanceCv: 190, cylindree: "1984 cm³", consommation: "5.9 L/100km" }, { name: "Laurin & Klement", puissanceCv: 190, cylindree: "1984 cm³", consommation: "5.9 L/100km" }, { name: "iV", puissanceCv: 218, cylindree: "1395 cm³", consommation: "1.3 L/100km" }] },
    "Kamiq": { versions: [{ name: "Active", puissanceCv: 95, cylindree: "999 cm³", consommation: "5.3 L/100km" }, { name: "Ambition", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.5 L/100km" }, { name: "Style", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.8 L/100km" }, { name: "Monte Carlo", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.8 L/100km" }] },
    "Karoq": { versions: [{ name: "Ambition", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.6 L/100km" }, { name: "Style", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.9 L/100km" }, { name: "Sportline", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.3 L/100km" }] },
    "Kodiaq": { versions: [{ name: "Ambition", puissanceCv: 150, cylindree: "1498 cm³", consommation: "6.0 L/100km" }, { name: "Style", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.4 L/100km" }, { name: "Sportline", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.4 L/100km" }, { name: "RS", puissanceCv: 245, cylindree: "1984 cm³", consommation: "7.3 L/100km" }] },
    "Enyaq": { versions: [{ name: "60", puissanceCv: 177, cylindree: "Électrique", consommation: "16.3 kWh/100km" }, { name: "80", puissanceCv: 204, cylindree: "Électrique", consommation: "16.3 kWh/100km" }, { name: "80x", puissanceCv: 265, cylindree: "Électrique", consommation: "16.7 kWh/100km" }, { name: "RS", puissanceCv: 299, cylindree: "Électrique", consommation: "17.0 kWh/100km" }] },
  },
  Seat: {
    "Ibiza": { versions: [{ name: "Reference", puissanceCv: 80, cylindree: "999 cm³", consommation: "4.9 L/100km" }, { name: "Style", puissanceCv: 95, cylindree: "999 cm³", consommation: "5.0 L/100km" }, { name: "FR", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.2 L/100km" }, { name: "Xcellence", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.2 L/100km" }] },
    "Leon": { versions: [{ name: "Reference", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.3 L/100km" }, { name: "Style", puissanceCv: 130, cylindree: "1498 cm³", consommation: "5.5 L/100km" }, { name: "FR", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.7 L/100km" }, { name: "Xcellence", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.7 L/100km" }, { name: "e-HYBRID", puissanceCv: 204, cylindree: "1395 cm³", consommation: "1.2 L/100km" }] },
    "Arona": { versions: [{ name: "Reference", puissanceCv: 95, cylindree: "999 cm³", consommation: "5.3 L/100km" }, { name: "Style", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.5 L/100km" }, { name: "FR", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.5 L/100km" }, { name: "Xcellence", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.5 L/100km" }] },
    "Ateca": { versions: [{ name: "Reference", puissanceCv: 110, cylindree: "999 cm³", consommation: "5.6 L/100km" }, { name: "Style", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.9 L/100km" }, { name: "FR", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.9 L/100km" }, { name: "Xcellence", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.4 L/100km" }] },
    "Tarraco": { versions: [{ name: "Style", puissanceCv: 150, cylindree: "1498 cm³", consommation: "6.0 L/100km" }, { name: "FR", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.4 L/100km" }, { name: "Xcellence", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.4 L/100km" }, { name: "e-HYBRID", puissanceCv: 245, cylindree: "1395 cm³", consommation: "1.6 L/100km" }] },
  },
  Cupra: {
    "Formentor": { versions: [{ name: "1.5 TSI 150", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.7 L/100km" }, { name: "2.0 TSI 190", puissanceCv: 190, cylindree: "1984 cm³", consommation: "6.3 L/100km" }, { name: "e-HYBRID 204", puissanceCv: 204, cylindree: "1395 cm³", consommation: "1.4 L/100km" }, { name: "VZ 2.0 TSI 310", puissanceCv: 310, cylindree: "1984 cm³", consommation: "7.5 L/100km" }] },
    "Leon": { versions: [{ name: "1.5 TSI 150", puissanceCv: 150, cylindree: "1498 cm³", consommation: "5.6 L/100km" }, { name: "e-HYBRID 204", puissanceCv: 204, cylindree: "1395 cm³", consommation: "1.2 L/100km" }, { name: "VZ 2.0 TSI 300", puissanceCv: 300, cylindree: "1984 cm³", consommation: "7.4 L/100km" }] },
    "Born": { versions: [{ name: "150 kW", puissanceCv: 204, cylindree: "Électrique", consommation: "15.8 kWh/100km" }, { name: "170 kW", puissanceCv: 231, cylindree: "Électrique", consommation: "16.0 kWh/100km" }, { name: "VZ", puissanceCv: 231, cylindree: "Électrique", consommation: "16.2 kWh/100km" }] },
    "Tavascan": { versions: [{ name: "Endurance", puissanceCv: 286, cylindree: "Électrique", consommation: "17.0 kWh/100km" }, { name: "VZ", puissanceCv: 340, cylindree: "Électrique", consommation: "17.5 kWh/100km" }] },
  },
  Porsche: {
    "Macan": { versions: [{ name: "Macan", puissanceCv: 265, cylindree: "1984 cm³", consommation: "8.1 L/100km" }, { name: "Macan S", puissanceCv: 380, cylindree: "2894 cm³", consommation: "9.0 L/100km" }, { name: "Macan GTS", puissanceCv: 440, cylindree: "2894 cm³", consommation: "9.5 L/100km" }, { name: "Macan Électrique", puissanceCv: 408, cylindree: "Électrique", consommation: "18.0 kWh/100km" }, { name: "Macan Turbo Électrique", puissanceCv: 639, cylindree: "Électrique", consommation: "19.0 kWh/100km" }] },
    "Cayenne": { versions: [{ name: "Cayenne", puissanceCv: 353, cylindree: "2995 cm³", consommation: "9.2 L/100km" }, { name: "Cayenne S", puissanceCv: 474, cylindree: "2894 cm³", consommation: "10.1 L/100km" }, { name: "Cayenne E-Hybrid", puissanceCv: 470, cylindree: "2995 cm³", consommation: "3.7 L/100km" }, { name: "Cayenne Turbo E-Hybrid", puissanceCv: 739, cylindree: "3996 cm³", consommation: "4.2 L/100km" }] },
    "911": { versions: [{ name: "Carrera", puissanceCv: 385, cylindree: "2981 cm³", consommation: "9.0 L/100km" }, { name: "Carrera S", puissanceCv: 450, cylindree: "2981 cm³", consommation: "9.2 L/100km" }, { name: "Carrera 4S", puissanceCv: 450, cylindree: "2981 cm³", consommation: "9.5 L/100km" }, { name: "Turbo", puissanceCv: 580, cylindree: "3745 cm³", consommation: "10.5 L/100km" }, { name: "Turbo S", puissanceCv: 650, cylindree: "3745 cm³", consommation: "10.8 L/100km" }, { name: "GT3", puissanceCv: 510, cylindree: "3996 cm³", consommation: "12.4 L/100km" }] },
    "Taycan": { versions: [{ name: "Taycan", puissanceCv: 408, cylindree: "Électrique", consommation: "19.6 kWh/100km" }, { name: "Taycan 4S", puissanceCv: 530, cylindree: "Électrique", consommation: "20.0 kWh/100km" }, { name: "Taycan GTS", puissanceCv: 598, cylindree: "Électrique", consommation: "20.3 kWh/100km" }, { name: "Taycan Turbo", puissanceCv: 680, cylindree: "Électrique", consommation: "20.6 kWh/100km" }, { name: "Taycan Turbo S", puissanceCv: 761, cylindree: "Électrique", consommation: "21.0 kWh/100km" }] },
    "Panamera": { versions: [{ name: "Panamera", puissanceCv: 353, cylindree: "2894 cm³", consommation: "8.8 L/100km" }, { name: "Panamera 4S E-Hybrid", puissanceCv: 560, cylindree: "2894 cm³", consommation: "2.5 L/100km" }, { name: "Panamera Turbo E-Hybrid", puissanceCv: 680, cylindree: "3996 cm³", consommation: "2.8 L/100km" }] },
  },
  "Alfa Romeo": {
    "Giulia": { versions: [{ name: "Super", puissanceCv: 160, cylindree: "1995 cm³", consommation: "4.7 L/100km" }, { name: "Sprint", puissanceCv: 160, cylindree: "1995 cm³", consommation: "4.7 L/100km" }, { name: "Ti", puissanceCv: 190, cylindree: "2143 cm³", consommation: "5.0 L/100km" }, { name: "Veloce", puissanceCv: 280, cylindree: "1995 cm³", consommation: "6.6 L/100km" }, { name: "Quadrifoglio", puissanceCv: 510, cylindree: "2891 cm³", consommation: "9.5 L/100km" }] },
    "Stelvio": { versions: [{ name: "Super", puissanceCv: 160, cylindree: "1995 cm³", consommation: "5.2 L/100km" }, { name: "Sprint", puissanceCv: 190, cylindree: "2143 cm³", consommation: "5.4 L/100km" }, { name: "Ti", puissanceCv: 210, cylindree: "2143 cm³", consommation: "5.6 L/100km" }, { name: "Veloce", puissanceCv: 280, cylindree: "1995 cm³", consommation: "7.2 L/100km" }, { name: "Quadrifoglio", puissanceCv: 510, cylindree: "2891 cm³", consommation: "10.0 L/100km" }] },
    "Tonale": { versions: [{ name: "Super", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.8 L/100km" }, { name: "Sprint", puissanceCv: 160, cylindree: "1332 cm³", consommation: "6.0 L/100km" }, { name: "Ti", puissanceCv: 160, cylindree: "1332 cm³", consommation: "6.0 L/100km" }, { name: "Veloce", puissanceCv: 160, cylindree: "1332 cm³", consommation: "6.0 L/100km" }, { name: "Plug-in Hybrid Q4", puissanceCv: 275, cylindree: "1332 cm³", consommation: "1.5 L/100km" }] },
    "Junior": { versions: [{ name: "Ibrida", puissanceCv: 136, cylindree: "1199 cm³", consommation: "5.0 L/100km" }, { name: "Elettrica", puissanceCv: 156, cylindree: "Électrique", consommation: "15.0 kWh/100km" }, { name: "Veloce Elettrica", puissanceCv: 240, cylindree: "Électrique", consommation: "15.5 kWh/100km" }] },
  },
  Mazda: {
    "Mazda2": { versions: [{ name: "Elegance", puissanceCv: 90, cylindree: "1496 cm³", consommation: "4.9 L/100km" }, { name: "Signature", puissanceCv: 115, cylindree: "1496 cm³", consommation: "5.3 L/100km" }, { name: "Hybrid", puissanceCv: 116, cylindree: "1490 cm³", consommation: "3.8 L/100km" }] },
    "Mazda3": { versions: [{ name: "Elegance", puissanceCv: 122, cylindree: "1998 cm³", consommation: "5.5 L/100km" }, { name: "Signature", puissanceCv: 186, cylindree: "1998 cm³", consommation: "6.0 L/100km" }, { name: "e-Skyactiv X", puissanceCv: 186, cylindree: "1998 cm³", consommation: "5.7 L/100km" }] },
    "CX-30": { versions: [{ name: "Elegance", puissanceCv: 122, cylindree: "1998 cm³", consommation: "5.6 L/100km" }, { name: "Signature", puissanceCv: 186, cylindree: "1998 cm³", consommation: "6.1 L/100km" }, { name: "e-Skyactiv X", puissanceCv: 186, cylindree: "1998 cm³", consommation: "5.8 L/100km" }] },
    "CX-5": { versions: [{ name: "Elegance", puissanceCv: 165, cylindree: "1998 cm³", consommation: "6.2 L/100km" }, { name: "Signature", puissanceCv: 194, cylindree: "2488 cm³", consommation: "6.5 L/100km" }, { name: "Homura", puissanceCv: 194, cylindree: "2488 cm³", consommation: "6.5 L/100km" }] },
    "CX-60": { versions: [{ name: "Exclusive-Line", puissanceCv: 200, cylindree: "3283 cm³", consommation: "5.4 L/100km" }, { name: "Takumi", puissanceCv: 200, cylindree: "3283 cm³", consommation: "5.4 L/100km" }, { name: "Homura", puissanceCv: 241, cylindree: "3283 cm³", consommation: "5.6 L/100km" }, { name: "PHEV", puissanceCv: 327, cylindree: "2488 cm³", consommation: "1.5 L/100km" }] },
    "MX-5": { versions: [{ name: "Signature", puissanceCv: 132, cylindree: "1496 cm³", consommation: "6.5 L/100km" }, { name: "Homura", puissanceCv: 184, cylindree: "1998 cm³", consommation: "7.0 L/100km" }] },
  },
  Honda: {
    "Jazz": { versions: [{ name: "Elegance", puissanceCv: 109, cylindree: "1498 cm³", consommation: "4.5 L/100km" }, { name: "Executive", puissanceCv: 109, cylindree: "1498 cm³", consommation: "4.5 L/100km" }, { name: "Crosstar", puissanceCv: 109, cylindree: "1498 cm³", consommation: "4.8 L/100km" }] },
    "Civic": { versions: [{ name: "Elegance", puissanceCv: 143, cylindree: "1993 cm³", consommation: "5.0 L/100km" }, { name: "Sport", puissanceCv: 143, cylindree: "1993 cm³", consommation: "5.0 L/100km" }, { name: "Advance", puissanceCv: 184, cylindree: "1993 cm³", consommation: "4.7 L/100km" }, { name: "Type R", puissanceCv: 329, cylindree: "1996 cm³", consommation: "8.2 L/100km" }] },
    "HR-V": { versions: [{ name: "Elegance", puissanceCv: 131, cylindree: "1498 cm³", consommation: "5.4 L/100km" }, { name: "Executive", puissanceCv: 131, cylindree: "1498 cm³", consommation: "5.4 L/100km" }, { name: "Advance", puissanceCv: 131, cylindree: "1498 cm³", consommation: "5.4 L/100km" }] },
    "CR-V": { versions: [{ name: "Elegance", puissanceCv: 184, cylindree: "1993 cm³", consommation: "5.4 L/100km" }, { name: "Executive", puissanceCv: 184, cylindree: "1993 cm³", consommation: "5.4 L/100km" }, { name: "Advance", puissanceCv: 184, cylindree: "1993 cm³", consommation: "5.4 L/100km" }] },
    "ZR-V": { versions: [{ name: "Elegance", puissanceCv: 184, cylindree: "1993 cm³", consommation: "5.8 L/100km" }, { name: "Executive", puissanceCv: 184, cylindree: "1993 cm³", consommation: "5.8 L/100km" }, { name: "Sport", puissanceCv: 184, cylindree: "1993 cm³", consommation: "5.8 L/100km" }] },
    "e:Ny1": { versions: [{ name: "Elegance", puissanceCv: 204, cylindree: "Électrique", consommation: "17.0 kWh/100km" }, { name: "Advance", puissanceCv: 204, cylindree: "Électrique", consommation: "17.0 kWh/100km" }] },
  },
  Mini: {
    "Mini 3 portes": { versions: [{ name: "One", puissanceCv: 102, cylindree: "1499 cm³", consommation: "5.5 L/100km" }, { name: "Cooper", puissanceCv: 136, cylindree: "1499 cm³", consommation: "5.7 L/100km" }, { name: "Cooper S", puissanceCv: 178, cylindree: "1998 cm³", consommation: "6.3 L/100km" }, { name: "JCW", puissanceCv: 231, cylindree: "1998 cm³", consommation: "7.0 L/100km" }, { name: "Cooper SE Électrique", puissanceCv: 184, cylindree: "Électrique", consommation: "14.9 kWh/100km" }] },
    "Mini Countryman": { versions: [{ name: "One", puissanceCv: 136, cylindree: "1499 cm³", consommation: "5.9 L/100km" }, { name: "Cooper", puissanceCv: 170, cylindree: "1499 cm³", consommation: "6.1 L/100km" }, { name: "Cooper S", puissanceCv: 218, cylindree: "1998 cm³", consommation: "6.8 L/100km" }, { name: "JCW ALL4", puissanceCv: 300, cylindree: "1998 cm³", consommation: "7.9 L/100km" }, { name: "Countryman SE ALL4 PHEV", puissanceCv: 204, cylindree: "1499 cm³", consommation: "1.5 L/100km" }, { name: "Countryman E Électrique", puissanceCv: 204, cylindree: "Électrique", consommation: "16.8 kWh/100km" }] },
    "Mini Clubman": { versions: [{ name: "One", puissanceCv: 102, cylindree: "1499 cm³", consommation: "5.6 L/100km" }, { name: "Cooper", puissanceCv: 136, cylindree: "1499 cm³", consommation: "5.8 L/100km" }, { name: "Cooper S", puissanceCv: 178, cylindree: "1998 cm³", consommation: "6.4 L/100km" }, { name: "JCW ALL4", puissanceCv: 306, cylindree: "1998 cm³", consommation: "8.0 L/100km" }] },
  },
  Jeep: {
    "Renegade": { versions: [{ name: "Longitude", puissanceCv: 130, cylindree: "999 cm³", consommation: "5.7 L/100km" }, { name: "Limited", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.9 L/100km" }, { name: "Trailhawk", puissanceCv: 190, cylindree: "1332 cm³", consommation: "6.5 L/100km" }, { name: "4xe", puissanceCv: 240, cylindree: "1332 cm³", consommation: "1.9 L/100km" }] },
    "Compass": { versions: [{ name: "Longitude", puissanceCv: 130, cylindree: "1332 cm³", consommation: "5.9 L/100km" }, { name: "Limited", puissanceCv: 150, cylindree: "1332 cm³", consommation: "6.1 L/100km" }, { name: "Trailhawk", puissanceCv: 190, cylindree: "1332 cm³", consommation: "6.5 L/100km" }, { name: "4xe", puissanceCv: 240, cylindree: "1332 cm³", consommation: "1.9 L/100km" }] },
    "Avenger": { versions: [{ name: "Longitude", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.2 L/100km" }, { name: "Altitude", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.2 L/100km" }, { name: "Summit", puissanceCv: 100, cylindree: "1199 cm³", consommation: "5.2 L/100km" }, { name: "Électrique", puissanceCv: 156, cylindree: "Électrique", consommation: "15.0 kWh/100km" }] },
    "Wrangler": { versions: [{ name: "Sport", puissanceCv: 272, cylindree: "1995 cm³", consommation: "8.2 L/100km" }, { name: "Sahara", puissanceCv: 272, cylindree: "1995 cm³", consommation: "8.2 L/100km" }, { name: "Rubicon", puissanceCv: 272, cylindree: "1995 cm³", consommation: "8.5 L/100km" }, { name: "4xe", puissanceCv: 380, cylindree: "1995 cm³", consommation: "3.5 L/100km" }] },
    "Grand Cherokee": { versions: [{ name: "Limited", puissanceCv: 272, cylindree: "1995 cm³", consommation: "7.5 L/100km" }, { name: "Overland", puissanceCv: 272, cylindree: "1995 cm³", consommation: "7.5 L/100km" }, { name: "Summit", puissanceCv: 272, cylindree: "1995 cm³", consommation: "7.5 L/100km" }, { name: "4xe", puissanceCv: 381, cylindree: "1995 cm³", consommation: "2.8 L/100km" }] },
  },
  "Land Rover": {
    "Defender": { versions: [{ name: "90 D200", puissanceCv: 200, cylindree: "2996 cm³", consommation: "7.6 L/100km" }, { name: "90 D250", puissanceCv: 249, cylindree: "2996 cm³", consommation: "7.8 L/100km" }, { name: "110 D250", puissanceCv: 249, cylindree: "2996 cm³", consommation: "7.9 L/100km" }, { name: "110 P400e PHEV", puissanceCv: 404, cylindree: "1997 cm³", consommation: "2.8 L/100km" }, { name: "110 V8", puissanceCv: 525, cylindree: "4999 cm³", consommation: "14.2 L/100km" }] },
    "Discovery Sport": { versions: [{ name: "S", puissanceCv: 163, cylindree: "1997 cm³", consommation: "5.9 L/100km" }, { name: "SE", puissanceCv: 200, cylindree: "1997 cm³", consommation: "6.2 L/100km" }, { name: "R-Dynamic SE", puissanceCv: 200, cylindree: "1997 cm³", consommation: "6.2 L/100km" }, { name: "P300e PHEV", puissanceCv: 309, cylindree: "1497 cm³", consommation: "1.6 L/100km" }] },
    "Range Rover Evoque": { versions: [{ name: "S", puissanceCv: 163, cylindree: "1997 cm³", consommation: "5.8 L/100km" }, { name: "SE", puissanceCv: 200, cylindree: "1997 cm³", consommation: "6.0 L/100km" }, { name: "Dynamic SE", puissanceCv: 200, cylindree: "1997 cm³", consommation: "6.0 L/100km" }, { name: "P300e PHEV", puissanceCv: 309, cylindree: "1497 cm³", consommation: "1.4 L/100km" }] },
    "Range Rover Velar": { versions: [{ name: "S", puissanceCv: 204, cylindree: "1997 cm³", consommation: "6.2 L/100km" }, { name: "SE", puissanceCv: 250, cylindree: "1997 cm³", consommation: "6.5 L/100km" }, { name: "R-Dynamic SE", puissanceCv: 300, cylindree: "1997 cm³", consommation: "6.8 L/100km" }] },
    "Range Rover Sport": { versions: [{ name: "D250", puissanceCv: 249, cylindree: "2996 cm³", consommation: "7.2 L/100km" }, { name: "D300", puissanceCv: 300, cylindree: "2996 cm³", consommation: "7.5 L/100km" }, { name: "P400", puissanceCv: 400, cylindree: "2996 cm³", consommation: "8.5 L/100km" }, { name: "P510e PHEV", puissanceCv: 510, cylindree: "2996 cm³", consommation: "2.7 L/100km" }] },
    "Range Rover": { versions: [{ name: "D300", puissanceCv: 300, cylindree: "2996 cm³", consommation: "7.5 L/100km" }, { name: "D350", puissanceCv: 350, cylindree: "2996 cm³", consommation: "7.8 L/100km" }, { name: "P400", puissanceCv: 400, cylindree: "2996 cm³", consommation: "8.5 L/100km" }, { name: "P510e PHEV", puissanceCv: 510, cylindree: "2996 cm³", consommation: "2.9 L/100km" }] },
  },
  Suzuki: {
    "Swift": { versions: [{ name: "Avantage", puissanceCv: 83, cylindree: "1197 cm³", consommation: "4.6 L/100km" }, { name: "Privilège", puissanceCv: 83, cylindree: "1197 cm³", consommation: "4.6 L/100km" }, { name: "Pack", puissanceCv: 83, cylindree: "1197 cm³", consommation: "4.6 L/100km" }, { name: "Sport", puissanceCv: 129, cylindree: "1373 cm³", consommation: "5.6 L/100km" }] },
    "Vitara": { versions: [{ name: "Avantage", puissanceCv: 129, cylindree: "1373 cm³", consommation: "5.6 L/100km" }, { name: "Privilège", puissanceCv: 129, cylindree: "1373 cm³", consommation: "5.6 L/100km" }, { name: "Pack", puissanceCv: 129, cylindree: "1373 cm³", consommation: "5.8 L/100km" }] },
    "S-Cross": { versions: [{ name: "Avantage", puissanceCv: 129, cylindree: "1373 cm³", consommation: "5.6 L/100km" }, { name: "Privilège", puissanceCv: 129, cylindree: "1373 cm³", consommation: "5.6 L/100km" }, { name: "Style", puissanceCv: 129, cylindree: "1373 cm³", consommation: "5.8 L/100km" }] },
    "Jimny": { versions: [{ name: "Avantage", puissanceCv: 102, cylindree: "1462 cm³", consommation: "6.4 L/100km" }, { name: "Privilège", puissanceCv: 102, cylindree: "1462 cm³", consommation: "6.4 L/100km" }] },
  },
  Mitsubishi: {
    "Space Star": { versions: [{ name: "Invite", puissanceCv: 71, cylindree: "1193 cm³", consommation: "4.5 L/100km" }, { name: "Intense", puissanceCv: 71, cylindree: "1193 cm³", consommation: "4.5 L/100km" }, { name: "Instyle", puissanceCv: 80, cylindree: "1193 cm³", consommation: "4.7 L/100km" }] },
    "ASX": { versions: [{ name: "Invite", puissanceCv: 91, cylindree: "999 cm³", consommation: "5.3 L/100km" }, { name: "Intense", puissanceCv: 140, cylindree: "1332 cm³", consommation: "5.6 L/100km" }, { name: "Instyle", puissanceCv: 158, cylindree: "1332 cm³", consommation: "5.8 L/100km" }] },
    "Eclipse Cross": { versions: [{ name: "Invite", puissanceCv: 163, cylindree: "1499 cm³", consommation: "6.0 L/100km" }, { name: "Intense", puissanceCv: 163, cylindree: "1499 cm³", consommation: "6.0 L/100km" }, { name: "PHEV", puissanceCv: 188, cylindree: "2360 cm³", consommation: "1.8 L/100km" }] },
    "Outlander": { versions: [{ name: "Invite", puissanceCv: 150, cylindree: "2360 cm³", consommation: "6.5 L/100km" }, { name: "Intense", puissanceCv: 150, cylindree: "2360 cm³", consommation: "6.5 L/100km" }, { name: "PHEV", puissanceCv: 248, cylindree: "2360 cm³", consommation: "1.8 L/100km" }] },
  },
  Jaguar: {
    "F-Pace": { versions: [{ name: "S", puissanceCv: 204, cylindree: "1997 cm³", consommation: "5.9 L/100km" }, { name: "SE", puissanceCv: 250, cylindree: "1997 cm³", consommation: "6.2 L/100km" }, { name: "R-Dynamic SE", puissanceCv: 300, cylindree: "2996 cm³", consommation: "7.0 L/100km" }, { name: "P400e PHEV", puissanceCv: 404, cylindree: "1997 cm³", consommation: "2.4 L/100km" }] },
    "E-Pace": { versions: [{ name: "S", puissanceCv: 163, cylindree: "1997 cm³", consommation: "5.8 L/100km" }, { name: "SE", puissanceCv: 200, cylindree: "1997 cm³", consommation: "6.0 L/100km" }, { name: "R-Dynamic SE", puissanceCv: 200, cylindree: "1997 cm³", consommation: "6.0 L/100km" }] },
    "I-Pace": { versions: [{ name: "S", puissanceCv: 400, cylindree: "Électrique", consommation: "22.0 kWh/100km" }, { name: "SE", puissanceCv: 400, cylindree: "Électrique", consommation: "22.0 kWh/100km" }, { name: "HSE", puissanceCv: 400, cylindree: "Électrique", consommation: "22.0 kWh/100km" }] },
    "F-Type": { versions: [{ name: "P300", puissanceCv: 300, cylindree: "1997 cm³", consommation: "7.5 L/100km" }, { name: "P450", puissanceCv: 450, cylindree: "5000 cm³", consommation: "10.5 L/100km" }, { name: "P575 R", puissanceCv: 575, cylindree: "5000 cm³", consommation: "11.5 L/100km" }] },
  },
  Lexus: {
    "UX": { versions: [{ name: "250h", puissanceCv: 184, cylindree: "1987 cm³", consommation: "4.5 L/100km" }, { name: "300e", puissanceCv: 204, cylindree: "Électrique", consommation: "17.1 kWh/100km" }] },
    "NX": { versions: [{ name: "350h", puissanceCv: 244, cylindree: "2487 cm³", consommation: "5.7 L/100km" }, { name: "450h+", puissanceCv: 309, cylindree: "2487 cm³", consommation: "1.1 L/100km" }] },
    "RX": { versions: [{ name: "350h", puissanceCv: 250, cylindree: "2487 cm³", consommation: "6.0 L/100km" }, { name: "450h+", puissanceCv: 309, cylindree: "2487 cm³", consommation: "1.1 L/100km" }, { name: "500h", puissanceCv: 371, cylindree: "2393 cm³", consommation: "7.1 L/100km" }] },
    "RZ": { versions: [{ name: "450e", puissanceCv: 313, cylindree: "Électrique", consommation: "18.0 kWh/100km" }] },
    "ES": { versions: [{ name: "300h", puissanceCv: 218, cylindree: "2487 cm³", consommation: "4.5 L/100km" }] },
    "IS": { versions: [{ name: "300h", puissanceCv: 227, cylindree: "2487 cm³", consommation: "4.6 L/100km" }] },
    "LC": { versions: [{ name: "500h", puissanceCv: 359, cylindree: "3456 cm³", consommation: "6.6 L/100km" }] },
  },
  MG: {
    "MG3": { versions: [{ name: "Standard", puissanceCv: 106, cylindree: "1498 cm³", consommation: "5.0 L/100km" }, { name: "Hybrid+", puissanceCv: 195, cylindree: "1490 cm³", consommation: "4.4 L/100km" }] },
    "MG4": { versions: [{ name: "Standard 51 kWh", puissanceCv: 170, cylindree: "Électrique", consommation: "15.8 kWh/100km" }, { name: "Comfort 64 kWh", puissanceCv: 204, cylindree: "Électrique", consommation: "15.8 kWh/100km" }, { name: "Luxury 77 kWh", puissanceCv: 245, cylindree: "Électrique", consommation: "16.0 kWh/100km" }, { name: "XPOWER", puissanceCv: 435, cylindree: "Électrique", consommation: "17.8 kWh/100km" }] },
    "ZS": { versions: [{ name: "Essence", puissanceCv: 106, cylindree: "1498 cm³", consommation: "5.6 L/100km" }, { name: "EV 51 kWh", puissanceCv: 177, cylindree: "Électrique", consommation: "17.0 kWh/100km" }, { name: "EV 72 kWh", puissanceCv: 177, cylindree: "Électrique", consommation: "17.3 kWh/100km" }] },
    "HS": { versions: [{ name: "Essence", puissanceCv: 162, cylindree: "1490 cm³", consommation: "6.2 L/100km" }, { name: "PHEV", puissanceCv: 258, cylindree: "1490 cm³", consommation: "1.6 L/100km" }] },
    "Marvel R": { versions: [{ name: "Comfort", puissanceCv: 180, cylindree: "Électrique", consommation: "18.0 kWh/100km" }, { name: "Luxury", puissanceCv: 288, cylindree: "Électrique", consommation: "18.6 kWh/100km" }] },
  },
  BYD: {
    "Atto 3": { versions: [{ name: "Active", puissanceCv: 204, cylindree: "Électrique", consommation: "16.0 kWh/100km" }, { name: "Comfort", puissanceCv: 204, cylindree: "Électrique", consommation: "16.0 kWh/100km" }, { name: "Design", puissanceCv: 204, cylindree: "Électrique", consommation: "16.0 kWh/100km" }] },
    "Seal": { versions: [{ name: "Comfort", puissanceCv: 313, cylindree: "Électrique", consommation: "14.0 kWh/100km" }, { name: "Design", puissanceCv: 313, cylindree: "Électrique", consommation: "14.0 kWh/100km" }, { name: "Excellence AWD", puissanceCv: 530, cylindree: "Électrique", consommation: "15.5 kWh/100km" }] },
    "Dolphin": { versions: [{ name: "Active", puissanceCv: 95, cylindree: "Électrique", consommation: "12.9 kWh/100km" }, { name: "Comfort", puissanceCv: 177, cylindree: "Électrique", consommation: "13.8 kWh/100km" }, { name: "Design", puissanceCv: 177, cylindree: "Électrique", consommation: "13.8 kWh/100km" }] },
    "Han": { versions: [{ name: "Design", puissanceCv: 517, cylindree: "Électrique", consommation: "18.0 kWh/100km" }] },
    "Tang": { versions: [{ name: "Design AWD", puissanceCv: 517, cylindree: "Électrique", consommation: "20.0 kWh/100km" }] },
  },
  Polestar: {
    "Polestar 2": { versions: [{ name: "Standard Range", puissanceCv: 272, cylindree: "Électrique", consommation: "16.0 kWh/100km" }, { name: "Long Range", puissanceCv: 299, cylindree: "Électrique", consommation: "16.0 kWh/100km" }, { name: "Long Range Dual Motor", puissanceCv: 421, cylindree: "Électrique", consommation: "17.0 kWh/100km" }, { name: "BST 270", puissanceCv: 476, cylindree: "Électrique", consommation: "17.5 kWh/100km" }] },
    "Polestar 3": { versions: [{ name: "Long Range Dual Motor", puissanceCv: 489, cylindree: "Électrique", consommation: "19.0 kWh/100km" }, { name: "Performance", puissanceCv: 517, cylindree: "Électrique", consommation: "19.5 kWh/100km" }] },
    "Polestar 4": { versions: [{ name: "Long Range Single Motor", puissanceCv: 272, cylindree: "Électrique", consommation: "16.0 kWh/100km" }, { name: "Long Range Dual Motor", puissanceCv: 544, cylindree: "Électrique", consommation: "17.0 kWh/100km" }] },
  },
  Genesis: {
    "GV60": { versions: [{ name: "Standard", puissanceCv: 234, cylindree: "Électrique", consommation: "17.5 kWh/100km" }, { name: "Performance", puissanceCv: 490, cylindree: "Électrique", consommation: "18.5 kWh/100km" }] },
    "GV70": { versions: [{ name: "2.5T", puissanceCv: 304, cylindree: "2497 cm³", consommation: "8.5 L/100km" }, { name: "Electrified", puissanceCv: 360, cylindree: "Électrique", consommation: "18.0 kWh/100km" }] },
    "GV80": { versions: [{ name: "2.5T", puissanceCv: 304, cylindree: "2497 cm³", consommation: "9.0 L/100km" }, { name: "3.5T", puissanceCv: 380, cylindree: "3470 cm³", consommation: "10.0 L/100km" }] },
    "G80": { versions: [{ name: "2.5T", puissanceCv: 304, cylindree: "2497 cm³", consommation: "8.0 L/100km" }, { name: "Electrified", puissanceCv: 370, cylindree: "Électrique", consommation: "17.0 kWh/100km" }] },
  },
  Maserati: {
    "Grecale": { versions: [{ name: "GT", puissanceCv: 300, cylindree: "1995 cm³", consommation: "7.5 L/100km" }, { name: "Modena", puissanceCv: 330, cylindree: "1995 cm³", consommation: "7.8 L/100km" }, { name: "Trofeo", puissanceCv: 530, cylindree: "2992 cm³", consommation: "10.0 L/100km" }, { name: "Folgore", puissanceCv: 557, cylindree: "Électrique", consommation: "18.0 kWh/100km" }] },
    "Levante": { versions: [{ name: "GT", puissanceCv: 350, cylindree: "2979 cm³", consommation: "8.2 L/100km" }, { name: "Modena", puissanceCv: 350, cylindree: "2979 cm³", consommation: "8.2 L/100km" }, { name: "Trofeo", puissanceCv: 580, cylindree: "3799 cm³", consommation: "12.5 L/100km" }] },
    "Ghibli": { versions: [{ name: "GT", puissanceCv: 350, cylindree: "2979 cm³", consommation: "7.8 L/100km" }, { name: "Modena", puissanceCv: 350, cylindree: "2979 cm³", consommation: "7.8 L/100km" }, { name: "Trofeo", puissanceCv: 580, cylindree: "3799 cm³", consommation: "11.0 L/100km" }] },
    "GranTurismo": { versions: [{ name: "Modena", puissanceCv: 490, cylindree: "2992 cm³", consommation: "9.0 L/100km" }, { name: "Trofeo", puissanceCv: 550, cylindree: "2992 cm³", consommation: "10.0 L/100km" }, { name: "Folgore", puissanceCv: 761, cylindree: "Électrique", consommation: "18.5 kWh/100km" }] },
  },
};

/**
 * Liste complète de toutes les marques (triée alphabétiquement)
 */
export const ALL_BRANDS_AUTO = Object.keys(VEHICLE_DB).sort();

/**
 * Retourne la liste des modèles pour une marque donnée
 */
export function getModelsForBrand(brand: string): string[] {
  return Object.keys(VEHICLE_DB[brand] || {}).sort();
}

/**
 * Retourne la liste des versions pour un modèle donné
 */
export function getVersionsForModel(brand: string, model: string): VersionSpec[] {
  return VEHICLE_DB[brand]?.[model]?.versions || [];
}

/**
 * Retourne les specs d'une version spécifique
 */
export function getVersionSpec(brand: string, model: string, versionName: string): VersionSpec | undefined {
  return getVersionsForModel(brand, model).find(v => v.name === versionName);
}
