/**
 * Proximity Engine — « près de moi » (point 35) + matrice mini-plateformes (34).
 *
 * Deux responsabilités, un seul moteur car elles répondent à la même question :
 * « ce service existe-t-il vraiment là où le visiteur se trouve ? »
 *
 * Aucune distance n'est inventée : elle n'est calculée que lorsque le
 * prestataire porte réellement des coordonnées. Sinon le résultat est renvoyé
 * avec `distanceKm: null` et le mode de filtrage utilisé est indiqué.
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { LOCAL_SERVICES, findService } from "./sources.js";
import { PRODUCT_CATALOG } from "../payment-engine/products.js";
import { NOTIFICATION_TRIGGERS } from "../notification-os/triggers.js";
import { UNIVERSE_ROUTES, type AccountUniverse } from "@shared/account-routing.js";
import { rankByReputation } from "../reputation-engine/ranking.js";

export interface Position {
  latitude: number;
  longitude: number;
}

export interface NearbyProvider {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  /** null = le prestataire n'a pas de coordonnées : aucune distance affichable. */
  distanceKm: number | null;
  /** null = pas encore d'avis, jamais une note fabriquée. */
  rating: number | null;
  reviewCount: number;
  /** Part d'expériences vérifiées après transaction réelle (point 53). */
  verifiedCount: number;
  /** Score de classement combiné, null si la réputation n'est pas branchée. */
  score: number | null;
}

export type NearbyMode = "distance" | "ville" | "pays" | "non_configure";

export interface NearbyResult {
  service: string;
  label: string;
  path: string;
  mode: NearbyMode;
  /** Explication du mode retenu, affichable telle quelle au visiteur. */
  explication: string;
  /** Critères réellement pris en compte dans l'ordre affiché (point 53). */
  classement: string;
  results: NearbyProvider[];
}

async function tableExists(table: string): Promise<boolean> {
  const r = await db.execute<{ reg: string | null }>(
    sql`select to_regclass(${`public.${table}`})::text as reg`,
  );
  return Boolean(r.rows[0]?.reg);
}

export interface NearbyInput {
  service: string;
  position?: Position | null;
  city?: string | null;
  countryCode?: string;
  radiusKm?: number;
  limit?: number;
}

