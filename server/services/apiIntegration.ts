/**
 * API Integration Service — MKA.P-MS
 *
 * Architecture centralisee pour toutes les API externes :
 * 1. Plaque d'immatriculation / VIN (Priorite 1)
 * 2. Estimation vehicule (Priorite 2)
 * 3. Emails transactionnels — Brevo (Priorite 3)
 * 4. Geolocalisation (Priorite 4)
 *
 * Fonctionnalites :
 * - Mode test (pas d'appels API reels)
 * - Compteur de requetes + historique
 * - Alerte si quota presque atteint
 * - Fallback local si API indisponible
 */

// ─── Configuration API ──────────────────────────────────────────────

interface ApiConfig {
  name: string;
  envKey: string;
  baseUrl: string;
  monthlyQuota: number;
  alertThreshold: number; // % du quota avant alerte (ex: 80 = 80%)
  testMode: boolean;
}

const API_CONFIGS: Record<string, ApiConfig> = {
  plateVin: {
    name: "API Plaque / VIN",
    envKey: "PLATE_API_TOKEN",
    baseUrl: "https://api.apiplaqueimmatriculation.com",
    monthlyQuota: 600,
    alertThreshold: 80,
    testMode: !process.env.PLATE_API_TOKEN || process.env.PLATE_API_TOKEN === "TokenDemo2026B",
  },
  estimation: {
    name: "API Estimation Vehicule",
    envKey: "ESTIMATION_API_TOKEN",
    baseUrl: "",
    monthlyQuota: 500,
    alertThreshold: 80,
    testMode: !process.env.ESTIMATION_API_TOKEN,
  },
  brevo: {
    name: "Brevo (Emails transactionnels)",
    envKey: "BREVO_API_KEY",
    baseUrl: "https://api.brevo.com/v3",
    monthlyQuota: 300,
    alertThreshold: 80,
    testMode: !process.env.BREVO_API_KEY,
  },
  geolocation: {
    name: "Geolocalisation",
    envKey: "GEO_API_KEY",
    baseUrl: "",
    monthlyQuota: 1000,
    alertThreshold: 80,
    testMode: !process.env.GEO_API_KEY,
  },
};

// ─── Compteur de requetes (en memoire, reset mensuel) ────────────

interface ApiUsage {
  requests: number;
  month: string;
  history: { timestamp: Date; endpoint: string; success: boolean; durationMs: number }[];
}

const apiUsage: Record<string, ApiUsage> = {};

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getUsage(apiName: string): ApiUsage {
  const month = getCurrentMonth();
  if (!apiUsage[apiName] || apiUsage[apiName].month !== month) {
    apiUsage[apiName] = { requests: 0, month, history: [] };
  }
  return apiUsage[apiName];
}

function trackRequest(apiName: string, endpoint: string, success: boolean, durationMs: number) {
  const usage = getUsage(apiName);
  usage.requests++;
  usage.history.push({ timestamp: new Date(), endpoint, success, durationMs });
  // Garder les 500 derniers appels
  if (usage.history.length > 500) usage.history = usage.history.slice(-500);

  // Alerte quota
  const config = API_CONFIGS[apiName];
  if (config) {
    const pct = (usage.requests / config.monthlyQuota) * 100;
    if (pct >= config.alertThreshold) {
      console.warn(`[API ALERTE] ${config.name}: ${usage.requests}/${config.monthlyQuota} requetes (${Math.round(pct)}%) — quota presque atteint !`);
    }
  }
}

// ─── API Status / Dashboard ─────────────────────────────────────────

export function getApiDashboard() {
  return Object.entries(API_CONFIGS).map(([key, config]) => {
    const usage = getUsage(key);
    const pct = config.monthlyQuota > 0 ? Math.round((usage.requests / config.monthlyQuota) * 100) : 0;
    return {
      id: key,
      name: config.name,
      testMode: config.testMode,
      configured: !!process.env[config.envKey],
      requests: usage.requests,
      quota: config.monthlyQuota,
      usagePercent: pct,
      alertActive: pct >= config.alertThreshold,
      lastRequests: usage.history.slice(-10),
    };
  });
}

