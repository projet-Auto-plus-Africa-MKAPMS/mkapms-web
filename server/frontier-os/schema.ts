/** Tables du Centre Cyber-Électrique MKA.P-MS / Frontier OS (migration 0157_frontier_os.sql). Préfixe fo_ : « audit_logs » existe déjà. */
import { bigint, bigserial, boolean, index, integer, jsonb, pgTable, serial, smallint, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const foPlatforms = pgTable(
  "fo_platforms",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 60 }).notNull(),
    type: varchar("type", { length: 24 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("future"),
    securityLevel: smallint("security_level").notNull().default(1),
    isInternal: boolean("is_internal").notNull().default(true),
    isFuture: boolean("is_future").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("fo_platforms_code_idx").on(t.code), uniqueIndex("fo_platforms_slug_idx").on(t.slug)],
);

export const foEngines = pgTable(
  "fo_engines",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 160 }).notNull(),
    platformId: integer("platform_id").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    engineType: varchar("engine_type", { length: 32 }).notNull(),
    role: varchar("role", { length: 400 }).notNull().default(""),
    status: varchar("status", { length: 16 }).notNull().default("inactive"),
    powerLevel: smallint("power_level").notNull().default(0),
    memoryCapacity: integer("memory_capacity").notNull().default(0),
    securityLevel: smallint("security_level").notNull().default(1),
    autonomousMode: boolean("autonomous_mode").notNull().default(false),
    repairMode: boolean("repair_mode").notNull().default(false),
    isIntermediary: boolean("is_intermediary").notNull().default(false),
    isRealEngine: boolean("is_real_engine").notNull().default(true),
    isFuturePlaceholder: boolean("is_future_placeholder").notNull().default(false),
    stateSource: varchar("state_source", { length: 16 }).notNull().default("frontier"),
    sourceRef: varchar("source_ref", { length: 160 }).notNull().default(""),
    observedAt: timestamp("observed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("fo_engines_code_idx").on(t.code), index("fo_engines_platform_idx").on(t.platformId, t.engineType)],
);

