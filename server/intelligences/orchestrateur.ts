/**
 * Points 130-131 — Master Orchestrator et agent développeur complet.
 *
 * Le propriétaire donne un objectif en une phrase : « Répare le problème de
 * paiement de cette page. » L'orchestrateur le décompose, exécute lui-même
 * chaque étape qu'il a le droit d'exécuter, s'arrête net sur la première qui
 * dépasse la permission du rôle ou le niveau d'autonomie du domaine, et écrit
 * un rapport. Le propriétaire ne microgère aucun sous-agent : il lit le rapport
 * et décide s'il monte le curseur.
 *
 * Rien n'est réinventé ici. Chaque étape appelle le moteur qui possède déjà la
 * compétence : le Code Knowledge Graph pour l'architecture et la mémoire des
 * corrections, le Centre de Commandes pour le dossier de développement et le
 * pipeline obligatoire, le contrôle continu pour les tests et le verrou de
 * déploiement, le routeur de capacités pour l'analyse et le correctif.
 *
 * Règle tenue : une étape non exécutée n'est jamais présentée comme faite. Elle
 * porte son statut (`en_attente_autorisation`, `refuse`, `echec`) et la raison.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { inMissionEtapes, inMissions } from "./schema.js";
import { router, permissionsDuRole } from "./routeur.js";
import { autorise, type NiveauAutonomie } from "./autonomie.js";
import { normaliser, type Piece } from "./multimodal.js";
import { dejaVu, retenir } from "./memoire.js";
import type { CodeCapacite, Permission } from "./capacites.js";
import type { Confidentiality } from "../ai-fabric/service.js";

const MOTEUR = "intelligences_orchestrateur";

/** Domaines métier reconnus dans un objectif, et le curseur d'autonomie associé. */
const DOMAINES: { code: string; mots: RegExp; autonomie: string }[] = [
  {
    code: "paiement",
    mots: /paiement|payer|stripe|encaiss|facture|abonnement|remboursement/i,
    autonomie: "paiement",
  },
  { code: "seo", mots: /seo|référencement|referencement|google|sitemap|indexation/i, autonomie: "seo" },
  { code: "redirection", mots: /redirection|404|lien cassé|lien casse|url/i, autonomie: "code" },
  { code: "annonces", mots: /annonce|dépôt|depot|photo|galerie/i, autonomie: "code" },
  { code: "avis", mots: /avis|réputation|reputation|note/i, autonomie: "contenu" },
  { code: "support", mots: /support|message|réclamation|reclamation|client/i, autonomie: "support" },
  { code: "moteurs", mots: /moteur|registre|sonde|heartbeat|event bus/i, autonomie: "moteurs" },
  {
    code: "infrastructure",
    mots: /railway|déploiement|deploiement|variable|serveur|base de données|base de donnees/i,
    autonomie: "infrastructure",
  },
  { code: "traduction", mots: /traduction|langue|traduire/i, autonomie: "contenu" },
  { code: "code", mots: /code|bouton|page|composant|route|formulaire|bug|erreur/i, autonomie: "code" },
];

function classerObjectif(objectif: string): { domaine: string; autonomie: string } {
  for (const d of DOMAINES) {
    if (d.mots.test(objectif)) return { domaine: d.code, autonomie: d.autonomie };
  }
  return { domaine: "inconnu", autonomie: "code" };
}

type StatutEtape = "fait" | "refuse" | "en_attente_autorisation" | "echec" | "non_execute";

interface Etape {
  etape: string;
  libelle: string;
  permission: Permission;
  capacite: CodeCapacite | null;
  statut: StatutEtape;
  observe: string;
  dureeMs: number;
  niveauRequis: NiveauAutonomie;
}

export interface OrchestrerInput {
  objectif: string;
  role: string | null;
  actorId?: number;
  pieces?: Piece[];
  countryCode?: string | null;
  confidentialite?: Confidentiality;
}

export interface Mission {
  id: number;
  objectif: string;
  domaine: string;
  statut: "accomplie" | "arretee" | "echouee";
  arretSur: string;
  motif: string;
  rapport: string;
  devRequestId: number | null;
  pipelineRunId: number | null;
  testRunId: number | null;
  etapes: {
    etape: string;
    libelle: string;
    statut: StatutEtape;
    capacite: CodeCapacite | null;
    permission: Permission;
    niveauRequis: number;
    observe: string;
    dureeMs: number;
  }[];
}

