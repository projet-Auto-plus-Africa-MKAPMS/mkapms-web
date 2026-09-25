import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';import {reserveShopCall} from '../shop-analysis-policy.js';
test('persistent replay and quota protection survives concurrent requests',async()=>{
 const url=new URL(process.env.SHOP_KNOWLEDGE_TEST_DB||'');assert.ok(['localhost','127.0.0.1'].includes(url.hostname));assert.equal(url.pathname,'/core_ai_test');
 const pool=new pg.Pool({connectionString:url.href});try{
 await pool.query('DROP TABLE IF EXISTS in_actions');await pool.query("CREATE TABLE in_actions(id serial primary key,commande text,argument text,resultat text,detail text,created_at timestamptz default now())");
 const results=await Promise.all([reserveShopCall(pool,'nonce'),reserveShopCall(pool,'nonce')]);assert.equal(results.filter(Boolean).length,1);
 assert.equal(await reserveShopCall(pool,'second',1),false);
 const r=await pool.query('SELECT * FROM in_actions');assert.equal(r.rows.length,1);assert.equal(r.rows[0].argument,'nonce');assert.equal(r.rows[0].detail,'SHOP isolated inference');
 }finally{await pool.end();}
});
