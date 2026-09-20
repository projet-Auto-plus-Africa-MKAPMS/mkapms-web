/**
 * SuccessionVehicule.tsx, PlaquesImmatriculation.tsx, PaiementDemarches.tsx,
 * MessagerieDemarches.tsx, SignaturesElectroniques.tsx. Base de données réelle.
 *
 * Signalés parmi une série de boutons sans action détectés par le PDG.
 * Tous les cinq réutilisent le moteur cartegrise déjà complet (createDossier/
 * detail/addDocument), suivant exactement le même schéma que les 9 écrans
 * demarches/* déjà connectés (tâche #31) : type "autre" + motif dans notes
 * quand aucune valeur d'enum dédiée n'existe (comme DuplicataDemarche.tsx
 * pour "duplicata"). Une seule procédure a été ajoutée (payerDossier) car
 * aucune n'existait pour payer les frais RÉELS d'un dossier (montantTaxe/
 * montantPrestation, jamais un tarif calculé côté client) — ce test la
 * couvre spécifiquement, ainsi que le refus honnête tant qu'un dossier
 * n'a pas encore été chiffré par l'agence.
 *
 * Lancement : `npx tsx server/routers/__tests__/demarches-reconnexion.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users } from "../../schema.js";
import { cgDossiers, cgDocuments, cgEtapes } from "../../modules/cartegrise.js";
import { carteGriseRouter } from "../cartegrise.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CLIENT = 900980;
const AUTRE_CLIENT = 900981;
const PREFIX = "TEST-DEMARCHES-";

const callerClient = carteGriseRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: CLIENT, role: "user", email: "client-demarches@mkapms.local" } });
const callerAutre = carteGriseRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: AUTRE_CLIENT, role: "user", email: "autre-demarches@mkapms.local" } });

async function nettoyer() {
  const dossiers = await db.select({ id: cgDossiers.id }).from(cgDossiers).where(inArray(cgDossiers.clientId, [CLIENT, AUTRE_CLIENT]));
  const ids = dossiers.map((d) => d.id);
  if (ids.length) {
    await db.delete(cgDocuments).where(inArray(cgDocuments.dossierId, ids));
    await db.delete(cgEtapes).where(inArray(cgEtapes.dossierId, ids));
    await db.delete(cgDossiers).where(inArray(cgDossiers.id, ids));
  }
  await db.delete(users).where(inArray(users.id, [CLIENT, AUTRE_CLIENT]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values([
    { id: CLIENT, email: "client-test-demarches@mkapms.local", name: "Client Démarches Test" },
    { id: AUTRE_CLIENT, email: "autre-test-demarches@mkapms.local", name: "Autre Client Démarches Test" },
  ]);

  // ── 1. Succession véhicule : type "autre" + motif dans notes (même schéma que Duplicata) ──
  const succession = await callerClient.createDossier({ type: "autre", immatriculation: "AB-123-CD", notes: "Succession véhicule" });
  verif("1. le dossier succession porte bien le type autre", succession.type === "autre");
  const mesDossiers = await callerClient.mesDossiers();
  verif("1. le dossier apparaît bien dans mesDossiers avec son motif", mesDossiers.some((d) => d.id === succession.id && d.notes === "Succession véhicule"));

  // ── 2. Commande de plaques : même schéma, notes distinctes ──
  const plaques = await callerClient.createDossier({ type: "autre", immatriculation: "EF-456-GH", notes: `${PREFIX}Commande plaques — Standard (19,90 € indicatif)` });
  verif("2. le dossier plaques est bien créé avec le bon motif", plaques.notes?.startsWith(`${PREFIX}Commande plaques`) ?? false);

  // ── 3. Paiement : refusé tant que le dossier n'est pas chiffré (jamais un tarif inventé) ──
  let refuseNonChiffre = false;
  try {
    await callerClient.payerDossier({ dossierId: plaques.id });
  } catch (err) {
    refuseNonChiffre = /pas encore été chiffré/.test((err as Error).message);
  }
  verif("3. le paiement est refusé tant que l'agence n'a pas chiffré le dossier", refuseNonChiffre);

  // ── 4. Une fois chiffré (simulé — aucune procédure agence de chiffrage n'existe encore), le paiement fonctionne ──
  await db.update(cgDossiers).set({ montantTaxe: "0.00", montantPrestation: "19.90" }).where(eq(cgDossiers.id, plaques.id));
  const paiement = await callerClient.payerDossier({ dossierId: plaques.id });
  verif("4. une fois chiffré, le paiement renvoie une vraie URL de redirection", typeof paiement.url === "string" && paiement.url.length > 0);

  // ── 5. Un autre client ne peut jamais payer le dossier d'un tiers ──
  let refuseTiers = false;
  try {
    await callerAutre.payerDossier({ dossierId: plaques.id });
  } catch (err) {
    refuseTiers = /ne vous appartient pas/.test((err as Error).message);
  }
  verif("5. un tiers ne peut jamais payer le dossier d'un autre client", refuseTiers);

  // ── 6. Suivi du dossier (MessagerieDemarches) : les vraies étapes créées à la création sont lisibles ──
  const detail = await callerClient.detail({ id: succession.id });
  verif("6. le dossier a bien une étape réelle créée automatiquement (jamais un message fabriqué)", detail.etapes.length >= 1 && detail.etapes[0].statusLabel.includes("Documents à fournir"));

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
