/**
 * Points 71-72-75 — Centre de Commandes MKA.P-MS.
 *
 * Ce que ce service refuse de faire, volontairement :
 *  • il n'exécute jamais une demande qu'il n'a pas comprise avec certitude ;
 *  • une commande dictée sans authentification forte réellement constatée ne
 *    devient pas une action, même venant du PDG ;
 *  • une commande de niveau critique n'est jamais exécutée par la voix : elle
 *    ouvre une demande de confirmation renforcée (point 74) ;
 *  • l'agent développeur ne prétend pas produire du code : tant qu'aucune
 *    capacité de génération n'est branchée, le dossier le dit et s'arrête au
 *    plan ;
 *  • aucun dossier de développement ne va en production sans passer par le
 *    pipeline obligatoire (point 76).
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { comparePassword } from "../auth.js";
import { users } from "../schema.js";
import { countryCountries } from "../country-os/index.js";
import { createActionTask } from "../smart-engine/services/action-tasks.js";
import { logActivity } from "../smart-engine/services/activity-log.js";
import {
  classifyRisk,
  recordPipelineStep,
  requestCriticalConfirmation,
  startPipeline,
} from "../resilience/service.js";
import { ccCommands, ccDevRequests, ccVoiceSessions } from "./schema.js";
import { COMMAND_INTENTS, interpret, normalize } from "./nlu.js";

/** Durée d'une session vocale : une voix authentifiée ne vaut pas indéfiniment. */
const VOICE_SESSION_MINUTES = 15;

/**
 * Capacité de génération de code. Elle est fausse tant qu'aucun générateur
 * n'est réellement branché : c'est ce qui empêche d'annoncer un agent
 * développeur autonome qui n'existe pas encore.
 */
export const CODE_GENERATION_AVAILABLE = false;

/**
 * Point 103 — la capacité est désormais relevée sur l'AI Fabric au lieu d'être
 * figée : si un fournisseur de modèle est réellement branché, l'agent
 * développeur peut aller au-delà du plan ; sinon il s'arrête et écrit pourquoi.
 */
async function generationState(): Promise<{ disponible: boolean; detail: string }> {
  const { codeGenerationState } = await import("../smart-audit/service.js");
  const s = await codeGenerationState();
  return { disponible: s.disponible, detail: s.detail };
}

/** Moteurs/modules que l'analyse sait rattacher à un besoin exprimé. */
const SCOPE_KEYWORDS: Record<string, string[]> = {
  location: ["location", "louer", "reservation"],
  paiement: ["paiement", "payment", "stripe", "encaissement", "virement", "remboursement"],
  seo: ["seo", "referencement", "google", "sitemap", "mot cle", "mots cles"],
  redirection: ["redirection", "404", "lien casse", "url"],
  avis: ["avis", "reputation", "note", "commentaire"],
  annonces: ["annonce", "annonces", "depot", "photo", "photos"],
  comptabilite: ["comptabilite", "facture", "tva", "comptable"],
  pays: ["pays", "juridiction", "reglementation", "loi"],
  moteurs: ["moteur", "moteurs", "registre", "sonde"],
  resilience: ["maintenance", "urgence", "fermeture", "pipeline", "rollback"],
};

async function activeCountries(): Promise<{ code: string; name: string }[]> {
  const rows = await db
    .select({ code: countryCountries.code, name: countryCountries.nameFr })
    .from(countryCountries)
    .where(eq(countryCountries.active, true));
  return rows;
}

export interface SubmitCommandInput {
  text: string;
  channel: "ecrit" | "vocal";
  actorId: number;
  language?: string;
  voiceSessionId?: number;
}

export interface CommandResult {
  id: number;
  verdict: string;
  reason: string;
  intent: string | null;
  effect: string | null;
  riskLevel: number;
  actionTaskId: number | null;
  candidates: string[];
  entities: Record<string, string>;
}

/**
 * Point 71 — demande → interprétation → permissions → action structurée →
 * journal. Une demande comprise mais non exécutable automatiquement le dit :
 * elle n'est jamais présentée comme faite.
 */
