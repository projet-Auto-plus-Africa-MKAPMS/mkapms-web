import ReviewStars from "./ReviewStars";
import TrustScore from "./TrustScore";
import ReviewBadge from "./ReviewBadge";

interface ReviewSummaryProps {
  stats: {
    totalReviews: number;
    averageRating: number;
    distribution: Record<string, number>;
    verifiedCount: number;
    responseRate: number;
    criteriaAverages?: Record<string, number>;
  };
  trustScore?: number | null;
  badges?: { label: string; icon: string; color: string }[];
}

export default function ReviewSummary({ stats, trustScore, badges }: ReviewSummaryProps) {
  const avgDisplay = (stats.averageRating / 100).toFixed(1);
  const distribution = stats.distribution ?? {};
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Top */}
      <div className="flex items-center gap-6 mb-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{avgDisplay}</div>
          <ReviewStars rating={parseFloat(avgDisplay)} size="md" />
          <div className="text-xs text-gray-500 mt-1">{stats.totalReviews} avis</div>
        </div>

        {trustScore != null && (
          <div className="text-center">
            <TrustScore score={trustScore} size="lg" />
            <div className="text-xs text-gray-500 mt-1">Indice de confiance</div>
          </div>
        )}
      </div>

      {/* Distribution */}
      <div className="space-y-1.5 mb-4">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] ?? 0;
          const pct = maxCount > 0 ? (count / stats.totalReviews) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-gray-600">{star}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Verified & response rate */}
      <div className="flex gap-4 text-xs text-gray-600 mb-4">
        <span>{stats.verifiedCount} avis verifies</span>
        <span>Taux de reponse : {stats.responseRate}%</span>
      </div>

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <ReviewBadge key={i} label={b.label} icon={b.icon} color={b.color} />
          ))}
        </div>
      )}

      {/* Criteria averages */}
      {stats.criteriaAverages && Object.keys(stats.criteriaAverages).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          {Object.entries(stats.criteriaAverages).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 capitalize">{key.replace(/_/g, " ")}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(val / 500) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-600 w-8">{(val / 100).toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
