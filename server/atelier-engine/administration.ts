/** Direction garage: real appointments and reversible, audited actions. */
import { sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { db } from '../db.js';
import { auditLogs, serviceTracking } from '../schema.js';

export interface InterventionDirection {
  id: number; garageId: number; clientId: number; annonceId: number | null;
  status: string; dateHeure: string; motif: string | null; notes: string | null;
  garage: string | null; client: string | null; vehicule: string | null;
  archived: boolean;
}
const projection = sql`r.id, r.garage_id AS "garageId", r.client_id AS "clientId", r.annonce_id AS "annonceId",
 r.status, r.date_heure AS "dateHeure", r.motif, r.notes,
 g.name AS garage, u.name AS client, a.titre AS vehicule,
 COALESCE((SELECT action = 'garage.admin.archive' FROM audit_logs
   WHERE entity_type = 'rdv_garage' AND entity_id = r.id
     AND action IN ('garage.admin.archive','garage.admin.restore') ORDER BY id DESC LIMIT 1), false) AS archived`;
export async function listInterventionsDirection(input: { search: string; offset: number }) {
 const q = `%${input.search.replace(/[\\%_]/g, '\\$&')}%`;
 const result = await db.execute(sql`SELECT ${projection} FROM rdv_garage r
 LEFT JOIN garages_publics g ON g.id = r.garage_id LEFT JOIN users u ON u.id = r.client_id
 LEFT JOIN annonces a ON a.id = r.annonce_id
 WHERE (COALESCE(a.titre,'') ILIKE ${q} OR COALESCE(u.name,'') ILIKE ${q}
 OR COALESCE(g.name,'') ILIKE ${q} OR COALESCE(r.motif,'') ILIKE ${q})
 ORDER BY r.date_heure DESC, r.id DESC LIMIT 51 OFFSET ${input.offset}`);
 const rows = result.rows as unknown as InterventionDirection[];
 return { items: rows.slice(0,50), hasMore: rows.length > 50 };
}
export async function detailInterventionDirection(id: number) {
 const result = await db.execute(sql`SELECT ${projection} FROM rdv_garage r
 LEFT JOIN garages_publics g ON g.id=r.garage_id LEFT JOIN users u ON u.id=r.client_id
 LEFT JOIN annonces a ON a.id=r.annonce_id WHERE r.id=${id}`);
 const item = result.rows[0] as unknown as InterventionDirection | undefined;
 if (!item) throw new TRPCError({code:'NOT_FOUND',message:'Intervention introuvable.'});
 const history = await db.execute(sql`SELECT id, status, status_label AS "statusLabel", detail, created_at AS "createdAt"
 FROM service_tracking WHERE service_type='garage' AND service_id=${id} ORDER BY created_at DESC, id DESC`);
 const audit = await db.execute(sql`SELECT id, action, actor_id AS "actorId", metadata, created_at AS "createdAt"
 FROM audit_logs WHERE entity_type='rdv_garage' AND entity_id=${id} AND action LIKE 'garage.admin.%' ORDER BY id DESC`);
 return { item, history: history.rows as {id:number;status:string;statusLabel:string;detail:string|null;createdAt:string}[],
 audit: audit.rows as {id:number;action:string;actorId:number;metadata:{reason?:string};createdAt:string}[] };
}
export type DirectionAction = 'terminer' | 'annuler' | 'archive' | 'restore';
export async function actionInterventionDirection(actorId: number, input: { id: number; action: DirectionAction; expectedStatus: string; reason: string }) {
 return db.transaction(async tx => {
  const result = await tx.execute(sql`SELECT id, client_id AS "clientId", garage_id AS "garageId", status FROM rdv_garage WHERE id=${input.id} FOR UPDATE`);
  const row = result.rows[0] as {id:number;clientId:number;garageId:number;status:string}|undefined;
  if (!row) throw new TRPCError({code:'NOT_FOUND',message:'Intervention introuvable.'});
  const last = await tx.execute(sql`SELECT action FROM audit_logs WHERE entity_type='rdv_garage' AND entity_id=${input.id}
   AND action IN ('garage.admin.archive','garage.admin.restore') ORDER BY id DESC LIMIT 1`);
  const archived = last.rows[0]?.action === 'garage.admin.archive';
  const target = input.action === 'terminer' ? 'termine' : input.action === 'annuler' ? 'annulee' : row.status;
  if ((input.action === 'archive' && archived) || (input.action === 'restore' && !archived)
   || (['terminer','annuler'].includes(input.action) && row.status === target)) return {...row, changed:false};
  if (row.status !== input.expectedStatus) throw new TRPCError({code:'CONFLICT',message:'Le dossier a changé. Actualisez avant de confirmer.'});
  const terminal = ['termine','honore','annulee','annule_client','annule_garage','no_show'].includes(row.status);
  if (input.action === 'terminer' && !['controle_qualite','pret'].includes(row.status)) throw new TRPCError({code:'BAD_REQUEST',message:'Le contrôle qualité ou la mise à disposition doit être enregistré avant de terminer.'});
  if (input.action === 'annuler' && terminal) throw new TRPCError({code:'BAD_REQUEST',message:'Une intervention clôturée ne peut pas être annulée ici.'});
  if (input.action === 'archive' && !terminal) throw new TRPCError({code:'BAD_REQUEST',message:'Clôturez ou annulez l’intervention avant de l’archiver.'});
  if (archived && input.action !== 'restore') throw new TRPCError({code:'BAD_REQUEST',message:'Restaurez d’abord le dossier archivé.'});
  if (target !== row.status) {
   await tx.execute(sql`UPDATE rdv_garage SET status=${target}, updated_at=now() WHERE id=${row.id}`);
   await tx.insert(serviceTracking).values({userId:row.clientId,serviceType:'garage',serviceId:row.id,reference:`RDV-${row.id}`,
    titre:'Intervention garage',status:target,statusLabel:target==='termine'?'Intervention terminée':'Intervention annulée',detail:input.reason});
  }
  await tx.insert(auditLogs).values({actorId,action:`garage.admin.${input.action}`,entityType:'rdv_garage',entityId:row.id,
   metadata:{reason:input.reason,previousStatus:row.status,status:target}});
  return {...row,status:target,changed:true};
 });
}
