/** Regression IMG_1876: archives must not dilute the current button rate. */
import assert from 'node:assert/strict';
import { db, pool } from '../../db.js';
import { smartHealthChecks } from '../../smart-engine/schema.js';
import { getHealthStatus } from '../../smart-engine/services/health-monitor.js';
import { getButtonHealthCategory } from '../../smart-engine/services/platform-health.js';
const url = new URL(process.env.DATABASE_URL || 'http://invalid');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname) && url.port === '55432');
try {
  const empty = await getButtonHealthCategory();
  assert.equal(empty.headline, '—'); assert.equal(empty.level, 'yellow');
  const rows = [
    ...Array.from({length:123},(_,i)=>({page:'test',element:`archive-${i}`,elementType:'button',status:'archived'})),
    ...Array.from({length:16},(_,i)=>({page:'test',element:`ok-${i}`,elementType:i%2?'link':'button',status:'ok'})),
    ...Array.from({length:60},(_,i)=>({page:'test',element:`broken-${i}`,elementType:'button',status:i%2?'missing':'broken'})),
    {page:'test',element:'image',elementType:'image',status:'ok'},
  ];
  await db.insert(smartHealthChecks).values(rows);
  const health = await getHealthStatus(['button','link']);
  assert.deepEqual([health.total,health.ok,health.broken,health.archived],[76,16,60,123]);
  const category = await getButtonHealthCategory();
  assert.equal(category.headline, '21% OK'); assert.equal(category.level, 'red');
  assert.ok(category.detail.includes('16/76')); assert.ok(category.detail.includes('123 anciens'));
  await db.insert(smartHealthChecks).values([{page:'test',element:'slow',elementType:'button',status:'slow'},{page:'test',element:'unknown',elementType:'button',status:'unknown'}]);
  const withOther = await getHealthStatus(['button','link']);
  assert.equal(withOther.total, withOther.ok+withOther.broken+withOther.slow+withOther.unknown);
  assert.ok((await getButtonHealthCategory()).detail.includes('1 lents · 1 non évalués'));
  console.log('PASS: screenshot 16/199 reproduced; 123 archives retained; rate 16/76; failures, slow and unknown explicit; images excluded.');
} finally { await pool.end(); }
