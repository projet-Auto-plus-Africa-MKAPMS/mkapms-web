/**
 * MKA.P-MS Redirection Engine — Audit de couverture.
 *
 * Le moteur savait résoudre une clé, mais personne ne savait CE QU'IL NE
 * COUVRAIT PAS. Cet audit répond à trois questions que le PDG doit pouvoir
 * poser sans lire le code :
 *
 *  1. Quelles règles pointent vers une page qui n'existe pas ? (redirection
 *     qui mène au 404 : le moteur casse le parcours au lieu de le sauver)
 *  2. Quelles clés du catalogue n'ont aucune règle en base, et quelles clés
 *     sont réclamées par le client sans qu'aucune règle réponde ?
 *  3. Quelles ZONES de la plateforme (véhicules, produits/pièces, pages
 *     géographiques, comptabilité, VO, services, boutons) sont réellement
 *     branchées au moteur, et lesquelles ne le sont pas ?
 *
 * Aucune correction automatique ici : l'audit constate et nomme le manque.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { redirRules, redirLogs } from "./schema.js";
import { DEFAULT_REDIRECT_RULES } from "./catalog.js";
import { isRoutablePath } from "../data/client-routes.js";

export type EtatZone = "branchee" | "partielle" | "absente";

export interface ZoneCouverture {
  code: string;
  label: string;
  /** Préfixes de clés qui appartiennent à cette zone. */
  attendu: number;
  presentes: number;
  cassees: number;
  etat: EtatZone;
  manque: string | null;
}

export interface RegleCassee {
  key: string;
  label: string;
  target: string;
  motif: string;
}

export interface CleSansRegle {
  key: string;
  label: string | null;
  demandes: number;
  origine: "catalogue" | "client";
}

export interface Route404 {
  chemin: string;
  occurrences: number;
  suggestion: string | null;
}

export interface AuditCouverture {
  genereLe: string;
  reglesActives: number;
  reglesCassees: RegleCassee[];
  clesSansRegle: CleSansRegle[];
  routes404: Route404[];
  zones: ZoneCouverture[];
  resume: string;
}

/** Zones fonctionnelles, avec les préfixes de clés qui les composent. */
const ZONES: { code: string; label: string; prefixes: string[] }[] = [
  { code: "univers", label: "Univers (acheter, louer, vendre, pièces, garages)", prefixes: ["univers_"] },
  { code: "vehicules", label: "Véhicules (achat et location par profil)", prefixes: ["acheter_", "louer_"] },
  { code: "produits", label: "Produits et pièces", prefixes: ["produit_"] },
  { code: "geo", label: "Pages pays / région / ville / quartier", prefixes: ["geo_"] },
  { code: "comptabilite", label: "Comptabilité", prefixes: ["compta_"] },
  { code: "vo", label: "VO (véhicules d'occasion)", prefixes: ["vo_"] },
  { code: "services", label: "Services (estimation, acheminement, garages…)", prefixes: ["service_"] },
  { code: "boutons", label: "Boutons et CTA", prefixes: ["bouton_", "cta_"] },
  { code: "navigation", label: "Menus de navigation", prefixes: ["nav_"] },
  { code: "chemins", label: "Alias de chemins (auto-résolution des 404)", prefixes: ["path:"] },
];

function zoneDe(key: string): string | null {
  for (const z of ZONES) {
    if (z.prefixes.some((p) => key.startsWith(p))) return z.code;
  }
  return null;
}

/**
 * Suggestion de destination pour un 404, uniquement si une route réelle a le
 * même premier segment. Conservateur : sans certitude, aucune suggestion —
 * une redirection au hasard est plus nuisible qu'un 404 honnête.
 */
function suggestion(chemin: string, cibles: string[]): string | null {
  const seg = chemin.split("/").filter(Boolean)[0];
  if (!seg) return null;
  const candidat = `/${seg}`;
  if (cibles.includes(candidat)) return candidat;
  return null;
}

