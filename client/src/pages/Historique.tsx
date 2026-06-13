import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { trpc } from "../lib/trpc";

export default function Historique() {
  const [searchType, setSearchType] = useState<"plate" | "vin">("plate");
  const [value, setValue] = useState("");
  const [done, setDone] = useState(false);
  const req = trpc.historique.requestReport.useMutation({ onSuccess: () => setDone(true) });

  return (
    <div className="container-page py-8">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <ShieldCheck className="text-gold-dark" /> Historique véhicule
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Vérifiez kilométrage, contrôles techniques, sinistres, entretien et score de confiance MKA.P-MS.
      </p>

      <div className="card mt-6 max-w-lg p-6">
        <div className="flex gap-2">
          {(["plate", "vin"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSearchType(t)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${searchType === t ? "bg-gold text-noir" : "bg-slate-100 text-slate-600"}`}
            >
              {t === "plate" ? "Immatriculation" : "VIN"}
            </button>
          ))}
        </div>
        <input
          className="input mt-4"
          placeholder={searchType === "plate" ? "AA-123-BB" : "Numéro VIN (17 caractères)"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          className="btn-primary mt-4 w-full"
          disabled={!value || req.isPending}
          onClick={() => req.mutate({ searchType, searchValue: value })}
        >
          {req.isPending ? "Envoi…" : "Vérifier l'historique"}
        </button>
        {done && (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Demande enregistrée. Le rapport (service payant) sera disponible dans votre compte.
          </p>
        )}
      </div>
    </div>
  );
}
