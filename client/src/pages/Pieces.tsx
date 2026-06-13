import { useState } from "react";
import {
  MapPin, Phone, Package, Search, Filter, ShoppingCart, ChevronDown, ChevronUp,
  Car, Tag, BarChart3, Truck, FileText, AlertTriangle, CheckCircle, Store,
  Plus, Minus, X, Warehouse,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const CATEGORIES = [
  "Freinage", "Moteur", "Transmission", "Échappement", "Suspension",
  "Direction", "Électricité", "Carrosserie", "Éclairage", "Climatisation",
  "Filtration", "Distribution", "Embrayage", "Refroidissement", "Autre",
];

const CONDITIONS = [
  { value: "neuf", label: "Neuf" },
  { value: "occasion", label: "Occasion" },
  { value: "reconditionne", label: "Reconditionné" },
  { value: "echange_standard", label: "Échange standard" },
] as const;

type CartItem = { catalogId: number; nom: string; prixHt: number; currency: string; quantite: number; shopId: number };

export default function Pieces() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [categorie, setCategorie] = useState("");
  const [condition, setCondition] = useState("");
  const [marqueVehicule, setMarqueVehicule] = useState("");
  const [modeleVehicule, setModeleVehicule] = useState("");
  const [anneeVehicule, setAnneeVehicule] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [tab, setTab] = useState<"catalogue" | "boutiques">("catalogue");
  const [selectedPart, setSelectedPart] = useState<number | null>(null);

  const shops = trpc.pieces.shops.useQuery({ limit: 50 });
  const catalog = trpc.pieces.catalog.useQuery({
    q: q || undefined,
    categorie: categorie || undefined,
    condition: (condition || undefined) as "neuf" | undefined,
    marqueVehicule: marqueVehicule || undefined,
    modeleVehicule: modeleVehicule || undefined,
    anneeVehicule: anneeVehicule ? parseInt(anneeVehicule) : undefined,
    limit: 40,
  });
  const partDetail = trpc.pieces.part.useQuery(
    { id: selectedPart! },
    { enabled: selectedPart !== null },
  );

  const createOrder = trpc.pieces.createOrder.useMutation();

  const addToCart = (p: { id: number; nom: string; prixHt: string; currency: string; shopId: number }) => {
    setCart(prev => {
      const existing = prev.find(c => c.catalogId === p.id);
      if (existing) return prev.map(c => c.catalogId === p.id ? { ...c, quantite: c.quantite + 1 } : c);
      return [...prev, { catalogId: p.id, nom: p.nom, prixHt: Number(p.prixHt), currency: p.currency, quantite: 1, shopId: p.shopId }];
    });
  };

  const removeFromCart = (catalogId: number) => setCart(prev => prev.filter(c => c.catalogId !== catalogId));
  const updateCartQty = (catalogId: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.catalogId !== catalogId) return c;
      const nq = c.quantite + delta;
      return nq <= 0 ? c : { ...c, quantite: nq };
    }).filter(c => c.quantite > 0));
  };

  const cartTotal = cart.reduce((s, c) => s + c.prixHt * c.quantite, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantite, 0);

  const handleOrder = async () => {
    if (cart.length === 0) return;
    const shopId = cart[0].shopId;
    try {
      await createOrder.mutateAsync({
        shopId,
        items: cart.map(c => ({ catalogId: c.catalogId, quantite: c.quantite })),
      });
      setCart([]);
      setShowCart(false);
      alert("Commande créée ! Vous pouvez suivre votre commande dans votre espace.");
    } catch (e) {
      alert("Erreur lors de la commande. Veuillez réessayer.");
    }
  };

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-noir">Boutique Pièces Auto</h1>
          <p className="mt-1 text-sm text-slate-500">
            Marketplace professionnelle — références OEM, équipementier, compatibilité véhicule.
          </p>
        </div>
        {user && (
          <button onClick={() => setShowCart(!showCart)} className="btn-gold relative flex items-center gap-2">
            <ShoppingCart size={18} />
            Panier
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button onClick={() => setTab("catalogue")} className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${tab === "catalogue" ? "bg-gold text-noir shadow" : "text-slate-500 hover:text-slate-700"}`}>
          <Package size={16} className="mr-1.5 inline" /> Catalogue
        </button>
        <button onClick={() => setTab("boutiques")} className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${tab === "boutiques" ? "bg-gold text-noir shadow" : "text-slate-500 hover:text-slate-700"}`}>
          <Store size={16} className="mr-1.5 inline" /> Boutiques
        </button>
      </div>

      {/* Cart overlay */}
      {showCart && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold-soft/30 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-noir">
              <ShoppingCart size={18} className="mr-1.5 inline text-gold-dark" /> Panier professionnel
            </h3>
            <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          {cart.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Votre panier est vide.</p>
          ) : (
            <>
              <div className="mt-3 divide-y divide-slate-200">
                {cart.map(c => (
                  <div key={c.catalogId} className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{c.nom}</p>
                      <p className="text-xs text-slate-500">{c.prixHt.toLocaleString("fr-FR")} {c.currency} HT × {c.quantite}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartQty(c.catalogId, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"><Minus size={14} /></button>
                      <span className="min-w-[20px] text-center text-sm font-bold">{c.quantite}</span>
                      <button onClick={() => updateCartQty(c.catalogId, 1)} className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"><Plus size={14} /></button>
                      <button onClick={() => removeFromCart(c.catalogId)} className="ml-2 text-danger hover:text-danger/80"><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                <p className="font-bold text-noir">Total HT : {cartTotal.toLocaleString("fr-FR")} EUR</p>
                <button onClick={handleOrder} disabled={createOrder.isPending} className="btn-acheter">
                  {createOrder.isPending ? "Commande en cours…" : "Commander"}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Le stock est réservé automatiquement pendant la commande.</p>
            </>
          )}
        </div>
      )}

      {tab === "catalogue" && (
        <>
          {/* Search bar */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10"
                placeholder="Rechercher par nom, référence OEM, équipementier, code-barres…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-outline flex items-center gap-1.5">
              <Filter size={16} /> Filtres {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button onClick={() => setShowVehicleSearch(!showVehicleSearch)} className="btn-outline flex items-center gap-1.5">
              <Car size={16} /> Compatibilité véhicule
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
              <div>
                <label className="label">Catégorie</label>
                <select className="input" value={categorie} onChange={e => setCategorie(e.target.value)}>
                  <option value="">Toutes</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">État</label>
                <select className="input" value={condition} onChange={e => setCondition(e.target.value)}>
                  <option value="">Tous</option>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Vehicle compatibility search */}
          {showVehicleSearch && (
            <div className="mt-3 rounded-lg border-2 border-gold/30 bg-gold-soft/20 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-noir">
                <Car size={18} className="text-gold-dark" /> Recherche par véhicule
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="label">Marque</label>
                  <input className="input" placeholder="Ex : Renault, Peugeot…" value={marqueVehicule} onChange={e => setMarqueVehicule(e.target.value)} />
                </div>
                <div>
                  <label className="label">Modèle</label>
                  <input className="input" placeholder="Ex : Clio, 308…" value={modeleVehicule} onChange={e => setModeleVehicule(e.target.value)} />
                </div>
                <div>
                  <label className="label">Année</label>
                  <input className="input" type="number" placeholder="Ex : 2020" value={anneeVehicule} onChange={e => setAnneeVehicule(e.target.value)} />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">Le système propose automatiquement les pièces compatibles avec votre véhicule.</p>
            </div>
          )}

          {/* Results count */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {catalog.data ? `${catalog.data.total} pièce${catalog.data.total > 1 ? "s" : ""} trouvée${catalog.data.total > 1 ? "s" : ""}` : "Chargement…"}
            </p>
            {(marqueVehicule || modeleVehicule || anneeVehicule) && (
              <span className="badge-premium text-xs">
                <CheckCircle size={12} className="mr-1 inline" /> Compatible {marqueVehicule} {modeleVehicule} {anneeVehicule}
              </span>
            )}
          </div>

          {/* Catalog grid */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {catalog.data?.items.map((p) => (
              <div key={p.id} className="card group cursor-pointer p-4 transition hover:border-gold/40 hover:shadow-md" onClick={() => setSelectedPart(p.id)}>
                <div className="grid h-32 w-full place-items-center rounded-lg bg-slate-100 text-slate-400">
                  {p.photoUrl ? <img src={p.photoUrl} alt={p.nom} className="h-full w-full rounded-lg object-cover" /> : <Package size={32} />}
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">{p.nom}</h3>
                <div className="mt-1 space-y-0.5">
                  {p.referenceOem && <p className="text-xs text-slate-400"><Tag size={10} className="mr-1 inline" />OEM {p.referenceOem}</p>}
                  {p.referenceEquipementier && <p className="text-xs text-slate-400">Équip. {p.referenceEquipementier}</p>}
                  {p.categorie && <p className="text-xs text-gold-dark">{p.categorie}</p>}
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold text-gold-dark">{Number(p.prixHt).toLocaleString("fr-FR")} €</p>
                    <p className="text-[10px] text-slate-400">HT</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.condition === "neuf" ? "bg-success/10 text-success" : p.condition === "reconditionne" ? "bg-info/10 text-info" : "bg-slate-100 text-slate-600"}`}>
                    {CONDITIONS.find(c => c.value === p.condition)?.label ?? p.condition}
                  </span>
                </div>
                {user && (
                  <button
                    className="btn-acheter mt-3 w-full text-sm"
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                  >
                    <ShoppingCart size={14} className="mr-1 inline" /> Ajouter au panier
                  </button>
                )}
              </div>
            ))}
          </div>
          {catalog.data && catalog.data.items.length === 0 && (
            <div className="py-16 text-center">
              <Package size={48} className="mx-auto text-slate-300" />
              <p className="mt-3 text-slate-500">Aucune pièce trouvée.</p>
              <p className="text-sm text-slate-400">Essayez d'élargir vos critères de recherche.</p>
            </div>
          )}
        </>
      )}

      {tab === "boutiques" && (
        <>
          <h2 className="mt-6 text-lg font-bold text-slate-800">
            <Store size={20} className="mr-1.5 inline text-gold-dark" /> Boutiques partenaires
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shops.data?.items.map((s) => (
              <div key={s.id} className="card p-5 transition hover:border-gold/40 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gold-soft text-gold-dark">
                    <Store size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{s.nom}</h3>
                    <p className="text-xs uppercase tracking-wide text-gold-dark">{(s.type ?? "").replace(/_/g, " ")}</p>
                  </div>
                </div>
                {s.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{s.description}</p>}
                <div className="mt-3 space-y-1 text-sm text-slate-500">
                  {s.ville && <p className="flex items-center gap-1.5"><MapPin size={14} className="text-gold-dark" /> {s.ville}{s.codePostal ? `, ${s.codePostal}` : ""}</p>}
                  {s.telephone && <p className="flex items-center gap-1.5"><Phone size={14} className="text-gold-dark" /> {s.telephone}</p>}
                  {s.email && <p className="flex items-center gap-1.5 text-xs">✉ {s.email}</p>}
                </div>
                <button className="btn-outline mt-4 w-full text-sm" onClick={() => { setTab("catalogue"); }}>
                  Voir le catalogue →
                </button>
              </div>
            ))}
            {shops.data && shops.data.items.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <Store size={48} className="mx-auto text-slate-300" />
                <p className="mt-3 text-slate-500">Aucune boutique pour le moment.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Part detail modal */}
      {selectedPart !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/40 p-4 backdrop-blur-sm" onClick={() => setSelectedPart(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {partDetail.data ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-noir">{partDetail.data.nom}</h2>
                    {partDetail.data.categorie && <p className="text-sm text-gold-dark">{partDetail.data.categorie}{partDetail.data.sousCategorie ? ` / ${partDetail.data.sousCategorie}` : ""}</p>}
                  </div>
                  <button onClick={() => setSelectedPart(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                {/* Price */}
                <div className="mt-4 rounded-lg bg-gold-soft/30 p-4">
                  <p className="text-2xl font-extrabold text-gold-dark">{Number(partDetail.data.prixHt).toLocaleString("fr-FR")} € <span className="text-sm font-normal text-slate-500">HT</span></p>
                  {partDetail.data.prixTtc && <p className="text-sm text-slate-500">{Number(partDetail.data.prixTtc).toLocaleString("fr-FR")} € TTC (TVA {partDetail.data.tvaRate}%)</p>}
                </div>

                {/* References */}
                <div className="mt-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700"><Tag size={14} /> Références</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded bg-slate-50 p-2"><span className="text-xs text-slate-400">Réf. interne</span><br /><span className="font-mono font-semibold">{partDetail.data.referenceInterne}</span></div>
                    {partDetail.data.referenceOem && <div className="rounded bg-slate-50 p-2"><span className="text-xs text-slate-400">Réf. OEM</span><br /><span className="font-mono font-semibold">{partDetail.data.referenceOem}</span></div>}
                    {partDetail.data.referenceEquipementier && <div className="rounded bg-slate-50 p-2"><span className="text-xs text-slate-400">Équipementier</span><br /><span className="font-mono font-semibold">{partDetail.data.referenceEquipementier}</span></div>}
                    {partDetail.data.codeBarre && <div className="rounded bg-slate-50 p-2"><span className="text-xs text-slate-400">Code-barres</span><br /><span className="font-mono font-semibold">{partDetail.data.codeBarre}</span></div>}
                  </div>
                </div>

                {/* Stock */}
                <div className="mt-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700"><Warehouse size={14} /> Stock</h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-success/10 p-3">
                      <p className="text-2xl font-extrabold text-success">{partDetail.data.stockDisponible}</p>
                      <p className="text-xs text-slate-500">Disponible</p>
                    </div>
                    <div className="rounded-lg bg-warning/10 p-3">
                      <p className="text-2xl font-extrabold text-warning">{partDetail.data.stockReserve}</p>
                      <p className="text-xs text-slate-500">Réservé</p>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-3">
                      <p className="text-2xl font-extrabold text-slate-700">{partDetail.data.stockTotal}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                  </div>
                  {partDetail.data.stocks.length > 0 && partDetail.data.stocks[0].entrepot && (
                    <p className="mt-2 text-xs text-slate-400">
                      📍 {partDetail.data.stocks[0].entrepot}
                      {partDetail.data.stocks[0].rayon ? ` → Rayon ${partDetail.data.stocks[0].rayon}` : ""}
                      {partDetail.data.stocks[0].etagere ? ` → Étagère ${partDetail.data.stocks[0].etagere}` : ""}
                    </p>
                  )}
                </div>

                {/* Vehicle compatibility */}
                {partDetail.data.compatibilites.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700"><Car size={14} /> Compatibilité véhicule</h3>
                    <div className="space-y-1">
                      {partDetail.data.compatibilites.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 rounded bg-info/5 px-3 py-1.5 text-sm">
                          <CheckCircle size={14} className="text-success" />
                          <span className="font-semibold">{c.marque}</span>
                          {c.modele && <span className="text-slate-600">{c.modele}</span>}
                          {c.moteur && <span className="text-xs text-slate-400">({c.moteur})</span>}
                          {(c.anneeDebut || c.anneeFin) && (
                            <span className="text-xs text-slate-400">{c.anneeDebut ?? "…"}–{c.anneeFin ?? "…"}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dimensions */}
                {(partDetail.data.poidsKg || partDetail.data.longueurCm) && (
                  <div className="mt-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700"><Truck size={14} /> Dimensions & Poids</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      {partDetail.data.poidsKg && <span>⚖ {partDetail.data.poidsKg} kg</span>}
                      {partDetail.data.longueurCm && <span>📏 {partDetail.data.longueurCm} cm</span>}
                      {partDetail.data.largeurCm && <span>↔ {partDetail.data.largeurCm} cm</span>}
                      {partDetail.data.hauteurCm && <span>↕ {partDetail.data.hauteurCm} cm</span>}
                    </div>
                  </div>
                )}

                {partDetail.data.description && (
                  <div className="mt-4">
                    <h3 className="mb-1 text-sm font-bold text-slate-700">Description</h3>
                    <p className="text-sm text-slate-600">{partDetail.data.description}</p>
                  </div>
                )}

                {user && (
                  <button
                    className="btn-acheter mt-6 w-full"
                    onClick={() => {
                      addToCart({
                        id: partDetail.data!.id,
                        nom: partDetail.data!.nom,
                        prixHt: partDetail.data!.prixHt,
                        currency: partDetail.data!.currency,
                        shopId: partDetail.data!.shopId,
                      });
                      setSelectedPart(null);
                      setShowCart(true);
                    }}
                  >
                    <ShoppingCart size={16} className="mr-1.5 inline" /> Ajouter au panier
                  </button>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">Chargement…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
