/**
 * MKA.P-MS Intelligence — module Mémoire (LOT IA02B).
 *
 * Mémoire fédérée réelle (server/intelligences/memoire.ts) : état par
 * catégorie (volume constaté, ou « non mesuré » quand le détenteur ne répond
 * pas — jamais confondu avec « vide ») et recherche transversale. Aucune
 * seconde mémoire créée ici.
 */
import { useState } from "react";
import { Brain, Search } from "lucide-react";
import { trpc } from "../../../lib/trpc";

export function Memoire() {
  const [q, setQ] = useState("");
  const [terme, setTerme] = useState("");

  const memoire = trpc.intelligences.memoire.useQuery();
  const recherche = trpc.intelligences.memoireRechercher.useQuery(
    { q: terme, limit: 30 },
    { enabled: terme.length >= 2 },
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Mémoire — état par catégorie</h2>
        </div>
        {memoire.isLoading && <p className="text-sm text-black/40">Chargement…</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {memoire.data?.etat.map((c) => (
            <div key={c.code} className="rounded-lg border border-black/5 bg-[#FAFAFA] p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-[#111]">{c.libelle}</span>
                <span className="text-xs font-bold text-black/50">
                  {c.volume === null ? "non mesuré" : c.volume}
                </span>
              </div>
              <p className="mt-1 text-xs text-black/50">{c.motif}</p>
              <p className="mt-1 text-[11px] text-black/30">détenteur : {c.detenteur}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Recherche transversale</h2>
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
            placeholder="Rechercher dans la mémoire…"
            className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#8B7500]"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white"
          >
            Chercher
          </button>
        </form>

        {recherche.data && (
          <div className="mt-3 space-y-2">
            {recherche.data.trouvailles.length === 0 && (
              <p className="text-sm text-black/40">Aucun résultat pour « {terme} ».</p>
            )}
            {recherche.data.trouvailles.map((t, i) => (
              <div key={i} className="rounded-lg border border-black/5 p-2.5 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-[#111]">{t.titre}</span>
                  <span className="text-[11px] text-black/30">{t.categorie}</span>
                </div>
                <p className="mt-0.5 text-xs text-black/60">{t.extrait}</p>
              </div>
            ))}
            {recherche.data.nonLues.length > 0 && (
              <p className="text-xs text-amber-700">
                Détenteur(s) non lisible(s) pendant cette recherche :{" "}
                {recherche.data.nonLues.map((n) => n.detenteur).join(", ")}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
