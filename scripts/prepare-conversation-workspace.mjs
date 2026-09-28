/* One-shot preparation only. This file is not copied to the product branch. */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { join } from 'node:path';

const read = p => readFileSync(p, 'utf8');
const write = (p,s) => writeFileSync(p,s);
const blob = s => createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
function once(s, before, after) {
  if (s.split(before).length !== 2) throw Error('Patch anchor missing or ambiguous: '+before.slice(0,90));
  return s.replace(before,after);
}
const path = 'client/src/pages/CentreIntelligences.tsx';
let source = read(path);
if (blob(source) !== 'e825a41169cb1320aeaac04c322cb74119c54a5d') throw Error('Centre changed since audit; do not overwrite another agent.');
source = 'import { WorkspaceRail, WorkspaceMenuButton, AssistantBrand } from "./intelligence/WorkspaceRail";\n'+source;
source = once(source, '  const [fil, setFil] = useState<Bulle[]>([]);', `  const [fil, setFil] = useState<Bulle[]>([]);
  const workspaceUtils = trpc.useUtils();
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyLock = useRef(false);
  const conversationDrafts = useRef(new Map<string, { text: string; images: string[] }>());
  const threadRef = useRef<HTMLDivElement>(null);
  useEffect(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }); }, [fil]);
  function saveConversationDraft() {
    conversationDrafts.current.set(String(sessionId ?? "new"), { text: question, images: [...pieces] });
  }
  async function openSavedConversation(id: number) {
    if (demander.isPending || historyLock.current || ecoute) return;
    historyLock.current = true;
    setHistoryLoading(true);
    saveConversationDraft();
    try {
      const rows = await workspaceUtils.intelligences.fil.fetch({ sessionId: id });
      const saved = conversationDrafts.current.get(String(id));
      setSessionId(id);
      setFil(rows.filter(row => row.role === "utilisateur" || row.role === "moteur").map(row => ({
        role: row.role === "utilisateur" ? "moi" : "moteur",
        texte: row.contenu, ok: row.ok, motif: row.motifPublic || "",
        fournisseur: null, modele: null, contexte: row.contexte ?? [],
      })));
      setQuestion(saved?.text ?? "");
      setPieces(saved?.images ?? []);
      setOnglet("echange");
      setMessage(null);
    } catch {
      setMessage("La conversation n’a pas pu être chargée. Votre échange et votre brouillon sont conservés.");
    } finally {
      historyLock.current = false;
      setHistoryLoading(false);
    }
  }
  function startNewConversation() {
    if (demander.isPending || historyLock.current || ecoute) return;
    saveConversationDraft();
    const saved = conversationDrafts.current.get("new");
    setSessionId(null);
    setFil([]);
    setQuestion(saved?.text ?? "");
    setPieces(saved?.images ?? []);
    setOnglet("echange");
    setMessage(null);
  }
  useEffect(() => {
    if (!estPdg) {
      conversationDrafts.current.clear();
      setQuestion(""); setPieces([]); setFil([]); setSessionId(null);
    }
  }, [estPdg]);`);
source = once(source, '      setSessionId(r.sessionId);', '      setSessionId(r.sessionId);\n      conversationDrafts.current.delete("new");\n      void workspaceUtils.intelligences.conversations.invalidate();');
source = once(source, 'if ((q.length < 2 && pieces.length === 0) || demander.isPending) return;', 'if ((q.length < 2 && pieces.length === 0) || demander.isPending || historyLock.current) return;');
source = once(source, '<div className="mx-auto max-w-5xl px-3 py-4">', `<div className="alhud-main-workspace">
      <WorkspaceRail tabs={ONGLETS} groups={GROUPES_MENU} active={onglet} sessionId={sessionId}
        busy={demander.isPending || historyLoading || ecoute} mobileOpen={menuOuvert}
        onClose={() => setMenuOuvert(false)} onChoose={(key) => setOnglet(key as Onglet)}
        onNew={startNewConversation} onConversation={(id) => void openSavedConversation(id)} />
      <div className="alhud-main-content">`);
