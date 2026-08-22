/**
 * MKA.P-MS Intelligences — surface tRPC.
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
import { pdgProcedure, publicProcedure, router } from "../trpc.js";
import { COMMANDES, NOM_MOTEUR, REGLES } from "./regles.js";
import {
  CAPACITES,
  registre as registreCapacites,
  resume as resumeCapacites,
  type CodeCapacite,
} from "./capacites.js";
import { router as routerCapacite } from "./routeur.js";
import {
  NIVEAUX_AUTONOMIE,
  PORTEE_NIVEAU,
  etat as etatAutonomie,
  journal as journalAutonomie,
  regler as reglerAutonomie,
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
  etat,
  messages,
  proposer,
  sessions,
} from "./service.js";

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

export const intelligencesRouter = router({
  /** Nom, commandes et règles : lisibles par tous, appliquées par le serveur. */
  presentation: publicProcedure.query(() => ({
    nom: NOM_MOTEUR,
    commandes: COMMANDES.filter((c) => c.cote === "public"),
  })),

  /** Côté public — assistant automobile. */
  assistant: publicProcedure
    .input(
      z.object({
        question: z.string().min(2).max(4000),
        sessionId: z.number().int().positive().nullable().optional(),
        langue: z.string().max(8).optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      demander({
        question: input.question,
        cote: "public",
        sessionId: input.sessionId ?? null,
        userId: ctx.user?.uid ?? null,
        visiteur: empreinte(ctx.user?.uid ? `u${ctx.user.uid}` : ctx.req.ip),
        langue: input.langue ?? "fr",
        countryCode: input.countryCode ?? null,
      }),
    ),

  /** Historique d'une conversation publique (par identifiant de session). */
  filPublic: publicProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const fil = await messages(input.sessionId);
      return fil
        .filter((m) => m.cote === "public")
        .map((m) => ({
          role: m.role,
          contenu: m.contenu,
          ok: m.ok,
          motif: m.motif,
          createdAt: m.createdAt,
        }));
    }),

  // ---------------------------------------------------------------- direction

  /** Vue complète PDG : accès fournisseur réel, moteurs, coûts, commandes, règles. */
  etat: pdgProcedure.query(() => etat()),

  regles: pdgProcedure.query(() => ({ nom: NOM_MOTEUR, commandes: COMMANDES, regles: REGLES })),

  /**
   * Points 124-126 — registre des capacités avec leur état **constaté**.
   * Une capacité sans fournisseur joignable n'est jamais affichée « prête ».
   */
  capacites: pdgProcedure.query(async () => ({
    resume: await resumeCapacites(),
    capacites: await registreCapacites(),
  })),

  /**
   * Point 128 — exécution d'une capacité par le routeur interne. Le PDG choisit
   * la capacité, jamais le fournisseur : le routeur vérifie permission,
   * confidentialité et état constaté avant tout appel.
   */
  executerCapacite: pdgProcedure
    .input(
      z.object({
        capacite: z.enum(
          CAPACITES.map((c) => c.code) as [CodeCapacite, ...CodeCapacite[]],
        ),
        moteur: z.string().min(2).max(64),
        message: z.string().min(2).max(8000),
        systeme: z.string().max(2000).optional(),
        confidentialite: z
          .enum(["publique", "personnelle", "confidentielle"])
          .optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      routerCapacite({
        capacite: input.capacite,
        moteur: input.moteur,
        message: input.message,
        systeme:
          input.systeme ?? "Réponds avec exactitude. Ce que tu ignores, dis-le.",
        role: ctx.user?.role ?? null,
        confidentialite: input.confidentialite,
        countryCode: input.countryCode ?? null,
      }),
    ),

  /**
   * Point 132 — le curseur d'autonomie, domaine par domaine. Il est distinct de
   * la permission du rôle : une capacité peut exister, être permise, et rester
   * volontairement bridée.
   */
  autonomie: pdgProcedure.query(async () => ({
    niveaux: NIVEAUX_AUTONOMIE.map((n) => ({ ...n, portee: PORTEE_NIVEAU[n.niveau] })),
    domaines: await etatAutonomie(),
    journal: await journalAutonomie(60),
  })),

  reglerAutonomie: pdgProcedure
    .input(
      z.object({
        domaine: z.string().min(2).max(48),
        niveau: z.number().int().min(1).max(7),
        motif: z.string().max(2000).default(""),
      }),
    )
    .mutation(({ input, ctx }) =>
      reglerAutonomie({
        domaine: input.domaine,
        niveau: input.niveau,
        motif: input.motif,
        actorId: ctx.user?.uid,
      }),
    ),

  /**
   * Points 130-131 — une mission : un objectif décomposé, exécuté jusqu'à la
   * limite d'autorisation, avec le rapport de ce qui a réellement eu lieu.
   */
  lancerMission: pdgProcedure
    .input(
      z.object({
        objectif: z.string().min(5).max(4000),
        countryCode: z.string().max(8).nullable().optional(),
        pieces: z
          .array(
            z.object({
              type: z.enum(TYPES_PIECE),
              nom: z.string().max(200).optional(),
              texte: z.string().max(200000).optional(),
              source: z.string().max(8000000).optional(),
            }),
          )
          .max(8)
          .optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      orchestrer({
        objectif: input.objectif,
        role: ctx.user?.role ?? null,
        actorId: ctx.user?.uid,
        pieces: input.pieces ?? [],
        countryCode: input.countryCode ?? null,
      }),
    ),

  missions: pdgProcedure.query(() => listerMissions(60)),

  mission: pdgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => detailMission(input.id)),

  /** Côté direction — question libre avec contexte interne réel. */
  demander: pdgProcedure
    .input(
      z.object({
        question: z.string().min(2).max(8000),
        sessionId: z.number().int().positive().nullable().optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      demander({
        question: input.question,
        cote: "direction",
        sessionId: input.sessionId ?? null,
        userId: ctx.user?.uid ?? null,
        countryCode: input.countryCode ?? null,
      }),
    ),

  conversations: pdgProcedure
    .input(z.object({ cote: z.enum(["direction", "public"]).default("direction") }).optional())
    .query(({ input }) => sessions(input?.cote ?? "direction")),

  fil: pdgProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(({ input }) => messages(input.sessionId)),

  /** Ouvre un dossier de développement traçable (Centre de Commandes). */
  proposer: pdgProcedure
    .input(
      z.object({
        besoin: z.string().min(10).max(4000),
        sessionId: z.number().int().positive().nullable().optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      proposer({
        besoin: input.besoin,
        actorId: ctx.user?.uid,
        sessionId: input.sessionId ?? null,
        countryCode: input.countryCode ?? null,
      }),
    ),

  /** Écrit réellement le code du correctif. Proposition, jamais application. */
  coder: pdgProcedure
    .input(
      z.object({
        devRequestId: z.number().int().positive(),
        consigne: z.string().max(4000).optional(),
        sessionId: z.number().int().positive().nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      coder({
        devRequestId: input.devRequestId,
        consigne: input.consigne,
        actorId: ctx.user?.uid,
        sessionId: input.sessionId ?? null,
      }),
    ),

  /**
   * Point 134 — état de la mémoire, catégorie par catégorie. Un détenteur qui
   * ne répond pas est rendu « non mesuré », jamais « vide ».
   */
  memoire: pdgProcedure.query(async () => ({
    categories: CATEGORIES_MEMOIRE,
    cycles: CYCLES,
    etat: await etatMemoire(),
  })),

  memoireLister: pdgProcedure
    .input(
      z.object({
        categorie: z.string().max(32),
        cycle: z.enum(CYCLES).optional(),
        limit: z.number().int().min(1).max(200).default(60),
      }),
    )
    .query(({ input }) => listerMemoire(input.categorie, input.cycle, input.limit)),

  memoireRechercher: pdgProcedure
    .input(z.object({ q: z.string().min(2).max(200), limit: z.number().int().min(1).max(100).default(40) }))
    .query(({ input }) => rechercherMemoire(input.q, input.limit)),

  memoireEcrire: pdgProcedure
    .input(
      z.object({
        categorie: z.string().max(32),
        titre: z.string().min(2).max(240),
        contenu: z.string().min(1).max(200000),
        cle: z.string().max(200).optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      ecrireMemoire({
        categorie: input.categorie,
        titre: input.titre,
        contenu: input.contenu,
        cle: input.cle,
        countryCode: input.countryCode ?? null,
        source: "direction",
        actorId: ctx.user?.uid,
      }),
    ),

  memoireArchiver: pdgProcedure
    .input(z.object({ jours: z.number().int().min(7).max(3650).default(120) }).optional())
    .mutation(({ input }) => archiver(input?.jours ?? 120)),

  /** Point 139 — expériences retenues, les récurrentes en tête. */
  experiences: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(60) }).optional())
    .query(({ input }) => listerExperiences(input?.limit ?? 60)),

  /** Points 136-137 — audit de connexion de tous les moteurs, sans exception. */
  auditMoteurs: pdgProcedure.query(async () => ({
    exigences: EXIGENCES,
    ...(await auditMoteurs()),
  })),

  moteur: pdgProcedure
    .input(z.object({ nom: z.string().max(64) }))
    .query(async ({ input }) => ({
      moteur: await detailMoteur(input.nom),
      journal: await journalSante(input.nom, 30),
    })),

  appelsMoteurs: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional())
    .query(({ input }) => appelsRecents(input?.limit ?? 50)),

  /** Journal des commandes passées depuis Intelligence. */
  actions: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(60) }).optional())
    .query(({ input }) => actions(input?.limit ?? 60)),

  /** Point 145 — les dix-neuf actions de direction, avec leur disponibilité réelle. */
  pilotage: pdgProcedure.query(({ ctx }) => tableauDeBord(ctx.user?.role ?? null)),

  executerAction: pdgProcedure
    .input(
      z.object({
        code: z.enum(CODES_ACTION),
        argument: z.string().max(400).optional(),
        motif: z.string().max(600).optional(),
        phrase: z.string().max(200).optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      executerAction({
        code: input.code,
        argument: input.argument,
        motif: input.motif,
        phrase: input.phrase,
        role: ctx.user?.role ?? null,
        actorId: ctx.user?.uid ?? 0,
      }),
    ),

  journalActions: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(80) }).optional())
    .query(({ input }) => journalActions(input?.limit ?? 80)),

  /** Point 146 — permissions techniques disponibles, et ce qui est réellement attribué. */
  permissions: pdgProcedure.query(() => tableauPermissions()),

  attribuerPermissions: pdgProcedure
    .input(
      z.object({
        portee: z.enum(["role", "moteur"]),
        cible: z.string().min(1).max(64),
        permissions: z.array(z.string().max(24)).max(20),
        motif: z.string().min(3).max(600),
      }),
    )
    .mutation(({ input, ctx }) =>
      attribuerPermissions({ ...input, actorId: ctx.user?.uid }),
    ),

  journalPermissions: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(60) }).optional())
    .query(({ input }) => journalPermissions(input?.limit ?? 60)),

  /** Points 147-148 — usage réel par fournisseur et évaluation permanente. */
  evaluation: pdgProcedure
    .input(z.object({ jours: z.number().int().min(1).max(365).default(30) }).optional())
    .query(async ({ input }) => ({
      criteres: CRITERES,
      libelles: LIBELLE_CRITERE,
      ...(await evaluation(input?.jours ?? 30)),
    })),

  appels: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(40) }).optional())
    .query(({ input }) => derniersAppels(input?.limit ?? 40)),

  noterAppel: pdgProcedure
    .input(z.object({ appelId: z.number().int().positive(), note: z.number().int().min(1).max(5) }))
    .mutation(({ input, ctx }) => noterAppel({ ...input, actorId: ctx.user?.uid })),

  /** Point 149 — mode shadow : comparaisons, paliers et preuves. */
  shadow: pdgProcedure.query(async () => ({
    paliers: PALIERS,
    capacites: await etatShadow(),
    resume: await resumeShadow(),
  })),

  reglerShadow: pdgProcedure
    .input(
      z.object({
        capacite: z.string().min(1).max(32),
        candidat: z.string().max(48).optional(),
        actif: z.boolean().optional(),
        part: z.number().int().min(0).max(100).optional(),
        motif: z.string().min(3).max(600),
      }),
    )
    .mutation(({ input, ctx }) => reglerShadow({ ...input, actorId: ctx.user?.uid })),

  comparaisonsShadow: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(60) }).optional())
    .query(({ input }) => comparaisonsShadow(input?.limit ?? 60)),

  detachementFournisseur: pdgProcedure
    .input(z.object({ capacite: z.string().min(1).max(32) }))
    .query(({ input }) => detachementPossible(input.capacite)),
});
