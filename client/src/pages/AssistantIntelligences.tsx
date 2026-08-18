/**
 * MKA.P-MS Intelligences — côté public : assistant automobile.
 *
 * Encadré côté serveur : aucun accès aux moteurs, au code, aux comptes ni aux
 * données internes. Quand aucun fournisseur ne répond, l'écran affiche le motif
 * réel au lieu d'une réponse inventée.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronLeft, MessageCircle, Send, Sparkles } from "lucide-react";
import { trpc } from "../lib/trpc";

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

  const presentation = trpc.intelligences.presentation.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

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
    assistant.mutate({ question: q, sessionId, langue: "fr" });
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
          Assistant automobile : achat, vente, location, entretien, pièces, démarches. Il explique
          et oriente. Il ne remplace pas un diagnostic en atelier et n'engage aucun prix ni délai.
        </p>
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
            placeholder="Votre question sur l'automobile…"
            className="flex-1 rounded-xl border border-black/10 p-2 text-sm outline-none focus:border-[#8B7500]"
          />
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
        <p className="mt-2 text-[11px] text-black/40">
          Vos échanges sont conservés pour la sécurité et l'amélioration du service. N'y indiquez
          aucune donnée bancaire ni document personnel.
        </p>
      </section>
    </div>
  );
}
