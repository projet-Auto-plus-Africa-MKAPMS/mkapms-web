/**
 * Tables de la base INDÉPENDANTE du Centre Cyber-Électrique (schéma « frontier »).
 * Miroir TypeScript des migrations server/frontier-os/base/migrations/*.sql — ce fichier ne crée rien : le migrateur propre du centre applique les .sql.
 */
import { bigint, bigserial, boolean, doublePrecision, index, integer, jsonb, pgSchema, serial, smallint, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const frontier = pgSchema("frontier");

const t = (nom: string) => timestamp(nom, { withTimezone: true });
const proprietaire = {
  ownerKind: text("owner_kind").$type<ProprietaireKind>().notNull().default("center"),
  ownerCode: text("owner_code").notNull().default("center"),
};

export type ProprietaireKind = "center" | "company" | "platform";
export type Mode = "simulation" | "real";
export type CoteCoupure = "remote" | "center" | "main";
export type EtatDemande = "none" | "activate" | "deactivate";
export type EtatObserve = "connected" | "disconnected" | "unknown";
export type Avancement = "idle" | "pending" | "in_progress" | "confirmed" | "failed";
export type KindMoteur = "real" | "intermediary" | "command" | "verification" | "transport" | "monitor" | "switch_element" | "contact_element";

export const companies = frontier.table("companies", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  role: text("role").$type<"center_owner" | "platform_owner" | "client">().notNull(),
  status: text("status").$type<"active" | "prepared" | "suspended">().notNull().default("active"),
  note: text("note").notNull().default(""),
  createdAt: t("created_at").notNull().defaultNow(),
});

export const platforms = frontier.table("platforms", {
  code: text("code").primaryKey(),
  companyCode: text("company_code").notNull(),
  name: text("name").notNull(),
  kind: text("kind").$type<"center" | "main" | "shop" | "map" | "ai" | "jewelry" | "future" | "external">().notNull(),
  repository: text("repository").notNull().default(""),
  exactNames: text("exact_names").array().notNull().default([]),
  identityStatus: text("identity_status").$type<"verified" | "to_verify">().notNull(),
  identityNote: text("identity_note").notNull().default(""),
  status: text("status").$type<"active" | "prepared" | "future" | "to_verify">().notNull(),
  securityLevel: smallint("security_level").notNull().default(1),
  createdAt: t("created_at").notNull().defaultNow(),
  updatedAt: t("updated_at").notNull().defaultNow(),
});

export const platformAliases = frontier.table("platform_aliases", {
  name: text("name").primaryKey(),
  platformCode: text("platform_code"),
  status: text("status").$type<"found" | "not_found" | "to_verify">().notNull(),
  evidence: text("evidence").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: t("created_at").notNull().defaultNow(),
});

export const engines = frontier.table(
  "engines",
  {
    code: text("code").primaryKey(),
    platformCode: text("platform_code").notNull(),
    ...proprietaire,
    name: text("name").notNull(),
    function: text("function").notNull().default(""),
    kind: text("kind").$type<KindMoteur>().notNull(),
    origin: text("origin").$type<"inventory" | "center">().notNull(),
    inventoryState: text("inventory_state").$type<"incomplet" | "prepare" | "installe" | "teste" | "connecte" | "a_verifier">(),
    evidenceLevel: text("evidence_level").$type<"declare" | "liaison" | "tests" | "mesure">(),
    declaredOnly: boolean("declared_only").notNull().default(true),
    codeLocation: text("code_location").array().notNull().default([]),
    executionService: text("execution_service").notNull().default(""),
    plannedIntermediary: text("planned_intermediary"),
    inputs: text("inputs").notNull().default(""),
    outputs: text("outputs").notNull().default(""),
    stopMechanism: text("stop_mechanism").notNull().default(""),
    running: boolean("running").notNull().default(true),
    health: text("health").$type<"unknown" | "ok" | "degraded" | "down" | "stopped">().notNull().default("unknown"),
    healthCheckedAt: t("health_checked_at"),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    version: text("version").notNull().default(""),
    createdAt: t("created_at").notNull().defaultNow(),
    updatedAt: t("updated_at").notNull().defaultNow(),
  },
  (x) => [index("engines_platform_idx").on(x.platformCode, x.kind), index("engines_kind_idx").on(x.kind, x.running)],
);

