import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { db, pool } from '../../db.js';
import { engineRegistry } from '../schema.js';
import { ensureSeeded, registerEngine, resolveDependencies } from '../service.js';
import { MOTEURS } from '../../data/moteurs.js';
const url = new URL(process.env.DATABASE_URL || 'http://invalid');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname) && url.port === '55432', 'isolated disposable database only');
try {
  await ensureSeeded();
  let rows = await db.select().from(engineRegistry);
  assert.equal(rows.length, MOTEURS.length);
  for (const row of rows) assert.deepEqual(row.dependencies, resolveDependencies(row.name), row.name);
  await db.update(engineRegistry).set({state:'disabled', dependencies:['obsolete']}).where(eq(engineRegistry.name,'payment'));
  await ensureSeeded();
  await registerEngine({name:'payment',label:'Payment',dependencies:['core'],state:'active'});
  const [payment] = await db.select().from(engineRegistry).where(eq(engineRegistry.name,'payment'));
  assert.equal(payment.state, 'disabled', 'manual administrative decision preserved');
  assert.deepEqual(payment.dependencies, resolveDependencies('payment'));
  assert.ok(payment.dependencies?.includes('cartegrise'), 'detected webhook connection persisted');
  assert.ok(!payment.dependencies?.includes('obsolete'), 'obsolete database declaration not perpetuated');
  await ensureSeeded();
  rows = await db.select().from(engineRegistry);
  assert.equal(rows.length, MOTEURS.length, 'repeated boot is idempotent');
  console.log('PASS: 94 registrations, detected dependencies persisted, administrative state preserved, repeated seed.');
} finally { await pool.end(); }
