/**
 * MKA.P-MS AI — module Recherche (LOT IA02F).
 *
 * Recherche unifiée réelle (server/intelligences/recherche-globale.ts) dans
 * les sources réellement autorisées à l'appelant — jamais un résultat
 * simulé. Chaque résultat affiche sa provenance, sa source et son score.
 */
import { useState } from "react";
import { Search } from "lucide-react";
import { trpc } from "../../../lib/trpc";

const SOURCES = [
  { code: "conversation", libelle: "Conversations" },
  { code: "memoire", libelle: "Mémoire" },
  { code: "fichier", libelle: "Fichiers" },
  { code: "connaissance", libelle: "Connaissances" },
] as const;

const LABELS_SOURCE: Record<string, string> = {
  conversation: "Conversation",
  memoire: "Mémoire",
  fichier: "Fichier",
  connaissance: "Connaissance",
};

export function Recherche() {
  const [q, setQ] = useState("");
  const [terme, setTerme] = useState("");
  const [sourcesActives, setSourcesActives] = useState<string[]>(SOURCES.map((s) => s.code));

  const resultat = trpc.intelligences.rechercheGlobale.useQuery(
    { q: terme, sources: sourcesActives as never },
    { enabled: terme.length >= 2 },
  );

  function basculerSource(code: string) {
    setSourcesActives((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Recherche</h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTerme(q.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Retrouver une information dans la plateforme, la mémoire ou les fichiers…"
            className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#8B7500]"
          />
          <button type="submit" className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white">
            Chercher
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => basculerSource(s.code)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                sourcesActives.includes(s.code) ? "border-[#111] bg-[#111] text-white" : "border-black/10 text-black/50"
              }`}
            >
              {s.libelle}
            </button>
          ))}
        </div>
      </div>

      {resultat.data && (
        <div className="rounded-xl border border-black/10 p-4">
          {resultat.data.length === 0 && <p className="text-sm text-black/40">Aucun résultat pour « {terme} » dans les sources sélectionnées.</p>}
          <div className="space-y-2">
            {resultat.data.map((r, i) => (
              <div key={i} className="rounded-lg border border-black/5 p-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/50">{LABELS_SOURCE[r.source] ?? r.source}</span>
                  <span className="font-bold text-[#111]">{r.titre}</span>
                  <span className="text-[10px] text-black/30">score {r.score.toFixed(2)}</span>
                  {r.date && <span className="text-[10px] text-black/30">{new Date(r.date).toLocaleDateString("fr-FR")}</span>}
                </div>
                <p className="mt-1 text-xs text-black/60">{r.extrait}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
