import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { persistShopBatch } from '../shop-knowledge-store.js';
import { shopBatch,digest,SHOP_REPOSITORY } from '../shop-knowledge-contract.js';
test('real PostgreSQL ingestion: private, atomic, idempotent, complete hash required',async()=>{
 const url=new URL(process.env.SHOP_KNOWLEDGE_TEST_DB||'');assert.ok(['localhost','127.0.0.1'].includes(url.hostname));assert.equal(url.pathname,'/core_ai_test');
 const pool=new pg.Pool({connectionString:url.href});
 try{
 await pool.query('DROP TABLE IF EXISTS in_connaissance; CREATE TABLE in_connaissance(id serial PRIMARY KEY,categorie text,titre text,contenu text,source text,version text,auteur text,statut text,visibilite text,validite text,updated_at timestamp DEFAULT now())');
 await pool.query('DROP TABLE IF EXISTS in_actions; CREATE TABLE in_actions(id serial PRIMARY KEY,commande text,argument text,resultat text,detail text)');
 const records=[{kind:'file',path:'src/a.ts',sha256:'a'.repeat(64),createdCommit:null,lastChangedCommit:null},{kind:'file',path:'src/b.ts',sha256:'b'.repeat(64),createdCommit:null,lastChangedCommit:null}];
 const base={version:1,repository:SHOP_REPOSITORY,commit:'a'.repeat(40),runId:'123',snapshotHash:digest(records),part:0,parts:2,records:[records[0]]};
 const first=shopBatch.parse(base),last=shopBatch.parse({...base,part:1,records:[records[1]]});
 assert.equal((await persistShopBatch(pool,first)).repositoryIndexed,false);
 assert.equal((await pool.query("SELECT count(*) FROM in_connaissance WHERE statut='confirme'")).rows[0].count,'0');
 const [a,b]=await Promise.all([persistShopBatch(pool,last),persistShopBatch(pool,last)]);assert.equal(a.repositoryIndexed,true);assert.deepEqual(a.recordIds,b.recordIds);
 const rows=(await pool.query('SELECT * FROM in_connaissance')).rows;assert.equal(rows.length,2);assert.equal((await pool.query('SELECT count(*) FROM in_actions')).rows[0].count,'2');assert.ok(rows.every(x=>x.visibilite==='pdg_uniquement'&&x.statut==='confirme'));
 await assert.rejects(persistShopBatch(pool,{...first,records:last.records}),/CONFLICT/);
 const corrupt={...first,commit:'b'.repeat(40),parts:1};await assert.rejects(persistShopBatch(pool,corrupt),/CONFLICT/);
 assert.equal((await pool.query('SELECT count(*) FROM in_connaissance')).rows[0].count,'2');
 }finally{await pool.end();}
});
