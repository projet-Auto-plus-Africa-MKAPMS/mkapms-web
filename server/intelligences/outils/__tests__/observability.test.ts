import assert from 'node:assert/strict';
import { db, pool } from '../../../db.js';
import { ensureSeeded } from '../../../engine-registry/service.js';
import { engineRegistry } from '../../../engine-registry/schema.js';
import { eq } from 'drizzle-orm';
import { trouver, listerActifs } from '../registre.js';
import { executer } from '../executeur.js';
import { evaluer } from '../politique.js';
const url=new URL(process.env.DATABASE_URL || 'http://invalid');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname) && url.port==='55432');
try {
 const tool=trouver('observabilite.getSystemHealth')!;
 assert.ok(tool && listerActifs().includes(tool));
 for(const role of [null,'user','pro','employee']) {
   assert.equal((await evaluer(tool,{role,moteur:'intelligences'})).verdict,'refuse');
   assert.equal((await executer(tool,'{}',{role,moteur:'intelligences',actorId:1})).statut,'erreur');
 }
 assert.equal((await executer(tool,'{}',{role:'admin',moteur:'intelligences'})).statut,'erreur');
 await ensureSeeded();
 await db.update(engineRegistry).set({state:'disabled',health:'down'}).where(eq(engineRegistry.name,'payment'));
 const response=await executer(tool,'{}',{role:'admin',moteur:'intelligences',actorId:1});
 assert.equal(response.statut,'execute');
 const payload=response.resultat as {totalEnregistre:number;moteurs:Array<{name:string;etatObserve:{state:string};inventaireCode:{manques:number}}>};
 assert.equal(payload.totalEnregistre,94);
 assert.equal(payload.moteurs.find(x=>x.name==='payment')?.etatObserve.state,'disabled');
 const detail=await executer(tool,'{"engine":"payment"}',{role:'super_admin',moteur:'intelligences',actorId:1});
 assert.equal(detail.statut,'execute');
 const details=detail.resultat as {moteurs:Array<{inventaireCode:{manques:unknown[];procedures:unknown[]}}>};
 assert.equal(details.moteurs.length,1);assert.ok(Array.isArray(details.moteurs[0].inventaireCode.manques));
 assert.ok(Array.isArray(details.moteurs[0].inventaireCode.procedures));
 assert.equal((await executer(tool,'{"engine":"not_real"}',{role:'admin',moteur:'intelligences',actorId:1})).statut,'erreur');
 const [unchanged]=await db.select().from(engineRegistry).where(eq(engineRegistry.name,'payment'));
 assert.equal(unchanged.state,'disabled');assert.equal(unchanged.health,'down');
 console.log('PASS: AI health tool wired through executor; 94 live registry entries; detailed engine scope; unauthorized roles/anonymous denied; no state writes.');
}finally{await pool.end();}
