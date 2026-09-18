/**
 * Payment Engine — non-régression sur l'enum payment_type.
 *
 * Bug réel trouvé en base locale : devis.ts (payerDevis) et cartegrise.ts
 * (souscrireAbonnement/acheterPack) appelaient createPaymentCheckout() avec
 * un paymentTypeSql explicite ("garage_prestation", "carte_grise") absent de
 * l'énumération Postgres payment_type (rental_caution, society_acompte,
 * pro_subscription, franchise_subscription, vehicle_boost, vehicle_purchase)
 * — confirmé par un INSERT direct qui échoue avec "invalid input value for
 * enum payment_type". Tout utilisateur réel payant un devis accepté, ou une
 * agence souscrivant un abonnement/pack carte grise, recevait une erreur
 * serveur au lieu d'un paiement. Corrigé en retirant l'override invalide :
 * le sqlTypeMap de checkout.ts sait déjà mapper ces kinds vers "vehicle_boost",
 * une valeur réellement acceptée par l'enum.
 *
 * Ce test vérifie deux choses réelles, pas seulement que createPaymentCheckout
 * fonctionne avec ses valeurs par défaut (ça n'a jamais été cassé) :
 *  1. les valeurs jadis codées en dur sont bien rejetées par l'enum réel —
 *     si ce test échoue un jour, c'est que l'enum a changé, à vérifier ;
 *  2. les fichiers appelants ne reproduisent pas l'erreur (ne passent plus
 *     paymentTypeSql: "garage_prestation" / "carte_grise").
 *
 * Lancement : `npx tsx server/payment-engine/__tests__/checkout.test.ts`
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { payments } from "../../schema.js";
import { createPaymentCheckout } from "../checkout.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function verifieValeurEnumRejetee(valeurInvalide: string) {
  try {
    const [row] = await db
      .insert(payments)
      .values({ userId: 1, type: valeurInvalide as any, amount: "10", currency: "EUR", status: "pending" })
      .returning();
    await db.delete(payments).where(eq(payments.id, row.id));
    verif(`"${valeurInvalide}" est toujours rejetée par l'enum payment_type (elle ne devrait jamais s'insérer)`, false);
  } catch (e) {
    verif(`"${valeurInvalide}" est bien rejetée par l'enum payment_type (comportement attendu)`, /invalid input value for enum payment_type/.test((e as Error).message));
  }
}

function verifieAppelantNePasseVaLeurInvalide(fichier: string, valeurInvalide: string) {
  const contenu = readFileSync(fichier, "utf8");
  const present = contenu.includes(`paymentTypeSql: "${valeurInvalide}"`) || contenu.includes(`paymentTypeSql: '${valeurInvalide}'`);
  verif(`${fichier} ne repasse plus paymentTypeSql: "${valeurInvalide}"`, !present);
}

async function main() {
  // 1. Les deux valeurs jadis codées en dur sont réellement invalides.
  await verifieValeurEnumRejetee("garage_prestation");
  await verifieValeurEnumRejetee("carte_grise");

  // 2. Les fichiers appelants réels ne les repassent plus.
  verifieAppelantNePasseVaLeurInvalide("server/routers/devis.ts", "garage_prestation");
  verifieAppelantNePasseVaLeurInvalide("server/routers/cartegrise.ts", "carte_grise");

  // 3. Le chemin réel (sans override, via le kind) produit bien une valeur acceptée.
  const res = await createPaymentCheckout({
    userId: 1,
    kind: "garage_prestation",
    amount: 10,
    currency: "EUR",
    label: "Devis test (non-régression)",
    successPath: "/test?paid=1",
    cancelPath: "/test?canceled=1",
  });
  const [row] = await db.select().from(payments).where(eq(payments.id, res.paymentId)).limit(1);
  verif("Le chemin réel (kind sans override) produit un type accepté par l'enum", row?.type === "vehicle_boost");
  await db.delete(payments).where(eq(payments.id, res.paymentId));

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
