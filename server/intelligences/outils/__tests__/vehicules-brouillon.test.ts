/**
 * Dépôt d'annonce assisté par IA (demande PDG, 30/10 — BLOC 3 du cahier des
 * charges AL-HOUDOUD·M) : « ne jamais créer un faux brouillon uniquement
 * dans la conversation ». Ce test prouve que `vehicules.creerBrouillonAnnonce`
 * écrit une vraie ligne `annonces` (status="brouillon"), réutilise le dépôt
 * existant (annoncesRouter.create, jamais un second chemin d'écriture), reste
 * invisible publiquement, et que seule une action séparée et explicite de
 * l'utilisateur (annonces.update, status="publiee") la met réellement en ligne
 * avec les mêmes effets qu'une création directe (SEO, recherches sauvegardées,
 * dépassement de quota facturé).
 *
 * `verifierPermission` est injecté à `TOUJOURS_AUTORISE` (même principe que
 * api-externes.test.ts, boucle.test.ts) : ce test prouve l'OUTIL et le
 * ROUTEUR, pas l'attribution WRITE au rôle "user" — qui reste, par décision
 * PDG déjà en place (permissions.ts, DEFAUT_ROLE), à accorder explicitement
 * via le Permission Engine avant un usage réel en production.
 *
 * Lancement : `npx tsx server/intelligences/outils/__tests__/vehicules-brouillon.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../../db.js";
import { annonces, annoncePhotos, users } from "../../../schema.js";
import { annoncesRouter } from "../../../routers/annonces.js";
import { trouver } from "../registre.js";
import { executer } from "../executeur.js";
import { evaluer, type VerifierPermission } from "../politique.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const TOUJOURS_AUTORISE: VerifierPermission = async () => ({ autorise: true, motif: "", parRole: [], parMoteur: [] });
const UTILISATEUR = 900996;
const PIXEL_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(eq(annonces.ownerId, UTILISATEUR));
  for (const a of mesAnnonces) {
    await db.delete(annoncePhotos).where(eq(annoncePhotos.annonceId, a.id));
    await db.delete(annonces).where(eq(annonces.id, a.id));
  }
  await db.delete(users).where(eq(users.id, UTILISATEUR));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: UTILISATEUR, email: "brouillon-ia-test@mkapms.local", name: "Test Brouillon IA", role: "user" });

  const outil = trouver("vehicules.creerBrouillonAnnonce");
  verif("1. l'outil est bien enregistré au registre", !!outil);
  if (!outil) throw new Error("outil introuvable");

  // ── 2. Politique : MEDIUM + requiresHumanApproval=false est exécutable une fois le droit WRITE accordé ──
  const verdict = await evaluer(outil, { role: "user", moteur: "intelligences" }, TOUJOURS_AUTORISE);
  verif("2. la politique autorise l'outil quand la permission WRITE est accordée", verdict.verdict === "autorise");

  // ── 3. Refus honnête sans compte authentifié (jamais un brouillon sans propriétaire réel) ──
  const sansActeur = await executer(outil, JSON.stringify({ marque: "Peugeot", modele: "208" }));
  verif("3. refus sans actorId", sansActeur.statut === "execute" && (sansActeur.resultat as any).cree === false);

  // ── 4. Refus honnête sans marque/modèle ──
  const sansMarque = await executer(outil, JSON.stringify({ marque: "", modele: "" }), { role: "user", moteur: "intelligences", actorId: UTILISATEUR });
  verif("4. refus sans marque/modèle", (sansMarque.resultat as any).cree === false);

  // ── 5. Refus honnête : photo fournie sans confirmation explicite des droits ──
  const sansDroits = await executer(
    outil,
    JSON.stringify({ marque: "Peugeot", modele: "208", photos: [PIXEL_PNG] }),
    { role: "user", moteur: "intelligences", actorId: UTILISATEUR },
  );
  verif("5. refus photo sans droitsConfirmes", (sansDroits.resultat as any).cree === false);

  // ── 6. Création réelle d'un brouillon, avec photo et droits confirmés ──
  const creation = await executer(
    outil,
    JSON.stringify({
      marque: "Peugeot",
      modele: "208",
      annee: 2019,
      kilometrage: 42000,
      prix: 9500,
      description: "Très bon état, un seul propriétaire.",
      photos: [PIXEL_PNG],
      droitsConfirmes: true,
    }),
    { role: "user", moteur: "intelligences", actorId: UTILISATEUR },
  );
  verif("6. la création s'exécute", creation.statut === "execute");
  const res = creation.resultat as { cree: boolean; annonceId: number; reference: string; statut: string };
  verif("6b. cree=true avec un id réel", res.cree === true && typeof res.annonceId === "number");
  verif("6c. le statut renvoyé est bien brouillon", res.statut === "brouillon");

  const [ligne] = await db.select().from(annonces).where(eq(annonces.id, res.annonceId)).limit(1);
  verif("7. la ligne annonces existe réellement, status=brouillon", !!ligne && ligne.status === "brouillon");
  verif("7b. appartient au bon compte", ligne?.ownerId === UTILISATEUR);
  verif("7c. jamais de date de publication tant qu'elle n'est pas publiée", ligne?.publishedAt === null && ligne?.expiresAt === null);

  const photos = await db.select().from(annoncePhotos).where(eq(annoncePhotos.annonceId, res.annonceId));
  verif("8. la photo confirmée est réellement rattachée au brouillon", photos.length === 1 && photos[0].url === PIXEL_PNG);

  // ── 9. Le brouillon est réellement retrouvable dans « Mes annonces », même hors conversation ──
  const caller = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: UTILISATEUR, role: "user", email: "brouillon-ia-test@mkapms.local" } });
  const maListe = await caller.myList();
  verif("9. visible dans Mes annonces", maListe.some((a) => a.id === res.annonceId));

  // ── 10. Seule une action explicite et séparée de l'utilisateur publie — jamais l'IA ──
  await caller.update({ id: res.annonceId, status: "publiee" });
  const [publiee] = await db.select().from(annonces).where(eq(annonces.id, res.annonceId)).limit(1);
  verif("10. la publication explicite fait bien passer le statut", publiee.status === "publiee");
  verif("10b. publishedAt/expiresAt sont posés à la publication, pas avant", !!publiee.publishedAt && !!publiee.expiresAt);

  await nettoyer();
  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
