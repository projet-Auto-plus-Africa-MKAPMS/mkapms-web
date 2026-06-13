// Références uniques lisibles (Partie 6). Chaque annonce et chaque compte a sa
// propre référence stable, affichée dans l'interface et utilisable au support.
//   annonce → MKA-A-000123
//   compte  → MKA-U-000123
export function makeReference(prefix: "A" | "U", id: number): string {
  return `MKA-${prefix}-${String(id).padStart(6, "0")}`;
}