export const engineVersions = frontier.table(
  "engine_versions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    engineCode: text("engine_code").notNull(),
    version: text("version").notNull(),
    sourceRepo: text("source_repo").notNull(),
    sourceCommit: text("source_commit").notNull(),
    inventoryState: text("inventory_state"),
    evidenceLevel: text("evidence_level"),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull().default({}),
    recordedAt: t("recorded_at").notNull().defaultNow(),
  },
  (x) => [uniqueIndex("engine_versions_commit_idx").on(x.engineCode, x.sourceCommit)],
);

export type MetriqueCapacite = "throughput_per_min" | "latency_ms" | "memory_mb" | "recovery_ms" | "error_rate" | "capacity_factor";
export const engineCapabilities = frontier.table(
  "engine_capabilities",
  {
    engineCode: text("engine_code").notNull(),
    metric: text("metric").$type<MetriqueCapacite>().notNull(),
    declaredValue: doublePrecision("declared_value"),
    measuredValue: doublePrecision("measured_value"),
    unit: text("unit").notNull().default(""),
    method: text("method").notNull().default(""),
    measuredAt: t("measured_at"),
  },
  (x) => [uniqueIndex("engine_capabilities_pk").on(x.engineCode, x.metric)],
);

export type CibleLiaison = "button" | "switch" | "external_engine" | "line" | "group" | "general";
export const engineBindings = frontier.table(
  "engine_bindings",
  {
    id: serial("id").primaryKey(),
    targetKind: text("target_kind").$type<CibleLiaison>().notNull(),
    targetCode: text("target_code").notNull(),
    commandEngine: text("command_engine").notNull(),
    verificationEngine: text("verification_engine").notNull(),
    ...proprietaire,
    createdAt: t("created_at").notNull().defaultNow(),
  },
  (x) => [uniqueIndex("engine_bindings_target_idx").on(x.targetKind, x.targetCode)],
);

export const secretRefs = frontier.table("secret_refs", {
  name: text("name").primaryKey(),
  store: text("store").$type<"railway_env" | "platform_vault" | "none">().notNull(),
  ref: text("ref").notNull(),
  purpose: text("purpose").notNull().default(""),
  status: text("status").$type<"declared" | "missing" | "present_unverified">().notNull().default("declared"),
  ...proprietaire,
  createdAt: t("created_at").notNull().defaultNow(),
});

export const apiSlots = frontier.table("api_slots", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  companyCode: text("company_code"),
  scope: text("scope").notNull().default(""),
  status: text("status").$type<"inactive">().notNull().default("inactive"),
  note: text("note").notNull().default(""),
  createdAt: t("created_at").notNull().defaultNow(),
});

export const subscriptions = frontier.table(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    companyCode: text("company_code").notNull(),
    plan: text("plan").notNull(),
    status: text("status").$type<"prepared" | "inactive">().notNull().default("prepared"),
    note: text("note").notNull().default(""),
    createdAt: t("created_at").notNull().defaultNow(),
  },
  (x) => [uniqueIndex("subscriptions_company_plan_idx").on(x.companyCode, x.plan)],
);

export const accessGrants = frontier.table(
  "access_grants",
  {
    id: serial("id").primaryKey(),
    subjectKind: text("subject_kind").$type<"pdg" | "employee" | "role" | "engine" | "company">().notNull(),
    subjectRef: text("subject_ref").notNull(),
    scope: text("scope").notNull(),
    level: smallint("level").notNull().default(1),
    status: text("status").$type<"active" | "prepared" | "revoked">().notNull().default("prepared"),
    grantedBy: text("granted_by").notNull().default(""),
    ...proprietaire,
    createdAt: t("created_at").notNull().defaultNow(),
  },
  (x) => [uniqueIndex("access_grants_subject_idx").on(x.subjectKind, x.subjectRef, x.scope)],
);

export const groups = frontier.table("groups", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  platformCode: text("platform_code"),
  position: integer("position").notNull().default(0),
  isFuture: boolean("is_future").notNull().default(false),
  contactLocked: boolean("contact_locked").notNull().default(false),
  ...proprietaire,
  createdAt: t("created_at").notNull().defaultNow(),
});

export const lines = frontier.table(
  "lines",
  {
    id: serial("id").primaryKey(),
    groupCode: text("group_code").notNull(),
    position: integer("position").notNull(),
    kind: text("kind").$type<"real" | "reserve">().notNull(),
    label: text("label").notNull(),
    channel: text("channel"),
    intermediaryRef: text("intermediary_ref"),
    remoteRealEngine: text("remote_real_engine"),
    remoteSwitch: text("remote_switch"),
    remoteIntermediary: text("remote_intermediary"),
    centerContact: text("center_contact"),
    mainIntermediary: text("main_intermediary"),
    mainSwitch: text("main_switch"),
    mainRealEngine: text("main_real_engine"),
    enabled: boolean("enabled").notNull().default(false),
    locked: boolean("locked").notNull().default(false),
    validity: text("validity").$type<"valid" | "invalid">().notNull().default("invalid"),
    invalidReasons: text("invalid_reasons").array().notNull().default([]),
    validatedAt: t("validated_at"),
    ...proprietaire,
    createdAt: t("created_at").notNull().defaultNow(),
    updatedAt: t("updated_at").notNull().defaultNow(),
  },
  (x) => [uniqueIndex("lines_group_position_idx").on(x.groupCode, x.position), index("lines_group_idx").on(x.groupCode, x.kind, x.position)],
);

