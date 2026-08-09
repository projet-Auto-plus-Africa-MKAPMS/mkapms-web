import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";

/**
 * Ligne de recherche commune aux portails : champ, accès aux filtres et bouton
 * « Rechercher » toujours visible. Une barre seule, sans filtre ni bouton, n'est
 * plus possible avec ce composant.
 */
export default function SearchLine({
  value,
  onChange,
  onSearch,
  placeholder,
  showFilters,
  onToggleFilters,
  activeCount = 0,
  accent = "bg-[#D4AF37]",
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  placeholder: string;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeCount?: number;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
        <Search size={14} className="text-[#6B7280]" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      <button
        type="button"
        onClick={onToggleFilters}
        aria-label="Afficher les filtres"
        className="relative flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-2.5 text-[11px] font-bold text-[#111]"
      >
        <SlidersHorizontal size={14} className="text-[#6B7280]" />
        Filtres
        <ChevronDown size={12} className={`text-[#6B7280] transition-transform ${showFilters ? "rotate-180" : ""}`} />
        {activeCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onSearch}
        className={`rounded-lg ${accent} px-3 py-2.5 text-[11px] font-bold text-white active:scale-[0.98] transition`}
      >
        Rechercher
      </button>
    </div>
  );
}
