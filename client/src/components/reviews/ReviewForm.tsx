import { useState } from "react";
import { Camera, Video, FileText, Eye, EyeOff } from "lucide-react";
import ReviewStars from "./ReviewStars";

interface CriteriaTemplate {
  criteriaKey: string;
  criteriaLabel: string;
  criteriaIcon?: string | null;
}

interface ReviewFormProps {
  criteria?: CriteriaTemplate[];
  onSubmit: (data: {
    ratingGlobal: number;
    criterias: Record<string, number>;
    comment: string;
    prosText: string;
    consText: string;
    displayMode: "full" | "prenom" | "initiales" | "anonyme";
    visibility: "public" | "prive";
    photos: string[];
    videos: string[];
    documents: { name: string; url: string; type: string }[];
  }) => void;
  loading?: boolean;
  univers?: string;
}

export default function ReviewForm({ criteria = [], onSubmit, loading = false, univers }: ReviewFormProps) {
  const [ratingGlobal, setRatingGlobal] = useState(0);
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [prosText, setProsText] = useState("");
  const [consText, setConsText] = useState("");
  const [displayMode, setDisplayMode] = useState<"full" | "prenom" | "initiales" | "anonyme">("full");
  const [visibility, setVisibility] = useState<"public" | "prive">("public");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingGlobal === 0) return;
    onSubmit({
      ratingGlobal,
      criterias: criteriaRatings,
      comment,
      prosText,
      consText,
      displayMode,
      visibility,
      photos: [],
      videos: [],
      documents: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Note globale */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Note globale *</label>
        <ReviewStars rating={ratingGlobal} size="lg" interactive onChange={setRatingGlobal} />
      </div>

      {/* Criteres */}
      {criteria.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-800">Criteres detailles</label>
          {criteria.map((c) => (
            <div key={c.criteriaKey} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{c.criteriaIcon} {c.criteriaLabel}</span>
              <ReviewStars
                rating={criteriaRatings[c.criteriaKey] || 0}
                size="sm"
                interactive
                onChange={(val) => setCriteriaRatings({ ...criteriaRatings, [c.criteriaKey]: val })}
              />
            </div>
          ))}
        </div>
      )}

      {/* Commentaire */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Votre avis</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          maxLength={2000}
          placeholder="Partagez votre experience..."
        />
        <div className="text-xs text-gray-400 text-right">{comment.length}/2000</div>
      </div>

      {/* Pros / Cons */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-green-700 mb-1">Points positifs</label>
          <input
            type="text"
            value={prosText}
            onChange={(e) => setProsText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            maxLength={500}
            placeholder="Ce qui vous a plu"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-red-700 mb-1">Points negatifs</label>
          <input
            type="text"
            value={consText}
            onChange={(e) => setConsText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            maxLength={500}
            placeholder="Ce qui peut etre ameliore"
          />
        </div>
      </div>

      {/* Medias */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">Pieces jointes</label>
        <div className="flex gap-3">
          <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
            <Camera className="w-4 h-4" /> Photos
          </button>
          <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
            <Video className="w-4 h-4" /> Video
          </button>
          <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
            <FileText className="w-4 h-4" /> Document
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">+50 points avec photo, +100 points avec video</p>
      </div>

      {/* Anonymat */}
      <div className="flex items-center gap-4">
        <label className="block text-sm font-medium text-gray-700">Afficher mon nom :</label>
        <select
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value as typeof displayMode)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="full">Nom complet</option>
          <option value="prenom">Prenom uniquement</option>
          <option value="initiales">Initiales</option>
          <option value="anonyme">Anonyme</option>
        </select>
      </div>

      {/* Visibility */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setVisibility(visibility === "public" ? "prive" : "public")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${visibility === "prive" ? "border-purple-300 bg-purple-50 text-purple-700" : "border-gray-300 bg-white text-gray-600"}`}
        >
          {visibility === "prive" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {visibility === "prive" ? "Avis prive (visible uniquement par MKA.P-MS)" : "Avis public"}
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={ratingGlobal === 0 || loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Publication..." : "Publier mon avis"}
      </button>
    </form>
  );
}
