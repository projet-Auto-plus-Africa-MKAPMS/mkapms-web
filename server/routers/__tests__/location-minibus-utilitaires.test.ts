/**
 * LocationUtilitaires.tsx et LocationMinibus.tsx affichaient des catalogues
 * entièrement fabriqués (ids 5001-5023 et 7001-7008, prix inventés) menant
 * vers ProduitLocation.tsx — même risque de collision d'identifiant que
 * LocationCamions.tsx. Base de données réelle.
 *
 * LocationUtilitaires.tsx réutilise trpc.annonces.list(categorie:
 * "utilitaire") déjà utilisé. LocationMinibus.tsx n'avait aucune requête
 * réelle : aucune valeur "minibus" n'existe dans categorieEnum côté serveur
 * — le filtre réel utilisé à la place est le nombre de places
 * (annonces.places, champ réel à correspondance exacte), plus pertinent
 * qu'une catégorie approximée. Ce test prouve les deux filtres.
 *
 * Lancement : `npx tsx server/routers/__tests__/location-minibus-utilitaires.test.ts`
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

const VENDEUR = 900994;
const PREFIX = "TEST-LOCMINIUTIL-";

const callerPublic = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: null });

async function nettoyer() {
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Kangoo Van`, `${PREFIX}Sprinter 9pl`, `${PREFIX}Transit 17pl`]));
  await db.delete(users).where(eq(users.id, VENDEUR));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: VENDEUR, email: "vendeur-test-locminiutil@mkapms.local", name: "Vendeur LocMiniUtil Test" });

  await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Kangoo Van`, marque: "Renault", modele: "Kangoo", type: "location", categorie: "utilitaire", status: "publiee", prix: "35" });
  await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Sprinter 9pl`, marque: "Mercedes", modele: "Sprinter", type: "location", categorie: "monospace", places: 9, status: "publiee", prix: "110" });
  await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Transit 17pl`, marque: "Ford", modele: "Transit", type: "location", categorie: "monospace", places: 17, status: "publiee", prix: "160" });

  // ── LocationUtilitaires.tsx : filtre par categorie "utilitaire" ──
  const utilitaires = await callerPublic.list({ type: "location", categorie: "utilitaire", limit: 24 });
  const titresUtil = utilitaires.items.map((a) => a.titre);
  verif("1. le vrai utilitaire apparaît dans le catalogue utilitaires", titresUtil.includes(`${PREFIX}Kangoo Van`));
  verif("2. un minibus 9 places n'apparaît pas dans le catalogue utilitaires (catégories réellement distinctes)", !titresUtil.includes(`${PREFIX}Sprinter 9pl`));

  // ── LocationMinibus.tsx : filtre par nombre de places réel (aucune catégorie "minibus" n'existe) ──
  const minibus9 = await callerPublic.list({ type: "location", places: 9, limit: 24 });
  const titresMini9 = minibus9.items.map((a) => a.titre);
  verif("3. le filtre par 9 places renvoie bien le minibus 9 places réel", titresMini9.includes(`${PREFIX}Sprinter 9pl`));
  verif("4. le filtre par 9 places exclut bien le minibus 17 places (correspondance exacte, jamais approximative)", !titresMini9.includes(`${PREFIX}Transit 17pl`));

  const minibusToutesPlaces = await callerPublic.list({ type: "location", limit: 24 });
  const titresTous = minibusToutesPlaces.items.map((a) => a.titre);
  verif("5. sans filtre de places, les deux minibus réels apparaissent bien", titresTous.includes(`${PREFIX}Sprinter 9pl`) && titresTous.includes(`${PREFIX}Transit 17pl`));

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
