import { Link } from "react-router-dom";
import { ChevronLeft, Truck } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* Données réelles : trpc.depannage.myRequests (server/routers/depannage.ts),
   déjà utilisé par client/src/pages/Depannage.tsx — jamais un second
   historique inventé pour cet écran. */

const STATUT_LABEL: Record<string, string> = {
  demande: "Demande envoyée",
  en_recherche: "Recherche en cours",
  devis_envoye: "Devis reçu",
  acceptee: "Mission acceptée",
  en_intervention: "Intervention en cours",
  terminee: "Terminé",
  annulee: "Annulée",
  litige: "Litige en cours",
};

export default function HistoriqueDepannages() {
  const mesRequetes = trpc.depannage.myRequests.useQuery();
  const liste = mesRequetes.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-[#D4AF37]" /> Historique dépannages</h1>
        <p className="mt-1 text-sm text-white/60">Vos demandes d'assistance et de dépannage</p>
      </div>

      {mesRequetes.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((r) => (
          <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111]">{r.typePanne ?? "Dépannage"}{r.vehicule ? ` — ${r.vehicule}` : ""}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{STATUT_LABEL[r.status] ?? r.status}</span>
            </div>
            {r.description && <p className="text-xs text-[#6B7280] mt-1">{r.description}</p>}
            <p className="text-[10px] text-[#9CA3AF] mt-1">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        ))}
      </div>

      {!mesRequetes.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Truck size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun dépannage pour le moment.</p>
        </div>
      )}
    </div>
  );
}
