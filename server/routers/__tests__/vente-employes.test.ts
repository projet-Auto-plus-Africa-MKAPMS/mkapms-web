/**
 * Équipe Vente + Droits d'accès (client/src/pages/vente/GestionEmployes.tsx
 * et DroitsAcces.tsx). Base de données réelle.
 *
 * Corrige une fabrication réelle : GestionEmployes.tsx affichait "Jean
 * Dupont"/"Marie Curie" codés en dur, et DroitsAcces.tsx affichait un
 * employé fictif ("Commercial — Jean D.") avec des cases à cocher qui ne
 * persistaient nulle part. Ce test prouve que chaque vendeur ne voit et ne
 * modifie QUE sa propre équipe et ses propres droits d'accès, jamais ceux
 * d'un autre vendeur.
 *
 * Lancement : `npx tsx server/routers/__tests__/vente-employes.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { venteEmployes } from "../../schema.js";
import { proRouter } from "../pro.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR_A = 900801;
const VENDEUR_B = 900802;

const callerA = proRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR_A, role: "pro", email: "vendeur-a-emp@mkapms.local" } });
const callerB = proRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR_B, role: "pro", email: "vendeur-b-emp@mkapms.local" } });

async function nettoyer() {
  await db.delete(venteEmployes).where(inArray(venteEmployes.userId, [VENDEUR_A, VENDEUR_B]));
}

async function main() {
  await nettoyer();

  // ── 1. Ajout réel, permissions vides par défaut (jamais un accès accordé sans action explicite) ──
  const emp = await callerA.venteEmployeAjouter({ nom: "Collaborateur Test A", poste: "Commercial", email: "collab-a@test.local" });
  verif("1. le collaborateur créé porte les vraies données saisies", emp.nom === "Collaborateur Test A" && emp.poste === "Commercial");
  verif("1. aucune permission n'est accordée par défaut", Object.keys(emp.permissions ?? {}).length === 0);
  verif("1. actif par défaut", emp.actif === true);

  // ── 2. Chaque vendeur ne voit QUE sa propre équipe ──
  await callerB.venteEmployeAjouter({ nom: "Collaborateur Test B" });
  const equipeA = await callerA.venteEmployesListe();
  verif("2. le vendeur A voit son propre collaborateur", equipeA.some((e) => e.id === emp.id));
  verif("2. le vendeur A ne voit jamais l'équipe du vendeur B", !equipeA.some((e) => e.nom === "Collaborateur Test B"));

  // ── 3. Un vendeur ne peut jamais consulter ou modifier le collaborateur d'un autre ──
  const equipeB = await callerB.venteEmployesListe();
  const empDeB = equipeB.find((e) => e.nom === "Collaborateur Test B")!;
  await assert.rejects(() => callerA.venteEmployeDetail({ id: empDeB.id }), /introuvable/, "3a. lire le collaborateur d'un autre vendeur est refusé");
  ok++; total++;
  await assert.rejects(
    () => callerA.venteEmployePermissionsModifier({ id: empDeB.id, permissions: { Véhicules: true } }),
    /introuvable/,
    "3b. modifier les droits du collaborateur d'un autre vendeur est refusé",
  );
  ok++; total++;
  const [empDeBIntact] = await db.select().from(venteEmployes).where(eq(venteEmployes.id, empDeB.id));
  verif("3c. les droits du collaborateur du vendeur B restent vides malgré la tentative", Object.keys(empDeBIntact.permissions ?? {}).length === 0);

  // ── 4. Le propriétaire peut réellement gérer les droits de son propre collaborateur ──
  const misAJour = await callerA.venteEmployePermissionsModifier({ id: emp.id, permissions: { Véhicules: true, Paiements: false } });
  verif("4. les droits sont réellement enregistrés", misAJour.permissions?.Véhicules === true && misAJour.permissions?.Paiements === false);
  const relu = await callerA.venteEmployeDetail({ id: emp.id });
  verif("4. la relecture confirme la persistance en base", relu.permissions?.Véhicules === true);

  // ── 5. Désactiver un collaborateur fonctionne réellement ──
  const desactive = await callerA.venteEmployeModifier({ id: emp.id, actif: false });
  verif("5. le collaborateur est réellement désactivé", desactive.actif === false);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
