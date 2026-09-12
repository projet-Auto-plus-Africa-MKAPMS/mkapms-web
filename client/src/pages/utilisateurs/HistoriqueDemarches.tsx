import { Link } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* Données réelles : trpc.pieces.myServiceTracking (server/routers/pieces.ts,
   table serviceTracking) — le suivi universel déjà alimenté par tous les
   univers (garage, devis, dépannage, pièces, livraison…), regroupé par
   service. Jamais un second historique inventé pour cet écran. */

export default function HistoriqueDemarches() {
  const suivi = trpc.pieces.myServiceTracking.useQuery({});
  const liste = suivi.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Historique démarches</h1>
        <p className="mt-1 text-sm text-white/60">Toutes vos démarches, tous univers confondus</p>
      </div>

      {suivi.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((d) => (
          <div key={`${d.serviceType}-${d.serviceId}`} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111]">{d.titre}{d.reference ? ` — ${d.reference}` : ""}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{d.latestLabel}</span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] mt-1">{d.events.length} étape(s) — dernière : {new Date(d.events[0]?.createdAt ?? Date.now()).toLocaleDateString("fr-FR")}</p>
          </div>
        ))}
      </div>

      {!suivi.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <FileText size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune démarche pour le moment.</p>
        </div>
      )}
    </div>
  );
}
