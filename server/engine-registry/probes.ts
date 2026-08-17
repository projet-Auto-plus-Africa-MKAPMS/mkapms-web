/**
 * MKA.P-MS Engine Registry — Sondes de santé des moteurs métier.
 *
 * Contexte : seuls les 4 moteurs à contrat (Core / Smart / Permission /
 * Redirection) et les moteurs « OS » (surface MOS `controlCenterFeed()`)
 * remontaient un signal. Les 30 autres moteurs du catalogue n'émettaient
 * JAMAIS de battement : ils restaient indéfiniment en santé `unknown` et
 * apparaissaient donc comme hors service au centre de contrôle.
 *
 * Chaque moteur possède désormais sa propre sonde : elle interroge réellement
 * les tables de son domaine et en rapporte des métriques exploitables. La
 * sonde ne lit que le stockage du domaine — aucune logique métier n'est
 * dupliquée ici.
 *
 * Règle de santé (identique à celle appliquée aux 7 moteurs corrigés) :
 * la santé décrit la CAPACITÉ à fonctionner, jamais la charge de travail.
 *   • `ok`       : le domaine est interrogeable ;
 *   • `degraded` : une partie du stockage manque ou une requête échoue ;
 *   • `down`     : aucun stockage du domaine n'est disponible.
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import type { EngineHealth } from "./service.js";

export interface EngineProbe {
  /** Nom canonique du moteur dans le registre. */
  engine: string;
  /** Tables du domaine, dans l'ordre d'importance (la 1ʳᵉ porte la métrique principale). */
  tables: string[];
}

/**
 * Domaine réel de chaque moteur sans surface MOS.
 * Les noms de tables proviennent des schémas Drizzle du dépôt.
 */
export const ENGINE_PROBES: EngineProbe[] = [
  // ── Transversaux ──
  { engine: "seo", tables: ["seo_pages", "seo_keywords", "seo_indexing_log", "seo_config"] },
  { engine: "pro_portal", tables: ["pro_portal_professions", "pro_portal_modules", "pro_portal_drafts"] },
  { engine: "pro_account", tables: ["pro_account_rules", "pro_account_applications"] },
  // Le routage de compte décide à partir des comptes eux-mêmes : pas de table propre.
  { engine: "account_routing", tables: ["users"] },
  { engine: "payment_orchestrator", tables: ["payment_providers", "payment_routing_decisions"] },
  { engine: "financial_intelligence", tables: ["finance_anomalies", "payments", "subscriptions"] },
  { engine: "accounting_internal", tables: ["compta_rapprochements", "compta_ecritures", "payments"] },
  { engine: "accounting_marketplace", tables: ["accountant_profiles", "accountant_requests"] },
  { engine: "payment", tables: ["payments", "payment_transactions", "payment_products", "subscriptions"] },
  { engine: "workflow", tables: ["change_requests", "service_tracking"] },
  { engine: "knowledge", tables: ["smart_knowledge", "smart_kb_entries", "smart_learned_data"] },
  { engine: "analytics", tables: ["smart_search_logs", "smart_activity_log", "redir_logs"] },
  // Le moteur de proximité n'a pas de stockage propre : il interroge les annuaires
  // locaux des univers. Sa santé dépend donc de la disponibilité de ces annuaires.
  { engine: "proximity_engine", tables: ["garages_publics", "accountant_profiles", "parts_shops"] },
  { engine: "partner_engine", tables: ["partners", "partner_coverage", "partner_applications", "partner_opportunities"] },

  // ── Univers ──
  { engine: "vo", tables: ["vehicules", "vehicule_dossiers", "vehicule_historique"] },
  { engine: "vo_engine", tables: ["vo_estimations", "vo_reprise_requests", "vo_dossier_items"] },
  { engine: "garage", tables: ["garages", "garages_publics", "rdv_garage", "devis_garage_requests"] },
  { engine: "pieces", tables: ["pieces", "parts_shops", "parts_stock", "parts_orders"] },
  { engine: "depannage", tables: ["service_tracking", "quotes"] },
  { engine: "livraison", tables: ["delivery_pricing", "service_tracking"] },
  { engine: "transport", tables: ["locations", "location_calendar"] },
  { engine: "comptabilite", tables: ["factures", "invoices", "finance_transactions", "finance_documents"] },
  { engine: "importafrica", tables: ["vehicules", "countries"] },
  { engine: "marketing", tables: ["visibility_publications", "visibility_channels"] },
  { engine: "cartegrise", tables: ["user_documents", "plate_lookups"] },

  // ── Univers marketplace ──
  { engine: "achat", tables: ["annonces", "favoris", "bookings"] },
  { engine: "vente", tables: ["annonces", "annonce_photos", "annonce_options"] },
  { engine: "location", tables: ["locations", "location_calendar", "rental_applications"] },

  // ── Sous-sections (isolables : même stockage, périmètre distinct) ──
  { engine: "achat_officiel", tables: ["annonces"] },
  { engine: "achat_pro", tables: ["annonces"] },
  { engine: "achat_particulier", tables: ["annonces"] },
  { engine: "vente_officiel", tables: ["annonces"] },
  { engine: "vente_pro", tables: ["annonces"] },
  { engine: "vente_particulier", tables: ["annonces"] },
  { engine: "location_pro", tables: ["locations"] },
  { engine: "location_particulier", tables: ["locations"] },

  // ── Services dédiés ──
  { engine: "controle_technique", tables: ["rdv_fidelite", "service_tracking"] },
  {
    engine: "assurance",
    tables: ["user_assurances", "insurance_partners", "insurance_quote_requests"],
  },
  { engine: "energie_recharge", tables: ["charging_points"] },
  { engine: "avis_reputation", tables: ["reviews_v2", "review_requests", "review_aggregates"] },
  {
    engine: "connecteur_google_business",
    tables: ["gbp_locations", "gbp_review_snapshots"],
  },
  {
    engine: "connaissance_auto",
    tables: ["ake_nodes", "ake_edges", "ake_sources", "ake_provenance", "ake_discoveries", "ake_watch_runs"],
  },
  {
    engine: "politique_pays",
    tables: ["cpe_rules", "cpe_evaluations"],
  },
  {
    engine: "resilience",
    tables: [
      "rs_emergency_scopes",
      "rs_emergency_events",
      "rs_critical_requests",
      "rs_pipeline_runs",
      "rs_failure_lessons",
    ],
  },
  {
    engine: "command_center",
    tables: ["cc_commands", "cc_voice_sessions", "cc_dev_requests"],
  },
  {
    engine: "rd_lab",
    tables: ["rd_projects", "rd_chain_links", "rd_assets", "rd_ecosystem_snapshots"],
  },
  {
    engine: "ai_fabric",
    tables: ["af_providers", "af_routes", "af_cost_entries", "af_memory_backups"],
  },
  {
    engine: "event_bus",
    tables: ["eb_subscriptions", "eb_deliveries", "eb_dispatch_runs"],
  },
  {
    engine: "continuous_test",
    tables: ["ct_runs", "ct_results"],
  },
  {
    engine: "code_graph",
    tables: ["cg_snapshots", "cg_nodes", "cg_edges", "cg_observations", "cg_lessons"],
  },
  {
    engine: "completion_center",
    tables: ["cp_snapshots", "cp_domain_verdicts", "cp_work_reports"],
  },
  {
    engine: "smart_audit",
    tables: ["smart_audit_runs", "smart_audit_items", "smart_cycle_runs"],
  },
  {
    engine: "product_engine",
    tables: ["product_feed_items", "product_sync_events", "product_feed_runs"],
  },
  {
    engine: "indexation",
    tables: ["indexation_audits", "indexation_url_checks", "indexation_watch"],
  },
  {
    engine: "activation_audit",
    tables: ["activation_audit_runs", "activation_audit_items", "activation_test_evidence"],
  },
  { engine: "finance", tables: ["finance_documents", "finance_transactions", "payments"] },
  { engine: "encheres", tables: ["annonces", "payments"] },
  { engine: "auction_engine", tables: ["auctions", "auction_bids", "auction_events"] },
];

