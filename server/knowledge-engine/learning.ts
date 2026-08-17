/**
 * Point 87 — apprentissage continu sans entraînement sauvage.
 *
 * Le moteur n'entraîne aucun modèle : il lit les faits que la plateforme
 * possède déjà (annonces publiées, catalogue de pièces, compatibilités
 * déclarées, connaissances confirmées du Système Intelligent) et les écrit dans
 * un graphe daté et relié. Une connaissance peut donc être mise à jour chaque
 * jour sans reconstruire quoi que ce soit.
 *
 * Ce qui n'est **pas** fait ici, volontairement :
 *  • aucune donnée n'est inventée pour compléter un trou ;
 *  • aucune compatibilité n'est déduite d'une ressemblance de nom — seules les
 *    compatibilités réellement déclarées dans `parts_compatibility` deviennent
 *    des liens ;
 *  • aucun pays n'est supposé : le pays vient de la donnée d'origine, et reste
 *    nul quand la donnée ne le porte pas.
 */
import { and, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { annonces, partsCatalog, partsCompatibility } from "../schema.js";
import { smartKbEntries } from "../smart-engine/schema.js";
import { akeNodes } from "./schema.js";
import { AKE_DOMAINS, linkNodes, upsertNode } from "./service.js";

const SOURCE_INTERNE = "mkapms_interne";

interface IngestReport {
  domaine: string;
  noeudsCrees: number;
  noeudsEnrichis: number;
  liensCrees: number;
  detail: string;
}

function provenance(engine: string, ref: string, countryCode: string | null) {
  return {
    sourceCode: SOURCE_INTERNE,
    sourceRef: ref,
    license: "propriete_mkapms",
    countryCode,
    learnedByEngine: engine,
  };
}

/**
 * Véhicules réellement présents sur la plateforme : marque → modèle → version.
 * La hiérarchie du point 63 est construite à partir des annonces publiées, avec
 * le pays de l'annonce conservé sur la version (une version peut n'exister que
 * dans certains marchés).
 */
async function ingestVehicles(limit: number): Promise<IngestReport> {
  const rows = await db
    .select({
      marque: annonces.marque,
      modele: annonces.modele,
      version: annonces.version,
      carburant: annonces.carburant,
      boite: annonces.boite,
      pays: annonces.pays,
      total: sql<number>`count(*)::int`,
    })
    .from(annonces)
    .where(eq(annonces.status, "publiee"))
    .groupBy(
      annonces.marque,
      annonces.modele,
      annonces.version,
      annonces.carburant,
      annonces.boite,
      annonces.pays,
    )
    .limit(limit);

  let crees = 0;
  let enrichis = 0;
  let liens = 0;

  for (const r of rows) {
    const marque = await upsertNode({
      domain: "constructeur",
      kind: "marque",
      label: r.marque,
      learnedByEngine: "vente",
      provenance: provenance("vente", "annonces.marque", null),
    });
    marque.created ? (crees += 1) : (enrichis += 1);

    const modele = await upsertNode({
      domain: "modele",
      kind: "modele",
      label: `${r.marque} ${r.modele}`,
      learnedByEngine: "vente",
      attributes: { marque: r.marque, modele: r.modele },
      provenance: provenance("vente", "annonces.modele", null),
    });
    modele.created ? (crees += 1) : (enrichis += 1);
    if ((await linkNodes({
      fromNodeId: marque.id,
      toNodeId: modele.id,
      relation: "appartient_a",
      origin: "annonces",
    })).created) liens += 1;

    // La motorisation n'est retenue que si l'annonce la décrit réellement.
    const motoLabel = `${r.marque} ${r.modele} — ${r.carburant} / ${r.boite}`;
    const motorisation = await upsertNode({
      domain: "motorisation",
      kind: "motorisation",
      label: motoLabel,
      learnedByEngine: "vente",
      countryCode: r.pays ?? null,
      attributes: {
        carburant: r.carburant,
        boite: r.boite,
        version: r.version ?? null,
        annoncesConstatees: r.total,
      },
      provenance: provenance("vente", "annonces.carburant+boite", r.pays ?? null),
    });
    motorisation.created ? (crees += 1) : (enrichis += 1);
    if ((await linkNodes({
      fromNodeId: modele.id,
      toNodeId: motorisation.id,
      relation: "motorise_par",
      origin: "annonces",
      confidence: Math.min(100, r.total * 10),
      attributes: { annoncesConstatees: r.total, pays: r.pays ?? null },
    })).created) liens += 1;
  }

  return {
    domaine: "vehicules",
    noeudsCrees: crees,
    noeudsEnrichis: enrichis,
    liensCrees: liens,
    detail:
      rows.length === 0
        ? "Aucune annonce publiée : aucun véhicule à apprendre (rien n'a été inventé)."
        : `${rows.length} combinaison(s) marque/modèle/motorisation lues dans les annonces publiées.`,
  };
}

/**
 * Pièces et compatibilités. Seules les compatibilités déclarées dans
 * `parts_compatibility` produisent un lien `compatible_avec` : c'est la seule
 * information dont la plateforme puisse répondre.
 */
async function ingestParts(limit: number): Promise<IngestReport> {
  const rows = await db
    .select({
      catalogId: partsCatalog.id,
      nom: partsCatalog.nom,
      categorie: partsCatalog.categorie,
      referenceOem: partsCatalog.referenceOem,
      marquePiece: partsCatalog.marquePiece,
      compMarque: partsCompatibility.marque,
      compModele: partsCompatibility.modele,
      compMoteur: partsCompatibility.moteur,
      anneeDebut: partsCompatibility.anneeDebut,
      anneeFin: partsCompatibility.anneeFin,
    })
    .from(partsCompatibility)
    .innerJoin(partsCatalog, eq(partsCatalog.id, partsCompatibility.catalogId))
    .where(eq(partsCatalog.active, true))
    .limit(limit);

  let crees = 0;
  let enrichis = 0;
  let liens = 0;

  for (const r of rows) {
    const piece = await upsertNode({
      domain: "piece",
      kind: "piece",
      label: r.referenceOem ? `${r.nom} (${r.referenceOem})` : r.nom,
      learnedByEngine: "pieces",
      attributes: {
        categorie: r.categorie ?? null,
        referenceOem: r.referenceOem ?? null,
        equipementier: r.marquePiece ?? null,
      },
      provenance: provenance("pieces", `parts_catalog#${r.catalogId}`, null),
    });
    piece.created ? (crees += 1) : (enrichis += 1);

    const cibleLabel = r.compModele ? `${r.compMarque} ${r.compModele}` : r.compMarque;
    const cible = await upsertNode({
      domain: r.compModele ? "modele" : "constructeur",
      kind: r.compModele ? "modele" : "marque",
      label: cibleLabel,
      learnedByEngine: "pieces",
      provenance: provenance("pieces", "parts_compatibility", null),
    });
    cible.created ? (crees += 1) : (enrichis += 1);

    if ((await linkNodes({
      fromNodeId: piece.id,
      toNodeId: cible.id,
      relation: "compatible_avec",
      origin: "catalogue",
      attributes: {
        moteur: r.compMoteur ?? null,
        anneeDebut: r.anneeDebut ?? null,
        anneeFin: r.anneeFin ?? null,
      },
    })).created) liens += 1;

    if (r.compMoteur) {
      const moteur = await upsertNode({
        domain: "moteur",
        kind: "moteur",
        label: `${r.compMarque} ${r.compMoteur}`,
        learnedByEngine: "pieces",
        provenance: provenance("pieces", "parts_compatibility.moteur", null),
      });
      moteur.created ? (crees += 1) : (enrichis += 1);
      if ((await linkNodes({
        fromNodeId: cible.id,
        toNodeId: moteur.id,
        relation: "motorise_par",
        origin: "catalogue",
      })).created) liens += 1;
      if ((await linkNodes({
        fromNodeId: piece.id,
        toNodeId: moteur.id,
        relation: "compatible_avec",
        origin: "catalogue",
      })).created) liens += 1;
    }
  }

  return {
    domaine: "pieces",
    noeudsCrees: crees,
    noeudsEnrichis: enrichis,
    liensCrees: liens,
    detail:
      rows.length === 0
        ? "Aucune compatibilité déclarée dans le catalogue de pièces : aucun lien n'a été deviné."
        : `${rows.length} compatibilité(s) réellement déclarées reprises dans la mémoire.`,
  };
}

/**
 * Pannes et entretien déjà confirmés par le Système Intelligent
 * (`smart_kb_entries`). Une entrée seulement « proposée » n'entre pas dans la
 * mémoire automobile : elle attend d'être confirmée là où elle est née.
 */
async function ingestFaults(limit: number): Promise<IngestReport> {
  const rows = await db
    .select({
      id: smartKbEntries.id,
      domain: smartKbEntries.domain,
      type: smartKbEntries.type,
      value: smartKbEntries.value,
      parentKey: smartKbEntries.parentKey,
      attributes: smartKbEntries.attributes,
    })
    .from(smartKbEntries)
    .where(and(eq(smartKbEntries.domain, "panne"), eq(smartKbEntries.status, "confirmed")))
    .limit(limit);

  let crees = 0;
  let enrichis = 0;
  let liens = 0;

  for (const r of rows) {
    const panne = await upsertNode({
      domain: "diagnostic",
      kind: r.type,
      label: r.value,
      learnedByEngine: "smart",
      attributes: r.attributes ?? {},
      provenance: provenance("smart", `smart_kb_entries#${r.id}`, null),
    });
    panne.created ? (crees += 1) : (enrichis += 1);

    if (r.parentKey) {
      const contexte = await upsertNode({
        domain: "modele",
        kind: "modele",
        label: r.parentKey,
        learnedByEngine: "smart",
        provenance: provenance("smart", "smart_kb_entries.parent", null),
      });
      contexte.created ? (crees += 1) : (enrichis += 1);
      if ((await linkNodes({
        fromNodeId: contexte.id,
        toNodeId: panne.id,
        relation: "panne_connue",
        origin: "source",
      })).created) liens += 1;
    }
  }

  return {
    domaine: "pannes",
    noeudsCrees: crees,
    noeudsEnrichis: enrichis,
    liensCrees: liens,
    detail:
      rows.length === 0
        ? "Aucune panne confirmée dans la base du Système Intelligent : rien à reprendre."
        : `${rows.length} panne(s) confirmée(s) reliée(s) à leur contexte véhicule.`,
  };
}

/**
 * Rattache les nœuds de la mémoire aux services MKA.P-MS qui existent
 * réellement, pour que la connaissance serve Pièces, Garage, VO et Estimation
 * sans base parallèle (point 63).
 */
async function linkServices(): Promise<IngestReport> {
  const services: { code: string; label: string; domains: string[] }[] = [
    { code: "pieces", label: "Pièces automobiles", domains: ["piece", "compatibilite"] },
    { code: "garage", label: "Garage", domains: ["diagnostic", "entretien", "reparation"] },
    { code: "vo", label: "Véhicule d'occasion", domains: ["modele", "motorisation"] },
    { code: "estimation", label: "Estimation", domains: ["modele", "motorisation"] },
  ];

  let crees = 0;
  let liens = 0;

  for (const s of services) {
    const svc = await upsertNode({
      domain: "mobilite",
      kind: "service_mkapms",
      label: s.label,
      dataClass: "mkapms",
      learnedByEngine: "core",
      attributes: { code: s.code },
      provenance: provenance("core", `service:${s.code}`, null),
    });
    if (svc.created) crees += 1;

    const cibles = await db
      .select({ id: akeNodes.id })
      .from(akeNodes)
      .where(inArray(akeNodes.domain, s.domains))
      .limit(200);

    for (const c of cibles) {
      if ((await linkNodes({
        fromNodeId: c.id,
        toNodeId: svc.id,
        relation: "service_mkapms",
        origin: "manuel",
      })).created) liens += 1;
    }
  }

  return {
    domaine: "services",
    noeudsCrees: crees,
    noeudsEnrichis: 0,
    liensCrees: liens,
    detail: `Connaissances rattachées aux services existants (${services.map((s) => s.label).join(", ")}).`,
  };
}

/**
 * Cycle d'absorption complet depuis les données de la plateforme. Chaque bloc
 * est indépendant : si une table manque, le rapport le dit au lieu de faire
 * échouer l'ensemble.
 */
export async function runInternalLearning(opts?: { limit?: number }): Promise<{
  rapports: IngestReport[];
  erreurs: string[];
}> {
  const limit = opts?.limit ?? 400;
  const rapports: IngestReport[] = [];
  const erreurs: string[] = [];

  const blocs: { nom: string; fn: () => Promise<IngestReport> }[] = [
    { nom: "vehicules", fn: () => ingestVehicles(limit) },
    { nom: "pieces", fn: () => ingestParts(limit) },
    { nom: "pannes", fn: () => ingestFaults(limit) },
    { nom: "services", fn: () => linkServices() },
  ];

  for (const b of blocs) {
    try {
      rapports.push(await b.fn());
    } catch (e) {
      erreurs.push(`${b.nom} : ${e instanceof Error ? e.message : "erreur inconnue"}`);
    }
  }

  return { rapports, erreurs };
}

/**
 * Domaines du point 60 sur lesquels la plateforme n'a **encore aucune** donnée.
 * Cette liste est un constat, pas un reproche : elle indique où une source
 * autorisée serait nécessaire, plutôt que de laisser croire que la mémoire est
 * complète.
 */
export async function coverageGaps(): Promise<{ domain: string; total: number }[]> {
  const rows = await db
    .select({ domain: akeNodes.domain, total: sql<number>`count(*)::int` })
    .from(akeNodes)
    .groupBy(akeNodes.domain);
  const present = new Map(rows.map((r) => [r.domain, r.total]));
  return Object.keys(AKE_DOMAINS)
    .map((d) => ({ domain: d, total: present.get(d) ?? 0 }))
    .filter((d) => d.total === 0);
}

/** Nœuds jamais confrontés à une source depuis N jours (point 83). */
export async function staleKnowledge(days: number) {
  const seuil = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      id: akeNodes.id,
      label: akeNodes.label,
      domain: akeNodes.domain,
      lastVerifiedAt: akeNodes.lastVerifiedAt,
    })
    .from(akeNodes)
    .where(or(isNull(akeNodes.lastVerifiedAt), lt(akeNodes.lastVerifiedAt, seuil)))
    .limit(100);
}
