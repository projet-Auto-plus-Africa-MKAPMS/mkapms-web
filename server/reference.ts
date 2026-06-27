// Références uniques lisibles (Partie 6). Chaque annonce et chaque compte a sa
// propre référence stable, affichée dans l'interface et utilisable au support.
//   annonce → MKA-A-000123
//   compte  → MKA-U-000123
//   litige  → MKA-L-000123 (Partie 8)
//   achat   → MKA-PO-000123 (Partie 24)
export function makeReference(prefix: "A" | "U" | "L" | "PO", id: number): string {
  return `MKA-${prefix}-${String(id).padStart(6, "0")}`;
}
