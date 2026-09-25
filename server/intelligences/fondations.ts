/**
 * MKA.P-MS AI — fondations des mémoires propres (point 134).
 *
 * `entreprise`, `decisions` et `apprentissage` sont des catégories détenues
 * par Intelligences elle-même (voir memoire.ts, CATEGORIES) : sans code qui
 * appelle `ecrire()` pour elles, elles restent vides pour toujours, quel que
 * soit le travail réellement accompli ailleurs. Ce fichier est leur source
 * de départ, sur le même principe que livraisons.ts : au démarrage, les
 * entrées absentes sont écrites une fois, jamais réécrites ensuite.
 *
 * `pays et solutions` (résilience) n'est PAS une catégorie propre — elle est
 * fédérée depuis `rs_pipeline_runs` (server/resilience). `startPipeline()`/
 * `recordPipelineStep()` existent depuis la conception du moteur mais
 * n'avaient jamais été appelés nulle part dans le dépôt : c'est pour ça que
 * la mémoire « erreurs et solutions » restait à zéro, pas parce qu'aucun
 * travail n'avait eu lieu. `seedPipelines()` y consigne, une fois, les
 * passages réellement vérifiés de cette session (#65, #66) — vérifiables sur
 * GitHub et sur Railway, jamais inventés.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { ecrire } from "./memoire.js";
import { inMemoire } from "./schema.js";
import { startPipeline, recordPipelineStep } from "../resilience/service.js";
import { rsPipelineRuns } from "../resilience/schema.js";

interface Fondation {
  categorie: "entreprise" | "decisions" | "apprentissage";
  cle: string;
  titre: string;
  contenu: string;
  liens?: Record<string, string>;
}

export const FONDATIONS: Fondation[] = [
  // ── Mémoire entreprise — décisions de cadrage, règles maison, positionnement ──
  {
    categorie: "entreprise",
    cle: "isolation-shop-plateforme-principale",
    titre: "SHOP et plateforme principale : deux dépôts et déploiements strictement isolés",
    contenu:
      "mkapms-shop (projet Railway dédié, service shop-app) est un dépôt indépendant qui ne se connecte jamais aux moteurs centraux de mkapms-web (Country/Currency/Payment/Ledger/Identity/Documents/Notifications) : ceux-ci restent des contrats dormants côté SHOP jusqu'à ce que SHOP construise sa propre implémentation. Une dépendance centrale manquante se documente (docs/GAP-AUDIT.md), elle ne se contourne jamais par un raccord vers le Core de la plateforme principale. Confirmé par lecture directe de mkapms-shop/AGENTS.md le 25/09/2026, avant toute correction touchant les deux plateformes.",
    liens: { doc: "mkapms-shop/AGENTS.md" },
  },
  {
    categorie: "entreprise",
    cle: "vehicules-exclus-merchant-center",
    titre: "Un véhicule motorisé n'est jamais poussé vers les fiches gratuites Merchant Center",
    contenu:
      "Google exclut les véhicules motorisés (voiture, moto, scooter, utilitaire, camion, quad, jetski, bateau) des fiches gratuites Merchant Center/Shopping. Le Google Product Engine (server/product-engine/eligibility.ts, CATEGORIES_EXCLUES_MERCHANT) le documente noir sur blanc au lieu de tenter un contournement qui ne produirait que des rejets : leur visibilité passe par le tuyau annonces (page indexable, données structurées de véhicule, Vehicle Ads si le pays y est éligible), jamais par le catalogue produits.",
    liens: { moteur: "product_engine" },
  },
  {
    categorie: "entreprise",
    cle: "architecture-mondiale-obligatoire",
    titre: "Toute architecture Google/SEO/campagnes doit être mondiale dès l'origine",
    contenu:
      "Correction de doctrine PDG v1.1 (mkapms-mos-architecture.md §12.1, 25/09/2026) : interdiction absolue de coder country=\"FR\" comme règle métier permanente dans l'architecture Google, SEO, publicité ou campagnes. La France peut être activée en premier dans certains produits Google, mais le moteur doit être conçu mondial dès le départ, avec un Country Capability Registry consulté à chaque décision de disponibilité — jamais une capacité Google inventée ou supposée.",
    liens: { doc: "mkapms-mos-architecture.md" },
  },

  // ── Mémoire décisions — ce qui a été tranché, par qui, quand, sur quel motif ──
  {
    categorie: "decisions",
    cle: "pdg-doctrine-mondiale-v1.1-25-09-2026",
    titre: "PDG, 25/09/2026 — architecture Google mondiale obligatoire + fin de « bloqué par validation externe » comme abandon",
    contenu:
      "Décidé par le PDG le 25/09/2026, consigné dans mkapms-mos-architecture.md v1.1 §12 : (1) aucune architecture Google/campagnes ne peut être conçue pour un seul pays ; (2) « bloqué par validation externe » n'autorise plus un agent à abandonner un lot incomplet — tout ce qui est sous contrôle technique doit être terminé, déployé, fusionné et vérifié avant de passer au lot suivant, l'attente externe étant alors documentée avec son propriétaire exact et sa condition de reprise (AWAITING_EXTERNAL_ACTIVATION), jamais comme une fin de tâche.",
    liens: { doc: "mkapms-mos-architecture.md" },
  },
  {
    categorie: "decisions",
    cle: "pdg-doctrine-shop-et-plateforme-25-09-2026",
    titre: "PDG, 25/09/2026 — la doctrine mondiale Google s'applique aux deux plateformes, sans connexion croisée",
    contenu:
      "Décidé par le PDG le 25/09/2026 : la correction de doctrine Google/campagnes concerne la plateforme principale (mkapms-web) ET la boutique (mkapms-shop), chacune avec son propre dépôt. Motif explicite du PDG : « chacun a son propre dépôt ». Appliquée en conséquence : mkapms-web reçoit le registre de capacités Google réel (PR #453) ; mkapms-shop reçoit la doctrine écrite pour son futur constructeur (PR #32), sans qu'aucun code ne relie les deux registres.",
    liens: { pr_web: "453", pr_shop: "32" },
  },
  {
    categorie: "decisions",
    cle: "pdg-verifier-deploiement-reel-avant-de-declarer-termine",
    titre: "PDG, 25/09/2026 — exige la vérification du déploiement réel, pas seulement la fusion GitHub",
    contenu:
      "Le PDG a signalé n'avoir vu aucun effet après une correction pourtant fusionnée, et a demandé explicitement de changer la méthode de travail si le problème persiste. Décision retenue : toute correction n'est déclarée « déployée » qu'après vérification directe de l'état du déploiement de production (Railway), jamais sur la seule base d'une fusion de pull request. Appliquée depuis pour chaque lot (#65, #66) : commit exact confirmé SUCCESS avant d'en informer le PDG.",
    liens: {},
  },

  // ── Mémoire apprentissage — expériences de mission : problème, diagnostic, solution, résultat ──
  {
    categorie: "apprentissage",
    cle: "lecon-country-fr-en-dur-product-engine",
    titre: "Un pays codé en dur dans un moteur Google reste invisible tant que personne ne va le chercher précisément",
    contenu:
      "Problème : le Google Product Engine écrivait pays=\"FR\"/langue=\"fr\" sur chaque fiche produit, quel que soit le pays réel de la boutique (parts_shops.country_code) ou du propriétaire (users.country/currency) — deux colonnes réelles, jamais consultées. Diagnostic : ce bug n'apparaissait dans aucun compteur ni tableau de bord existant, parce que rien ne mesurait la cohérence pays-source vs pays-fiche ; il a fallu l'auditer spécifiquement après la correction de doctrine sur l'architecture mondiale. Solution : lire le pays réel via une jointure, dériver la langue via le Country OS déjà construit. Résultat : test réel prouvant qu'une boutique allemande produit désormais une fiche pays=DE/langue=de. Leçon : une correction de doctrine sur un moteur ne suffit pas si le moteur voisin qui produit les objets envoyés continue de coder le même pays en dur ailleurs — auditer le chantier entier, pas seulement l'endroit signalé.",
    liens: { pr: "454", livraison: "product-engine-pays-langue-devise-jamais-en-dur" },
  },
  {
    categorie: "apprentissage",
    cle: "lecon-registre-pays-lui-meme-biaise",
    titre: "Un registre construit correctement peut quand même contenir une donnée restée uniformément française",
    contenu:
      "Problème : en construisant la dérivation de langue depuis le Country OS (langueDe()), découverte que country_countries.default_language avait été seedé à 'fr' pour les 20 pays sans exception, y compris l'Allemagne, l'Espagne, le Royaume-Uni et les pays arabophones. Diagnostic : le Country OS lui-même, bien que réel et testé, n'avait jamais été audité colonne par colonne pour ce biais précis. Solution : correction ciblée des 10 pays mono-langue nationale sans ambiguïté, sans toucher aux pays multilingues où le français reste plausible (choix éditorial évité). Résultat : la langue dérivée reflète désormais le pays réel pour ces 10 pays. Leçon : une donnée de référentiel censée varier par pays doit être vérifiée ligne par ligne avant d'être utilisée comme source de vérité par du nouveau code — un moteur bien conçu n'est pas automatiquement une donnée bien remplie.",
    liens: { pr: "454", livraison: "product-engine-pays-langue-devise-jamais-en-dur" },
  },
  {
    categorie: "apprentissage",
    cle: "lecon-erreur-sql-absorbee-indiscernable-dun-vrai-zero",
    titre: "Une erreur SQL absorbée en silence est indiscernable d'un vrai zéro",
    contenu:
      "Problème : le compteur « Véhicules » de CentreProduitsGoogle.tsx affichait toujours 0, quel que soit le nombre réel d'annonces publiées. Diagnostic : la requête interrogeait une colonne inexistante (statut au lieu de status) ; l'erreur SQL était absorbée par un bloc try/catch qui retombait sur 0 sans jamais rien signaler. Solution : remplacement du SQL brut par une requête drizzle typée, transformant une erreur de nom de colonne en échec de compilation plutôt qu'en échec silencieux de production. Résultat : le compteur reflète désormais les vraies annonces publiées, prouvé par test réel. Leçon : un bloc catch qui retombe sur une valeur par défaut sans journaliser l'erreur est la pire forme de fabrication involontaire — il ne ment pas activement, mais il rend un vrai zéro et un moteur cassé strictement indiscernables.",
    liens: { pr: "452", livraison: "product-engine-compteur-vehicules-colonne-inexistante" },
  },
];

async function seedFondation(f: Fondation): Promise<boolean> {
  const [existant] = await db
    .select({ id: inMemoire.id })
    .from(inMemoire)
    .where(and(eq(inMemoire.categorie, f.categorie), eq(inMemoire.cle, f.cle), eq(inMemoire.cycle, "actif")))
    .limit(1);
  if (existant) return false;

  await ecrire({
    categorie: f.categorie,
    cle: f.cle,
    titre: f.titre,
    contenu: f.contenu,
    liens: f.liens ?? {},
    source: "fondations",
  });
  return true;
}

export async function seedFondations(): Promise<{ nouvelles: number; total: number }> {
  let nouvelles = 0;
  for (const f of FONDATIONS) {
    if (await seedFondation(f)) nouvelles++;
  }
  return { nouvelles, total: FONDATIONS.length };
}

/**
 * Passages de pipeline (point 76) réellement vérifiés cette session, jamais
 * inventés : chaque étape correspond à ce qui a été fait pour de vrai
 * (branche, tests, CI, fusion, déploiement Railway confirmé) — les étapes
 * qui n'ont pas eu lieu (aperçu dédié, préproduction distincte : cette
 * plateforme n'a qu'un seul environnement Railway de production) ne sont
 * jamais déclarées franchies.
 */
