from pathlib import Path
r=Path('.')
def once(s,a,b):
 if s.count(a)!=1: raise RuntimeError('Source changed or ambiguous anchor: '+a[:100])
 return s.replace(a,b,1)
p=r/'client/src/pages/intelligence/modules/Conversation.tsx';s=p.read_text()
if 'alhud-conversation-workspace' in s:
 print('Recovery already applied; verify current commit.')
 raise SystemExit(0)
s=once(s,'import { useEffect, useRef, useState } from "react";','import { useEffect, useRef, useState, type ReactNode } from "react";\nimport "../workspace.css";')
s=once(s,'export function Conversation() {','''export function Conversation({ navigation, active = true, onActivate, children, searchQuery = "" }: {
  navigation?: ReactNode; active?: boolean; onActivate?: () => void; children?: ReactNode; searchQuery?: string;
} = {}) {''')
s=once(s,'  const zoneSaisie = useRef<HTMLTextAreaElement>(null);','''  const zoneSaisie = useRef<HTMLTextAreaElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const sendLock = useRef(false);
  const sent = useRef<{ key: string; text: string } | null>(null);
  const drafts = useRef(new Map<string, string>());
  const [notice, setNotice] = useState("");
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; drafts.current.clear(); sent.current = null; };
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const changed = () => { setDesktop(media.matches); if (media.matches) setPanneauOuvert(false); };
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    const dialog = drawer.current;
    if (!dialog) return;
    if (panneauOuvert && !desktop && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    } else if ((!panneauOuvert || desktop) && dialog.open) dialog.close();
  }, [panneauOuvert, desktop]);
  function saveDraft() { drafts.current.set(String(sessionId ?? "new"), question); }
  const normalise = (value: string) => value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLocaleLowerCase();''')
s=once(s,'    if (!sessionId || !filServeur.data) return;','    if (!sessionId || !filServeur.data || filServeur.isFetching || filServeur.isError) return;')
s=once(s,'    sessionChargee.current = sessionId;','''    sessionChargee.current = sessionId;
    setDerniereQuestion([...filServeur.data].reverse().find(m => m.role === "utilisateur")?.contenu ?? "");''')
s=once(s,'  }, [sessionId, filServeur.data]);','  }, [sessionId, filServeur.data, filServeur.isFetching, filServeur.isError]);')
s=once(s,'    finDuFil.current?.scrollIntoView({ behavior: "smooth" });','''    const scroller = finDuFil.current?.parentElement;
    if (active && scroller) scroller.scrollTop = scroller.scrollHeight;''')
s=once(s,'  }, [fil]);','  }, [fil, active]);')
s=once(s,'  const demander = trpc.intelligences.demander.useMutation({\n    onSuccess: (r) => {\n      setSessionId(r.sessionId);','''  const demander = trpc.intelligences.demander.useMutation({
    onMutate: () => sent.current,
    onSuccess: (r, _variables, submitted) => {
      if (!mounted.current || !submitted || sent.current !== submitted) return;
      if (drafts.current.get(submitted.key) === submitted.text) drafts.current.delete(submitted.key);
      setNotice("");
      setSessionId(r.sessionId);''')
s=once(s,'    onError: () =>\n      setFil((f) => [','''    onError: (_error, _variables, submitted) => {
      if (!mounted.current || !submitted || sent.current !== submitted) return;
      drafts.current.set(submitted.key, submitted.text);
      setQuestion(current => current || submitted.text);
      setNotice("La demande n’a pas abouti. Votre texte est conservé ; vérifiez l’historique avant un nouvel envoi.");
      setFil((f) => [''')
s=once(s,'      ]),\n  });','''      ]);
    },
    onSettled: (_result, _error, _variables, submitted) => { if (sent.current === submitted) { sendLock.current = false; sent.current = null; } },
  });''')
s=once(s,'      setRenommageId(null);\n      void utils.intelligences.conversations.invalidate();','''      if (!mounted.current) return;
      setRenommageId(null);
      void utils.intelligences.conversations.invalidate();''')
