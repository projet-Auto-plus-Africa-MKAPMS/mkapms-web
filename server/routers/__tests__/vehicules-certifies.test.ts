/**
 * VehiculesCertifies.tsx affichait un catalogue VEHICULES 100% fabriqué
 * (ids 1-3) alors qu'un vrai mécanisme de certification existe déjà :
 * annonces.selectionMka, réglé par server/routers/admin.ts:certifyVehicle
 * (Direction uniquement) et déjà utilisé sur Home.tsx. L'écran a été
 * reconnecté à trpc.annonces.list({ type: "location", selectionMka: true })
 * — ce test vérifie que ce filtre exact renvoie uniquement les annonces de
 * location réellement certifiées, sans en fabriquer ni en oublier.
 * Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/vehicules-certifies.test.ts`
 */
import assert from "node:assert/strict";
import { inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces } from "../../schema.js";
import { annoncesRouter } from "../annonces.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const PREFIX = "TEST-VEHCERT-";
const caller = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: null });

async function nettoyer() {
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Certifiee`, `${PREFIX}NonCertifiee`, `${PREFIX}CertifieeVente`]));
}

async function main() {
  await nettoyer();

  const [certifiee] = await db.insert(annonces).values({
    ownerId: 1, titre: `${PREFIX}Certifiee`, marque: "Mercedes", modele: "Classe E",
    type: "location", status: "publiee", selectionMka: true, prixJour: "63.00",
  }).returning();
  const [nonCertifiee] = await db.insert(annonces).values({
    ownerId: 1, titre: `${PREFIX}NonCertifiee`, marque: "Renault", modele: "Clio",
    type: "location", status: "publiee", selectionMka: false, prixJour: "40.00",
  }).returning();
  // Une annonce certifiée mais de type vente ne doit jamais apparaître dans
  // le catalogue location certifié.
  await db.insert(annonces).values({
    ownerId: 1, titre: `${PREFIX}CertifieeVente`, marque: "BMW", modele: "Série 5",
    type: "vente", status: "publiee", selectionMka: true, prix: "45000.00",
  }).returning();

  const resultat = await caller.list({ type: "location", selectionMka: true, limit: 50 });
  const ids = resultat.items.map((a) => a.id);

  verif("1. l'annonce location certifiée apparaît", ids.includes(certifiee.id));
  verif("2. l'annonce location non certifiée n'apparaît pas", !ids.includes(nonCertifiee.id));
  verif("3. une annonce vente certifiée n'apparaît pas dans le catalogue location", ids.every((id) => id !== undefined) && !resultat.items.some((a: any) => a.titre === `${PREFIX}CertifieeVente`));

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
