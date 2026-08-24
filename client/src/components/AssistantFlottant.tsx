/**
 * MKA.P-MS Intelligences — présence sur toutes les pages.
 *
 * Un moteur qui n'est accessible que depuis une page n'assiste personne : ce
 * panneau rend l'assistant joignable partout où le visiteur se trouve, avec le
 * même encadrement que la page dédiée (domaines ouverts par le PDG, refus motivé
 * plutôt qu'une réponse inventée).
 *
 * Il ne s'affiche pas quand aucun domaine n'est ouvert au public, ni sur les
 * écrans de direction : ceux-ci ont leur propre côté « direction ».
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, Mic, MicOff, Send, Sparkles, X } from "lucide-react";
import { trpc } from "../lib/trpc";
import { speechRecognitionConstructor, startDictation } from "../lib/speech";

interface Bulle {
  role: "moi" | "assistant";
  texte: string;
  ok: boolean;
  motif: string;
}

const ECRANS_DIRECTION = ["/admin", "/superadmin", "/intelligences", "/comptabilite"];

export default function AssistantFlottant() {
  const { pathname } = useLocation();
  const [ouvert, setOuvert] = useState(false);
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [fil, setFil] = useState<Bulle[]>([]);
  const [domaine, setDomaine] = useState("automobile");
  const [dictee, setDictee] = useState(false);
  const [erreurMicro, setErreurMicro] = useState("");
  const dicteeRef = useRef<{ stop: () => void } | null>(null);

  const domaines = trpc.intelligences.domainesPublics.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const ouverts = domaines.data ?? [];
  const choisi = ouverts.find((d) => d.code === domaine) ?? ouverts[0] ?? null;

  useEffect(() => {
    if (ouverts.length > 0 && !ouverts.some((d) => d.code === domaine)) {
      setDomaine(ouverts[0].code);
    }
  }, [ouverts, domaine]);

  useEffect(() => () => dicteeRef.current?.stop(), []);

  const assistant = trpc.intelligences.assistant.useMutation({
    onSuccess: (r) => {
      setSessionId(r.sessionId);
      setFil((f) => [...f, { role: "assistant", texte: r.reponse, ok: r.ok, motif: r.motif }]);
    },
    onError: (e) =>
      setFil((f) => [...f, { role: "assistant", texte: "", ok: false, motif: e.message }]),
  });

  const masque = ECRANS_DIRECTION.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (masque || ouverts.length === 0) return null;

  function envoyer() {
    const q = question.trim();
    if (q.length < 2 || assistant.isPending) return;
    setFil((f) => [...f, { role: "moi", texte: q, ok: true, motif: "" }]);
    setQuestion("");
    assistant.mutate({ question: q, domaine: choisi?.code ?? domaine, sessionId, langue: "fr" });
  }

  function basculerDictee() {
    if (dictee) {
      dicteeRef.current?.stop();
      return;
    }
    setErreurMicro("");
    if (!speechRecognitionConstructor()) {
      setErreurMicro("Ce navigateur ne sait pas dicter : écrivez votre question.");
      return;
    }
    const session = startDictation("fr-FR", {
      onText: (texte) => setQuestion(texte),
      onError: (message) => setErreurMicro(message),
      onEnd: () => {
        setDictee(false);
        dicteeRef.current = null;
      },
    });
    if (!session) {
      setErreurMicro("Dictée indisponible sur cet appareil.");
      return;
    }
    dicteeRef.current = session;
    setDictee(true);
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Ouvrir MKA.P-MS Intelligences"
        className="fixed bottom-[76px] right-3 z-50 inline-flex items-center gap-2 rounded-full bg-[#111] px-4 py-3 text-[12px] font-bold text-[#D4AF37] shadow-lg lg:bottom-5"
      >
        <Sparkles className="h-4 w-4" /> Intelligences
      </button>
    );
  }

  return (
    <div className="fixed bottom-[76px] right-3 z-50 flex max-h-[70vh] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl lg:bottom-5">
      <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[12px] font-black text-[#111]">
          <Sparkles className="h-4 w-4 text-[#8B7500]" /> MKA.P-MS Intelligences
        </p>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          aria-label="Fermer l'assistant"
          className="grid h-7 w-7 place-items-center rounded-lg text-black/50 hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-black/5 px-3 py-2">
        {ouverts.map((d) => (
          <button
            key={d.code}
            type="button"
            onClick={() => setDomaine(d.code)}
            className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
              (choisi?.code ?? domaine) === d.code
                ? "border-[#8B7500] bg-[#FFFBEA] text-[#8B7500]"
                : "border-black/10 text-black/55"
            }`}
          >
            {d.libelle}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-auto px-3 py-2">
        {choisi ? (
          <p className="text-[11px] text-black/50">
            {choisi.effet} <b className="text-black/60">Limite :</b> {choisi.limite}
          </p>
        ) : null}
        {fil.map((b, i) => (
          <div
            key={i}
            className={`rounded-xl border p-2 text-[12px] ${
              b.role === "moi"
                ? "border-black/5 bg-[#FAFAFA]"
                : b.ok
                  ? "border-[#8B7500]/20 bg-[#FFFBEA]"
                  : "border-red-200 bg-red-50/40"
            }`}
          >
            {b.ok ? (
              <p className="whitespace-pre-wrap text-[#111]">{b.texte}</p>
            ) : (
              <p className="flex items-start gap-1.5 text-red-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Aucune réponse — {b.motif || "motif non communiqué"}.</span>
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-black/5 px-3 py-2">
        <div className="flex items-end gap-1.5">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder={choisi ? `Votre question — ${choisi.libelle.toLowerCase()}…` : "Votre question…"}
            className="flex-1 rounded-xl border border-black/10 p-2 text-[12px] outline-none focus:border-[#8B7500]"
          />
          <button
            type="button"
            onClick={basculerDictee}
            aria-label={dictee ? "Arrêter la dictée" : "Dicter la question"}
            className={`grid h-9 w-9 place-items-center rounded-xl border ${
              dictee ? "border-red-300 bg-red-50 text-red-700" : "border-black/10 text-black/60"
            }`}
          >
            {dictee ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={envoyer}
            disabled={assistant.isPending || question.trim().length < 2}
            aria-label="Envoyer la question"
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#111] text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {erreurMicro && <p className="mt-1 text-[11px] font-bold text-red-600">{erreurMicro}</p>}
        <Link
          to="/intelligences"
          onClick={() => setOuvert(false)}
          className="mt-1 inline-block text-[11px] font-bold text-[#8B7500] hover:underline"
        >
          Ouvrir l'assistant en plein écran
        </Link>
      </div>
    </div>
  );
}
