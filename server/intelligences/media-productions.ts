/** Productions privées MAIN. Aucun accès SHOP, aucune publication automatique. */
import { createHash } from "node:crypto";
import { z } from "zod";
import { pool } from "../db.js";
import { router as routerCapacite } from "./routeur.js";

import { fichierAudio, lireAudio } from "./audio-input.js";

export const demandeMedia = z.object({
  requestId: z.string().uuid(), operation: z.enum(["image", "voix", "transcription"]),
  texte: z.string().trim().min(2).max(4000), droitsConfirmes: z.literal(true),
  audio: fichierAudio.optional(),
  references: z.array(z.string().max(8_500_000).refine((v) => /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(v), "Référence image invalide.")).max(4).optional(),
}).strict().superRefine((v,ctx)=>{
  if((v.operation==='transcription')!==!!v.audio)ctx.addIssue({code:"custom",message:"Un fichier audio est requis uniquement pour une transcription."});
  if(v.operation!=='image'&&v.references?.length)ctx.addIssue({code:"custom",message:"Les références sont réservées à la création d'image."});
});
export function texteMediaAutorise(texte: string): boolean {
  return !/(?:\b(?:sk-|ck_|cs_)[A-Za-z0-9_-]{16,}|-----BEGIN .*PRIVATE KEY|\bBearer\s+\S+|(?:password|mot de passe|secret|api[_ -]?key)\s*[:=]\s*\S+)/i.test(texte);
}
export type DemandeMedia = z.infer<typeof demandeMedia>;
type Base = Pick<typeof pool, "query" | "connect">;
export async function produire(ownerId: number, role: string, brut: DemandeMedia, base: Base = pool, executer = routerCapacite) {
  const input = demandeMedia.parse(brut);
  if (!texteMediaAutorise(input.texte)) throw new Error("Utilisez le Coffre secret d'AL-HUDHUD·M pour les secrets : ils ne se collent jamais dans un texte.");
  if(input.audio) lireAudio(input.audio);
  const hash = createHash("sha256").update(JSON.stringify({operation: input.operation, texte: input.texte, audio:input.audio,references:input.references})).digest("hex");
  const c = await base.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(27709,$1)", [ownerId]);
    const old = (await c.query("SELECT id,input_hash,statut FROM in_media_productions WHERE id=$1 AND owner_id=$2", [input.requestId,ownerId])).rows[0];
    if (old) {
      if (old.input_hash !== hash) throw new Error("Cette demande a déjà un autre contenu.");
      await c.query("COMMIT");
      return {id: old.id as string, statut: old.statut as string};
    }
    const count = (await c.query("SELECT count(*)::int n FROM in_media_productions WHERE owner_id=$1 AND created_at>now()-interval '24 hours'", [ownerId])).rows[0].n;
    if (count >= 20) throw new Error("Limite de 20 productions par 24 heures atteinte.");
    const busy = (await c.query("SELECT 1 FROM in_media_productions WHERE owner_id=$1 AND statut='PROCESSING' AND created_at>now()-interval '4 minutes' LIMIT 1",[ownerId])).rowCount;
    if (busy) throw new Error("Une production est déjà en cours. Attendez sa fin.");
    await c.query("UPDATE in_media_productions SET statut='FAILED',motif='Traitement interrompu. Créez une nouvelle demande.' WHERE owner_id=$1 AND statut='PROCESSING' AND created_at<=now()-interval '4 minutes'",[ownerId]);
    await c.query("INSERT INTO in_media_productions(id,owner_id,operation,input_hash,texte,statut) VALUES($1,$2,$3,$4,$5,'PROCESSING')",[input.requestId,ownerId,input.operation,hash,input.texte]);
    await c.query("COMMIT");
  } catch(e) { await c.query("ROLLBACK"); throw e; } finally { c.release(); }
  try {
    const r = await executer({productionMedia:true,capacite:input.operation,moteur:input.operation==='image'?'media_os':input.operation==='transcription'?'command_center':'intelligences',role,
      audio:input.audio,images:input.references,confidentialite:'publique',message:input.texte,systeme:'Produire un brouillon média. Aucune publication.'});
    if (!r.ok || !r.media) {
      await base.query("UPDATE in_media_productions SET statut='FAILED',motif=$2 WHERE id=$1",[input.requestId,r.motifPublic || 'Le service média est indisponible.']);
      return {id:input.requestId,statut:'FAILED'};
    }
    await base.query("UPDATE in_media_productions SET statut='READY',mime=$2,donnees=$3,motif='' WHERE id=$1",[input.requestId,r.media.mime,r.media.base64]);
    return {id:input.requestId,statut:'READY'};
  } catch {
    await base.query("UPDATE in_media_productions SET statut='FAILED',motif='La production a échoué. Votre demande reste disponible.' WHERE id=$1",[input.requestId]);
    return {id:input.requestId,statut:'FAILED'};
  }
}
export async function lister(ownerId:number, base:Base=pool) {
  await base.query("UPDATE in_media_productions SET statut='FAILED',motif='Traitement interrompu. Créez une nouvelle demande.' WHERE owner_id=$1 AND statut='PROCESSING' AND created_at<=now()-interval '4 minutes'",[ownerId]);
  return (await base.query("SELECT id,operation,texte,statut,mime,motif,created_at FROM in_media_productions WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 100",[ownerId])).rows as {id:string;operation:'image'|'voix'|'transcription';texte:string;statut:string;mime:string|null;motif:string;created_at:Date}[];
}
export async function lire(id:string,ownerId:number,base:Base=pool) {
  const r=(await base.query("SELECT id,statut,mime,donnees,motif FROM in_media_productions WHERE id=$1 AND owner_id=$2",[id,ownerId])).rows[0];
  if(!r) throw new Error('Production introuvable.');
  return r as {id:string;statut:string;mime:string|null;donnees:string|null;motif:string};
}
