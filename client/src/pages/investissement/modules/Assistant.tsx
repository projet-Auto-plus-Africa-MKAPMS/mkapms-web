import { useState } from "react";
import { Sparkles } from "lucide-react";
import { trpc } from "../../../lib/trpc";

export function Assistant() {
  const [question, setQuestion] = useState("");
  const [echanges, setEchanges] = useState<{ question: string; reponse: string }[]>([]);
  const poserQuestion = trpc.investment.poserQuestion.useMutation();

  const envoyer = () => {
    if (!question.trim()) return;
    const q = question;
    poserQuestion.mutate(
      { question: q },
      {
        onSuccess: (res) => {
          setEchanges((prev) => [...prev, { question: q, reponse: res.ok ? res.reponse : `Erreur : ${res.motif}` }]);
          setQuestion("");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#6B7280]">
        Posez une question sur vos investissements (revenus, échéances, performance). MKA.P-MS Intelligence ne connaît que vos propres données.
      </p>
      <div className="space-y-3">
        {echanges.map((e, i) => (
          <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
            <p className="text-xs font-bold text-[#111]">{e.question}</p>
            <p className="mt-2 text-sm text-[#6B7280] whitespace-pre-wrap">{e.reponse}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && envoyer()}
          placeholder="Combien ai-je généré ce mois-ci ?"
          className="flex-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
        />
        <button
          onClick={envoyer}
          disabled={poserQuestion.isPending || !question.trim()}
          className="flex items-center gap-1 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <Sparkles size={14} /> {poserQuestion.isPending ? "…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
