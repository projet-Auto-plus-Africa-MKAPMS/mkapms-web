from pathlib import Path

def once(text, before, after):
    if text.count(before) != 1:
        raise RuntimeError('Source changed or ambiguous anchor: ' + before[:100])
    return text.replace(before, after, 1)

component = Path('client/src/pages/intelligence/modules/Conversation.tsx')
s = component.read_text()
if 'consumesDraft: boolean' not in s:
    s = once(s, 'const sent = useRef<{ key: string; text: string } | null>(null);', 'const sent = useRef<{ key: string; text: string; consumesDraft: boolean } | null>(null);')
    s = once(s, 'if (drafts.current.get(submitted.key) === submitted.text) drafts.current.delete(submitted.key);', 'if (submitted.consumesDraft && drafts.current.get(submitted.key) === submitted.text) drafts.current.delete(submitted.key);\n      if (!submitted.consumesDraft && submitted.key === "new") {\n        drafts.current.set(String(r.sessionId), drafts.current.get("new") ?? "");\n        drafts.current.delete("new");\n      }')
    s = once(s, '      drafts.current.set(submitted.key, submitted.text);\n      setQuestion(current => current || submitted.text);', '      if (submitted.consumesDraft) {\n        drafts.current.set(submitted.key, submitted.text);\n        setQuestion(current => current || submitted.text);\n      }')
    s = once(s, '  function envoyer(texte?: string) {', '  function envoyer(texte?: string, mode: "composer" | "regenerate" = "composer") {')
    s = once(s, '    sent.current = { key, text: q };\n    drafts.current.set(key, q);', '    const consumesDraft = mode === "composer";\n    sent.current = { key, text: q, consumesDraft };\n    // Regenerating an earlier answer never consumes the text being composed.\n    if (consumesDraft) drafts.current.set(key, q);\n    else saveDraft();')
    s = once(s, '    setDerniereQuestion(q);\n    setQuestion("");', '    setDerniereQuestion(q);\n    if (consumesDraft) setQuestion("");')
    s = once(s, '    envoyer(derniereQuestion);', '    envoyer(derniereQuestion, "regenerate");')

tests = Path('scripts/test-alhud-browser.mjs')
t = tests.read_text()
if 'regenerationKeepsDraft' not in t:
    t = once(t, 'setPending(true);fixture.calls++;', 'setPending(true);fixture.calls++;fixture.lastQuestion=input.question;')
    anchor = "     await page.goto(url);await input.fill('Demande privée avant déconnexion');"
    scenarios = """     if(surface==='application'){
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
"""
    t = once(t, anchor, scenarios + anchor)
    t = once(t, 'lateResponseIsolated:true,overflow:false', 'lateResponseIsolated:true,regenerationKeepsDraft:surface===\'application\',overflow:false')

# Verify every expected anchor before touching either file.
component.write_text(s)
tests.write_text(t)
print('Regeneration draft isolation and all-layout regression scenarios applied.')
