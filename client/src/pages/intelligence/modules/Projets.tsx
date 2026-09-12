/**
 * MKA.P-MS Intelligence — module Projets (LOT IA02B).
 *
 * Liste réelle des projets du Chantier de développement
 * (server/intelligences/chantier/projets.ts::mesProjets) — même moteur que
 * celui construit dans le lot précédent, pas de duplication.
 */
import { FolderKanban } from "lucide-react";
import { trpc } from "../../../lib/trpc";

const LABEL_STATUT: Record<string, string> = {
  cree: "Créé",
  en_cours: "En cours",
  pret: "Prêt",
  erreur: "Erreur",
  archive: "Archivé",
};

const CLASSE_STATUT: Record<string, string> = {
  cree: "bg-black/5 text-black/50",
  en_cours: "bg-[#FFFBEA] text-[#8B7500]",
  pret: "bg-[#E9F7EF] text-[#1a7f37]",
  erreur: "bg-red-50 text-red-600",
  archive: "bg-black/5 text-black/40",
};

export function Projets() {
  const projets = trpc.intelligences.chantierProjets.useQuery({ limit: 40 });

  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <FolderKanban className="h-5 w-5 text-black/40" />
        <h2 className="text-base font-black text-[#111]">Projets Chantier</h2>
      </div>

      {projets.isLoading && <p className="text-sm text-black/40">Chargement…</p>}
      {projets.data?.length === 0 && (
        <p className="text-sm text-black/40">
          Aucun projet créé pour l'instant. Un projet naît d'une demande en langage naturel dans le
          module Code &amp; développement, quand il sera construit.
        </p>
      )}

      <ul className="divide-y divide-black/5">
        {projets.data?.map((p) => (
          <li key={p.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#111]">{p.nom}</span>
                <span className="text-[11px] text-black/30">{p.typeProjet}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-black/50">{p.description}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${CLASSE_STATUT[p.statut] ?? "bg-black/5 text-black/50"}`}
            >
              {LABEL_STATUT[p.statut] ?? p.statut}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
