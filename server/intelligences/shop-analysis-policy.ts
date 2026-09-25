import { createHash, createPublicKey, verify } from 'node:crypto';
import { z } from 'zod';
export const shopRequest = z.object({version:z.literal(1),task:z.enum(['TEST','ANALYSE','SELECTION','DESCRIPTION']),items:z.array(z.object({id:z.string().uuid(),sku:z.string().max(120),title:z.string().max(500),description:z.string().max(6000),facts:z.record(z.union([z.string().max(2000),z.number(),z.null()]))}).strict()).max(25)}).strict().refine(v=>v.task==='TEST'?v.items.length===0:v.items.length>0);
export function signedMessage(body:unknown,time:string,nonce:string){return Buffer.from(['SHOP-AI-1','POST','/api/v1/shop/analyse',time,nonce,createHash('sha256').update(JSON.stringify(body)).digest('hex')].join('\n'));}
export function authenticShop(body:unknown,headers:Record<string,unknown>,publicKey:string|undefined,now=Date.now()){
 try{
  const time=headers['x-shop-time'],nonce=headers['x-shop-nonce'],signature=headers['x-shop-signature'];
  if(!publicKey||typeof time!=='string'||!/^\d{13}$/.test(time)||Math.abs(now-Number(time))>90000||typeof nonce!=='string'||!/^[a-f0-9]{32}$/.test(nonce)||typeof signature!=='string'||!/^[A-Za-z0-9_-]{86}$/.test(signature))return false;
  const key=createPublicKey({key:Buffer.from(publicKey,'base64url'),format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&verify(null,signedMessage(body,time,nonce),key,Buffer.from(signature,'base64url'));
 }catch{return false;}
}
/** Persist only nonce/quota metadata, never SHOP content or responses. */
export async function reserveShopCall(pool:any,nonce:string,limit=100){
 const c=await pool.connect();try{
  await c.query('BEGIN');await c.query("SELECT pg_advisory_xact_lock(hashtext('shop-ai-service'))");
  const r=await c.query("SELECT count(*)::int AS calls,count(*) FILTER (WHERE argument=$1)::int AS replay,count(*) FILTER (WHERE created_at>now()-interval '1 minute')::int AS recent FROM in_actions WHERE commande='shop_ai_call' AND created_at>now()-interval '24 hours'",[nonce]);
  if(r.rows[0].replay||r.rows[0].calls>=limit||r.rows[0].recent>=5){await c.query('ROLLBACK');return false;}
  await c.query("INSERT INTO in_actions(commande,argument,resultat,detail) VALUES('shop_ai_call',$1,'execute','SHOP isolated inference')",[nonce]);await c.query('COMMIT');return true;
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