export async function submitCommand(input: SubmitCommandInput): Promise<CommandResult> {
  const countries = await activeCountries();
  const lu = interpret(input.text, countries);

  // Point 72 — une commande dictée exige une session vocale authentifiée.
  if (input.channel === "vocal") {
    const session = input.voiceSessionId
      ? await voiceSession(input.voiceSessionId, input.actorId)
      : null;
    if (!session) {
      return persist(input, lu, {
        verdict: "refusee",
        reason:
          "Commande vocale refusée : aucune session vocale authentifiée. Une voix seule ne suffit pas à autoriser une action.",
      });
    }
  }

  if (lu.verdict !== "comprise" || !lu.intent) {
    return persist(input, lu, { verdict: lu.verdict, reason: lu.reason });
  }

  const intent = lu.intent;
  const niveau = classifyRisk(intent.actionType ?? intent.code, intent.riskLevel);

  // Point 74 — le critique ne part jamais d'une phrase, écrite ou dictée.
  if (niveau >= 3) {
    const demande = await requestCriticalConfirmation({
      actionType: intent.actionType ?? intent.code,
      title: intent.label,
      impact: `Demandé par commande ${input.channel === "vocal" ? "vocale" : "écrite"} : « ${input.text.trim()} ». ${intent.effect}`,
      reversible: intent.code === "ouvrir_public",
      countryCode: lu.countryCode,
      params: lu.entities,
      requestedBy: input.actorId,
    });
    return persist(input, lu, {
      verdict: "comprise",
      reason: `Action critique comprise mais non exécutée : ressaisir « ${demande.challenge} » dans le Centre de Résilience. Une commande ne suffit pas pour une opération de ce niveau.`,
    });
  }

  // Intention de lecture : rien à exécuter, la réponse est l'affichage.
  if (!intent.actionType) {
    if (intent.code === "preparer_correction") {
      const dossier = await openDevRequest({
        need: input.text.trim(),
        countryCode: lu.countryCode,
        requestedBy: input.actorId,
      });
      return persist(input, lu, {
        verdict: "comprise",
        reason: `Dossier de développement #${dossier.id} ouvert : analyse et plan établis. ${
          CODE_GENERATION_AVAILABLE
            ? "La génération de code est disponible."
            : "Aucune génération de code n'est branchée aujourd'hui : le dossier s'arrête au plan, à réaliser par un humain."
        }`,
      });
    }
    return persist(input, lu, {
      verdict: "comprise",
      reason: `${intent.effect} Aucune modification : cette demande est une consultation.`,
    });
  }

  const tache = await createActionTask({
    source: input.channel === "vocal" ? "commande_vocale" : "commande_ecrite",
    actionType: intent.actionType,
    title: intent.label,
    description: `Demande reçue : « ${input.text.trim()} ». ${intent.effect}`,
    params: lu.entities,
    riskLevel: niveau,
    countryCode: lu.countryCode,
    requestedBy: input.actorId,
  });

  return persist(input, lu, {
    verdict: "comprise",
    reason: `Action #${tache.id} créée dans le Centre d'Actions : ${intent.effect} Son résultat y sera vérifié étape par étape.`,
    actionTaskId: tache.id,
  });
}

async function persist(
  input: SubmitCommandInput,
  lu: ReturnType<typeof interpret>,
  out: { verdict: string; reason: string; actionTaskId?: number },
): Promise<CommandResult> {
  const [row] = await db
    .insert(ccCommands)
    .values({
      channel: input.channel,
      rawText: input.text.trim().slice(0, 2000),
      language: input.language ?? "fr",
      intent: lu.intent?.code ?? null,
      actionType: lu.intent?.actionType ?? null,
      entities: lu.entities,
      countryCode: lu.countryCode,
      riskLevel: lu.intent?.riskLevel ?? 1,
      verdict: out.verdict,
      reason: out.reason,
      actionTaskId: out.actionTaskId ?? null,
      voiceSessionId: input.voiceSessionId ?? null,
      actorId: input.actorId,
    })
    .returning();

  if (input.voiceSessionId) {
    await db
      .update(ccVoiceSessions)
      .set({ commandsCount: sql`${ccVoiceSessions.commandsCount} + 1` })
      .where(eq(ccVoiceSessions.id, input.voiceSessionId));
  }

  await logActivity({
    action: `commande_${input.channel}`,
    userId: input.actorId,
    targetType: "cc_command",
    targetId: row.id,
    data: { intent: lu.intent?.code ?? null, entities: lu.entities },
    result: out.verdict,
    proposedDecision: out.reason,
  });

  return {
    id: row.id,
    verdict: out.verdict,
    reason: out.reason,
    intent: lu.intent?.code ?? null,
    effect: lu.intent?.effect ?? null,
    riskLevel: lu.intent?.riskLevel ?? 1,
    actionTaskId: out.actionTaskId ?? null,
    candidates: lu.candidates,
    entities: lu.entities,
  };
}

