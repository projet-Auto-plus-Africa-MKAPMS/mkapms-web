import assert from 'node:assert/strict';
import { db, pool } from '../../db.js';
import { smartHealthChecks } from '../../smart-engine/schema.js';
import { getHealthStatus, registerCriticalElements, reportHealthCheck } from '../../smart-engine/services/health-monitor.js';
import { eq } from 'drizzle-orm';
const url = new URL(process.env.DATABASE_URL || 'http://invalid');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname) && url.port === '55432');
try {
  await registerCriticalElements();
  await registerCriticalElements();
  let health = await getHealthStatus();
  assert.deepEqual([health.total, health.ok, health.unknown], [21, 0, 21]);
  assert.ok(health.items.every(row => row.lastCheckedAt === null));
  assert.equal((await getHealthStatus(['button','link'])).unknown, 16);
  const broken = health.items[0];
  const observedAt = new Date('2026-09-24T12:00:00Z');
  await db.update(smartHealthChecks).set({status:'broken',errorDetails:'API indisponible',lastCheckedAt:observedAt}).where(eq(smartHealthChecks.id,broken.id));
  const ok = health.items[1];
  await reportHealthCheck({page:ok.page,element:ok.element,elementType:ok.elementType,status:'ok'});
  await registerCriticalElements();
  health = await getHealthStatus();
  assert.deepEqual([health.total,health.ok,health.broken,health.unknown],[21,1,1,19]);
  const retained = health.items.find(row=>row.id===broken.id)!;
  assert.equal(retained.errorDetails,'API indisponible');
  assert.equal(retained.lastCheckedAt!.toISOString(),observedAt.toISOString());
  console.log('PASS: 21 untested targets remain unknown; repeated registration preserves measured success, failure, timestamp and details.');
} finally { await pool.end(); }
