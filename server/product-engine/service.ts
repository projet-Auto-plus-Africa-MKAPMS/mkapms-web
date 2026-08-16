/**
 * MKA.P-MS GOOGLE PRODUCT ENGINE — points 95, 96, 97.
 *
 * Le moteur lit le catalogue réel de la plateforme (boutique pièces
 * `parts_catalog` + stock, et l'inventaire `pieces`), en projette une fiche
 * commerciale, puis trace la chaîne du point 97 maillon par maillon :
 *
 *   base produit → SEO → Schema Product → Product Engine
 *                → Merchant si éligible → Audience → Social → Système Intelligent
 *
 * Ce que le moteur ne fait jamais :
 *   • pousser un véhicule dans un catalogue de produits (point 94) ;
 *   • confondre « envoyé », « approuvé » et « visible » (point 96) ;
 *   • déclarer un produit visible chez Google sans retour de Merchant Center.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { env } from "../env.js";
import { raiseAlert } from "../smart-engine/services/alert-engine.js";
import { logActivity } from "../smart-engine/services/activity-log.js";
import {
  productFeedItems,
  productFeedRuns,
  productSyncEvents,
} from "./schema.js";
import {
  empreinte,
  evaluerEligibilite,
  pipelineDe,
  type ProduitCandidat,
  type Verdict,
} from "./eligibility.js";

/** Maillons de la chaîne du point 97, dans l'ordre. */
export const MAILLONS = [
  "base_produit",
  "seo",
  "schema_product",
  "product_engine",
  "merchant",
  "audience",
  "social",
  "systeme_intelligent",
] as const;
export type Maillon = (typeof MAILLONS)[number];

export const MAILLON_LABELS: Record<Maillon, string> = {
  base_produit: "Base produit",
  seo: "SEO",
  schema_product: "Données structurées Product",
  product_engine: "Google Product Engine",
  merchant: "Merchant Center (si éligible)",
  audience: "Audience",
  social: "Réseaux sociaux",
  systeme_intelligent: "Système Intelligent",
};

function baseUrl(): string {
  return (env.PUBLIC_URL || "").replace(/\/+$/, "");
}

/**
 * État du connecteur Merchant Center. Honnête par construction : sans
 * identifiants, aucun produit ne peut être déclaré approuvé ni visible.
 */
export interface MerchantState {
  configure: boolean;
  detail: string;
}

