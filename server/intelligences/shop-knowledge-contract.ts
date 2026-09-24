/** SHOP knowledge only: no execution, deployment, provider key or business data scope. */
import { createPublicKey, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
export const SHOP_REPOSITORY='projet-Auto-plus-Africa-MKAPMS/mkapms-shop';
export const SHOP_AUDIENCE='mkapms-intelligence:shop-knowledge';
const hex=z.string().regex(/^[a-f0-9]{40}$/),hash=z.string().regex(/^[a-f0-9]{64}$/);
const path=z.string().max(240).regex(/^[a-zA-Z0-9_.\/-]+$/).refine(p=>!p.startsWith('/')&&!p.split('/').includes('..')&&!/(^|\/)(\.env|node_modules|\.git)(\/|$)/.test(p));
const record=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('document'),path,sha256:hash,offset:z.number().int().min(0).max(1000000),text:z.string().min(1).max(1500)}).strict(),
 z.object({kind:z.literal('file'),path,sha256:hash,createdCommit:hex.nullable(),lastChangedCommit:hex.nullable()}).strict(),
 z.object({kind:z.literal('capability'),id:z.string().max(150),owner:z.string().max(150),path,status:z.string().max(80),tests:z.array(path).max(40),permissions:z.array(z.string().max(120)).max(30)}).strict(),
 z.object({kind:z.literal('commit'),sha:hex,parents:z.array(hex).max(5),date:z.string().datetime({offset:true})}).strict(),
]);
export const shopBatch=z.object({version:z.literal(1),repository:z.literal(SHOP_REPOSITORY),commit:hex,runId:z.string().regex(/^\d{1,20}$/),snapshotHash:hash,part:z.number().int().min(0).max(99),parts:z.number().int().min(1).max(100),records:z.array(record).min(1).max(30)}).strict().refine(b=>b.part<b.parts);
export type ShopBatch=z.infer<typeof shopBatch>;
export const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
let cachedKeys:unknown=null,expires=0;
async function keys(){
 if(cachedKeys&&Date.now()<expires)return cachedKeys;
 const response=await fetch('https://token.actions.githubusercontent.com/.well-known/jwks',{redirect:'error',signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('IDENTITY_UNAVAILABLE');
 cachedKeys=await response.json();expires=Date.now()+60000;return cachedKeys;
}
/** Fixed issuer, audience, immutable repository/owner IDs, main push and exact approved workflow. */
export async function verifyShopIdentity(token:string,batch:ShopBatch,getKeys:()=>Promise<unknown>=keys){
 if(token.length>16000)throw Error('IDENTITY_REFUSED');
 const decoded=jwt.decode(token,{complete:true});
 if(!decoded||decoded.header.alg!=='RS256'||typeof decoded.header.kid!=='string')throw Error('IDENTITY_REFUSED');
 const jwks=z.object({keys:z.array(z.object({kid:z.string(),kty:z.literal('RSA'),n:z.string(),e:z.string(),alg:z.literal('RS256').optional(),use:z.literal('sig').optional()}).passthrough()).max(20)}).parse(await getKeys());
 const key=jwks.keys.find(k=>k.kid===decoded.header.kid);if(!key)throw Error('IDENTITY_REFUSED');
 const claim=jwt.verify(token,createPublicKey({key,format:'jwk'}),{algorithms:['RS256'],issuer:'https://token.actions.githubusercontent.com',audience:SHOP_AUDIENCE,clockTolerance:5}) as jwt.JwtPayload;
 const now=Math.floor(Date.now()/1000);
 const expected={repository:SHOP_REPOSITORY,repository_id:'1384265241',repository_owner_id:'288550052',ref:'refs/heads/main',event_name:'push',workflow_ref:`${SHOP_REPOSITORY}/.github/workflows/shop-step1.yml@refs/heads/main`,sha:batch.commit,run_id:batch.runId,runner_environment:'github-hosted'};
 if(Object.entries(expected).some(([k,v])=>claim[k]!==v)||typeof claim.iat!=='number'||typeof claim.exp!=='number'||claim.iat>now+5||claim.iat<now-900||claim.exp-claim.iat>900)throw Error('IDENTITY_REFUSED');
 return {runId:batch.runId,commit:batch.commit};
}
