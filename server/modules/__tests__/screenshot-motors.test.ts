/** Exécuter uniquement sur une base de test isolée (tables santé/KYC/audit). */
import assert from "node:assert/strict";
import { db, pool } from "../../db.js";
import { smartHealthChecks } from "../../smart-engine/schema.js";
import { kycProfiles, kycDocuments, auditLogs } from "../../schema.js";
import { eq } from "drizzle-orm";
import { syncBoutonsSansAction, getHealthStatus } from "../../smart-engine/services/health-monitor.js";
import { deciderKyc } from "../kyc-decision.js";
import { BOUTONS_SANS_ACTION } from "../../data/boutons-sans-action.js";

async function main() {
  assert.match(process.env.DATABASE_URL ?? "", /(?:localhost|127\.0\.0\.1):55432\//, "Base isolée obligatoire");
  for (const status of ["ok", "broken"]) await db.insert(smartHealthChecks).values({ page: "test/old.tsx", element: `static_L${status === "ok" ? 1 : 2}`, elementType: "button", status, errorDetails: "Ancienne erreur" });
  await syncBoutonsSansAction();
  let health = await getHealthStatus();
  assert.equal(health.archived, 2);
  assert.equal(health.ok, 0, "Disparition statique ≠ réussite métier");
  assert.equal(health.broken, BOUTONS_SANS_ACTION.length);
  assert.ok(health.items.every((h) => h.page !== "test/old.tsx"));
  const second = await syncBoutonsSansAction();
  assert.equal(second.synced, 0); assert.equal(second.obsoletes, 0);
  const b = BOUTONS_SANS_ACTION[0];
  await db.update(smartHealthChecks).set({ errorDetails: "Ancien libellé" }).where(eq(smartHealthChecks.page, b.fichier));
  await syncBoutonsSansAction();
  health = await getHealthStatus();
  assert.ok(health.items.filter((h) => h.page === b.fichier).every((h) => h.errorDetails !== "Ancien libellé"));
  await assert.rejects(deciderKyc(1, { profileId: 999999, action: "valide" }), /introuvable/);
  const [p] = await db.insert(kycProfiles).values({ userId: 1, status: "en_validation" }).returning();
  await assert.rejects(deciderKyc(1, { profileId: p.id, action: "valide" }), /absentes/);
  await assert.rejects(deciderKyc(1, { profileId: p.id, action: "refuse", reason: " " }), /motif/);
  await db.insert(kycDocuments).values({ profileId: p.id, docType: "piece_identite", fileUrl: "/test/document.pdf" });
  await deciderKyc(1, { profileId: p.id, action: "valide" });
  await deciderKyc(1, { profileId: p.id, action: "valide" });
  const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, p.id));
  assert.equal(logs.length, 1, "Rejeu idempotent");
  await assert.rejects(deciderKyc(2, { profileId: p.id, action: "refuse", reason: "Autre décision" }), /attente/);
  const [saved] = await db.select().from(kycProfiles).where(eq(kycProfiles.id, p.id));
  assert.equal(saved.status, "valide"); assert.equal(saved.validatedBy, 1);
  console.log("Santé : archivage, compteurs, idempotence, libellés. KYC : contrôles, persistance, audit et rejeu : OK.");
}
main().finally(() => pool.end()).catch((e) => { console.error(e); process.exitCode = 1; });
