/**
 * Points 108-113 — catalogue des scénarios exécutés en continu.
 *
 * Un scénario ne renvoie jamais « OK » : il renvoie ce qu'il a **observé**.
 * Trois issues seulement :
 *  - `reussi` : l'observation correspond à l'attendu ;
 *  - `echec` : elle ne correspond pas — c'est un défaut réel, pas un avis ;
 *  - `ignore` : le prérequis manque (prestataire non configuré, aucune donnée
 *    à contrôler). Un scénario non exécutable n'est jamais compté comme réussi.
 */
import { MOTEURS_CENTRAUX_SCENARIOS } from "./scenarios-moteurs-centraux.js";
import { PARCOURS_SCENARIOS } from "./scenarios-parcours.js";
import { http, scalaire, compte, type Observation, type Scenario, type Statut } from "./helpers.js";

export type { Observation, Scenario, Statut };

const SCENARIOS_PLATEFORME: Scenario[] = [
  {
    id: "core.accueil",
    domaine: "core",
    label: "La page d'accueil publique répond",
    criticite: "critique",
    attendu: "GET / renvoie 200 et une page contenant le nom de la marque.",
    async run() {
      const r = await http("/");
      if (!r.ok) {
        return r.reseau
          ? { statut: "echec", observe: `Site injoignable : ${r.motif}` }
          : { statut: "ignore", observe: r.motif };
      }
      if (r.status !== 200) return { statut: "echec", observe: `HTTP ${r.status} reçu.` };
      const marque = /MKA/i.test(r.corps);
      return marque
        ? { statut: "reussi", observe: `HTTP 200, page servie (${r.corps.length} octets).` }
        : { statut: "echec", observe: "HTTP 200 mais la page ne contient pas le nom de la marque." };
    },
  },
  {
    id: "seo.sitemap",
    domaine: "seo",
    label: "Le sitemap est servi et référence des URLs",
    criticite: "critique",
    attendu: "GET /sitemap.xml renvoie 200 et contient au moins une balise <loc>.",
    async run() {
      const r = await http("/sitemap.xml");
      if (!r.ok) {
        return r.reseau
          ? { statut: "echec", observe: `Sitemap injoignable : ${r.motif}` }
          : { statut: "ignore", observe: r.motif };
      }
      if (r.status !== 200) return { statut: "echec", observe: `HTTP ${r.status} reçu.` };
      const n = (r.corps.match(/<loc>/g) ?? []).length;
      return n > 0
        ? { statut: "reussi", observe: `${n} entrée(s) déclarée(s) dans le sitemap.` }
        : { statut: "echec", observe: "Sitemap servi mais vide : rien n'est déclaré à Google." };
    },
  },
  {
    id: "seo.robots",
    domaine: "seo",
    label: "robots.txt n'interdit pas le site entier",
    criticite: "critique",
    attendu: "robots.txt ne contient pas « Disallow: / » pour User-agent: *.",
    async run() {
      const r = await http("/robots.txt");
      if (!r.ok) {
        return r.reseau
          ? { statut: "echec", observe: `robots.txt injoignable : ${r.motif}` }
          : { statut: "ignore", observe: r.motif };
      }
      if (r.status !== 200) return { statut: "echec", observe: `HTTP ${r.status} reçu.` };
      const bloque = /^\s*disallow:\s*\/\s*$/im.test(r.corps);
      return bloque
        ? { statut: "echec", observe: "robots.txt interdit l'exploration de tout le site." }
        : { statut: "reussi", observe: "Exploration autorisée pour les robots." };
    },
  },
  {
    id: "product.flux",
    domaine: "product_engine",
    label: "Le flux produit est publié",
    criticite: "normale",
    attendu: "GET /feeds/produits.xml renvoie 200 et un document XML.",
    async run() {
      const r = await http("/feeds/produits.xml");
      if (!r.ok) {
        return r.reseau
          ? { statut: "echec", observe: `Flux injoignable : ${r.motif}` }
          : { statut: "ignore", observe: r.motif };
      }
      if (r.status !== 200) return { statut: "echec", observe: `HTTP ${r.status} reçu.` };
      const items = (r.corps.match(/<item>/g) ?? []).length;
      return r.corps.includes("<?xml")
        ? { statut: "reussi", observe: `Flux XML servi, ${items} produit(s).` }
        : { statut: "echec", observe: "Réponse servie mais ce n'est pas un document XML." };
    },
  },
  {
    id: "product.vehicules_exclus",
    domaine: "product_engine",
    label: "Aucun véhicule motorisé n'entre dans le catalogue produit",
    criticite: "critique",
    attendu:
      "La table des fiches produit ne contient aucune ligne issue du pipeline véhicule (elles seraient refusées par Google).",
    async run() {
      const n = await scalaire(
        `SELECT count(*)::int AS n FROM "product_feed_items" WHERE "source" NOT IN ('parts_catalog', 'pieces')`,
      );
      if (n === null) return { statut: "ignore", observe: "Table des fiches produit absente." };
      return n === 0
        ? { statut: "reussi", observe: "Aucun véhicule dans le catalogue produit." }
        : { statut: "echec", observe: `${n} véhicule(s) présent(s) dans le catalogue produit.` };
    },
  },
  {
    id: "registry.heartbeat",
    domaine: "engine_registry",
    label: "Chaque moteur inscrit émet un battement de cœur",
    criticite: "critique",
    attendu: "Aucun moteur du registre sans battement, ni avec un battement de plus de 24 h.",
    async run() {
      const muets = await scalaire(
        `SELECT count(*)::int AS n FROM "engine_registry" WHERE "last_heartbeat" IS NULL OR "last_heartbeat" < now() - interval '24 hours'`,
      );
      if (muets === null) return { statut: "ignore", observe: "Registre des moteurs absent." };
      const total = (await compte("engine_registry")) ?? 0;
      return muets === 0
        ? { statut: "reussi", observe: `${total} moteur(s) donnent signe de vie.` }
        : {
            statut: "echec",
            observe: `${muets} moteur(s) sur ${total} sans battement récent : leur état affiché n'est plus fiable.`,
          };
    },
  },
  {
    id: "bus.remise",
    domaine: "event_bus",
    label: "Un événement publié est réellement remis à ses abonnés",
    criticite: "critique",
    attendu:
      "Un événement de contrôle publié sur le bus produit au moins une remise enregistrée.",
    async run() {
      const { emit } = await import("../event-bus/service.js");
      const res = await emit({
        source: "continuous_test",
        type: "moteur.retabli",
        payload: { moteur: "continuous_test" },
      });
      if (res.statut === "orphelin") {
        return {
          statut: "echec",
          observe: "Événement publié mais aucun moteur abonné : il n'a produit aucun effet.",
        };
      }
      const echecs = res.remises.filter((r) => r.statut === "echec");
      return echecs.length === 0
        ? {
            statut: "reussi",
            observe: `Remis à ${res.remises.length} abonné(s) : ${res.remises.map((r) => r.engine).join(", ")}.`,
          }
        : {
            statut: "echec",
            observe: `${echecs.length} abonné(s) en échec : ${echecs.map((r) => `${r.engine} — ${r.detail}`).join(" ; ")}`,
          };
    },
  },
  {
    id: "bus.souffrance",
    domaine: "event_bus",
    label: "Aucun événement récent ne reste sans remise",
    criticite: "normale",
    attendu: "Aucun événement des 24 dernières heures encore en attente de distribution.",
    async run() {
      const n = await scalaire(
        `SELECT count(*)::int AS n FROM "engine_events" WHERE "status" = 'pending' AND "created_at" > now() - interval '24 hours'`,
      );
      if (n === null) return { statut: "ignore", observe: "Table des événements absente." };
      return n === 0
        ? { statut: "reussi", observe: "Tous les événements récents ont été distribués." }
        : { statut: "echec", observe: `${n} événement(s) publiés depuis 24 h, jamais remis.` };
    },
  },
  {
    id: "smart.alertes_dedup",
    domaine: "smart",
    label: "Le moteur d'alertes ne crée pas de doublon",
    criticite: "normale",
    attendu:
      "Deux signalements du même problème (même signature) ne produisent qu'une seule alerte ouverte.",
    async run() {
      const { raiseAlert } = await import("../smart-engine/services/alert-engine.js");
      const signature = "continuous-test:dedup";
      const entree = {
        category: "test" as const,
        title: "Contrôle continu — déduplication des alertes",
        description:
          "Alerte de contrôle produite par le Continuous Test Engine. Sa présence prouve que la chaîne d'alerte fonctionne.",
        level: "info" as const,
        signature,
      };
      await raiseAlert(entree);
      const second = await raiseAlert(entree);
      return second === false
        ? { statut: "reussi", observe: "Le second signalement identique n'a pas créé d'alerte." }
        : {
            statut: "echec",
            observe: "Un signalement identique a créé une seconde alerte : la file va se remplir de doublons.",
          };
    },
  },
  {
    id: "indexation.honnetete",
    domaine: "indexation",
    label: "Aucune page n'est déclarée indexée sans preuve de Google",
    criticite: "critique",
    attendu:
      "Tant qu'aucun accès Search Console n'est fourni, aucune URL ne porte le statut « indexé ».",
    async run() {
      const n = await scalaire(
        `SELECT count(*)::int AS n FROM "indexation_watch" WHERE "index_google" = 'indexe'`,
      );
      if (n === null) return { statut: "ignore", observe: "Table de suivi d'indexation absente." };
      const searchConsole = !!process.env.GOOGLE_SEARCH_CONSOLE_KEY;
      if (searchConsole) {
        return {
          statut: "reussi",
          observe: `Accès Search Console fourni : ${n} URL(s) déclarée(s) indexée(s) sur preuve.`,
        };
      }
      return n === 0
        ? { statut: "reussi", observe: "Aucune indexation affirmée sans preuve." }
        : {
            statut: "echec",
            observe: `${n} URL(s) affichées comme indexées alors que Google n'a rien confirmé.`,
          };
    },
  },
  {
    id: "paiement.cle",
    domaine: "payment",
    label: "Le prestataire de paiement est réellement utilisable",
    criticite: "critique",
    attendu: "La clé du prestataire est présente et acceptée : sinon aucun encaissement n'aboutit.",
    async run() {
      const cle = process.env.STRIPE_SECRET_KEY ?? "";
      if (!cle) {
        return {
          statut: "ignore",
          observe: "Aucune clé prestataire configurée : le paiement carte n'est pas proposé.",
        };
      }
      const { getStripe } = await import("../lib/stripe.js");
      const stripe = getStripe();
      if (!stripe) return { statut: "echec", observe: "Clé présente mais client non initialisable." };
      try {
        await stripe.balance.retrieve();
        return { statut: "reussi", observe: "Clé acceptée par le prestataire." };
      } catch (e) {
        return {
          statut: "echec",
          observe: `Clé refusée par le prestataire : ${(e as Error).message}. Aucun paiement ne peut aboutir.`,
        };
      }
    },
  },
  {
    id: "paiement.doublon",
    domaine: "payment",
    label: "Aucune commande n'est encaissée deux fois",
    criticite: "critique",
    attendu: "Aucune référence de paiement ne porte deux lignes réglées.",
    async run() {
      const n = await scalaire(
        `SELECT count(*)::int AS n FROM (SELECT "stripe_payment_intent_id" FROM "payments" WHERE "status" = 'paid' AND "stripe_payment_intent_id" IS NOT NULL GROUP BY 1 HAVING count(*) > 1) d`,
      );
      if (n === null) return { statut: "ignore", observe: "Table des paiements absente." };
      return n === 0
        ? { statut: "reussi", observe: "Aucun double encaissement détecté." }
        : { statut: "echec", observe: `${n} référence(s) encaissée(s) plusieurs fois.` };
    },
  },
  {
    id: "annonces.integrite",
    domaine: "annonces",
    label: "Toute annonce publiée reste affichable",
    criticite: "critique",
    attendu: "Aucune annonce publiée sans titre ni prix : elle produirait une page vide.",
    async run() {
      const n = await scalaire(
        `SELECT count(*)::int AS n FROM "annonces" WHERE "status" = 'publiee' AND (coalesce("titre", '') = '' OR "prix" IS NULL OR "prix"::numeric <= 0)`,
      );
      if (n === null) return { statut: "ignore", observe: "Table des annonces absente." };
      return n === 0
        ? { statut: "reussi", observe: "Toutes les annonces publiées sont complètes." }
        : { statut: "echec", observe: `${n} annonce(s) publiée(s) sans titre ou sans prix.` };
    },
  },
  {
    id: "redirection.404",
    domaine: "redirection",
    label: "Les parcours cassés sont détectés",
    criticite: "normale",
    attendu:
      "Toute clé tombée en 404 sur 7 jours possède désormais une règle de redirection active : détecter sans réparer ne sert à rien.",
    async run() {
      const casses = await scalaire(
        `SELECT count(DISTINCT "key")::int AS n FROM "redir_logs" WHERE "created_at" > now() - interval '7 days' AND "outcome" IN ('not_found', 'unmatched', 'error')`,
      );
      if (casses === null) return { statut: "ignore", observe: "Journal des parcours absent." };
      if (casses === 0) return { statut: "reussi", observe: "Aucun parcours cassé sur 7 jours." };
      const sansRegle = await scalaire(
        `SELECT count(*)::int AS n FROM (
           SELECT DISTINCT l."key" FROM "redir_logs" l
           WHERE l."created_at" > now() - interval '7 days'
             AND l."outcome" IN ('not_found', 'unmatched', 'error')
             AND NOT EXISTS (
               SELECT 1 FROM "redir_rules" r WHERE r."key" = l."key" AND coalesce(r."active", true) = true
             )
         ) d`,
      );
      return sansRegle === 0
        ? {
            statut: "reussi",
            observe: `${casses} parcours cassé(s) détecté(s), tous rattachés à une règle de redirection active.`,
          }
        : {
            statut: "echec",
            observe: `${sansRegle} parcours cassé(s) sur ${casses} sans aucune règle : ces clics mènent toujours nulle part.`,
          };
    },
  },
];

/**
 * Le catalogue complet : contrôles de plateforme (108-109) puis contrôles de
 * parcours, de pays, de rôles et d'écrans (110-113), puis contrôle des deux
 * moteurs centraux et de la mémoire technique (114-117).
 */
export const SCENARIOS: Scenario[] = [
  ...SCENARIOS_PLATEFORME,
  ...PARCOURS_SCENARIOS,
  ...MOTEURS_CENTRAUX_SCENARIOS,
];

export const SCENARIO_IDS = SCENARIOS.map((s) => s.id);
