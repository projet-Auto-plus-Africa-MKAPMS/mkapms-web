import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VOIX_TEMPS_REEL,creerApercuVoix,normaliserSdp,creerAppelVocalTempsReel,produireMediaNatif,transcrireAudioNatif} from '../provider.js';
import {texteMediaAutorise,demandeMedia} from '../media-productions.js';
const config={cle:'unit-test-only',modele:'configured-model'};
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
test('image native uses completed image output, never text as a rendered file',async()=>{
 let calls=0;
 const result=await produireMediaNatif(config,'image','Une illustration',async(_url,init)=>{
  calls++;const body=JSON.parse(String(init?.body));assert.equal(body.store,false);assert.equal(body.model,config.modele);assert.equal(body.tool_choice.type,'image_generation');assert.equal(init?.redirect,'error');
  return Response.json({status:'completed',output:[{type:'image_generation_call',status:'completed',result:png}]});
 });
 assert.equal(calls,1);assert.equal(result.mime,'image/png');assert.equal(result.base64,png);
 await assert.rejects(produireMediaNatif(config,'image','Une illustration',async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'image done'}]}]})));
 await assert.rejects(produireMediaNatif(config,'image','Une illustration',async()=>Response.json({status:'incomplete',output:[{type:'image_generation_call',status:'completed',result:png}]})));
});
test('image native sends up to four private references to the image tool',async()=>{
 const reference='data:image/png;base64,'+png;
 await produireMediaNatif(config,'image','Rendu premium',async(_url,init)=>{
  const body=JSON.parse(String(init?.body));
  assert.equal(body.tools[0].quality,'high');
  assert.equal(body.input[0].content[0].type,'input_text');
  assert.equal(body.input[0].content[1].type,'input_image');
  assert.equal(body.input[0].content[1].image_url,reference);
  return Response.json({status:'completed',output:[{type:'image_generation_call',status:'completed',result:png}]});
 },[reference]);
});
test('speech creates audio and refuses HTML, failed requests and oversized streams',async()=>{
 const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(32)]);
 const r=await produireMediaNatif(config,'voix','Bonjour',async(_url,init)=>{
  const b=JSON.parse(String(init?.body));assert.equal(b.model,'tts-1');assert.equal(b.response_format,'mp3');return new Response(audio);
 });assert.equal(r.mime,'audio/mpeg');assert.equal(r.base64,audio.toString('base64'));
 for(const response of [new Response('<html>not audio</html>'),new Response('provider secret detail',{status:403}),new Response(Buffer.alloc(13*1024*1024))]){
  await assert.rejects(produireMediaNatif(config,'voix','Bonjour',async()=>response));
 }
});
test('rights, limits and recognizable credentials checked before inference',()=>{
 assert.equal(texteMediaAutorise('Description publique'),true);
 assert.equal(texteMediaAutorise('api_key=confidentiel'),false);
 assert.equal(texteMediaAutorise('ck_'+'a'.repeat(30)),false);
 assert.equal(demandeMedia.safeParse({requestId:'31c67eaa-5372-4e8e-b8d4-f6cb61bbd79f',operation:'image',texte:'Test',droitsConfirmes:false}).success,false);
 const common={requestId:'31c67eaa-5372-4e8e-b8d4-f6cb61bbd79f',texte:'Test premium',droitsConfirmes:true};
 const reference='data:image/png;base64,'+png;
 assert.equal(demandeMedia.safeParse({...common,operation:'image',references:[reference]}).success,true);
 assert.equal(demandeMedia.safeParse({...common,operation:'voix',references:[reference]}).success,false);
 assert.equal(demandeMedia.safeParse({...common,operation:'image',references:Array(5).fill(reference)}).success,false);
});

test('transcription validates binary format, bounds result, uses multipart and never trusts filenames',async()=>{
 const audio={format:'wav' as const,base64:Buffer.concat([Buffer.from('RIFF0000WAVE'),Buffer.alloc(32)]).toString('base64')};
 const r=await transcrireAudioNatif(config,audio,async(url,init)=>{
  assert.ok(String(url).endsWith('/audio/transcriptions'));assert.equal(init?.redirect,'error');
  const form=init?.body as FormData;assert.equal(form.get('model'),'whisper-1');assert.equal((form.get('file') as File).name,'recording.wav');
  return Response.json({text:'Bonjour à tous'});
 });assert.equal(Buffer.from(r.base64,'base64').toString(),'Bonjour à tous');assert.equal(r.mime,'text/plain');
 await assert.rejects(transcrireAudioNatif(config,{...audio,format:'mp3'},async()=>{throw Error('must not call');}),/AUDIO_INVALID/);
 for(const response of [Response.json({text:''}),new Response('secret',{status:401}),new Response('x'.repeat(300000))])await assert.rejects(transcrireAudioNatif(config,audio,async()=>response));
 const common={requestId:'31c67eaa-5372-4e8e-b8d4-f6cb61bbd79f',texte:'Audio',droitsConfirmes:true};
 assert.equal(demandeMedia.safeParse({...common,operation:'transcription'}).success,false);
 assert.equal(demandeMedia.safeParse({...common,operation:'image',audio}).success,false);
});

