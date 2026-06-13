import { useState } from "react";
import { Car } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function VtcTaxi() {
  const [type, setType] = useState<"" | "vtc" | "taxi" | "mixte">("");
  const companies = trpc.transport.companies.useQuery({ type: type || undefined, limit: 40 });

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">VTC / TAXI</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sociétés VTC et Taxi, flottes et chauffeurs. Réservez une course ou demandez une disponibilité.
      </p>

      <div className="mt-6 flex gap-2">
        {(["", "vtc", "taxi", "mixte"] as const).map((t) => (
          <button
            key={t || "all"}
            onClick={() => setType(t)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${type === t ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {t === "" ? "Tous" : t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {companies.data?.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand"><Car size={18} /></span>
              <h3 className="font-bold text-slate-900">{c.nom}</h3>
            </div>
            <p className="mt-2 text-xs uppercase tracking-wide text-brand">{c.type}</p>
            {c.countryCode && <p className="mt-1 text-sm text-slate-500">{c.countryCode}</p>}
          </div>
        ))}
        {companies.data && companies.data.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-500">Aucune société pour le moment.</p>
        )}
      </div>
    </div>
  );
}