export async function listCommands(limit = 120) {
  return db.select().from(ccCommands).orderBy(desc(ccCommands.createdAt)).limit(limit);
}

/** Demandes non comprises : ce que la plateforme ne sait pas encore faire. */
export async function unmatchedCommands(limit = 60) {
  return db
    .select()
    .from(ccCommands)
    .where(eq(ccCommands.verdict, "hors_perimetre"))
    .orderBy(desc(ccCommands.createdAt))
    .limit(limit);
}

// ─── Point 72 — sessions vocales ─────────────────────────────────────────

/**
 * Ouvre une session vocale APRÈS avoir réellement vérifié un second facteur :
 * ici la ressaisie du mot de passe. Sans vérification réussie, aucune session
 * n'est créée — la case « authentifié » n'est jamais cochée à la confiance.
 */
export async function openVoiceSession(input: {
  actorId: number;
  password: string;
  device?: string;
}): Promise<{ ok: boolean; detail: string; sessionId: number | null; expiresAt: Date | null }> {
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, input.actorId))
    .limit(1);
  if (!user) {
    return { ok: false, detail: "Compte introuvable.", sessionId: null, expiresAt: null };
  }
  if (!user.passwordHash) {
    return {
      ok: false,
      detail:
        "Ce compte n'a pas de mot de passe interne (connexion externe) : aucun second facteur ne peut être vérifié ici, donc aucune session vocale n'est ouverte.",
      sessionId: null,
      expiresAt: null,
    };
  }
  const ok = await comparePassword(input.password, user.passwordHash);
  if (!ok) {
    await logActivity({
      action: "commande_vocale_auth_echec",
      userId: input.actorId,
      targetType: "cc_voice_session",
      result: "echec",
      proposedDecision: "Ressaisie du mot de passe incorrecte : aucune session vocale ouverte.",
    });
    return {
      ok: false,
      detail: "Authentification forte refusée : aucune session vocale n'est ouverte.",
      sessionId: null,
      expiresAt: null,
    };
  }

  const expiresAt = new Date(Date.now() + VOICE_SESSION_MINUTES * 60_000);
  const [row] = await db
    .insert(ccVoiceSessions)
    .values({
      actorId: input.actorId,
      strongAuthMethod: "mot_de_passe_ressaisi",
      strongAuthAt: new Date(),
      device: input.device?.slice(0, 120) ?? null,
      expiresAt,
    })
    .returning();

  await logActivity({
    action: "commande_vocale_session",
    userId: input.actorId,
    targetType: "cc_voice_session",
    targetId: row.id,
    result: "ok",
    proposedDecision: `Session vocale ouverte pour ${VOICE_SESSION_MINUTES} minutes.`,
  });

  return {
    ok: true,
    detail: `Session vocale ouverte pour ${VOICE_SESSION_MINUTES} minutes. Les commandes critiques resteront soumises à confirmation renforcée.`,
    sessionId: row.id,
    expiresAt,
  };
}

/** Session valide et appartenant bien à l'acteur, sinon null. */
export async function voiceSession(id: number, actorId: number) {
  const [row] = await db
    .select()
    .from(ccVoiceSessions)
    .where(and(eq(ccVoiceSessions.id, id), eq(ccVoiceSessions.actorId, actorId)))
    .limit(1);
  if (!row) return null;
  if (row.status !== "ouverte") return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db
      .update(ccVoiceSessions)
      .set({ status: "expiree", closedAt: new Date() })
      .where(eq(ccVoiceSessions.id, id));
    return null;
  }
  return row;
}

export async function closeVoiceSession(id: number, actorId: number) {
  await db
    .update(ccVoiceSessions)
    .set({ status: "fermee", closedAt: new Date() })
    .where(and(eq(ccVoiceSessions.id, id), eq(ccVoiceSessions.actorId, actorId)));
  return { ok: true };
}

export async function listVoiceSessions(limit = 40) {
  return db.select().from(ccVoiceSessions).orderBy(desc(ccVoiceSessions.createdAt)).limit(limit);
}

