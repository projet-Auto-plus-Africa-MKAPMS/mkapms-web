import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, History, Search, Car, FileText, Clock, Check, X } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   HISTORIQUE VÉHICULE (/acheter/historique-vehicule)
   Identification technique réelle via trpc.annonces.lookupPlate (déjà en
   production ailleurs sur la plateforme). Le rapport détaillé (sinistres,
   contrôles techniques, propriétaires, entretien, rappels constructeur)
   a un vrai moteur de demande (server/routers/historique.ts, table
   vehicle_reports) : la demande, le stockage et le statut sont réels.
   Ce qui reste réellement absent : le vol et le gage n'ont aucun champ
   dans ce moteur, et aucune connexion à un registre externe (assureurs,
   fichier des véhicules gagés/volés) ne remplit encore automatiquement
   les champs du rapport — une demande reste « en attente » jusqu'à
   traitement, jamais affichée comme un rapport déjà établi.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT_RAPPORT: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  en_attente: { label: "En attente de traitement", icon: Clock, color: "text-amber-600 bg-amber-50" },
  pret: { label: "Rapport prêt", icon: Check, color: "text-green-600 bg-green-50" },
  echec: { label: "Rapport indisponible", icon: X, color: "text-red-600 bg-red-50" },
};

export default function HistoriqueVehiculeVente() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [type, setType] = useState<"plaque" | "vin">("plaque");
  const [recherche, setRecherche] = useState(false);

  const lookup = trpc.annonces.lookupPlate.useQuery(
    { type, query: input.trim() },
    { enabled: recherche && input.trim().length >= 4 },
  );
  const mesRapports = trpc.historique.myReports.useQuery(undefined, { enabled: !!user });
  const demanderRapport = trpc.historique.requestReport.useMutation({ onSuccess: () => mesRapports.refetch() });

  const rechercher = () => {
    if (input.trim().length < 4) return;
    setRecherche(true);
    lookup.refetch();
  };

  const demander = () => {
    if (input.trim().length < 4) return;
    demanderRapport.mutate({ searchType: type === "plaque" ? "plate" : "vin", searchValue: input.trim() });
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

          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-4 py-2">
              <h3 className="text-xs font-bold text-[#D4AF37]">Rapport détaillé (sinistres, contrôles techniques, propriétaires, entretien)</h3>
            </div>
            <div className="px-4 py-3 text-xs text-[#6B7280] space-y-2">
              <p>Ce rapport n'est pas généré instantanément : chaque demande est enregistrée puis traitée. Le vol et le gage ne font partie d'aucun champ vérifié aujourd'hui, quel que soit l'état de la demande.</p>
              {user ? (
                <button
                  onClick={demander}
                  disabled={demanderRapport.isPending}
                  className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileText size={14} /> {demanderRapport.isPending ? "Envoi…" : "Demander le rapport détaillé"}
                </button>
              ) : (
                <p><Link to="/connexion" className="font-bold text-[#D4AF37] underline">Connectez-vous</Link> pour demander un rapport et suivre son traitement.</p>
              )}
              {demanderRapport.error && <p className="text-red-600">{demanderRapport.error.message}</p>}
            </div>
          </div>
        </div>
      )}

      {user && (mesRapports.data ?? []).length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-sm font-bold text-[#111]">Mes demandes de rapport</h2>
          <div className="mt-2 space-y-2">
            {(mesRapports.data ?? []).map((r) => {
              const s = STATUT_RAPPORT[r.status] ?? STATUT_RAPPORT.en_attente;
              const SIcon = s.icon;
              return (
                <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#111]">{r.searchType === "plate" ? "Plaque" : "VIN"} : {r.searchValue}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color}`}>
                      <SIcon size={10} /> {s.label}
                    </span>
                  </div>
                  {r.status === "pret" && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] text-[#374151]">
                      {r.kilometrage != null && <p><span className="text-[#9CA3AF]">Kilométrage :</span> {r.kilometrage.toLocaleString("fr-FR")} km</p>}
                      {r.controlesTechniques && <p><span className="text-[#9CA3AF]">Contrôles techniques :</span> {r.controlesTechniques}</p>}
                      {r.sinistres && <p><span className="text-[#9CA3AF]">Sinistres :</span> {r.sinistres}</p>}
                      {r.proprietaires && <p><span className="text-[#9CA3AF]">Propriétaires :</span> {r.proprietaires}</p>}
                      {r.entretien && <p><span className="text-[#9CA3AF]">Entretien :</span> {r.entretien}</p>}
                      {r.rappelsConstructeur && <p><span className="text-[#9CA3AF]">Rappels :</span> {r.rappelsConstructeur}</p>}
                    </div>
                  )}
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