export interface ProbeResult {
  health: EngineHealth;
  message: string;
  metrics: Record<string, unknown>;
}

/** Vrai si la table existe dans le schéma public. */
async function tableExists(table: string): Promise<boolean> {
  const res = await db.execute<{ reg: string | null }>(
    sql`select to_regclass(${`public.${table}`})::text as reg`,
  );
  return Boolean((res.rows?.[0] as { reg: string | null } | undefined)?.reg);
}

async function countRows(table: string): Promise<number> {
  const res = await db.execute<{ n: number }>(
    sql`select count(*)::int as n from ${sql.identifier(table)}`,
  );
  return Number((res.rows?.[0] as { n: number } | undefined)?.n ?? 0);
}

/**
 * Exécute la sonde d'un moteur. Ne lève jamais : une sonde en échec renvoie
 * une santé dégradée décrivant la cause, elle ne casse pas la supervision.
 */
export async function runProbe(probe: EngineProbe): Promise<ProbeResult> {
  const counts: Record<string, number> = {};
  const missing: string[] = [];
  const failed: string[] = [];

  for (const table of probe.tables) {
    try {
      if (!(await tableExists(table))) {
        missing.push(table);
        continue;
      }
      counts[table] = await countRows(table);
    } catch (err) {
      failed.push(`${table} (${(err as Error).message})`);
    }
  }

  const reachable = Object.keys(counts).length;
  const metrics = {
    tables: probe.tables.length,
    reachable,
    missingTables: missing,
    failedTables: failed,
    counts,
  };

  if (reachable === 0) {
    return {
      health: "down",
      message: `Stockage du domaine indisponible (${[...missing, ...failed].join(", ")}).`,
      metrics,
    };
  }
  if (missing.length || failed.length) {
    return {
      health: "degraded",
      message: `Domaine partiellement disponible — manquant : ${[...missing, ...failed].join(", ")}.`,
      metrics,
    };
  }
  return {
    health: "ok",
    message: `Domaine opérationnel (${reachable} table(s) interrogée(s)).`,
    metrics,
  };
}
