import {mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
// PLAYWRIGHT_ENTRY : chemin d'un Playwright déjà installé ailleurs (environnements sans @playwright/test).
const {chromium}=await import(process.env.PLAYWRIGHT_ENTRY||'@playwright/test');

// Écran « Coffre secret » réel (vrais composants, vrai CSS) avec un serveur tRPC simulé : aucun compte, aucune clé réelle.
// Vérifie au clic souris réel : ajout depuis l'en-tête et depuis chaque outil, plusieurs secrets pour un même outil, suppression.
const dir=resolve('.coffre-browser-fixture');mkdirSync(dir,{recursive:true});
writeFileSync(join(dir,'trpc.ts'),`import {useSyncExternalStore} from 'react';
type S={id:number;nom:string;service:string;type:string;apercu:string;dernierUsageAt:null};
let secrets:S[]=[{id:1,nom:'GitHub — jeton mkapms-web',service:'GitHub',type:'cle_api',apercu:'••••abcd',dernierUsageAt:null}];let nextId=2;const listeners=new Set<()=>void>();let version=0;
const emit=()=>{version++;for(const l of listeners)l();};
(window as any).fixture={calls:[] as any[],get secrets(){return secrets;}};
const sub=(l:()=>void)=>{listeners.add(l);return()=>listeners.delete(l);};
const useSecrets=()=>{useSyncExternalStore(sub,()=>version);return {data:[...secrets],isLoading:false,isError:false,error:null as any};};
const query=(name:string)=>()=>name==='coffreSecrets'?useSecrets():name==='coffreEtat'?{data:{disponible:true,motif:''},isLoading:false}:{data:[],isLoading:false,isError:false};
const mutation=(name:string)=>(options:any={})=>({isPending:false,mutate:(input:any)=>{
 (window as any).fixture.calls.push({name,input});
 if(name==='coffreAjouter'){secrets=[...secrets,{id:nextId++,nom:input.nom,service:input.service,type:input.contenu.type,apercu:'••••'+String(input.contenu.valeur||'').slice(-4),dernierUsageAt:null}];emit();options.onSuccess?.({ok:true,detail:'Secret déposé.'});}
 if(name==='coffreSupprimer'){secrets=secrets.filter(s=>s.id!==input.id);emit();options.onSuccess?.({ok:true,detail:'Supprimé.'});}
}});
const intelligences=new Proxy({},{get:(_t,name:string)=>({useQuery:query(name),useMutation:mutation(name),invalidate:async()=>{}})});
export const trpc={intelligences,useUtils:()=>({intelligences:new Proxy({},{get:()=>({invalidate:async()=>{}})})})};`);
writeFileSync(join(dir,'entry.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import {Coffre} from '../client/src/pages/intelligence/modules/Coffre';
createRoot(document.getElementById('root')!).render(<div style={{maxWidth:720,margin:'0 auto',padding:16}}><Coffre/></div>);`);
await build({entryPoints:[join(dir,'entry.tsx')],bundle:true,outfile:join(dir,'ui.js'),platform:'browser',format:'esm',define:{'process.env.NODE_ENV':'"test"'},plugins:[{name:'fixture',setup(b){b.onResolve({filter:/\/lib\/trpc$/},()=>({path:join(dir,'trpc.ts')}));}}]});
const cssFiles=p=>{try{return readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?cssFiles(join(p,e.name)):e.name.endsWith('.css')?[join(p,e.name)]:[]);}catch{return [];}};
const css=cssFiles('dist').sort((a,b)=>readFileSync(b).length-readFileSync(a).length)[0];
assert(css,'Construisez l\'application avant (npm run build) : pas de test sans le vrai CSS.');
const server=createServer((req,res)=>{
 if(req.url==='/tailwind.css'){res.setHeader('Content-Type','text/css; charset=utf-8');res.end(readFileSync(css));return;}
 if(req.url==='/ui.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(readFileSync(join(dir,'ui.js')));return;}
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/tailwind.css"></head><body><div id="root"></div><script type="module" src="/ui.js"></script></body></html>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
const resultats=[];
try{
 for(const [nom,viewport] of [['ordinateur',{width:1280,height:900}],['téléphone',{width:390,height:844}]]){
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  try{
   const page=await browser.newPage({viewport});const erreurs=[];page.on('pageerror',e=>erreurs.push(e.message));page.setDefaultTimeout(8000);
   page.on('dialog',d=>d.accept());
   await page.goto('http://127.0.0.1:'+port+'/');
   const calls=()=>page.evaluate(()=>window.fixture.calls);
   // 1. Formulaire fermé au départ ; bouton « Ajouter un secret » atteignable à la souris.
   await page.getByRole('heading',{name:'Coffre secret'}).waitFor();
   assert.equal(await page.getByLabel('Ajouter un secret',{exact:true}).count(),0,'formulaire fermé au départ');
   const entete=page.getByRole('button',{name:'Ajouter un secret',exact:true});
   const box=await entete.boundingBox();assert.ok(box);
   assert.equal(await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return !!e&&!!e.closest('button')&&/Ajouter un secret/.test(e.closest('button').textContent||'');},[box.x+box.width/2,box.y+box.height/2]),true,'rien ne recouvre le bouton');
   await entete.click();
   const formulaire=page.getByLabel('Ajouter un secret',{exact:true});await formulaire.waitFor();
   // 2. Ajout libre (n'importe quel type de clé).
   await formulaire.getByLabel('Nom').fill('Railway — boutique 1');await formulaire.getByLabel('Service visé (facultatif)').fill('Railway');
   await formulaire.getByLabel('Mode').selectOption('cle_api');await formulaire.getByRole('textbox',{name:'Clé ou jeton'}).fill('jeton-de-test-0001');
   await formulaire.getByRole('button',{name:'Enregistrer dans le coffre'}).click();
   await page.getByText('Railway — boutique 1').first().waitFor();
   assert.equal(await formulaire.count(),0,'le formulaire se referme après le dépôt');
   // 3. « + Ajouter » sur la carte Railway : un AUTRE secret pour le même outil, service prérempli.
   const carte=page.locator('div.rounded-lg',{has:page.getByRole('button',{name:'Ajouter un autre secret pour Railway'})}).first();
   await carte.getByRole('button',{name:'Ajouter un autre secret pour Railway'}).click();
   const f2=page.getByLabel('Ajouter un secret',{exact:true});await f2.waitFor();
   assert.equal(await f2.getByLabel('Service visé (facultatif)').inputValue(),'Railway');
   assert.equal(await f2.getByLabel('Nom').inputValue(),'Railway — ');
   await f2.getByLabel('Nom').fill('Railway — boutique 2');await f2.getByRole('textbox',{name:'Clé ou jeton'}).fill('jeton-de-test-0002');
   await f2.getByRole('button',{name:'Enregistrer dans le coffre'}).click();
   await page.getByLabel('Autres secrets Railway').getByText('Railway — boutique 2').waitFor();
   assert.equal(await page.getByLabel('Autres secrets Railway').locator('li').count(),2,'deux secrets pour le même outil');
   // 4. Suppression depuis la carte de l'outil.
   await page.getByRole('button',{name:'Supprimer Railway — boutique 1'}).first().click();
   await page.waitForFunction(()=>window.fixture.secrets.every(s=>s.nom!=='Railway — boutique 1'));
   assert.equal(await page.getByLabel('Autres secrets Railway').locator('li').count(),1);
   // 5. Un élément du catalogue déjà déposé se supprime aussi, depuis sa ligne.
   await page.getByRole('button',{name:'Supprimer GitHub — jeton mkapms-web'}).first().click();
   await page.waitForFunction(()=>!window.fixture.secrets.some(s=>s.nom==='GitHub — jeton mkapms-web'));
   // 6. Annuler referme sans rien déposer.
   const avant=(await calls()).length;
   await page.getByRole('button',{name:'Ajouter un secret',exact:true}).click();
   await page.getByLabel('Ajouter un secret',{exact:true}).getByRole('button',{name:'Annuler'}).click();
   assert.equal(await page.getByLabel('Ajouter un secret',{exact:true}).count(),0);assert.equal((await calls()).length,avant);
   // 7. Pas de défilement horizontal de la page.
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'pas de débordement horizontal');
   assert.deepEqual(erreurs,[]);
   resultats.push(nom+' : ok');
  } finally { await browser.close(); }
 }
} finally { server.close(); rmSync(dir,{recursive:true,force:true}); }
console.log(resultats.join('\n'));
