import { useState } from "react";
import { MapPin, Phone, Star, BadgeCheck } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function Garages() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const list = trpc.garages.list.useQuery({ q: q || undefined, city: city || undefined, limit: 60 });

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Réseau de garages partenaires</h1>
      <p className="mt-1 text-sm text-slate-500">
        {list.data ? `${list.data.total} garage(s)` : "Chargement…"} — certifiés MKA.P-MS.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input className="input" placeholder="Nom du garage" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className="input" placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {list.data?.items.map((g) => (
          <div key={g.id} className="card p-5">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-slate-900">{g.name}</h3>
              {g.featured && <BadgeCheck className="text-gold-dark" size={18} />}
            </div>
            {g.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{g.description}</p>}
            <div className="mt-3 space-y-1 text-sm text-slate-500">
              {(g.city || g.addressLine) && (
                <p className="flex items-center gap-1.5">
                  <MapPin size={14} /> {[g.addressLine, g.postalCode, g.city].filter(Boolean).join(", ")}
                </p>
              )}
              {g.phone && <p className="flex items-center gap-1.5"><Phone size={14} /> {g.phone}</p>}
              <p className="flex items-center gap-1.5">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {Number(g.rating || 0).toFixed(1)} ({g.reviewCount || 0} avis)
              </p>
            </div>
          </div>
        ))}
        {list.data && list.data.items.length === 0 && (
          <p className="col-span-full py-12 text-center text-slate-500">Aucun garage trouvé.</p>
        )}
      </div>
    </div>
  );
}
