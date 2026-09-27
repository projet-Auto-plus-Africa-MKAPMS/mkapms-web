import test from 'node:test';
import assert from 'node:assert/strict';

test('MAIN foundations persist once and preserve existing owner knowledge',async()=>{
 const url=new URL(process.env.SHOP_KNOWLEDGE_TEST_DB||'');
 assert.ok(['localhost','127.0.0.1'].includes(url.hostname));assert.equal(url.pathname,'/core_ai_test');
 process.env.DATABASE_URL=url.href;
 const {pool}=await import('../../db.js');
 try{
  await pool.query('DROP TABLE IF EXISTS in_memoire');
  await pool.query(`CREATE TABLE in_memoire(id bigserial PRIMARY KEY,categorie varchar(32) NOT NULL,cycle varchar(16) NOT NULL DEFAULT 'actif',cle varchar(200) NOT NULL DEFAULT '',titre varchar(240) NOT NULL DEFAULT '',contenu text NOT NULL DEFAULT '',mots_cles jsonb NOT NULL DEFAULT '[]',liens jsonb NOT NULL DEFAULT '{}',source varchar(64) NOT NULL DEFAULT 'intelligences',country_code varchar(8),poids integer NOT NULL DEFAULT 1,rappels integer NOT NULL DEFAULT 0,actor_id integer,updated_at timestamp NOT NULL DEFAULT now(),created_at timestamp NOT NULL DEFAULT now())`);
  const {FONDATIONS,seedFondations}=await import('../fondations.js');
  assert.equal(new Set(FONDATIONS.map(f=>f.categorie+':'+f.cle)).size,FONDATIONS.length);
  const original=FONDATIONS[0];await pool.query("INSERT INTO in_memoire(categorie,cle,contenu) VALUES($1,$2,'TEST owner existing knowledge')",[original.categorie,original.cle]);
  assert.equal((await seedFondations()).nouvelles,FONDATIONS.length-1);
  assert.equal((await seedFondations()).nouvelles,0);
  const rows=(await pool.query('SELECT categorie,cle,contenu,source FROM in_memoire')).rows;
  assert.equal(rows.length,FONDATIONS.length);
  assert.equal(rows.find(r=>r.cle===original.cle)?.contenu,'TEST owner existing knowledge');
  for(const f of FONDATIONS.slice(1)){const row=rows.find(r=>r.cle===f.cle&&r.categorie===f.categorie);assert.equal(row?.contenu,f.contenu);assert.equal(row?.source,'fondations');}
 }finally{await pool.end();}
});
