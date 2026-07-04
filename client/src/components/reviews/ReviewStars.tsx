import { Star } from "lucide-react";

interface ReviewStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizes = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" };

export default function ReviewStars({ rating, maxRating = 5, size = "md", interactive = false, onChange }: ReviewStarsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          >
            <Star
              className={`${sizes[size]} ${filled ? "fill-amber-400 text-amber-400" : half ? "fill-amber-200 text-amber-400" : "fill-gray-200 text-gray-300"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
