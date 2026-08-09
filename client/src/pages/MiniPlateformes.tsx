/**
 * MKA.P-MS — Matrice des mini-plateformes (point 34).
 *
 * Chaque univers doit être une plateforme complète, pas une page : moteur,
 * données, recherche locale, SEO/GEO, paiement, notifications, espace de
 * compte. Cet écran dit ce qui est RÉELLEMENT branché, capacité par capacité.
 *
 * Aucun score n'est arrondi vers le haut : un univers à 3/7 s'affiche 3/7.
 */
import { Layers, Loader2, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

const STATE_STYLE: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  ok: { icon: CheckCircle2, className: "text-green-600", label: "Branché" },
  partiel: { icon: MinusCircle, className: "text-amber-600", label: "Partiel" },
  absent: { icon: XCircle, className: "text-red-600", label: "Absent" },
};

export default function MiniPlateformes() {
  const universes = trpc.proximity.universes.useQuery();
  const health = trpc.proximity.health.useQuery();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Layers className="w-7 h-7 text-[#D4AF37]" />
        <h1 className="text-2xl font-bold">Univers en mini-plateformes</h1>
      </div>
      <p className="text-gray-600 mb-6">
        État réel de chaque univers : moteur, données, recherche locale, SEO/GEO, paiement, notifications et espace de
        compte. Une capacité non branchée est affichée comme telle.
      </p>

      {health.data && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="font-semibold mb-1">
            Moteur de proximité : {health.data.health} — {health.data.servicesLocalisables}/
            {health.data.servicesTotal} service(s) localisable(s)
          </div>
          <ul className="text-sm text-gray-600 list-disc pl-5">
            {health.data.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {universes.isLoading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyse des univers…
        </div>
      )}

      <div className="grid gap-4">
        {(universes.data ?? []).map((u) => (
          <div key={u.univers} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">{u.label}</h2>
              <span className="text-sm font-semibold">
                {u.score.ok}/{u.score.total} capacités branchées
              </span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {u.capabilities.map((c) => {
                const st = STATE_STYLE[c.state] ?? STATE_STYLE.absent;
                const Icon = st.icon;
                return (
                  <li key={c.key} className="flex items-start gap-2 text-sm">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${st.className}`} />
                    <span>
                      <span className="font-medium">{c.label}</span> — {c.detail}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