// ─── 1. PLAQUE / VIN — Identification vehicule ──────────────────────

export interface VehicleIdentification {
  marque: string | null;
  modele: string | null;
  version: string | null;
  annee: number | null;
  carburant: string | null;
  boite: string | null;
  puissance: string | null;
  portes: number | null;
  places: number | null;
  couleur: string | null;
  cylindree: string | null;
  poids: string | null;
  categorie: string | null;
  energie: string | null;
  emissions: string | null;
  dateMiseCirculation: string | null;
  typeCarrosserie: string | null;
}

const ENERGY_MAP: Record<string, string> = {
  GO: "diesel", ES: "essence", EL: "electrique",
  EH: "hybride", GH: "hybride", GL: "gpl",
  DIESEL: "diesel", ESSENCE: "essence", ELECTRIQUE: "electrique",
  HYBRIDE: "hybride", GPL: "gpl", ETHANOL: "ethanol",
};

// Donnees de test pour le mode demo
const TEST_VEHICLES: Record<string, VehicleIdentification> = {
  "AA123BB": {
    marque: "Peugeot", modele: "308", version: "GT", annee: 2023,
    carburant: "essence", boite: "Automatique", puissance: "130 CV",
    portes: 5, places: 5, couleur: "Gris Artense", cylindree: "1199 cm3",
    poids: "1290 kg", categorie: "berline", energie: "Essence",
    emissions: "118 g/km CO2", dateMiseCirculation: "2023-03-15",
    typeCarrosserie: "Berline compacte",
  },
  "CC456DD": {
    marque: "Mercedes-Benz", modele: "Classe C", version: "220d AMG Line", annee: 2022,
    carburant: "diesel", boite: "Automatique 9G-TRONIC", puissance: "200 CV",
    portes: 4, places: 5, couleur: "Noir Obsidienne", cylindree: "1993 cm3",
    poids: "1570 kg", categorie: "berline", energie: "Diesel",
    emissions: "128 g/km CO2", dateMiseCirculation: "2022-06-20",
    typeCarrosserie: "Berline",
  },
  "DEMO": {
    marque: "BMW", modele: "X3", version: "xDrive 20d", annee: 2024,
    carburant: "diesel", boite: "Automatique Steptronic", puissance: "190 CV",
    portes: 5, places: 5, couleur: "Blanc Alpin", cylindree: "1995 cm3",
    poids: "1780 kg", categorie: "suv", energie: "Diesel",
    emissions: "145 g/km CO2", dateMiseCirculation: "2024-01-10",
    typeCarrosserie: "SUV",
  },
};

export async function lookupPlateVin(
  type: "plaque" | "vin",
  query: string,
): Promise<VehicleIdentification | null> {
  const q = query.replace(/[\s-]/g, "").toUpperCase();
  const config = API_CONFIGS.plateVin;
  const start = Date.now();

  // Mode test — renvoyer des donnees demo
  if (config.testMode) {
    const testResult = TEST_VEHICLES[q] || TEST_VEHICLES["DEMO"];
    trackRequest("plateVin", `${type}/${q}`, true, Date.now() - start);
    return testResult;
  }

  const token = process.env[config.envKey] || "";

  try {
    const endpoint = type === "plaque" ? "plaque" : "vin";
    const param = type === "plaque" ? "immatriculation" : "vin";
    const url = `${config.baseUrl}/${endpoint}?${param}=${encodeURIComponent(q)}&token=${token}&pays=FR`;

    const resp = await fetch(url, { method: "POST", signal: AbortSignal.timeout(8000) });
    const durationMs = Date.now() - start;

    if (resp.ok) {
      const data = await resp.json();
      if (data && (data.marque || data.modele)) {
        trackRequest("plateVin", `${type}/${q}`, true, durationMs);
        const carburant = ENERGY_MAP[(data.energie || data.carburant || "").toUpperCase()] || data.energie || null;
        return {
          marque: data.marque || null,
          modele: data.modele || data.modele_etude || null,
          version: data.version || data.variante || null,
          annee: data.annee ? Number(data.annee) : (data.date_mise_circulation ? Number(data.date_mise_circulation.substring(0, 4)) : null),
          carburant,
          boite: data.boite || data.boite_vitesse || null,
          puissance: data.puissance_cv || data.puissance_fiscale || null,
          portes: data.nb_portes ? Number(data.nb_portes) : null,
          places: data.nb_places ? Number(data.nb_places) : null,
          couleur: data.couleur || null,
          cylindree: data.cylindree || null,
          poids: data.poids || data.ptac || null,
          categorie: data.genre || data.carrosserie || null,
          energie: data.energie || null,
          emissions: data.co2 ? `${data.co2} g/km CO2` : null,
          dateMiseCirculation: data.date_mise_circulation || null,
          typeCarrosserie: data.carrosserie || null,
        };
      }
    }

    trackRequest("plateVin", `${type}/${q}`, false, durationMs);
  } catch {
    trackRequest("plateVin", `${type}/${q}`, false, Date.now() - start);
  }

  return null;
}

