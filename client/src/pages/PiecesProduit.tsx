import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Car, CheckCircle2, ClipboardCheck, FileText, Heart, Package, ShieldCheck, ShoppingCart, Truck, Warehouse } from "lucide-react";
import { trpc } from "../lib/trpc";
import { addPieceToCart } from "../lib/piecesCartStore";
import { useReportNavigation } from "../lib/redirect";

export default function PiecesProduit() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const signaler = useReportNavigation();
  const [quantity, setQuantity] = useState(1);
  const part = trpc.pieces.part.useQuery({ id }, { enabled: Number.isInteger(id) && id > 0 });
  if (part.isLoading) return <div className="container-page py-12 text-slate-500">Chargement de la pièce…</div>;
  if (!part.data) return <div className="container-page py-12"><Link className="btn-outline" to="/pieces">Retour au catalogue</Link><p className="mt-5 text-slate-600">Cette pièce n’est plus disponible.</p></div>;
  const p = part.data;
  const add = () => {
    for (let i = 0; i < quantity; i++) addPieceToCart({ catalogId: p.id, nom: p.nom, prixHt: Number(p.prixHt), currency: p.currency, shopId: p.shopId });
    signaler("pieces_panier", "/pieces?panier=1");
    navigate("/pieces?panier=1");
  };
  return <div className="container-page py-6 pb-28">
    <Link to="/pieces" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-gold-dark"><ArrowLeft size={16}/> Retour au catalogue</Link>
    <p className="mt-4 text-xs text-slate-500">Catalogue › {p.categorie ?? "Pièces"} › {p.nom}</p>
    <div className="mt-3 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <section className="card overflow-hidden p-4"><div className="grid aspect-[4/3] place-items-center rounded-xl bg-slate-100 text-slate-400">{p.photoUrl ? <img src={p.photoUrl} alt={p.nom} className="h-full w-full object-contain"/> : <><Package size={72}/><span className="mt-3 text-xs">Illustration de produit indisponible</span></>}</div><p className="mt-3 text-xs text-slate-400">Les visuels et prix sont fournis par le vendeur.</p></section>
      <aside className="card h-fit p-5"><p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">{p.categorie ?? "Pièce automobile"}</p><h1 className="mt-1 text-2xl font-extrabold text-noir">{p.nom}</h1><p className="mt-2 text-xs text-slate-500">Réf. {p.referenceInterne}{p.referenceOem ? ` · OEM ${p.referenceOem}` : ""}</p><div className="mt-5 rounded-xl bg-gold-soft/40 p-4"><p className="text-3xl font-extrabold text-gold-dark">{Number(p.prixTtc ?? p.prixHt).toLocaleString("fr-FR")} {p.currency} <span className="text-sm font-semibold">TTC</span></p><p className="mt-1 text-xs text-slate-500">{Number(p.prixHt).toLocaleString("fr-FR")} {p.currency} HT</p></div><p className="mt-4 flex items-center gap-2 text-sm font-semibold"><Warehouse size={17} className="text-gold-dark"/>{p.stockDisponible > 0 ? `${p.stockDisponible} en stock` : "Disponibilité à confirmer"}</p><div className="mt-4 flex items-center gap-3"><label className="text-sm font-semibold">Quantité</label><button className="rounded border px-2" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button className="rounded border px-2" onClick={() => setQuantity(quantity + 1)}>+</button></div><button onClick={add} className="btn-acheter mt-5 w-full" disabled={p.stockDisponible <= 0}><ShoppingCart size={18} className="mr-2 inline"/>Ajouter au panier</button><button onClick={() => navigate("/livraison")} className="btn-outline mt-2 w-full"><Truck size={16} className="mr-2 inline"/>Calculer la livraison</button><button className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-600"><Heart size={16}/> Ajouter aux favoris</button></aside>
    </div>
    <section className="mt-6 grid gap-5 lg:grid-cols-3"><div className="card p-5 lg:col-span-2"><h2 className="text-lg font-extrabold text-noir">Description du produit</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{p.description || "La description technique sera communiquée par le vendeur avant commande."}</p><h2 className="mt-7 text-lg font-extrabold text-noir">Caractéristiques techniques</h2><dl className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border text-sm"><dt className="bg-slate-50 p-3 font-semibold">Type</dt><dd className="p-3">{p.condition}</dd><dt className="bg-slate-50 p-3 font-semibold">Référence OEM</dt><dd className="p-3">{p.referenceOem ?? "Non renseignée"}</dd><dt className="bg-slate-50 p-3 font-semibold">Dimensions</dt><dd className="p-3">{[p.longueurCm && `${p.longueurCm} cm`, p.largeurCm && `${p.largeurCm} cm`, p.hauteurCm && `${p.hauteurCm} cm`].filter(Boolean).join(" × ") || "Non renseignées"}</dd><dt className="bg-slate-50 p-3 font-semibold">Poids</dt><dd className="p-3">{p.poidsKg ? `${p.poidsKg} kg` : "Non renseigné"}</dd></dl></div><div className="space-y-4"><div className="card p-5"><h2 className="flex items-center gap-2 font-extrabold"><Car size={18} className="text-gold-dark"/> Compatibilité</h2><p className="mt-2 text-sm text-slate-600">Vérifiez votre plaque ou votre VIN avant la commande.</p><Link to="/pieces" className="btn-primary mt-4 w-full">Vérifier mon véhicule</Link></div><div className="card p-5"><h2 className="font-extrabold">Documents et services</h2><Link to="/pieces/retours-pieces" className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><ShieldCheck size={16}/> Garantie et retours</Link><Link to="/livraison" className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Truck size={16}/> Livraison</Link><Link to="/aide" className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><FileText size={16}/> Besoin d’aide</Link></div></div></section>
    <section className="mt-6 rounded-xl border border-info/20 bg-info/5 p-4 text-sm text-slate-700"><ClipboardCheck size={17} className="mr-2 inline text-info"/>Comparez la référence, les dimensions et la compatibilité véhicule avant de commander.</section>
  </div>;
}
