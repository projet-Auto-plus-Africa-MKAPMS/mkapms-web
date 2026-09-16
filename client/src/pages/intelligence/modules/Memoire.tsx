/**
 * MKA.P-MS AI — module Mémoire (LOT IA02B + LOT IA02F).
 *
 * Mémoire fédérée réelle (server/intelligences/memoire.ts) : état par
 * catégorie (volume constaté, ou « non mesuré » quand le détenteur ne répond
 * pas — jamais confondu avec « vide ») et recherche transversale. Aucune
 * seconde mémoire créée ici.
 *
 * LOT IA02F ajoute la mémoire UTILISATEUR (server/intelligences/
 * memoire-utilisateur.ts) : distincte de la mémoire d'entreprise ci-dessus —
 * éditable, avec catégorie/source/confiance/visibilité, jamais créée
 * automatiquement depuis un message.
 */
import { useState } from "react";
import { Brain, Search, Trash2, User } from "lucide-react";
import { trpc } from "../../../lib/trpc";

function MemoireUtilisateur() {
  const [categorie, setCategorie] = useState("preference");
  const [cle, setCle] = useState("");
  const [contenu, setContenu] = useState("");

  const utils = trpc.useUtils();
  const liste = trpc.intelligences.memoireUtilisateurListe.useQuery({});
  const ecrire = trpc.intelligences.memoireUtilisateurEcrire.useMutation({
    onSuccess: () => {
      utils.intelligences.memoireUtilisateurListe.invalidate();
      setCle("");
      setContenu("");
    },
  });
  const supprimer = trpc.intelligences.memoireUtilisateurSupprimer.useMutation({
    onSuccess: () => utils.intelligences.memoireUtilisateurListe.invalidate(),
  });

  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <User className="h-5 w-5 text-black/40" />
        <h2 className="text-base font-black text-[#111]">Mémoire utilisateur</h2>
      </div>
      <p className="mb-3 text-xs text-black/50">Préférences, réglages, choix persistants — jamais créée automatiquement depuis une conversation.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!cle.trim() || !contenu.trim()) return;
          ecrire.mutate({ categorie, cle: cle.trim(), contenu: contenu.trim() });
        }}
        className="mb-3 flex flex-wrap gap-2"
      >
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="rounded-lg border border-black/10 px-2 py-2 text-sm">
          <option value="preference">Préférence</option>
          <option value="reglage">Réglage</option>
          <option value="choix_persistant">Choix persistant</option>
          <option value="contexte_metier">Contexte métier</option>
          <option value="workflow">Workflow</option>
        </select>
        <input value={cle} onChange={(e) => setCle(e.target.value)} placeholder="Clé" className="w-32 rounded-lg border border-black/10 px-2 py-2 text-sm" />
        <input
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Contenu à retenir…"
          className="flex-1 min-w-[160px] rounded-lg border border-black/10 px-2 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white">
          Retenir
        </button>
      </form>

      {liste.data?.length === 0 && <p className="text-sm text-black/40">Aucune entrée.</p>}
      <div className="space-y-2">
        {liste.data?.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-black/5 bg-[#FAFAFA] p-2.5 text-sm">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/50">{e.categorie}</span>
                <span className="font-bold text-[#111]">{e.cle}</span>
                <span className="text-[10px] text-black/30">source : {e.source} · confiance : {e.confiance} · {e.visibilite}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-black/60">{e.contenu}</p>
            </div>
            <button onClick={() => supprimer.mutate({ id: e.id })} className="shrink-0 rounded-lg p-2 text-black/30 hover:bg-red-50 hover:text-red-600" title="Supprimer">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <MemoireUtilisateur />

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