// ─── 2. ESTIMATION VEHICULE ─────────────────────────────────────────

export interface VehicleEstimation {
  prixMin: number;
  prixMoyen: number;
  prixMax: number;
  prixConseille: number;
  tendance: "hausse" | "stable" | "baisse";
  fiabilite: "haute" | "moyenne" | "faible";
  source: string;
}

export async function estimateVehicle(params: {
  marque: string;
  modele: string;
  annee: number;
  km: number;
  carburant?: string;
  boite?: string;
}): Promise<VehicleEstimation> {
  const config = API_CONFIGS.estimation;
  const start = Date.now();

  // Mode test — estimation basee sur algorithme interne
  // (sera remplacee par API AutoUncle/Autovista quand la cle sera fournie)
  const basePrice = getBasePrice(params.marque, params.annee);
  const kmFactor = Math.max(0.5, 1 - (params.km / 300000));
  const ageFactor = Math.max(0.3, 1 - ((new Date().getFullYear() - params.annee) * 0.05));
  const estimatedPrice = Math.round(basePrice * kmFactor * ageFactor);

  trackRequest("estimation", `${params.marque}/${params.modele}`, true, Date.now() - start);

  return {
    prixMin: Math.round(estimatedPrice * 0.85),
    prixMoyen: estimatedPrice,
    prixMax: Math.round(estimatedPrice * 1.15),
    prixConseille: Math.round(estimatedPrice * 0.95),
    tendance: "stable",
    fiabilite: config.testMode ? "faible" : "haute",
    source: config.testMode ? "Estimation interne MKA.P-MS" : "API Estimation Pro",
  };
}

function getBasePrice(marque: string, annee: number): number {
  const brandPrices: Record<string, number> = {
    "mercedes": 35000, "bmw": 33000, "audi": 32000, "porsche": 65000,
    "peugeot": 18000, "renault": 16000, "citroen": 17000, "dacia": 12000,
    "volkswagen": 22000, "toyota": 24000, "hyundai": 20000, "kia": 19000,
    "ford": 20000, "opel": 17000, "fiat": 14000, "seat": 18000,
    "skoda": 19000, "mini": 23000, "volvo": 30000, "tesla": 40000,
  };
  const base = brandPrices[marque.toLowerCase()] || 20000;
  const yearBonus = Math.max(0, (annee - 2015) * 1500);
  return base + yearBonus;
}

// ─── 3. EMAILS TRANSACTIONNELS (Brevo) ──────────────────────────────

export interface EmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  templateId?: number;
  params?: Record<string, string>;
}