export const foEnginePairs = pgTable(
  "fo_engine_pairs",
  {
    id: serial("id").primaryKey(),
    externalEngineId: integer("external_engine_id").notNull(),
    internalEnginePrimaryId: integer("internal_engine_primary_id").notNull(),
    internalEngineSecondaryId: integer("internal_engine_secondary_id").notNull(),
    controlMode: varchar("control_mode", { length: 16 }).notNull().default("mixte"),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    lastCheckAt: timestamp("last_check_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("fo_engine_pairs_external_idx").on(t.externalEngineId)],
);

export const foButtons = pgTable(
  "fo_buttons",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 60 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    buttonType: varchar("button_type", { length: 24 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    engineId: integer("engine_id"),
    primaryEngineId: integer("primary_engine_id").notNull(),
    secondaryEngineId: integer("secondary_engine_id").notNull(),
    dangerLevel: smallint("danger_level").notNull().default(1),
    requiresConfirmation: boolean("requires_confirmation").notNull().default(false),
    lastPressedAt: timestamp("last_pressed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("fo_buttons_code_idx").on(t.code)],
);

export const foControlGroups = pgTable(
  "fo_control_groups",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 60 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    leftPlatformId: integer("left_platform_id").notNull(),
    rightPlatformId: integer("right_platform_id").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("future"),
    lineCountReal: integer("line_count_real").notNull().default(0),
    lineCountFuture: integer("line_count_future").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("fo_control_groups_code_idx").on(t.code)],
);

export const foConnectionLines = pgTable(
  "fo_connection_lines",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    groupId: integer("group_id").notNull(),
    position: integer("position").notNull(),
    leftPlatformId: integer("left_platform_id").notNull(),
    rightPlatformId: integer("right_platform_id").notNull(),
    leftRealEngineId: integer("left_real_engine_id"),
    leftIntermediaryEngineId: integer("left_intermediary_engine_id"),
    rightIntermediaryEngineId: integer("right_intermediary_engine_id"),
    rightRealEngineId: integer("right_real_engine_id"),
    centralPointageId: integer("central_pointage_id"),
    engineId: integer("engine_id"),
    label: varchar("label", { length: 200 }).notNull().default(""),
    realChannel: varchar("real_channel", { length: 32 }),
    contractRef: varchar("contract_ref", { length: 80 }),
    status: varchar("status", { length: 10 }).notNull().default("off"),
    currentStatus: varchar("current_status", { length: 16 }).notNull().default("off"),
    testStatus: varchar("test_status", { length: 16 }).notNull().default("untested"),
    isActive: boolean("is_active").notNull().default(false),
    isFuturePlaceholder: boolean("is_future_placeholder").notNull().default(false),
    lastTestAt: timestamp("last_test_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("fo_connection_lines_code_idx").on(t.code), index("fo_connection_lines_group_idx").on(t.groupId, t.position)],
);

export const foPointages = pgTable(
  "fo_pointages",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    connectionLineId: integer("connection_line_id").notNull(),
    engineId: integer("engine_id"),
    status: varchar("status", { length: 16 }).notNull().default("separated"),
    colorState: varchar("color_state", { length: 8 }).notNull().default("red"),
    isMasterPointage: boolean("is_master_pointage").notNull().default(true),
    lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
    lastSeparationAt: timestamp("last_separation_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("fo_pointages_code_idx").on(t.code), uniqueIndex("fo_pointages_line_idx").on(t.connectionLineId)],
);

export const foSwitches = pgTable(
  "fo_switches",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    switchType: varchar("switch_type", { length: 16 }).notNull(),
    status: varchar("status", { length: 10 }).notNull().default("OFF"),
    engineId: integer("engine_id"),
    primaryEngineId: integer("primary_engine_id"),
    secondaryEngineId: integer("secondary_engine_id"),
    connectionLineId: integer("connection_line_id").notNull(),
    manualEnabled: boolean("manual_enabled").notNull().default(true),
    automaticEnabled: boolean("automatic_enabled").notNull().default(false),
    dangerLevel: smallint("danger_level").notNull().default(3),
    isFuturePlaceholder: boolean("is_future_placeholder").notNull().default(false),
    lastOnAt: timestamp("last_on_at", { withTimezone: true }),
    lastOffAt: timestamp("last_off_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("fo_switches_code_idx").on(t.code), index("fo_switches_line_idx").on(t.connectionLineId)],
);

export const foMemoryBlocks = pgTable(
  "fo_memory_blocks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    ownerType: varchar("owner_type", { length: 16 }).notNull(),
    ownerId: integer("owner_id"),
    memoryType: varchar("memory_type", { length: 32 }).notNull(),
    contentSummary: varchar("content_summary", { length: 500 }).notNull(),
    importanceLevel: smallint("importance_level").notNull().default(1),
    securityLevel: smallint("security_level").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("fo_memory_blocks_owner_idx").on(t.ownerType, t.ownerId, t.createdAt)],
);

export const foSecurityZones = pgTable(
  "fo_security_zones",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 60 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    zoneType: varchar("zone_type", { length: 24 }).notNull(),
    accessLevel: varchar("access_level", { length: 16 }).notNull().default("pdg"),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    dangerLevel: smallint("danger_level").notNull().default(1),
    description: text("description").notNull().default(""),
  },
  (t) => [uniqueIndex("fo_security_zones_code_idx").on(t.code)],
);

export const foRepairWorkshop = pgTable("fo_repair_workshop", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  targetType: varchar("target_type", { length: 16 }).notNull(),
  targetId: integer("target_id"),
  issueType: varchar("issue_type", { length: 40 }).notNull(),
  diagnosticStatus: varchar("diagnostic_status", { length: 16 }).notNull().default("detected"),
  repairStatus: varchar("repair_status", { length: 16 }).notNull().default("proposed"),
  proposedFix: varchar("proposed_fix", { length: 400 }).notNull().default(""),
  appliedFix: varchar("applied_fix", { length: 400 }),
  fixPayload: jsonb("fix_payload").$type<Record<string, unknown>>().notNull().default({}),
  rollbackAvailable: boolean("rollback_available").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const foAuditLogs = pgTable(
  "fo_audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorType: varchar("actor_type", { length: 16 }).notNull(),
    actorId: integer("actor_id"),
    action: varchar("action", { length: 48 }).notNull(),
    targetType: varchar("target_type", { length: 16 }).notNull(),
    targetId: integer("target_id"),
    beforeState: jsonb("before_state").$type<Record<string, unknown> | null>(),
    afterState: jsonb("after_state").$type<Record<string, unknown> | null>(),
    result: varchar("result", { length: 10 }).notNull(),
    errorMessage: varchar("error_message", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("fo_audit_logs_date_idx").on(t.createdAt), index("fo_audit_logs_target_idx").on(t.targetType, t.targetId)],
);

export type FoEngine = typeof foEngines.$inferSelect;
export type FoLine = typeof foConnectionLines.$inferSelect;
export type FoSwitch = typeof foSwitches.$inferSelect;
export type FoPointage = typeof foPointages.$inferSelect;
export type FoButton = typeof foButtons.$inferSelect;
export type FoPair = typeof foEnginePairs.$inferSelect;
export type FoRepair = typeof foRepairWorkshop.$inferSelect;
export { bigint };
