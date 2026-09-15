/**
 * Direction Business Dashboard (LOT 7 du Plan Maître Fournisseurs, §40).
 *
 * Agrège les `dashboard()`/`getStats()` déjà exposés par les moteurs LOT1-6
 * et le Payment Engine — aucune nouvelle logique métier, aucune donnée
 * dupliquée. Chaque moteur est isolé : l'échec d'un seul n'empêche jamais
 * les autres de remonter (comme `probeBusinessEngines`, bootstrap.ts).
 *
 * Ce que ce fichier N'EST PAS : un nouveau moteur. C'est un point
 * d'agrégation en lecture seule, au même titre que `readiness.ts` pour la
 * supervision technique — ici pour la vue business de la Direction.
 */

export interface BusinessDashboardSection {
  engine: string;
  label: string;
  ok: boolean;
  data: unknown;
  error?: string;
}

export interface BusinessDashboardReport {
  checkedAt: string;
  sections: BusinessDashboardSection[];
}

async function section(engine: string, label: string, fn: () => Promise<unknown>): Promise<BusinessDashboardSection> {
  try {
    const data = await fn();
    return { engine, label, ok: true, data };
  } catch (err) {
    return { engine, label, ok: false, data: null, error: (err as Error).message };
  }
}

/**
 * Vue Direction (§40) : fournisseurs, véhicules, pièces, expéditions,
 * versements, documents, encaissements, rapprochement — chacun tel que son
 * propre moteur le rapporte, jamais recalculé ici.
 */
export async function businessDashboard(): Promise<BusinessDashboardReport> {
  const sections = await Promise.all([
    section("supplier_engine", "Fournisseurs", async () => (await import("../supplier-engine/service.js")).dashboard()),
    section("vehicle_engine", "Véhicules", async () => (await import("../vehicle-engine/service.js")).dashboard()),
    section("parts_engine", "Pièces", async () => (await import("../parts-engine/service.js")).dashboard()),
    section("logistics_engine", "Logistique", async () => (await import("../logistics-engine/service.js")).dashboard()),
    section("payout_engine", "Versements", async () => (await import("../payout-engine/service.js")).dashboard()),
    section("document_engine", "Documents", async () => (await import("../document-engine/service.js")).dashboard()),
    section("payment", "Paiements", async () => (await import("../payment-engine/service.js")).getStats()),
    section("accounting_internal", "Rapprochement comptable", async () => (await import("../accounting-internal/service.js")).internalAccountingHealth()),
    section("financial_intelligence", "Anomalies financières", async () => (await import("../financial-intelligence/service.js")).financialIntelligenceHealth()),
  ]);

  return { checkedAt: new Date().toISOString(), sections };
}