export async function nearby(input: NearbyInput): Promise<NearbyResult> {
  const svc = findService(input.service);
  if (!svc) throw new Error(`Service local inconnu : ${input.service}`);

  const base = { service: svc.code, label: svc.label, path: svc.path };

  if (!svc.source) {
    return {
      ...base,
      mode: "non_configure",
      explication: svc.missingReason ?? "Service local non configuré.",
      classement: "Aucun classement : ce service n'a pas de prestataires localisables.",
      results: [],
    };
  }
  if (!(await tableExists(svc.source.table))) {
    return {
      ...base,
      mode: "non_configure",
      explication: `La table « ${svc.source.table} » n'existe pas encore : le service n'est pas localisable.`,
      classement: "Aucun classement : la source des prestataires n'existe pas encore.",
      results: [],
    };
  }

  const s = svc.source;
  const country = (input.countryCode ?? "FR").toUpperCase();
  const limit = Math.min(input.limit ?? 20, 100);
  const radius = input.radiusKm ?? 50;

  const hasCoords = s.latColumn !== null && s.lngColumn !== null;
  const useDistance = hasCoords && input.position != null;

  // Haversine en SQL : le tri par distance doit être fait par la base, pas
  // après troncature du résultat — sinon le « plus proche » est faux.
  const distanceExpr = useDistance
    ? sql`round((6371 * acos(
          least(1, cos(radians(${input.position!.latitude}))
            * cos(radians(${sql.raw(s.latColumn!)}::float8))
            * cos(radians(${sql.raw(s.lngColumn!)}::float8) - radians(${input.position!.longitude}))
            + sin(radians(${input.position!.latitude}))
            * sin(radians(${sql.raw(s.latColumn!)}::float8))
          )))::numeric, 1)`
    : sql`null::numeric`;

  const conditions = [sql`${sql.raw(s.visibleWhere)}`, sql`upper(${sql.raw(s.countryColumn)}) = ${country}`];
  let mode: NearbyMode = "pays";
  let explication = `Aucune position fournie : résultats filtrés sur le pays ${country}.`;

  if (useDistance) {
    conditions.push(sql`${sql.raw(s.latColumn!)} is not null and ${sql.raw(s.lngColumn!)} is not null`);
    mode = "distance";
    explication = `Prestataires situés à moins de ${radius} km de votre position.`;
  } else if (input.city) {
    conditions.push(sql`lower(${sql.raw(s.cityColumn)}) = lower(${input.city})`);
    mode = "ville";
    explication = hasCoords
      ? `Position non disponible : résultats filtrés sur la ville « ${input.city} », sans distance.`
      : `Ces prestataires n'ont pas de coordonnées en base : filtrage par ville « ${input.city} », aucune distance calculable.`;
  }

  const where = conditions.reduce((acc, c, i) => (i === 0 ? c : sql`${acc} and ${c}`));
  const havingDistance = useDistance ? sql` where d.distance_km <= ${radius}` : sql``;

  const rows = await db.execute<{
    id: number;
    name: string;
    city: string | null;
    country: string | null;
    address: string | null;
    phone: string | null;
    distance_km: string | null;
    rating: string | null;
    review_count: number | null;
  }>(sql`
    select * from (
      select
        id,
        ${sql.raw(s.nameColumn)} as name,
        ${sql.raw(s.cityColumn)} as city,
        ${sql.raw(s.countryColumn)} as country,
        ${s.addressColumn ? sql.raw(s.addressColumn) : sql`null`} as address,
        ${s.phoneColumn ? sql.raw(s.phoneColumn) : sql`null`} as phone,
        ${distanceExpr} as distance_km,
        ${s.ratingColumn ? sql.raw(s.ratingColumn) : sql`null`} as rating,
        ${s.ratingCountColumn ? sql.raw(s.ratingCountColumn) : sql`0`} as review_count
      from ${sql.raw(s.table)}
      where ${where}
    ) d${havingDistance}
    order by ${useDistance ? sql`d.distance_km asc` : sql`d.name asc`}
    limit ${limit}
  `);

  const bruts = rows.rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    city: r.city,
    country: r.country,
    address: r.address,
    phone: r.phone,
    distanceKm: r.distance_km === null ? null : Number(r.distance_km),
    // Une note n'existe que s'il y a au moins un avis : sinon on n'affiche rien.
    rating: r.rating !== null && Number(r.review_count ?? 0) > 0 ? Number(r.rating) : null,
    reviewCount: Number(r.review_count ?? 0),
    verifiedCount: 0,
    score: null as number | null,
  }));

  // Point 53 — la réputation entre dans le classement quand le service est
  // rattaché à des avis. La note affichée reste la note réelle : seul l'ordre
  // est pondéré, pour qu'une note parfaite sur deux avis ne devance pas une
  // réputation établie sur plusieurs centaines d'expériences.
  if (!svc.reviewTargetType) {
    return {
      ...base,
      mode,
      explication,
      classement: useDistance
        ? "Distance uniquement : ce service n'est pas encore rattaché aux avis."
        : "Ordre alphabétique : ni distance ni avis disponibles pour ce service.",
      results: bruts,
    };
  }

  const classes = await rankByReputation(svc.reviewTargetType, bruts, { rayonKm: radius });
  return {
    ...base,
    mode,
    explication,
    classement:
      "Qualité pondérée par le nombre d'avis, distance, part d'expériences vérifiées et disponibilité.",
    results: classes.map((c) => ({
      ...c.item,
      rating: c.reputation.average ?? c.item.rating,
      reviewCount: c.reputation.total > 0 ? c.reputation.total : c.item.reviewCount,
      verifiedCount: c.reputation.verifiedCount,
      score: c.score,
    })),
  };
}

/** Services localisables et services encore non branchés — pour la page « près de moi ». */
export function localServiceCatalog() {
  return LOCAL_SERVICES.map((s) => ({
    code: s.code,
    label: s.label,
    univers: s.univers,
    path: s.path,
    localisable: s.source !== null,
    distanceDisponible: s.source?.latColumn != null,
    raisonManquante: s.missingReason ?? null,
  }));
}

/* ══════════════════════════════════════════════════════════════════════════
   Point 34 — chaque univers est une mini-plateforme, pas une page.
   La matrice ci-dessous n'affiche RIEN de déclaratif : chaque capacité est
   vérifiée sur une source réelle du dépôt (registre, base, catalogues).
   ══════════════════════════════════════════════════════════════════════════ */

