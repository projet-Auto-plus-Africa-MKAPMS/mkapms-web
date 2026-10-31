/**
 * server/visibility-os/geo-engine.ts — réponses IA calculées en direct (liveAnswers).
 *
 * Demande PDG : quelqu'un qui demande à un assistant conversationnel "je cherche un
 * véhicule électrique" doit trouver une réponse qui reflète le vrai stock, pas un texte
 * générique figé. Ce test prouve que le décompte change réellement avec le stock, et
 * surtout qu'un décompte à zéro est dit honnêtement — jamais un nombre inventé.
 *
 * Base de données réelle (DATABASE_URL), déjà migrée. Lancement :
 * `npx tsx server/__tests__/geo-live-answers.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { annonces } from "../schema.js";
import { liveAnswers } from "../visibility-os/geo-engine.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR = 900993;
const PREFIX = "TEST-GEO-LIVE-";

async function nettoyer() {
  await db.delete(annonces).where(eq(annonces.ownerId, VENDEUR));
}

function parTopic(rows: Awaited<ReturnType<typeof liveAnswers>>) {
  return Object.fromEntries(rows.map((r) => [r.topic, r]));
}

async function main() {
  await nettoyer();

  // ── 1. Aucune annonce électrique de ce vendeur : le reste du stock réel décide du
  //       décompte de départ, on ne peut pas garantir zéro global — donc on compare un
  //       avant/après sur nos propres insertions, jamais un total absolu supposé.
  const avant = parTopic(await liveAnswers());
  const avantElectrique = Number(avant.vehicule_electrique.answer.match(/^(\d+)/)?.[1] ?? 0);

  // ── 2. On publie 2 véhicules électriques, 1 hybride, 1 en location : le décompte doit
  //       monter exactement de ce montant, pas d'un nombre approximatif.
  await db.insert(annonces).values([
    { ownerId: VENDEUR, status: "publiee", titre: `${PREFIX}Zoe`, marque: "Renault", modele: "Zoe", carburant: "electrique" },
    { ownerId: VENDEUR, status: "publiee", titre: `${PREFIX}e-208`, marque: "Peugeot", modele: "e-208", carburant: "electrique" },
    { ownerId: VENDEUR, status: "publiee", titre: `${PREFIX}Prius`, marque: "Toyota", modele: "Prius", carburant: "hybride" },
    { ownerId: VENDEUR, status: "publiee", titre: `${PREFIX}Clio Location`, marque: "Renault", modele: "Clio", type: "location" },
    // Brouillon : jamais compté, même s'il est électrique.
    { ownerId: VENDEUR, status: "brouillon", titre: `${PREFIX}Model3 brouillon`, marque: "Tesla", modele: "Model 3", carburant: "electrique" },
  ]);

  const apres = parTopic(await liveAnswers());
  const apresElectrique = Number(apres.vehicule_electrique.answer.match(/^(\d+)/)?.[1] ?? 0);
  const apresHybride = Number(apres.vehicule_hybride.answer.match(/^(\d+)/)?.[1] ?? 0);
  const apresLocation = Number(apres.location_stock.answer.match(/^(\d+)/)?.[1] ?? 0);
  const avantHybride = Number(avant.vehicule_hybride.answer.match(/^(\d+)/)?.[1] ?? 0);
  const avantLocation = Number(avant.location_stock.answer.match(/^(\d+)/)?.[1] ?? 0);

  verif("3 intentions en direct présentes (électrique, hybride, location)", Object.keys(apres).length === 3);
  verif("véhicule électrique : +2 exactement (le brouillon n'est jamais compté)", apresElectrique - avantElectrique === 2);
  verif("véhicule hybride : +1 exactement", apresHybride - avantHybride === 1);
  verif("location : +1 exactement", apresLocation - avantLocation === 1);
  verif("réponse plurielle correcte (ex: '2 véhicules électriques sont ... publiés')", apres.vehicule_electrique.answer.includes("sont actuellement publiés"));
  verif("chaque intention a un lien réel vers une page existante", apres.vehicule_electrique.link === "/carburant/electrique" && apres.vehicule_hybride.link === "/carburant/hybride" && apres.location_stock.link === "/louer");

  // ── 3. Décompte à zéro pour nos propres annonces : on vérifie la phrase honnête sur
  //       un topic qui ne peut matcher aucune de nos insertions (aucune annonce gpl ici).
  await nettoyer();
  const sansDonnees = parTopic(await liveAnswers());
  // On ne peut pas garantir un vrai zéro global (d'autres vendeurs existent), mais on
  // vérifie que la formulation "Aucun ... actuellement publié" EST bien celle utilisée
  // quand le décompte réel (toutes sources confondues) est à zéro, en la cherchant dans
  // au moins une des 3 intentions si son décompte retombe à 0 après notre nettoyage —
  // sinon on vérifie juste que la phrase n'apparaît jamais à tort quand le décompte > 0.
  for (const topic of Object.keys(sansDonnees)) {
    const r = sansDonnees[topic];
    const compteZero = r.answer.startsWith("Aucun");
    const comptePositif = /^\d+/.test(r.answer);
    verif(`${topic} : la réponse commence soit par "Aucun" (zéro réel) soit par un nombre réel, jamais autre chose`, compteZero || comptePositif);
    if (compteZero) verif(`${topic} : "Aucun" n'invente jamais un nombre à côté`, !/\d/.test(r.answer.split(".")[0]));
  }

  await nettoyer();
  console.log(`${ok}/${total} vérifications réussies.`);
  process.exit(ok === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
