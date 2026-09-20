/**
 * LocationCamions.tsx affichait 8 camions entièrement fabriqués (ids
 * 6001-6008, prix inventés) menant vers ProduitLocation.tsx, qui — ne
 * reconnaissant pas ces ids comme des démonstrations connues — tentait une
 * vraie requête trpc.annonces.get(id) : soit une fiche introuvable, soit
 * pire, la fiche d'une tout autre annonce réelle portant le même id par
 * coïncidence. Remplacé par le vrai catalogue trpc.annonces.list
 * (categorie: "camion", type: "location"), déjà utilisé ailleurs. Ce test
 * prouve que ce filtre renvoie bien les vraies annonces "camion" et exclut
 * les annonces d'un autre type/catégorie. Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/location-camions.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, annonces } from "../../schema.js";
import { annoncesRouter } from "../annonces.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR = 900999;
const PREFIX = "TEST-LOCCAMIONS-";

const callerPublic = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: null });

async function nettoyer() {
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Iveco Daily`, `${PREFIX}Peugeot 308`, `${PREFIX}Kangoo Utilitaire`]));
  await db.delete(users).where(eq(users.id, VENDEUR));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: VENDEUR, email: "vendeur-test-loccamions@mkapms.local", name: "Vendeur LocCamions Test" });

  // Un vrai camion en location : doit apparaître.
  await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Iveco Daily`, marque: "Iveco", modele: "Daily", type: "location", categorie: "camion", status: "publiee", prix: "150" });
  // Une berline en VENTE : ne doit jamais apparaître dans le catalogue camions en location.
  await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Peugeot 308`, marque: "Peugeot", modele: "308", type: "vente", categorie: "berline", status: "publiee", prix: "18000" });
  // Un utilitaire en location : catégorie différente de "camion", ne doit pas apparaître ici.
  await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Kangoo Utilitaire`, marque: "Renault", modele: "Kangoo", type: "location", categorie: "utilitaire", status: "publiee", prix: "35" });

  const resultats = await callerPublic.list({ type: "location", categorie: "camion", limit: 24 });
  const titres = resultats.items.map((a) => a.titre);

  verif("1. le vrai camion en location apparaît bien dans le catalogue", titres.includes(`${PREFIX}Iveco Daily`));
  verif("2. une annonce en vente n'apparaît jamais dans un catalogue de location", !titres.includes(`${PREFIX}Peugeot 308`));
  verif("3. un utilitaire n'apparaît pas dans le catalogue filtré 'camion' (jamais une sous-catégorie fabriquée mélangée)", !titres.includes(`${PREFIX}Kangoo Utilitaire`));

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
