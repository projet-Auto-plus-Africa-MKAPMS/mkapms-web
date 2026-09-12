/**
 * MKA.P-MS Intelligence — module Outils (LOT IA02B).
 *
 * Lecture réelle de la fiche Universe Registry du produit Intelligence
 * lui-même (server/intelligences/univers, LOT IA01, universeId
 * "intelligence_produit") : moteurs, routes, outils Tool Registry actifs.
 * Aucun nouvel outil créé ici, seulement l'état déjà cartographié.
 */
import { Wrench } from "lucide-react";
import { trpc } from "../../../lib/trpc";

export function Outils() {
  const univers = trpc.intelligences.universDetail.useQuery({ universeId: "intelligence_produit" });

  if (univers.isLoading) return <p className="text-sm text-black/40">Chargement…</p>;
  if (!univers.data) return <p className="text-sm text-red-600">Fiche univers introuvable.</p>;

  const u = univers.data;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">{u.nom}</h2>
          <span className="ml-auto rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-bold text-black/50">
            {u.statut}
          </span>
        </div>
        <p className="text-sm text-black/60">{u.description}</p>
        {u.motifStatut && <p className="mt-2 text-xs text-black/40">{u.motifStatut}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 p-4">
          <h3 className="mb-2 text-sm font-bold text-[#111]">Moteurs ({u.engineIds.length})</h3>
          <ul className="space-y-1 text-xs text-black/60">
            {u.engineIds.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-black/10 p-4">
          <h3 className="mb-2 text-sm font-bold text-[#111]">Routes ({u.routes.length})</h3>
          <ul className="space-y-1 text-xs text-black/60">
            {u.routes.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-black/10 p-4">
          <h3 className="mb-2 text-sm font-bold text-[#111]">Outils actifs ({u.outilsActifs.length})</h3>
          <ul className="space-y-1 text-xs text-black/60">
            {u.outilsActifs.map((o) => (
              <li key={o}>{o}</li>
            ))}
            {u.outilsActifs.length === 0 && <li className="text-black/30">aucun</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-black/10 p-4">
          <h3 className="mb-2 text-sm font-bold text-[#111]">
            Enregistrés non connectés ({u.outilsEnregistresNonConnectes.length})
          </h3>
          <ul className="space-y-1 text-xs text-black/60">
            {u.outilsEnregistresNonConnectes.map((o) => (
              <li key={o}>{o}</li>
            ))}
            {u.outilsEnregistresNonConnectes.length === 0 && <li className="text-black/30">aucun</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
