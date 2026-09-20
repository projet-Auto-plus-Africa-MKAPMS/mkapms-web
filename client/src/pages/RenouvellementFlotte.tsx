import { Link } from "react-router-dom";
import { ChevronLeft, RefreshCw, AlertCircle, Clock, FileText } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   RENOUVELLEMENT DE FLOTTE
   Vos contrats de location réels (server/routers/rentalContracts.ts —
   créés par un agent une fois une candidature payée). Aucune suggestion de
   véhicule de remplacement automatique : ce moteur de recommandation
   n'existe pas et ne doit pas être simulé. « Renouveler » ouvre une
   nouvelle candidature réelle, jamais une prolongation instantanée
   inventée côté client.
   ══════════════════════════════════════════════════════════════════════════ */

function joursRestants(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function RenouvellementFlotte() {
  const { user } = useAuth();
  const contratsQ = trpc.rentalContracts.myContracts.useQuery(undefined, { enabled: !!user });
  const contrats = (contratsQ.data ?? []).filter((c) => c.status === "actif");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/louer/pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location Pro</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><RefreshCw size={20} /> Renouvellement de flotte</h1>
        <p className="mt-1 text-sm text-white/80">Vos contrats de location en cours</p>
      </div>

      {!user && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-6 text-center">
          <p className="text-sm text-[#6B7280]">Connectez-vous pour voir vos contrats.</p>
        </div>
      )}

      {user && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-bold text-[#111]">Contrats actifs</h2>
          {contratsQ.isLoading && <p className="mt-2 text-xs text-[#9CA3AF]">Chargement…</p>}
          {!contratsQ.isLoading && contrats.length === 0 && (
            <div className="mt-2 rounded-xl bg-white border border-[#E5E7EB] p-6 text-center">
              <FileText size={22} className="mx-auto text-[#9CA3AF]" />
              <p className="mt-2 text-sm text-[#6B7280]">Aucun contrat de location actif pour le moment.</p>
            </div>
          )}
          <div className="mt-2 space-y-2">
            {contrats.map((c) => {
              const jours = joursRestants(c.endDate as unknown as string | null);
              const bientot = jours !== null && jours <= 15;
              return (
                <div key={c.id} className={`rounded-xl bg-white border overflow-hidden ${bientot ? "border-amber-300" : "border-[#E5E7EB]"}`}>
                  <div className="flex gap-3 p-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-[#111]">{c.vehicule ? `${c.vehicule.marque} ${c.vehicule.modele}` : "Véhicule non renseigné"}</h3>
                      <p className="text-[10px] text-[#6B7280]">
                        Contrat #{c.id} · Début {new Date(c.startDate as unknown as string).toLocaleDateString("fr-FR")}
                        {c.endDate ? ` · Fin ${new Date(c.endDate as unknown as string).toLocaleDateString("fr-FR")}` : " · durée indéterminée"}
                      </p>
                    </div>
                    {jours !== null && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 h-fit text-[10px] font-semibold ${bientot ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"}`}>
                        <Clock size={10} /> {jours > 0 ? `${jours}j` : "expiré"}
                      </span>
                    )}
                  </div>
                  {bientot && (
                    <div className="px-4 pb-3">
                      <div className="rounded-lg bg-amber-50 p-2 flex items-start gap-2">
                        <AlertCircle size={12} className="text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-800">Ce contrat arrive à échéance. Déposez une nouvelle candidature pour poursuivre sans interruption.</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA — une vraie nouvelle candidature, jamais une prolongation inventée */}
      <div className="px-4 mt-6">
        <Link to="/louer/pro/candidature" className="block w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white text-center active:scale-[0.98] transition">
          Déposer une nouvelle candidature de location
        </Link>
      </div>
    </div>
  );
}
