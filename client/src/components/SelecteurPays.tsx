/**
 * Sélecteur de pays recherchable par mots-clés.
 *
 * Remplace le <select> natif pour une liste longue (liste mondiale ≈190
 * pays) : taper un ou deux caractères filtre immédiatement, au lieu de
 * faire défiler une liste alphabétique entière.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

export interface SelecteurPaysOption {
  code: string;
  nameFr: string;
  nameEn?: string;
}

function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function SelecteurPays({
  options,
  value,
  onChange,
  placeholder = "Rechercher un pays…",
}: {
  options: SelecteurPaysOption[];
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const conteneurRef = useRef<HTMLDivElement>(null);

  const selection = options.find((o) => o.code === value) ?? null;

  useEffect(() => {
    function onClickExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
        setRecherche("");
      }
    }
    document.addEventListener("mousedown", onClickExterieur);
    return () => document.removeEventListener("mousedown", onClickExterieur);
  }, []);

  const resultats = useMemo(() => {
    const q = normaliser(recherche.trim());
    if (!q) return options;
    return options.filter(
      (o) =>
        normaliser(o.nameFr).includes(q) ||
        normaliser(o.nameEn ?? "").includes(q) ||
        normaliser(o.code).includes(q),
    );
  }, [options, recherche]);

  return (
    <div ref={conteneurRef} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="w-full flex items-center justify-between rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white text-left"
      >
        <span className={selection ? "text-[#111]" : "text-[#9CA3AF]"}>
          {selection ? selection.nameFr : "Sélectionner un pays"}
        </span>
        <ChevronDown size={14} className="text-[#6B7280] shrink-0" />
      </button>

      {ouvert && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#E5E7EB] bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-3 py-2">
            <Search size={14} className="text-[#9CA3AF] shrink-0" />
            <input
              autoFocus
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOuvert(false);
                  setRecherche("");
                } else if (e.key === "Enter" && resultats.length > 0) {
                  onChange(resultats[0].code);
                  setOuvert(false);
                  setRecherche("");
                }
              }}
              placeholder={placeholder}
              className="w-full text-sm outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {resultats.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-[#9CA3AF]">Aucun pays trouvé.</p>
            )}
            {resultats.map((o) => (
              <button
                key={o.code}
                type="button"
                onClick={() => {
                  onChange(o.code);
                  setOuvert(false);
                  setRecherche("");
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#F5F3EF] ${
                  o.code === value ? "bg-[#F5F3EF] font-bold text-[#111]" : "text-[#374151]"
                }`}
              >
                {o.nameFr}
                <span className="text-[11px] text-[#9CA3AF]">{o.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