const navStart = source.indexOf('        <nav className="mt-4 flex items-center gap-2">');
const voiceStart = source.indexOf('          {ttsSupporte ? (', navStart);
if (navStart < 0 || voiceStart < navStart) throw Error('Navigation boundary missing');
source = source.slice(0, navStart) + `        <nav className="mt-4 flex items-center gap-2" aria-label="Conversation et préférences">
          <WorkspaceMenuButton open={menuOuvert} onClick={() => setMenuOuvert(value => !value)} />
          <span className="text-xs font-bold text-black/60">{ONGLETS.find(item => item.cle === onglet)?.label}</span>
` + source.slice(voiceStart);
source = once(source, '<div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">', '<div ref={threadRef} className="alhud-thread space-y-3 pr-1" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text" aria-busy={demander.isPending || historyLoading}>');
source = once(source, '<Sparkles className="h-5 w-5 text-[#8B7500]" /> MKA.P-MS AI', '<AssistantBrand />');
// Close the newly added content wrapper immediately before the original root's closing tag.
const marker = source.indexOf('className="alhud-main-workspace"');
const beforeWrapper = read(path);
const originalAst = ts.createSourceFile(path,beforeWrapper,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const component = originalAst.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'CentreIntelligences');
const returns = component.body.statements.filter(ts.isReturnStatement);
const lastReturn = returns[returns.length-1];
let jsx = lastReturn.expression;
while (ts.isParenthesizedExpression(jsx)) jsx=jsx.expression;
if (!ts.isJsxElement(jsx)) throw Error('Expected original JSX root');
const originalTail = beforeWrapper.slice(jsx.closingElement.getStart(originalAst));
if (!source.endsWith(originalTail)) throw Error('Original component tail changed unexpectedly');
source = source.slice(0,source.length-originalTail.length) + '</div>\n    ' + originalTail;
if (marker < 0) throw Error('Workspace root absent');
write(path,source);

