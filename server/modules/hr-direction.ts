import { z } from 'zod';
import { sql, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db } from '../db.js';
import { hrRecords, hrWeeklyTasks, users, auditLogs } from '../schema.js';
export const staffProfileInput = z.object({id:z.number().int().positive(),nom:z.string().trim().min(2).max(160),email:z.string().trim().email().max(190),tel:z.string().max(32),poste:z.string().max(128),service:z.string().max(128),adresse:z.string().max(500),statut:z.enum(['actif','conge','absent'])});
export const staffTaskInput = z.object({userId:z.number().int().positive(),requestId:z.string().uuid(),day:z.number().int().min(0).max(6),startMinute:z.number().int().min(0).max(1439),endMinute:z.number().int().min(1).max(1440),title:z.string().trim().min(2).max(255)}).refine(x=>x.endMinute>x.startMinute,{message:'La fin doit suivre le début.'});
export async function staffDirectory() {
 const rows=await db.execute(sql`SELECT u.id,u.name,u.email,u.phone,u.status, h.poste,h.contract_type AS "contractType",h.date_embauche AS "dateEmbauche",h.profile,
 (SELECT score FROM hr_evaluations WHERE user_id=u.id AND score IS NOT NULL ORDER BY created_at DESC,id DESC LIMIT 1) AS performance,
 EXISTS(SELECT 1 FROM hr_leaves WHERE user_id=u.id AND status='approuve' AND start_date <= now() AND end_date >= now()) AS "onLeave"
 FROM users u LEFT JOIN hr_records h ON h.user_id=u.id WHERE u.role IN ('employee','admin','super_admin') ORDER BY u.name,u.id`);
 return rows.rows as unknown as {id:number;name:string;email:string;phone:string|null;status:string;poste:string|null;contractType:string|null;dateEmbauche:string|null;profile:{service?:string;adresse?:string;statut?:string;diplome?:string;competences?:string[]}|null;performance:number|null;onLeave:boolean}[];
}
async function requireStaff(tx: Pick<typeof db,'execute'>,id:number,actorRole?:string) {
 const r=await tx.execute(sql`SELECT role FROM users WHERE id=${id} FOR UPDATE`);const role=r.rows[0]?.role;
 if(!['employee','admin','super_admin'].includes(String(role)))throw new TRPCError({code:'NOT_FOUND',message:'Employé introuvable.'});
 if(actorRole && actorRole!=='super_admin' && role!=='employee')throw new TRPCError({code:'FORBIDDEN',message:'Seul le PDG peut modifier un compte de direction.'});
}
export async function saveStaffProfile(actor:{uid:number;role:string},input:z.infer<typeof staffProfileInput>) {
 return db.transaction(async tx=>{
 await requireStaff(tx,input.id,actor.role);
 const [current]=await tx.select().from(hrRecords).where(eq(hrRecords.userId,input.id));
 await tx.update(users).set({name:input.nom,email:input.email.toLowerCase(),phone:input.tel||null}).where(eq(users.id,input.id));
 const profile={...current?.profile,service:input.service,adresse:input.adresse,statut:input.statut};
 await tx.insert(hrRecords).values({userId:input.id,poste:input.poste,profile,contractType:"autre"}).onConflictDoUpdate({target:hrRecords.userId,set:{poste:input.poste,profile,updatedAt:new Date()}});
 await tx.insert(auditLogs).values({actorId:actor.uid,action:'hr.profile.update',entityType:'user',entityId:input.id,metadata:{fields:['name','email','phone','poste','service','adresse','statut']}});
 return {ok:true};
 });
}
export async function staffPlanning(userId:number) {
 await requireStaff(db,userId);
 return db.select().from(hrWeeklyTasks).where(eq(hrWeeklyTasks.userId,userId));
}
export async function addStaffTask(actor:{uid:number;role:string},input:z.infer<typeof staffTaskInput>) {
 return db.transaction(async tx=>{
 await requireStaff(tx,input.userId,actor.role);
 const [same]=await tx.select().from(hrWeeklyTasks).where(eq(hrWeeklyTasks.requestId,input.requestId));
 if(same){if(same.userId!==input.userId||same.day!==input.day||same.title!==input.title||same.startMinute!==input.startMinute||same.endMinute!==input.endMinute)throw new TRPCError({code:'CONFLICT',message:'Identifiant de demande déjà utilisé.'});return same;}
 const overlap=await tx.execute(sql`SELECT id FROM hr_weekly_tasks WHERE user_id=${input.userId} AND day=${input.day} AND cancelled=false AND start_minute<${input.endMinute} AND end_minute>${input.startMinute} LIMIT 1`);
 if(overlap.rows.length)throw new TRPCError({code:'CONFLICT',message:'Ce créneau chevauche une mission existante.'});
 const [task]=await tx.insert(hrWeeklyTasks).values({...input,createdBy:actor.uid}).returning();
 await tx.insert(auditLogs).values({actorId:actor.uid,action:'hr.planning.add',entityType:'hr_weekly_task',entityId:task.id,metadata:{userId:input.userId}});return task;
 });
}
export async function cancelStaffTask(actor:{uid:number;role:string},id:number) {
 return db.transaction(async tx=>{
 const [task]=await tx.select().from(hrWeeklyTasks).where(eq(hrWeeklyTasks.id,id));
 if(!task)throw new TRPCError({code:'NOT_FOUND',message:'Mission introuvable.'});await requireStaff(tx,task.userId,actor.role);
 const changed=await tx.execute(sql`UPDATE hr_weekly_tasks SET cancelled=true WHERE id=${id} AND cancelled=false RETURNING id`);
 if(changed.rows.length)await tx.insert(auditLogs).values({actorId:actor.uid,action:'hr.planning.cancel',entityType:'hr_weekly_task',entityId:id,metadata:{userId:task.userId}});
 return {ok:true};
 });
}