/** Plan standard d'une mission. L'ordre est celui du point 130. */
const PLAN: Omit<Etape, "statut" | "observe" | "dureeMs" | "niveauRequis">[] = [
  {
    etape: "comprendre",
    libelle: "Comprendre l'objectif et les pièces jointes",
    permission: "READ",
    capacite: null,
  },
  {
    etape: "architecture",
    libelle: "Lire l'architecture réellement en jeu",
    permission: "READ",
    capacite: null,
  },
  {
    etape: "experience",
    libelle: "Consulter la mémoire des corrections passées",
    permission: "READ",
    capacite: null,
  },
  {
    etape: "analyse",
    libelle: "Analyser la situation",
    permission: "ANALYZE",
    capacite: "raisonnement",
  },
  {
    etape: "correctif",
    libelle: "Rédiger le correctif proposé",
    permission: "PROPOSE",
    capacite: "code",
  },
  {
    etape: "dossier",
    libelle: "Ouvrir le dossier de développement hors production",
    permission: "WRITE",
    capacite: null,
  },
  {
    etape: "tests",
    libelle: "Exécuter les contrôles et la non-régression",
    permission: "TEST",
    capacite: null,
  },
  {
    etape: "deploiement",
    libelle: "Vérifier le verrou de déploiement",
    permission: "DEPLOY",
    capacite: null,
  },
];

/**
 * Exécute une mission. Le résultat est toujours écrit en base : une mission
 * arrêtée reste consultable, avec l'étape exacte qui a bloqué.
 */
