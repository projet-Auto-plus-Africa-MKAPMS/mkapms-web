import { useState } from "react";
import { Link } from "react-router-dom";
import { getAnnonceUrl } from "../../lib/annonceUrl";
import {
  ChevronLeft,
  Package,
  Clock,
  ChevronDown,
  Eye,
  FileText,
  FileSignature,
  Plus,
} from "lucide-react";
import { trpc } from "../../lib/trpc";

/** Statuts réels d'une annonce véhicule (enum annonce_status côté serveur). */
const STATUTS: Record<string, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "bg-gray-400" },
  en_validation: { label: "En validation", color: "bg-amber-500" },
  publiee: { label: "Publiée", color: "bg-green-600" },
  vendue: { label: "Vendue", color: "bg-green-800" },
  louee: { label: "Louée", color: "bg-emerald-600" },
  expiree: { label: "Expirée", color: "bg-slate-500" },
  refusee: { label: "Refusée", color: "bg-red-600" },
  archivee: { label: "Archivée", color: "bg-gray-600" },
};

function statutDe(id: string) {
  return STATUTS[id] ?? { label: id, color: "bg-gray-400" };
}

export default function GestionStockVO() {
  const [filterStatut, setFilterStatut] = useState("tous");
  const [selectedVeh, setSelectedVeh] = useState<number | null>(null);

  const stock = trpc.voEspaces.stock.useQuery({});
  const statuts = trpc.voEspaces.statuts.useQuery();

  const vehicules = stock.data ?? [];
  const filtered =
    filterStatut === "tous" ? vehicules : vehicules.filter((v) => v.status === filterStatut);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Tableau de bord
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Package size={20} /> Mon stock VO
        </h1>
        <p className="mt-1 text-sm text-white/80">
          {stock.isLoading
            ? "Chargement de votre stock…"
            : `${vehicules.length} véhicule${vehicules.length > 1 ? "s" : ""} dans votre stock`}
        </p>
      </div>

      {/* Filtres : uniquement les statuts réellement présents dans le stock. */}
      {(statuts.data?.length ?? 0) > 0 && (
        <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilterStatut("tous")}
            className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-bold ${filterStatut === "tous" ? "bg-blue-800 text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}
          >
            Tous
          </button>
          {(statuts.data ?? []).map((id) => {
            const s = statutDe(id);
            return (
              <button
                key={id}
                onClick={() => setFilterStatut(id)}
                className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-bold flex items-center gap-1 ${filterStatut === id ? "bg-blue-800 text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="px-4 mt-3 space-y-2">
        {stock.isLoading && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-6 text-center text-sm text-[#6B7280]">
            Chargement…
          </div>
        )}

        {!stock.isLoading && vehicules.length === 0 && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-8 text-center">
            <Package size={28} className="mx-auto text-[#D4AF37]" />
            <h2 className="mt-3 text-base font-bold text-[#111]">Votre stock est vide</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Aucun véhicule enregistré sur votre compte. Ajoutez votre premier véhicule pour
              lancer le suivi des étapes.
            </p>
            <Link
              to="/acheter/depot-annonce"
              className="btn-primary mt-5 inline-flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Ajouter un véhicule
            </Link>
          </div>
        )}

        {filtered.map((v) => {
          const s = statutDe(v.status);
          const titre = v.titre || `${v.marque} ${v.modele}`;
          return (
            <div
              key={v.id}
              className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setSelectedVeh(selectedVeh === v.id ? null : v.id)}
                className="w-full p-3 flex items-center gap-3 text-left"
              >
                {v.photo ? (
                  <img src={v.photo} alt="" className="w-16 h-11 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-11 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                    <Package size={16} className="text-[#9CA3AF]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#111] truncate">{titre}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-bold text-white ${s.color}`}
                    >
                      {s.label}
                    </span>
                    <span className="text-[8px] text-[#9CA3AF]">
                      {new Date(v.majLe).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                    <span className="text-[8px] text-[#9CA3AF]">{v.vues} vue(s)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-blue-800">
                    {v.prix.toLocaleString("fr-FR")} {v.devise === "EUR" ? "€" : v.devise}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition ml-auto mt-1 ${selectedVeh === v.id ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
              {selectedVeh === v.id && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-3 bg-slate-50/50 space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <Link
                      to={`/vente/workflow/${v.id}`}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-[#E5E7EB] active:scale-[0.97] transition"
                    >
                      <Clock size={16} className="text-blue-600" />
                      <span className="text-[9px] font-bold text-[#111]">Workflow</span>
                    </Link>
                    <Link
                      to={`/vente/dossier-vehicule/${v.id}`}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-[#E5E7EB] active:scale-[0.97] transition"
                    >
                      <FileText size={16} className="text-amber-600" />
                      <span className="text-[9px] font-bold text-[#111]">Dossier</span>
                    </Link>
                    <Link
                      to={getAnnonceUrl(v.id, v.categorieAnnonce, v.vendeurType)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-[#E5E7EB] active:scale-[0.97] transition"
                    >
                      <Eye size={16} className="text-green-600" />
                      <span className="text-[9px] font-bold text-[#111]">Voir Annonce</span>
                    </Link>
                    <Link
                      to={`/vente/attestation/${v.id}`}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-[#E5E7EB] active:scale-[0.97] transition"
                    >
                      <FileSignature size={16} className="text-[#D4AF37]" />
                      <span className="text-[9px] font-bold text-[#111]">Attestation</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
