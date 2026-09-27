import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';import {readFile} from 'node:fs/promises';import {randomUUID} from 'node:crypto';
import {produire,lire,lister} from '../media-productions.js';
test('private media persistence, isolation, idempotence, quota and failure',async()=>{
 const u=new URL(process.env.SHOP_KNOWLEDGE_TEST_DB||'');assert.ok(['localhost','127.0.0.1'].includes(u.hostname));assert.equal(u.pathname,'/core_ai_test');
 const base=new pg.Pool({connectionString:u.href});
 try{
 await base.query('DROP TABLE IF EXISTS in_media_productions');await base.query(await readFile('drizzle/0147_intelligence_media_productions.sql','utf8'));
 let calls=0;
 const exec=async()=>{calls++;return {ok:true,media:{mime:'image/png' as const,base64:'private-image'}} as any;};
 const input={requestId:randomUUID(),operation:'image' as const,texte:'Une illustration',droitsConfirmes:true as const};
 const results=await Promise.all([produire(7,'super_admin',input,base,exec),produire(7,'super_admin',input,base,exec)]);
 assert.equal(calls,1);assert.ok(results.some(r=>r.statut==='READY'));
 assert.equal((await lire(input.requestId,7,base)).donnees,'private-image');
 await assert.rejects(lire(input.requestId,8,base));assert.equal((await lister(8,base)).length,0);
 assert.equal('donnees' in (await lister(7,base))[0],false);
 await assert.rejects(produire(7,'super_admin',{...input,texte:'Un autre contenu'},base,exec));assert.equal(calls,1);
 const failed={...input,requestId:randomUUID()};assert.equal((await produire(7,'super_admin',failed,base,async()=>{throw Error('private provider error');})).statut,'FAILED');
 assert.equal((await lire(failed.requestId,7,base)).donnees,null);
 assert.ok(!(await lire(failed.requestId,7,base)).motif.includes('private provider'));
 await assert.rejects(produire(7,'super_admin',{...input,requestId:randomUUID(),texte:'api_key=secret'},base,exec));
 for(let i=0;i<18;i++)await base.query("INSERT INTO in_media_productions(id,owner_id,operation,input_hash,texte,statut) VALUES($1,7,'image','test','test','FAILED')",[randomUUID()]);
 await assert.rejects(produire(7,'super_admin',{...input,requestId:randomUUID()},base,exec),/20 productions/);assert.equal(calls,1);
 }finally{await base.end();}
});