s=once(s,'    onSuccess: (_r, variables) => {\n      if (sessionId === variables.sessionId) nouvelleConversation();','''    onSuccess: (_r, variables) => {
      if (!mounted.current) return;
      drafts.current.delete(String(variables.sessionId));
      if (sessionId === variables.sessionId) {
        setSessionId(null); sessionChargee.current = null; setFil([]); setDerniereQuestion("");
        setQuestion(drafts.current.get("new") ?? ""); setNotice("");
      }''')
s=once(s,'  function nouvelleConversation() {\n    setSessionId(null);','''  const historyUnavailable = !!sessionId && (filServeur.isFetching || filServeur.isError || sessionChargee.current !== sessionId);
  const busy = demander.isPending || supprimer.isPending || sendLock.current;
  function nouvelleConversation() {
    if (busy) return;
    saveDraft();
    setQuestion(drafts.current.get("new") ?? "");
    setDerniereQuestion(""); setNotice(""); onActivate?.();
    setSessionId(null);''')
s=once(s,'  function ouvrirConversation(id: number) {\n    setSessionId(id);','''  function ouvrirConversation(id: number) {
    if (busy) return;
    saveDraft();
    setQuestion(drafts.current.get(String(id)) ?? "");
    if (sessionId !== id) { sessionChargee.current = null; setFil([]); setDerniereQuestion(""); }
    setNotice(""); onActivate?.();
    setSessionId(id);''')
s=once(s,'    if (q.length < 2 || demander.isPending) return;','''    if (q.length < 2 || busy || historyUnavailable || !active || !mounted.current) return;
    sendLock.current = true;
    const key = String(sessionId ?? "new");
    sent.current = { key, text: q };
    drafts.current.set(key, q);
    setNotice("");''')
s=once(s,'    if (!derniereQuestion || demander.isPending) return;','    if (!derniereQuestion || busy || historyUnavailable) return;')
s=once(s,'  function reprendre(texte: string) {\n    setQuestion(texte);','''  function reprendre(texte: string) {
    if (busy) return;
    setQuestion(texte);''')
s=once(s,'      setCopieId(id);','      if (!mounted.current) return;\n      setCopieId(id);\n      setNotice("Réponse copiée.");')
s=once(s,'      // Presse-papiers indisponible (contexte non sécurisé, permission refusée) : aucune fausse confirmation.','      if (mounted.current) setNotice("Copie indisponible. Vous pouvez sélectionner le texte.");')
s=once(s,'    if (!window.confirm("Supprimer définitivement cette conversation et ses messages ?")) return;','    if (busy || !window.confirm("Supprimer définitivement cette conversation et ses messages ?")) return;')
s=once(s,'{(conversations.data ?? []).map((c) => (','{(conversations.data ?? []).filter(c => normalise(c.titre || "Sans titre").includes(normalise(searchQuery))).map((c) => (')
s=once(s,'        <div className="flex-1 space-y-1 overflow-y-auto">','''        <div className="flex-1 space-y-1 overflow-y-auto">
          <h2 className="px-2 py-2 text-xs font-bold">Conversations</h2>
          {conversations.isLoading ? <p role="status">Chargement de l’historique…</p> : null}
          {conversations.isError ? <div role="alert">Historique indisponible. <button type="button" onClick={() => void conversations.refetch()}>Réessayer</button></div> : null}
          {renommer.isError || supprimer.isError ? <p role="alert">L’action n’a pas abouti. L’historique n’a pas été modifié ici.</p> : null}''')
