/**
 * AdminBadges.tsx affichait un tableau BADGES 100% inventé (nom, description,
 * critères, "attribués" fictif). badges/badgeAttributions sont maintenant de
 * vraies tables : le catalogue est déclaré une fois (seedBadgesCatalogue,
 * idempotent), les critères sont un texte modifiable par un admin (aucun
 * seuil numérique unique n'est inventé — voir le commentaire en tête de
 * badges.ts), et "attribués" est un vrai comptage sur badge_attributions.
 * Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/badges.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, badges, badgeAttributions } from "../../schema.js";
import { badgesRouter, seedBadgesCatalogue } from "../badges.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const TITULAIRE = 900960;
const PREFIX = "TEST-BADGES-";
const callerAdmin = badgesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: 900961, role: "super_admin", email: "admin-badges@mkapms.local" } });

async function nettoyer() {
  const codes = ["vendeur_certifie", "garage_premium", "top_vendeur", "super_loueur", "expert_technique"];
  const rows = await db.select({ id: badges.id }).from(badges).where(inArray(badges.code, codes));
  if (rows.length) await db.delete(badgeAttributions).where(inArray(badgeAttributions.badgeId, rows.map((r) => r.id)));
  await db.delete(badges).where(inArray(badges.code, codes));
  await db.delete(users).where(eq(users.id, TITULAIRE));
}

async function main() {
  await nettoyer();

  const premier = await seedBadgesCatalogue();
  verif("1. seedBadgesCatalogue crée exactement les 5 badges du catalogue au premier appel", premier.crees === 5);

  const second = await seedBadgesCatalogue();
  verif("2. seedBadgesCatalogue est idempotent : 0 nouveau badge au second appel", second.crees === 0);

  const avant = await callerAdmin.list();
  const vendeur = avant.find((b) => b.code === "vendeur_certifie");
  verif("3. list retourne les badges déclarés avec attribues=0 tant qu'aucune attribution réelle n'existe", vendeur?.attribues === 0);

  await db.insert(users).values({ id: TITULAIRE, email: `${PREFIX}titulaire@mkapms.local`, name: "Titulaire Badge Test" });
  await db.insert(badgeAttributions).values({ badgeId: vendeur!.id, userId: TITULAIRE });

  const apresAttribution = await callerAdmin.list();
  const vendeurApres = apresAttribution.find((b) => b.code === "vendeur_certifie");
  verif("4. list reflète une vraie attribution insérée (attribues=1)", vendeurApres?.attribues === 1);

  const autre = apresAttribution.find((b) => b.code === "garage_premium");
  verif("5. les autres badges restent à 0 attribués (pas de fuite entre badges)", autre?.attribues === 0);

  await callerAdmin.setCriteres({ id: vendeur!.id, criteres: `${PREFIX}critere modifié` });
  const apresCriteres = await callerAdmin.list();
  verif("6. setCriteres persiste et est relu", apresCriteres.find((b) => b.code === "vendeur_certifie")?.criteres === `${PREFIX}critere modifié`);

  const titulaires = await callerAdmin.titulaires({ badgeId: vendeur!.id });
  verif("7. titulaires retourne exactement les attributions de ce badge, jointes à l'utilisateur", titulaires.length === 1 && titulaires[0].userName === "Titulaire Badge Test");

  const titulairesAutre = await callerAdmin.titulaires({ badgeId: autre!.id });
  verif("8. titulaires d'un badge sans attribution renvoie une liste vide", titulairesAutre.length === 0);

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
