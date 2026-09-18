import { Link } from "react-router-dom";
import { ChevronLeft, Building2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

const TYPE_LABELS: Record<string, string> = {
  declaration_achat: "Déclaration d'achat",
  declaration_cession: "Déclaration de cession",
  changement_titulaire: "Changement de titulaire",
  carte_grise: "Carte grise",
  vehicule_etranger: "Véhicule étranger",
  ww_cpi: "WW / CPI",
  w_garage: "W garage",
  duplicata: "Duplicata",
  correction: "Correction",
  autre: "Autre",
};

/**
 * Espace pro démarches (/demarches/espace-pro).
 *
 * Données réelles : trpc.carteGrise.monAgence + trpc.carteGrise.dossiersPourAgence
 * (server/routers/cartegrise.ts) — le même moteur agence déjà utilisé par
 * l'onglet « Espace agence » de client/src/pages/CarteGrise.tsx, jamais un
 * second registre de dossiers inventé pour cette page.
 */
export default function EspaceProDemarches() {
  const agence = trpc.carteGrise.monAgence.useQuery();
  const dossiers = trpc.carteGrise.dossiersPourAgence.useQuery(
    { agenceId: agence.data?.id ?? 0 },
    { enabled: !!agence.data?.id },
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} /> Espace pro démarches</h1>
        {agence.data && <p className="mt-1 text-sm text-white/80">{agence.data.nom} — {dossiers.data?.length ?? 0} dossiers</p>}
      </div>

      {agence.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      {!agence.isLoading && !agence.data && (
        <div className="mx-4 mt-6 rounded-xl bg-white border border-[#E5E7EB] p-5 text-center">
          <h3 className="text-sm font-bold text-[#111] mb-2">Vous êtes une agence habilitée SIV ?</h3>
          <p className="text-xs text-[#6B7280] mb-3">Créez votre agence carte grise sur MKA.P-MS pour gérer les dossiers de vos clients.</p>
          <Link to="/carte-grise" className="inline-flex rounded-xl bg-blue-800 px-6 py-2.5 text-sm font-bold text-white">Créer mon agence</Link>
        </div>
      )}

      {agence.data && (
        <div className="px-4 mt-4 space-y-2">
          {dossiers.data?.map((d) => (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#111]">{TYPE_LABELS[d.type] ?? d.type}{d.immatriculation ? ` — ${d.immatriculation}` : ""}</h3>
                <p className="text-[9px] text-[#6B7280]">{d.reference}</p>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600">{d.status.replace(/_/g, " ")}</span>
            </div>
          ))}
          {dossiers.data?.length === 0 && (
            <p className="text-sm text-[#6B7280] text-center py-4">Aucun dossier affecté à votre agence pour le moment.</p>
          )}
        </div>
      )}
    </div>
  );
}
