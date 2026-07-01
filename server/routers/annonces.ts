import { z } from "zod";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { annonces, annoncePhotos, users, subscriptions, savedSearches, notifications } from "../schema.js";
import { getPlan } from "@shared/plans.js";
import { logAction } from "../audit.js";
import { makeReference } from "../reference.js";

// Alerte « recherche sauvegardée » (Partie 6) : à chaque nouvelle annonce, on
// notifie les utilisateurs dont un filtre enregistré correspond. Jamais bloquant.
type AnnonceRow = typeof annonces.$inferSelect;
function matchesFilters(a: AnnonceRow, f: Record<string, unknown>): boolean {
  const contains = (val: string | null, needle: unknown) =>
    !needle || (val ?? "").toLowerCase().includes(String(needle).toLowerCase());
  if (f.marque && !contains(a.marque, f.marque)) return false;
  if (f.modele && !contains(a.modele, f.modele)) return false;
  if (f.categorie && a.categorie !== f.categorie) return false;
  if (f.famille && a.famille !== f.famille) return false;
  if (f.vendeurType && a.vendeurType !== f.vendeurType) return false;
  if (f.ville && !contains(a.ville, f.ville)) return false;
  if (f.prixMax != null && Number(a.prix) > Number(f.prixMax)) return false;
  if (f.q) {
    const hay = `${a.titre} ${a.marque} ${a.modele} ${a.version ?? ""}`.toLowerCase();
    if (!hay.includes(String(f.q).toLowerCase())) return false;
  }
  return true;
}

async function notifyMatchingSearches(a: AnnonceRow) {
  const searches = await db
    .select()
    .from(savedSearches)
    .where(and(eq(savedSearches.alertEnabled, true), eq(savedSearches.univers, a.type)));
  const matched = searches.filter(
    (s) => s.userId !== a.ownerId && matchesFilters(a, (s.filters ?? {}) as Record<string, unknown>),
  );
  if (!matched.length) return;
  await db.insert(notifications).values(
    matched.map((s) => ({
      userId: s.userId,
      type: "saved_search",
      title: `Nouvelle annonce pour « ${s.label} »`,
      body: `${a.titre} — ${Number(a.prix).toLocaleString("fr-FR")} €`,
      url: `/vehicule/${a.id}`,
    })),
  );
  const now = new Date();
  for (const s of matched) {
    await db.update(savedSearches).set({ lastNotifiedAt: now }).where(eq(savedSearches.id, s.id));
  }
}

// Quota d'annonces du pro selon son abonnement actif. Renvoie l'état SANS bloquer
// (règle Partie A §2 : on facture les dépassements, on ne bloque jamais).
async function quotaInfo(userId: number) {
  const actives = await db
    .select({ id: annonces.id })
    .from(annonces)
    .where(and(eq(annonces.ownerId, userId), eq(annonces.status, "publiee")));
  const used = actives.length;
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  const plan = sub ? getPlan(sub.planCode) : undefined;
  const limit = plan?.quotas.maxAnnonces ?? null; // null = illimité
  const overageEur = plan?.overageEur ?? 0;
  const over = limit != null && used >= limit;
  const approaching = limit != null && !over && used >= Math.max(1, limit - 2);
  return { used, limit, overageEur, over, approaching, planCode: sub?.planCode ?? null };
}

const categorieEnum = z.enum([
  "citadine", "berline", "break", "suv", "coupe", "cabriolet", "monospace",
  "utilitaire", "camion", "moto", "scooter", "quad", "luxe", "autre",
]);

