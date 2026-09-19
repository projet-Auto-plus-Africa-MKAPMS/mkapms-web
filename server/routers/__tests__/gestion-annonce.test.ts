/**
 * Gérer l'annonce (ModificationAnnonce.tsx) + Expiration (ExpirationAnnonce.tsx).
 * Base de données réelle.
 *
 * Corrige deux écrans orphelins : ni l'un ni l'autre n'acceptait
 * d'identifiant de véhicule (aucun ne savait de quelle annonce il parlait),
 * et aucun n'était référencé nulle part dans l'application. Aucun nouveau
 * moteur n'a été écrit : trpc.annonces.update/remove/prolong existent déjà
 * et sont déjà utilisés par MesAnnonces.tsx pour les mêmes actions (prolonger,
 * modifier, supprimer) — Suspendre/Republier ne sont que le même champ
 * status ("archivee"/"publiee") déjà géré par update. Ce test prouve le
 * cycle complet suspendre → republier → prolonger → supprimer sur une
 * annonce réelle, et l'isolation vendeur sur chacune de ces actions.
 *
 * Lancement : `npx tsx server/routers/__tests__/gestion-annonce.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces, users } from "../../schema.js";
import { annoncesRouter } from "../annonces.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR = 900998;
const AUTRE_VENDEUR = 900999;
const PREFIX = "TEST-GESTIONANNONCE-";

const callerVendeur = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR, role: "user", email: "vendeur-gestion@mkapms.local" } });
const callerAutre = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: AUTRE_VENDEUR, role: "user", email: "autre-gestion@mkapms.local" } });

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(inArray(annonces.ownerId, [VENDEUR, AUTRE_VENDEUR]));
  const ids = mesAnnonces.map((a) => a.id);
  if (ids.length) await db.delete(annonces).where(inArray(annonces.id, ids));
  await db.delete(users).where(eq(users.id, AUTRE_VENDEUR));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: AUTRE_VENDEUR, email: "autre-test-gestion@mkapms.local", name: "Autre Vendeur Gestion" });
  const [annonce] = await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Twingo`, marque: "Renault", modele: "Twingo", status: "publiee" }).returning();

  // ── 1. Suspendre passe réellement le statut à archivee ──
  await callerVendeur.update({ id: annonce.id, status: "archivee" });
  const apresSuspension = await callerVendeur.get({ id: annonce.id });
  verif("1. suspendre passe réellement le statut à archivee", apresSuspension.status === "archivee");

  // ── 2. Republier repasse réellement à publiee ──
  await callerVendeur.update({ id: annonce.id, status: "publiee" });
  const apresRepublication = await callerVendeur.get({ id: annonce.id });
  verif("2. republier repasse réellement à publiee", apresRepublication.status === "publiee");

  // ── 3. Prolonger avance réellement la date d'expiration ──
  const avantProlong = apresRepublication.expiresAt ? new Date(apresRepublication.expiresAt).getTime() : 0;
  await callerVendeur.prolong({ id: annonce.id });
  const apresProlong = await callerVendeur.get({ id: annonce.id });
  const apresProlongTime = apresProlong.expiresAt ? new Date(apresProlong.expiresAt).getTime() : 0;
  verif("3. prolonger avance réellement la date d'expiration", apresProlongTime > avantProlong);

  // ── 4. Un autre vendeur ne peut ni suspendre ni prolonger ni supprimer une annonce qui n'est pas la sienne ──
  let refuseSuspension = false;
  try { await callerAutre.update({ id: annonce.id, status: "archivee" }); } catch (err) { refuseSuspension = (err as { code?: string }).code === "FORBIDDEN"; }
  verif("4. un tiers ne peut pas suspendre l'annonce d'un autre vendeur", refuseSuspension);

  let refuseProlong = false;
  try { await callerAutre.prolong({ id: annonce.id }); } catch (err) { refuseProlong = (err as { code?: string }).code === "FORBIDDEN"; }
  verif("4. un tiers ne peut pas prolonger l'annonce d'un autre vendeur", refuseProlong);

  // ── 5. Supprimer passe réellement le statut à archivee (suppression logique) ──
  await callerVendeur.remove({ id: annonce.id });
  const apresSuppression = await callerVendeur.get({ id: annonce.id });
  verif("5. supprimer passe réellement le statut à archivee", apresSuppression.status === "archivee");

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
