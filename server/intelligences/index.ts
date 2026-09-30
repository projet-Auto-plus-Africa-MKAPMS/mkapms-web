/**
 * MKA.P-MS AI — surface tRPC.
 *
 * Deux côtés, deux niveaux d'accès contrôlés côté serveur :
 *  - `direction` : réservé au compte PDG (`pdgProcedure`). Contexte interne,
 *    commandes, écriture de code.
 *  - `public` : ouvert aux visiteurs (`publicProcedure`), assistant automobile
 *    encadré, sans aucun accès interne.
 *
 * Masquer un bouton ne protège rien : la séparation est faite ici.
 */
import { z } from "zod";
import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { pdgProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import { COMMANDES, NOM_MOTEUR, REGLES } from "./regles.js";
import {
  CAPACITES,
  registre as registreCapacites,
  resume as resumeCapacites,
  type CodeCapacite,
} from "./capacites.js";
import { router as routerCapacite } from "./routeur.js";
import { creerAppelVocalTempsReel, etatConfiguration, etatServicePublic } from "./provider.js";
import {
  NIVEAUX_AUTONOMIE,
  PORTEE_NIVEAU,
  etat as etatAutonomie,
  etatAgentAutonome,
  journal as journalAutonomie,
  regler as reglerAutonomie,
  reglerAgentAutonome,
} from "./autonomie.js";
import {
  orchestrer,
  missions as listerMissions,
  mission as detailMission,
} from "./orchestrateur.js";
import { TYPES_PIECE } from "./multimodal.js";
import {
  CODES_ACTION,
  executer as executerAction,
  journal as journalActions,
  tableauDeBord,
} from "./actions.js";
import {
  attribuer as attribuerPermissions,
  journal as journalPermissions,
  tableau as tableauPermissions,
} from "./permissions.js";
import {
  FONCTIONS,
  etat as etatFonctions,
  regler as reglerFonction,
  resume as resumeFonctions,
} from "./fonctions.js";
import {
  listerApprobateurs,
  rechercherCandidats as rechercherCandidatsApprobateurs,
  designerApprobateur,
  retirerApprobateur,
} from "./deploiement/approbateurs.js";
import {
  ajouterSecret as ajouterSecretCoffre,
  contenuSecretSchema,
  etatCoffre,
  journalCoffre,
  listerSecrets as listerSecretsCoffre,
  remplacerSecret as remplacerSecretCoffre,
  supprimerSecret as supprimerSecretCoffre,
} from "./coffre.js";
import {
  enAttentePour as deploiementsEnAttentePour,
  historique as listerHistoriqueDeploiements,
  approuver as approuverDeploiementSvc,
  refuser as refuserDeploiementSvc,
  verifierPublication as verifierPublicationDeploiementSvc,
} from "./deploiement/service.js";
import {
  levierAutonomie,
  marquer as marquerEtape,
  plan as planAutonomie,
} from "./plan-autonomie.js";
import {
  contrat as contratDeveloppeur,
  creer as creerCle,
  journal as journalDeveloppeur,
  lister as listerCles,
  regler as reglerCle,
  revoquer as revoquerCle,
} from "./developpeur.js";
import {
  CRITERES,
  LIBELLE_CRITERE,
  derniers as derniersAppels,
  evaluation,
  noter as noterAppel,
} from "./evaluation.js";
import {
  PALIERS,
  comparaisons as comparaisonsShadow,
  detachementPossible,
  etat as etatShadow,
  regler as reglerShadow,
  resume as resumeShadow,
} from "./shadow.js";
import {
  CATEGORIES as CATEGORIES_MEMOIRE,
  CYCLES,
  archiver,
  ecrire as ecrireMemoire,
  etat as etatMemoire,
  experiences as listerExperiences,
  lister as listerMemoire,
  rechercher as rechercherMemoire,
} from "./memoire.js";
import {
  EXIGENCES,
  appelsRecents,
  audit as auditMoteurs,
  journalSante,
  moteur as detailMoteur,
} from "./moteurs.js";
import {
  actions,
  coder,
  demander,
  enregistrerEchangeVocal,
  domaines,
  etat,
  messages,
  proposer,
  reglerDomaine,
  renommerConversation,
  sessions,
  supprimerConversation,
  verifierProprieteConversation,
  verifierProprieteConversationPublique,
} from "./service.js";
import {
  compter as compterVehicules,
  interpreter as interpreterRechercheVehicule,
} from "./recherche.js";
import {
  demander as demanderChantier,
  mesProjets as mesProjetsChantier,
  ouvrirProjet as ouvrirProjetChantier,
} from "./chantier/service.js";
import { arborescence as arborescenceChantier } from "./chantier/fs.js";
import { statut as statutApercuChantier, verifierReponse as verifierReponseApercuChantier } from "./chantier/preview.js";
import { registre as registreUnivers, univers as universDetail } from "./univers/registre.js";
import { rapportCouverture } from "./univers/couverture.js";
import { resoudreContexte } from "./contexte/service.js";
import { enregistrerRelease, historique as historiqueVersions, registre as registreVersions } from "../governance/versions.js";
import { SETTINGS_REGISTRY, resume as resumeReglages } from "../governance/settings-registry.js";
import {
  declencher as declencherAudit,
  dernierAudit,
  historique as historiqueAudits,
  prochaineEcheance,
} from "../governance/audit-semestriel.js";
import {
  alertesMigration,
  couverture as couvertureDependances,
  detail as detailDependance,
  registre as registreDependances,
} from "../governance/dependencies.js";
import * as memoireUtilisateur from "./memoire-utilisateur.js";
import * as memoireProjet from "./memoire-projet.js";
import * as fichiers from "./fichiers.js";
import * as productionsMedia from "./media-productions.js";
import { fichierAudio } from "./audio-input.js";
import * as connaissance from "./connaissance.js";
import { rechercherGlobale, type SourceRecherche } from "./recherche-globale.js";
import { retrieve as ragRetrieveInterne, answer as ragAnswerInterne } from "./rag.js";
import { getStats as statsRegistreMoteurs } from "../engine-registry/service.js";

type NiveauIndicateur = "ok" | "attention" | "ko" | "inconnu";
interface IndicateurAccueil {
  niveau: NiveauIndicateur;
  libelle: string;
  detail: string;
}

/** Indicateurs de l'accueil du workspace : chaque valeur est constatée, jamais affirmée d'avance. */
async function indicateursAccueil(ownerId: number): Promise<{
  ia: IndicateurAccueil;
  documents: IndicateurAccueil;
  moteurs: IndicateurAccueil;
  securite: IndicateurAccueil;
  /** Adresse publique de la Boutique (SHOP_PUBLIC_URL), null tant qu'elle n'est pas configurée. */
  boutique: string | null;
  observeLe: string;
}> {
  const inconnu = (detail: string): IndicateurAccueil => ({ niveau: "inconnu", libelle: "Non vérifié", detail });

  const [ia, documents, moteurs, securite] = await Promise.all([
    (async (): Promise<IndicateurAccueil> => {
      const conf = etatConfiguration();
      if (!conf.operational) return { niveau: "ko", libelle: "Non connectée", detail: conf.guidance };
      return {
        niveau: "ok",
        libelle: "Connectée",
        detail: `${conf.activeProviders}/${conf.totalProviders} fournisseur(s) configuré(s).`,
      };
    })(),
    (async (): Promise<IndicateurAccueil> => {
      try {
        const liste = await fichiers.mesFichiers(ownerId);
        if (liste.length === 0) return { niveau: "attention", libelle: "Aucun", detail: "Aucun document déposé pour ce compte." };
        return { niveau: "ok", libelle: `${liste.length}`, detail: `${liste.length} document(s) disponibles.` };
      } catch (e) {
        return inconnu(e instanceof Error ? e.message : "Liste des documents illisible.");
      }
    })(),
    (async (): Promise<IndicateurAccueil> => {
      try {
        const s = await statsRegistreMoteurs();
        const detail = `${s.activeEngines}/${s.totalEngines} actifs · ${s.degradedEngines} dégradé(s) · ${s.downEngines} arrêté(s).`;
        if (s.downEngines > 0) return { niveau: "ko", libelle: `${s.downEngines} arrêté(s)`, detail };
        if (s.degradedEngines > 0) return { niveau: "attention", libelle: `${s.degradedEngines} dégradé(s)`, detail };
        return { niveau: "ok", libelle: `${s.activeEngines} actifs`, detail };
      } catch (e) {
        return inconnu(e instanceof Error ? e.message : "Registre des moteurs illisible.");
      }
    })(),
    (async (): Promise<IndicateurAccueil> => {
      try {
        const [alertes, tableau] = await Promise.all([alertesMigration(), tableauPermissions()]);
        const ecarts = tableau.roles.filter((r) => r.ecart.length > 0).length;
        if (alertes.length > 0) {
          return { niveau: "attention", libelle: `${alertes.length} alerte(s)`, detail: alertes.slice(0, 3).join(" · ") };
        }
        return {
          niveau: "ok",
          libelle: ecarts > 0 ? `${ecarts} rôle(s) ajusté(s)` : "Par défaut",
          detail: `${tableau.permissions.length} permissions contrôlées, ${tableau.roles.length} rôles, aucune alerte de dépendance.`,
        };
      } catch (e) {
        return inconnu(e instanceof Error ? e.message : "Permissions illisibles.");
      }
    })(),
  ]);

  const shopUrl = (process.env.SHOP_PUBLIC_URL ?? "").trim();
  const boutique = /^https:\/\/[a-z0-9.-]+(\/[^\s]*)?$/i.test(shopUrl) ? shopUrl : null;

  return { ia, documents, moteurs, securite, boutique, observeLe: new Date().toISOString() };
}

export const INTELLIGENCES_META = {
  code: "intelligences",
  name: NOM_MOTEUR,
  role: "Appelle réellement les fournisseurs de modèles, sépare le côté direction du côté public, et trace chaque échange, chaque coût et chaque commande.",
} as const;

/** Empreinte de visiteur pour les quotas : jamais l'adresse en clair. */
function empreinte(valeur: string | undefined): string {
  return createHash("sha256")
    .update(valeur ?? "anonyme")
    .digest("hex")
    .slice(0, 32);
}

/**
 * Traduit la vérification testable de service.ts (`verifierProprieteConversation`)
 * en refus HTTP tRPC. La règle elle-même vit dans le service, pas ici.
 */
async function exigerProprieteConversation(sessionId: number, userId: number): Promise<void> {
  const verdict = await verifierProprieteConversation(sessionId, userId);
  if (!verdict.ok) {
    throw new TRPCError({
      code: verdict.motif === "Conversation introuvable." ? "NOT_FOUND" : "FORBIDDEN",
      message: verdict.motif,
    });
  }
}

export const intelligencesRouter = router({
  /** Échange SDP WebRTC : la clé fournisseur reste exclusivement côté serveur. */
  creerSessionVocale: pdgProcedure.input(z.object({
    sdp: z.string().min(64).max(100_000),
    mode: z.enum(["dictee", "conversation"]),
    langue: z.string().max(16).optional(),
    voix: z.string().max(24).optional(),
  }).strict()).mutation(async ({ input, ctx }) => {
    try {
      const safetyId = createHash("sha256").update(`mkapms:${ctx.user.uid}`).digest("hex");
      const sdp = await creerAppelVocalTempsReel(input.sdp, input.mode, { langue: input.langue, voix: input.voix, safetyId });
      return { sdp };
    } catch {
      throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Le service vocal temps réel est momentanément indisponible." });
    }
  }),

  /**
   * Dictée mobile éphémère : l'audio n'est ni stocké en base ni ajouté à la
   * mémoire. Ce chemin sert de repli fiable à SpeechRecognition sur iPhone.
   */
  transcrireDictee: pdgProcedure.input(z.object({ audio: fichierAudio }).strict())
    .mutation(async ({ input, ctx }) => {
      const resultat = await routerCapacite({
        productionMedia: true,
        capacite: "transcription",
        moteur: "command_center",
        role: ctx.user.role,
        audio: input.audio,
        confidentialite: "personnelle",
        message: "Transcrire ce court segment de dictée en français, sans commentaire.",
        systeme: "Renvoyer uniquement la transcription fidèle du segment audio.",
      });
      if (!resultat.ok || resultat.media?.mime !== "text/plain" || !resultat.media.base64) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: resultat.motifPublic || "Transcription momentanément indisponible." });
      }
      const texte = Buffer.from(resultat.media.base64, "base64").toString("utf8").trim();
      if (!texte) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune parole détectée." });
      return { texte: texte.slice(0, 4_000) };
    }),

  mediaProduire: pdgProcedure.input(productionsMedia.demandeMedia)
    .mutation(({input,ctx}) => productionsMedia.produire(ctx.user.uid,ctx.user.role,input)),
  mediaListe: pdgProcedure.query(({ctx})=>productionsMedia.lister(ctx.user.uid)),
  mediaLire: pdgProcedure.input(z.object({id:z.string().uuid()}))
    .query(({input,ctx})=>productionsMedia.lire(input.id,ctx.user.uid)),

  /** Nom, commandes et règles : lisibles par tous, appliquées par le serveur. */
  presentation: publicProcedure.query(() => ({
    nom: NOM_MOTEUR,
    commandes: COMMANDES.filter((c) => c.cote === "public"),
  })),

  /**
   * LOT IA02A — état PUBLIC du service : disponible/dégradé/indisponible,
   * identité MKA.P-MS AI uniquement. Aucun label de fournisseur,
   * aucune variable d'environnement, aucune URL — voir `configStatusDirection`
   * pour la vue détaillée, réservée à la direction.
   */
  configStatus: publicProcedure.query(() => etatServicePublic()),

  /**
   * Vue détaillée (fournisseur, variable d'environnement, URL d'obtention de
   * clé) — réservée à la direction (Centre Commandes, Centre Intelligence &
   * Coûts). Distincte de `configStatus`, qui reste la seule procédure que les
   * écrans publics ou utilisateur ont le droit d'appeler.
   */
  configStatusDirection: pdgProcedure.query(() => etatConfiguration()),

  /**
   * Domaines d'assistance réellement ouverts au public. La liste sert à
   * l'écran : un domaine fermé n'y figure pas, il n'est pas proposé puis refusé.
   */
  domainesPublics: publicProcedure.query(async () => {
    const tous = await domaines();
    return tous
      .filter((d) => d.actif && d.cotes.includes("public"))
      .map((d) => ({ code: d.code, libelle: d.libelle, effet: d.effet, limite: d.limite }));
  }),

  /** Côté public — assistant mondial : automobile, vie quotidienne, travail, et domaines ouverts. */
  assistant: publicProcedure
    .input(
      z.object({
        question: z.string().min(2).max(4000),
        domaine: z.string().max(48).optional(),
        sessionId: z.number().int().positive().nullable().optional(),
        langue: z.string().max(8).optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      demander({
        question: input.question,
        cote: "public",
        domaine: input.domaine ?? null,
        sessionId: input.sessionId ?? null,
        userId: ctx.user?.uid ?? null,
        visiteur: empreinte(ctx.user?.uid ? `u${ctx.user.uid}` : ctx.req.ip),
        langue: input.langue ?? "fr",
        countryCode: input.countryCode ?? null,
      }),
    ),

  /**
   * Recherche véhicule dictée ou écrite en langage naturel → critères réels.
   * Public : c'est l'acheteur qui parle. Aucun critère n'est deviné ; ce qui
   * n'a pas été compris est rendu tel quel pour que l'écran le dise.
   */
  interpreterRecherche: publicProcedure
    .input(
      z.object({
        texte: z.string().min(2).max(500),
        pays: z.string().max(4).nullable().optional(),
        langue: z.string().max(8).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const lecture = await interpreterRechercheVehicule({
        texte: input.texte,
        pays: input.pays ?? null,
        langue: input.langue ?? "fr",
      });
      return { ...lecture, resultats: await compterVehicules(lecture.criteres) };
    }),

  /** Historique d'une conversation publique (par identifiant de session). */
  filPublic: publicProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const visiteur = empreinte(ctx.user?.uid ? `u${ctx.user.uid}` : ctx.req.ip);
      const acces = await verifierProprieteConversationPublique(input.sessionId, visiteur);
      if (!acces.ok) {
        throw new TRPCError({
          code: acces.motif === "Conversation introuvable." ? "NOT_FOUND" : "FORBIDDEN",
          message: acces.motif,
        });
      }
      const fil = await messages(input.sessionId);
      // LOT IA02A — motifPublic, jamais motif (détail fournisseur) : cette
      // procédure reste publique, mais l'empreinte de la requête doit être
      // celle qui a créé la session ; un identifiant seul n'accorde rien.
      return fil
        .filter((m) => m.cote === "public")
        .map((m) => ({
          role: m.role,
          contenu: m.contenu,
          ok: m.ok,
      