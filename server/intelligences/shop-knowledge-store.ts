/** Reuses existing IA knowledge storage and visibility, without a business schema migration. */
import type { Pool } from 'pg';
import { digest, type ShopBatch } from './shop-knowledge-contract.js';
export async function persistShopBatch(pool:Pool,b:ShopBatch){
 const c=await pool.connect();
 const prefix=`github:${b.repository}@${b.commit}`,source=`${prefix}#${b.part}`;
 try{
  await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(721954,71)');
  const previous=await c.query('SELECT id,contenu FROM in_connaissance WHERE source=$1 AND auteur=$2',[source,'shop-ci']);
  if(previous.rows.length&&digest(JSON.parse(previous.rows[0].contenu).batch)!==digest(b))throw Error('SNAPSHOT_CONFLICT');
  if(!previous.rows.length)await c.query("INSERT INTO in_connaissance(categorie,titre,contenu,source,version,auteur,statut,visibilite,validite) VALUES('architecture',$1,$2,$3,'1','shop-ci','propose','pdg_uniquement','permanente')",[`SHOP ${b.commit.slice(0,12)} · références techniques ${b.part+1}/${b.parts}`,JSON.stringify({batch:b,digest:digest(b)}),source]);
  const rows=(await c.query("SELECT id,contenu FROM in_connaissance WHERE source LIKE $1 AND auteur='shop-ci'",[prefix+'#%'])).rows;
  const batches=rows.map(r=>JSON.parse(r.contenu).batch as ShopBatch).sort((a,b)=>a.part-b.part);
  if(batches.some(x=>x.parts!==b.parts||x.snapshotHash!==b.snapshotHash))throw Error('SNAPSHOT_CONFLICT');
  const complete=batches.length===b.parts&&batches.every((x,i)=>x.part===i);
  if(complete){
   if(digest(batches.flatMap(x=>x.records))!==b.snapshotHash)throw Error('SNAPSHOT_CONFLICT');
   await c.query("UPDATE in_connaissance SET statut='confirme',updated_at=now() WHERE id=ANY($1::int[])",[rows.map(r=>r.id)]);
  }
  if(!previous.rows.length)await c.query("INSERT INTO in_actions(commande,argument,resultat,detail) VALUES('shop_knowledge',$1,'execute',$2)",[source,JSON.stringify({commit:b.commit,runId:b.runId,part:b.part,complete,snapshotHash:b.snapshotHash})]);
  await c.query('COMMIT');
  return {status:complete?'INDEXED_METADATA':'PERSISTED_PART',knowledgePersisted:true,repositoryIndexed:complete,codeContentIndexed:false,commit:b.commit,snapshotHash:b.snapshotHash,receivedParts:batches.length,totalParts:b.parts,recordIds:rows.map(r=>r.id)};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
