/**
 * Pose du référentiel automobile de départ dans le graphe de connaissance (« Mémoire automobile »).
 * Données et limites : voir referentiel-automobile.ts (connaissance générale, non vérifiée, non exhaustive).
 * Idempotent : rejouer ne crée rien de nouveau et ne fabrique aucune confirmation.
 */
import { db } from "../db.js";
import { akeSources } from "./schema.js";
import { lierEnMasse, upsertNodesEnMasse, type NoeudEnMasse } from "./service.js";
import { CARROSSERIES, CATEGORIES_VEHICULE, ENERGIES, MARQUES_REFERENTIEL, SYSTEMES_PIECES, TRANSMISSIONS } from "./referentiel-automobile.js";

export const SOURCE_CONNAISSANCE_GENERALE = "connaissance_generale_ia";
const MOTEUR = "knowledge_engine";

const noms = (() => {
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" });
  } catch {
    return null;
  }
})();
export const nomPays = (code: string): string => (code === "MC" ? "Monaco" : noms?.of(code) ?? code);

const sig = (domain: string, kind: string, label: string) => `${domain.trim().toLowerCase()}|${kind.trim().toLowerCase()}|${label.trim().toLowerCase().replace(/\s+/g, " ")}`.slice(0, 400);

export async function seedSourcesReferentiel(): Promise<void> {
  await db
    .insert(akeSources)
    .values([
      {
        code: SOURCE_CONNAISSANCE_GENERALE,
        label: "Connaissance générale de l'IA (non vérifiée contre une base officielle)",
        kind: "documentation",
        authorization: "publique",
        authorizationRef:
          "Faits généraux non protégés (nom d'une marque, pays d'origine, catégories de véhicules, familles de pièces). Rédigés de mémoire par l'IA : NON vérifiés. Chaque nœud reste « proposé » tant qu'une seconde source indépendante ne l'a pas constaté.",
        status: "actif",
        everSynced: true,
        lastSyncDetail: "Référentiel de départ posé au démarrage de la plateforme.",
      },
      {
        code: "nhtsa_vpic",
        label: "NHTSA vPIC — marques enregistrées aux États-Unis (API publique)",
        kind: "donnees_publiques",
        countryCode: "US",
        authorization: "publique",
        authorizationRef: "Données du gouvernement des États-Unis (NHTSA vPIC), domaine public, sans clé.",
        apiEndpoint: "https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json",
        status: "non_configure",
        everSynced: false,
      },
    ])
    .onConflictDoNothing();
}

export async function seedReferentielAutomobile(): Promise<{ marques: number; nouvelles: number; liens: number; refusee: string | null }> {
  await seedSourcesReferentiel();
  const prov = { sourceCode: SOURCE_CONNAISSANCE_GENERALE, license: "publique", licenseRef: "Faits généraux, non vérifiés" } as const;
  const noeuds: NoeudEnMasse[] = [];
  const liens: { de: string; vers: string }[] = [];

  for (const [code, libelle] of Object.entries(CATEGORIES_VEHICULE)) {
    noeuds.push({ domain: "vehicule", kind: "categorie", label: libelle, summary: `Catégorie de véhicule : ${libelle}.`, attributes: { code } });
  }
  for (const e of ENERGIES) noeuds.push({ domain: "vehicule", kind: "energie", label: e, summary: `Énergie de propulsion : ${e}.` });
  for (const c of CARROSSERIES) noeuds.push({ domain: "vehicule", kind: "carrosserie", label: c, summary: `Type de carrosserie ou de véhicule : ${c}.` });
  for (const t of TRANSMISSIONS) noeuds.push({ domain: "vehicule", kind: "transmission", label: t, summary: `Type de transmission ou d'entraînement : ${t}.` });

  for (const m of MARQUES_REFERENTIEL) {
    const cats = [...m.categories].map((l) => CATEGORIES_VEHICULE[l]).filter((x): x is string => !!x);
    const etat = m.etat === "active" ? "en activité" : m.etat === "disparue" ? "disparue" : "relancée après une disparition";
    noeuds.push({
      domain: "constructeur",
      kind: "marque",
      label: m.nom,
      summary: `Marque d'origine ${nomPays(m.pays)}, ${etat}. Catégories : ${cats.join(", ")}. Connaissance générale non vérifiée.`,
      attributes: { paysOrigine: m.pays, paysOrigineNom: nomPays(m.pays), categories: cats, etat: m.etat, verifie: false },
      sourceRef: "referentiel-automobile.ts",
    });
    for (const c of cats) liens.push({ de: sig("constructeur", "marque", m.nom), vers: sig("vehicule", "categorie", c) });
  }

  for (const s of SYSTEMES_PIECES) {
    noeuds.push({ domain: "piece", kind: "systeme", label: s.libelle, summary: `Système du véhicule : ${s.libelle}.`, attributes: { code: s.code } });
    for (const f of s.familles) {
      noeuds.push({ domain: "piece", kind: "famille", label: f, summary: `Famille de pièces (${s.libelle}). Aucune référence ni compatibilité affirmée ici.`, attributes: { systeme: s.code } });
      liens.push({ de: sig("piece", "famille", f), vers: sig("piece", "systeme", s.libelle) });
    }
  }

  const r = await upsertNodesEnMasse(noeuds, prov, MOTEUR);
  if (r.refusee) return { marques: MARQUES_REFERENTIEL.length, nouvelles: 0, liens: 0, refusee: r.refusee };
  const aLier = liens
    .map((l) => ({ fromNodeId: r.ids.get(l.de), toNodeId: r.ids.get(l.vers), relation: "appartient_a", origin: "manuel" }))
    .filter((l): l is { fromNodeId: number; toNodeId: number; relation: string; origin: string } => l.fromNodeId !== undefined && l.toNodeId !== undefined);
  const nLiens = await lierEnMasse(aLier);
  return { marques: MARQUES_REFERENTIEL.length, nouvelles: r.crees, liens: nLiens, refusee: null };
}
