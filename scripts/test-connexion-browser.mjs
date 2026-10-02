import {mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
// PLAYWRIGHT_ENTRY : chemin d'un Playwright déjà installé ailleurs (environnements sans @playwright/test).
const {chromium}=await import(process.env.PLAYWRIGHT_ENTRY||'@playwright/test');

// Page « Connexion » réelle (vrais composants, vrai CSS) avec un faux serveur tRPC et un faux service Google : aucun compte, aucune clé réelle.
// Vérifie : pas de bouton mort sans identifiant ; identifiant lu côté serveur ; script Google chargé en retard ; jeton Google transmis au serveur.
const dir=resolve('.connexion-browser-fixture');mkdirSync(dir,{recursive:true});
writeFileSync(join(dir,'trpc.ts'),`type Q={data?:any;isLoading:boolean;error?:any};
const w=window as any;w.fixture={calls:[] as any[]};
const mutation=(name:string)=>()=>({isPending:false,error:null,mutate:(input:any)=>{w.fixture.calls.push({name,input});}});
import {useEffect,useState} from 'react';
function useGoogleConfig():Q{const [state,setState]=useState<Q>({isLoading:true});useEffect(()=>{const t=setTimeout(()=>setState({isLoading:false,data:{clientId:w.__clientId??null}}),50);return()=>clearTimeout(t);},[]);return state;}
export const trpc={
 auth:{login:{useMutation:mutation('login')},register:{useMutation:mutation('register')},googleLogin:{useMutation:mutation('googleLogin')},googleConfig:{useQuery:useGoogleConfig}},
 identity:{password:{forgot:{useMutation:mutation('forgot')}}},
};`);
writeFileSync(join(dir,'auth.ts'),`export const useAuth=()=>({login:()=>{},user:null});`);
writeFileSync(join(dir,'router.ts'),`export const useNavigate=()=>()=>{};`);
writeFileSync(join(dir,'entry.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import Connexion from '../client/src/pages/Connexion';
createRoot(document.getElementById('root')!).render(<Connexion/>);`);
await build({entryPoints:[join(dir,'entry.tsx')],bundle:true,outfile:join(dir,'ui.js'),platform:'browser',format:'esm',define:{'process.env.NODE_ENV':'"test"','import.meta.env':'{}'},
 plugins:[{name:'fixture',setup(b){
  b.onResolve({filter:/\/lib\/trpc$/},()=>({path:join(dir,'trpc.ts')}));
  b.onResolve({filter:/\/lib\/auth$/},()=>({path:join(dir,'auth.ts')}));
  b.onResolve({filter:/^react-router-dom$/},()=>({path:join(dir,'router.ts')}));
  b.onResolve({filter:/^@shared\/(.*)$/},a=>({path:resolve('shared',a.path.replace('@shared/','').replace(/\.js$/,''))+'.ts'}));
  b.onResolve({filter:/\/lib\/accountRoute$/},()=>({path:resolve('client/src/lib/accountRoute.ts')}));
 }}]});
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
// Faux service Google : enregistre initialize/renderButton ; peut arriver en retard.
const fauxGoogle=`window.__g={init:[],render:[]};window.__installGoogle=()=>{window.google={accounts:{id:{initialize:o=>{window.__g.init.push(o);window.__g.cb=o.callback;},renderButton:(el,o)=>{window.__g.render.push(o);const b=document.createElement('button');b.id='faux-bouton-google';b.textContent='Continuer avec Google (officiel simulé)';el.appendChild(b);}}}};};`;
const ID='client-test.apps.googleusercontent.com';
try{
 for(const [nom,viewport] of [['ordinateur',{width:1280,height:900}],['téléphone',{width:390,height:844}]]){
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  try{
   const ouvrir=async({clientId=null,googleDejaLa=false}={})=>{
    const ctx=await browser.newContext({viewport});const page=await ctx.newPage();const erreurs=[];page.on('pageerror',e=>erreurs.push(e.message));page.setDefaultTimeout(8000);
    await page.addInitScript(fauxGoogle);
    if(clientId)await page.addInitScript(`window.__clientId=${JSON.stringify(clientId)};`);
    if(googleDejaLa)await page.addInitScript(()=>{window.__installGoogle();});
    await page.goto(`http://127.0.0.1:${port}/`);
    return {page,erreurs,ctx};
   };

   // 1. Aucun identifiant nulle part : on le dit, aucun faux bouton Google qui ne fait rien.
   {const {page,erreurs,ctx}=await ouvrir();
    await page.waitForSelector('[data-testid="google-non-configure"]');
    assert.equal(await page.getByRole('button',{name:/Continuer avec Google/}).count(),0,'pas de bouton Google mort');
    assert.match(await page.locator('[data-testid="google-non-configure"]').innerText(),/pas encore activée/);
    await page.getByRole('button',{name:'Se connecter'}).waitFor();
    assert.deepEqual(erreurs,[]);await ctx.close();}

   // 2. Identifiant fourni par le serveur, script Google déjà présent : le bouton officiel est dessiné avec cet identifiant.
   {const {page,erreurs,ctx}=await ouvrir({clientId:ID,googleDejaLa:true});
    await page.waitForSelector('#faux-bouton-google');
    const init=await page.evaluate(()=>window.__g.init);
    assert.equal(init.length,1);assert.equal(init[0].client_id,ID);
    const rendu=await page.evaluate(()=>window.__g.render[0]);
    assert.equal(rendu.text,'continue_with');assert.ok(rendu.width>=200&&rendu.width<=400,'largeur '+rendu.width);
    // 3. Connexion Google : le jeton part au serveur.
    await page.evaluate(()=>window.__g.cb({credential:'jeton-google-de-test'}));
    const appels=await page.evaluate(()=>window.fixture.calls);
    assert.deepEqual(appels.filter(a=>a.name==='googleLogin'),[{name:'googleLogin',input:{idToken:'jeton-google-de-test'}}]);
    assert.deepEqual(erreurs,[]);await ctx.close();}

   // 4. Script Google chargé en retard (async/defer) : le bouton apparaît quand même.
   {const {page,erreurs,ctx}=await ouvrir({clientId:ID});
    await page.waitForSelector('text=Chargement de la connexion Google');
    assert.equal(await page.locator('#faux-bouton-google').count(),0);
    await page.evaluate(()=>window.__installGoogle());
    await page.waitForSelector('#faux-bouton-google');
    assert.equal(await page.getByText('Chargement de la connexion Google').count(),0);
    // 5. « Mot de passe oublié » : pas de bouton Google ; retour à la connexion : il est redessiné.
    await page.getByText('Mot de passe oublié ?').click();
    assert.equal(await page.locator('#faux-bouton-google').count(),0);
    await page.getByText(/Retour à la connexion|Retour/).first().click();
    await page.waitForSelector('#faux-bouton-google');
    assert.deepEqual(erreurs,[]);await ctx.close();}

   // 6. Google ne se charge jamais (bloqueur) : message clair, le formulaire email reste utilisable.
   {const {page,ctx}=await ouvrir({clientId:ID});page.setDefaultTimeout(15000);
    await page.waitForSelector("text=Google n'a pas pu se charger",{timeout:14000});
    await page.getByPlaceholder('votre@email.com').fill('a@b.co');
    assert.equal(await page.getByPlaceholder('votre@email.com').inputValue(),'a@b.co');
    await ctx.close();}
   resultats.push(nom+' : ok');
  }finally{await browser.close();}
 }
}finally{server.close();rmSync(dir,{recursive:true,force:true});}
console.log(resultats.join('\n'));
