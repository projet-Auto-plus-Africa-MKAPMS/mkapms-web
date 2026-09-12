import { Link } from "react-router-dom";
import { ChevronLeft, Bell, Trash2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* Données réelles : trpc.searches (server/routers/notifications.ts,
   searchesRouter, table savedSearches) — les alertes de recherche
   sauvegardée qui déclenchent une notification à chaque nouvelle annonce
   correspondante. Jamais un second système d'alertes inventé. */

export default function CentreAlertesUtilisateur() {
  const mesRecherches = trpc.searches.list.useQuery();
  const setAlert = trpc.searches.setAlert.useMutation({ onSuccess: () => mesRecherches.refetch() });
  const remove = trpc.searches.remove.useMutation({ onSuccess: () => mesRecherches.refetch() });
  const liste = mesRecherches.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> Mes alertes</h1>
        <p className="mt-1 text-sm text-white/60">Recherches sauvegardées et alertes de nouvelles annonces</p>
      </div>

      {mesRecherches.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((r) => (
          <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111]">{r.label}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAlert.mutate({ id: r.id, alertEnabled: !r.alertEnabled })}
                  className={`h-6 w-11 rounded-full transition ${r.alertEnabled ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${r.alertEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <button onClick={() => remove.mutate({ id: r.id })} className="text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-[10px] text-[#9CA3AF] mt-1">{r.alertEnabled ? "Alerte activée" : "Alerte désactivée"} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        ))}
      </div>

      {!mesRecherches.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Bell size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune recherche sauvegardée pour le moment.</p>
        </div>
      )}
    </div>
  );
}
