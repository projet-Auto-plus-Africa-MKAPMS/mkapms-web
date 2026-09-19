/**
 * Fournisseurs Vente (client/src/pages/vente/CentreFournisseurs.tsx). Base
 * de données réelle.
 *
 * Corrige une fabrication réelle : l'écran affichait 4 fournisseurs codés en
 * dur avec un nombre de commandes et un montant total inventés (aucun
 * système de bons de commande n'existe sur la plateforme pour les
 * alimenter honnêtement — retirés, pas simulés). Ce test prouve que
 * venteFournisseursListe n'expose jamais le carnet d'un autre vendeur, et
 * que venteFournisseurSupprimer refuse catégoriquement de supprimer un
 * contact qui ne lui appartient pas.
 *
 * Lancement : `npx tsx server/routers/__tests__/vente-fournisseurs.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { venteFournisseurs } from "../../schema.js";
import { proRouter } from "../pro.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR_A = 900701;
const VENDEUR_B = 900702;

const callerA = proRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR_A, role: "pro", email: "vendeur-a-fourn@mkapms.local" } });
const callerB = proRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR_B, role: "pro", email: "vendeur-b-fourn@mkapms.local" } });

async function nettoyer() {
  await db.delete(venteFournisseurs).where(inArray(venteFournisseurs.userId, [VENDEUR_A, VENDEUR_B]));
}

async function main() {
  await nettoyer();

  // ── 1. Ajout réel, sans commandes/total inventés ──
  const f = await callerA.venteFournisseurAjouter({ nom: "Pièces Auto Express Test", type: "Pièces", telephone: "0601020304" });
  verif("1. le fournisseur créé porte les vraies données saisies", f.nom === "Pièces Auto Express Test" && f.type === "Pièces");
  verif("1. aucun champ commandes/total inventé n'existe sur l'objet retourné", !("commandes" in f) && !("total" in f));

  // ── 2. Chaque vendeur ne voit QUE son propre carnet ──
  await callerB.venteFournisseurAjouter({ nom: "Fournisseur B Test" });
  const listeA = await callerA.venteFournisseursListe();
  verif("2. le vendeur A voit son propre fournisseur", listeA.some((x) => x.id === f.id));
  verif("2. le vendeur A ne voit jamais le carnet du vendeur B", !listeA.some((x) => x.nom === "Fournisseur B Test"));

  // ── 3. Un vendeur ne peut jamais supprimer le fournisseur d'un autre ──
  const listeB = await callerB.venteFournisseursListe();
  const fournisseurDeB = listeB.find((x) => x.nom === "Fournisseur B Test")!;
  await assert.rejects(
    () => callerA.venteFournisseurSupprimer({ id: fournisseurDeB.id }),
    /introuvable/,
    "3. supprimer le fournisseur d'un autre vendeur est catégoriquement refusé",
  );
  ok++; total++;
  const [encoreLa] = await db.select().from(venteFournisseurs).where(eq(venteFournisseurs.id, fournisseurDeB.id));
  verif("3. le fournisseur du vendeur B existe toujours malgré la tentative", !!encoreLa);

  // ── 4. Le propriétaire peut réellement supprimer son propre fournisseur ──
  await callerA.venteFournisseurSupprimer({ id: f.id });
  const [supprime] = await db.select().from(venteFournisseurs).where(eq(venteFournisseurs.id, f.id));
  verif("4. le fournisseur est réellement supprimé de la base", !supprime);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
