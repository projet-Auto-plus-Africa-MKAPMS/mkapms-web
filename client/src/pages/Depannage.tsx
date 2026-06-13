import { MapPin, Wrench, Star } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function Depannage() {
  const providers = trpc.depannage.providers.useQuery({ limit: 40 });

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Dépannage / Assistance</h1>
      <p className="mt-1 text-sm text-slate-500">
        Assistance routière : demande de dépannage géolocalisée, devis et suivi d'intervention.
      </p>

      <div className="mt-6 rounded-xl bg-gold-soft/30 p-5">
        <h2 className="flex items-center gap-2 font-bold text-slate-800"><Wrench size={18} /> Besoin d'un dépanneur ?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connectez-vous pour créer une demande (type de panne, localisation, photos, urgence).
        </p>
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-800">Dépanneurs disponibles</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {providers.data?.map((p) => (
          <div key={p.id} className="card p-5">
            <h3 className="font-bold text-slate-900">{p.nom}</h3>
            {p.zone && <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} /> {p.zone}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
              <Star size={14} className="fill-amber-400 text-amber-400" /> {Number(p.rating || 0).toFixed(1)}
            </p>
          </div>
        ))}
        {providers.data && providers.data.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-500">Aucun dépanneur inscrit pour le moment.</p>
        )}
      </div>
    </div>
  );
}
