import assert from "node:assert/strict";
import { favorisRouter } from "../favoris.js";
import { db, pool } from "../../db.js";
import { favoris } from "../../schema.js";
import { sql } from "drizzle-orm";
import type { Context } from "../../trpc.js";
const caller = (uid: number | null) => favorisRouter.createCaller({user:uid?{uid,role:"user",email:"test@example.test"}:null} as Context);
async function main() {
  assert.match(process.env.DATABASE_URL??"",/(?:localhost|127\.0\.0\.1):55432\//);
  await db.execute(sql`insert into annonces(id,status) values(1,'publiee'),(2,'brouillon')`);
  await assert.rejects(caller(null).set({annonceId:1,favori:true}), /Connexion/);
  await assert.rejects(caller(1).set({annonceId:999,favori:true}), /disponible/);
  await assert.rejects(caller(1).set({annonceId:2,favori:true}), /disponible/);
  await caller(1).set({annonceId:1,favori:true});
  await caller(1).set({annonceId:1,favori:true});
  assert.equal((await db.select().from(favoris)).length,1);
  await caller(2).set({annonceId:1,favori:false});
  assert.equal((await db.select().from(favoris)).length,1);
  await caller(1).set({annonceId:1,favori:false});
  await caller(1).set({annonceId:1,favori:false});
  assert.equal((await db.select().from(favoris)).length,0);
  await caller(1).toggle({annonceId:1});
  assert.equal((await db.select().from(favoris)).length,1);
  console.log("Favoris : authentification, annonce valide, idempotence, isolation et compatibilité toggle : OK");
}
main().finally(()=>pool.end()).catch(e=>{console.error(e);process.exitCode=1});
