import { Shield } from "lucide-react";

interface TrustScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function getColor(score: number): string {
  if (score >= 90) return "text-emerald-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getBgColor(score: number): string {
  if (score >= 90) return "bg-emerald-50 border-emerald-200";
  if (score >= 70) return "bg-blue-50 border-blue-200";
  if (score >= 50) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export default function TrustScore({ score, size = "md" }: TrustScoreProps) {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-base px-4 py-2" : "text-sm px-3 py-1";
  const iconSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${getBgColor(score)} ${getColor(score)} ${sizeClasses}`}>
      <Shield className={iconSize} />
      {score}/100
    </span>
  );
}