// ─── Point 75 — agent développeur ────────────────────────────────────────

/** Rattache un besoin aux modules réellement concernés, sans en inventer. */
function analyseScope(need: string): string[] {
  const text = normalize(need);
  const scope: string[] = [];
  for (const [module, mots] of Object.entries(SCOPE_KEYWORDS)) {
    if (mots.some((m) => text.includes(m))) scope.push(module);
  }
  return scope;
}

/**
 * Ouvre un dossier de développement : besoin → analyse → plan. Le plan est
 * celui du point 75, et le dossier ne peut pas sauter le pipeline du point 76.
 */
export async function openDevRequest(input: {
  need: string;
  countryCode?: string | null;
  requestedBy?: number;
}) {
  const generation = await generationState();
  const scope = analyseScope(input.need);
  const analysis =
    scope.length > 0
      ? `Modules identifiés à partir du besoin : ${scope.join(", ")}. Les dépendances de ces moteurs devront être contrôlées avant intégration.`
      : "Aucun module n'a pu être rattaché au besoin avec certitude : le périmètre doit être précisé par un humain avant toute écriture de code.";

  const plan: { step: string; detail: string }[] = [
    { step: "analyse_architecture", detail: analysis },
    {
      step: "generation_code",
      detail: generation.detail,
    },
    { step: "environnement_isole", detail: "Le travail se fait hors production (bac à sable puis préproduction)." },
    { step: "tests", detail: "Tests et non-régression obligatoires avant toute validation." },
    { step: "validation", detail: "Validation humaine selon le niveau de risque." },
    { step: "deploiement", detail: "Mise en production seulement après le passage complet du pipeline." },
    { step: "surveillance", detail: "Surveillance après mise en production, avec retour arrière disponible." },
  ];

  const [row] = await db
    .insert(ccDevRequests)
    .values({
      need: input.need.slice(0, 4000),
      scope,
      analysis,
      plan,
      riskLevel: 2,
      countryCode: input.countryCode ?? null,
      generationAvailable: generation.disponible,
      status: scope.length > 0 ? "plan_pret" : "bloque",
      blockedReason:
        scope.length > 0
          ? null
          : "Périmètre non identifié : le dossier attend une précision humaine avant d'aller plus loin.",
      requestedBy: input.requestedBy ?? null,
    })
    .returning();
  return row;
}

/**
 * Envoie un dossier dans le pipeline obligatoire. Le dossier n'exécute rien :
 * il devient un passage traçable qui devra franchir ses étapes.
 */
