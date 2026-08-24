/**
 * MKA.P-MS Intelligences — côté public : assistant mondial.
 *
 * Automobile, vie quotidienne, travail, et les domaines que le PDG a ouverts.
 * Encadré côté serveur : aucun accès aux moteurs, au code, aux comptes ni aux
 * données internes. Quand aucun fournisseur ne répond, l'écran affiche le motif
 * réel au lieu d'une réponse inventée.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronLeft, Mic, MicOff, MessageCircle, Send, Sparkles } from "lucide-react";
import { trpc } from "../lib/trpc";
import { speechRecognitionConstructor, startDictation } from "../lib/speech";

interface Bulle {
  role: "moi" | "assistant";
  texte: string;
  ok: boolean;
  motif: string;
}

const EXEMPLES = [
  "Quelle différence entre une LOA et un crédit classique ?",
  "Que vérifier avant d'acheter une voiture d'occasion ?",
  "Quel entretien prévoir à 100 000 km sur un diesel ?",
  "Comment préparer ma voiture avant de la mettre en vente ?",
];

export default function AssistantIntelligences() {
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [fil, setFil] = useState<Bulle[]>([]);
  const [domaine, setDomaine] = useState<string>("automobile");
  const [dictee, setDictee] = useState(false);
  const [erreurMicro, setErreurMicro] = useState("");
  const dicteeRef = useRef<{ stop: () => void } | null>(null);

  const presentation = trpc.intelligences.presentation.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

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
      setFil((f) => [
        ...f,
        { role: "assistant", texte: r.reponse, ok: r.ok, motif: r.motif },
      ]);
    },
    onError: (e) =>
      setFil((f) => [...f, { role: "assistant", texte: "", ok: false, motif: e.message }]),
  });

  function envoyer(texte?: string) {
    const q = (texte ?? question).trim();
    if (q.length < 2 || assistant.isPending) return;
    setFil((f) => [...f, { role: "moi", texte: q, ok: true, motif: "" }]);
    setQuestion("");
    assistant.mutate({
      question: q,
      domaine: choisi?.code ?? domaine,
      sessionId,
      langue: "fr",
    });
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

  return (
    <div className="mx-auto max-w-3xl px-3 py-4">
      <Link
        to="/"
        className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-black/60 hover:text-black"
      >
        <ChevronLeft className="h-4 w-4" /> Accueil
      </Link>

      <header className="rounded-2xl border border-black/5 bg-white p-4">
        <h1 className="flex items-center gap-2 text-xl font-black text-[#111]">
          <Sparkles className="h-5 w-5 text-[#8B7500]" />
          {presentation.data?.nom ?? "MKA.P-MS Intelligences"}
        </h1>
        <p className="mt-1 text-sm text-black/60">
          Assistance quotidienne et professionnelle, partout dans le monde. Choisissez le domaine :
          chaque domaine a ses propres règles, écrites sous le choix.
        </p>

        {ouverts.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5">
              {ouverts.map((d) => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => setDomaine(d.code)}
                  className={`rounded-full border px-3 py-1 text-[12px] font-bold ${
                    (choisi?.code ?? domaine) === d.code
                      ? "border-[#8B7500] bg-[#FFFBEA] text-[#8B7500]"
                      : "border-black/10 text-black/60 hover:border-[#8B7500]/40"
                  }`}
                >
                  {d.libelle}
                </button>
              ))}
            </div>
            {choisi && (
              <div className="mt-2 rounded-xl border border-black/5 bg-[#FAFAFA] p-2.5">
                <p className="text-[12px] text-black/70">{choisi.effet}</p>
                <p className="mt-1 text-[11px] font-bold text-black/50">Limite : {choisi.limite}</p>
              </div>
            )}
          </div>
        )}
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {EXEMPLES.map((e) => (
            <li key={e}>
              <button
                type="button"
                onClick={() => envoyer(e)}
                disabled={assistant.isPending}
                className="w-full rounded-xl border border-black/5 bg-[#FAFAFA] px-3 py-2 text-left text-[12px] text-black/70 hover:border-[#8B7500]/40 disabled:opacity-50"
              >
                {e}
              </button>
            </li>
          ))}
        </ul>
      </header>

      <section className="mt-3 rounded-2xl border border-black/5 bg-white p-4">
        {fil.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-black/50">
            <MessageCircle className="h-4 w-4" /> Pose ta question, ou choisis un exemple.
          </p>
        ) : (
          <div className="space-y-3">
            {fil.map((b, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3 text-sm ${
                  b.role === "moi"
                    ? "border-black/5 bg-[#FAFAFA]"
                    : b.ok
                      ? "border-[#8B7500]/20 bg-[#FFFBEA]"
                      : "border-red-200 bg-red-50/40"
                }`}
              >
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-black/40">
                  {b.role === "moi" ? "Vous" : presentation.data?.nom ?? "MKA.P-MS Intelligences"}
                </p>
                {b.ok ? (
                  <p className="whitespace-pre-wrap text-[#111]">{b.texte}</p>
                ) : (
                  <p className="flex items-start gap-2 text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      L'assistant ne peut pas répondre pour le moment. Motif :{" "}
                      {b.motif || "non communiqué"}.
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-end gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder={
              choisi ? `Votre question — ${choisi.libelle.toLowerCase()}…` : "Votre question…"
            }
            className="flex-1 rounded-xl border border-black/10 p-2 text-sm outline-none focus:border-[#8B7500]"
          />
          <button
            type="button"
            onClick={basculerDictee}
            aria-label={dictee ? "Arrêter la dictée" : "Dicter la question"}
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-bold ${
              dictee ? "border-red-300 bg-red-50 text-red-700" : "border-black/10 text-black/60"
            }`}
          >
            {dictee ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => envoyer()}
            disabled={assistant.isPending || question.trim().length < 2}
            className="inline-flex items-center gap-1 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {assistant.isPending ? "…" : "Demander"}
          </button>
        </div>
        {erreurMicro && <p className="mt-2 text-[11px] font-bold text-red-600">{erreurMicro}</p>}
        <p className="mt-2 text-[11px] text-black/40">
          Vos échanges sont conservés pour la sécurité et l'amélioration du service. N'y indiquez
          aucune donnée bancaire ni document personnel.
        </p>
      </section>
    </div>
  );
}
