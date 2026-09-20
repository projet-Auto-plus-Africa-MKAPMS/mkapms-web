import { Link, useParams } from "react-router-dom";
import { ChevronLeft, FileText, Check } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   DOCUMENTS DU DOSSIER (/demarches/signatures/:id)
   Données réelles : trpc.carteGrise.detail (server/routers/cartegrise.ts,
   cg_documents) — les vraies pièces déjà déposées sur le dossier. Aucune
   signature électronique n'existe encore côté serveur (aucune colonne
   "signé", aucun mécanisme d'immutabilité — à construire séparément) :
   l'écran affiche donc le statut réel de réception des pièces, jamais un
   état "signé" fabriqué.
   ══════════════════════════════════════════════════════════════════════════ */

export default function SignaturesElectroniques() {
  const { id } = useParams();
  const dossierId = Number(id);
  const { data, isLoading } = trpc.carteGrise.detail.useQuery({ id: dossierId }, { enabled: Number.isFinite(dossierId) });

  if (!Number.isFinite(dossierId) || (!isLoading && !data)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Dossier introuvable — revenez depuis « Démarches ».</p>
      </div>
    );
  }

  const documents = data?.documents ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Documents</h1>
        {data?.dossier && <p className="mt-1 text-sm text-white/60">{data.dossier.reference}</p>}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {documents.length === 0 && !isLoading && (
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">Aucun document déposé pour l'instant.</p>
        )}
        {documents.map((d) => (
          <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
            <Check size={14} className="text-green-600" />
            <div className="flex-1">
              <h3 className="text-sm text-[#111]">{d.nom}</h3>
              <p className="text-[9px] text-[#6B7280]">{new Date(d.createdAt).toLocaleDateString("fr-FR")} · {d.status}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mx-4 mt-4 text-[10px] text-[#6B7280] text-center">
        La signature électronique n'est pas encore disponible — ces pièces sont vérifiées manuellement par l'agence.
      </p>
    </div>
  );
}
