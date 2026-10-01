export type PiecesCartItem = {
  catalogId: number;
  nom: string;
  prixHt: number;
  currency: string;
  quantite: number;
  shopId: number;
};

const KEY = "mkapms_pieces_cart_v1";

export function readPiecesCart(): PiecesCartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PiecesCartItem => Boolean(
      item && typeof item === "object" && typeof (item as PiecesCartItem).catalogId === "number" &&
      typeof (item as PiecesCartItem).nom === "string" && typeof (item as PiecesCartItem).prixHt === "number" &&
      typeof (item as PiecesCartItem).quantite === "number" && typeof (item as PiecesCartItem).shopId === "number",
    ));
  } catch { return []; }
}

export function writePiecesCart(items: PiecesCartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addPieceToCart(item: Omit<PiecesCartItem, "quantite">) {
  const items = readPiecesCart();
  const current = items.find((entry) => entry.catalogId === item.catalogId);
  if (current) current.quantite += 1;
  else items.push({ ...item, quantite: 1 });
  writePiecesCart(items);
  return items;
}
