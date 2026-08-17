/**
 * Points 104-107 — Event Bus central.
 *
 * Avant : un moteur publiait un événement dans `engine_events`, et l'événement
 * restait « pending » indéfiniment — publié, jamais remis. Ici il est
 * réellement distribué : abonnés résolus, traitement exécuté, remise
 * enregistrée avec sa durée, ses tentatives et son erreur éventuelle.
 *
 * Trois refus tenus :
 *  - un événement sans abonné est marqué « orphelin » et compté, pas ignoré ;
 *  - un traitement qui échoue laisse l'événement en échec, réessayable ;
 *  - aucun abonné n'écrit dans les tables d'un autre moteur : il passe par son
 *    propre code, appelé par le bus.
 */
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { engineEvents } from "../engine-registry/schema.js";
import { EVENT_TYPES, SUBSCRIPTIONS, type EventTypeSpec } from "./catalog.js";
import { getHandler } from "./handlers.js";
import { ebDeliveries, ebDispatchRuns, ebSubscriptions } from "./schema.js";

const MAX_TENTATIVES = 3;

/** Aligne la table des abonnements sur le catalogue, sans écraser l'état actif/inactif choisi. */
export async function ensureSubscriptions(): Promise<void> {
  for (const s of SUBSCRIPTIONS) {
    await db
      .insert(ebSubscriptions)
      .values({ engine: s.engine, eventType: s.eventType, handler: s.handler, effet: s.effet })
      .onConflictDoUpdate({
        target: [ebSubscriptions.engine, ebSubscriptions.eventType],
        set: { handler: s.handler, effet: s.effet, updatedAt: new Date() },
      });
  }
}

function specDe(type: string): EventTypeSpec | null {
  return EVENT_TYPES.find((e) => e.code === type) ?? null;
}

/** Abonnés d'un type d'événement, joker « * » compris. */
async function abonnes(type: string) {
  await ensureSubscriptions();
  return db
    .select()
    .from(ebSubscriptions)
    .where(and(eq(ebSubscriptions.actif, true), inArray(ebSubscriptions.eventType, [type, "*"])));
}

export interface EmitInput {
  source: string;
  type: string;
  payload?: Record<string, unknown>;
}

export interface EmitResult {
  eventId: number;
  statut: "dispatched" | "failed" | "orphelin";
  remises: { engine: string; statut: string; detail: string }[];
}

/**
 * Publie **et** distribue immédiatement. Le résultat dit la vérité : un
 * événement que personne n'écoute revient en « orphelin ».
 */
export async function emit(input: EmitInput): Promise<EmitResult> {
  const spec = specDe(input.type);
  const payload = input.payload ?? {};
  const cibles = await abonnes(input.type);

  const [event] = await db
    .insert(engineEvents)
    .values({
      source: input.source,
      type: input.type,
      payload,
      targets: cibles.map((c) => c.engine),
      status: "pending",
    })
    .returning();

  // Contrat du point 104 : une charge incomplète n'est pas distribuée à moitié.
  if (spec) {
    const manquants = spec.champs.filter((c) => payload[c] === undefined || payload[c] === null);
    if (manquants.length > 0) {
      await db
        .update(engineEvents)
        .set({
          status: "failed",
          error: `Charge incomplète : champ(s) manquant(s) ${manquants.join(", ")}.`,
          dispatchedAt: new Date(),
        })
        .where(eq(engineEvents.id, event.id));
      return { eventId: event.id, statut: "failed", remises: [] };
    }
  }

  return dispatchEvent(event.id, input.type, input.source, payload, cibles);
}

