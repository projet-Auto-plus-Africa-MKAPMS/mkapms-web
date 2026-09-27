import { useEffect, useRef, useState } from 'react';
import { trpc } from '../../../lib/trpc';

type AudioInput={format:'mp3'|'wav'|'webm'|'mp4';base64:string};
export function TranscriptionAudio(){
 const [audio,setAudio]=useState<AudioInput|null>(null),[nom,setNom]=useState(''),[droits,setDroits]=useState(false);
 const [erreur,setErreur]=useState(''),[selection,setSelection]=useState<string|null>(null),[recording,setRecording]=useState(false),[starting,setStarting]=useState(false);
 const request=useRef<string|null>(null),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),alive=useRef(true);
 const liste=trpc.intelligences.mediaListe.useQuery(undefined,{refetchInterval:5000});
 const result=trpc.intelligences.mediaLire.useQuery({id:selection??''},{enabled:!!selection,refetchInterval:q=>q.state.data?.statut==='PROCESSING'?5000:false});
 const mutation=trpc.intelligences.mediaProduire.useMutation({onSuccess(r){setSelection(r.id);void liste.refetch();if(r.statut==='FAILED')request.current=null;},onError(){setErreur('Transcription indisponible. Le fichier est conservé dans cette page ; vous pouvez réessayer.');}});
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(timer.current)clearTimeout(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());};},[]);
 async function charger(blob:Blob,name:string,format:AudioInput['format']){
  if(blob.size<16||blob.size>8*1024*1024){setErreur('Choisissez un enregistrement de moins de 8 Mo.');return;}
  const encoded=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(blob);});
  if(!alive.current)return;setAudio({format,base64:encoded});setNom(name);setSelection(null);setErreur('');request.current=null;
 }
 async function fichier(file:File|undefined){
  if(!file)return;const ext=file.name.split('.').pop()?.toLowerCase();const format=ext==='m4a'?'mp4':ext;
  if(!['mp3','wav','webm','mp4'].includes(format||'')){setErreur('Formats acceptés : MP3, WAV, WebM, M4A ou MP4 audio.');return;}
  try{await charger(file,file.name,format as AudioInput['format']);}catch{setErreur('Impossible de lire ce fichier.');}
 }
 function arreter(){if(timer.current)clearTimeout(timer.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());setRecording(false);}
 async function enregistrer(){
  setErreur('');if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setErreur('Microphone indisponible dans ce navigateur. Ajoutez un fichier audio.');return;}
  setStarting(true);
  try{
   const type=['audio/webm;codecs=opus','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));if(!type)throw Error('format');
   const s=await navigator.mediaDevices.getUserMedia({audio:true});if(!alive.current){s.getTracks().forEach(t=>t.stop());return;}
   stream.current=s;const r=new MediaRecorder(s,{mimeType:type});recorder.current=r;const parts:Blob[]=[];let size=0;
   r.ondataavailable=e=>{size+=e.data.size;parts.push(e.data);if(size>8*1024*1024)arreter();};
   r.onstop=()=>{s.getTracks().forEach(t=>t.stop());if(!alive.current)return;setRecording(false);void charger(new Blob(parts,{type}), 'Enregistrement microphone',type.includes('webm')?'webm':'mp4').catch(()=>setErreur('Enregistrement illisible.'));};
   r.onerror=()=>{arreter();setErreur('Enregistrement interrompu.');};r.start(1000);setRecording(true);timer.current=setTimeout(arreter,60000);
  }catch{setErreur('Microphone non accessible. Autorisez-le dans le navigateur ou ajoutez un fichier.');}finally{if(alive.current)setStarting(false);}
 }
 let transcription='';try{if(result.data?.mime==='text/plain'&&result.data.donnees)transcription=new TextDecoder().decode(Uint8Array.from(atob(result.data.donnees),c=>c.charCodeAt(0)));}catch{/* malformed stored result is not rendered */}
 return <section className="mx-auto max-w-4xl space-y-4 border-t p-4">
  <h2 className="text-xl font-semibold">Transcrire un enregistrement</h2>
  <p>Ajoutez un fichier ou enregistrez jusqu’à une minute. Écoutez-le, puis lancez la transcription. Aucun envoi pendant l’enregistrement.</p>
  <p className="text-sm text-gray-500">Uniquement du contenu public autorisé, sans secret ni donnée personnelle. Le texte reste privé, sans ajout à la mémoire IA. Le fichier audio n’est pas conservé sur notre serveur.</p>
  <input aria-label="Fichier audio à transcrire" type="file" accept=".mp3,.wav,.webm,.m4a,.mp4" disabled={starting||recording||mutation.isPending} onChange={e=>void fichier(e.target.files?.[0])}/>
  <button type="button" className="rounded border p-3" disabled={mutation.isPending||starting} onClick={()=>recording?arreter():void enregistrer()}>{recording?'Arrêter le microphone':'Enregistrer au microphone'}</button>
  {recording&&<p role="status">Microphone actif — arrêt automatique après une minute.</p>}
  {audio&&<div><p>{nom}</p><audio controls src={`data:${{mp3:'audio/mpeg',wav:'audio/wav',webm:'audio/webm',mp4:'audio/mp4'}[audio.format]};base64,${audio.base64}`}/></div>}
  <label className="flex gap-2"><input type="checkbox" checked={droits} onChange={e=>setDroits(e.target.checked)}/>Je confirme les droits et l’envoi de cet enregistrement au service IA.</label>
  <button type="button" className="rounded bg-amber-600 p-3 text-white disabled:opacity-50" disabled={!audio||!droits||starting||recording||mutation.isPending} onClick={()=>{if(!audio)return;request.current??=crypto.randomUUID();setErreur('');mutation.mutate({requestId:request.current,operation:'transcription',texte:'Transcription audio',audio,droitsConfirmes:true});}}>{mutation.isPending?'Transcription en cours…':'Transcrire'}</button>
  <p className="text-xs">Quota partagé avec les images et voix : 20 productions par 24 heures. Relisez le texte avant de l’utiliser.</p>
  {erreur&&<p role="alert">{erreur}</p>}{result.data?.statut==='FAILED'&&<p role="alert">{result.data.motif}</p>}
  {result.isError&&<p role="alert">Résultat temporairement indisponible.</p>}
  {transcription&&<div className="space-y-3"><textarea aria-label="Transcription obtenue" readOnly value={transcription} className="min-h-48 w-full rounded border bg-transparent p-3"/><a className="underline" download="transcription.txt" href={`data:text/plain;base64,${result.data?.donnees}`}>Télécharger le texte</a></div>}
  <h3 className="font-semibold">Mes transcriptions</h3>
  {liste.isError&&<p role="alert">Historique indisponible.</p>}
  <ul>{liste.data?.filter(r=>r.operation==='transcription').map(r=><li key={r.id}><button className="rounded border p-2" type="button" onClick={()=>setSelection(r.id)}>{new Date(r.created_at).toLocaleString()} — {r.statut==='READY'?'Prête':r.statut==='FAILED'?'Échec':'En cours'}</button></li>)}</ul>
 </section>;
}