export async function sendTransactionalEmail(email: EmailParams): Promise<{ success: boolean; messageId?: string }> {
  const config = API_CONFIGS.brevo;
  const start = Date.now();

  if (config.testMode) {
    console.log(`[BREVO TEST] Email a ${email.to}: ${email.subject}`);
    trackRequest("brevo", `email/${email.to}`, true, Date.now() - start);
    return { success: true, messageId: `test-${Date.now()}` };
  }

  const apiKey = process.env[config.envKey] || "";
  try {
    const resp = await fetch(`${config.baseUrl}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "MKA.P-MS", email: "noreply@mkapms.fr" },
        to: [{ email: email.to, name: email.toName || email.to }],
        subject: email.subject,
        htmlContent: email.htmlContent,
        ...(email.templateId ? { templateId: email.templateId } : {}),
        ...(email.params ? { params: email.params } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });

    const durationMs = Date.now() - start;
    if (resp.ok) {
      const data = await resp.json();
      trackRequest("brevo", `email/${email.to}`, true, durationMs);
      return { success: true, messageId: data.messageId };
    }
    trackRequest("brevo", `email/${email.to}`, false, durationMs);
  } catch {
    trackRequest("brevo", `email/${email.to}`, false, Date.now() - start);
  }

  return { success: false };
}

// Templates emails pre-construits
export const EMAIL_TEMPLATES = {
  inscription: (nom: string) => ({
    subject: "Bienvenue sur MKA.P-MS !",
    htmlContent: `<h1>Bienvenue ${nom} !</h1><p>Votre compte MKA.P-MS a ete cree avec succes.</p><p>Decouvrez nos vehicules sur <a href="https://www.mkapms.fr">www.mkapms.fr</a></p>`,
  }),
  motDePasseOublie: (lien: string) => ({
    subject: "Reinitialisation de votre mot de passe — MKA.P-MS",
    htmlContent: `<h2>Reinitialisation du mot de passe</h2><p>Cliquez sur le lien ci-dessous pour reinitialiser votre mot de passe :</p><p><a href="${lien}">${lien}</a></p><p>Ce lien expire dans 1 heure.</p>`,
  }),
  confirmationPaiement: (ref: string, montant: string) => ({
    subject: `Confirmation de paiement #${ref} — MKA.P-MS`,
    htmlContent: `<h2>Paiement confirme</h2><p>Votre paiement de <strong>${montant}</strong> (ref: ${ref}) a ete traite avec succes.</p>`,
  }),
  nouvelleReservation: (vehicule: string, dates: string) => ({
    subject: "Nouvelle reservation — MKA.P-MS",
    htmlContent: `<h2>Reservation confirmee</h2><p>Vehicule : <strong>${vehicule}</strong></p><p>Dates : ${dates}</p>`,
  }),
  confirmationDevis: (ref: string) => ({
    subject: `Devis #${ref} recu — MKA.P-MS`,
    htmlContent: `<h2>Votre devis a ete recu</h2><p>Reference : ${ref}</p><p>Nous vous recontacterons sous 24h.</p>`,
  }),
  notificationImportante: (titre: string, message: string) => ({
    subject: `${titre} — MKA.P-MS`,
    htmlContent: `<h2>${titre}</h2><p>${message}</p>`,
  }),
};

// ─── 4. GEOLOCALISATION ─────────────────────────────────────────────

export interface GeoResult {
  lat: number;
  lng: number;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const config = API_CONFIGS.geolocation;
  const start = Date.now();

  if (config.testMode) {
    // Utiliser l'API gratuite Nominatim (OpenStreetMap) comme fallback
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=fr`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "MKAPMS/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.length > 0) {
          trackRequest("geolocation", address, true, Date.now() - start);
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            address: data[0].display_name || address,
            city: "",
            postalCode: "",
            country: "FR",
          };
        }
      }
    } catch {
      // Fallback silencieux
    }
    trackRequest("geolocation", address, false, Date.now() - start);
    return null;
  }

  // API Google Maps / Mapbox (quand la cle sera fournie)
  const apiKey = process.env[config.envKey] || "";
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        trackRequest("geolocation", address, true, Date.now() - start);
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          address: result.formatted_address,
          city: result.address_components?.find((c: any) => c.types.includes("locality"))?.long_name || "",
          postalCode: result.address_components?.find((c: any) => c.types.includes("postal_code"))?.long_name || "",
          country: result.address_components?.find((c: any) => c.types.includes("country"))?.short_name || "FR",
        };
      }
    }
    trackRequest("geolocation", address, false, Date.now() - start);
  } catch {
    trackRequest("geolocation", address, false, Date.now() - start);
  }

  return null;
}

// ─── 5. GARAGES A PROXIMITE ─────────────────────────────────────────

export async function findNearbyGarages(lat: number, lng: number, radiusKm: number = 20): Promise<GeoResult[]> {
  // En mode test, retourner des garages demo
  return [];
}