interface PassagePipeline {
  originRef: string;
  title: string;
  rollbackPlan: string;
  etapes: { step: Parameters<typeof recordPipelineStep>[0]["step"]; detail: string }[];
}

const PASSAGES: PassagePipeline[] = [
  {
    originRef: "pr-453",
    title: "Country OS : registre de capacités Google par pays, jamais inventé (#65)",
    rollbackPlan:
      "Migration 0144 additive : DROP TABLE country_google_capabilities restaure l'état antérieur. Sinon, revert du commit de fusion (13f8aa2f) sur GitHub puis redéploiement Railway du commit précédent (a04ac7fc).",
    etapes: [
      { step: "instruction", detail: "PDG : correction de doctrine architecture mondiale Google, à appliquer d'abord côté fondation (Country OS)." },
      { step: "plan", detail: "Audit préalable de country-os/country-policy avant tout code, pour éviter de dupliquer un moteur existant." },
      { step: "branche", detail: "claude/test-network-connections-j6905r" },
      { step: "sandbox", detail: "Environnement de développement isolé, base de test locale distincte de la production." },
      { step: "code", detail: "country_google_capabilities + upsertGoogleCapabilities()/isGoogleCapabilityEligible() dans server/country-os/index.ts." },
      { step: "tests", detail: "server/country-os/__tests__/google-capabilities.test.ts — 11/11 assertions sur base réelle." },
      { step: "securite", detail: "Écriture réservée à pdgProcedure ; aucune donnée sensible ; refus explicite d'activer une capacité sans preuve sourcée." },
      { step: "non_regression", detail: "npx tsc --noEmit sans erreur nouvelle ; npm run build vert (client+server) ; inventaires régénérés." },
      { step: "validation", detail: "CI GitHub verte sur le commit exact dc32e62 ; PR #453." },
      { step: "production", detail: "Fusionné dans main (13f8aa2f), déployé sur Railway (mkapms-app/production)." },
      { step: "monitoring", detail: "railway deployment list confirme le statut SUCCESS pour le commit 13f8aa2f." },
    ],
  },
  {
    originRef: "pr-454",
    title: "Product Engine : pays/langue/devise réels, plus jamais FR/fr/EUR en dur (#66)",
    rollbackPlan:
      "Migrations 0145/0146 additives, réversibles par ré-application des anciens defaults/valeurs. Sinon, revert du commit de fusion (f6c31208) sur GitHub puis redéploiement Railway du commit précédent (13f8aa2f).",
    etapes: [
      { step: "instruction", detail: "Suite du chantier doctrine : auditer le Google Product Engine lui-même pour tout country=\"FR\" en dur restant." },
      { step: "plan", detail: "Audit de candidatsBoutique()/candidatsInventaire() avant correction, puis vérification ligne par ligne du seed Country OS." },
      { step: "branche", detail: "claude/test-network-connections-j6905r" },
      { step: "sandbox", detail: "Environnement de développement isolé, base de test locale distincte de la production." },
      { step: "code", detail: "Jointures parts_shops/users réelles, langueDe() via Country OS, suppression des defaults FR/fr/EUR (migration 0145), correction default_language (migration 0146)." },
      { step: "tests", detail: "server/product-engine/__tests__/no-hardcoded-country.test.ts — 4/4 assertions sur base réelle." },
      { step: "securite", detail: "Aucune donnée sensible ; correction purement structurelle des sources de pays/langue/devise." },
      { step: "non_regression", detail: "npx tsc --noEmit sans erreur nouvelle ; tests #65 (11/11) et fondation véhicules (6/6) rejoués sans régression ; npm run build vert." },
      { step: "validation", detail: "CI GitHub verte sur le commit exact 958346d ; PR #454." },
      { step: "production", detail: "Fusionné dans main (f6c31208), déployé sur Railway (mkapms-app/production)." },
      { step: "monitoring", detail: "railway deployment list confirme le statut SUCCESS pour le commit f6c31208." },
    ],
  },
];

async function seedPassage(p: PassagePipeline): Promise<boolean> {
  const [existant] = await db
    .select({ id: rsPipelineRuns.id })
    .from(rsPipelineRuns)
    .where(eq(rsPipelineRuns.originRef, p.originRef))
    .limit(1);
  if (existant) return false;

  const run = await startPipeline({
    origin: "agent_externe",
    originRef: p.originRef,
    title: p.title,
    riskLevel: 2,
    rollbackPlan: p.rollbackPlan,
  });
  for (const e of p.etapes) {
    await recordPipelineStep({ id: run.id, step: e.step, status: "ok", detail: e.detail });
  }
  return true;
}

export async function seedPipelines(): Promise<{ nouveaux: number; total: number }> {
  let nouveaux = 0;
  for (const p of PASSAGES) {
    if (await seedPassage(p)) nouveaux++;
  }
  return { nouveaux, total: PASSAGES.length };
}
