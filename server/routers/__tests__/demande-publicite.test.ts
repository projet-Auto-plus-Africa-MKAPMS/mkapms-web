/**
 * DemandePublicite.tsx (formulaire public réel, upload de fichier réel)
 * simulait un succès (setTimeout) sans jamais appeler le serveur : le vrai
 * moteur de revue admin (server/routers/admin.ts : pubRequestsList/
 * pubRequestDetail/decidePubRequest/deletePubRequest, table pub_requests)
 * ne recevait donc jamais aucune vraie demande — tâche #62. Ce test couvre
 * le parcours complet demandé : saisie → validation serveur → enregistrement
 * → consultation administrative → décision. Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/demande-publicite.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { users, pubRequests } from "../../schema.js";
import { marketingRouter } from "../marketing.js";
import { adminRouter } from "../admin.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const ADMIN = 900995;
const PREFIX = "TEST-DEMANDEPUB-";

const callerAnon = marketingRouter.createCaller({ req: {} as never, res: {} as never, user: null });
const callerAdmin = adminRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ADMIN, role: "super_admin", email: "admin-demandepub@mkapms.local" } });

async function nettoyer() {
  await db.delete(pubRequests).where(eq(pubRequests.entreprise, `${PREFIX}Garage Kinshasa`));
  await db.delete(users).where(eq(users.id, ADMIN));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: ADMIN, email: "admin-test-demandepub@mkapms.local", name: "Admin DemandePub Test" });

  // ── 1. Validation serveur : contentType "lien" sans linkUrl est refusé (jamais un succès sur données incomplètes) ──
  let refuseSansContenu = false;
  try {
    await callerAnon.createPubRequest({
      entreprise: `${PREFIX}Garage Kinshasa`,
      type: "Garage",
      emplacement: "accueil-1",
      contactName: "Jean Test",
      contactEmail: "jean@test.local",
      contactPhone: "+243 900 000 000",
      contentType: "lien",
    } as never);
  } catch {
    refuseSansContenu = true;
  }
  verif("1. le serveur refuse une demande 'lien' sans linkUrl (jamais acceptée par défaut)", refuseSansContenu);

  // ── 2. Une vraie soumission (pays hors France, devise non EUR) est réellement persistée ──
  const cree = await callerAnon.createPubRequest({
    entreprise: `${PREFIX}Garage Kinshasa`,
    type: "Garage / Réparation automobile",
    emplacement: "Page d'accueil — Carrousel #1 (entre annonces)",
    description: "Ouverture magasin — pièces neuves.",
    contactName: "Jean Test",
    contactEmail: "jean@test.local",
    contactPhone: "+243 900 000 000",
    budget: "50 EUR/jour (référence)",
    budgetAmountEur: 50,
    duree: "1 semaine",
    pays: "CD",
    contentType: "lien",
    linkUrl: "https://garage-kinshasa-test.example",
  });
  verif("2. la demande réelle est bien enregistrée en base (id renvoyé)", typeof cree.id === "number");
  verif("2. le pays réel du demandeur est conservé (jamais 'FR' par défaut)", cree.pays === "CD");
  verif("2. le lien réel est conservé, aucun média fabriqué", cree.linkUrl === "https://garage-kinshasa-test.example" && cree.mediaUrl === null);
  verif("2. le statut initial est en_attente (jamais approuvé d'office)", cree.status === "en_attente");

  // ── 3. L'admin consulte la vraie demande (jamais une donnée de démonstration) ──
  const detailAdmin = await callerAdmin.pubRequestDetail({ id: cree.id });
  verif("3. l'admin voit exactement les mêmes données réellement soumises", detailAdmin?.entreprise === `${PREFIX}Garage Kinshasa` && detailAdmin?.contactPhone === "+243 900 000 000");

  // ── 4. L'admin approuve réellement la demande, la décision est persistée ──
  await callerAdmin.decidePubRequest({ id: cree.id, decision: "approuvee" });
  const apresDecision = await callerAdmin.pubRequestDetail({ id: cree.id });
  verif("4. la décision réelle de l'admin est bien persistée", apresDecision?.status === "approuvee" && apresDecision?.decidedBy === ADMIN);

  // ── 5. Une seconde soumission identique (double clic) crée une seconde ligne distincte, jamais une fusion silencieuse ni une erreur cachée ──
  const seconde = await callerAnon.createPubRequest({
    entreprise: `${PREFIX}Garage Kinshasa`,
    type: "Garage / Réparation automobile",
    emplacement: "Page d'accueil — Carrousel #1 (entre annonces)",
    contactName: "Jean Test",
    contactEmail: "jean@test.local",
    contactPhone: "+243 900 000 000",
    pays: "CD",
    contentType: "lien",
    linkUrl: "https://garage-kinshasa-test.example",
  });
  verif("5. une resoumission crée une vraie ligne distincte (traçable), pas une fusion silencieuse", seconde.id !== cree.id);
  await db.delete(pubRequests).where(eq(pubRequests.id, seconde.id));

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
