import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { shopBatch,verifyShopIdentity,SHOP_REPOSITORY,SHOP_AUDIENCE,digest } from '../shop-knowledge-contract.js';
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const keys=async()=>({keys:[{...publicKey.export({format:'jwk'}),kid:'fixture',alg:'RS256'}]});
const records=[{kind:'file',path:'src/catalog.ts',sha256:'a'.repeat(64),createdCommit:null,lastChangedCommit:null}];
const batch=shopBatch.parse({version:1,repository:SHOP_REPOSITORY,commit:'a'.repeat(40),runId:'123',snapshotHash:digest(records),part:0,parts:1,records});
const claims={repository:SHOP_REPOSITORY,repository_id:'1384265241',repository_owner_id:'288550052',ref:'refs/heads/main',event_name:'push',workflow_ref:`${SHOP_REPOSITORY}/.github/workflows/shop-step1.yml@refs/heads/main`,sha:batch.commit,run_id:'123',runner_environment:'github-hosted'};
const sign=(changes={})=>jwt.sign({...claims,...changes},privateKey,{algorithm:'RS256',keyid:'fixture',issuer:'https://token.actions.githubusercontent.com',audience:SHOP_AUDIENCE,expiresIn:300});
test('signed approved main workflow can ingest its own commit only',async()=>{
 assert.equal((await verifyShopIdentity(sign(),batch,keys)).commit,batch.commit);
 for(const changes of [{repository:'attacker/shop'},{repository_id:'1'},{repository_owner_id:'1'},{ref:'refs/heads/other'},{event_name:'pull_request'},{workflow_ref:'other'},{sha:'b'.repeat(40)},{run_id:'124'},{runner_environment:'self-hosted'}])await assert.rejects(verifyShopIdentity(sign(changes),batch,keys));
});
test('expired, unsigned, wrong audience and modified signatures fail',async()=>{
 const wrongAudience=jwt.sign(claims,privateKey,{algorithm:'RS256',keyid:'fixture',issuer:'https://token.actions.githubusercontent.com',audience:'other',expiresIn:300});
 const expired=jwt.sign(claims,privateKey,{algorithm:'RS256',keyid:'fixture',issuer:'https://token.actions.githubusercontent.com',audience:SHOP_AUDIENCE,expiresIn:-30});
 for(const token of ['',sign().slice(0,-10)+'abcdefghij',wrongAudience,expired])await assert.rejects(verifyShopIdentity(token,batch,keys));
});
test('contract accepts references, refuses traversal, source code, extra data and oversized batches',()=>{
 for(const records of [[{...batch.records[0],path:'../.env'}],[{...batch.records[0],contents:'secret'}],Array(31).fill(batch.records[0])])assert.equal(shopBatch.safeParse({...batch,records}).success,false);
 assert.equal(shopBatch.safeParse({...batch,part:1}).success,false);
});