export const cuts = frontier.table(
  "cuts",
  {
    id: serial("id").primaryKey(),
    lineId: integer("line_id").notNull(),
    side: text("side").$type<CoteCoupure>().notNull(),
    elementCode: text("element_code").notNull(),
    requested: text("requested").$type<EtatDemande>().notNull().default("none"),
    observed: text("observed").$type<EtatObserve>().notNull().default("unknown"),
    progress: text("progress").$type<Avancement>().notNull().default("idle"),
    mode: text("mode").$type<Mode>().notNull().default("simulation"),
    error: text("error"),
    lastCommandId: bigint("last_command_id", { mode: "number" }),
    lastCheckedAt: t("last_checked_at"),
    lastProof: text("last_proof"),
    ...proprietaire,
    updatedAt: t("updated_at").notNull().defaultNow(),
  },
  (x) => [uniqueIndex("cuts_line_side_idx").on(x.lineId, x.side)],
);

export const gates = frontier.table("gates", {
  cutId: integer("cut_id").primaryKey(),
  open: boolean("open").notNull().default(false),
  changedAt: t("changed_at").notNull().defaultNow(),
  changedBy: bigint("changed_by", { mode: "number" }),
});

export type StatutCommande = "pending" | "running" | "confirmed" | "failed" | "blocked" | "partial";
export const commands = frontier.table(
  "commands",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    kind: text("kind").$type<"cut" | "line" | "group" | "general" | "probe">().notNull(),
    targetKind: text("target_kind").$type<"cut" | "line" | "group" | "general">().notNull(),
    targetId: text("target_id").notNull(),
    requested: text("requested").$type<"activate" | "deactivate">().notNull(),
    mode: text("mode").$type<Mode>().notNull().default("simulation"),
    status: text("status").$type<StatutCommande>().notNull().default("pending"),
    idempotencyKey: text("idempotency_key"),
    actorType: text("actor_type").$type<"pdg" | "system" | "engine" | "test">().notNull(),
    actorId: text("actor_id"),
    commandEngine: text("command_engine"),
    verificationEngine: text("verification_engine"),
    parentId: bigint("parent_id", { mode: "number" }),
    confirmedByActor: boolean("confirmed_by_actor").notNull().default(false),
    reason: text("reason").notNull().default(""),
    result: jsonb("result").$type<Record<string, unknown>>().notNull().default({}),
    ...proprietaire,
    createdAt: t("created_at").notNull().defaultNow(),
    startedAt: t("started_at"),
    finishedAt: t("finished_at"),
  },
  (x) => [index("commands_target_idx").on(x.targetKind, x.targetId, x.createdAt), index("commands_parent_idx").on(x.parentId)],
);

export const commandReceipts = frontier.table(
  "command_receipts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    commandId: bigint("command_id", { mode: "number" }).notNull(),
    engineCode: text("engine_code").notNull(),
    role: text("role").$type<"command" | "verification">().notNull(),
    phase: text("phase").$type<"precheck" | "execute" | "postcheck">().notNull(),
    outcome: text("outcome").$type<"ok" | "refused" | "error" | "timeout" | "contradiction">().notNull(),
    detail: text("detail").notNull().default(""),
    observed: jsonb("observed").$type<Record<string, unknown>>().notNull().default({}),
    durationMs: integer("duration_ms"),
    at: t("at").notNull().defaultNow(),
    ...proprietaire,
  },
  (x) => [index("command_receipts_command_idx").on(x.commandId, x.at)],
);

