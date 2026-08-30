/**
 * Points 110-113 — contrôles de parcours, de pays, de rôles et d'écrans.
 *
 * Ces familles répondent aux défauts que le PDG constate à l'écran et qu'aucun
 * test de code ne voit : un bouton qui ne mène nulle part, un pays déclaré
 * ouvert sans devise ni moyen de paiement, un rôle qui atteint les données d'un
 * autre, une page desktop cassée sur mobile.
 *
 * Règle commune : un contrôle qui ne peut pas s'exécuter renvoie `ignore` avec
 * le motif exact. Jamais `reussi`.
 */
import { BOUTONS_SANS_ACTION, ecransConcernes } from "../data/boutons-sans-action.js";
import { CLIENT_ROUTES } from "../data/client-routes.js";
import { estIntrouvable, http, lignes, type Observation, type Scenario } from "./helpers.js";

/** Un placeholder non résolu (`:id`, `undefined`, `[object`) est un bouton mort. */
const PLACEHOLDER = /(:\w+|\bundefined\b|\bnull\b|\[object)/;

/**
 * Échantillon déterministe de routes publiques : on contrôle réellement des
 * pages, réparties dans tout le catalogue, sans interroger 600 URLs à chaque
 * campagne. Déterministe pour que deux campagnes soient comparables (point 109).
 */
function echantillonRoutes(taille: number): string[] {
  const candidates = CLIENT_ROUTES.filter((r) => !PLACEHOLDER.test(r) && !r.startsWith("/admin"));
  if (candidates.length <= taille) return [...candidates];
  const pas = Math.floor(candidates.length / taille);
  const out: string[] = [];
  for (let i = 0; i < candidates.length && out.length < taille; i += pas) out.push(candidates[i]);
  return out;
}

/** Interroge un endpoint tRPC sans aucune session. */
async function trpcAnonyme(chemin: string) {
  return http(`/api/trpc/${chemin}?input=${encodeURIComponent("{}")}`, {
    entetes: { accept: "application/json" },
  });
}

const UA_MOBILE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const UA_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export const PARCOURS_SCENARIOS: Scenario[] = [
  // ── 110 — boutons et redirections ─────────────────────────────────────────
  {
    id: "parcours.routes_servies",
    domaine: "redirection",
    label: "Les pages du menu répondent réellement",
    criticite: "critique",
    attendu:
      "Un échantillon réparti des routes publiques déclarées renvoie 200 sans afficher l'écran « page introuvable ».",
    async run(): Promise<Observation> {
      const routes = echantillonRoutes(24);
      if (routes.length === 0)
        return { statut: "ignore", observe: "Aucune route publique déclarée à contrôler." };
      const casses: string[] = [];
      let controlees = 0;
      for (const r of routes) {
        const rep = await http(r);
        if (!rep.ok) {
          if (!rep.reseau)
            return { statut: "ignore", observe: rep.motif };
          casses.push(`${r} (injoignable)`);
          continue;
        }
        controlees += 1;
        if (rep.status !== 200) casses.push(`${r} → HTTP ${rep.status}`);
        else if (estIntrouvable(rep.corps)) casses.push(`${r} → page introuvable`);
      }
      if (controlees === 0)
        return { statut: "echec", observe: "Aucune page n'a pu être servie : site injoignable." };
      return casses.length === 0
        ? { statut: "reussi", observe: `${controlees} page(s) contrôlée(s), toutes servies.` }
        : {
            statut: "echec",
            observe: `${casses.length}/${routes.length} page(s) cassée(s) : ${casses.slice(0, 6).join(" · ")}${casses.length > 6 ? " …" : ""}`,
          };
    },
  },
  {
    id: "parcours.destinations_existantes",
    domaine: "redirection",
    label: "Aucun bouton ne pointe vers une page inexistante",
    criticite: "critique",
    attendu:
      "Chaque règle de redirection active vise soit une URL externe, soit une route client réellement déclarée.",
    async run(): Promise<Observation> {
      const rows = await lignes<{ key: string; target: string; external: boolean | null }>(
        `SELECT "key", "target", "external" FROM "redir_rules" WHERE coalesce("active", true) = true`,
      );
      if (rows === null)
        return { statut: "ignore", observe: "Table des règles de redirection absente." };
      if (rows.length === 0)
        return { statut: "ignore", observe: "Aucune règle de redirection enregistrée." };
      const connues = new Set(CLIENT_ROUTES);
      const morts: string[] = [];
      for (const r of rows) {
        const t = (r.target || "").trim();
        if (!t) {
          morts.push(`${r.key} → destination vide`);
          continue;
        }
        if (r.external || /^https?:\/\//i.test(t)) continue;
        if (PLACEHOLDER.test(t)) {
          morts.push(`${r.key} → ${t} (paramètre non résolu)`);
          continue;
        }
        const chemin = t.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
        if (!connues.has(chemin) && !connues.has(`${chemin}/`))
          morts.push(`${r.key} → ${chemin} (route inconnue)`);
      }
      return morts.length === 0
        ? {
            statut: "reussi",
            observe: `${rows.length} règle(s) active(s), toutes vers une destination existante.`,
          }
        : {
            statut: "echec",
            observe: `${morts.length} bouton(s) mort(s) : ${morts.slice(0, 6).join(" · ")}${morts.length > 6 ? " …" : ""}`,
          };
    },
  },
  {
    id: "parcours.boutons_sans_action",
    domaine: "redirection",
    label: "Aucun bouton n'est posé sans action",
    criticite: "critique",
    attendu:
      "Aucun bouton d'écran ne reste sans gestionnaire de clic, sans type « submit » et sans formulaire soumis : appuyer produit toujours quelque chose.",
    async run(): Promise<Observation> {
      if (BOUTONS_SANS_ACTION.length === 0)
        return { statut: "reussi", observe: "Aucun bouton sans action relevé dans les écrans." };
      const ecrans = ecransConcernes();
      const exemples = BOUTONS_SANS_ACTION.slice(0, 6).map(
        (b) => `${b.libelle || "(sans texte)"} — ${b.fichier}:${b.ligne}`,
      );
      return {
        statut: "echec",
        observe: `${BOUTONS_SANS_ACTION.length} bouton(s) sans action sur ${ecrans.length} écran(s) : ${exemples.join(" · ")}${BOUTONS_SANS_ACTION.length > 6 ? " …" : ""}`,
      };
    },
  },
  {
    id: "parcours.pas_de_boucle",
    domaine: "redirection",
    label: "Aucune redirection ne tourne en boucle",
    criticite: "normale",
    attendu:
      "Aucune règle ne renvoie vers elle-même, et aucune chaîne de règles ne revient à son point de départ.",
    async run(): Promise<Observation> {
      const rows = await lignes<{ key: string; target: string; external: boolean | null }>(
        `SELECT "key", "target", "external" FROM "redir_rules" WHERE coalesce("active", true) = true`,
      );
      if (rows === null) return { statut: "ignore", observe: "Table des règles absente." };
      if (rows.length === 0) return { statut: "ignore", observe: "Aucune règle enregistrée." };
      const parCle = new Map<string, string>();
      for (const r of rows) {
        if (r.external || /^https?:\/\//i.test(r.target || "")) continue;
        parCle.set(r.key, (r.target || "").split("?")[0]);
      }
      const boucles: string[] = [];
      for (const depart of parCle.keys()) {
        const vus = new Set<string>([depart]);
        let courant = parCle.get(depart);
        let sauts = 0;
        while (courant && sauts < 12) {
          const suivante = courant.replace(/^\//, "");
          if (vus.has(suivante) || suivante === depart) {
            boucles.push(`${depart} → ${courant}`);
            break;
          }
          if (!parCle.has(suivante)) break;
          vus.add(suivante);
          courant = parCle.get(suivante);
          sauts += 1;
        }
      }
      return boucles.length === 0
        ? { statut: "reussi", observe: `${parCle.size} chaîne(s) interne(s) contrôlée(s), aucune boucle.` }
        : { statut: "echec", observe: `Boucle(s) détectée(s) : ${boucles.slice(0, 4).join(" · ")}` };
    },
  },

  // ── 111 — pays ────────────────────────────────────────────────────────────
  {
    id: "pays.devise_reelle",
    domaine: "country",
    label: "Chaque pays ouvert a une devise réellement définie",
    criticite: "critique",
    attendu:
      "La devise par défaut de chaque pays actif existe dans le référentiel des devises, avec un taux.",
    async run(): Promise<Observation> {
      const rows = await lignes<{ code: string; nom: string; devise: string; connue: number }>(
        `SELECT c."code", c."name_fr" AS nom, c."default_currency" AS devise,
                (SELECT count(*)::int FROM "country_currencies" d WHERE d."code" = c."default_currency") AS connue
           FROM "country_countries" c WHERE c."active" = true`,
      );
      if (rows === null) return { statut: "ignore", observe: "Référentiel des pays absent." };
      if (rows.length === 0) return { statut: "ignore", observe: "Aucun pays actif déclaré." };
      const sans = rows.filter((r) => !r.devise || r.connue === 0);
      return sans.length === 0
        ? { statut: "reussi", observe: `${rows.length} pays actif(s), tous avec une devise connue.` }
        : {
            statut: "echec",
            observe: `${sans.length} pays ouvert(s) sans devise utilisable : ${sans
              .slice(0, 6)
              .map((r) => `${r.nom} (${r.devise || "aucune"})`)
              .join(" · ")}`,
          };
    },
  },
  {
    id: "pays.langue_disponible",
    domaine: "language",
    label: "La langue par défaut de chaque pays existe",
    criticite: "normale",
    attendu:
      "La langue par défaut de chaque pays actif est déclarée et active dans le référentiel des langues.",
    async run(): Promise<Observation> {
      const rows = await lignes<{ nom: string; langue: string; connue: number }>(
        `SELECT c."name_fr" AS nom, c."default_language" AS langue,
                (SELECT count(*)::int FROM "language_languages" l
                  WHERE l."code" = c."default_language" AND l."active" = true) AS connue
           FROM "country_countries" c WHERE c."active" = true`,
      );
      if (rows === null) return { statut: "ignore", observe: "Référentiel des langues absent." };
      if (rows.length === 0) return { statut: "ignore", observe: "Aucun pays actif déclaré." };
      const sans = rows.filter((r) => r.connue === 0);
      return sans.length === 0
        ? { statut: "reussi", observe: `${rows.length} pays actif(s), langue par défaut disponible.` }
        : {
            statut: "echec",
            observe: `${sans.length} pays sans langue active : ${sans
              .slice(0, 6)
              .map((r) => `${r.nom} (${r.langue})`)
              .join(" · ")}`,
          };
    },
  },
  {
    id: "pays.paiement_declare",
    domaine: "country",
    label: "Un pays ouvert sans moyen de paiement est nommé",
    criticite: "normale",
    attendu:
      "Chaque pays actif déclare au moins un moyen de paiement : un service qui marche en France ne devient pas mondial tout seul.",
    async run(): Promise<Observation> {
      const rows = await lignes<{ nom: string; n: number }>(
        `SELECT "name_fr" AS nom, coalesce(jsonb_array_length("payment_methods"), 0)::int AS n
           FROM "country_countries" WHERE "active" = true`,
      );
      if (rows === null) return { statut: "ignore", observe: "Référentiel des pays absent." };
      if (rows.length === 0) return { statut: "ignore", observe: "Aucun pays actif déclaré." };
      const sans = rows.filter((r) => r.n === 0);
      return sans.length === 0
        ? {
            statut: "reussi",
            observe: `${rows.length} pays actif(s), tous avec un moyen de paiement déclaré.`,
          }
        : {
            statut: "echec",
            observe: `${sans.length} pays ouvert(s) sans aucun moyen de paiement : ${sans
              .slice(0, 8)
              .map((r) => r.nom)
              .join(", ")}`,
          };
    },
  },

  // ── 112 — comptes et rôles ────────────────────────────────────────────────
  {
    id: "roles.mur_direction",
    domaine: "permission",
    label: "Les données de direction refusent un visiteur",
    criticite: "critique",
    attendu:
      "Sans session, les procédures réservées à la direction répondent UNAUTHORIZED / FORBIDDEN — jamais des données.",
    async run(): Promise<Observation> {
      const cibles = [
        "continuousTest.etat",
        "activationAudit.latest",
        "eventBus.observabilite",
        "admin.stats",
      ];
      const fuites: string[] = [];
      let controlees = 0;
      for (const c of cibles) {
        const rep = await trpcAnonyme(c);
        if (!rep.ok) {
          if (!rep.reseau) return { statut: "ignore", observe: rep.motif };
          continue;
        }
        controlees += 1;
        const refuse =
          rep.status === 401 ||
          rep.status === 403 ||
          /UNAUTHORIZED|FORBIDDEN|NOT_FOUND/i.test(rep.corps.slice(0, 800));
        if (!refuse) fuites.push(`${c} → HTTP ${rep.status}`);
      }
      if (controlees === 0)
        return { statut: "ignore", observe: "Aucune procédure protégée n'a pu être interrogée." };
      return fuites.length === 0
        ? {
            statut: "reussi",
            observe: `${controlees} procédure(s) de direction contrôlée(s), toutes refusées sans session.`,
          }
        : {
            statut: "echec",
            observe: `Données de direction accessibles sans session : ${fuites.join(" · ")}`,
          };
    },
  },
  {
    id: "roles.visiteur_servi",
    domaine: "permission",
    label: "Un visiteur accède bien au public",
    criticite: "normale",
    attendu:
      "Une procédure publique répond 200 sans session : le mur de permissions ne doit pas fermer le site.",
    async run(): Promise<Observation> {
      const rep = await trpcAnonyme("meta.homeStats");
      if (!rep.ok)
        return rep.reseau
          ? { statut: "echec", observe: `Endpoint public injoignable : ${rep.motif}` }
          : { statut: "ignore", observe: rep.motif };
      return rep.status === 200
        ? { statut: "reussi", observe: "Les données publiques sont servies sans session." }
        : {
            statut: "echec",
            observe: `Une procédure publique répond HTTP ${rep.status} : le public est bloqué.`,
          };
    },
  },
  {
    id: "roles.espace_pdg_ferme",
    domaine: "permission",
    label: "L'espace de direction n'est pas exposé au public",
    criticite: "critique",
    attendu:
      "La page /admin servie à un visiteur ne contient aucune donnée de direction — l'accès est refusé côté procédures.",
    async run(): Promise<Observation> {
      const rep = await http("/admin");
      if (!rep.ok)
        return rep.reseau
          ? { statut: "echec", observe: `/admin injoignable : ${rep.motif}` }
          : { statut: "ignore", observe: rep.motif };
      const fuite = /chiffre d'affaires|solde disponible|clé api|stripe_secret/i.test(rep.corps);
      return fuite
        ? {
            statut: "echec",
            observe: "La page /admin servie sans session contient des données de direction.",
          }
        : {
            statut: "reussi",
            observe: `/admin renvoie HTTP ${rep.status} sans aucune donnée de direction dans la page.`,
          };
    },
  },

  // ── 113 — écrans ──────────────────────────────────────────────────────────
  {
    id: "ecrans.mobile_non_regression",
    domaine: "core",
    label: "L'accueil reste servi sur mobile",
    criticite: "critique",
    attendu:
      "Avec un navigateur mobile, l'accueil renvoie 200, contient la marque et déclare un viewport adapté.",
    async run(): Promise<Observation> {
      const rep = await http("/", { entetes: { "user-agent": UA_MOBILE } });
      if (!rep.ok)
        return rep.reseau
          ? { statut: "echec", observe: `Accueil mobile injoignable : ${rep.motif}` }
          : { statut: "ignore", observe: rep.motif };
      if (rep.status !== 200)
        return { statut: "echec", observe: `Accueil mobile : HTTP ${rep.status}.` };
      const viewport = /<meta[^>]+name=["']viewport["']/i.test(rep.corps);
      const marque = /MKA/i.test(rep.corps);
      if (!marque)
        return { statut: "echec", observe: "Accueil mobile servi sans le nom de la marque." };
      return viewport
        ? { statut: "reussi", observe: "Accueil mobile servi avec viewport déclaré." }
        : {
            statut: "echec",
            observe: "Aucun viewport déclaré : la page desktop s'affichera réduite sur mobile.",
          };
    },
  },
  {
    id: "ecrans.desktop_non_regression",
    domaine: "core",
    label: "L'accueil reste servi sur ordinateur",
    criticite: "normale",
    attendu:
      "Avec un navigateur d'ordinateur, l'accueil renvoie 200 et sert la même application (aucune divergence de rendu serveur).",
    async run(): Promise<Observation> {
      const rep = await http("/", { entetes: { "user-agent": UA_DESKTOP } });
      if (!rep.ok)
        return rep.reseau
          ? { statut: "echec", observe: `Accueil ordinateur injoignable : ${rep.motif}` }
          : { statut: "ignore", observe: rep.motif };
      if (rep.status !== 200)
        return { statut: "echec", observe: `Accueil ordinateur : HTTP ${rep.status}.` };
      const racine = /<div id=["']root["']/i.test(rep.corps);
      return racine
        ? { statut: "reussi", observe: `Accueil ordinateur servi (${rep.corps.length} octets).` }
        : {
            statut: "echec",
            observe: "L'accueil ordinateur ne contient pas le point de montage de l'application.",
          };
    },
  },
  {
    id: "ecrans.pages_produit_titrees",
    domaine: "seo",
    label: "Les pages de contenu portent un titre et une description",
    criticite: "normale",
    attendu:
      "Les pages publiques principales contiennent un <title> non vide et une meta description : sans elles, ni le visiteur ni Google ne savent ce qu'ils lisent.",
    async run(): Promise<Observation> {
      const cibles = ["/", "/acheter", "/louer", "/pieces", "/garages"];
      const manquants: string[] = [];
      let controlees = 0;
      for (const c of cibles) {
        const rep = await http(c);
        if (!rep.ok) {
          if (!rep.reseau) return { statut: "ignore", observe: rep.motif };
          continue;
        }
        if (rep.status !== 200) {
          manquants.push(`${c} → HTTP ${rep.status}`);
          continue;
        }
        controlees += 1;
        const titre = /<title>([^<]{3,})<\/title>/i.test(rep.corps);
        const desc = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10,}/i.test(rep.corps);
        if (!titre || !desc)
          manquants.push(`${c}${!titre ? " (titre)" : ""}${!desc ? " (description)" : ""}`);
      }
      if (controlees === 0)
        return { statut: "ignore", observe: "Aucune page de contenu n'a pu être contrôlée." };
      return manquants.length === 0
        ? { statut: "reussi", observe: `${controlees} page(s) avec titre et description.` }
        : { statut: "echec", observe: `Métadonnées manquantes : ${manquants.join(" · ")}` };
    },
  },
];
