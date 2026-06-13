import { Ship, Warehouse } from "lucide-react";
import { trpc } from "../lib/trpc";

const STATUTS = ["acheté", "préparé", "chargé", "en transit", "port", "douane", "entrepôt", "livré"];

export default function ImportAfrica() {
  const warehouses = trpc.importAfrica.warehouses.useQuery();

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Import Africa+</h1>
      <p className="mt-1 text-sm text-slate-500">
        Achat en Europe → livraison en Afrique. Transport personnel ou transport MKA.P-MS avec suivi complet.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-bold text-slate-800"><Ship size={18} /> Options de transport</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><strong>Option A — Transporteur personnel :</strong> vous payez le véhicule, recevez un code de retrait, votre transporteur récupère.</li>
            <li><strong>Option B — Transport MKA.P-MS :</strong> devis transport, suivi complet, documents, livraison entrepôt ou port.</li>
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-slate-800">Suivi étape par étape</h2>
          <ol className="mt-3 flex flex-wrap gap-2 text-sm">
            {STATUTS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">{i + 1}</span>
                <span className="text-slate-600">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <h2 className="mt-10 flex items-center gap-2 text-lg font-bold text-slate-800"><Warehouse size={18} /> Entrepôts</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {warehouses.data?.map((w) => (
          <div key={w.id} className="card p-5">
            <h3 className="font-bold text-slate-900">{w.nom}</h3>
            <p className="mt-1 text-sm text-slate-500">{[w.ville, w.countryCode].filter(Boolean).join(", ")}</p>
          </div>
        ))}
        {warehouses.data && warehouses.data.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-500">Entrepôts à venir (Guinée, Sénégal, Côte d'Ivoire).</p>
        )}
      </div>
    </div>
  );
}
