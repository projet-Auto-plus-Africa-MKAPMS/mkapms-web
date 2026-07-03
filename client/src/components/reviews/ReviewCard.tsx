import { ThumbsUp, Flag, Image, Video, FileText, CheckCircle2, Crown, Reply } from "lucide-react";
import ReviewStars from "./ReviewStars";

interface ReviewCardProps {
  review: {
    id: number;
    authorName?: string | null;
    authorFirstName?: string | null;
    authorAvatar?: string | null;
    authorDisplayMode: string;
    ratingGlobal: number;
    criterias?: Record<string, number> | null;
    comment?: string | null;
    prosText?: string | null;
    consText?: string | null;
    photos?: string[] | null;
    videos?: string[] | null;
    documents?: { name: string; url: string; type: string }[] | null;
    verified: boolean;
    responseText?: string | null;
    responseAt?: string | null;
    responseDocuments?: { name: string; url: string; type: string }[] | null;
    clientReplyText?: string | null;
    clientReplyAt?: string | null;
    officialResponseText?: string | null;
    officialResponseAt?: string | null;
    helpfulCount: number;
    language?: string | null;
    translatedComment?: string | null;
    authorLoyaltyTier?: string | null;
    createdAt: string;
    univers?: string;
  };
  onHelpful?: (id: number) => void;
  onReport?: (id: number) => void;
  showTranslation?: boolean;
}

function getDisplayName(review: ReviewCardProps["review"]): string {
  const name = review.authorName || "Utilisateur";
  const first = review.authorFirstName || name.split(" ")[0];
  switch (review.authorDisplayMode) {
    case "prenom": return first;
    case "initiales": return name.split(" ").map(n => n[0]).join(".").toUpperCase() + ".";
    case "anonyme": return "Anonyme";
    default: return name;
  }
}

function getLoyaltyLabel(tier: string | null | undefined): string | null {
  switch (tier) {
    case "vip": return "Client VIP";
    case "fidele": return "Client fidele";
    case "regular": return "Client regulier";
    default: return null;
  }
}

export default function ReviewCard({ review, onHelpful, onReport, showTranslation = false }: ReviewCardProps) {
  const displayName = getDisplayName(review);
  const loyaltyLabel = getLoyaltyLabel(review.authorLoyaltyTier);
  const date = new Date(review.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const photos = (review.photos || []) as string[];
  const videos = (review.videos || []) as string[];
  const docs = (review.documents || []) as { name: string; url: string; type: string }[];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {review.authorAvatar ? (
            <img src={review.authorAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {displayName[0]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{displayName}</span>
              {review.verified && (
                <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Verifie
                </span>
              )}
              {loyaltyLabel && (
                <span className="inline-flex items-center gap-0.5 text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-200">
                  <Crown className="w-3 h-3" /> {loyaltyLabel}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{date}</span>
          </div>
        </div>
        <ReviewStars rating={review.ratingGlobal} size="sm" />
      </div>

      {/* Criteres */}
      {review.criterias && Object.keys(review.criterias).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(review.criterias as Record<string, number>).map(([key, val]) => (
            <span key={key} className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-700">
              {key}: {val}/5
            </span>
          ))}
        </div>
      )}

      {/* Comment */}
      {review.comment && <p className="text-gray-800 text-sm leading-relaxed mb-3">{review.comment}</p>}
      {showTranslation && review.translatedComment && (
        <p className="text-gray-600 text-sm italic border-l-2 border-blue-200 pl-3 mb-3">
          {review.translatedComment}
        </p>
      )}

      {/* Pros / Cons */}
      {(review.prosText || review.consText) && (
        <div className="flex gap-4 mb-3">
          {review.prosText && (
            <div className="flex-1 bg-green-50 rounded-lg p-2 text-xs text-green-800">
              <span className="font-semibold">+</span> {review.prosText}
            </div>
          )}
          {review.consText && (
            <div className="flex-1 bg-red-50 rounded-lg p-2 text-xs text-red-800">
              <span className="font-semibold">-</span> {review.consText}
            </div>
          )}
        </div>
      )}

      {/* Media */}
      {photos.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {photos.map((p, i) => (
            <img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover border" />
          ))}
          {videos.length > 0 && <span className="flex items-center text-xs text-gray-500 gap-1"><Video className="w-4 h-4" /> {videos.length}</span>}
        </div>
      )}
      {docs.length > 0 && (
        <div className="flex gap-2 mb-3">
          {docs.map((d, i) => (
            <a key={i} href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <FileText className="w-3 h-3" /> {d.name}
            </a>
          ))}
        </div>
      )}

      {/* Reponse pro */}
      {review.responseText && (
        <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Reply className="w-3.5 h-3.5 text-blue-700" />
            <span className="text-xs font-semibold text-blue-800">Reponse du professionnel</span>
          </div>
          <p className="text-sm text-blue-900">{review.responseText}</p>
        </div>
      )}

      {/* Reponse client */}
      {review.clientReplyText && (
        <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100 ml-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Reply className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-xs font-semibold text-gray-700">Reponse du client</span>
          </div>
          <p className="text-sm text-gray-800">{review.clientReplyText}</p>
        </div>
      )}

      {/* Reponse officielle */}
      {review.officialResponseText && (
        <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Crown className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-xs font-semibold text-amber-800">Reponse officielle MKA.P-MS</span>
          </div>
          <p className="text-sm text-amber-900">{review.officialResponseText}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onHelpful?.(review.id)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Utile ({review.helpfulCount})
        </button>
        <button
          type="button"
          onClick={() => onReport?.(review.id)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          Signaler
        </button>
      </div>
    </div>
  );
}
