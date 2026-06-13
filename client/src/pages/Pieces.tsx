import { useState } from "react";
import { MapPin, Phone, Package } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function Pieces() {
  const [q, setQ] = useState("");
  const shops = trpc.pieces.shops.useQuery({ limit: 30 });
  const catalog = trpc.pieces.catalog.useQuery({ q: q || undefined, limit: 40 });

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Pièces Auto</h1>
      <p className="mt-1 text-sm text-slate-500">
        Marketplace de pièces : magasins, casses, grossistes — références OEM & équipementier.
      </p>

      <div className="mt-6">
        <input className="input" placeholder="Rechercher une pièce (référence, nom)…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-800">Boutiques</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {shops.data?.items.map((s) => (
          <div key={s.id} className="card p-5">
            <h3 className="font-bold text-slate-900">{s.nom}</h3>
            <p className="mt-1 text-xs uppercase tracking-wide text-gold-dark">{s.type}</p>
            {s.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{s.description}</p>}
            <div className="mt-3 space-y-1 text-sm text-slate-500">
              {s.ville && <p className="flex items-center gap-1.5"><MapPin size={14} /> {s.ville}</p>}
              {s.telephone && <p className="flex items-center gap-1.5"><Phone size={14} /> {s.telephone}</p>}
            </div>
          </div>
        ))}
        {shops.data && shops.data.items.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-500">Aucune boutique pour le moment.</p>
        )}
      </div>

      <h2 className="mt-10 text-lg font-bold text-slate-800">Catalogue</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-4">
        {catalog.data?.items.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="grid h-28 w-full place-items-center rounded-lg bg-slate-100 text-slate-400">
              {p.photoUrl ? <img src={p.photoUrl} alt={p.nom} className="h-full w-full rounded-lg object-cover" /> : <Package />}
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">{p.nom}</h3>
            {p.oemRef && <p className="text-xs text-slate-400">OEM {p.oemRef}</p>}
            <p className="mt-1 font-bold text-gold-dark">{Number(p.prixHt).toLocaleString("fr-FR")} {p.currency} HT</p>
          </div>
        ))}
        {catalog.data && catalog.data.items.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-500">Aucune pièce trouvée.</p>
        )}
      </div>
    </div>
  );
}