test('realtime WebRTC keeps the provider key server-side and configures each microphone mode', async () => {
 const envName=['OPENAI','API','KEY'].join('_');const previous=process.env[envName];process.env[envName]='sk-realtime-server-only';
 const modelEnv=['OPENAI','REALTIME','MODEL'].join('_');const previousModel=process.env[modelEnv];delete process.env[modelEnv];
 const offer=`v=0\r\n${'a=x\r\n'.repeat(20)}`;const answer=`v=0\r\n${'a=y\r\n'.repeat(20)}`;
 try {
  for(const mode of ['dictee','conversation'] as const){
   const result=await creerAppelVocalTempsReel(offer,mode,{langue:'fr-FR',voix:'coral',safetyId:'hashed-user'},async(url,init)=>{
    assert.ok(String(url).endsWith('/v1/realtime/calls'));assert.equal(init?.method,'POST');assert.equal(init?.redirect,'error');
    assert.equal(new Headers(init?.headers).get('authorization'),'Bearer sk-realtime-server-only');
    assert.equal(new Headers(init?.headers).get('openai-safety-identifier'),'hashed-user');
    const form=init?.body as FormData;assert.equal(form.get('sdp'),offer,'SDP transmis complet : CRLF final conservé');assert.ok(String(form.get('sdp')).endsWith('\r\n'));
    const session=JSON.parse(String(form.get('session')));
    assert.equal(session.type,'realtime');assert.equal(session.model,'gpt-realtime');assert.equal(session.audio.input.transcription.language,'fr');assert.equal(session.audio.output.voice,'coral');
    assert.equal(session.audio.output.speed,undefined);assert.equal(session.audio.input.turn_detection.eagerness,mode==='conversation'?'medium':undefined);
    assert.equal(session.audio.input.turn_detection.create_response,mode==='conversation');
    assert.equal(JSON.stringify(session).includes('sk-realtime-server-only'),false);
    return new Response(answer,{status:200,headers:{'Content-Type':'application/sdp'}});
   });
   assert.equal(result,answer);assert.ok(result.endsWith('\r\n'));assert.equal(result.includes('sk-realtime-server-only'),false);
  }
  process.env[modelEnv]='gpt-realtime-2.1';let tentatives=0;
  const fallback=await creerAppelVocalTempsReel(offer,'conversation',{},async(_url,init)=>{
   const session=JSON.parse(String((init?.body as FormData).get('session')));tentatives+=1;
   if(tentatives===1){assert.equal(session.model,'gpt-realtime-2.1');return Response.json({error:{code:'model_not_found'}},{status:404});}
   assert.equal(session.model,'gpt-realtime');return new Response(answer,{status:200});
  });
  assert.equal(fallback,answer);assert.equal(tentatives,2);
  await assert.rejects(creerAppelVocalTempsReel('not-sdp','dictee',{},async()=>{throw Error('must not call');}),/REALTIME_SDP_INVALID/);
  // Modèle de transcription mémorisé par le navigateur : liste fermée, jamais un nom libre ; la dictée finalise après 800 ms de silence.
  const modeleVu=async(modeleTranscription?:string,mode:'dictee'|'conversation'='dictee')=>{let vu:any;await creerAppelVocalTempsReel(offer,mode,{modeleTranscription},async(_u,init)=>{vu=JSON.parse(String((init?.body as FormData).get('session')));return new Response(answer,{status:200});});return vu;};
  assert.equal((await modeleVu('whisper-1')).audio.input.transcription.model,'whisper-1');
  assert.equal((await modeleVu('gpt-4o-transcribe')).audio.input.transcription.model,'gpt-4o-transcribe');
  assert.equal((await modeleVu('nom-libre-du-navigateur')).audio.input.transcription.model,'gpt-4o-mini-transcribe');
  assert.equal((await modeleVu()).audio.input.transcription.model,'gpt-4o-mini-transcribe');
  assert.equal((await modeleVu('whisper-1','dictee')).audio.input.turn_detection.silence_duration_ms,800);
  // Salutations arabes en lettres latines : dans l'indication de transcription et dans les consignes de la conversation.
  const conv=await modeleVu(undefined,'conversation');
  assert.match(conv.audio.input.transcription.prompt,/salam alaikum/);assert.match(conv.audio.input.transcription.prompt,/lettres latines/);
  assert.match(conv.instructions,/wa alaykoum salam/);
 } finally {
  if(previous===undefined)delete process.env[envName];else process.env[envName]=previous;
  if(previousModel===undefined)delete process.env[modelEnv];else process.env[modelEnv]=previousModel;
 }
});

