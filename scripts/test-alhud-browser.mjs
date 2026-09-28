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
const fixture=(window as any).fixture={calls:0,failSend:false,failHistory:false,delay:80};
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
  setTimeout(()=>{const response={sessionId:input.sessionId||1,reponse:'Réponse simulée pour vérification interface',ok:true,motif:'',motifPublic:'',fournisseur:null,modele:null,contexte:[],appelsOutils:[]};
    try {if(fixture.failSend)options.onError?.(new Error('Échec simulé'),input,context);else options.onSuccess?.(response,input,context);}
    finally {setPending(false);options.onSettled?.(response,null,input,context);}
  },fixture.delay);
 }};};
 if(key==='fetch')return async()=>{await new Promise(r=>setTimeout(r,fixture.delay));if(fixture.failHistory)throw Error('Échec historique simulé');return messages;};
 if(key==='invalidate'||key==='refetch')return async()=>{};
 return proxy([...path,String(key)]);
}});export const trpc=proxy();`);
writeFileSync(join(dir,'entry.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter} from 'react-router-dom';import Centre from '../client/src/pages/CentreIntelligences';import App from '../client/src/pages/intelligence';createRoot(document.getElementById('root')!).render(<BrowserRouter>{location.pathname==='/intelligence'?<App/>:<Centre/>}</BrowserRouter>);`);
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
try{
 for(const [name,engine,viewport] of configurations){
  const browser=await engine.launch({headless:true});
  try{
   for(const surface of ['centre','application']){
    const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    const url='http://127.0.0.1:'+port+(surface==='centre'?'/admin/intelligences':'/intelligence');
    const navigation=async()=>{
      const menu=page.getByRole('button',{name:'Conversations et outils',exact:true});
      if(await menu.isVisible()){await menu.click();return page.getByRole('dialog');}
      return page.locator(surface==='centre'?'.alhud-rail':'.alhud-conversation-rail');
    };
    const input=page.getByPlaceholder(surface==='centre'?'Écris ta demande…':'Votre demande… (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)');
    const submit=()=>surface==='centre'?page.getByTitle('Envoyer',{exact:true}):page.getByRole('button',{name:'Envoyer le message',exact:true});
    try{
     await page.goto(url);await page.getByRole('heading',{name:'AL-HUDHUD·M',exact:true}).waitFor();
     await input.fill('Brouillon du nouveau fil');
     let nav=await navigation();await nav.getByRole('button',{name:'Catalogue de test',exact:true}).click();
     await page.getByText('Question enregistrée de test',{exact:true}).waitFor();
     await input.fill('Question dans le fil enregistré');await submit().click();
     await page.getByText('Réponse simulée pour vérification interface',{exact:true}).waitFor();
     nav=await navigation();await nav.getByRole('button',{name:'Nouvelle conversation',exact:true}).click();
     await expect(input).toHaveValue('Brouillon du nouveau fil');
     if(surface==='application'){
      nav=await navigation();await nav.getByRole('button',{name:'Mémoire',exact:true}).click();
      await page.getByRole('heading',{name:'Mémoire utilisateur',exact:true}).waitFor();
      nav=await navigation();await nav.getByRole('button',{name:'Conversation',exact:true}).click();
      await expect(input).toHaveValue('Brouillon du nouveau fil');
      assert.equal(await page.locator('aside:visible').count(),viewport.width>=768?1:0,'single sidebar');
     }
     await page.evaluate(()=>window.fixture.failSend=true);await submit().click();
     await expect(input).toBeEnabled();await expect(input).toHaveValue('Brouillon du nouveau fil');
     assert.equal(await page.evaluate(()=>window.fixture.calls),2,'no duplicate request');
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'horizontal overflow');
     await page.screenshot({path:`test-results/alhud-${surface}-${name}.png`,fullPage:true});
     const menu=page.getByRole('button',{name:'Conversations et outils',exact:true});
     if(await menu.isVisible()){
      await menu.click();await page.screenshot({path:`test-results/alhud-${surface}-${name}-drawer.png`,fullPage:true});
      await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(menu).toBeFocused();
     }
     await page.evaluate(()=>{window.fixture.failSend=false;window.fixture.failHistory=true;});
     nav=await navigation();await nav.getByRole('button',{name:'Atelier de test',exact:true}).click();
     if(surface==='application'){
      await page.getByText('Cette conversation n’a pas pu être chargée.',{exact:false}).waitFor();
      await input.fill('Ne pas envoyer sans historique');await expect(submit()).toBeDisabled();
      await input.press('Enter');assert.equal(await page.evaluate(()=>window.fixture.calls),2);
     }else{
      await page.getByText('La conversation n’a pas pu être chargée.',{exact:false}).waitFor();
      await expect(input).toHaveValue('Brouillon du nouveau fil');
     }
     if(surface==='application'){
      await page.goto(url);
      nav=await navigation();await nav.getByRole('button',{name:'Atelier de test',exact:true}).click();
      await page.getByText('Question enregistrée de test',{exact:true}).waitFor();
      await page.evaluate(()=>window.fixture.delay=180);
      const regenerate=page.getByRole('button',{name:'Régénérer la dernière réponse',exact:true});
      const regenerateAndKeep=async(text,fail)=>{
       await input.fill(text);await page.evaluate(value=>window.fixture.failSend=value,fail);
       const before=await page.evaluate(()=>window.fixture.calls);
       await regenerate.click();await expect(input).toBeDisabled();
       await expect(input).toHaveValue(text);await expect(input).toBeEnabled();
       await expect(input).toHaveValue(text);
       assert.equal(await page.evaluate(()=>window.fixture.calls),before+1,'one regeneration request');
       assert.equal(await page.evaluate(()=>window.fixture.lastQuestion),'Question enregistrée de test','regenerate the old question, not the draft');
      };
      await regenerateAndKeep('Ajouter les chiffres de juin',false);
      nav=await navigation();await nav.getByRole('button',{name:'Catalogue de test',exact:true}).click();
      nav=await navigation();await nav.getByRole('button',{name:'Atelier de test',exact:true}).click();
      await expect(input).toHaveValue('Ajouter les chiffres de juin');
      await regenerateAndKeep('Question enregistrée de test',false);
      await regenerateAndKeep('Conserver ce brouillon après échec',true);
      await regenerateAndKeep('',true);
      // A failed first request has no saved session yet. Its regeneration may create one.
      await page.goto(url);await page.evaluate(()=>{window.fixture.failSend=true;window.fixture.delay=180;});
      await input.fill('Question initiale sans session');await submit().click();
      await expect(input).toBeDisabled();await expect(input).toBeEnabled();
      await input.fill('Brouillon conservé dans la nouvelle session');
      await page.evaluate(()=>window.fixture.failSend=false);
      await regenerate.click();await expect(input).toBeDisabled();await expect(input).toBeEnabled();
      await expect(input).toHaveValue('Brouillon conservé dans la nouvelle session');
      nav=await navigation();await nav.getByRole('button',{name:'Catalogue de test',exact:true}).click();
      nav=await navigation();await nav.getByRole('button',{name:'Atelier de test',exact:true}).click();
      await expect(input).toHaveValue('Brouillon conservé dans la nouvelle session');
     }
     await page.goto(url);await input.fill('Demande privée avant déconnexion');
     await page.evaluate(()=>window.fixture.delay=500);await submit().click();
     await page.evaluate(()=>window.fixtureLogout());await page.waitForTimeout(650);
     await expect(page.locator('[role="log"]')).toHaveCount(0);
     await expect(page.getByText('Réponse simulée pour vérification interface',{exact:true})).toHaveCount(0);
     assert.deepEqual(errors,[],'unexpected runtime errors');
     results.push({surface,viewport:name,history:true,draftOwnership:true,toolNavigation:true,errorRecovery:true,lateResponseIsolated:true,regenerationKeepsDraft:surface==='application',overflow:false});
    }catch(error){await page.screenshot({path:`test-results/alhud-${surface}-${name}-failure.png`,fullPage:true});console.error({surface,name,errors});throw error;}
    finally{await page.close();}
   }
  }finally{await browser.close();}
 }
 writeFileSync('test-results/alhud-main-browser.json',JSON.stringify({scope:'UI fixture, no live provider',results},null,2));
 console.log(JSON.stringify(results));
}finally{server.close();rmSync(dir,{recursive:true,force:true});}
