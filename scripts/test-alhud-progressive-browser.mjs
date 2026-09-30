import {mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium,webkit,expect} from '@playwright/test';

// Real UI components with synthetic auth/API hooks, no live account or paid provider.
const dir=resolve('.alhud-browser-fixture');mkdirSync(dir,{recursive:true});mkdirSync('test-results',{recursive:true});
writeFileSync(join(dir,'auth.ts'),`import {useSyncExternalStore} from 'react';
let state={user:{id:1,role:'super_admin'},isSessionLoading:false};const listeners=new Set<()=>void>();
(window as any).fixtureLogout=()=>{state={user:null,isSessionLoading:false} as any;for(const listener of listeners)listener();};
export const useAuth=()=>useSyncExternalStore(listener=>{listeners.add(listener);return()=>listeners.delete(listener);},()=>state);`);
writeFileSync(join(dir,'trpc.ts'),`import {useEffect,useState} from 'react';
const fixture=(window as any).fixture={calls:0,failSend:false,failHistory:false,delay:80,response:null};
const rows=[{id:1,titre:'Atelier de test'},{id:2,titre:'Catalogue de test'}];
const messages=[{id:1,role:'utilisateur',contenu:'Question enregistrée de test',ok:true,contexte:[]},{id:2,role:'moteur',contenu:'Réponse enregistrée de test',ok:true,motifPublic:'',contexte:[]}];
const queryData=(name:string)=>name==='conversations'?rows:name==='fil'?messages:undefined;
const proxy=(path:string[]=[])=>new Proxy(()=>{}, {get(_target,key){
 if(key==='then')return undefined;
 if(key==='useUtils')return ()=>proxy(['utils']);
 if(key==='useQuery')return (input:any,options:any={})=>{
  const name=path.at(-1),queryKey=JSON.stringify(input);const enabled=options.enabled!==false;
  const [state,setState]=useState(()=>({data:enabled?queryData(name!):undefined,isLoading:enabled&&name==='fil',isFetching:enabled&&name==='fil',isError:false}));
  const [revision,setRevision]=useState(0);
  useEffect(()=>{let live=true;if(!enabled)return;
   if(name==='fil'){setState({data:undefined,isLoading:true,isFetching:true,isError:false});setTimeout(()=>{if(live)setState({data:fixture.failHistory?undefined:messages,isLoading:false,isFetching:false,isError:fixture.failHistory});},fixture.delay);}
   else setState({data:queryData(name!),isLoading:false,isFetching:false,isError:false});
   return()=>{live=false;};
  },[queryKey,enabled,revision]);
  return {...state,error:new Error('Fixture unavailable'),refetch:async()=>{setRevision(n=>n+1);return {data:queryData(name!)};}};
 };
 if(key==='useMutation')return (options:any={})=>{const [pending,setPending]=useState(false);return {isPending:pending,isError:false,mutate:async(input:any)=>{
  const context=await options.onMutate?.(input);setPending(true);fixture.calls++;fixture.lastQuestion=input.question;
  setTimeout(()=>{const response={sessionId:input.sessionId||1,reponse:fixture.response||'Première ligne complète.\\nSeconde ligne qui apparaît progressivement.\\nDernière ligne de la réponse réelle.',ok:true,motif:'',motifPublic:'',fournisseur:null,modele:null,contexte:[],appelsOutils:[]};
    try {if(fixture.failSend)options.onError?.(new Error('Échec simulé'),input,context);else options.onSuccess?.(response,input,context);}
    finally {setPending(false);options.onSettled?.(response,null,input,context);}
  },fixture.delay);
 }};};
 if(key==='fetch')return async()=>{await new Promise(r=>setTimeout(r,fixture.delay));if(fixture.failHistory)throw Error('Échec historique simulé');return messages;};
 if(key==='invalidate'||key==='refetch')return async()=>{};
 return proxy([...path,String(key)]);
}});export const trpc=proxy();`);
writeFileSync(join(dir,'entry.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import {Conversation} from '../client/src/pages/intelligence/modules/Conversation';createRoot(document.getElementById('root')!).render(<div style={{height:'100dvh',background:'white'}}><Conversation /></div>);`);
await build({entryPoints:[join(dir,'entry.tsx')],bundle:true,outfile:join(dir,'ui.js'),platform:'browser',format:'esm',define:{'process.env.NODE_ENV':'"test"'},plugins:[{name:'synthetic-private-context',setup(b){b.onResolve({filter:/\/lib\/trpc$/},()=>({path:join(dir,'trpc.ts')}));b.onResolve({filter:/\/lib\/auth$/},()=>({path:join(dir,'auth.ts')}));}}]});
function cssFiles(path){try{return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?cssFiles(join(path,e.name)):e.name.endsWith('.css')?[join(path,e.name)]:[]);}catch{return [];}}
const css=cssFiles('dist').sort((a,b)=>readFileSync(b).length-readFileSync(a).length)[0];
assert(css,'Build the application before running browser checks; do not test without actual CSS.');
const server=createServer((req,res)=>{
 if(req.url==='/ai-identity.json'){res.setHeader('Content-Type','application/json; charset=utf-8');res.end(readFileSync('public/ai-identity.json'));return;}
 if(req.url==='/tailwind.css'){res.setHeader('Content-Type','text/css; charset=utf-8');res.end(readFileSync(css));return;}
 if(req.url==='/ui.js'||req.url==='/ui.css'){res.setHeader('Content-Type',req.url.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8');res.end(readFileSync(join(dir,req.url.slice(1))));return;}
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/tailwind.css"><link rel="stylesheet" href="/ui.css"></head><body><div id="root"></div><script type="module" src="/ui.js"></script></body></html>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;

const configurations=[['desktop',chromium,{width:1440,height:1000}],['mobile',chromium,{width:390,height:844}],['mobile-webkit',webkit,{width:390,height:844}],['tablet',webkit,{width:820,height:1180}]];
const results=[];
try {
 for(const [name,engine,viewport] of configurations) {
  const browser=await engine.launch({headless:true});
  try {
   const page=await browser.newPage({viewport});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
   const url='http://127.0.0.1:'+port;
   await page.goto(url);
   const input=page.getByRole('textbox',{name:'Votre message'});
   const send=page.getByRole('button',{name:'Envoyer le message',exact:true});
   await input.fill('Une vraie question pour la vérification');
   const layout=await page.evaluate(()=>{
     const input=document.querySelector('textarea').getBoundingClientRect();
     const composer=document.querySelector('.alhud-composer').getBoundingClientRect();
     const controls=[...document.querySelectorAll('.alhud-composer > button')].map(b=>b.getBoundingClientRect());
     return {width:input.width/composer.width,below:controls.every(b=>b.top>=input.bottom-1)};
   });
   assert(layout.width>.85 && layout.below,'full-width input and controls below');
   await page.evaluate(()=>window.fixture.delay=1500);
   await send.click();
   const timer=page.getByRole('timer',{name:'Temps d’attente'});
   await expect(timer).toHaveText('0:00');
   await expect(timer).toHaveText('0:01');
   await page.locator('.alhud-progressive-reply[data-revealing="true"]').waitFor();
   const reply=page.locator('.alhud-progressive-reply').last();
   const full=await reply.locator('.alhud-sr-only').textContent();
   const visible=await reply.locator(':scope > span[aria-hidden="true"]').textContent();
   assert(full.length>visible.length,'full answer is announced while visual text grows');
   const highlight=reply.locator('.alhud-active-line');
   await expect(highlight).toHaveCount(1);
   const gradient=await highlight.evaluate(el=>getComputedStyle(el).backgroundImage);
   assert(gradient.includes('rgb(139, 105, 20)')&&gradient.includes('rgb(255, 233, 155)'),'gold reflection');
   await page.screenshot({path:`test-results/alhud-progressive-${name}.png`,fullPage:true});
   await expect(reply).toHaveAttribute('data-revealing','false');
   await expect(highlight).toHaveCount(0);
   assert.equal(await reply.locator(':scope > span[aria-hidden="true"]').textContent(),full);
   await expect(timer).toHaveCount(0);
   // Copy always uses the complete engine answer, not a visual prefix.
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text)=>window.fixture.copied=text}}));
   await page.getByRole('button',{name:'Copier cette réponse'}).last().click();
   assert.equal(await page.evaluate(()=>window.fixture.copied),full);
   await input.fill(Array(100).fill('Long brouillon conservé dans la saisie.').join('\n'));
   assert(await input.evaluate(el=>el.scrollHeight>el.clientHeight),'long input scrolls internally');
   assert(await send.isVisible(),'send remains visible with long input');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');

   const nav=async()=>{
     const menu=page.getByRole('button',{name:'Conversations et outils',exact:true});
     if(await menu.isVisible()){await menu.click();return page.getByRole('dialog');}
     return page.locator('.alhud-conversation-rail');
   };
   await input.fill('Brouillon à garder pendant la régénération');
   // Regenerate is deliberately hidden on mobile in the existing UI; test the real button on desktop/tablet.
   const regenerate=page.getByRole('button',{name:'Régénérer la dernière réponse',exact:true});
   if(await regenerate.isVisible()) {
     await regenerate.click();
     await expect(input).toHaveValue('Brouillon à garder pendant la régénération');
     await expect(input).toBeEnabled();
     await expect(input).toHaveValue('Brouillon à garder pendant la régénération');
   }
   await page.evaluate(()=>{window.fixture.failSend=true;window.fixture.delay=80;});
   await send.click();
   await expect(input).toBeEnabled();
   await expect(input).toHaveValue('Brouillon à garder pendant la régénération');
   await expect(page.getByRole('timer')).toHaveCount(0);

   await (await nav()).getByRole('button',{name:'Catalogue de test',exact:true}).click();
   await page.getByText('Réponse enregistrée de test',{exact:true}).waitFor();
   await expect(page.locator('.alhud-progressive-reply[data-revealing="true"]')).toHaveCount(0);

   await page.evaluate(()=>{window.fixture.failSend=false;window.fixture.delay=80;window.fixture.response=Array(150).fill('Une longue réponse réellement reçue pour vérifier le défilement.').join('\n');});
   await input.fill('Longue réponse de test');
   await send.click();
   await page.locator('.alhud-progressive-reply[data-revealing="true"]').waitFor();
   const log=page.getByRole('log',{name:'Conversation'});
   await log.evaluate(el=>{el.scrollTop=0;el.dispatchEvent(new Event('scroll'));});
   await expect(page.getByRole('button',{name:'Aller à la dernière réponse'})).toBeVisible();
   await expect(page.locator('.alhud-progressive-reply').last()).toHaveAttribute('data-revealing','false');
   assert(await log.evaluate(el=>el.scrollTop<50),'reading older text is not interrupted');
   await page.getByRole('button',{name:'Aller à la dernière réponse'}).click();
   assert(await log.evaluate(el=>el.scrollHeight-el.scrollTop-el.clientHeight<48),'down arrow returns to latest answer');
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.goto(url);
   await input.fill('Réponse sans animation');
   await send.click();
   await expect(input).toBeEnabled();
   await expect(page.locator('.alhud-progressive-reply[data-revealing="true"]')).toHaveCount(0);
   assert.equal(await page.locator('.alhud-progressive-reply > span[aria-hidden="true"]').textContent(),await page.locator('.alhud-progressive-reply .alhud-sr-only').textContent());
   assert.deepEqual(errors,[]);
   results.push({name,ok:true,fullWidthInput:true,controlsBelow:true,realWaitingTimer:true,progressiveReply:true,goldOnlyActiveLine:true,errorKeepsDraft:true,historyNotReplayed:true,copyCompleteAnswer:true,longInputScroll:true,scrollPreservesReading:true,downArrow:true,reducedMotion:true});
  } finally {await browser.close();}
 }
} finally {
 server.close();
 writeFileSync('test-results/alhud-progressive-browser.json',JSON.stringify(results,null,2));
 rmSync(dir,{recursive:true,force:true});
}
console.log(JSON.stringify(results,null,2));

