/**
 * Point 57 — page publique de réputation d'un univers (/avis/:univers).
 *
 * Visible par tout le monde, y compris les moteurs de recherche et les
 * assistants conversationnels autorisés. Elle n'affiche que des professionnels réels avec
 * leurs vraies notes et leurs vrais volumes ; s'il n'y a pas d'avis, elle
 * l'écrit. Le nombre d'avis est indiqué à côté de chaque note pour qu'une note
 * de 5/5 sur deux avis ne soit pas lue comme une référence.
 */
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MapPin, ShieldCheck, Star } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function AvisUnivers() {
  const { univers = "" } = useParams<{ univers: string }>();
  const page = trpc.reputationEngine.pagePublique.useQuery(
    { univers, limit: 50 },
    { enabled: univers.length > 0, refetchOnWindowFocus: false },
  );
  const universList = trpc.reputationEngine.universAvecAvis.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const d = page.data;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Accueil
        </Link>
        <h1 className="text-xl font-black text-white">
          Avis et notes {d?.libelle ?? univers}
        </h1>
        <p className="mt-1 text-xs text-white/50">
          Notes réelles issues des avis publiés sur MKA.P-MS. Les avis marqués vérifiés
          correspondent à une transaction constatée par la plateforme.
        </p>
      </div>

      <div className="space-y-3 px-4 pt-4">
        {page.isLoading ? (
          <p className="text-sm text-black/50">Chargement…</p>
        ) : page.error ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{page.error.message}</p>
        ) : !d ? null : d.entrees.length === 0 ? (
          <p className="rounded-xl border border-black/5 bg-white p-4 text-sm text-black/60">
            {d.raison}
          </p>
        ) : (
          <>
            <div className="rounded-xl border border-black/5 bg-white p-3 text-xs text-black/60">
              {d.entrees.length} professionnel(s) évalué(s) · {d.totalAvis} avis publiés. Chaque
              note appartient à un professionnel : aucune moyenne d'ensemble n'est présentée
              comme la note d'un professionnel en particulier.
            </div>
            {d.entrees.map((e) => (
              <div
                key={`${e.targetType}-${e.targetId}`}
                className="rounded-xl border border-black/5 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {e.url ? (
                      <Link to={e.url} className="text-base font-bold text-[#111] underline">
                        {e.nom}
                      </Link>
                    ) : (
                      <p className="text-base font-bold text-[#111]">{e.nom}</p>
                    )}
                    {e.ville || e.pays ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-black/50">
                        <MapPin size={11} />
                        {[e.ville, e.pays].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="flex items-center gap-1 text-lg font-black text-[#111]">
                      <Star size={15} className="text-[#D4AF37]" />
                      {e.noteMoyenne.toFixed(2)}/5
                    </p>
                    <p className="text-[11px] text-black/50">{e.avis} avis</p>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-black/60">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  {e.avisVerifies} expérience(s) vérifiée(s)
                  {e.dernierAvisLe
                    ? ` · dernier avis le ${new Date(e.dernierAvisLe).toLocaleDateString("fr-FR")}`
                    : ""}
                </p>
              </div>
            ))}
          </>
        )}

        {(universList.data ?? []).length > 1 ? (
          <div className="rounded-xl border border-black/5 bg-white p-3">
            <p className="mb-2 text-xs font-bold text-[#111]">Autres services évalués</p>
            <div className="flex flex-wrap gap-2">
              {(universList.data ?? [])
                .filter((u) => u.univers !== univers)
                .map((u) => (
                  <Link
                    key={u.univers}
                    to={`/avis/${u.univers}`}
                    className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold text-black/70"
                  >
                    {u.libelle} ({u.avis})
                  </Link>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