export const annoncesRouter = router({
  // Liste publique avec filtres (page Acheter / Louer)
  list: publicProcedure
    .input(
      z.object({
        type: z.enum(["vente", "location"]).optional(),
        q: z.string().optional(),
        categorie: categorieEnum.optional(),
        famille: z.enum(["auto", "moto"]).optional(),
        vendeurType: z.enum(["particulier", "professionnel", "concession"]).optional(),
        ownership: z.enum(["client", "plateforme", "partenaire"]).optional(),
        categorieAnnonce: z.enum(["officielle", "professionnelle", "particulier"]).optional(),
        prixMax: z.number().optional(),
        ville: z.string().optional(),
        segmentLocation: z.enum(["particulier", "professionnel", "vtc_taxi"]).optional(),
        boosted: z.boolean().optional(),
        selectionMka: z.boolean().optional(),
        miseAvantAccueil: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(24),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const conds = [eq(annonces.status, "publiee")];
      if (input.type) conds.push(eq(annonces.type, input.type));
      if (input.categorie) conds.push(eq(annonces.categorie, input.categorie));
      if (input.famille) conds.push(eq(annonces.famille, input.famille));
      if (input.vendeurType) conds.push(eq(annonces.vendeurType, input.vendeurType));
      if (input.ownership) conds.push(eq(annonces.ownership, input.ownership));
      if (input.categorieAnnonce) conds.push(eq(annonces.categorieAnnonce, input.categorieAnnonce));
      if (input.segmentLocation) conds.push(eq(annonces.segmentLocation, input.segmentLocation));
      if (input.boosted !== undefined) conds.push(eq(annonces.boosted, input.boosted));
      if (input.selectionMka !== undefined) conds.push(eq(annonces.selectionMka, input.selectionMka));
      if (input.miseAvantAccueil !== undefined) conds.push(eq(annonces.miseAvantAccueil, input.miseAvantAccueil));
      if (input.prixMax) conds.push(lte(annonces.prix, String(input.prixMax)));
      if (input.ville) conds.push(ilike(annonces.ville, `%${input.ville}%`));
      if (input.q) {
        const like = `%${input.q}%`;
        conds.push(
          or(
            ilike(annonces.titre, like),
            ilike(annonces.marque, like),
            ilike(annonces.modele, like),
            ilike(annonces.version, like),
          )!,
        );
      }
      const where = and(...conds);
      const rows = await db
        .select()
        .from(annonces)
        .where(where)
        .orderBy(desc(annonces.boosted), desc(annonces.publishedAt), desc(annonces.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(annonces)
        .where(where);

      // photo principale par annonce
      const ids = rows.map((r) => r.id);
      const photos = ids.length
        ? await db
            .select()
            .from(annoncePhotos)
            .where(sql`${annoncePhotos.annonceId} in (${sql.join(ids, sql`, `)})`)
            .orderBy(annoncePhotos.ordre)
        : [];
      const photoMap = new Map<number, string>();
      for (const p of photos) {
        if (!photoMap.has(p.annonceId!)) photoMap.set(p.annonceId!, p.url);
      }
      return {
        total: count,
        items: rows.map((r) => ({ ...r, photoPrincipale: photoMap.get(r.id) ?? null })),
      };
    }),

  // Fiche véhicule détaillée
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [a] = await db.select().from(annonces).where(eq(annonces.id, input.id)).limit(1);
      if (!a) throw new TRPCError({ code: "NOT_FOUND" });
      const photos = await db
        .select()
        .from(annoncePhotos)
        .where(eq(annoncePhotos.annonceId, a.id))
        .orderBy(annoncePhotos.ordre);
      const [owner] = a.ownerId
        ? await db.select().from(users).where(eq(users.id, a.ownerId)).limit(1)
        : [];
      return {
        ...a,
        photos,
        vendeur: owner
          ? {
              id: owner.id,
              name: owner.companyName || owner.name,
              accountType: owner.accountType,
              rating: owner.rating,
              reviewCount: owner.reviewCount,
              phone: a.contactTelephone || owner.phone,
            }
          : null,
      };
    }),

  // Estimation intelligente du prix (Partie 5 §4) — basée sur les annonces
  // comparables réellement présentes sur la plateforme (data-driven), avec repli
  // heuristique transparent si l'échantillon est insuffisant. Barèmes affinables.
  estimate: publicProcedure
    .input(
      z.object({
        marque: z.string().min(1),
        modele: z.string().min(1),
        annee: z.number().optional(),
        kilometrage: z.number().optional(),
        carburant: z.string().optional(),
        boite: z.string().optional(),
        etat: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const conds = [
        eq(annonces.status, "publiee"),
        eq(annonces.type, "vente"),
        ilike(annonces.marque, input.marque),
        ilike(annonces.modele, input.modele),
      ];
      if (input.annee) {
        conds.push(gte(annonces.annee, input.annee - 3));
        conds.push(lte(annonces.annee, input.annee + 3));
      }
      const rows = await db
        .select({ prix: annonces.prix, km: annonces.kilometrage, annee: annonces.annee })
        .from(annonces)
        .where(and(...conds));

      const sample = rows
        .map((r) => ({ prix: Number(r.prix), km: r.km, annee: r.annee }))
        .filter((r) => Number.isFinite(r.prix) && r.prix > 500);

      const percentile = (arr: number[], p: number) => {
        if (!arr.length) return 0;
        const s = [...arr].sort((a, b) => a - b);
        const idx = Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))));
        return s[idx];
      };

      if (sample.length >= 4) {
        const prices = sample.map((s) => s.prix);
        let mid = percentile(prices, 50);
        let low = percentile(prices, 25);
        let high = percentile(prices, 75);

        // Ajustement kilométrage : si le véhicule a plus/moins de km que la
        // médiane, on nudge la fourchette de ±20 % maximum.
        const kms = sample.map((s) => s.km).filter((k): k is number => k != null && k > 0);
        if (input.kilometrage != null && kms.length >= 3) {
          const medianKm = percentile(kms, 50);
          if (medianKm > 0) {
            const factorRaw = 1 + (medianKm - input.kilometrage) / (medianKm * 4);
            const factor = Math.min(1.2, Math.max(0.8, factorRaw));
            mid = Math.round(mid * factor);
            low = Math.round(low * factor);
            high = Math.round(high * factor);
          }
        }
        return {
          method: "comparables" as const,
          sampleSize: sample.length,
          low: Math.round(low),
          mid: Math.round(mid),
          high: Math.round(high),
        };
      }

      // Estimation intelligente basée sur marque, modèle, année, km, état, carburant, boîte
      // Prix neufs moyens par marque (base de calcul, le système applique la décote ensuite)
      const brandBases: Record<string, number> = {
        "renault": 24000, "peugeot": 26000, "citroën": 23000, "citroen": 23000,
        "volkswagen": 30000, "bmw": 42000, "mercedes": 45000, "audi": 40000,
        "toyota": 28000, "nissan": 26000, "ford": 26000, "opel": 22000,
        "fiat": 19000, "hyundai": 26000, "kia": 27000, "dacia": 16000,
        "skoda": 25000, "seat": 24000, "volvo": 38000, "mazda": 28000,
        "honda": 27000, "suzuki": 21000, "mitsubishi": 28000, "jeep": 38000,
        "land rover": 55000, "porsche": 85000, "tesla": 48000, "mini": 30000,
        "alfa romeo": 32000, "ds": 35000, "jaguar": 48000, "lexus": 50000,
        "cupra": 34000, "mg": 22000, "smart": 18000,
      };

      // Ajustement modèle — prix neuf moyen spécifique au modèle pour plus de précision
      const modelBases: Record<string, Record<string, number>> = {
        "renault": { "clio": 18000, "megane": 28000, "captur": 24000, "arkana": 30000, "twingo": 14000, "scenic": 32000, "kadjar": 28000, "austral": 34000, "zoe": 26000, "kangoo": 22000, "trafic": 35000, "master": 40000, "espace": 42000 },
        "peugeot": { "208": 20000, "308": 28000, "2008": 26000, "3008": 34000, "5008": 38000, "508": 40000, "108": 14000, "partner": 25000, "expert": 35000, "rifter": 26000, "e-208": 28000 },
        "citroen": { "c3": 17000, "c4": 26000, "c5": 38000, "c3 aircross": 22000, "c5 aircross": 32000, "berlingo": 24000, "jumpy": 33000, "ami": 8000 },
        "citroën": { "c3": 17000, "c4": 26000, "c5": 38000, "c3 aircross": 22000, "c5 aircross": 32000, "berlingo": 24000, "jumpy": 33000 },
        "volkswagen": { "polo": 22000, "golf": 32000, "tiguan": 38000, "t-roc": 30000, "passat": 40000, "touran": 35000, "t-cross": 24000, "id.3": 38000, "id.4": 42000, "arteon": 48000, "up!": 14000, "caddy": 28000, "transporter": 42000 },
        "bmw": { "serie 1": 32000, "serie 2": 36000, "serie 3": 44000, "serie 4": 48000, "serie 5": 56000, "x1": 38000, "x2": 40000, "x3": 50000, "x5": 68000, "x6": 75000, "i3": 35000, "i4": 52000, "ix": 72000 },
        "mercedes": { "classe a": 34000, "classe b": 36000, "classe c": 48000, "classe e": 58000, "classe s": 110000, "gla": 38000, "glb": 40000, "glc": 52000, "gle": 68000, "gls": 90000, "cla": 38000, "eqa": 48000, "eqb": 50000, "vito": 38000, "sprinter": 42000 },
        "audi": { "a1": 28000, "a3": 34000, "a4": 42000, "a5": 48000, "a6": 56000, "q2": 30000, "q3": 36000, "q5": 48000, "q7": 68000, "q8": 75000, "e-tron": 55000, "tt": 45000 },
        "toyota": { "yaris": 18000, "corolla": 26000, "c-hr": 30000, "rav4": 36000, "yaris cross": 24000, "camry": 38000, "land cruiser": 55000, "aygo": 14000, "hilux": 40000, "proace": 35000 },
        "dacia": { "sandero": 12000, "duster": 18000, "jogger": 16000, "spring": 15000, "logan": 11000 },
        "ford": { "fiesta": 18000, "focus": 28000, "puma": 26000, "kuga": 34000, "mustang": 50000, "ranger": 42000, "transit": 38000, "ecosport": 22000, "explorer": 55000 },
        "tesla": { "model 3": 42000, "model y": 46000, "model s": 90000, "model x": 100000 },
        "porsche": { "911": 120000, "cayenne": 85000, "macan": 60000, "panamera": 95000, "taycan": 90000, "boxster": 65000, "cayman": 62000 },
        "fiat": { "500": 16000, "panda": 14000, "tipo": 20000, "500x": 24000, "ducato": 35000, "doblo": 22000 },
        "hyundai": { "i10": 14000, "i20": 18000, "i30": 26000, "tucson": 34000, "kona": 28000, "ioniq": 35000, "ioniq 5": 42000, "santa fe": 42000, "bayon": 20000 },
        "kia": { "picanto": 14000, "rio": 18000, "ceed": 26000, "sportage": 34000, "niro": 32000, "ev6": 45000, "stonic": 22000, "sorento": 44000, "xceed": 28000 },
        "nissan": { "micra": 16000, "juke": 24000, "qashqai": 32000, "x-trail": 38000, "leaf": 30000, "navara": 38000, "ariya": 42000 },
        "opel": { "corsa": 18000, "astra": 26000, "mokka": 26000, "crossland": 24000, "grandland": 34000, "combo": 24000, "vivaro": 34000 },
        "volvo": { "xc40": 36000, "xc60": 50000, "xc90": 68000, "s60": 42000, "v60": 44000, "v90": 55000, "c40": 42000, "ex30": 35000 },
        "land rover": { "evoque": 42000, "discovery": 55000, "defender": 60000, "range rover": 110000, "velar": 58000, "discovery sport": 40000 },
        "jaguar": { "e-pace": 38000, "f-pace": 55000, "xe": 40000, "xf": 50000, "f-type": 75000, "i-pace": 65000 },
        "mini": { "cooper": 26000, "countryman": 32000, "clubman": 30000, "one": 22000, "john cooper works": 38000 },
        "skoda": { "fabia": 18000, "octavia": 28000, "karoq": 30000, "kodiaq": 38000, "superb": 38000, "scala": 22000, "enyaq": 40000, "kamiq": 24000 },
        "seat": { "ibiza": 18000, "leon": 26000, "arona": 22000, "ateca": 30000, "tarraco": 38000 },
        "mazda": { "2": 18000, "3": 26000, "cx-3": 24000, "cx-30": 28000, "cx-5": 34000, "cx-60": 44000, "mx-5": 32000 },
        "honda": { "jazz": 22000, "civic": 30000, "hr-v": 28000, "cr-v": 38000, "e": 36000, "zr-v": 38000 },
        "suzuki": { "swift": 16000, "vitara": 24000, "s-cross": 26000, "ignis": 16000, "jimny": 22000 },
        "jeep": { "renegade": 28000, "compass": 34000, "wrangler": 55000, "grand cherokee": 65000, "avenger": 30000 },
        "ds": { "ds3": 28000, "ds4": 36000, "ds7": 48000, "ds9": 55000 },
        "alfa romeo": { "giulia": 40000, "stelvio": 48000, "tonale": 38000, "giulietta": 28000 },
        "lexus": { "ux": 36000, "nx": 48000, "rx": 62000, "es": 50000, "is": 42000, "lc": 95000, "ls": 110000, "rz": 55000 },
      };

      const year = new Date().getFullYear();
      const age = input.annee ? Math.max(0, year - input.annee) : 6;
      const brandKey = input.marque.toLowerCase().trim();
      const modelKey = input.modele.toLowerCase().trim();

      // Chercher d'abord le prix par modèle, sinon par marque
      const modelMap = modelBases[brandKey];
      let base: number;
      if (modelMap) {
        // Chercher correspondance exacte ou partielle
        const exactMatch = modelMap[modelKey];
        if (exactMatch) {
          base = exactMatch;
        } else {
          // Correspondance partielle (ex: "clio iv" → "clio")
          const partialKey = Object.keys(modelMap).find((k) => modelKey.includes(k) || k.includes(modelKey));
          base = partialKey ? modelMap[partialKey] : (brandBases[brandKey] || 26000);
        }
      } else {
        base = brandBases[brandKey] || 26000;
      }

      // Décote réaliste : 1ère année -25%, puis -12%/an standard, -10%/an premium
      const isPremium = ["bmw", "mercedes", "audi", "porsche", "tesla", "jaguar", "land rover", "lexus", "volvo", "ds", "alfa romeo"].includes(brandKey);
      let mid: number;
      if (age === 0) {
        mid = base;
      } else if (age === 1) {
        // 1ère année : grosse décote (-20% standard, -15% premium)
        mid = base * (isPremium ? 0.85 : 0.80);
      } else {
        const firstYearFactor = isPremium ? 0.85 : 0.80;
        const annualFactor = isPremium ? 0.92 : 0.90;
        mid = base * firstYearFactor * Math.pow(annualFactor, age - 1);
      }

      // Ajustement carburant : diesel décote plus vite depuis 2020, électrique garde mieux
      if (input.carburant) {
        const c = input.carburant.toLowerCase();
        if (c === "diesel" && age <= 5) mid *= 0.92; // diesel récent perd de la valeur
        else if (c === "electrique") mid *= 1.08; // électrique garde mieux
        else if (c === "hybride") mid *= 1.05;
      }

      // Ajustement boîte : automatique vaut plus
      if (input.boite === "automatique") mid *= 1.06;

      // Pénalité kilométrique — proportionnelle au prix du véhicule
      if (input.kilometrage != null && input.kilometrage > 0) {
        const kmNormal = Math.max(1, age) * 15000; // 15 000 km/an en moyenne en France
        const excessKm = Math.max(0, input.kilometrage - kmNormal);
        // Pénalité proportionnelle : ~0.5% du prix par tranche de 5 000 km excédentaires
        const kmPenalty = (excessKm / 5000) * mid * 0.005;
        mid -= kmPenalty;
        // Bonus si faible km (véhicule peu roulé)
        if (input.kilometrage < kmNormal * 0.5) mid *= 1.10;
        else if (input.kilometrage < kmNormal * 0.7) mid *= 1.05;
        // Grosse pénalité haute kilométrage
        if (input.kilometrage > 250000) mid *= 0.65;
        else if (input.kilometrage > 200000) mid *= 0.75;
        else if (input.kilometrage > 150000) mid *= 0.85;
        else if (input.kilometrage > 100000) mid *= 0.92;
      }

      // Ajustement état général
      if (input.etat) {
        const etatFactors: Record<string, number> = {
          "Excellent": 1.10,
          "Très bon": 1.05,
          "Bon": 1.00,
          "Correct": 0.90,
          "À rénover": 0.70,
        };
        mid *= etatFactors[input.etat] || 1.0;
      }

      mid = Math.max(500, Math.round(mid));
      // Fourchette ±15% pour refléter la réalité du marché occasion
      return {
        method: "estimation_marche" as const,
        sampleSize: sample.length,
        low: Math.round(mid * 0.85),
        mid,
        high: Math.round(mid * 1.15),
      };
    }),

  // Identification rapide par plaque ou VIN — API externe + fallback base locale
  lookupPlate: publicProcedure
    .input(z.object({
      type: z.enum(["plaque", "vin"]),
      query: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const q = input.query.replace(/[\s]/g, "").toUpperCase();
      const token = process.env.PLATE_API_TOKEN || "TokenDemo2026B";

      // 1. Appel API externe pour identification par plaque
      if (input.type === "plaque") {
        try {
          const url = `https://api.apiplaqueimmatriculation.com/plaque?immatriculation=${encodeURIComponent(q)}&token=${token}&pays=FR`;
          const resp = await fetch(url, { method: "POST", signal: AbortSignal.timeout(8000) });
          if (resp.ok) {
            const data = await resp.json();
            if (data && (data.marque || data.modele)) {
              // Mapper les énergies
              const energyMap: Record<string, string> = {
                "GO": "diesel", "ES": "essence", "EL": "electrique",
                "EH": "hybride", "GH": "hybride", "GL": "gpl",
                "DIESEL": "diesel", "ESSENCE": "essence", "ELECTRIQUE": "electrique",
              };
              const carburant = energyMap[(data.energie || data.carburant || "").toUpperCase()] || data.energie || null;
              return {
                marque: data.marque || null,
                modele: data.modele || data.modele_etude || null,
                version: data.version || data.variante || null,
                annee: data.annee ? Number(data.annee) : (data.date_mise_circulation ? Number(data.date_mise_circulation.substring(0, 4)) : null),
                carburant,
                categorie: null,
                boite: data.boite || data.boite_vitesse || null,
                puissance: data.puissance_cv || data.puissance_fiscale || null,
              };
            }
          }
        } catch {
          // API externe indisponible — on continue avec le fallback
        }
      }

      // 2. Pour VIN, essayer l'API VIN
      if (input.type === "vin" && q.length >= 11) {
        try {
          const url = `https://api.apiplaqueimmatriculation.com/vin?vin=${encodeURIComponent(q)}&token=${token}`;
          const resp = await fetch(url, { method: "POST", signal: AbortSignal.timeout(8000) });
          if (resp.ok) {
            const data = await resp.json();
            if (data && (data.marque || data.modele)) {
              return {
                marque: data.marque || null,
                modele: data.modele || null,
                version: data.version || null,
                annee: data.annee ? Number(data.annee) : null,
                carburant: data.energie || data.carburant || null,
                categorie: null,
                boite: data.boite || null,
                puissance: data.puissance_cv || null,
              };
            }
          }
        } catch {
          // API VIN indisponible
        }
      }

      // 3. Fallback : chercher dans les annonces existantes
      const existing = await db
        .select({
          marque: annonces.marque,
          modele: annonces.modele,
          version: annonces.version,
          annee: annonces.annee,
          carburant: annonces.carburant,
          categorie: annonces.categorie,
        })
        .from(annonces)
        .where(ilike(annonces.titre, `%${q}%`))
        .limit(1);

      if (existing.length > 0) {
        const e = existing[0];
        return {
          marque: e.marque,
          modele: e.modele,
          version: e.version,
          annee: e.annee,
          carburant: e.carburant,
          categorie: e.categorie,
          boite: null,
          puissance: null,
        };
      }

      return null;
    }),

  incrementView: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db
        .update(annonces)
        .set({ vues: sql`${annonces.vues} + 1` })
        .where(eq(annonces.id, input.id));
      return { ok: true };
    }),

  // Mes annonces (espace compte)
  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(annonces)
      .where(eq(annonces.ownerId, ctx.user.uid))
      .orderBy(desc(annonces.createdAt));
  }),

  // État du quota d'annonces (alerte préventive côté client, jamais de blocage)
  quotaStatus: protectedProcedure.query(async ({ ctx }) => quotaInfo(ctx.user.uid)),

  // Dépôt d'annonce (Vendre)
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["vente", "location"]).default("vente"),
        titre: z.string().min(3),
        description: z.string().optional(),
        marque: z.string().min(1),
        modele: z.string().min(1),
        version: z.string().optional(),
        categorie: categorieEnum.default("berline"),
        famille: z.enum(["auto", "moto"]).default("auto"),
        carburant: z.string().default("essence"),
        boite: z.string().default("manuelle"),
        annee: z.number().optional(),
        kilometrage: z.number().optional(),
        couleur: z.string().optional(),
        puissanceCv: z.number().optional(),
        portes: z.number().optional(),
        places: z.number().optional(),
        prix: z.number().default(0),
        prixJour: z.number().optional(),
        prixSemaine: z.number().optional(),
        prixMois: z.number().optional(),
        ville: z.string().optional(),
        codePostal: z.string().optional(),
        pays: z.string().default("FR"),
        contactTelephone: z.string().optional(),
        photos: z.array(z.union([
          z.string(),
          z.object({ url: z.string(), categorie: z.string().optional() }),
        ])).default([]),
        pointsForts: z.array(z.string()).default([]),
        equipements: z.array(z.string()).default([]),
        imperfections: z.array(z.string()).default([]),
        sellerie: z.string().optional(),
        cylindree: z.string().optional(),
        consommation: z.string().optional(),
        classeEmission: z.string().optional(),
        confort: z.array(z.string()).default([]),
        multimedia: z.array(z.string()).default([]),
        securite: z.array(z.string()).default([]),
        videos360: z.array(z.string()).default([]),
        videosNormales: z.array(z.string()).default([]),
        // Admin-only: catégorie d'annonce (officielle/professionnelle/particulier)
        categorieAnnonce: z.enum(["officielle", "professionnelle", "particulier"]).optional(),
        // Employé: publier au nom d'un client
        onBehalfOfUserId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { photos, pointsForts, equipements, imperfections, confort, multimedia, securite, videos360, videosNormales, categorieAnnonce: inputCatAnnonce, onBehalfOfUserId, ...rest } = input;

      // Déterminer la catégorie d'annonce (vérifier le rôle actuel en DB, pas seulement le JWT)
      const [dbUser] = await db.select({ role: users.role, staffPosition: users.staffPosition, accountType: users.accountType }).from(users).where(eq(users.id, ctx.user.uid)).limit(1);
      const effectiveRole = dbUser?.role || ctx.user.role;
      const isAdminUser = effectiveRole === "admin" || effectiveRole === "super_admin";
      const isEmployee = isAdminUser || effectiveRole === "employee";
      const isProUser = effectiveRole === "pro" || effectiveRole === "garage" || effectiveRole === "society";
      let categorieAnnonce: "officielle" | "professionnelle" | "particulier";
      if (isEmployee && inputCatAnnonce) {
        categorieAnnonce = inputCatAnnonce;
      } else if (isAdminUser) {
        categorieAnnonce = "officielle";
      } else if (isProUser) {
        categorieAnnonce = "professionnelle";
      } else {
        categorieAnnonce = "particulier";
      }

      // Déduire vendeurType et ownership depuis categorieAnnonce
      const vendeurType = categorieAnnonce === "particulier" ? "particulier" : "professionnel";
      const ownership = categorieAnnonce === "officielle" ? "plateforme" : "client";

      // Propriétaire effectif : si un employé publie au nom d'un client
      const effectiveOwnerId = (isEmployee && onBehalfOfUserId) ? onBehalfOfUserId : ctx.user.uid;
      const createdByEmployeeId = (isEmployee && onBehalfOfUserId) ? ctx.user.uid : undefined;

      // Contrôle automatique de cohérence
      if (categorieAnnonce === "officielle" && !isEmployee) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les employés et la direction peuvent créer des annonces officielles MKA.P-MS" });
      }
      if (categorieAnnonce === "professionnelle" && !isProUser && !isEmployee) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les professionnels et la direction peuvent créer des annonces professionnelles" });
      }

      const [created] = await db
        .insert(annonces)
        .values({
          ownerId: effectiveOwnerId,
          titre: rest.titre,
          description: rest.description,
          marque: rest.marque,
          modele: rest.modele,
          version: rest.version,
          type: rest.type,
          categorie: rest.categorie as any,
          famille: rest.famille as any,
          carburant: rest.carburant as any,
          boite: rest.boite as any,
          annee: rest.annee,
          kilometrage: rest.kilometrage,
          couleur: rest.couleur,
          puissanceCv: rest.puissanceCv,
          portes: rest.portes,
          places: rest.places,
          prix: String(rest.prix),
          prixJour: rest.prixJour != null ? String(rest.prixJour) : undefined,
          prixSemaine: rest.prixSemaine != null ? String(rest.prixSemaine) : undefined,
          prixMois: rest.prixMois != null ? String(rest.prixMois) : undefined,
          ville: rest.ville,
          codePostal: rest.codePostal,
          pays: rest.pays,
          contactTelephone: rest.contactTelephone,
          vendeurType,
          ownership,
          categorieAnnonce,
          createdByEmployeeId: createdByEmployeeId ?? null,
          onBehalfOfUserId: onBehalfOfUserId ?? null,
          status: "publiee",
          publishedAt: new Date(),
          sellerie: rest.sellerie,
          cylindree: rest.cylindree,
          consommation: rest.consommation,
          classeEmission: rest.classeEmission,
          pointsForts: JSON.stringify(pointsForts),
          equipements: JSON.stringify(equipements),
          imperfections: JSON.stringify(imperfections),
          confort: JSON.stringify(confort),
          multimedia: JSON.stringify(multimedia),
          securite: JSON.stringify(securite),
          videos360: JSON.stringify(videos360),
          videosNormales: JSON.stringify(videosNormales),
        })
        .returning();

      // Journal d'activité — création
      await logAction(ctx.user.uid, "annonce.create", "annonce", created.id, {
        categorieAnnonce,
        titre: rest.titre,
        marque: rest.marque,
        modele: rest.modele,
        onBehalfOf: onBehalfOfUserId ?? null,
      });

      // Référence unique lisible (Partie 6) — générée à partir de l'id.
      const reference = makeReference("A", created.id);
      await db.update(annonces).set({ reference }).where(eq(annonces.id, created.id));
      created.reference = reference;

      if (photos.length) {
        await db.insert(annoncePhotos).values(
          photos.slice(0, 30).map((p, i) => {
            const isObj = typeof p === "object" && p !== null;
            return {
              annonceId: created.id,
              url: isObj ? (p as { url: string }).url : (p as string),
              categorie: isObj ? (p as { categorie?: string }).categorie || null : null,
              ordre: i,
            };
          }),
        );
      }

      // Alerte recherches sauvegardées (Partie 6) — notifie les comptes intéressés.
      try {
        await notifyMatchingSearches(created);
      } catch (err) {
        console.error("[notifyMatchingSearches]", (err as Error).message);
      }

      // Règle Partie A §2 : pas de blocage. Si le quota est dépassé, on TRACE le
      // dépassement facturé (radar PDG + comptabilité) au lieu de refuser l'annonce.
      const quota = await quotaInfo(ctx.user.uid);
      let overageBilled = 0;
      if (quota.over && quota.overageEur > 0) {
        overageBilled = quota.overageEur;
        await logAction(ctx.user.uid, "annonce.overage", "annonce", created.id, {
          planCode: quota.planCode,
          used: quota.used,
          limit: quota.limit,
          overageEur: quota.overageEur,
        });
      }
      return { ...created, overageBilled, quota };
    }),

  myList: protectedProcedure
    .query(async ({ ctx }) => {
      const rows = await db.select().from(annonces).where(eq(annonces.ownerId, ctx.user.uid)).orderBy(sql`${annonces.createdAt} DESC`);
      const ids = rows.map((r) => r.id);
      const photos = ids.length
        ? await db.select().from(annoncePhotos).where(sql`${annoncePhotos.annonceId} in (${sql.join(ids, sql`, `)})`)
        : [];
      const photoMap = new Map<number, string>();
      for (const p of photos) {
        if (!photoMap.has(p.annonceId!)) photoMap.set(p.annonceId!, p.url);
      }
      return rows.map((r) => ({ ...r, photoPrincipale: photoMap.get(r.id) ?? null }));
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      prix: z.number().optional(),
      description: z.string().optional(),
      kilometrage: z.number().optional(),
      ville: z.string().optional(),
      status: z.enum(["publiee", "reservee", "vendue", "archivee"]).optional(),
      categorieAnnonce: z.enum(["officielle", "professionnelle", "particulier"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin" || ctx.user.role === "directeur";
      const [a] = await db.select().from(annonces).where(eq(annonces.id, input.id)).limit(1);
      if (!a || (a.ownerId !== ctx.user.uid && !isAdmin)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, categorieAnnonce, ...updates } = input;
      const filtered: Record<string, unknown> = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));

      // Changement de catégorie — admin uniquement
      if (categorieAnnonce && isAdmin) {
        filtered.categorieAnnonce = categorieAnnonce;
        filtered.vendeurType = categorieAnnonce === "particulier" ? "particulier" : "professionnel";
        filtered.ownership = categorieAnnonce === "officielle" ? "plateforme" : "client";
      }

      if (Object.keys(filtered).length > 0) {
        await db.update(annonces).set(filtered).where(eq(annonces.id, id));
        await logAction(ctx.user.uid, "annonce.update", "annonce", id, {
          changes: Object.keys(filtered),
          categorieAnnonce: categorieAnnonce ?? a.categorieAnnonce,
        });
      }
      return { ok: true };
    }),

  remove: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().optional(),
      soldOnPlatform: z.boolean().optional(),
      soldPrice: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin" || ctx.user.role === "super_admin" || ctx.user.role === "directeur";
      const [a] = await db.select().from(annonces).where(eq(annonces.id, input.id)).limit(1);
      if (!a || (a.ownerId !== ctx.user.uid && !isAdmin)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.update(annonces).set({ status: "archivee" }).where(eq(annonces.id, input.id));
      await logAction(ctx.user.uid, "annonce.delete", "annonce", input.id, {
        reason: input.reason,
        categorieAnnonce: a.categorieAnnonce,
        titre: a.titre,
      });
      return { ok: true };
    }),
});