export async function auditCouverture(): Promise<AuditCouverture> {
  const regles = await db
    .select({
      key: redirRules.key,
      label: redirRules.label,
      target: redirRules.target,
      external: redirRules.external,
      active: redirRules.active,
    })
    .from(redirRules);

  const actives = regles.filter((r) => r.active);

  const reglesCassees: RegleCassee[] = [];
  for (const r of actives) {
    if (r.external) continue; // une URL externe ne se valide pas contre nos routes
    if (!r.target.startsWith("/")) continue;
    if (!isRoutablePath(r.target)) {
      reglesCassees.push({
        key: r.key,
        label: r.label,
        target: r.target,
        motif: `La destination ${r.target} ne correspond à aucune page de la plateforme.`,
      });
    }
  }

  // Clés du catalogue absentes de la base (règle supprimée, jamais insérée).
  const presentes = new Set(regles.map((r) => r.key));
  const clesSansRegle: CleSansRegle[] = DEFAULT_REDIRECT_RULES.filter(
    (r) => !presentes.has(r.key),
  ).map((r) => ({ key: r.key, label: r.label, demandes: 0, origine: "catalogue" as const }));

  // Clés réellement réclamées par le client et restées sans réponse (30 j).
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const reclamees = await db
    .select({
      key: redirLogs.key,
      demandes: sql<number>`count(*)::int`,
    })
    .from(redirLogs)
    .where(
      and(
        inArray(redirLogs.outcome, ["unmatched"]),
        sql`${redirLogs.createdAt} >= ${since30d}`,
      ),
    )
    .groupBy(redirLogs.key)
    .orderBy(desc(sql`count(*)`))
    .limit(100);

  for (const c of reclamees) {
    if (presentes.has(c.key)) continue;
    const deja = clesSansRegle.find((x) => x.key === c.key);
    if (deja) {
      deja.demandes = c.demandes;
      continue;
    }
    clesSansRegle.push({
      key: c.key,
      label: null,
      demandes: c.demandes,
      origine: "client",
    });
  }

  // Pages introuvables non résolues (le moteur n'avait aucun alias).
  const cibles = actives.map((r) => r.target);
  const quatreCentQuatre = await db
    .select({
      chemin: redirLogs.source,
      occurrences: sql<number>`count(*)::int`,
    })
    .from(redirLogs)
    .where(
      and(
        eq(redirLogs.key, "route_404"),
        sql`${redirLogs.createdAt} >= ${since30d}`,
        sql`${redirLogs.source} is not null`,
      ),
    )
    .groupBy(redirLogs.source)
    .orderBy(desc(sql`count(*)`))
    .limit(50);

  const routes404: Route404[] = quatreCentQuatre
    .filter((r) => !!r.chemin)
    .map((r) => ({
      chemin: r.chemin as string,
      occurrences: r.occurrences,
      suggestion: suggestion(r.chemin as string, cibles),
    }));

  // État par zone.
  const attenduParZone = new Map<string, number>();
  for (const r of DEFAULT_REDIRECT_RULES) {
    const z = zoneDe(r.key);
    if (!z) continue;
    attenduParZone.set(z, (attenduParZone.get(z) ?? 0) + 1);
  }
  const presentParZone = new Map<string, number>();
  for (const r of actives) {
    const z = zoneDe(r.key);
    if (!z) continue;
    presentParZone.set(z, (presentParZone.get(z) ?? 0) + 1);
  }
  const casseParZone = new Map<string, number>();
  for (const r of reglesCassees) {
    const z = zoneDe(r.key);
    if (!z) continue;
    casseParZone.set(z, (casseParZone.get(z) ?? 0) + 1);
  }

  const zones: ZoneCouverture[] = ZONES.map((z) => {
    const attendu = attenduParZone.get(z.code) ?? 0;
    const presentesZ = presentParZone.get(z.code) ?? 0;
    const cassees = casseParZone.get(z.code) ?? 0;
    let etat: EtatZone;
    let manque: string | null = null;
    if (presentesZ === 0) {
      etat = "absente";
      manque = "Aucune règle active : cette zone n'est pas branchée au moteur.";
    } else if (presentesZ < attendu || cassees > 0) {
      etat = "partielle";
      manque =
        cassees > 0
          ? `${cassees} destination(s) inexistante(s).`
          : `${attendu - presentesZ} règle(s) du catalogue non activée(s).`;
    } else {
      etat = "branchee";
    }
    return { code: z.code, label: z.label, attendu, presentes: presentesZ, cassees, etat, manque };
  });

  const absentes = zones.filter((z) => z.etat === "absente").length;
  const partielles = zones.filter((z) => z.etat === "partielle").length;
  const resume =
    reglesCassees.length === 0 && absentes === 0 && partielles === 0
      ? `Moteur branché sur les ${zones.length} zones, aucune destination cassée.`
      : `${zones.length - absentes - partielles}/${zones.length} zones branchées, ` +
        `${partielles} partielle(s), ${absentes} absente(s), ` +
        `${reglesCassees.length} destination(s) inexistante(s), ` +
        `${clesSansRegle.length} clé(s) sans règle, ${routes404.length} page(s) introuvable(s) non résolue(s).`;

  return {
    genereLe: new Date().toISOString(),
    reglesActives: actives.length,
    reglesCassees,
    clesSansRegle,
    routes404,
    zones,
    resume,
  };
}