export async function orchestrer(input: OrchestrerInput): Promise<Mission> {
  const debutMission = Date.now();
  const objectif = input.objectif.trim();
  const { domaine, autonomie } = classerObjectif(objectif);
  const accordees = permissionsDuRole(input.role);

  const [mission] = await db
    .insert(inMissions)
    .values({
      objectif: objectif.slice(0, 4000),
      domaine,
      cote: "direction",
      actorId: input.actorId ?? null,
    })
    .returning({ id: inMissions.id });

  const etapes: Etape[] = [];
  let arretSur = "";
  let motifArret = "";
  let devRequestId: number | null = null;
  let pipelineRunId: number | null = null;
  let testRunId: number | null = null;

  // Contexte accumulé et transmis d'une étape à l'autre : c'est ce qui
  // distingue une mission d'une suite d'appels indépendants.
  let contexteArchitecture = "";
  let contexteExperience = "";
  let contexteAnalyse = "";
  let capaciteConseillee: CodeCapacite = "raisonnement";
  let images: string[] = [];
  let texteQuestion = objectif;

  for (const modele of PLAN) {
    const verdict = await autorise(autonomie, modele.permission);
    const base: Etape = {
      ...modele,
      statut: "non_execute",
      observe: "",
      dureeMs: 0,
      niveauRequis: verdict.niveauRequis,
    };

    if (arretSur) {
      base.statut = "non_execute";
      base.observe = `Non exécutée : la mission s'est arrêtée sur « ${arretSur} ».`;
      etapes.push(base);
      continue;
    }

    if (!accordees.includes(modele.permission)) {
      base.statut = "refuse";
      base.observe = `Permission ${modele.permission} absente pour le rôle « ${input.role ?? "aucun"} ».`;
      arretSur = modele.etape;
      motifArret = base.observe;
      etapes.push(base);
      continue;
    }

    if (!verdict.autorise) {
      base.statut = "en_attente_autorisation";
      base.observe = verdict.motif;
      arretSur = modele.etape;
      motifArret = verdict.motif;
      etapes.push(base);
      continue;
    }

    const debut = Date.now();
    try {
      switch (modele.etape) {
        case "comprendre": {
          const n = await normaliser(objectif, input.pieces ?? []);
          texteQuestion = n.texte;
          images = n.images;
          capaciteConseillee = n.capaciteConseillee;
          const lues = n.pieces.filter((p) => p.lue).length;
          base.statut = "fait";
          base.observe = [
            `Domaine identifié : ${domaine}. Capacité principale : ${capaciteConseillee}.`,
            n.pieces.length === 0
              ? "Aucune pièce jointe."
              : `${lues}/${n.pieces.length} pièce(s) réellement lue(s).`,
            ...n.nonLues.map((p) => `Non lue — ${p.nom} : ${p.motif}`),
          ].join("\n");
          break;
        }

        case "architecture": {
          const graphe = await import("../code-graph/service.js");
          const i = await graphe.impact(domaine);
          if (!i.trouve) {
            base.statut = "fait";
            base.observe = `« ${domaine} » n'apparaît pas au relevé de code : le périmètre devra être précisé avant toute écriture.`;
          } else {
            base.observe = `${i.fichiers.length} fichier(s), ${i.api.length} API, ${i.tables.length} table(s), ${i.tests.length} contrôle(s), ${i.dependants.length} module(s) dépendant(s).${
              i.avertissements.length > 0 ? ` Avertissements : ${i.avertissements.join(" ")}` : ""
            }`;
            base.statut = "fait";
          }
          contexteArchitecture = base.observe;
          break;
        }

        case "experience": {
          // Deux mémoires distinctes, aucune recopiée : le relevé de code sait
          // ce qui a déjà été corrigé dans le dépôt, la mémoire d'Intelligences
          // sait ce qu'une mission précédente a réellement vécu (point 139).
          const graphe = await import("../code-graph/service.js");
          const r = await graphe.reconnaitre(objectif);
          const vu = await dejaVu(domaine, objectif);
          contexteExperience = [r.verdict, vu.verdict].join("\n");
          base.statut = "fait";
          base.observe = vu.connu
            ? `${r.verdict}\n${vu.verdict}`
            : `${r.verdict}\nAucune mission passée comparable : ce cas est traité pour la première fois.`;
          break;
        }

        case "analyse": {
          const r = await router({
            capacite: capaciteConseillee === "code" ? "raisonnement" : capaciteConseillee,
            moteur: MOTEUR,
            role: input.role,
            systeme:
              "Tu analyses une plateforme automobile réelle. Dis ce que tu constates, distingue ce que tu sais de ce que tu supposes, et nomme ce qui manque pour conclure.",
            message: [
              `Objectif : ${texteQuestion}`,
              contexteArchitecture ? `Architecture en jeu : ${contexteArchitecture}` : "",
              contexteExperience ? `Mémoire des corrections : ${contexteExperience}` : "",
            ]
              .filter((l) => l.length > 0)
              .join("\n\n"),
            confidentialite: input.confidentialite ?? "interne",
            countryCode: input.countryCode ?? null,
            images: images.length > 0 ? images : undefined,
          });
          if (r.ok) {
            contexteAnalyse = r.texte;
            base.statut = "fait";
            base.observe = r.texte;
          } else {
            base.statut = "echec";
            base.observe = `${r.motif} Repli : ${r.repli}`;
            arretSur = modele.etape;
            motifArret = r.motif;
          }
          break;
        }

        case "correctif": {
          const r = await router({
            capacite: "code",
            moteur: MOTEUR,
            role: input.role,
            systeme:
              "Tu proposes un correctif pour un dépôt existant. Nomme les fichiers, décris la modification, indique le risque de régression et le retour arrière. N'invente aucun fichier dont l'existence n'est pas établie.",
            message: [
              `Objectif : ${objectif}`,
              contexteArchitecture ? `Architecture : ${contexteArchitecture}` : "",
              contexteAnalyse ? `Analyse : ${contexteAnalyse}` : "",
            ]
              .filter((l) => l.length > 0)
              .join("\n\n"),
            confidentialite: "interne",
            countryCode: input.countryCode ?? null,
          });
          if (r.ok) {
            base.statut = "fait";
            base.observe = r.texte;
          } else {
            base.statut = "echec";
            base.observe = `${r.motif} Repli : ${r.repli}`;
            arretSur = modele.etape;
            motifArret = r.motif;
          }
          break;
        }

        case "dossier": {
          const cc = await import("../command-center/service.js");
          const dossier = await cc.openDevRequest({
            need: objectif,
            countryCode: input.countryCode ?? null,
            requestedBy: input.actorId,
          });
          devRequestId = dossier?.id ?? null;
          base.statut = dossier ? "fait" : "echec";
          base.observe = dossier
            ? `Dossier de développement #${dossier.id} ouvert (${dossier.status}). ${
                dossier.blockedReason ?? ""
              }`.trim()
            : "Ouverture du dossier refusée par le Centre de Commandes.";
          if (!dossier) {
            arretSur = modele.etape;
            motifArret = base.observe;
          }
          break;
        }

        case "tests": {
          const ct = await import("../continuous-test/service.js");
          const run = await ct.runTests({
            portee: domaine,
            trigger: "orchestrateur",
            requestedBy: input.actorId,
          });
          testRunId = run.runId;
          base.statut = run.total === 0 ? "echec" : "fait";
          base.observe =
            run.total === 0
              ? `Aucun contrôle ne couvre le domaine « ${domaine} » : rien ne prouve que la correction n'a rien cassé.`
              : `Campagne #${run.runId} : ${run.reussis} réussi(s), ${run.echecs} échec(s), ${run.ignores} ignoré(s), ${run.regressions} régression(s).`;
          if (run.total === 0) {
            arretSur = modele.etape;
            motifArret = base.observe;
          }
          break;
        }

        case "deploiement": {
          const ct = await import("../continuous-test/service.js");
          const gate = await ct.deploymentGate();
          // L'orchestrateur ne déploie pas : il constate le verrou. La mise en
          // production reste une action critique confirmée par le propriétaire.
          base.statut = gate.autorise ? "fait" : "en_attente_autorisation";
          base.observe = gate.autorise
            ? `Verrou ouvert : ${gate.motif} Le déploiement reste une action confirmée par le propriétaire.`
            : `Verrou fermé : ${gate.motif}${
                gate.bloquants.length > 0
                  ? ` Bloquants : ${gate.bloquants.map((b) => b.scenario).join(", ")}.`
                  : ""
              }`;
          if (!gate.autorise) {
            arretSur = modele.etape;
            motifArret = gate.motif;
          }
          break;
        }
      }
    } catch (e) {
      base.statut = "echec";
      base.observe = `Étape interrompue : ${e instanceof Error ? e.message : "erreur inconnue"}`;
      arretSur = modele.etape;
      motifArret = base.observe;
    }

    base.dureeMs = Date.now() - debut;
    etapes.push(base);
  }

  const faites = etapes.filter((e) => e.statut === "fait").length;
  const statut: Mission["statut"] = arretSur
    ? etapes.some((e) => e.statut === "echec")
      ? "echouee"
      : "arretee"
    : "accomplie";

  const rapport = [
    `Objectif : ${objectif}`,
    `Domaine : ${domaine} (curseur d'autonomie « ${autonomie} »).`,
    `${faites}/${PLAN.length} étape(s) réellement exécutée(s).`,
    arretSur
      ? `Arrêt sur « ${arretSur} » : ${motifArret}`
      : "Toutes les étapes du plan ont été exécutées ; la mise en production reste une décision du propriétaire.",
    "",
    ...etapes.map((e) => `[${e.statut}] ${e.libelle}\n${e.observe}`),
  ].join("\n");

  const niveauRequis = Math.max(...etapes.map((e) => e.niveauRequis));
  const niveauAccorde = (await autorise(autonomie, "READ")).niveauAccorde;

  await db
    .update(inMissions)
    .set({
      statut,
      arretSur,
      motif: motifArret,
      rapport,
      devRequestId,
      pipelineRunId,
      testRunId,
      niveauRequis,
      niveauAccorde,
      dureeMs: Date.now() - debutMission,
    })
    .where(eq(inMissions.id, mission.id));

  // Point 139 — la mission se mémorise, réussie ou arrêtée. Un arrêt répété
  // devient visible par son compteur d'occurrences au lieu d'être revécu
  // identique à chaque fois.
  await retenir({
    domaine,
    probleme: objectif,
    diagnostic:
      etapes.find((e) => e.etape === "analyse" && e.statut === "fait")?.observe ??
      (contexteArchitecture || "Analyse non exécutée."),
    solution:
      etapes.find((e) => e.etape === "correctif" && e.statut === "fait")?.observe ?? "",
    resultat: statut,
    blocage: arretSur ? `${arretSur} — ${motifArret}` : "",
    missionId: mission.id,
    testRunId,
    devRequestId,
  });

  await db.insert(inMissionEtapes).values(
    etapes.map((e, i) => ({
      missionId: mission.id,
      rang: i + 1,
      etape: e.etape,
      libelle: e.libelle,
      statut: e.statut,
      capacite: e.capacite,
      permission: e.permission,
      niveauRequis: e.niveauRequis,
      observe: e.observe.slice(0, 20000),
      dureeMs: e.dureeMs,
    })),
  );

  return {
    id: mission.id,
    objectif,
    domaine,
    statut,
    arretSur,
    motif: motifArret,
    rapport,
    devRequestId,
    pipelineRunId,
    testRunId,
    etapes: etapes.map((e) => ({
      etape: e.etape,
      libelle: e.libelle,
      statut: e.statut,
      capacite: e.capacite,
      permission: e.permission,
      niveauRequis: e.niveauRequis,
      observe: e.observe,
      dureeMs: e.dureeMs,
    })),
  };
}

export async function missions(limit = 60) {
  return db.select().from(inMissions).orderBy(desc(inMissions.id)).limit(limit);
}

export async function mission(id: number) {
  const [m] = await db.select().from(inMissions).where(eq(inMissions.id, id)).limit(1);
  if (!m) return null;
  const etapes = await db
    .select()
    .from(inMissionEtapes)
    .where(eq(inMissionEtapes.missionId, id))
    .orderBy(inMissionEtapes.rang);
  return { ...m, etapes };
}