s=s.replace('className="hidden shrink-0 p-1 text-black/40 hover:text-black/70 group-hover:block"','className="alhud-history-action shrink-0 p-2 text-black/60 hover:text-black"')
s=s.replace('className="hidden shrink-0 p-1 text-black/40 hover:text-red-600 group-hover:block"','className="alhud-history-action shrink-0 p-2 text-black/60 hover:text-red-600"')
s=once(s,'className="mt-1 hidden justify-end gap-2 group-hover:flex"','className="mt-2 flex justify-end gap-3"')
s=once(s,'if (e.key === "Enter" && !e.shiftKey) {','if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {')
s=once(s,'              value={question}\n              onChange={(e) => setQuestion(e.target.value)}','              value={question}\n              disabled={busy}\n              aria-label="Votre message"\n              onChange={(e) => { setQuestion(e.target.value); drafts.current.set(String(sessionId ?? "new"), e.target.value); }}')
s=once(s,'disabled={demander.isPending || question.trim().length < 2}','disabled={busy || historyUnavailable || question.trim().length < 2}\n              aria-label="Envoyer le message"')
s=once(s,'            {derniereQuestion && !demander.isPending && (','            {derniereQuestion && !busy && !historyUnavailable && (')
a=s.index('      <aside\n');b=s.index('      </aside>',a)
inside_start=s.index('      >',a)+len('      >');inside=s[inside_start:b]
s=s[:a]+'''      {desktop ? <aside className="alhud-conversation-rail" aria-label="Conversations et outils">{sidebarContent}</aside> :
        <dialog ref={drawer} className="alhud-drawer" aria-label="Conversations et outils" onCancel={e => { e.preventDefault(); setPanneauOuvert(false); }} onClose={() => { setPanneauOuvert(false); menu.current?.focus(); }} onClick={e => {
          if (e.target === e.currentTarget) { const bounds = e.currentTarget.getBoundingClientRect();
            if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) setPanneauOuvert(false);
          }
        }}><button type="button" className="alhud-icon-control" onClick={() => setPanneauOuvert(false)}>Fermer le panneau</button>{sidebarContent}</dialog>}
''' +s[b+len('      </aside>'):]
s=once(s,'  return (\n    <div className="flex h-[calc(100vh-160px)] min-h-[420px] flex-col gap-3">','''  const sidebarContent = <><div onClick={e => { if ((e.target as HTMLElement).closest("button")) setPanneauOuvert(false); }}>{navigation}</div>'''+inside+'''</>;
  return (
    <div className="alhud-conversation-workspace flex h-[calc(100dvh-160px)] min-h-[420px] flex-col gap-3">''')
s=once(s,'      <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-black/10">','      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-black/10">')
s=once(s,'            onClick={() => setPanneauOuvert((v) => !v)}','''            ref={menu} aria-haspopup="dialog" aria-expanded={panneauOuvert} aria-label="Conversations et outils"
            onClick={() => setPanneauOuvert((v) => !v)}''')
s=once(s,'        <div className="flex-1 space-y-3 overflow-y-auto p-4">','''        {!active ? <section className="alhud-active-tool flex-1 overflow-auto p-4" aria-label="Outil sélectionné">{children}</section> : null}
        <div hidden={!active} className="alhud-live-conversation flex min-h-0 flex-1 flex-col">
        {sessionId && filServeur.isFetching ? <p role="status" className="p-3 text-sm">Chargement de la conversation…</p> : null}
        {sessionId && filServeur.isError ? <div role="alert" className="p-3 text-sm">Cette conversation n’a pas pu être chargée. L’envoi reste bloqué pour préserver son contexte. <button type="button" onClick={() => void filServeur.refetch()}>Réessayer</button></div> : null}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-label="Conversation" aria-live="polite" aria-busy={demander.isPending || (!!sessionId && filServeur.isFetching)}>''')
s=once(s,'          <p className="mt-1 text-[10px] text-black/30">','          <p role="status" className="text-xs text-black/60">{notice}</p>\n          <p className="mt-1 text-[10px] text-black/50">')
s=once(s,'        </div>\n      </div>\n      </div>\n    </div>','        </div>\n        </div>\n      </div>\n      </div>\n    </div>')
s=s.replace('onClick={nouvelleConversation}','onClick={nouvelleConversation} disabled={busy}')
s=s.replace('onClick={() => ouvrirConversation(c.id)}','onClick={() => ouvrirConversation(c.id)}\n                    disabled={busy}')
s=s.replace('onClick={() => demanderSuppression(c.id)}','onClick={() => demanderSuppression(c.id)}\n                    disabled={busy}')
p.write_text(s)
p=r/'client/src/pages/intelligence/index.tsx';s=p.read_text()
s=once(s,'import { useEffect, useMemo, useRef, useState } from "react";','import { useMemo, useState } from "react";')
a=s.index('  const [drawerOpen,');b=s.index('\n\n  // Clé développeur',a);s=s[:a]+s[b:]
a=s.index('        <aside className="hidden w-64');b=s.index('</aside>',a)
content=s[s.index('<div className="alhud-app-sidebar">',a):b].replace('setModule(item.cle);setDrawerOpen(false);','setModule(item.cle);')
content=content.replace('aria-label="Rechercher un outil"','aria-label="Rechercher un outil ou une conversation"').replace('placeholder="Rechercher un outil…"','placeholder="Rechercher…"')
content=content.replace('item.label.toLocaleLowerCase().includes(moduleSearch.toLocaleLowerCase())','normalise(item.label).includes(normalise(moduleSearch))')
s=once(s,'  return (\n    <div className="min-h-screen bg-white">','''  const normalise = (text: string) => text.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLocaleLowerCase();
  const moduleNavigation = '''+content+''';
  return (
    <div className="min-h-screen bg-white">''')
