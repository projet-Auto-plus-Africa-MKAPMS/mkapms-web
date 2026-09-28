import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, GitBranch, Mic, MicOff, Send, ShieldAlert } from "lucide-react";
import { trpc } from "../../../lib/trpc";
import { speechRecognitionConstructor, startDictation } from "../../../lib/speech";

export function AgentDeveloppeur({ initialInstruction = "", onConsumed }: { initialInstruction?: string; onConsumed?: () => void }) {
  const [instruction, setInstruction] = useState(initialInstruction);
  const [message, setMessage] = useState("");
  const [ecoute, setEcoute] = useState(false);
  const dictation = useRef<{ stop: () => void } | null>(null);
  const capacites = trpc.commandCenter.capacites.useQuery(undefined, { refetchOnWindowFocus: false });
  const dossiers = trpc.commandCenter.dossiers.useQuery(undefined, { refetchOnWindowFocus: false });
  const ouvrir = trpc.commandCenter.ouvrirDossier.useMutation({
    onSuccess: () => { setMessage("Ordre transmis à l’agent développeur et enregistré dans un dossier traçable."); setInstruction(""); void dossiers.refetch(); onConsumed?.(); },
    onError: e => setMessage(`Échec : ${e.message}`),
  });

  useEffect(() => { if (initialInstruction) setInstruction(initialInstruction); }, [initialInstruction]);
  useEffect(() => () => dictation.current?.stop(), []);

  function toggleVoice() {
    if (ecoute) { dictation.current?.stop(); dictation.current = null; setEcoute(false); return; }
    const control = startDictation("fr-FR", {
      onText: text => setInstruction(current => current ? `${current} ${text}` : text),
      onError: text => { setMessage(text); setEcoute(false); },
      onEnd: () => { dictation.current = null; setEcoute(false); },
    });
    if (!control) { setMessage("La reconnaissance vocale n’est pas disponible sur ce navigateur. L’ordre écrit reste disponible."); return; }
    dictation.current = control; setEcoute(true);
  }

  function submit() {
    const besoin = instruction.trim();
    if (besoin.length < 10 || ouvrir.isPending) return;
    ouvrir.mutate({ besoin });
  }

  return <section className="alhud-dev-agent" aria-label="Agent développeur">
    <header>
      <span className="alhud-dev-icon"><Bot/></span>
      <div><h2>Agent développeur</h2><p>Travail réel · dossiers tracés · pipeline protégé</p></div>
    </header>
    <div className="alhud-dev-state">
      {capacites.isLoading ? <span>Vérification des capacités…</span> :
       capacites.data?.generationCode ? <span className="ok"><CheckCircle2/> Génération de code disponible</span> :
       <span className="warn"><ShieldAlert/> Génération de code non confirmée : l’agent s’arrêtera au plan si nécessaire</span>}
    </div>
    <div className="alhud-dev-composer">
      <textarea value={instruction} onChange={e=>setInstruction(e.target.value)} rows={5} maxLength={4000}
        placeholder="Donne directement l’ordre de travail à l’agent développeur…" />
      <div className="alhud-dev-actions">
        <button type="button" onClick={toggleVoice}>{ecoute ? <MicOff/> : <Mic/>}<span>{ecoute ? "Arrêter" : "Dicter"}</span></button>
        <button type="button" className="primary" disabled={instruction.trim().length < 10 || ouvrir.isPending} onClick={submit}><Send/><span>{ouvrir.isPending ? "Transmission…" : "Donner l’ordre"}</span></button>
      </div>
    </div>
    {message ? <p role="status" className="alhud-dev-message">{message}</p> : null}
    <div className="alhud-dev-history">
      <h3><GitBranch/> Travaux récents</h3>
      {dossiers.isLoading ? <p>Chargement…</p> : null}
      {(dossiers.data ?? []).slice(0,8).map(d => <article key={d.id}><strong>#{d.id} · {d.status}</strong><p>{d.need}</p></article>)}
      {!dossiers.isLoading && (dossiers.data ?? []).length === 0 ? <p>Aucun dossier développeur enregistré.</p> : null}
    </div>
  </section>;
}
