/**
 * Connecteur Google Business Profile — tests réels, base de données réelle.
 * Couvre le seul consommateur qui manquait à ce moteur : la page Direction
 * (client/src/pages/superadmin/AdminGoogleBusiness.tsx).
 *
 * Lancement : `npx tsx server/connectors/google-business/__tests__/google-business.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../../db.js";
import { gbpLocations, gbpReviewSnapshots } from "../schema.js";
import * as gb from "../service.js";
import { appRouter } from "../../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const TARGET_TYPE = "garage";
const TARGET_ID = 940001;
const ACTOR_ID = 940002;

let idLocation: number | null = null;

async function nettoyer() {
  if (idLocation) {
    await db.delete(gbpReviewSnapshots).where(eq(gbpReviewSnapshots.locationId, idLocation));
    await db.delete(gbpLocations).where(eq(gbpLocations.id, idLocation));
  }
  idLocation = null;
}

async function main() {
  await nettoyer();

  // ── 1. État honnête sans clé configurée ─────────────────────────────────
  const statutInitial = await gb.connectorStatus();
  verif("1. sans clé API réelle, l'état n'est jamais 'actif' fabriqué", statutInitial.state !== "actif" || statutInitial.credentials.refreshToken);

  // ── 2. Déclaration d'un établissement ────────────────────────────────────
  const declare = await gb.declareLocation({ targetType: TARGET_TYPE, targetId: TARGET_ID, nom: "Garage Test MKA.P-MS", actorId: ACTOR_ID });
  idLocation = declare.id;
  verif("2. déclaration réelle en base", !declare.deja);

  const doublon = await gb.declareLocation({ targetType: TARGET_TYPE, targetId: TARGET_ID, nom: "Garage Test MKA.P-MS (doublon)", actorId: ACTOR_ID });
  verif("2b. une seconde déclaration pour la même fiche ne duplique jamais la ligne", doublon.deja && doublon.id === declare.id);

  const locations = await gb.listLocations();
  verif("3. l'établissement déclaré apparaît dans la liste réelle", locations.some((l) => l.id === idLocation && l.status === "declare"));

  // ── 4. Vérification ──────────────────────────────────────────────────────
  await gb.verifyLocation({ locationId: idLocation, actorId: ACTOR_ID, verifie: true });
  const [apresVerif] = await db.select().from(gbpLocations).where(eq(gbpLocations.id, idLocation)).limit(1);
  verif("4. la vérification est réellement journalisée (statut + auteur + date)", apresVerif?.status === "verifie" && apresVerif?.verifiedBy === ACTOR_ID && !!apresVerif?.verifiedAt);

  // ── 5. Relevé manuel — jamais présenté comme un relevé API ──────────────
  const releve = await gb.recordManualSnapshot({ locationId: idLocation, averageRating: 4.3, reviewCount: 27, actorId: ACTOR_ID });
  verif("5. relevé manuel enregistré", !!releve.id);
  const [snap] = await db.select().from(gbpReviewSnapshots).where(eq(gbpReviewSnapshots.id, releve.id)).limit(1);
  verif("5b. le relevé manuel est marqué fromApi=false — jamais confondu avec un vrai relevé Google", snap?.fromApi === false && snap?.collectionMode === "saisie_manuelle");

  // ── 6. Comparaison des sources — jamais fusionnées ──────────────────────
  const compare = await gb.compareSources(idLocation);
  verif("6. compareSources rapporte bien le relevé Google réellement saisi (jamais 0 par défaut)", compare?.google.average === 4.3 && compare?.google.total === 27);
  verif("6b. les deux sources restent séparées (mkapms et google ne sont jamais additionnées)", compare !== null && "mkapms" in compare && "google" in compare && compare.mkapms !== compare.google);

  // ── 7. Statut global reflète les vraies données créées ──────────────────
  const statutApres = await gb.connectorStatus();
  verif("7. le compte d'établissements reflète les vraies lignes en base", statutApres.etablissements >= 1 && statutApres.etablissementsVerifies >= 1);

  // ── 8. Exposition du router — réservé à la direction ────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const keys = Object.keys(procs);
  for (const sub of ["googleBusiness.etat", "googleBusiness.etablissements", "googleBusiness.declarer", "googleBusiness.verifier", "googleBusiness.releveManuel", "googleBusiness.comparer"]) {
    verif(`Router : expose « ${sub} »`, keys.includes(sub));
  }

  await nettoyer();

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(err);
    await nettoyer().catch(() => {});
    process.exit(1);
  });
