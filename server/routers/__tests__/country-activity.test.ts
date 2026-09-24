/** Isolated fixtures cover country normalization, missing config and currency separation. */
import assert from 'node:assert/strict';
import { countriesRouter } from '../operations.js';
import { pool } from '../../db.js';
import type { Context } from '../../trpc.js';
const url=new URL(process.env.DATABASE_URL || 'http://invalid');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname) && url.port==='55432');
const caller=(role:string)=>countriesRouter.createCaller({user:{uid:1,role,email:'test@example.test'}} as Context);
try {
 await assert.rejects(caller('user').stats(), /back-office/);
 await assert.rejects(caller('pro').activity({code:'FR'}), /back-office/);
 const rows=await caller('admin').stats();
 const fr=rows.find(r=>r.code==='FR')!;
 assert.equal(fr.users,56); assert.equal(fr.annonces,1);
 assert.deepEqual(fr.encaissements.map(x=>[x.currency,x.amount]).sort(),[['EUR','100.00'],['USD','200.00']]);
 assert.equal(rows.find(r=>r.code==='GN')?.users,1,'unconfigured country retained');
 assert.equal(rows.find(r=>r.code==='GN')?.configured,false);
 assert.equal(rows.find(r=>r.code==='')?.users,1,'unknown country explicit');
 assert.equal(rows.find(r=>r.code==='NA')?.users,0,'Namibia not confused with unknown');
 const first=await caller('admin').activity({code:'fr'});
 assert.equal(first.accounts.length,50);assert.equal(first.moreAccounts,true);assert.equal(first.listings.length,1);
 const second=await caller('admin').activity({code:'FR',usersOffset:50});
 assert.equal(second.accounts.length,6);assert.equal(second.moreAccounts,false);
 assert.ok(!first.accounts.some(a=>second.accounts.some(b=>a.id===b.id)));
 await assert.rejects(caller('admin').activity({code:'FR',usersOffset:-1}));
 const unknown=await caller('admin').activity({code:''});
 assert.equal(unknown.accounts.length,1);assert.equal(unknown.listings.length,1);
 console.log('PASS: real country counters, payments grouped by currency, failed/pending excluded, unknown vs Namibia, permissions and pagination.');
} finally {await pool.end();}
