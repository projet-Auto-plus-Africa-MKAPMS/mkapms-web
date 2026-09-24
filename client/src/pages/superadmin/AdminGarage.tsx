import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../../lib/trpc';
import { BoutonMoteur } from '../../lib/boutonMoteur';

type Action = 'terminer' | 'annuler' | 'archive' | 'restore';
const labels: Record<Action,string> = {terminer:'Terminer',annuler:'Annuler',archive:'Archiver',restore:'Restaurer'};
export default function AdminGarage() {
 const [search,setSearch]=useState(''); const [offset,setOffset]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);
 const [action,setAction]=useState<Action|null>(null); const [reason,setReason]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 const list=trpc.garages.adminInterventions.useQuery({search,offset});
 const detail=trpc.garages.adminIntervention.useQuery({id:selected??0},{enabled:selected!==null});
 const utils=trpc.useUtils();
 const mutation=trpc.garages.adminAction.useMutation({onSuccess:async()=>{
  setAction(null);setReason('');
  await Promise.all([utils.garages.adminInterventions.invalidate(),utils.garages.adminIntervention.invalidate()]);
 }});
 useEffect(()=>{if(selected!==null && dialog.current && !dialog.current.open)dialog.current.showModal();},[selected]);
 const item=detail.data?.item;
 const terminal=item && ['termine','honore','annulee','annule_client','annule_garage','no_show'].includes(item.status);
 const button='rounded-lg border px-3 py-2 text-sm disabled:opacity-50';
 function close(){if(mutation.isPending)return;setSelected(null);setAction(null);setReason('');mutation.reset();}
 return <main className="min-h-screen bg-[#F5F3EF] pb-24">
  <header className="bg-[#111] p-5 text-white"><Link to="/superadmin">← Super Admin</Link><h1 className="mt-3 text-xl font-bold">Gestion Garage</h1></header>
  <div className="space-y-3 p-4">
   <label className="block">Rechercher un véhicule, client ou garage<input className="mt-1 w-full rounded-lg border p-3" value={search} onChange={e=>{setSearch(e.target.value);setOffset(0);}} /></label>
   {list.isLoading && <p role="status">Chargement des interventions…</p>}
   {list.error && <p role="alert">{list.error.message}</p>}
   {list.data?.items.length===0 && <p>Aucune intervention trouvée.</p>}
   <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[
    ['Affichées',list.data?.items.length??0],['En cours',list.data?.items.filter(i=>['accueil','diagnostic','devis_envoye','en_reparation','controle_qualite','pret'].includes(i.status)).length??0],
    ['En attente',list.data?.items.filter(i=>['en_attente','confirme','planifiee'].includes(i.status)).length??0],['Terminées',list.data?.items.filter(i=>['termine','honore'].includes(i.status)).length??0]
   ].map(([label,value])=><div key={label} className="rounded-lg border bg-white p-3"><strong>{value}</strong><p>{label}</p></div>)}</div>
   <p className="text-xs text-slate-600">Compteurs de la page affichée. Les dossiers archivés restent consultables. Les montants facturés et affectations de mécaniciens ne sont pas renseignés dans ces rendez-vous.</p>
   {list.data?.items.map(i=><article key={i.id} className="space-y-2 rounded-xl border bg-white p-4">
    <h2 className="font-bold">{i.vehicule??`Véhicule non renseigné — dossier #${i.id}`}</h2>
    <p>{i.client??`Client #${i.clientId}`} · {i.garage??`Garage #${i.garageId}`}</p>
    <p>{i.motif??'Motif non renseigné'} · {i.status} {i.archived && '· Archivé'}</p>
    <p>Rendez-vous : {new Date(i.dateHeure).toLocaleString()}</p>
    <BoutonMoteur code="admin_garage_details" className={button} onExecuter={()=>setSelected(i.id)}>Détails</BoutonMoteur>
   </article>)}
   <div className="flex gap-2"><button className={button} disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-50))}>Précédent</button><button className={button} disabled={!list.data?.hasMore} onClick={()=>setOffset(offset+50)}>Suivant</button></div>
  </div>
  {selected!==null && <dialog ref={dialog} onCancel={e=>{e.preventDefault();close();}} className="max-h-[85vh] w-[min(95vw,48rem)] space-y-3 overflow-y-auto rounded-xl p-5 backdrop:bg-black/50">
   <div className="flex justify-between"><h2 className="font-bold">Dossier #{selected}</h2><button className={button} disabled={mutation.isPending} onClick={close}>Fermer</button></div>
   {detail.isFetching && <p role="status">Chargement…</p>}{detail.error && <p role="alert">{detail.error.message}</p>}
   {item && <><p>{item.vehicule??'Véhicule non renseigné'} · {item.garage??`Garage #${item.garageId}`}</p><p>Client : {item.client??`#${item.clientId}`}</p><p>État : {item.status}{item.archived?' · Archivé':''}</p><p>Motif : {item.motif??'Non renseigné'}</p><p>Notes : {item.notes??'Aucune note'}</p>
    <h3 className="font-bold">Suivi client</h3>{detail.data?.history.length===0 && <p>Aucun événement de suivi enregistré.</p>}
    {detail.data?.history.map(h=><p key={h.id}>{new Date(h.createdAt).toLocaleString()} — {h.statusLabel} : {h.detail}</p>)}
    <h3 className="font-bold">Historique des actions de direction</h3>{detail.data?.audit.length===0 && <p>Aucune action de direction enregistrée.</p>}
    {detail.data?.audit.map(h=><p key={h.id}>{new Date(h.createdAt).toLocaleString()} — {h.action} · compte #{h.actorId} : {h.metadata?.reason}</p>)}
    <div className="flex flex-wrap gap-2">
{!terminal&&!item.archived && <BoutonMoteur code="admin_garage_terminer" className={button} desactive={mutation.isPending?'Enregistrement en cours':!['controle_qualite','pret'].includes(item.status)?'Enregistrer le contrôle qualité ou la mise à disposition avant de terminer':undefined} onExecuter={()=>{mutation.reset();setAction("terminer");setReason('');}}>{labels.terminer}</BoutonMoteur>}
{!terminal&&!item.archived && <BoutonMoteur code="admin_garage_annuler" className={button} desactive={mutation.isPending?'Enregistrement en cours':undefined} onExecuter={()=>{mutation.reset();setAction("annuler");setReason('');}}>{labels.annuler}</BoutonMoteur>}
{terminal&&!item.archived && <BoutonMoteur code="admin_garage_archive" className={button} desactive={mutation.isPending?'Enregistrement en cours':undefined} onExecuter={()=>{mutation.reset();setAction("archive");setReason('');}}>{labels.archive}</BoutonMoteur>}
{item.archived && <BoutonMoteur code="admin_garage_restore" className={button} desactive={mutation.isPending?'Enregistrement en cours':undefined} onExecuter={()=>{mutation.reset();setAction("restore");setReason('');}}>{labels.restore}</BoutonMoteur>}
</div>
    {!terminal&&!item.archived&&<p className="text-xs">Terminer devient disponible après contrôle qualité ou mise à disposition. L’archivage devient disponible une fois le dossier clôturé et conserve son historique.</p>}
    {action && <form className="space-y-2 border-t pt-3" onSubmit={e=>{e.preventDefault();if(!mutation.isPending)mutation.mutate({id:item.id,action,expectedStatus:item.status,reason});}}>
     <h3 className="font-bold">Confirmer : {labels[action]}</h3><label className="block">Motif<textarea required minLength={3} maxLength={500} className="block w-full rounded-lg border p-2" value={reason} onChange={e=>setReason(e.target.value)} /></label>
     <p className="text-xs">La clôture ou l’annulation met à jour le suivi client. L’archivage conserve le dossier et permet sa restauration.</p>
     <button type="submit" className={button} disabled={mutation.isPending}>{mutation.isPending?'Enregistrement…':'Confirmer'}</button><button type="button" className={button} disabled={mutation.isPending} onClick={()=>setAction(null)}>Revenir</button>
    </form>}
   </>}{mutation.error && <p role="alert">{mutation.error.message}</p>}{mutation.data?.warnings.map(w=><p role="alert" key={w}>{w}</p>)}
  </dialog>}
 </main>;
}
