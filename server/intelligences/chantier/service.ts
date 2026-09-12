/**
 * Chantier de développement — orchestration.
 *
 * Point d'entrée unique de ce lot : une demande en langage naturel du PDG
 * devient un plan, puis une exécution réelle par la boucle d'outils
 * existante (server/intelligences/outils/boucle.ts) — jamais un second
 * orchestrateur parallèle. C'est le modèle, à travers ses appels d'outils,
 * qui comprend, planifie l'exécution fine, crée les fichiers, installe,
 * construit, teste, corrige et prévisualise ; ce fichier ne fait que lui
 * donner le contexte du projet actif et collecter la preuve de ce qui a eu
 * lieu, pour le rapport.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../../db.js";
import { inChantierExecutions, inMessages, inSessions } from "../schema.js";
import * as projets from "./projets.js";
import * as fsChantier from "./fs.js";
import * as previewChantier from "./preview.js";
import { planifier, rendrePlan, type PlanChantier } from "./plan.js";
import { executerAvecOutils, type AppelOutilTrace } from "../outils/boucle.js";
import { TOOL_IDS_CHANTIER } from "../outils/familles/chantier.js";
import type { Projet } from "./projets.js";

const SYSTEME_CHANTIER = `Tu es MKA.P-MS Intelligence, agent du Chantier de développement, qui exécute pour le PDG de MKA.P-MS.
Tu construis et corriges de petits projets web (ex. site vitrine) réels, dans un workspace isolé, en appelant les outils du Tool Registry qui te sont proposés — jamais en te contentant de décrire ce qu'il faudrait faire.
Règles strictes :
- Si aucun projet actif n'est indiqué et que la demande implique d'en créer un, commence par project.create.
- N'écris jamais un chemin hors du projet ; les outils filesystem/code/shell refusent déjà toute sortie du workspace, mais ne tente même pas.
- Après avoir écrit ou modifié des fichiers d'un projet avec des dépendances (package.json), installe-les (dependencies.install) avant de lancer un build/test/preview.
- Lance build.run/test.run/typecheck.run/lint.run quand ils sont pertinents ; si un script n'existe pas, l'outil te le dira honnêtement — ce n'est pas une erreur à masquer, dis-le dans ta réponse finale.
- En cas d'erreur de build/test, utilise error.analyze puis corrige réellement le fichier en cause (code.fix ou filesystem.edit), puis reteste.
- Termine, quand c'est pertinent pour un site web, par preview.start puis preview.status pour vérifier que la page répond réellement.
- Ta réponse finale (texte, sans appel d'outil) résume en français ce qui a été fait, l'état réel (succès, partiel, ou bloqué et pourquoi), et ce qui reste, sans jamais prétendre qu'une étape a réussi si son résultat dit le contraire.`;

async function contexteProjet(projet: Projet | null): Promise<string> {
  if (!projet) return "Aucun projet actif pour cette session : commence par en créer un (project.create) si la demande l'implique.";
  const arbre = await fsChantier.arborescence(projet.workspacePath).catch(() => [] as string[]);
  const executions = await db
    .select()
    .from(inChantierExecutions)
    .where(eq(inChantierExecutions.projetId, projet.id))
    .orderBy(desc(inChantierExecutions.createdAt))
    .limit(8);
  const previewEtat = await previewChantier.statut(projet.id).catch(() => null);
  return [
    `Projet actif #${projet.id} — « ${projet.nom} » (${projet.typeProjet}), statut ${projet.statut}.`,
    `Fichiers existants (${arbre.length}) : ${arbre.slice(0, 80).join(", ") || "aucun encore"}.`,
    executions.length > 0
      ? `Dernières exécutions : ${executions.map((e) => `${e.type} → ${e.statut}`).join(" | ")}.`
      : "Aucune exécution encore lancée sur ce projet.",
    previewEtat ? `Aperçu : ${previewEtat.statut}${previewEtat.url ? ` (${previewEtat.url})` : ""}.` : "",
    projet.dernierPlan ? `Dernier plan connu :\n${projet.dernierPlan}` : "",
  ]
    .filter((l) => l.length > 0)
    .join("\n");
}

async function ouvrirOuCreerSession(input: { sessionId?: number | null; actorId: number }): Promise<number> {
  if (input.sessionId) {
    const [existante] = await db
      .select({ id: inSessions.id, cote: inSessions.cote })
      .from(inSessions)
      .where(eq(inSessions.id, input.sessionId))
      .limit(1);
    if (existante && existante.cote === "direction") return existante.id;
  }
  const [creee] = await db
    .insert(inSessions)
    .values({ cote: "direction", titre: "Chantier de développement", userId: input.actorId, domaine: "chantier_code" })
    .returning({ id: inSessions.id });
  return creee?.id ?? 0;
}

export interface RapportChantier {
  ok: boolean;
  sessionId: number;
  projet: Projet | null;
  plan: PlanChantier | null;
  planMotif: string;
  texteFinal: string;
  motif: string;
  iterations: number;
  limiteAtteinte: boolean;
  appelsOutils: AppelOutilTrace[];
  dernieresExecutions: (typeof inChantierExecutions.$inferSelect)[];
  preview: Awaited<ReturnType<typeof previewChantier.statut>> | null;
}

export async function demander(input: {
  message: string;
  actorId: number;
  role: string | null;
  projetId?: number | null;
  sessionId?: number | null;
  countryCode?: string | null;
  maxIterations?: number;
}): Promise<RapportChantier> {
  const sessionId = await ouvrirOuCreerSession({ sessionId: input.sessionId, actorId: input.actorId });

  let projetInitial: Projet | null = null;
  if (input.projetId) {
    projetInitial = await projets.ouvrir(input.projetId, input.actorId);
    if (!projetInitial) {
      return {
        ok: false,
        sessionId,
        projet: null,
        plan: null,
        planMotif: "",
        texteFinal: "",
        motif: `Projet #${input.projetId} introuvable ou n'appartenant pas à ce compte.`,
        iterations: 0,
        limiteAtteinte: false,
        appelsOutils: [],
        dernieresExecutions: [],
        preview: null,
      };
    }
  }

  await db.insert(inMessages).values({ sessionId, cote: "direction", role: "utilisateur", contenu: input.message.slice(0, 8000) });

  const contexte = await contexteProjet(projetInitial);
  const planResultat = await planifier({
    objectif: input.message,
    role: input.role,
    contexteProjet: contexte,
    outilsDisponibles: TOOL_IDS_CHANTIER,
  });

  const systeme = [
    SYSTEME_CHANTIER,
    "",
    `Contexte réel du projet au début de cet échange :\n${contexte}`,
    planResultat.ok && planResultat.plan ? `\nPlan préparé pour cette demande :\n${rendrePlan(planResultat.plan)}` : "",
  ]
    .filter((l) => l.length > 0)
    .join("\n");

  const resultat = await executerAvecOutils({
    moteur: "intelligences",
    role: input.role,
    systeme,
    message: input.message,
    outilsProposes: TOOL_IDS_CHANTIER,
    confidentialite: "interne",
    countryCode: input.countryCode ?? null,
    maxTokens: 2200,
    maxIterations: input.maxIterations ?? 25,
    actorId: input.actorId,
  });

  await db.insert(inMessages).values({
    sessionId,
    cote: "direction",
    role: "moteur",
    contenu: resultat.texteFinal.slice(0, 20000),
    ok: resultat.ok,
    motif: resultat.motif,
  });
  await db
    .update(inSessions)
    .set({ dernierAt: new Date() })
    .where(eq(inSessions.id, sessionId));

  // Le projet réellement actif est celui que la boucle a effectivement touché
  // (créé ou modifié) — jamais supposé à partir du seul projetId d'entrée,
  // qui peut être absent pour une toute première demande.
  let projetFinal = projetInitial;
  if (!projetFinal) {
    const [recent] = await projets.mesProjets(input.actorId, 1);
    projetFinal = recent ?? null;
  } else {
    projetFinal = await projets.ouvrir(projetFinal.id, input.actorId);
  }

  if (projetFinal) {
    await db
      .update(inSessions)
      .set({ projetActifId: projetFinal.id })
      .where(eq(inSessions.id, sessionId));
    if (planResultat.ok) await projets.majPlan(projetFinal.id, planResultat.texteBrut);
    await projets.majStatut(projetFinal.id, resultat.ok ? "pret" : "erreur");
  }

  const dernieresExecutions = projetFinal
    ? await db
        .select()
        .from(inChantierExecutions)
        .where(eq(inChantierExecutions.projetId, projetFinal.id))
        .orderBy(desc(inChantierExecutions.createdAt))
        .limit(30)
    : [];
  const preview = projetFinal ? await previewChantier.statut(projetFinal.id) : null;

  return {
    ok: resultat.ok,
    sessionId,
    projet: projetFinal,
    plan: planResultat.plan,
    planMotif: planResultat.motif,
    texteFinal: resultat.texteFinal,
    motif: resultat.motif,
    iterations: resultat.iterations,
    limiteAtteinte: resultat.limiteAtteinte,
    appelsOutils: resultat.appelsOutils,
    dernieresExecutions,
    preview,
  };
}

export { mesProjets, ouvrir as ouvrirProjet } from "./projets.js";
