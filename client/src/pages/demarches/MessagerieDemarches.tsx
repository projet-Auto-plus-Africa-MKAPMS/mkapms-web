import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MessageSquare, Clock } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   SUIVI DU DOSSIER (/demarches/messagerie/:id)
   Données réelles : trpc.carteGrise.detail (server/routers/cartegrise.ts,
   étapes cg_etapes) — le vrai historique de traitement du dossier, jamais
   des messages fabriqués. Aucune messagerie bidirectionnelle dossier↔client
   n'existe encore côté serveur (à construire séparément) : l'écran n'en
   simule donc pas une — il affiche honnêtement le suivi réel déjà produit
   par l'agence à chaque changement de statut.
   ══════════════════════════════════════════════════════════════════════════ */

export default function MessagerieDemarches() {
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

  const etapes = [...(data?.etapes ?? [])].reverse();

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]" /> Suivi du dossier</h1>
        {data?.dossier && <p className="mt-1 text-sm text-white/60">{data.dossier.reference}</p>}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {etapes.length === 0 && !isLoading && (
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">Aucune mise à jour pour l'instant.</p>
        )}
        {etapes.map((e) => (
          <div key={e.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
            <div className="flex justify-between text-[9px]">
              <span className="font-bold text-[#D4AF37]">{e.statusLabel}</span>
              <span className="text-[#9CA3AF] flex items-center gap-1"><Clock size={10} /> {new Date(e.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            {e.commentaire && <p className="text-sm text-[#111] mt-1">{e.commentaire}</p>}
          </div>
        ))}
      </div>

      <p className="mx-4 mt-4 text-[10px] text-[#6B7280] text-center">
        La messagerie directe avec l'agence n'est pas encore disponible — les mises à jour du dossier apparaissent ici automatiquement.
      </p>
    </div>
  );
}