test('offre WebRTC : le SDP part complet (CRLF final) même si le navigateur ou le réseau l\'a réduit — cause du 400 invalid_offer', async () => {
 // Vraie offre générée par Chromium (audio + canal « oai-events »), terminée par CRLF comme l'exige la RFC 4566.
 const reelle=readFileSync(new URL('./fixtures/offre-webrtc-chrome.sdp',import.meta.url),'utf8');
 assert.ok(reelle.endsWith('\r\n'));
 // Le saut de ligne final avait disparu (trim) : l'analyseur SDP strict du service refusait l'offre.
 assert.equal(normaliserSdp(reelle.trim()),reelle);
 assert.equal(normaliserSdp(reelle.replace(/\r\n/g,'\n')),reelle);
 assert.equal(normaliserSdp(reelle),reelle);
 assert.equal(normaliserSdp(`${reelle}\r\n\r\n`),reelle);
 const envName=['OPENAI','API','KEY'].join('_');const previous=process.env[envName];process.env[envName]='sk-realtime-server-only';
 try {
  let envoye='';
  const reponse=await creerAppelVocalTempsReel(reelle.trim(),'conversation',{},async(_url,init)=>{envoye=String((init?.body as FormData).get('sdp'));return new Response(reelle.trim(),{status:200});});
  assert.equal(envoye,reelle);
  assert.equal(reponse,reelle,'la réponse rendue au navigateur est complète aussi');
 } finally {
  if(previous===undefined)delete process.env[envName];else process.env[envName]=previous;
 }
});

test('aperçu de voix : toutes les voix du mode direct, repli de modèle, codes publics seulement', async () => {
 const envName=['OPENAI','API','KEY'].join('_');const previous=process.env[envName];process.env[envName]='sk-realtime-server-only';
 try {
  assert.ok(VOIX_TEMPS_REEL.includes('cedar'));assert.equal(new Set(VOIX_TEMPS_REEL).size,VOIX_TEMPS_REEL.length);
  const mp3=Buffer.alloc(2000,7);
  const vus:string[]=[];
  for(const voix of VOIX_TEMPS_REEL){
   const r=await creerApercuVoix(voix,async(url,init)=>{
    assert.ok(String(url).endsWith('/v1/audio/speech'));assert.equal(init?.redirect,'error');
    const body=JSON.parse(String(init?.body));assert.equal(body.voice,voix);assert.equal(body.response_format,'mp3');assert.match(body.input,/AL-HUDHUD/);
    assert.equal(new Headers(init?.headers).get('authorization'),'Bearer sk-realtime-server-only');
    vus.push(body.model);return new Response(mp3,{status:200});
   });
   assert.equal(r.mime,'audio/mpeg');assert.equal(Buffer.from(r.base64,'base64').length,2000);assert.equal(r.base64.includes('sk-'),false);
  }
  assert.ok(vus.every(m=>m==='gpt-4o-mini-tts'));
  // Modèle moderne refusé : repli sur tts-1 pour une voix historique ; pas de repli pour une voix récente.
  let essais:string[]=[];
  const refus=async(_u:unknown,init?:RequestInit)=>{essais.push(JSON.parse(String(init?.body)).model);return essais.at(-1)==='gpt-4o-mini-tts'?Response.json({error:{code:'model_not_found'}},{status:404}):new Response(mp3,{status:200});};
  assert.equal((await creerApercuVoix('alloy',refus)).mime,'audio/mpeg');assert.deepEqual(essais,['gpt-4o-mini-tts','tts-1']);
  essais=[];await assert.rejects(creerApercuVoix('cedar',refus),/^Error: VOICE_PREVIEW_404_gpt-4o-mini-tts_model_not_found$/);assert.deepEqual(essais,['gpt-4o-mini-tts']);
  await assert.rejects(creerApercuVoix('inconnue',async()=>{throw Error('must not call');}),/VOICE_PREVIEW_INVALID/);
  await assert.rejects(creerApercuVoix('marin',async()=>new Response('secret body',{status:401})),(e:Error)=>/^VOICE_PREVIEW_401_/.test(e.message)&&!e.message.includes('secret'));
  await assert.rejects(creerApercuVoix('marin',async()=>new Response(Buffer.alloc(10),{status:200})),/OUTPUT/);
  delete process.env[envName];
  await assert.rejects(creerApercuVoix('marin',async()=>{throw Error('must not call');}),/CREDENTIAL_REQUIRED/);
 } finally {
  if(previous===undefined)delete process.env[envName];else process.env[envName]=previous;
 }
});
