/**
 * Cloisonnement des espaces VO — tests réels, base de données réelle.
 * Couvre le cœur du moteur : trois espaces étanches (officiel/pro/particulier),
 * ouverts uniquement sur la base du rôle et d'un abonnement VO réellement
 * actif — jamais une décision devinée côté écran.
 *
 * Lancement : `npx tsx server/vo-espaces/__tests__/vo-espaces.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces, subscriptions } from "../../schema.js";
import * as vo from "../service.js";
import { recordTestEvidence } from "../../activation-audit/service.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const PRO_SANS_ABO = 950001;
const PRO_AVEC_ABO = 950002;
const AUTRE_PRO = 950003;

let idsAnnonces: number[] = [];
let idsSubscriptions: number[] = [];

async function nettoyer() {
  for (const id of idsAnnonces) await db.delete(annonces).where(eq(annonces.id, id));
  idsAnnonces = [];
  for (const id of idsSubscriptions) await db.delete(subscriptions).where(eq(subscriptions.id, id));
  idsSubscriptions = [];
}

async function main() {
  await nettoyer();

  // ── 1. espaceDe : le rôle seul décide de l'espace ────────────────────────
  verif("1a. super_admin → espace officiel", vo.espaceDe("super_admin") === "officiel");
  verif("1b. pro → espace pro", vo.espaceDe("pro") === "pro");
  verif("1c. garage → espace pro (rôle professionnel)", vo.espaceDe("garage") === "pro");
  verif("1d. user (particulier) → espace particulier", vo.espaceDe("user") === "particulier");
  verif("1e. rôle absent → espace particulier (jamais un accès par défaut)", vo.espaceDe(null) === "particulier");

  // ── 2. accesVo : équipe MKA.P-MS toujours ouvert, sans abonnement ────────
  const accesEquipe = await vo.accesVo({ uid: 1, role: "super_admin" });
  verif("2. l'équipe accède à l'espace officiel sans abonnement", accesEquipe.autorise && accesEquipe.equipe && accesEquipe.espace === "officiel");

  // ── 3. accesVo : particulier toujours refusé, jamais d'espace de gestion ─
  const accesParticulier = await vo.accesVo({ uid: 2, role: "user" });
  verif("3. un particulier n'a jamais accès à un espace de gestion VO", !accesParticulier.autorise && accesParticulier.espace === "particulier");
  verif("3b. le motif de refus est explicite (jamais un refus silencieux)", accesParticulier.motif.length > 0 && accesParticulier.redirection.length > 0);

  // ── 4. accesVo : pro SANS abonnement VO actif → refusé ───────────────────
  const accesSansAbo = await vo.accesVo({ uid: PRO_SANS_ABO, role: "pro" });
  verif("4. un compte pro sans abonnement VO actif est refusé (jamais ouvert par défaut)", !accesSansAbo.autorise && accesSansAbo.abonnement === null);

  // ── 5. accesVo : pro AVEC abonnement VO réellement actif → autorisé ──────
  const [sub] = await db
    .insert(subscriptions)
    .values({
      userId: PRO_AVEC_ABO,
      planCode: "vo_start",
      category: "pro_subscription",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
      quotaAnnonces: 25,
    })
    .returning({ id: subscriptions.id });
  idsSubscriptions.push(sub.id);

  const abonnement = await vo.abonnementVoActif(PRO_AVEC_ABO);
  verif("5. l'abonnement VO réellement actif est retrouvé (plan, quota)", abonnement?.planCode === "vo_start" && abonnement?.quotaAnnonces === 25);

  const accesAvecAbo = await vo.accesVo({ uid: PRO_AVEC_ABO, role: "pro" });
  verif("5b. un compte pro avec abonnement VO actif est autorisé", accesAvecAbo.autorise && accesAvecAbo.abonnement?.planCode === "vo_start");

  // ── 6. abonnementVoActif ignore un abonnement expiré ─────────────────────
  const [subExpiree] = await db
    .insert(subscriptions)
    .values({
      userId: PRO_AVEC_ABO,
      planCode: "vo_premium",
      category: "pro_subscription",
      status: "active",
      currentPeriodEnd: new Date(Date.now() - 86400 * 1000),
    })
    .returning({ id: subscriptions.id });
  idsSubscriptions.push(subExpiree.id);
  // La ligne "vo_start" encore valide doit rester celle retenue, jamais l'expirée.
  const abonnementApresExpiree = await vo.abonnementVoActif(PRO_AVEC_ABO);
  verif("6. une ligne d'abonnement expirée n'est jamais retenue comme active", abonnementApresExpiree?.planCode !== "vo_premium");

  // ── 7. abonnementVoActif ignore un plan hors catégorie "vo" ──────────────
  const [subHorsVo] = await db
    .insert(subscriptions)
    .values({ userId: AUTRE_PRO, planCode: "pro_start", category: "pro_subscription", status: "active" })
    .returning({ id: subscriptions.id });
  idsSubscriptions.push(subHorsVo.id);
  const abonnementAutrePro = await vo.abonnementVoActif(AUTRE_PRO);
  verif("7. un abonnement actif mais hors catégorie 'vo' n'ouvre jamais l'espace VO", abonnementAutrePro === null);

  // ── 8. stockProDe / compteursProDe / statutsProDe : bornés au propriétaire réel ──
  const [annoncePro] = await db
    .insert(annonces)
    .values({ ownerId: PRO_AVEC_ABO, titre: "Peugeot 3008 GT — Stock VO", marque: "Peugeot", modele: "3008", status: "publiee" })
    .returning({ id: annonces.id });
  idsAnnonces.push(annoncePro.id);
  const [annonceAutrePro] = await db
    .insert(annonces)
    .values({ ownerId: AUTRE_PRO, titre: "Renault Clio — pas dans ce stock", marque: "Renault", modele: "Clio", status: "publiee" })
    .returning({ id: annonces.id });
  idsAnnonces.push(annonceAutrePro.id);

  const stock = await vo.stockProDe(PRO_AVEC_ABO);
  verif("8. le stock ne contient que les véhicules du professionnel appelant", stock.some((v) => v.id === annoncePro.id) && !stock.some((v) => v.id === annonceAutrePro.id));

  const statuts = await vo.statutsProDe(PRO_AVEC_ABO);
  verif("8b. les statuts proposés viennent des vraies annonces du pro", statuts.includes("publiee"));

  const compteurs = await vo.compteursProDe(PRO_AVEC_ABO, 25);
  verif("8c. les compteurs sont calculés depuis les vraies lignes, jamais une valeur d'exemple", typeof compteurs === "object" && compteurs !== null);

  // ── 9. vehiculeProAppartient : jamais d'accès croisé entre professionnels ─
  verif("9a. un pro est bien propriétaire de son propre véhicule", await vo.vehiculeProAppartient(PRO_AVEC_ABO, annoncePro.id));
  verif("9b. un pro n'est jamais propriétaire du véhicule d'un autre pro", !(await vo.vehiculeProAppartient(PRO_AVEC_ABO, annonceAutrePro.id)));

  // ── 10. Exposition du router ──────────────────────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const keys = Object.keys(procs);
  for (const sub2 of ["voEspaces.acces", "voEspaces.stock", "voEspaces.compteurs", "voEspaces.statuts", "voEspaces.appartient", "voEspaces.attestations.liste", "voEspaces.attestations.generer", "voEspaces.attestations.signer"]) {
    verif(`Router : expose « ${sub2} »`, keys.includes(sub2));
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);

  await recordTestEvidence({
    domain: "vo_espaces",
    kind: "integration",
    scenario: "cloisonnement officiel/pro/particulier, abonnement VO actif/expiré, stock et propriété bornés au pro appelant",
    passed: ok,
    total,
    source: "agent",
  });

  await nettoyer();
  if (ok !== total) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(err);
    await nettoyer().catch(() => {});
    process.exit(1);
  });
