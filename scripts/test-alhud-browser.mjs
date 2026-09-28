import {mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium,webkit} from '@playwright/test';

// Real UI with injected synthetic auth/API. No live account, provider or production DB.
const dir=resolve('.alhud-browser-fixture');mkdirSync(dir,{recursive:true});mkdirSync('test-results',{recursive:true});
writeFileSync(join(dir,'auth.ts'),`export const useAuth=()=>({user:{id:1,role:'super_admin'},isSessionLoading:false});`);
writeFileSync(join(dir,'trpc.ts'),`import {useState} from 'react';
const rows=[{id:1,titre:'Atelier de test'},{id:2,titre:'Catalogue de test'}];
const messages=[{id:1,role:'utilisateur',contenu:'Question enregistrée de test',ok:true,contexte:[]},{id:2,role:'moteur',contenu:'Réponse enregistrée de test',ok:true,motifPublic:'',contexte:[]}];
const proxy=(path=[])=>new Proxy(()=>{}, {get(_target,key){
 if(key==='then')return undefined;
 if(key==='useUtils')return ()=>proxy(['utils']);
 if(key==='useQuery')return ()=>({data:path.at(-1)==='conversations'?rows:path.at(-1)==='fil'?messages:path.at(-1)==='etat'?{acces:{status:'ok',message:'Configuration simulée pour test UI'},moteurs:[]}:undefined,isLoading:false,isFetching:false,isError:false,refetch:async()=>({data:rows})});
 if(key==='useMutation')return (options={})=>{const [pending,setPending]=useState(false);return {isPending:pending,mutate:(input)=>{setPending(true);setTimeout(()=>{options.onSuccess?.({sessionId:input.sessionId||1,reponse:'Réponse simulée pour vérification interface',ok:true,motif:'',fournisseur:null,modele:null,contexte:[],appelsOutils:[]});setPending(false);},50);}};};
 if(key==='fetch')return async()=>messages;
 if(key==='invalidate'||key==='refetch')return async()=>{};
 return proxy([...path,String(key)]);
}});export const trpc=proxy();`);
writeFileSync(join(dir,'entry.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter} from 'react-router-dom';import Centre from '../client/src/pages/CentreIntelligences';createRoot(document.getElementById('root')!).render(<BrowserRouter><Centre /></BrowserRouter>);`);
await build({entryPoints:[join(dir,'entry.tsx')],bundle:true,outfile:join(dir,'ui.js'),platform:'browser',format:'esm',define:{'process.env.NODE_ENV':'"test"'},plugins:[{name:'synthetic-private-context',setup(b){b.onResolve({filter:/\/lib\/trpc$/},()=>({path:join(dir,'trpc.ts')}));b.onResolve({filter:/\/lib\/auth$/},()=>({path:join(dir,'auth.ts')}));}}]});
function cssFiles(path){try{return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?cssFiles(join(path,e.name)):e.name.endsWith('.css')?[join(path,e.name)]:[]);}catch{return [];}}
const css=cssFiles('dist').sort((a,b)=>readFileSync(b).length-readFileSync(a).length)[0];
const server=createServer((req,res)=>{
 if(req.url==='/ai-identity.json'){res.setHeader('Content-Type','application/json');res.end(readFileSync('public/ai-identity.json'));return;}
 if(req.url==='/tailwind.css'){res.setHeader('Content-Type','text/css');res.end(css?readFileSync(css):'');return;}
 if(req.url==='/ui.js'||req.url==='/ui.css'){res.setHeader('Content-Type',req.url.endsWith('.js')?'text/javascript':'text/css');res.end(readFileSync(join(dir,req.url.slice(1))));return;}
 res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/tailwind.css"><link rel="stylesheet" href="/ui.css"></head><body><div id="root"></div><script type="module" src="/ui.js"></script></body></html>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
const configurations=[['desktop',chromium,{width:1440,height:1000}],['mobile',chromium,{width:390,height:844}],['tablet',webkit,{width:820,height:1180}]];
const results=[];
try{
 for(const [name,engine,viewport] of configurations){
  const browser=await engine.launch({headless:true});const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  try{
   await page.goto('http://127.0.0.1:'+port+'/admin/intelligences');
   await page.getByRole('heading',{name:'AL-HUDHUD·M',exact:true}).waitFor();
   const input=page.getByPlaceholder('Écris ta demande…');await input.fill('Brouillon à conserver');
   const mobile=viewport.width<1024;
   if(mobile)await page.getByRole('button',{name:'Conversations et outils',exact:true}).click();
   await page.getByRole('button',{name:'Catalogue de test',exact:true}).click();
   await page.getByText('Question enregistrée de test',{exact:true}).waitFor();
   if(mobile)await page.getByRole('button',{name:'Conversations et outils',exact:true}).click();
   await page.getByRole('button',{name:'Nouvelle conversation',exact:true}).click();
   assert.equal(await input.inputValue(),'Brouillon à conserver');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'horizontal overflow');
   if(mobile){await page.getByRole('button',{name:'Conversations et outils',exact:true}).click();await page.screenshot({path:'test-results/alhud-main-'+name+'-drawer.png',fullPage:true});await page.keyboard.press('Escape');}
   await page.screenshot({path:'test-results/alhud-main-'+name+'.png',fullPage:true});
   assert.deepEqual(errors,[],'unexpected runtime errors');results.push({viewport:name,history:true,draftRetained:true,overflow:false,errors});
  }catch(error){await page.screenshot({path:'test-results/alhud-main-'+name+'-failure.png',fullPage:true});throw error;}
  finally{await browser.close();}
 }
 writeFileSync('test-results/alhud-main-browser.json',JSON.stringify({scope:'UI fixture, no live provider',results},null,2));
 console.log(JSON.stringify(results));
}finally{server.close();rmSync(dir,{recursive:true,force:true});}
