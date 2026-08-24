import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ShieldAlert, Trash2 } from "lucide-react";
import { trpc } from "../lib/trpc";

/**
 * File des demandes de suppression de compte, côté direction.
 *
 * Une demande venue du formulaire public n'est jamais exécutée automatiquement :
 * une adresse e-mail n'est pas une preuve d'identité, et supprimer le compte
 * d'un tiers sur cette seule base serait une faille. C'est ici que la décision
 * est prise, datée et attribuée.
 */
export default function DemandesSuppression() {
  const demandes = trpc.suppressionCompte.demandes.useQuery();
  const [decisions, setDecisions] = useState<Record<number, string>>({});
  const traiter = trpc.suppressionCompte.traiter.useMutation({
    onSuccess: () => demandes.refetch(),
  });

  const enAttente = (demandes.data ?? []).filter((d) => d.statut === "en_verification" || d.statut === "recue");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-2 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Direction
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-black text-white">
          <Trash2 size={20} className="text-[#D4AF37]" /> Demandes de suppression
        </h1>
        <p className="mt-1 text-xs text-white/60">
          {enAttente.length} demande(s) à vérifier — l&apos;identité doit être établie avant toute suppression
        </p>
      </div>

      <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-700" />
        <p className="text-xs text-amber-900">
          Vérifiez l&apos;identité du demandeur avant d&apos;effectuer. La suppression efface l&apos;identité du
          compte, retire les annonces et ferme les conversations : elle n&apos;est pas réversible.
        </p>
      </div>

      {demandes.isLoading ? (
        <p className="mx-4 mt-6 text-sm text-slate-500">Chargement…</p>
      ) : (demandes.data ?? []).length === 0 ? (
        <p className="mx-4 mt-6 text-sm text-slate-500">Aucune demande enregistrée.</p>
      ) : (
        <div className="mx-4 mt-4 space-y-3">
          {(demandes.data ?? []).map((d) => {
            const traitable = d.statut === "en_verification" || d.statut === "recue";
            return (
              <div key={d.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{d.email}</p>
                    <p className="text-xs text-slate-500">
                      {d.origine === "formulaire_public" ? "Formulaire public" : "Compte connecté"} ·{" "}
                      {new Date(d.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      d.statut === "effectuee"
                        ? "bg-slate-800 text-white"
                        : d.statut === "refusee"
                          ? "bg-slate-200 text-slate-700"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {d.statut}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  Compte correspondant : {d.compteExiste ? "trouvé" : "aucun compte à cette adresse"}
                </p>
                {d.motif ? <p className="mt-1 text-xs italic text-slate-600">« {d.motif} »</p> : null}
                {d.decision ? <p className="mt-1 text-xs text-slate-700">Décision : {d.decision}</p> : null}

                {traitable && (
                  <div className="mt-3 space-y-2">
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                      placeholder="Comment l'identité a été vérifiée (obligatoire pour la trace)"
                      value={decisions[d.id] ?? ""}
                      onChange={(e) => setDecisions((s) => ({ ...s, [d.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                        disabled={traiter.isPending || !(decisions[d.id] ?? "").trim()}
                        onClick={() =>
                          traiter.mutate({ id: d.id, action: "effectuer", decision: decisions[d.id] ?? "" })
                        }
                      >
                        Effectuer la suppression
                      </button>
                      <button
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"
                        disabled={traiter.isPending || !(decisions[d.id] ?? "").trim()}
                        onClick={() => traiter.mutate({ id: d.id, action: "refuser", decision: decisions[d.id] ?? "" })}
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {traiter.error ? <p className="mx-4 mt-3 text-sm text-red-600">{traiter.error.message}</p> : null}
    </div>
  );
}
