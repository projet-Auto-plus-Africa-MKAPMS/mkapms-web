/**
 * Partner Engine (server/partner-engine/) — candidature publique.
 * Base de données réelle.
 *
 * Aucune suite n'existait pour ce moteur alors qu'il porte une entrée
 * commerciale publique réelle (« Devenir partenaire »). Ce test couvre en
 * particulier l'usage introduit par DevenirInvestisseur.tsx : une
 * candidature investisseur passe par le même moteur que les candidatures
 * partenaires (profession="investisseur"), jamais un second système de
 * candidature dupliqué pour l'investisseur.
 *
 * Lancement : `npx tsx server/partner-engine/__tests__/partner-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq, like } from "drizzle-orm";
import { db } from "../../db.js";
import { partnerApplications } from "../schema.js";
import { partnerEngineRouter } from "../index.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const NOM_PREFIX = "TEST-PARTNER-ENGINE-";
const publicCaller = partnerEngineRouter.createCaller({ req: {} as never, res: {} as never, user: null });

async function nettoyer() {
  await db.delete(partnerApplications).where(like(partnerApplications.companyName, `${NOM_PREFIX}%`));
}

async function main() {
  await nettoyer();

  // ── 1. Candidature « Devenir partenaire » classique (garage) ──
  const candidatureGarage = await publicCaller.candidater({
    companyName: `${NOM_PREFIX}Garage Test`,
    profession: "garage",
    countryCode: "FR",
    city: "Lyon",
    zoneRadiusKm: 30,
    services: [],
    contactEmail: "garage-test@mkapms.local",
  });
  verif("candidater() sans compte fonctionne (entrée commerciale publique)", !!candidatureGarage.reference);
  verif("le statut initial est « recue », jamais accordé automatiquement", candidatureGarage.status === "recue");

  const [ligneGarage] = await db
    .select()
    .from(partnerApplications)
    .where(eq(partnerApplications.reference, candidatureGarage.reference));
  verif("sans `details` fourni, la colonne reste null — jamais un objet vide fabriqué", ligneGarage?.details === null);

  // ── 2. Candidature investisseur (DevenirInvestisseur.tsx) : même moteur, jamais un second système ──
  // Les champs `details` reproduisent exactement ce que le formulaire public envoie
  // (montant envisagé, univers d'intérêt, profil, durée) — la direction doit les
  // retrouver tels quels dans la fiche de candidature.
  const candidatureInvestisseur = await publicCaller.candidater({
    companyName: `${NOM_PREFIX}Investisseur Test`,
    profession: "investisseur",
    countryCode: "FR",
    services: [],
    contactName: "Test Investisseur",
    contactEmail: "investisseur-test@mkapms.local",
    message: "Intéressé par l'univers vente_pro.",
    details: {
      investorType: "OPERATOR_INVESTOR",
      universesInteret: ["vente_pro", "garage"],
      montantEnvisageEur: 25000,
      horizonMois: 24,
    },
  });
  verif("candidater() accepte profession=investisseur sans champ zone/services obligatoire", !!candidatureInvestisseur.reference);
  verif(
    "le message de suite est honnête : rien n'est accordé automatiquement",
    /examinée/i.test(candidatureInvestisseur.suite) && /accordé automatiquement/i.test(candidatureInvestisseur.suite),
  );

  const [ligneInvestisseur] = await db
    .select()
    .from(partnerApplications)
    .where(eq(partnerApplications.reference, candidatureInvestisseur.reference));
  verif("la candidature investisseur est réellement persistée avec profession=investisseur", ligneInvestisseur?.profession === "investisseur");
  verif("aucun compte requis : userId reste null pour un visiteur anonyme", ligneInvestisseur?.userId === null);
  verif(
    "le message libre du candidat est bien persisté (visible dans la fiche admin)",
    ligneInvestisseur?.message === "Intéressé par l'univers vente_pro.",
  );
  const details = ligneInvestisseur?.details as Record<string, unknown> | null;
  verif("les détails investisseur (montant, univers, profil, durée) sont persistés tels quels", !!details);
  verif("details.investorType round-trip exact", details?.investorType === "OPERATOR_INVESTOR");
  verif(
    "details.universesInteret round-trip exact (tableau)",
    Array.isArray(details?.universesInteret) &&
      (details!.universesInteret as unknown[]).length === 2 &&
      (details!.universesInteret as unknown[])[0] === "vente_pro",
  );
  verif("details.montantEnvisageEur round-trip exact (nombre, pas une chaîne)", details?.montantEnvisageEur === 25000);
  verif("details.horizonMois round-trip exact", details?.horizonMois === 24);

  // listApplications() est ce que lit la fiche admin (PartenairesPilotage.tsx) : le
  // `select()` générique doit renvoyer message et details sans colonne oubliée.
  const listeAdmin = await publicCaller.applications({}).catch(() => null);
  verif(
    "listApplications() est réservé à l'administration, jamais ouvert au public",
    listeAdmin === null,
  );

  // ── 3. Pays fermé au Country OS : refusé, jamais une candidature ouverte par défaut ──
  let refusePaysFerme = false;
  try {
    await publicCaller.candidater({
      companyName: `${NOM_PREFIX}Pays Fermé`,
      profession: "investisseur",
      countryCode: "ZZ",
      services: [],
    });
  } catch (e) {
    refusePaysFerme = e instanceof Error && /non ouvert/i.test(e.message);
  }
  verif("candidater() refuse un pays non ouvert dans le Country OS", refusePaysFerme);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
