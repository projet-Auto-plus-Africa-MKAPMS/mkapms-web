/**
 * trpc.annonces.get n'avait aucun filtre d'accessibilité : connaître ou
 * deviner l'id d'une annonce brouillon, refusée, archivée, vendue ou louée
 * suffisait à la consulter intégralement, quel que soit son vrai statut —
 * un problème direct pour les écrans produit (Vehicule.tsx, ProduitLocation.tsx,
 * CentreVisiteVehicule.tsx, CentreEssaiRoutier.tsx) qui ouvraient une fiche
 * par id sans jamais vérifier qu'elle était réellement accessible au public.
 * Le propriétaire garde l'accès à sa propre fiche non publiée pour pouvoir
 * la modifier/republier (ModificationAnnonce.tsx, déjà testé ailleurs).
 * Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/annonces-get-eligibilite.test.ts`
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

const PROPRIETAIRE = 900992;
const VISITEUR = 900991;
const ADMIN = 900990;
const PREFIX = "TEST-ANNONCEGET-";

const callerAnon = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: null });
const callerVisiteur = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VISITEUR, role: "user", email: "visiteur-annonceget@mkapms.local" } });
const callerProprietaire = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: PROPRIETAIRE, role: "user", email: "proprietaire-annonceget@mkapms.local" } });
const callerAdmin = annoncesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ADMIN, role: "super_admin", email: "admin-annonceget@mkapms.local" } });

async function nettoyer() {
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Brouillon`, `${PREFIX}Publiee`]));
  await db.delete(users).where(inArray(users.id, [PROPRIETAIRE, VISITEUR, ADMIN]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values([
    { id: PROPRIETAIRE, email: "proprietaire-test-annonceget@mkapms.local", name: "Propriétaire Test" },
    { id: VISITEUR, email: "visiteur-test-annonceget@mkapms.local", name: "Visiteur Test" },
    { id: ADMIN, email: "admin-test-annonceget@mkapms.local", name: "Admin Test" },
  ]);

  const [brouillon] = await db.insert(annonces).values({ ownerId: PROPRIETAIRE, titre: `${PREFIX}Brouillon`, marque: "Renault", modele: "Clio", status: "brouillon" }).returning();
  const [publiee] = await db.insert(annonces).values({ ownerId: PROPRIETAIRE, titre: `${PREFIX}Publiee`, marque: "Renault", modele: "Megane", status: "publiee" }).returning();

  // ── 1. Un visiteur anonyme ne peut jamais ouvrir un brouillon par id ──
  await assert.rejects(() => callerAnon.get({ id: brouillon.id }), "1. un anonyme ne voit pas un brouillon");
  ok++; total++;

  // ── 2. Un autre utilisateur connecté (ni propriétaire, ni admin) ne le peut pas non plus ──
  await assert.rejects(() => callerVisiteur.get({ id: brouillon.id }), "2. un visiteur connecté sans lien ne voit pas un brouillon d'un tiers");
  ok++; total++;

  // ── 3. Le propriétaire voit bien sa propre fiche non publiée (pour la modifier/republier) ──
  const vuParProprietaire = await callerProprietaire.get({ id: brouillon.id });
  verif("3. le propriétaire voit bien son propre brouillon", vuParProprietaire.id === brouillon.id);

  // ── 4. Un admin voit aussi n'importe quelle fiche, quel que soit son statut ──
  const vuParAdmin = await callerAdmin.get({ id: brouillon.id });
  verif("4. un admin voit un brouillon d'un tiers", vuParAdmin.id === brouillon.id);

  // ── 5. Une annonce réellement publiée reste visible par n'importe qui (aucune régression) ──
  const vuParAnonyme = await callerAnon.get({ id: publiee.id });
  verif("5. une annonce publiée reste visible par un anonyme (aucune régression)", vuParAnonyme.id === publiee.id);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