async function dispatchEvent(
  eventId: number,
  type: string,
  source: string,
  payload: Record<string, unknown>,
  cibles: { engine: string; handler: string }[],
): Promise<EmitResult> {
  if (cibles.length === 0) {
    await db
      .update(engineEvents)
      .set({
        status: "failed",
        error:
          "Événement orphelin : publié mais aucun moteur ne l'écoute. Il n'a produit aucun effet.",
        dispatchedAt: new Date(),
      })
      .where(eq(engineEvents.id, eventId));
    return { eventId, statut: "orphelin", remises: [] };
  }

  const remises: { engine: string; statut: string; detail: string }[] = [];
  let echecs = 0;

  for (const cible of cibles) {
    const handler = getHandler(cible.handler);
    const debut = Date.now();
    if (!handler) {
      echecs += 1;
      await db.insert(ebDeliveries).values({
        eventId,
        eventType: type,
        engine: cible.engine,
        handler: cible.handler,
        statut: "echec",
        dureeMs: 0,
        erreur: `Aucun traitement « ${cible.handler} » n'est branché pour ce moteur.`,
      });
      remises.push({
        engine: cible.engine,
        statut: "echec",
        detail: `Aucun traitement « ${cible.handler} » branché.`,
      });
      continue;
    }
    try {
      const detail = await handler(payload, { type, source });
      await db.insert(ebDeliveries).values({
        eventId,
        eventType: type,
        engine: cible.engine,
        handler: cible.handler,
        statut: "remise",
        dureeMs: Date.now() - debut,
        detail,
      });
      remises.push({ engine: cible.engine, statut: "remise", detail });
    } catch (err) {
      echecs += 1;
      const message = err instanceof Error ? err.message : String(err);
      await db.insert(ebDeliveries).values({
        eventId,
        eventType: type,
        engine: cible.engine,
        handler: cible.handler,
        statut: "echec",
        dureeMs: Date.now() - debut,
        erreur: message,
      });
      remises.push({ engine: cible.engine, statut: "echec", detail: message });
    }
  }

  await db
    .update(engineEvents)
    .set({
      status: echecs > 0 ? "failed" : "dispatched",
      error:
        echecs > 0
          ? `${echecs} abonné(s) sur ${cibles.length} n'ont pas pu traiter l'événement.`
          : null,
      dispatchedAt: new Date(),
    })
    .where(eq(engineEvents.id, eventId));

  return { eventId, statut: echecs > 0 ? "failed" : "dispatched", remises };
}

/**
 * Reprend les événements restés en attente ou en échec — y compris ceux publiés
 * avant l'existence du bus, qui n'avaient jamais été remis à personne.
 */
export async function dispatchPending(opts?: {
  limit?: number;
  trigger?: string;
  requestedBy?: number;
}): Promise<{
  runId: number;
  evenements: number;
  remises: number;
  echecs: number;
  orphelins: number;
}> {
  const limit = opts?.limit ?? 100;
  const [run] = await db
    .insert(ebDispatchRuns)
    .values({ trigger: opts?.trigger ?? "auto", requestedBy: opts?.requestedBy ?? null })
    .returning();

  // On ne rejoue que le passé récent : republier indéfiniment des événements
  // anciens ferait tourner le bus sur de l'histoire, pas sur la plateforme.
  const depuis = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const enAttente = await db
    .select()
    .from(engineEvents)
    .where(
      and(
        inArray(engineEvents.status, ["pending", "failed"]),
        gte(engineEvents.createdAt, depuis),
        sql`coalesce(${engineEvents.error}, '') NOT LIKE 'Événement orphelin%'`,
        sql`coalesce(${engineEvents.error}, '') NOT LIKE 'Charge incomplète%'`,
      ),
    )
    .orderBy(desc(engineEvents.createdAt))
    .limit(limit);

  let remises = 0;
  let echecs = 0;
  let orphelins = 0;
  const detail: { type: string; resultat: string }[] = [];

  for (const event of enAttente) {
    const dejaTente = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(ebDeliveries)
      .where(eq(ebDeliveries.eventId, event.id));
    if ((dejaTente[0]?.n ?? 0) >= MAX_TENTATIVES) {
      detail.push({
        type: event.type,
        resultat: `Abandonné après ${MAX_TENTATIVES} tentatives — nécessite une intervention.`,
      });
      continue;
    }

    const payload = (event.payload as Record<string, unknown> | null) ?? {};
    const cibles = await abonnes(event.type);
    const res = await dispatchEvent(event.id, event.type, event.source, payload, cibles);
    if (res.statut === "orphelin") {
      orphelins += 1;
      detail.push({ type: event.type, resultat: "Orphelin : aucun moteur abonné." });
    } else {
      remises += res.remises.filter((r) => r.statut === "remise").length;
      const e = res.remises.filter((r) => r.statut === "echec").length;
      echecs += e;
      detail.push({
        type: event.type,
        resultat: e > 0 ? `${e} abonné(s) en échec.` : `Remis à ${res.remises.length} abonné(s).`,
      });
    }
  }

  await db
    .update(ebDispatchRuns)
    .set({
      finishedAt: new Date(),
      evenements: enAttente.length,
      remises,
      echecs,
      orphelins,
      detail,
    })
    .where(eq(ebDispatchRuns.id, run.id));

  return { runId: run.id, evenements: enAttente.length, remises, echecs, orphelins };
}