// Public product labels only: preserve identifiers, endpoints, generic IA, MAP and company branding.
const renamed=[];
function renameLiteralLabels(path) {
  const original=read(path);
  const ast=ts.createSourceFile(path,original,ts.ScriptTarget.Latest,true,path.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const edits=[];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node) || node.kind===ts.SyntaxKind.TemplateHead || node.kind===ts.SyntaxKind.TemplateMiddle || node.kind===ts.SyntaxKind.TemplateTail) {
      const start=node.getStart(ast), end=node.getEnd();
      const raw=original.slice(start,end);
      const replacement=raw.replaceAll('MKA.P-MS AI','AL-HUDHUD·M');
      if(raw!==replacement)edits.push({start,end,replacement});
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
  if(edits.length){let next=original;for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.replacement+next.slice(e.end);write(path,next);renamed.push(path);}
}
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const p=join(dir,entry.name);if(entry.isDirectory())walk(p);else if(/\.(tsx|ts)$/.test(p))renameLiteralLabels(p);}}
walk('client/src');
renameLiteralLabels('server/intelligences/identite.ts');
// The dedicated product's appName only; application IDs, routes, shared manifests and MAP stay untouched.
for (const p of ['capacitor.config.ts','mobile/build-apps.mjs']) {
  try {
    const original=read(p);
    const next=original.replace(/(appName\s*:\s*["'])MKA\.P-MS AI(["'])/g,'$1AL-HUDHUD·M$2');
    if(next!==original){write(p,next);renamed.push(p);}
  } catch(e){if(e.code!=='ENOENT')throw e;}
}

// Independent application shell: retain all modules and keep chat mounted while consulting tools.
const app='client/src/pages/intelligence/index.tsx';
let shell=read(app);
shell=once(shell,'import { useMemo, useState } from "react";', 'import { useEffect, useMemo, useRef, useState } from "react";\nimport { AssistantBrand } from "./WorkspaceRail";');
shell=once(shell,'  const [module, setModule] = useState<CleModule>("conversation");',`  const [module, setModule] = useState<CleModule>("conversation");
  const [moduleSearch, setModuleSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const appDrawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog=appDrawer.current;
    if(!dialog)return;
    if(drawerOpen && !dialog.open)dialog.showModal();
    if(!drawerOpen && dialog.open)dialog.close();
  },[drawerOpen]);`);
const navAt=shell.indexOf('        <nav className="flex shrink-0 flex-row gap-1.5');
const navEnd=shell.indexOf('        </nav>',navAt);
if(navAt<0||navEnd<0)throw Error('App navigation boundary missing');
const renderNav=`<div className="alhud-app-sidebar">
            <AssistantBrand />
            <label className="alhud-search"><input type="search" aria-label="Rechercher un outil" value={moduleSearch} onChange={e=>setModuleSearch(e.target.value)} placeholder="Rechercher un outil…" /></label>
            <nav className="alhud-app-modules" aria-label="Outils de l’assistant">
              {MODULES.filter(item=>item.label.toLocaleLowerCase().includes(moduleSearch.toLocaleLowerCase())).map(item=>(
                <button key={item.cle} type="button" aria-current={module===item.cle?'page':undefined} onClick={()=>{setModule(item.cle);setDrawerOpen(false);}} className={module===item.cle?'rounded-xl bg-[#111] px-3 py-2 text-sm font-bold text-white':'rounded-xl px-3 py-2 text-sm text-black/70 hover:bg-black/5'}><item.icone className="mr-2 inline-block h-4 w-4" />{item.label}</button>
              ))}
            </nav>
          </div>`;
shell=shell.slice(0,navAt)+`        <aside className="hidden w-64 shrink-0 md:block">${renderNav}</aside>
        <button className="alhud-menu-button md:!hidden" type="button" aria-haspopup="dialog" aria-expanded={drawerOpen} onClick={()=>setDrawerOpen(true)}>Conversations et outils</button>
        <dialog ref={appDrawer} className="alhud-drawer" aria-label="Outils de l’assistant" onCancel={e=>{e.preventDefault();setDrawerOpen(false);}}><button type="button" className="alhud-icon-control" onClick={()=>setDrawerOpen(false)}>Fermer</button>${renderNav}</dialog>
`+shell.slice(navEnd+'        </nav>'.length);
shell=once(shell,'          <Actif />',`          <div hidden={module !== "conversation"}><Conversation /></div>
          {module !== "conversation" ? <Actif /> : null}`);
write(app,shell);

mkdirSync('docs',{recursive:true});
write('docs/AL-HUDHUD-WORKSPACE-2026-09-28.md',`# AL-HUDHUD·M — MAIN workspace and public identity\n\nScope: additive presentation changes. Existing Centre tabs, persisted conversations, image/voice/transcription, memory, tools, permissions and APIs are preserved. No migrations, provider activation, production secret access or SHOP data transfer.\n\nThe Centre now has a single side rail for its existing groups and the existing direction conversation API. Drafts and attachments are kept in component memory by selected conversation while the Centre remains mounted; they are not written to browser storage. Opening history is guarded during a pending send, dictation or history load.\n\nThe dedicated app retains every module and keeps the conversation mounted when another tool opens. Mobile navigation uses a native dialog.\n\nPublic product name: AL-HUDHUD·M. Generic IA, MKA.P-MS company name, routes, package identifiers, API names, database and MAP are not renamed. Public labels changed by AST string/JSX-text edits:\n\n${renamed.map(p=>'- '+p).join('\n')}\n\nLogo: AWAITING_APPROVED_ASSET. The exact approved file was not available in this task. No substitute artwork, generated logo or arbitrary external image has been added. public/ai-identity.json accepts only the approved local asset; compact-logo rollout remains pending.\n\nValidation: consult the feature commit CI and the preparation workflow report. Do not infer deployed functionality from this document. Unpublished drafts not pushed by other agents cannot be recovered from GitHub. No open PR was found at initial inspection; merged work up to PR474 is preserved.\n`);
write('scripts/test-alhud-workspace.mjs',`import assert from 'node:assert/strict';\nimport {readFileSync} from 'node:fs';\nconst read=p=>readFileSync(p,'utf8');\nconst centre=read('client/src/pages/CentreIntelligences.tsx');\nfor(const tab of ['medias','echange','pilotage','permissions','evaluation','shadow','fonctions','plan','developpeur','missions','autonomie','assistance','capacites','moteurs','connexion','surveillance','support','memoire','commandes','couts','developpement']) assert(centre.includes('"'+tab+'"'),'existing tab missing: '+tab);\nfor(const feature of ['surFichierChoisi','basculerEcoute','choisirVoix','reglerAutonomie','memoireArchiver','WorkspaceRail','historyLock.current','conversationDrafts'])assert(centre.includes(feature),feature);\nconst rail=read('client/src/pages/intelligence/WorkspaceRail.tsx');assert(rail.includes('conversations.useQuery'));assert(rail.includes('showModal'));assert(rail.includes('onCancel'));\nconst identity=JSON.parse(read('public/ai-identity.json'));assert.equal(identity.publicName,'AL-HUDHUD·M');assert.equal(identity.logo,null);assert.equal(identity.assetStatus,'AWAITING_APPROVED_ASSET');\nassert(read('server/intelligences/identite.ts').includes('AL-HUDHUD·M'));\nconsole.log('AL-HUDHUD workspace: 21 retained Centre tabs, existing controls, history integration, exact identity and missing-logo state verified.');\n`);
console.log('Prepared isolated MAIN workspace; no functions or source files deleted.');