a=s.index('      <div className="flex flex-col gap-4 p-4 md:flex-row">');b=s.index('      </div>\n    </div>\n  );',a)
s=s[:a]+'''      <main className="min-w-0 p-2 md:p-4">
        <Conversation key={String(user?.id ?? "anonymous")} navigation={moduleNavigation} active={module === "conversation"} onActivate={() => setModule("conversation")} searchQuery={moduleSearch}>
          {module !== "conversation" ? <Actif /> : null}
        </Conversation>
      </main>
'''+s[b+len('      </div>\n'):]
p.write_text(s)
p=r/'client/src/pages/CentreIntelligences.tsx';s=p.read_text()
s=once(s,'  const historyLock = useRef(false);','''  const historyLock = useRef(false);
  const sendLock = useRef(false);
  const liveWorkspace = useRef(true);
  const workspaceEpoch = useRef(0);
  const workspaceOwner = useRef("");
  workspaceOwner.current = `${user?.id ?? "anonymous"}:${!!estPdg}`;
  const sentRequest = useRef<{ key: string; text: string; images: string[]; epoch: number; owner: string } | null>(null);
  const isCurrentWorkspace = (epoch: number, owner: string) => liveWorkspace.current && epoch === workspaceEpoch.current && owner === workspaceOwner.current;
  useEffect(() => {
    liveWorkspace.current = true;
    return () => { liveWorkspace.current = false; workspaceEpoch.current++; sentRequest.current = null; };
  }, []);''')
s=s.replace('if (demander.isPending || historyLock.current || ecoute) return;','if (sendLock.current || demander.isPending || historyLock.current || ecoute || !estPdg) return;')
s=once(s,'    historyLock.current = true;\n    setHistoryLoading(true);','''    historyLock.current = true;
    const epoch = workspaceEpoch.current, owner = workspaceOwner.current;
    setHistoryLoading(true);''')
s=once(s,'      const rows = await workspaceUtils.intelligences.fil.fetch({ sessionId: id });','''      const rows = await workspaceUtils.intelligences.fil.fetch({ sessionId: id });
      if (!isCurrentWorkspace(epoch, owner)) return;''')
s=once(s,'    } catch {\n      setMessage("La conversation n’a pas pu être chargée. Votre échange et votre brouillon sont conservés.");\n    } finally {\n      historyLock.current = false;\n      setHistoryLoading(false);','''    } catch {
      if (isCurrentWorkspace(epoch, owner)) setMessage("La conversation n’a pas pu être chargée. Votre échange et votre brouillon sont conservés.");
    } finally {
      if (isCurrentWorkspace(epoch, owner)) { historyLock.current = false; setHistoryLoading(false); }''')
s=once(s,'''  useEffect(() => {
    if (!estPdg) {
      conversationDrafts.current.clear();
      setQuestion(""); setPieces([]); setFil([]); setSessionId(null);
    }
  }, [estPdg]);''','''  useEffect(() => {
    workspaceEpoch.current++;
    historyLock.current = false; sendLock.current = false; sentRequest.current = null;
    conversationDrafts.current.clear();
    setQuestion(""); setPieces([]); setFil([]); setSessionId(null); setHistoryLoading(false);
  }, [user?.id, estPdg]);''')
