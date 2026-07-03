interface ReviewBadgeProps {
  label: string;
  icon: string;
  color?: string;
}

export default function ReviewBadge({ label, icon, color = "#FFD700" }: ReviewBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border"
      style={{ borderColor: color, backgroundColor: `${color}15`, color }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}
