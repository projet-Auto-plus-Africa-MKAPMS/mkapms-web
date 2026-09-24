/** Pure regression tests: no connection to a database or production service. */
import assert from 'node:assert/strict';
import { resolveDependencies } from '../service.js';
import { evaluate } from '../readiness.js';
import { ENGINE_CATALOG } from '../catalog.js';
import { MOTEURS } from '../../data/moteurs.js';
import { buildItem } from '../../activation-audit/service.js';
import type { Inventory } from '../../activation-audit/inventory.js';
import { engineRegistry } from '../schema.js';

for (const motor of MOTEURS) {
  const resolved = resolveDependencies(motor.moteur);
  for (const dependency of motor.dependances) assert.ok(resolved.includes(dependency), `${motor.moteur} missing ${dependency}`);
  assert.equal(new Set(resolved).size, resolved.length);
  assert.ok(!resolved.includes(motor.moteur));
}
assert.ok(resolveDependencies('core', ['custom', 'core']).includes('custom'));
assert.ok(resolveDependencies('core', []).includes('identity'));
assert.equal(MOTEURS.length, ENGINE_CATALOG.length);

function row(name: string, changes: Partial<typeof engineRegistry.$inferSelect> = {}): typeof engineRegistry.$inferSelect {
  return {id: 1, name, label: name, category: 'service', version: '1', state: 'active', health: 'ok', description: null, dependencies: [], lastHeartbeat: new Date(), createdAt: new Date(), updatedAt: new Date(), ...changes};
}
const main = row('media_authenticity', { dependencies: ['provider'] });
const provider = row('provider');
const readiness = (changes: Partial<typeof engineRegistry.$inferSelect>) => evaluate(main, new Map([[main.name, main], ['provider', row('provider', changes)]]));
assert.equal(readiness({}).operational, 'ok');
for (const changes of [{health:'unknown'}, {health:'degraded'}, {state:'staging'}, {state:'maintenance'}, {state:'read_only'}, {state:'disabled'}, {lastHeartbeat:null}, {lastHeartbeat:new Date(0)}]) {
  assert.equal(readiness(changes).operational, 'partiel', JSON.stringify(changes));
  assert.deepEqual(readiness(changes).unhealthyDependencies, ['provider']);
}
assert.equal(evaluate(main, new Map()).operational, 'non_configure');
const engine = readiness({});
const inv: Inventory = { engines: [engine], routers: [{namespace:'mediaAuthenticity',queries:1,mutations:1}], routeFamilies: [], usage: new Map([['media_authenticity',{engine:'media_authenticity', rows:1,tablesPresentes:1,tablesAbsentes:[]}]]), tests: new Map([['mediaauthenticity',{domain:'media_authenticity',scenarios:1,passed:1,total:1,allSuccess:true,lastAt:new Date().toISOString()}]]) };
assert.equal(buildItem(engine, inv).etat, 'operationnelle');
assert.equal(buildItem({...engine,state:'staging'}, inv).etat, 'operationnelle', 'valid staging evidence remains eligible');
for (const changes of [{heartbeatStale:true}, {health:'unknown'}, {state:'maintenance'}, {state:'read_only'}, {unhealthyDependencies:['provider']}]) {
  assert.notEqual(buildItem({...engine,...changes}, inv).etat, 'operationnelle', JSON.stringify(changes));
}
const missingTable: Inventory = {...inv, usage:new Map([['media_authenticity',{engine:'media_authenticity',rows:1,tablesPresentes:1,tablesAbsentes:['missing']} ]])};
assert.notEqual(buildItem(engine, missingTable).etat, 'operationnelle');
const payment = {...engine,name:'payment'};
const partial: Inventory = {...inv, routers:[{namespace:'paymentEngine',queries:1,mutations:1}]};
const verdict = buildItem(payment, partial);
assert.equal(verdict.connecte, false, 'one router cannot prove the whole payment motor');
assert.ok(verdict.manquant.some(x=>x.includes('wallet')));
console.log(`PASS: dependencies of ${MOTEURS.length} motors, partial providers, staging evidence, incomplete router and table coverage.`);
