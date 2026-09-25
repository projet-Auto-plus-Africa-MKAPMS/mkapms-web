import test from 'node:test';import assert from 'node:assert/strict';import {generateKeyPairSync,sign} from 'node:crypto';
import {authenticShop,signedMessage,shopRequest} from '../shop-analysis-policy.js';
test('SHOP signed identity binds body, timestamp, endpoint and private key',()=>{
 const {privateKey,publicKey}=generateKeyPairSync('ed25519'),key=publicKey.export({format:'der',type:'spki'}).toString('base64url');
 const body={version:1,task:'TEST',items:[]},time=String(Date.now()),nonce='a'.repeat(32);
 const headers={'x-shop-time':time,'x-shop-nonce':nonce,'x-shop-signature':sign(null,signedMessage(body,time,nonce),privateKey).toString('base64url')};
 assert.equal(authenticShop(body,headers,key),true);assert.equal(authenticShop({...body,task:'ANALYSE'},headers,key),false);
 assert.equal(authenticShop(body,headers,key,Number(time)+90001),false);assert.equal(authenticShop(body,headers,undefined),false);
 const other=generateKeyPairSync('ed25519').publicKey.export({format:'der',type:'spki'}).toString('base64url');assert.equal(authenticShop(body,headers,other),false);
 assert.equal(shopRequest.safeParse({...body,role:'admin'}).success,false);assert.equal(shopRequest.safeParse({...body,task:'ANALYSE'}).success,false);
});