s=once(s,'  const demander = trpc.intelligences.demander.useMutation({\n    onSuccess: (r) => {\n      setSessionId(r.sessionId);\n      conversationDrafts.current.delete("new");','''  const demander = trpc.intelligences.demander.useMutation({
    onMutate: () => sentRequest.current,
    onSuccess: (r, _variables, sent) => {
      if (!sent || !isCurrentWorkspace(sent.epoch, sent.owner)) return;
      setSessionId(r.sessionId);
      conversationDrafts.current.delete(sent.key);''')
s=once(s,'    onError: (e) =>\n      setFil((f) => [','''    onError: (e, _variables, sent) => {
      if (!sent || !isCurrentWorkspace(sent.epoch, sent.owner)) return;
      conversationDrafts.current.set(sent.key, { text: sent.text, images: sent.images });
      setQuestion(current => current || sent.text);
      setPieces(current => current.length ? current : sent.images);
      setFil((f) => [''')
s=once(s,'      ]),\n  });','''      ]);
    },
    onSettled: (_result, _error, _variables, sent) => {
      if (sentRequest.current === sent) { sendLock.current = false; sentRequest.current = null; }
    },
  });''')
s=once(s,'if ((q.length < 2 && pieces.length === 0) || demander.isPending || historyLock.current) return;','if ((q.length < 2 && pieces.length === 0) || sendLock.current || demander.isPending || historyLock.current || !estPdg) return;')
s=once(s,'    const texteEnvoye = q.length >= 2 ? q : "Analyse la ou les pièce(s) jointe(s).";','''    const texteEnvoye = q.length >= 2 ? q : "Analyse la ou les pièce(s) jointe(s).";
    sendLock.current = true;
    sentRequest.current = { key: String(sessionId ?? "new"), text: q, images: [...pieces], epoch: workspaceEpoch.current, owner: workspaceOwner.current };''')
s=once(s,'placeholder="Écris ta demande…"','placeholder="Écris ta demande…"\n                    disabled={demander.isPending || historyLoading}')
s=once(s,'disabled={pieces.length >= 4}','disabled={demander.isPending || historyLoading || pieces.length >= 4}')
s=once(s,'disabled={demander.isPending || (question.trim().length < 2 && pieces.length === 0)}','disabled={demander.isPending || historyLoading || (question.trim().length < 2 && pieces.length === 0)}')
p.write_text(s)
p=r/'client/src/pages/intelligence/WorkspaceRail.tsx';s=p.read_text()
s=once(s,'<dialog ref={drawer} className="alhud-drawer"','<dialog ref={drawer} onClose={() => returnFocus.current?.focus()} className="alhud-drawer"')
p.write_text(s)
p=r/'client/src/pages/intelligence/workspace.css'
p.write_text(p.read_text()+'''
.alhud-conversation-workspace{max-width:1600px;margin:0 auto;min-width:0;color:#20242b}
.alhud-conversation-workspace [hidden]{display:none!important}
.alhud-conversation-rail{display:flex;flex-direction:column;width:290px;flex-shrink:0;min-height:0;border:1px solid #ddd;border-radius:14px;padding:12px;background:#f7f7f5;overflow:auto}
.alhud-conversation-workspace .alhud-app-modules{max-height:34dvh}
.alhud-conversation-workspace textarea{font-size:16px;min-width:0}
.alhud-conversation-workspace :is(button,a,input,textarea):focus-visible{outline:3px solid #a78627;outline-offset:2px}
.alhud-conversation-workspace :is(button,a){min-height:32px}
.alhud-conversation-workspace .alhud-drawer{gap:8px;overflow:auto}
.alhud-live-conversation [role=log]{overflow-wrap:anywhere}
.alhud-active-tool{min-height:0;min-width:0;overflow-wrap:anywhere}
@media(max-width:767px){.alhud-conversation-workspace{height:calc(100dvh - 160px);min-height:380px}.alhud-conversation-workspace .alhud-history-action{min-height:40px;min-width:32px}}
@media(prefers-reduced-motion:reduce){.alhud-conversation-workspace *{scroll-behavior:auto!important}}
''')
Path('.github/workflows/ai-workspace-source-audit.yml').unlink(missing_ok=True)
print('MAIN recovery applied, retaining every module and the existing engines.')
