import { useRef, useState } from "react";
import { trpc } from "../../../lib/trpc";

/** Espace privé : résultat réel, historique individuel et téléchargement explicite. */
export function ProductionMedia({operation}:{operation:'image'|'voix'}) {
  const [texte,setTexte]=useState('');
  const [droits,setDroits]=useState(false);
  const [selection,setSelection]=useState<string|null>(null);
  const [erreur,setErreur]=useState('');
  const demande=useRef<{texte:string;id:string}|null>(null);
  const image=operation==='image';
  const liste=trpc.intelligences.mediaListe.useQuery(undefined,{refetchInterval:5000});
  const fichier=trpc.intelligences.mediaLire.useQuery({id:selection??''},{enabled:!!selection,refetchInterval:q=>q.state.data?.statut==='PROCESSING'?5000:false});
  const production=trpc.intelligences.mediaProduire.useMutation({
    onSuccess(r){setSelection(r.id);void liste.refetch();void fichier.refetch();if(r.statut==='FAILED')demande.current=null;},
    onError(){setErreur('La réponse du service est indisponible. Votre texte est conservé. Réessayez : une demande déjà reçue ne sera pas facturée une seconde fois par cette interface.');},
  });
  function produire(){
    if(!droits||!texte.trim()||production.isPending)return;
    setErreur('');
    if(demande.current?.texte!==texte)demande.current={texte,id:crypto.randomUUID()};
    production.mutate({operation,requestId:demande.current!.id,texte,droitsConfirmes:true});
  }
  const media=fichier.data;
  const src=media?.statut==='READY'&&media.donnees&&(media.mime==='image/png'||media.mime==='audio/mpeg')?`data:${media.mime};base64,${media.donnees}`:null;
  return <section className="mx-auto max-w-4xl space-y-5 p-4">
    <h1 className="text-2xl font-semibold">{image?'Images':'Voix'}</h1>
    <p>{image?'Créer une illustration IA privée, puis la télécharger pour la contrôler.':'Transformer un texte en fichier audio avec une voix de synthèse IA.'}</p>
    <p className="text-sm text-gray-500">Aucune publication automatique. Utilisez seulement du contenu public dont vous possédez les droits. Ne saisissez aucun secret ni document personnel.</p>
    {!image&&<p className="rounded border p-3 text-sm">La synthèse vocale ci-dessous produit un fichier audio. La conversation vocale continue et la transcription restent à raccorder.</p>}
    <label className="block font-medium" htmlFor="media-texte">{image?'Décrire le visuel souhaité':'Texte à lire'}</label>
    <textarea id="media-texte" className="min-h-36 w-full rounded border bg-transparent p-3" maxLength={4000} value={texte} onChange={e=>setTexte(e.target.value)} disabled={production.isPending}/>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={droits} onChange={e=>setDroits(e.target.checked)}/>Je confirme mes droits sur ce contenu public et son envoi au service IA.</label>
    <button type="button" className="rounded bg-amber-600 px-5 py-3 text-white disabled:opacity-50" disabled={!droits||texte.trim().length<2||production.isPending} onClick={produire}>{production.isPending?'Production en cours…':image?'Générer le visuel':'Générer la voix'}</button>
    <button type="button" className="ml-3 rounded border px-4 py-3" disabled={production.isPending} onClick={()=>{demande.current=null;setSelection(null);setErreur('');}}>Nouvelle production</button>
    <p className="text-xs text-gray-500">20 productions maximum par 24 heures. Une génération peut prendre quelques minutes. Les essais peuvent être facturés par le fournisseur IA.</p>
    {erreur&&<p role="alert">{erreur}</p>}
    {liste.isError&&<p role="alert">Historique temporairement indisponible.</p>}
    {fichier.isError&&<p role="alert">Impossible de charger cette production.</p>}
    {media?.statut==='PROCESSING'&&<p role="status">Production en cours. Son résultat apparaîtra ici.</p>}
    {media?.statut==='FAILED'&&<p role="alert">{media.motif}</p>}
    {src&&<div className="space-y-3 rounded border p-3">
      <p className="font-medium">{media?.mime==='image/png'?'Illustration générée par IA — ne constitue pas une preuve de test produit.':'Voix générée par IA.'}</p>
      {media?.mime==='image/png'?<img src={src} alt="Illustration générée par IA" className="max-h-96 max-w-full object-contain"/>:<audio src={src} controls className="max-w-full"/>}
      <a href={src} download={`mkapms-ia-${selection}.${media?.mime==='image/png'?'png':'mp3'}`} className="inline-block rounded border px-4 py-2">Télécharger</a>
    </div>}
    <h2 className="text-lg font-semibold">Mes productions</h2>
    <ul className="space-y-2">{liste.data?.filter(r=>r.operation===operation).map(r=><li key={r.id} className="rounded border p-3">
      <button type="button" className="w-full break-words text-left" onClick={()=>{setSelection(r.id);setTexte(r.texte);demande.current=r.statut==='FAILED'?null:{texte:r.texte,id:r.id};}}>
        <span className="block">{r.texte.slice(0,160)}</span><span className="text-xs text-gray-500">{r.statut==='READY'?'Prêt':r.statut==='FAILED'?'Échec':'En cours'}</span>
      </button>
    </li>)}</ul>
  </section>;
}
