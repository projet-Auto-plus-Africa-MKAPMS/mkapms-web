import { Router } from 'express';
import { pool } from '../db.js';
import { shopBatch,verifyShopIdentity } from './shop-knowledge-contract.js';
import { persistShopBatch } from './shop-knowledge-store.js';
export const shopKnowledge=Router();
// Existing API resilience/write gate remains in force. No alternate auth bypass.
shopKnowledge.post('/intelligences/shop/knowledge',async(req,res)=>{
 const parsed=shopBatch.safeParse(req.body);
 if(!parsed.success||Buffer.byteLength(JSON.stringify(req.body))>60000)return res.status(400).json({ok:false,status:'INVALID_MANIFEST'});
 const header=req.headers.authorization;const token=header?.startsWith('Bearer ')?header.slice(7):'';
 try{await verifyShopIdentity(token,parsed.data);}catch{return res.status(401).json({ok:false,status:'IDENTITY_REFUSED'});}
 try{return res.json({ok:true,...await persistShopBatch(pool,parsed.data)});}
 catch(e){return res.status(e instanceof Error&&e.message==='SNAPSHOT_CONFLICT'?409:503).json({ok:false,status:e instanceof Error&&e.message==='SNAPSHOT_CONFLICT'?'SNAPSHOT_CONFLICT':'KNOWLEDGE_UNAVAILABLE'});}
});