export interface BusObservability {
  checkedAt: string;
  abonnements: {
    engine: string;
    eventType: string;
    handler: string;
    effet: string;
    actif: boolean;
    remises7j: number;
    echecs7j: number;
    dernierUsage: string | null;
  }[];
  types: {
    code: string;
    label: string;
    domaine: string;
    description: string;
    champs: string[];
    abonnes: string[];
    publies7j: number;
    orphelin: boolean;
  }[];
  enSouffrance: {
    id: number;
    type: string;
    source: string;
    statut: string;
    erreur: string;
    createdAt: string;
  }[];
  totaux: { publies7j: number; remises7j: number; echecs7j: number; enAttente: number };
}

/** Point 107 — l'observabilité : ce qui circule, ce qui arrive, ce qui n'arrive pas. */
export async function observability(): Promise<BusObservability> {
  await ensureSubscriptions();
  const depuis = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const subs = await db.select().from(ebSubscriptions).orderBy(ebSubscriptions.engine);

  const parAbonne = await db
    .select({
      engine: ebDeliveries.engine,
      eventType: ebDeliveries.eventType,
      remises: sql<number>`count(*) filter (where ${ebDeliveries.statut} = 'remise')::int`,
      echecs: sql<number>`count(*) filter (where ${ebDeliveries.statut} = 'echec')::int`,
      dernier: sql<Date | null>`max(${ebDeliveries.createdAt})`,
    })
    .from(ebDeliveries)
    .where(gte(ebDeliveries.createdAt, depuis))
    .groupBy(ebDeliveries.engine, ebDeliveries.eventType);

  const parType = await db
    .select({
      type: engineEvents.type,
      n: sql<number>`count(*)::int`,
    })
    .from(engineEvents)
    .where(gte(engineEvents.createdAt, depuis))
    .groupBy(engineEvents.type);

  const souffrance = await db
    .select()
    .from(engineEvents)
    .where(inArray(engineEvents.status, ["pending", "failed"]))
    .orderBy(desc(engineEvents.createdAt))
    .limit(30);

  const abonnements = subs.map((s) => {
    const stats = parAbonne.filter(
      (p) => p.engine === s.engine && (s.eventType === "*" || p.eventType === s.eventType),
    );
    const dernier = stats
      .map((p) => p.dernier)
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      engine: s.engine,
      eventType: s.eventType,
      handler: s.handler,
      effet: s.effet,
      actif: s.actif,
      remises7j: stats.reduce((n, p) => n + p.remises, 0),
      echecs7j: stats.reduce((n, p) => n + p.echecs, 0),
      dernierUsage: dernier ? dernier.toISOString() : null,
    };
  });

  const types = EVENT_TYPES.map((t) => {
    const listeAbonnes = subs
      .filter((s) => s.actif && (s.eventType === t.code || s.eventType === "*"))
      .map((s) => s.engine);
    return {
      code: t.code,
      label: t.label,
      domaine: t.domaine,
      description: t.description,
      champs: t.champs,
      abonnes: listeAbonnes,
      publies7j: parType.find((p) => p.type === t.code)?.n ?? 0,
      orphelin: listeAbonnes.length === 0,
    };
  });

  const remises7j = abonnements.reduce((n, a) => n + a.remises7j, 0);
  const echecs7j = abonnements.reduce((n, a) => n + a.echecs7j, 0);

  return {
    checkedAt: new Date().toISOString(),
    abonnements,
    types,
    enSouffrance: souffrance.map((e) => ({
      id: e.id,
      type: e.type,
      source: e.source,
      statut: e.status,
      erreur: e.error ?? "",
      createdAt: e.createdAt.toISOString(),
    })),
    totaux: {
      publies7j: parType.reduce((n, p) => n + p.n, 0),
      remises7j,
      echecs7j,
      enAttente: souffrance.length,
    },
  };
}

export async function dispatchHistory(limit = 20) {
  return db.select().from(ebDispatchRuns).orderBy(desc(ebDispatchRuns.id)).limit(limit);
}

export async function recentDeliveries(limit = 50) {
  return db.select().from(ebDeliveries).orderBy(desc(ebDeliveries.id)).limit(limit);
}

/** Active ou désactive un abonnement (décision PDG, jamais automatique). */
export async function setSubscriptionActive(id: number, actif: boolean) {
  const [row] = await db
    .update(ebSubscriptions)
    .set({ actif, updatedAt: new Date() })
    .where(eq(ebSubscriptions.id, id))
    .returning();
  return row ?? null;
}

/**
 * Emission tolérante : utilisée depuis les flux métier, elle ne fait jamais
 * échouer l'action de l'utilisateur si le bus rencontre un problème.
 */
export async function emitSafe(input: EmitInput): Promise<void> {
  try {
    await emit(input);
  } catch {
    /* le bus ne bloque jamais un dépôt, un paiement ou une publication */
  }
}
