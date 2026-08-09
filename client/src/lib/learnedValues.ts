import { useMemo } from "react";
import { trpc } from "./trpc";

/**
 * Mémoire du Système Intelligent réutilisée dans les formulaires.
 *
 * Une version saisie à la main est apprise côté serveur ; sans ce branchement
 * elle n'était jamais reproposée et l'utilisateur devait la retaper à chaque
 * dépôt et à chaque modification. Les valeurs rejetées par la Direction ne
 * remontent pas.
 */
export function useLearnedValues(
  field: string,
  marque?: string,
  modele?: string,
): string[] {
  const enabled = Boolean(marque && modele);
  const q = trpc.smartEngine.reusableValues.useQuery(
    { field, marque: marque || undefined, modele: modele || undefined },
    { enabled, staleTime: 60_000 },
  );

  return useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of q.data ?? []) {
      const v = (row.value ?? "").trim();
      const key = v.toLowerCase();
      if (v && !seen.has(key)) {
        seen.add(key);
        out.push(v);
      }
    }
    return out;
  }, [q.data]);
}

/** Fusionne les valeurs du catalogue et celles apprises, sans doublon. */
export function mergeWithLearned(catalogue: string[], learned: string[]): string[] {
  const seen = new Set(catalogue.map((v) => v.trim().toLowerCase()));
  return [...catalogue, ...learned.filter((v) => !seen.has(v.trim().toLowerCase()))];
}
