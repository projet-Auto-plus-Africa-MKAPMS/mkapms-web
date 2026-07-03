import { useState } from "react";
import { MessageSquarePlus, TrendingUp, Filter } from "lucide-react";
import ReviewSummary from "./ReviewSummary";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";

interface ReviewSectionProps {
  targetType: string;
  targetId: number;
  univers: string;
  stats: {
    totalReviews: number;
    averageRating: number;
    distribution: Record<string, number>;
    verifiedCount: number;
    responseRate: number;
    criteriaAverages?: Record<string, number>;
  } | null;
  reviews: any[];
  criteria?: { criteriaKey: string; criteriaLabel: string; criteriaIcon?: string | null }[];
  trustScore?: number | null;
  badges?: { label: string; icon: string; color: string }[];
  onSubmitReview?: (data: any) => void;
  onHelpful?: (id: number) => void;
  onReport?: (id: number) => void;
  isAuthenticated?: boolean;
  loading?: boolean;
}

export default function ReviewSection({
  targetType, targetId, univers, stats, reviews, criteria = [],
  trustScore, badges, onSubmitReview, onHelpful, onReport,
  isAuthenticated = false, loading = false,
}: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "best" | "worst" | "helpful">("recent");

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "best") return b.ratingGlobal - a.ratingGlobal;
    if (sortBy === "worst") return a.ratingGlobal - b.ratingGlobal;
    if (sortBy === "helpful") return b.helpfulCount - a.helpfulCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Avis et notes
        </h2>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Donner mon avis
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isAuthenticated && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
          <ReviewForm
            criteria={criteria}
            univers={univers}
            loading={loading}
            onSubmit={(data) => {
              onSubmitReview?.({ ...data, targetType, targetId, univers });
              setShowForm(false);
            }}
          />
        </div>
      )}

      {/* Summary */}
      {stats && stats.totalReviews > 0 && (
        <ReviewSummary stats={stats} trustScore={trustScore} badges={badges} />
      )}

      {/* Sort */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700"
          >
            <option value="recent">Plus recents</option>
            <option value="best">Meilleures notes</option>
            <option value="worst">Notes les plus basses</option>
            <option value="helpful">Plus utiles</option>
          </select>
        </div>
      )}

      {/* Reviews list */}
      {sortedReviews.length > 0 ? (
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={onHelpful}
              onReport={onReport}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <MessageSquarePlus className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aucun avis pour le moment.</p>
          {isAuthenticated && <p className="text-xs mt-1">Soyez le premier a donner votre avis !</p>}
        </div>
      )}
    </section>
  );
}
