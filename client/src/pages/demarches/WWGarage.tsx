import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Key, Check } from "lucide-react";
import { trpc } from "../../lib/trpc";

/** Données réelles : trpc.carteGrise.createDossier (type "w_garage", table cg_dossiers). Pas de notion d'expiration dans le schéma : jamais inventée. */
export default function WWGarage() {
  const utils = trpc.useUtils();
  const [immatriculation, setImmatriculation] = useState("");

  const mesDossiers = trpc.carteGrise.mesDossiers.useQuery();
  const mesDemandes = (mesDossiers.data ?? []).filter((d) => d.type === "w_garage");

  const create = trpc.carteGrise.createDossier.useMutation({
    onSuccess: () => { setImmatriculation(""); utils.carteGrise.mesDossiers.invalidate(); },
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gray-800 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Key size={20} /> WW Garage</h1><p className="mt-1 text-sm text-white/80">Réservé aux professionnels</p></div>

      {mesDossiers.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {mesDemandes.map((d) => (
          <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex justify-between">
              <h3 className="text-sm font-bold text-[#111]">{d.reference}{d.immatriculation ? ` — ${d.immatriculation}` : ""}</h3>
              <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[9px] font-bold text-gray-600">{d.status.replace(/_/g, " ")}</span>
            </div>
            <p className="text-[10px] text-[#6B7280] mt-0.5">Créé le {new Date(d.dateCreation).toLocaleDateString("fr-FR")}</p>
          </div>
        ))}
        {!mesDossiers.isLoading && mesDemandes.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-4">Aucune demande WW pour le moment.</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!immatriculation.trim()) return;
          create.mutate({ type: "w_garage", immatriculation });
        }}
        className="mx-4 mt-3 rounded-xl border-2 border-dashed border-gray-400 p-3 space-y-2"
      >
        <input value={immatriculation} onChange={(e) => setImmatriculation(e.target.value)} placeholder="Plaque du véhicule" required className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
        <button type="submit" disabled={create.isPending || !immatriculation.trim()} className="w-full rounded-lg bg-gray-800 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {create.isPending ? "Envoi…" : "Nouvelle demande WW"}
        </button>
        {create.isError && <p className="text-xs font-semibold text-red-600">{create.error.message}</p>}
        {create.isSuccess && <p className="text-xs font-semibold text-green-600 flex items-center gap-1"><Check size={12} /> Demande {create.data.reference} envoyée.</p>}
      </form>
    </div>
  );
}
