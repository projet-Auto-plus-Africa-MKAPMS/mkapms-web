/**
 * LOT IA02A — bandeau d'état PUBLIC de MKA.P-MS Intelligence.
 *
 * Remplace IaConfigWarning (qui affichait le nom de chaque fournisseur, sa
 * variable d'environnement et l'URL pour obtenir une clé) sur les écrans
 * publics. Ce composant ne connaît que trois états — disponible, dégradé,
 * indisponible — jamais un détail technique : voir server/intelligences/
 * identite.ts et provider.ts::etatServicePublic().
 */
import { AlertTriangle } from "lucide-react";
import { trpc } from "../lib/trpc";

export function EtatServiceIntelligence({ compact = false }: { compact?: boolean }) {
  const etat = trpc.intelligences.configStatus.useQuery(undefined, {
    refetchInterval: 60000,
    retry: 1,
  });
  const data = etat.data;
  if (!data || data.etat === "available") return null;

  const message =
    data.etat === "unavailable"
      ? `${data.nom} est temporairement indisponible. Réessayez plus tard.`
      : `${data.nom} fonctionne, mais sans redondance en ce moment : une coupure ponctuelle est possible.`;

  return (
    <div
      data-testid="etat-service-intelligence"
      className={`mb-4 rounded-2xl border p-4 shadow-sm ${
        data.etat === "unavailable" ? "border-rose-300 bg-rose-50" : "border-amber-300 bg-amber-50"
      } ${compact ? "text-xs" : ""}`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className={data.etat === "unavailable" ? "text-rose-700" : "text-amber-700"} />
        <p className={`text-sm font-semibold ${data.etat === "unavailable" ? "text-rose-900" : "text-amber-900"}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