export type EtatEchange = "queued" | "in_flight" | "delivered" | "refused" | "cancelled" | "tracked" | "suspended" | "failed";
export const exchanges = frontier.table(
  "exchanges",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    lineId: integer("line_id").notNull(),
    direction: text("direction").$type<"remote_to_main" | "main_to_remote">().notNull(),
    kind: text("kind").$type<"message" | "task" | "payment_external" | "probe">().notNull(),
    route: text("route").$type<"primary" | "queue" | "retry" | "secondary">().notNull().default("primary"),
    state: text("state").$type<EtatEchange>().notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    payloadRef: text("payload_ref").notNull().default(""),
    externalRef: text("external_ref"),
    resultRef: text("result_ref"),
    note: text("note").notNull().default(""),
    lastError: text("last_error"),
    nextAttemptAt: t("next_attempt_at"),
    ...proprietaire,
    createdAt: t("created_at").notNull().defaultNow(),
    updatedAt: t("updated_at").notNull().defaultNow(),
    finishedAt: t("finished_at"),
  },
  (x) => [index("exchanges_line_idx").on(x.lineId, x.state, x.createdAt)],
);

export const testSessions = frontier.table("test_sessions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  label: text("label").notNull(),
  protocol: text("protocol").notNull(),
  mode: text("mode").$type<Mode>().notNull().default("simulation"),
  environment: text("environment").$type<"isolated" | "live">().notNull().default("isolated"),
  status: text("status").$type<"running" | "passed" | "failed">().notNull().default("running"),
  lineId: integer("line_id"),
  actor: text("actor").notNull().default(""),
  summary: jsonb("summary").$type<Record<string, unknown>>().notNull().default({}),
  ...proprietaire,
  startedAt: t("started_at").notNull().defaultNow(),
  finishedAt: t("finished_at"),
});

export const testSteps = frontier.table(
  "test_steps",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sessionId: bigint("session_id", { mode: "number" }).notNull(),
    ord: integer("ord").notNull(),
    name: text("name").notNull(),
    expectation: text("expectation").notNull(),
    observation: text("observation").notNull().default(""),
    passed: boolean("passed").notNull(),
    commandId: bigint("command_id", { mode: "number" }),
    at: t("at").notNull().defaultNow(),
  },
  (x) => [uniqueIndex("test_steps_session_ord_idx").on(x.sessionId, x.ord)],
);

export const incidents = frontier.table(
  "incidents",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    severity: text("severity").$type<"info" | "warning" | "critical">().notNull(),
    kind: text("kind").notNull(),
    summary: text("summary").notNull(),
    lineId: integer("line_id"),
    cutId: integer("cut_id"),
    engineCode: text("engine_code"),
    commandId: bigint("command_id", { mode: "number" }),
    status: text("status").$type<"open" | "diagnosed" | "repairing" | "resolved" | "closed">().notNull().default("open"),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    ...proprietaire,
    openedAt: t("opened_at").notNull().defaultNow(),
    closedAt: t("closed_at"),
  },
  (x) => [index("incidents_status_idx").on(x.status, x.openedAt)],
);

export const repairs = frontier.table("repairs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  incidentId: bigint("incident_id", { mode: "number" }).notNull(),
  status: text("status").$type<"proposed" | "tested" | "applied" | "rolled_back" | "failed" | "refused">().notNull().default("proposed"),
  versionBefore: jsonb("version_before").$type<Record<string, unknown>>().notNull(),
  proposedChange: jsonb("proposed_change").$type<Record<string, unknown>>().notNull(),
  testResult: jsonb("test_result").$type<Record<string, unknown>>(),
  rollback: jsonb("rollback").$type<Record<string, unknown>>(),
  rightsNote: text("rights_note").notNull().default(""),
  actor: text("actor").notNull().default(""),
  ...proprietaire,
  createdAt: t("created_at").notNull().defaultNow(),
  appliedAt: t("applied_at"),
  rolledBackAt: t("rolled_back_at"),
});

export const config = frontier.table("config", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: t("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by").notNull().default("system"),
});

export const configHistory = frontier.table(
  "config_history",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    field: text("field").notNull(),
    oldValue: jsonb("old_value").$type<unknown>(),
    newValue: jsonb("new_value").$type<unknown>(),
    actor: text("actor").notNull().default("system"),
    ...proprietaire,
    at: t("at").notNull().defaultNow(),
  },
  (x) => [index("config_history_entity_idx").on(x.entity, x.entityId, x.at)],
);

export const memoryBlocks = frontier.table(
  "memory_blocks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    key: text("key").notNull(),
    kind: text("kind").notNull(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
    importance: smallint("importance").notNull().default(1),
    security: smallint("security").notNull().default(1),
    ...proprietaire,
    createdAt: t("created_at").notNull().defaultNow(),
  },
  (x) => [index("memory_blocks_key_idx").on(x.key, x.createdAt)],
);