export type CapabilityState = "ok" | "partiel" | "absent";

export interface UniverseCapability {
  key: string;
  label: string;
  state: CapabilityState;
  detail: string;
}

export interface UniversePlatform {
  univers: string;
  label: string;
  capabilities: UniverseCapability[];
  /** Capacités réellement branchées / total. Brut, sans arrondi flatteur. */
  score: { ok: number; total: number };
}

interface UniverseDef {
  code: string;
  label: string;
  engines: string[];
  tables: string[];
  /** Univers de compte correspondant ; null = pas d'espace de compte attendu. */
  accountUniverse: AccountUniverse | null;
}

const UNIVERSES: UniverseDef[] = [
  { code: "vente", label: "Achat / Vente", engines: ["achat", "vente"], tables: ["annonces"], accountUniverse: "vendeur" },
  { code: "location", label: "Location", engines: ["location", "transport"], tables: ["locations", "location_calendar"], accountUniverse: "location" },
  { code: "garage", label: "Garage", engines: ["garage"], tables: ["garages_publics", "rdv_garage"], accountUniverse: "garage" },
  { code: "pieces", label: "Pièces", engines: ["pieces"], tables: ["parts_shops", "parts_orders"], accountUniverse: "pieces" },
  { code: "depannage", label: "Dépannage", engines: ["depannage"], tables: ["service_tracking"], accountUniverse: null },
  { code: "livraison", label: "Livraison", engines: ["livraison"], tables: ["delivery_pricing"], accountUniverse: "livraison" },
  { code: "vtc_taxi", label: "VTC / Taxi", engines: ["vtc"], tables: [], accountUniverse: "vtc_taxi" },
  { code: "encheres", label: "Enchères", engines: ["auction_engine", "encheres"], tables: ["auctions", "auction_bids"], accountUniverse: null },
  { code: "vo", label: "VO / reprise", engines: ["vo_engine", "vo"], tables: ["vo_estimations", "vehicules"], accountUniverse: null },
  { code: "comptabilite", label: "Comptabilité", engines: ["accounting_internal", "accounting_marketplace"], tables: ["accountant_profiles", "compta_ecritures"], accountUniverse: "comptabilite" },
  { code: "professionnels", label: "Portail professionnel", engines: ["pro_portal", "pro_account"], tables: ["pro_portal_modules", "pro_account_applications"], accountUniverse: null },
];

async function countRows(table: string): Promise<number | null> {
  if (!(await tableExists(table))) return null;
  const r = await db.execute<{ n: string }>(sql`select count(*)::text as n from ${sql.raw(table)}`);
  return Number(r.rows[0]?.n ?? 0);
}

