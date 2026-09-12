import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, History, Search, Car, AlertCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   HISTORIQUE VÉHICULE (/acheter/historique-vehicule)
   Identification technique réelle via trpc.annonces.lookupPlate (déjà en
   production ailleurs sur la plateforme). Le rapport « sinistres / vol /
   gage / entretiens / propriétaires » n'a aucun moteur réel derrière lui —
   aucun registre externe (HistoVec, FNI, assureurs, gage) n'est branché.
   Un écran qui affichait ce rapport comme réel pour n'importe quel VIN
   saisi était un problème de confiance, pas seulement une lacune : il est
   remplacé par une divulgation honnête plutôt qu'un faux plus petit.
   ══════════════════════════════════════════════════════════════════════════ */

export default function HistoriqueVehiculeVente() {
  const [input, setInput] = useState("");
  const [type, setType] = useState<"plaque" | "vin">("plaque");
  const [recherche, setRecherche] = useState(false);

  const lookup = trpc.annonces.lookupPlate.useQuery(
    { type, query: input.trim() },
    { enabled: recherche && input.trim().length >= 4 },
  );

  const rechercher = () => {
    if (input.trim().length < 4) return;
    setRecherche(true);
    lookup.refetch();
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><History size={20} className="text-[#D4AF37]" /> Historique véhicule</h1>
        <p className="mt-1 text-sm text-white/60">VIN ou immatriculation — identification technique</p>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <div className="flex gap-2 mb-2">
          <button onClick={() => setType("plaque")} className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${type === "plaque" ? "bg-[#111] text-white" : "bg-[#F5F3EF] text-[#6B7280]"}`}>Plaque</button>
          <button onClick={() => setType("vin")} className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${type === "vin" ? "bg-[#111] text-white" : "bg-[#F5F3EF] text-[#6B7280]"}`}>VIN</button>
        </div>
        <label className="text-sm font-bold text-[#111]">Recherche par {type === "plaque" ? "immatriculation" : "VIN"}</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-3">
          <Search size={14} className="text-[#6B7280]" />
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setRecherche(false); }}
            placeholder={type === "plaque" ? "AB-123-CD…" : "VF1XXXXXXXXXX"}
            className="w-full bg-transparent text-sm font-semibold outline-none uppercase"
          />
        </div>
        <button
          onClick={rechercher}
          disabled={input.trim().length < 4 || lookup.isFetching}
          className={`mt-3 w-full rounded-xl py-3.5 text-sm font-bold text-white transition ${input.trim().length >= 4 ? "bg-[#D4AF37] active:scale-[0.98]" : "bg-[#D4D4D4]"} disabled:opacity-70`}
        >
          {lookup.isFetching ? "Recherche…" : "Identifier le véhicule"}
        </button>
      </div>

      {recherche && !lookup.isFetching && !lookup.data && (
        <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
          Aucune information technique trouvée pour cette recherche.
        </div>
      )}

      {recherche && lookup.data && (
        <div className="mx-4 mt-4 space-y-3">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
            <Car size={20} className="text-[#D4AF37]" />
            <div>
              <h3 className="text-sm font-bold text-[#111]">{[lookup.data.marque, lookup.data.modele].filter(Boolean).join(" ") || "Véhicule identifié"}{lookup.data.annee ? ` — ${lookup.data.annee}` : ""}</h3>
              <p className="text-[10px] text-[#6B7280]">{[lookup.data.carburant, lookup.data.boite, lookup.data.puissance ? `${lookup.data.puissance} ch` : null].filter(Boolean).join(" · ") || "Détails techniques non disponibles"}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-amber-200 overflow-hidden">
            <div className="bg-amber-50 px-4 py-2 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-700" />
              <h3 className="text-xs font-bold text-amber-800">Rapport d'historique complet non disponible</h3>
            </div>
            <div className="px-4 py-3 text-xs text-[#6B7280] space-y-2">
              <p>Ce que MKA.P-MS peut vérifier aujourd'hui : les caractéristiques techniques ci-dessus, transmises par le service d'identification par plaque/VIN.</p>
              <p>Ce que MKA.P-MS ne vérifie pas encore : sinistres déclarés, déclaration de vol, gage ou opposition, carnet d'entretien, nombre de propriétaires successifs. Ces informations nécessitent une connexion à des registres externes (assureurs, fichier des véhicules gagés/volés, historique constructeur) qui n'est pas encore branchée sur la plateforme.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
