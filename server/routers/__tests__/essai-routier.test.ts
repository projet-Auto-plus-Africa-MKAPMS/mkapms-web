/**
 * Essai routier (client/src/pages/vente/CentreEssaiRoutier.tsx). Base de
 * données réelle.
 *
 * Corrige un écran orphelin : /vente/essai n'acceptait aucun identifiant de
 * véhicule, n'était référencé nulle part dans l'application, et était
 * verrouillé derrière la porte VO professionnelle alors qu'il s'agit d'une
 * action acheteur. Réutilise exactement les deux mêmes moteurs déjà réels
 * et déjà testés ailleurs (reservations.demanderVisite, tâche déjà couverte
 * par reservations-visite.test.ts ; kyc.myProfile, déjà utilisé par
 * ControleDocuments.tsx) — aucun second moteur créé. Ce test couvre
 * spécifiquement ce que ce lot ajoute : le mode "sur_place" (un essai
 * routier exige une présence physique, jamais de visio) et la lecture des
 * documents KYC réels (permis_conduire / piece_identite) qui remplacent la
 * checklist inventée de l'ancienne version.
 *
 * Lancement : `npx tsx server/routers/__tests__/essai-routier.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces, bookings, users, kycProfiles, kycDocuments } from "../../schema.js";
import { reservationsRouter } from "../reservations.js";
import { kycRouter } from "../kyc.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR = 900903;
const ACHETEUR = 900904;
const PREFIX = "TEST-ESSAI-";

const callerAcheteur = reservationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ACHETEUR, role: "user", email: "acheteur-essai@mkapms.local" } });
const callerKyc = kycRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ACHETEUR, role: "user", email: "acheteur-essai@mkapms.local" } });

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(eq(annonces.ownerId, VENDEUR));
  const ids = mesAnnonces.map((a) => a.id);
  if (ids.length) {
    await db.delete(bookings).where(inArray(bookings.vehicleId, ids));
    await db.delete(annonces).where(inArray(annonces.id, ids));
  }
  const profils = await db.select({ id: kycProfiles.id }).from(kycProfiles).where(eq(kycProfiles.userId, ACHETEUR));
  const profilIds = profils.map((p) => p.id);
  if (profilIds.length) {
    await db.delete(kycDocuments).where(inArray(kycDocuments.profileId, profilIds));
    await db.delete(kycProfiles).where(inArray(kycProfiles.id, profilIds));
  }
  await db.delete(users).where(eq(users.id, ACHETEUR));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: ACHETEUR, email: "acheteur-test-essai@mkapms.local", name: "Acheteur Essai Test" });
  const [annonce] = await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Peugeot 208`, marque: "Peugeot", modele: "208" }).returning();

  // ── 1. Avant tout document KYC : les deux conditions sont honnêtement à faux ──
  const profilVide = await callerKyc.myProfile();
  verif("1. sans document envoyé, aucun permis détecté (jamais 'ok' par défaut)", !profilVide.documents.some((d) => d.docType === "permis_conduire"));
  verif("1. sans document envoyé, aucune pièce d'identité détectée", !profilVide.documents.some((d) => d.docType === "piece_identite"));

  // ── 2. Une fois le permis envoyé via le vrai moteur KYC, la condition passe à vrai ──
  await callerKyc.submitDocuments({ documents: [{ docType: "permis_conduire", fileUrl: "https://files.test/permis.pdf", fileName: "permis.pdf", mimeType: "application/pdf", sizeBytes: 1000 }] });
  const profilAvecPermis = await callerKyc.myProfile();
  verif("2. le permis réellement envoyé est bien détecté", profilAvecPermis.documents.some((d) => d.docType === "permis_conduire"));

  // ── 3. La demande d'essai routier crée une vraie réservation test_drive en mode sur_place ──
  const essai = await callerAcheteur.demanderVisite({ annonceId: annonce.id, mode: "sur_place", date: "2026-07-01", creneau: "10:00" });
  verif("3. la réservation créée porte le vrai type test_drive", essai.type === "test_drive");
  verif("3. le message décrit bien le mode sur_place (jamais visio pour un essai routier)", essai.message === "Visite sur place — créneau souhaité : 10:00");

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