export async function sendDevRequestToPipeline(input: {
  id: number;
  rollbackPlan: string;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string; pipelineRunId: number | null }> {
  const [dossier] = await db
    .select()
    .from(ccDevRequests)
    .where(eq(ccDevRequests.id, input.id))
    .limit(1);
  if (!dossier) return { ok: false, detail: "Dossier introuvable.", pipelineRunId: null };
  if (dossier.pipelineRunId) {
    return {
      ok: false,
      detail: `Ce dossier est déjà rattaché au passage #${dossier.pipelineRunId}.`,
      pipelineRunId: dossier.pipelineRunId,
    };
  }
  if (dossier.status === "bloque") {
    return {
      ok: false,
      detail: dossier.blockedReason ?? "Dossier bloqué : périmètre à préciser avant le pipeline.",
      pipelineRunId: null,
    };
  }
  const rollback = input.rollbackPlan.trim();
  if (rollback.length < 10) {
    return {
      ok: false,
      detail:
        "Retour arrière non décrit : un développement sans moyen de revenir en arrière n'entre pas dans le pipeline.",
      pipelineRunId: null,
    };
  }

  const run = await startPipeline({
    origin: "agent_developpeur",
    originRef: `dev-${dossier.id}`,
    title: dossier.need.slice(0, 240),
    riskLevel: (dossier.riskLevel as 1 | 2 | 3) ?? 2,
    rollbackPlan: rollback,
    createdBy: input.actorId,
  });

  // Le bac à sable est la seule étape que l'ouverture du dossier atteste :
  // le travail commence hors production. Les suivantes devront être prouvées.
  await recordPipelineStep({
    id: run.id,
    step: "sandbox",
    status: "ok",
    detail: `Dossier de développement #${dossier.id} ouvert hors production. ${dossier.analysis ?? ""}`.trim(),
  });

  await db
    .update(ccDevRequests)
    .set({ pipelineRunId: run.id, status: "en_pipeline", updatedAt: new Date() })
    .where(eq(ccDevRequests.id, dossier.id));

  return {
    ok: true,
    detail: `Passage #${run.id} ouvert. Les étapes tests, sécurité, non-régression, préproduction et validation restent à franchir avant la production.`,
    pipelineRunId: run.id,
  };
}

export async function listDevRequests(limit = 80) {
  return db.select().from(ccDevRequests).orderBy(desc(ccDevRequests.createdAt)).limit(limit);
}

export async function updateDevRequest(input: {
  id: number;
  analysis?: string;
  scope?: string[];
  riskLevel?: 1 | 2 | 3;
}): Promise<{ ok: boolean; detail: string }> {
  const [dossier] = await db
    .select()
    .from(ccDevRequests)
    .where(eq(ccDevRequests.id, input.id))
    .limit(1);
  if (!dossier) return { ok: false, detail: "Dossier introuvable." };
  const scope = input.scope ?? dossier.scope;
  await db
    .update(ccDevRequests)
    .set({
      analysis: input.analysis ?? dossier.analysis,
      scope,
      riskLevel: input.riskLevel ?? dossier.riskLevel,
      status: dossier.status === "bloque" && scope.length > 0 ? "plan_pret" : dossier.status,
      blockedReason: scope.length > 0 ? null : dossier.blockedReason,
      updatedAt: new Date(),
    })
    .where(eq(ccDevRequests.id, input.id));
  return { ok: true, detail: "Dossier mis à jour." };
}

// ─── Statistiques & santé ────────────────────────────────────────────────

export async function commandStats() {
  const [cmd] = await db
    .select({
      total: sql<number>`count(*)::int`,
      comprises: sql<number>`count(*) filter (where ${ccCommands.verdict} = 'comprise')::int`,
      ambigues: sql<number>`count(*) filter (where ${ccCommands.verdict} = 'ambigue')::int`,
      horsPerimetre: sql<number>`count(*) filter (where ${ccCommands.verdict} = 'hors_perimetre')::int`,
      refusees: sql<number>`count(*) filter (where ${ccCommands.verdict} = 'refusee')::int`,
      vocales: sql<number>`count(*) filter (where ${ccCommands.channel} = 'vocal')::int`,
      actions: sql<number>`count(*) filter (where ${ccCommands.actionTaskId} is not null)::int`,
    })
    .from(ccCommands);

  const [dev] = await db
    .select({
      total: sql<number>`count(*)::int`,
      enPipeline: sql<number>`count(*) filter (where ${ccDevRequests.status} = 'en_pipeline')::int`,
      bloques: sql<number>`count(*) filter (where ${ccDevRequests.status} = 'bloque')::int`,
    })
    .from(ccDevRequests);

  const [voix] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ouvertes: sql<number>`count(*) filter (where ${ccVoiceSessions.status} = 'ouverte')::int`,
    })
    .from(ccVoiceSessions);

  return {
    commandes: cmd ?? {
      total: 0,
      comprises: 0,
      ambigues: 0,
      horsPerimetre: 0,
      refusees: 0,
      vocales: 0,
      actions: 0,
    },
    dev: dev ?? { total: 0, enPipeline: 0, bloques: 0 },
    voix: voix ?? { total: 0, ouvertes: 0 },
    capacites: {
      intentions: COMMAND_INTENTS.length,
      generationCode: CODE_GENERATION_AVAILABLE,
    },
  };
}

export async function commandCenterHealth(): Promise<{
  status: "ok" | "degraded" | "down";
  detail: string;
}> {
  try {
    const s = await commandStats();
    const nonComprises = s.commandes.horsPerimetre;
    return {
      status: nonComprises > 0 && nonComprises >= s.commandes.total / 2 ? "degraded" : "ok",
      detail:
        `${s.commandes.total} commande(s) reçue(s), ${s.commandes.comprises} comprise(s), ` +
        `${nonComprises} hors périmètre. ${s.capacites.intentions} intentions reconnues. ` +
        `Génération de code : ${s.capacites.generationCode ? "branchée" : "non branchée"}.`,
    };
  } catch (err) {
    return { status: "down", detail: (err as Error).message };
  }
}
