import assert from 'node:assert/strict';
import {sql} from 'drizzle-orm';
import {db,pool} from '../../db.js';
import {garagesRouter} from '../garages.js';
import type {Context} from '../../trpc.js';
import {actionInterventionDirection} from '../../atelier-engine/administration.js';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.port==='55432');
const caller=(role:string)=>garagesRouter.createCaller({user:{uid:99,role,email:'test@example.test'}} as Context);
try {
 for(const role of ['user','pro','garage']) {
  await assert.rejects(caller(role).adminInterventions({}),/back-office/);
  await assert.rejects(caller(role).adminIntervention({id:1}),/back-office/);
  await assert.rejects(caller(role).adminAction({id:1,action:'terminer',expectedStatus:'pret',reason:'Test'}),/back-office/);
 }
 const first=await caller('admin').adminInterventions({});const second=await caller('admin').adminInterventions({offset:50});
 assert.equal(first.items.length,50);assert.equal(first.hasMore,true);assert.equal(second.items.length,5);
 assert.ok(!first.items.some(i=>second.items.some(j=>j.id===i.id)));
 const result=await caller('admin').adminInterventions({search:'Véhicule Test'});assert.equal(result.items.length,1);
 assert.equal(result.items[0].client,'Client Test');
 const act=(id:number,action:'terminer'|'annuler'|'archive'|'restore',expectedStatus:string)=>actionInterventionDirection(99,{id,action,expectedStatus,reason:'Motif test'});
 await assert.rejects(act(2,'terminer','en_attente'),/qualité/);
 await assert.rejects(act(2,'archive','en_attente'),/Clôturez/);
 await assert.rejects(act(1,'terminer','en_attente'),/changé/);
 assert.equal((await act(1,'terminer','pret')).changed,true);
 assert.equal((await act(1,'terminer','pret')).changed,false);
 let detail=await caller('admin').adminIntervention({id:1});assert.equal(detail.history.length,1);assert.equal(detail.audit.length,1);assert.equal(detail.item.status,'termine');
 await act(1,'archive','termine');await act(1,'archive','termine');
 detail=await caller('admin').adminIntervention({id:1});assert.equal(detail.item.archived,true);assert.equal(detail.audit.length,2);
 assert.equal((await caller('admin').adminInterventions({search:'Véhicule Test'})).items.length,1,'archive remains visible');
 await act(1,'restore','termine');detail=await caller('admin').adminIntervention({id:1});assert.equal(detail.item.archived,false);
 await act(2,'annuler','en_attente');assert.equal((await caller('admin').adminIntervention({id:2})).item.status,'annulee');
 await assert.rejects(act(1,'annuler','termine'),/clôturée/);
 await assert.rejects(caller('admin').adminIntervention({id:999}),/introuvable/);
 assert.equal(Number((await db.execute(sql`SELECT count(*) FROM rdv_garage`)).rows[0].count),55);
 console.log('PASS: real data, search/pagination, role isolation, detail/history, persisted completion/cancellation, safe transitions, repeat idempotence, reversible archive with no deletion.');
} finally {await pool.end();}