export type MetriqueMesure = "latency_ms" | "throughput_per_min" | "memory_mb" | "errors" | "recovery_ms" | "queue_depth" | "cpu_load";
export const measurements = frontier.table(
  "measurements",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    subjectKind: text("subject_kind").$type<"center" | "engine" | "line" | "cut" | "transport">().notNull(),
    subjectCode: text("subject_code").notNull(),
    metric: text("metric").$type<MetriqueMesure>().notNull(),
    value: doublePrecision("value").notNull(),
    unit: text("unit").notNull().default(""),
    source: text("source").notNull(),
    at: t("at").notNull().defaultNow(),
  },
  (x) => [index("measurements_subject_idx").on(x.subjectKind, x.subjectCode, x.metric, x.at)],
);

export const rooms = frontier.table("rooms", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull(),
  securityLevel: smallint("security_level").notNull().default(1),
  ...proprietaire,
});

export const buttons = frontier.table("buttons", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  targetKind: text("target_kind").$type<"cut" | "line" | "group" | "general" | "workshop">().notNull(),
  dangerLevel: smallint("danger_level").notNull().default(1),
  requiresConfirmation: boolean("requires_confirmation").notNull().default(false),
  lastPressedAt: t("last_pressed_at"),
  ...proprietaire,
});

export const auditLog = frontier.table(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: t("at").notNull().defaultNow(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    targetKind: text("target_kind").notNull().default(""),
    targetId: text("target_id").notNull().default(""),
    result: text("result").$type<"ok" | "refused" | "error">().notNull(),
    error: text("error"),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    ...proprietaire,
  },
  (x) => [index("audit_log_at_idx").on(x.at), index("audit_log_action_idx").on(x.action, x.at)],
);

export type Engine = typeof engines.$inferSelect;
export type Line = typeof lines.$inferSelect;
export type Cut = typeof cuts.$inferSelect;
export type Command = typeof commands.$inferSelect;
export type Exchange = typeof exchanges.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type Repair = typeof repairs.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Platform = typeof platforms.$inferSelect;

// ───────────────────────── Liaisons réelles (migration 0003) ─────────────────────────
export type StatutOrdreDistant = "pending" | "delivered" | "acked" | "expired" | "cancelled";

export const remoteOrders = frontier.table(
  "remote_orders",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    lineId: integer("line_id").notNull(),
    cutId: integer("cut_id").notNull(),
    wanted: text("wanted").$type<"activate" | "deactivate">().notNull(),
    commandId: bigint("command_id", { mode: "number" }),
    status: text("status").$type<StatutOrdreDistant>().notNull().default("pending"),
    createdAt: t("created_at").notNull().defaultNow(),
    expiresAt: t("expires_at").notNull(),
    deliveredAt: t("delivered_at"),
    ackedAt: t("acked_at"),
    ackState: text("ack_state").$type<"connected" | "disconnected">(),
    ackObservedAt: t("ack_observed_at"),
    ackKeyId: integer("ack_key_id"),
    ownerKind: text("owner_kind").$type<ProprietaireKind>().notNull().default("platform"),
    ownerCode: text("owner_code").notNull().default("shop"),
  },
  (x) => [index("remote_orders_open_idx").on(x.lineId, x.status, x.createdAt)],
);

export const remoteReports = frontier.table("remote_reports", {
  lineId: integer("line_id").primaryKey(),
  state: text("state").$type<"connected" | "disconnected">().notNull(),
  observedAt: t("observed_at").notNull(),
  receivedAt: t("received_at").notNull().defaultNow(),
  keyId: integer("key_id"),
  orderId: bigint("order_id", { mode: "number" }),
  ownerKind: text("owner_kind").$type<ProprietaireKind>().notNull().default("platform"),
  ownerCode: text("owner_code").notNull().default("shop"),
});

// ───────────────────────── Lacunes de développement (migration 0004) ─────────────────────────
export type StatutLacune = "declared" | "resolved";

export const capabilityGaps = frontier.table(
  "capability_gaps",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    developmentNeeded: text("development_needed").notNull(),
    engineCode: text("engine_code"),
    status: text("status").$type<StatutLacune>().notNull().default("declared"),
    raisedBy: text("raised_by").notNull().default("center"),
    ownerKind: text("owner_kind").$type<ProprietaireKind>().notNull().default("center"),
    ownerCode: text("owner_code").notNull().default("center"),
    declaredAt: t("declared_at").notNull().defaultNow(),
    resolvedAt: t("resolved_at"),
    resolvedBy: text("resolved_by"),
    resolvedNote: text("resolved_note"),
  },
  (x) => [index("capability_gaps_status_idx").on(x.status, x.declaredAt)],
);