export function merchantState(): MerchantState {
  const brut =
    process.env.GOOGLE_MERCHANT_CREDENTIALS ?? process.env.GOOGLE_MERCHANT_ACCOUNT_ID ?? null;
  if (!brut) {
    return {
      configure: false,
      detail:
        "Aucun compte Merchant Center connecté : le flux produit est préparé et publié à l'adresse /feeds/produits.xml, mais personne ne peut affirmer qu'un produit est approuvé ou visible chez Google. Les trois états restent séparés et non confirmés.",
    };
  }
  return {
    configure: true,
    detail: "Compte Merchant Center connecté : les états envoyé / approuvé / visible peuvent être relevés.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lecture du catalogue réel
// ─────────────────────────────────────────────────────────────────────────────

async function tableExiste(table: string): Promise<boolean> {
  if (!/^[a-z0-9_]+$/.test(table)) return false;
  try {
    const r = await db.execute(
      sql`SELECT to_regclass(${`public.${table}`}) IS NOT NULL AS ok`,
    );
    const rows = (r as unknown as { rows?: { ok?: boolean }[] }).rows ?? [];
    return !!rows[0]?.ok;
  } catch {
    return false;
  }
}

/** Fiches issues de la boutique pièces professionnelle. */
async function candidatsBoutique(limit: number): Promise<ProduitCandidat[]> {
  if (!(await tableExiste("parts_catalog"))) return [];
  const base = baseUrl();
  try {
    const r = await db.execute(sql`
      SELECT c.id, c.nom, c.description, c.reference_interne, c.reference_oem,
             c.code_barre, c.categorie, c.marque_piece, c.condition, c.prix_ttc,
             c.prix_ht, c.currency, c.photo_url, c.active,
             COALESCE(SUM(s.quantite - s.quantite_reservee), 0) AS dispo
        FROM parts_catalog c
   LEFT JOIN parts_stock s ON s.catalog_id = c.id
       WHERE c.active = true
    GROUP BY c.id
    ORDER BY c.updated_at DESC
       LIMIT ${limit}
    `);
    const rows = (r as unknown as { rows?: Record<string, unknown>[] }).rows ?? [];
    return rows.map((row) => {
      const dispo = Number(row.dispo ?? 0);
      const prix = (row.prix_ttc ?? row.prix_ht ?? null) as string | null;
      return {
        source: "parts_catalog",
        sourceId: Number(row.id),
        titre: String(row.nom ?? ""),
        description: String(row.description ?? ""),
        url: base ? `${base}/pieces/${row.id}` : "",
        imageUrl: (row.photo_url as string | null) ?? null,
        prix: prix ? String(prix) : null,
        devise: String(row.currency ?? "EUR"),
        disponibilite: dispo > 0 ? "en_stock" : "indisponible",
        etat: String(row.condition ?? "neuf"),
        marque: (row.marque_piece as string | null) ?? null,
        gtin: (row.code_barre as string | null) ?? null,
        mpn: (row.reference_oem as string | null) ?? (row.reference_interne as string | null) ?? null,
        pays: "FR",
        langue: "fr",
        categorie: (row.categorie as string | null) ?? null,
      } satisfies ProduitCandidat;
    });
  } catch {
    return [];
  }
}

/** Fiches issues de l'inventaire simple `pieces`. */
async function candidatsInventaire(limit: number): Promise<ProduitCandidat[]> {
  if (!(await tableExiste("pieces"))) return [];
  const base = baseUrl();
  try {
    const r = await db.execute(sql`
      SELECT id, reference, designation, description, prix_vente, stock
        FROM pieces
       WHERE prix_vente IS NOT NULL
    ORDER BY updated_at DESC
       LIMIT ${limit}
    `);
    const rows = (r as unknown as { rows?: Record<string, unknown>[] }).rows ?? [];
    return rows.map((row) => ({
      source: "pieces",
      sourceId: Number(row.id),
      titre: String(row.designation ?? ""),
      description: String(row.description ?? ""),
      url: base ? `${base}/pieces/inventaire/${row.id}` : "",
      imageUrl: null,
      prix: row.prix_vente ? String(row.prix_vente) : null,
      devise: "EUR",
      disponibilite: Number(row.stock ?? 0) > 0 ? "en_stock" : "indisponible",
      etat: "neuf",
      marque: null,
      gtin: null,
      mpn: (row.reference as string | null) ?? null,
      pays: "FR",
      langue: "fr",
      categorie: null,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chaîne de synchronisation (point 97)
// ─────────────────────────────────────────────────────────────────────────────

async function tracer(
  candidat: ProduitCandidat,
  itemId: number | null,
  declencheur: string,
  maillon: Maillon,
  resultat: "ok" | "attente" | "ignore" | "echec",
  detail: string,
): Promise<void> {
  try {
    await db.insert(productSyncEvents).values({
      itemId,
      source: candidat.source,
      sourceId: candidat.sourceId,
      declencheur,
      maillon,
      resultat,
      detail,
    });
  } catch {
    /* la trace ne bloque jamais la synchronisation */
  }
}

export interface SyncResult {
  itemId: number | null;
  pipeline: "produit" | "vehicule";
  verdict: Verdict;
  change: boolean;
  maillons: { maillon: Maillon; resultat: string; detail: string }[];
}

/**
 * Synchronise une fiche unique le long de toute la chaîne. Appelée au dépôt,
 * à la modification et à la vente — c'est le point 97 : un seul appel,
 * toutes les destinations actualisées, aucune reprise manuelle dans cinq
 * systèmes.
 */
export async function syncProduit(
  candidat: ProduitCandidat,
  declencheur: "depot" | "modification" | "vente" | "suppression" | "rafraichissement" = "depot",
): Promise<SyncResult> {
  const pipeline = pipelineDe(candidat.source, candidat.categorie);
  const verdict = evaluerEligibilite(candidat);
  const merchant = merchantState();
  const emp = empreinte(candidat);
  const maillons: SyncResult["maillons"] = [];
  const note = (maillon: Maillon, resultat: "ok" | "attente" | "ignore" | "echec", detail: string) => {
    maillons.push({ maillon, resultat, detail });
    return tracer(candidat, null, declencheur, maillon, resultat, detail);
  };

  await note("base_produit", "ok", `Fiche lue depuis ${candidat.source} n°${candidat.sourceId}.`);

  if (pipeline === "vehicule") {
    // Point 94 : un véhicule ne descend pas ce tuyau. Il est renvoyé au
    // tuyau annonces, et le motif est écrit plutôt que masqué.
    await note("seo", "ignore", "Tuyau véhicule : la visibilité passe par le SEO d'annonces.");
    await note("schema_product", "ignore", "Schéma Product inadapté à un véhicule.");
    await note("product_engine", "ignore", verdict.motif);
    await note("merchant", "ignore", verdict.motif);
    await note("audience", "ok", "Véhicule diffusé par le tuyau annonces / Audience.");
    await note("social", "ok", "Véhicule diffusé par le Social Content Engine.");
    await note("systeme_intelligent", "ok", "Événement remonté au Système Intelligent.");
    return { itemId: null, pipeline, verdict, change: false, maillons };
  }

  const disponibilite =
    declencheur === "vente" || declencheur === "suppression" ? "indisponible" : candidat.disponibilite;

  const existant = await db
    .select()
    .from(productFeedItems)
    .where(
      and(eq(productFeedItems.source, candidat.source), eq(productFeedItems.sourceId, candidat.sourceId)),
    )
    .limit(1);

  const valeurs = {
    source: candidat.source,
    sourceId: candidat.sourceId,
    offerId: `${candidat.source}-${candidat.sourceId}`,
    titre: candidat.titre.slice(0, 255),
    description: candidat.description,
    url: candidat.url.slice(0, 512),
    imageUrl: candidat.imageUrl,
    prix: candidat.prix,
    devise: candidat.devise,
    disponibilite,
    etat: candidat.etat,
    marque: candidat.marque,
    gtin: candidat.gtin,
    mpn: candidat.mpn,
    pays: candidat.pays,
    langue: candidat.langue,
    categorie: candidat.categorie,
    eligible: verdict.eligible && disponibilite !== "indisponible",
    motifIneligible: verdict.eligible ? "" : verdict.motif,
    attributsManquants: [...verdict.manquants, ...verdict.recommandesManquants],
    // Envoyé : le flux public contient réellement la fiche.
    envoye: verdict.eligible && disponibilite !== "indisponible",
    // Approuvé / visible : inconnus sans retour Merchant Center. Jamais supposés.
    approuve: merchant.configure ? (existant[0]?.approuve ?? false) : false,
    visible: merchant.configure ? (existant[0]?.visible ?? false) : false,
    etatCanal: merchant.detail,
    empreinte: emp,
    majLe: new Date(),
  };

  let itemId: number | null = existant[0]?.id ?? null;
  const change = !existant[0] || existant[0].empreinte !== emp;

  if (existant[0]) {
    await db.update(productFeedItems).set(valeurs).where(eq(productFeedItems.id, existant[0].id));
  } else {
    const inserted = await db.insert(productFeedItems).values(valeurs).returning({ id: productFeedItems.id });
    itemId = inserted[0]?.id ?? null;
  }

  await note(
    "seo",
    candidat.url ? "ok" : "echec",
    candidat.url ? `Page produit publique : ${candidat.url}` : "Aucune URL publique (PUBLIC_URL absente).",
  );
  await note(
    "schema_product",
    verdict.eligible ? "ok" : "attente",
    verdict.eligible
      ? "Données structurées Product complètes (offre, prix, devise, disponibilité, état)."
      : `Schéma Product incomplet : ${verdict.manquants.join(", ") || "attributs recommandés manquants"}.`,
  );
  await note(
    "product_engine",
    "ok",
    change ? "Fiche projetée et mise à jour dans le flux produit." : "Fiche inchangée, aucune resynchronisation inutile.",
  );
  await note(
    "merchant",
    verdict.eligible ? (merchant.configure ? "attente" : "attente") : "ignore",
    verdict.eligible ? merchant.detail : verdict.motif,
  );
  await note("audience", "ok", "Fiche disponible pour le moteur d'Audience.");
  await note("social", "ok", "Fiche disponible pour le Social Content Engine.");

  try {
    await logActivity({
      action: `product.${declencheur}`,
      targetType: "produit",
      targetId: candidat.sourceId,
      data: {
        source: candidat.source,
        eligible: valeurs.eligible,
        disponibilite,
        motif: valeurs.motifIneligible,
      },
      result: valeurs.eligible ? "success" : "pending",
    });
    await note("systeme_intelligent", "ok", "Événement remonté au Système Intelligent.");
  } catch {
    await note("systeme_intelligent", "echec", "Le journal du Système Intelligent n'a pas pu être écrit.");
  }

  return { itemId, pipeline, verdict, change, maillons };
}

/** Raccourcis appelés par les flux métier (dépôt, modification, vente). */
export async function onPieceChanged(
  source: "parts_catalog" | "pieces",
  sourceId: number,
  declencheur: "depot" | "modification" | "vente" | "suppression",
): Promise<void> {
  try {
    const liste = source === "parts_catalog" ? await candidatsBoutique(500) : await candidatsInventaire(500);
    const candidat = liste.find((c) => c.sourceId === sourceId);
    if (!candidat) {
      // Fiche retirée du catalogue : la destination doit refléter l'absence.
      await db
        .update(productFeedItems)
        .set({
          eligible: false,
          envoye: false,
          approuve: false,
          visible: false,
          disponibilite: "indisponible",
          motifIneligible: "Fiche retirée du catalogue : retirée des destinations.",
          majLe: new Date(),
        })
        .where(and(eq(productFeedItems.source, source), eq(productFeedItems.sourceId, sourceId)));
      return;
    }
    await syncProduit(candidat, declencheur);
  } catch {
    /* la synchronisation ne bloque jamais le flux métier */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rafraîchissement complet + supervision PDG
// ─────────────────────────────────────────────────────────────────────────────

export interface FeedReport {
  runId: number;
  checkedAt: string;
  examines: number;
  eligibles: number;
  inelligibles: number;
  parMotif: Record<string, number>;
  merchant: MerchantState;
  feedUrl: string;
  items: {
    source: string;
    sourceId: number;
    offerId: string;
    titre: string;
    url: string;
    prix: string | null;
    devise: string;
    disponibilite: string;
    eligible: boolean;
    motif: string;
    manquants: string[];
    envoye: boolean;
    approuve: boolean;
    visible: boolean;
  }[];
}

export async function refreshFeed(options?: {
  trigger?: string;
  requestedBy?: number;
  limit?: number;
}): Promise<FeedReport> {
  const limit = options?.limit ?? 200;
  const merchant = merchantState();
  const run = await db
    .insert(productFeedRuns)
    .values({ trigger: options?.trigger ?? "manuel", requestedBy: options?.requestedBy })
    .returning({ id: productFeedRuns.id });
  const runId = run[0]?.id ?? 0;

  const candidats = [...(await candidatsBoutique(limit)), ...(await candidatsInventaire(limit))];
  const parMotif: Record<string, number> = {};
  let eligibles = 0;

  for (const candidat of candidats) {
    const res = await syncProduit(candidat, "rafraichissement");
    if (res.pipeline === "vehicule") {
      parMotif.vehicule_exclu_merchant = (parMotif.vehicule_exclu_merchant ?? 0) + 1;
      continue;
    }
    if (res.verdict.eligible) {
      eligibles += 1;
    } else {
      for (const m of res.verdict.manquants) {
        parMotif[m] = (parMotif[m] ?? 0) + 1;
      }
      if (res.verdict.manquants.length === 0) {
        parMotif.autre = (parMotif.autre ?? 0) + 1;
      }
    }
  }

  const inelligibles = candidats.length - eligibles;

  await db
    .update(productFeedRuns)
    .set({
      finishedAt: new Date(),
      examines: candidats.length,
      eligibles,
      inelligibles,
      parMotif,
      destination: { merchant: merchant.configure, detail: merchant.detail },
    })
    .where(eq(productFeedRuns.id, runId));

  // Alerte de visibilité produit : une majorité de fiches inexploitables est un
  // problème réel, pas un détail cosmétique.
  if (candidats.length >= 5 && eligibles / candidats.length < 0.5) {
    const pct = Math.round((1 - eligibles / candidats.length) * 100);
    await raiseAlert({
      category: "seo",
      title: `Catalogue produit : ${pct}% des fiches ne sont pas exploitables par Google`,
      description: `Sur ${candidats.length} fiche(s) examinée(s), ${inelligibles} ne remplissent pas les attributs exigés. Motifs les plus fréquents : ${Object.entries(
        parMotif,
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([m, n]) => `${m} (${n})`)
        .join(", ")}.`,
      level: "important",
      signature: "product-engine:feed-incomplet",
      lastOccurredAt: new Date(),
    });
  }

  return latestFeedReport(runId);
}

export async function latestFeedReport(runId?: number): Promise<FeedReport> {
  const runs = runId
    ? await db.select().from(productFeedRuns).where(eq(productFeedRuns.id, runId)).limit(1)
    : await db.select().from(productFeedRuns).orderBy(desc(productFeedRuns.id)).limit(1);
  const run = runs[0] ?? null;

  const rows = await db
    .select()
    .from(productFeedItems)
    .orderBy(desc(productFeedItems.majLe))
    .limit(300);

  return {
    runId: run?.id ?? 0,
    checkedAt: (run?.finishedAt ?? run?.startedAt ?? new Date()).toISOString(),
    examines: run?.examines ?? rows.length,
    eligibles: run?.eligibles ?? rows.filter((r) => r.eligible).length,
    inelligibles: run?.inelligibles ?? rows.filter((r) => !r.eligible).length,
    parMotif: (run?.parMotif ?? {}) as Record<string, number>,
    merchant: merchantState(),
    feedUrl: `${baseUrl()}/feeds/produits.xml`,
    items: rows.map((r) => ({
      source: r.source,
      sourceId: r.sourceId,
      offerId: r.offerId,
      titre: r.titre,
      url: r.url,
      prix: r.prix,
      devise: r.devise,
      disponibilite: r.disponibilite,
      eligible: r.eligible,
      motif: r.motifIneligible,
      manquants: (r.attributsManquants ?? []) as string[],
      envoye: r.envoye,
      approuve: r.approuve,
      visible: r.visible,
    })),
  };
}

/** Journal de la chaîne pour une fiche (point 97, écran PDG). */
export async function chaine(source: string, sourceId: number) {
  const rows = await db
    .select()
    .from(productSyncEvents)
    .where(and(eq(productSyncEvents.source, source), eq(productSyncEvents.sourceId, sourceId)))
    .orderBy(desc(productSyncEvents.id))
    .limit(64);
  return rows.map((r) => ({
    id: r.id,
    maillon: r.maillon,
    label: MAILLON_LABELS[r.maillon as Maillon] ?? r.maillon,
    resultat: r.resultat,
    detail: r.detail,
    declencheur: r.declencheur,
    date: r.creeLe.toISOString(),
  }));
}

/**
 * Séparation des deux tuyaux, telle qu'affichée au PDG (point 94) : combien de
 * fiches suivent le tuyau produit, combien suivent le tuyau véhicule, et
 * pourquoi les véhicules n'entrent pas dans Merchant Center.
 */
export async function pipelinesSnapshot() {
  const produits = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(productFeedItems);
  const eligibles = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(productFeedItems)
    .where(eq(productFeedItems.eligible, true));

  let vehicules = 0;
  try {
    const r = await db.execute(
      sql`SELECT count(*)::int AS n FROM annonces WHERE statut = 'publiee'`,
    );
    const rows = (r as unknown as { rows?: { n?: number }[] }).rows ?? [];
    vehicules = Number(rows[0]?.n ?? 0);
  } catch {
    vehicules = 0;
  }

  return {
    produit: {
      libelle: "Produits / pièces",
      fiches: produits[0]?.n ?? 0,
      exploitables: eligibles[0]?.n ?? 0,
      canaux: ["Google Search", "Données structurées Product", "Merchant Center si éligible", "Images / Lens"],
      merchant: merchantState(),
    },
    vehicule: {
      libelle: "Véhicules",
      fiches: vehicules,
      canaux: [
        "SEO d'annonces",
        "Pages véhicules indexables",
        "Données structurées de véhicule",
        "Images",
        "Contenu local",
        "GEO / IA",
      ],
      exclusion:
        "Les véhicules motorisés sont exclus des fiches gratuites Merchant Center. Les traiter comme un catalogue de pièces ne créerait aucune visibilité — seulement des refus.",
    },
  };
}

/**
 * Flux produit public au format attendu par Merchant Center (RSS 2.0 + espace
 * de noms `g:`). Ne contient QUE des fiches réellement éligibles : envoyer une
 * fiche incomplète ne produit qu'un rejet.
 */
export async function buildFeedXml(): Promise<string> {
  const base = baseUrl();
  const rows = await db
    .select()
    .from(productFeedItems)
    .where(eq(productFeedItems.eligible, true))
    .limit(5000);

  const esc = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const dispo = (v: string) => (v === "en_stock" ? "in_stock" : v === "sur_commande" ? "backorder" : "out_of_stock");
  const etat = (v: string) =>
    v === "occasion" ? "used" : v === "reconditionne" || v === "echange_standard" ? "refurbished" : "new";

  const items = rows
    .map((r) => {
      const champs = [
        `<g:id>${esc(r.offerId)}</g:id>`,
        `<title>${esc(r.titre)}</title>`,
        `<description>${esc(r.description)}</description>`,
        `<link>${esc(r.url)}</link>`,
        r.imageUrl ? `<g:image_link>${esc(r.imageUrl)}</g:image_link>` : "",
        r.prix ? `<g:price>${esc(`${r.prix} ${r.devise}`)}</g:price>` : "",
        `<g:availability>${dispo(r.disponibilite)}</g:availability>`,
        `<g:condition>${etat(r.etat)}</g:condition>`,
        r.marque ? `<g:brand>${esc(r.marque)}</g:brand>` : "",
        r.gtin ? `<g:gtin>${esc(r.gtin)}</g:gtin>` : "",
        r.mpn ? `<g:mpn>${esc(r.mpn)}</g:mpn>` : "",
        r.categorie ? `<g:product_type>${esc(r.categorie)}</g:product_type>` : "",
      ]
        .filter(Boolean)
        .join("\n      ");
      return `    <item>\n      ${champs}\n    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MKA.P-MS — pièces et produits</title>
    <link>${esc(base)}</link>
    <description>Flux produit MKA.P-MS. Seules les fiches réellement complètes et disponibles y figurent. Les véhicules n'y figurent jamais : ils sont exclus des fiches gratuites Merchant Center.</description>
${items}
  </channel>
</rss>
`;
}
