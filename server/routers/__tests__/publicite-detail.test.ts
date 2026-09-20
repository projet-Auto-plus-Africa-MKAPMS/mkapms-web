/**
 * PubliciteDetail.tsx affichait 3 demandes de publicité entièrement
 * fabriquées (DEMO_DEMANDES). Réutilise le vrai moteur déjà utilisé par
 * Admin.tsx (server/routers/admin.ts : pubRequestDetail/decidePubRequest/
 * deletePubRequest, table pub_requests) — aucun second moteur créé.
 * Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/publicite-detail.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { users } from "../../schema.js";
import { pubRequests } from "../../modules/marketing.js";
import { adminRouter } from "../admin.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const ADMIN = 900990;

const callerAdmin = adminRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ADMIN, role: "super_admin", email: "admin-pub@mkapms.local" } });
const callerAnon = adminRouter.createCaller({ req: {} as never, res: {} as never, user: null });

async function nettoyer() {
  await db.delete(pubRequests).where(eq(pubRequests.entreprise, "TEST-PUB Garage Saint-Denis"));
  await db.delete(users).where(eq(users.id, ADMIN));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: ADMIN, email: "admin-test-pub@mkapms.local", name: "Admin Pub Test" });

  const [demande] = await db.insert(pubRequests).values({
    entreprise: "TEST-PUB Garage Saint-Denis",
    type: "Réparateur / Garage",
    emplacement: "accueil-1",
    description: "Vidange + contrôle technique à 59€.",
    contactName: "M. Traoré",
    contactEmail: "info@garage-test.fr",
    contactPhone: "01 49 33 22 11",
    budget: "50€/jour",
    duree: "7j",
  }).returning();

  // ── 1. Un anonyme n'a pas accès (aucune fuite de données de demande de pub) ──
  let refuseAnon = false;
  try {
    await callerAnon.pubRequestDetail({ id: demande.id });
  } catch (err) {
    refuseAnon = /FORBIDDEN|Accès back-office requis/.test(String((err as Error).message)) || (err as any).code === "FORBIDDEN";
  }
  verif("1. un visiteur anonyme n'a pas accès au détail d'une demande de publicité", refuseAnon);

  // ── 2. Un admin voit bien la fiche réelle, avec exactement les champs consommés par PubliciteDetail.tsx ──
  const detail = await callerAdmin.pubRequestDetail({ id: demande.id });
  verif("2. le détail contient les vrais champs (entreprise/type/emplacement/contact)", detail?.entreprise === "TEST-PUB Garage Saint-Denis" && detail?.type === "Réparateur / Garage" && detail?.emplacement === "accueil-1" && detail?.contactPhone === "01 49 33 22 11");
  verif("2. le statut par défaut est bien en_attente", detail?.status === "en_attente");

  // ── 3. Refuser avec motif : le motif réel est bien renvoyé ensuite (jamais un motif inventé côté client) ──
  await callerAdmin.decidePubRequest({ id: demande.id, decision: "refusee", refusalReason: "Contenu non conforme (alcool)" });
  const apresRefus = await callerAdmin.pubRequestDetail({ id: demande.id });
  verif("3. la demande refusée porte le vrai motif de refus", apresRefus?.status === "refusee" && apresRefus?.refusalReason === "Contenu non conforme (alcool)");

  // ── 4. Suppression réelle : la fiche n'existe plus ensuite ──
  await callerAdmin.deletePubRequest({ id: demande.id });
  const apresSuppression = await callerAdmin.pubRequestDetail({ id: demande.id });
  verif("4. après suppression, la demande n'existe plus", apresSuppression === null);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
