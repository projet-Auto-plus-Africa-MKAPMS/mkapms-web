import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
// PLAYWRIGHT_ENTRY : chemin d'un Playwright déjà installé ailleurs (environnements sans @playwright/test).
const {chromium}=await import(process.env.PLAYWRIGHT_ENTRY||'@playwright/test');

// Écran de conversation vocale directe (mêmes classes, vrai CSS de workspace.css) : tout doit rester DANS le cadre de l'écran,
// quelle que soit la taille du téléphone, l'état (écoute / réflexion / réponse), le sommet de l'animation et la longueur du texte.
const css=readFileSync('client/src/pages/intelligence/workspace.css','utf8');
const longTexte='Conversation vocale directe · prête à écouter · 14 événement(s) reçu(s) : session.created, session.updated, input_audio_buffer.speech_started, input_audio_buffer.speech_stopped, response.output_audio_transcript.delta, output_audio_buffer.started';
const page=(etat)=>`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0}${css}</style></head><body>
<section class="alhud-voice-screen" role="dialog"><div class="alhud-voice-screen-top"><button aria-label="Fermer">×</button><button aria-label="Réglages">⚙</button></div>
<div class="alhud-voice-stage"><div class="alhud-voice-orb ${etat}"><span></span><span></span></div><p class="alhud-voice-state">AL-HUDHUD·M vous répond…</p><p class="alhud-voice-caption">${longTexte}</p></div>
<div class="alhud-voice-controls"><button aria-label="Couper le micro">🎤</button><button class="end" aria-label="Terminer">×</button></div></section></body></html>`;
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page(new URL(req.url,'http://x').searchParams.get('etat')||'listening'));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
const tailles=[['iPhone SE',320,568],['petit Android',360,640],['iPhone 14',390,844],['iPhone paysage',844,390],['tablette',820,1180]];
const dedans=(r,c,marge=0)=>r.x>=c.x-marge&&r.y>=c.y-marge&&r.x+r.width<=c.x+c.width+marge&&r.y+r.height<=c.y+c.height+marge;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
const lignes=[];
try{
 for(const [nom,w,h] of tailles){
  for(const etat of ['listening','thinking','speaking']){
   const ctx=await browser.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();
   await p.goto(`http://127.0.0.1:${port}/?etat=${etat}`);
   // Sommet de l'animation « respiration » : on fige l'animation à 50 %.
   await p.addStyleTag({content:'.alhud-voice-orb{animation-play-state:paused!important;animation-delay:-100s!important}'});
   const m=await p.evaluate(()=>{
    const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
    const orb=document.querySelector('.alhud-voice-orb');
    const peak=orb.getAnimations()[0];if(peak){const d=peak.effect.getComputedTiming().duration;peak.currentTime=d/2;}
    const apres=r('.alhud-voice-orb');
    const ecran=document.querySelector('.alhud-voice-screen');
    return {screen:r('.alhud-voice-screen'),stage:r('.alhud-voice-stage'),orb:apres,end:r('.alhud-voice-controls button.end'),top:r('.alhud-voice-screen-top button'),caption:r('.alhud-voice-caption'),
     debordeX:ecran.scrollWidth>ecran.clientWidth+1,debordeY:ecran.scrollHeight>ecran.clientHeight+1,docX:document.documentElement.scrollWidth>window.innerWidth,docY:document.documentElement.scrollHeight>window.innerHeight};
   });
   const vue={x:0,y:0,width:w,height:h};
   const ou=`${nom} ${w}x${h} ${etat}`;
   assert.ok(dedans(m.stage,vue),`${ou} : zone centrale hors écran ${JSON.stringify(m.stage)}`);
   assert.ok(dedans(m.orb,vue),`${ou} : le micro dépasse l'écran ${JSON.stringify(m.orb)}`);
   assert.ok(dedans(m.orb,m.stage,1),`${ou} : le micro dépasse sa zone ${JSON.stringify(m.orb)} / ${JSON.stringify(m.stage)}`);
   assert.ok(m.caption.width===0||dedans(m.caption,m.stage,1),`${ou} : texte hors zone`);
   assert.ok(dedans(m.end,vue)&&dedans(m.top,vue),`${ou} : boutons hors écran`);
   assert.equal(m.debordeX||m.debordeY||m.docX||m.docY,false,`${ou} : l'écran déborde ${JSON.stringify({x:m.debordeX,y:m.debordeY,dx:m.docX,dy:m.docY})}`);
   await ctx.close();
  }
  lignes.push(nom+' : ok');
 }
}finally{await browser.close();server.close();}
console.log(lignes.join('\n'));
