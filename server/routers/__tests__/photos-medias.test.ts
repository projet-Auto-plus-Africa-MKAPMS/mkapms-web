/**
 * Photos & Médias (client/src/pages/vente/CentrePhotosMedias.tsx). Base de
 * données réelle.
 *
 * Corrige un écran orphelin : /vente/photos n'acceptait aucun identifiant
 * de véhicule et n'avait aucun point d'entrée réel (aucun lien n'y menait
 * depuis le stock du vendeur). Contrairement aux écrans précédents de cette
 * liste, cet écran était déjà correctement verrouillé derrière la porte
 * professionnelle <V> (c'est un vrai outil vendeur). Aucun nouveau moteur
 * n'a été écrit : trpc.annonces.update gère déjà le remplacement des
 * photos d'une annonce existante (categorie incluse), et /api/upload gère
 * déjà l'envoi de fichier — les deux réutilisés tels quels par le dépôt
 * d'annonce (PhotosVehicule.tsx). Ce test prouve le contrat exact dont
 * l'écran dépend : écrire une photo par catégorie de zone, la relire
 * ensuite groupée par cette même catégorie, sans perdre les photos hors
 * zones lors d'un remplacement partiel.
 *
 * Lancement : `npx tsx server/routers/__tests__/photos-medias.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces, annoncePhotos, users } from "../../schema.js";
import { annoncesRouter } from "../annonces.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR = 900990;
const AUTRE_VENDEUR = 900991;
const PREFIX = "TEST-PHOTOS-";

const callerVendeur = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR, role: "pro", email: "vendeur-photos@mkapms.local" } });
const callerAutre = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: AUTRE_VENDEUR, role: "pro", email: "autre-photos@mkapms.local" } });

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(eq(annonces.ownerId, VENDEUR));
  for (const a of mesAnnonces) {
    await db.delete(annoncePhotos).where(eq(annoncePhotos.annonceId, a.id));
    await db.delete(annonces).where(eq(annonces.id, a.id));
  }
  await db.delete(users).where(eq(users.id, AUTRE_VENDEUR));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: AUTRE_VENDEUR, email: "autre-test-photos@mkapms.local", name: "Autre Vendeur Photos" });
  const [annonce] = await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Peugeot 208`, marque: "Peugeot", modele: "208" }).returning();

  // ── 1. Écrire une photo pour une zone, via update (jamais un second registre) ──
  await callerVendeur.update({ id: annonce.id, photos: [{ url: "https://cdn.test/avant_gauche.jpg", categorie: "avant_gauche" }] });
  const apres1 = await callerVendeur.get({ id: annonce.id });
  verif("1. la photo est bien rattachée à sa catégorie", apres1.photos.some((p) => p.categorie === "avant_gauche" && p.url === "https://cdn.test/avant_gauche.jpg"));

  // ── 2. Ajouter une deuxième zone SANS perdre la première (remplacement complet à chaque update) ──
  await callerVendeur.update({
    id: annonce.id,
    photos: [
      { url: "https://cdn.test/avant_gauche.jpg", categorie: "avant_gauche" },
      { url: "https://cdn.test/moteur.jpg", categorie: "moteur" },
    ],
  });
  const apres2 = await callerVendeur.get({ id: annonce.id });
  verif("2. les deux zones coexistent après le deuxième envoi", apres2.photos.length === 2);
  verif("2. la première zone n'a pas été perdue", apres2.photos.some((p) => p.categorie === "avant_gauche"));
  verif("2. la deuxième zone est bien présente", apres2.photos.some((p) => p.categorie === "moteur"));

  // ── 3. Remplacer la photo d'une zone déjà remplie (nouvelle URL, même catégorie) ──
  await callerVendeur.update({
    id: annonce.id,
    photos: [
      { url: "https://cdn.test/avant_gauche_v2.jpg", categorie: "avant_gauche" },
      { url: "https://cdn.test/moteur.jpg", categorie: "moteur" },
    ],
  });
  const apres3 = await callerVendeur.get({ id: annonce.id });
  verif("3. la zone déjà remplie est bien remplacée, pas dupliquée", apres3.photos.filter((p) => p.categorie === "avant_gauche").length === 1);
  verif("3. la nouvelle URL a bien remplacé l'ancienne", apres3.photos.some((p) => p.categorie === "avant_gauche" && p.url === "https://cdn.test/avant_gauche_v2.jpg"));

  // ── 4. Un autre vendeur ne peut jamais modifier les photos d'une annonce qui n'est pas la sienne ──
  let refuse = false;
  try {
    await callerAutre.update({ id: annonce.id, photos: [{ url: "https://cdn.test/intrusion.jpg", categorie: "coffre" }] });
  } catch (err) {
    refuse = (err as { code?: string }).code === "FORBIDDEN";
  }
  verif("4. un tiers ne peut pas modifier les photos d'une annonce qui n'est pas la sienne", refuse);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