export async function universePlatforms(): Promise<UniversePlatform[]> {
  const engines = (await tableExists("engine_registry"))
    ? (
        await db.execute<{ name: string; state: string; health: string | null }>(
          sql`select name, state, health from engine_registry`,
        )
      ).rows
    : [];
  const seoByUnivers = (await tableExists("seo_pages"))
    ? (
        await db.execute<{ univers: string | null; n: string }>(
          sql`select univers, count(*)::text as n from seo_pages group by univers`,
        )
      ).rows
    : [];

  const out: UniversePlatform[] = [];

  for (const u of UNIVERSES) {
    const caps: UniverseCapability[] = [];

    const eng = engines.filter((e) => u.engines.includes(e.name));
    caps.push({
      key: "moteur",
      label: "Moteur dédié",
      state: eng.length === 0 ? "absent" : eng.some((e) => e.state === "active") ? "ok" : "partiel",
      detail:
        eng.length === 0
          ? "Aucun moteur inscrit au registre central."
          : eng.map((e) => `${e.name} (${e.state}${e.health ? `, ${e.health}` : ""})`).join(", "),
    });

    let dataRows = 0;
    const dataMissing: string[] = [];
    for (const t of u.tables) {
      const n = await countRows(t);
      if (n === null) dataMissing.push(t);
      else dataRows += n;
    }
    caps.push({
      key: "donnees",
      label: "Données propres",
      state: u.tables.length === 0 ? "absent" : dataMissing.length > 0 ? "partiel" : "ok",
      detail:
        u.tables.length === 0
          ? "Aucune table propre : l'univers vit sur les données d'un autre."
          : dataMissing.length > 0
            ? `Tables manquantes : ${dataMissing.join(", ")}.`
            : `${dataRows} enregistrement(s) sur ${u.tables.length} table(s).`,
    });

    const local = LOCAL_SERVICES.find((s) => s.univers === u.code);
    caps.push({
      key: "recherche_locale",
      label: "Recherche « près de moi »",
      state: !local ? "absent" : local.source ? (local.source.latColumn ? "ok" : "partiel") : "absent",
      detail: !local
        ? "Service non local (pas de notion de proximité)."
        : local.source
          ? local.source.latColumn
            ? "Recherche par distance réelle."
            : "Recherche par ville uniquement : prestataires sans coordonnées."
          : (local.missingReason ?? "Aucune source de prestataires."),
    });

    const seo = seoByUnivers.find((s) => s.univers === u.code);
    caps.push({
      key: "seo",
      label: "SEO / GEO",
      state: seo && Number(seo.n) > 0 ? "ok" : "absent",
      detail: seo && Number(seo.n) > 0 ? `${seo.n} page(s) indexable(s).` : "Aucune page SEO générée pour cet univers.",
    });

    const products = PRODUCT_CATALOG.filter((p) => p.univers === u.code);
    caps.push({
      key: "paiement",
      label: "Paiement",
      state: products.length > 0 ? "ok" : "absent",
      detail:
        products.length > 0
          ? `${products.length} produit(s) au registre des tarifs.`
          : "Aucun produit tarifé : rien n'est encaissable dans cet univers.",
    });

    const triggers = Object.keys(NOTIFICATION_TRIGGERS).filter(
      (k) => k.startsWith(`${u.code}_`) || NOTIFICATION_TRIGGERS[k].category === u.code,
    );
    caps.push({
      key: "notifications",
      label: "Notifications",
      state: triggers.length > 0 ? "ok" : "absent",
      detail:
        triggers.length > 0
          ? `${triggers.length} déclencheur(s) au catalogue central.`
          : "Aucun déclencheur : l'univers ne notifie rien.",
    });

    const route = u.accountUniverse ? UNIVERSE_ROUTES[u.accountUniverse] : undefined;
    caps.push({
      key: "comptes",
      label: "Espace de compte",
      state: !route ? "absent" : route.fallback ? "partiel" : "ok",
      detail: !route
        ? "Aucun espace de compte rattaché."
        : route.fallback
          ? `Repli sur ${route.homePath} : espace dédié non construit.`
          : `Espace dédié : ${route.homePath}.`,
    });

    const ok = caps.filter((c) => c.state === "ok").length;
    out.push({ univers: u.code, label: u.label, capabilities: caps, score: { ok, total: caps.length } });
  }

  return out;
}

export interface ProximityHealth {
  health: "ok" | "degraded" | "down";
  servicesLocalisables: number;
  servicesTotal: number;
  sansCoordonnees: number;
  details: string[];
}

export async function proximityHealth(): Promise<ProximityHealth> {
  const details: string[] = [];
  let localisables = 0;
  let sansCoords = 0;
  let sourcesManquantes = 0;

  for (const s of LOCAL_SERVICES) {
    if (!s.source) {
      sourcesManquantes++;
      details.push(`${s.label} : non configuré.`);
      continue;
    }
    if (!(await tableExists(s.source.table))) {
      sourcesManquantes++;
      details.push(`${s.label} : table ${s.source.table} absente.`);
      continue;
    }
    localisables++;
    if (s.source.latColumn === null) {
      sansCoords++;
      details.push(`${s.label} : aucune coordonnée, recherche par ville uniquement.`);
    }
  }

  // Le moteur fonctionne dès qu'une source répond ; il se dégrade quand la
  // majorité des services locaux ne sont pas branchés — c'est le cas à dire,
  // pas à masquer derrière un vert.
  const health: ProximityHealth["health"] =
    localisables === 0 ? "down" : sourcesManquantes > localisables ? "degraded" : "ok";

  return {
    health,
    servicesLocalisables: localisables,
    servicesTotal: LOCAL_SERVICES.length,
    sansCoordonnees: sansCoords,
    details,
  };
}
