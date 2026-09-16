import { Link } from "react-router-dom";
import { ChevronLeft, Shield, AlertTriangle, FileText } from "lucide-react";
import { trpc } from "../../lib/trpc";

/**
 * Aucune source réelle de statut de contrôle technique officiel n'existe
 * aujourd'hui côté MKA.P-MS (pas d'accès à un registre gouvernemental) :
 * afficher un CT "valide" avec une date serait un statut inventé. Seules
 * les demandes de devis réellement envoyées par l'utilisateur (trpc.devis)
 * sont affichées, jamais un historique fabriqué.
 */
function estDemandeControleTechnique(typeIntervention: string): boolean {
  const t = typeIntervention.toLowerCase();
  return t.includes("contrôle technique") || t.includes("controle technique") || t === "ct";
}

export default function ControleTechnique() {
  const devis = trpc.devis.mine.useQuery();
  const demandesCt = (devis.data ?? []).filter((d) => estDemandeControleTechnique(d.typeIntervention));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-green-700 px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Contrôle technique</h1>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Statut officiel non disponible</p>
            <p className="text-xs text-amber-700 mt-0.5">
              MKA.P-MS n'a pas accès à un registre officiel de contrôle technique : la date de votre dernier passage
              et sa validité figurent sur votre procès-verbal ou votre carte grise.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <Link
          to="/garage/prise-rendez-vous?type=Contrôle%20technique"
          className="block w-full rounded-xl bg-green-700 py-3 text-center text-sm font-bold text-white active:scale-[0.98]"
        >
          Prendre rendez-vous CT
        </Link>
      </div>

      <div className="px-4 mt-4">
        <h3 className="text-sm font-bold text-[#111] mb-2">Vos demandes de contrôle technique</h3>
        {devis.isLoading ? (
          <p className="text-xs text-[#6B7280]">Chargement…</p>
        ) : demandesCt.length === 0 ? (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-2">
            <FileText size={14} className="text-[#9CA3AF]" />
            <p className="text-xs text-[#6B7280]">Aucune demande de contrôle technique envoyée pour l'instant.</p>
          </div>
        ) : (
          demandesCt.map((d) => (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 mb-2 flex items-center gap-3">
              <FileText size={14} className="text-green-600" />
              <div className="flex-1">
                <p className="text-sm text-[#111]">
                  {new Date(d.createdAt).toLocaleDateString("fr-FR")} — {d.status}
                </p>
                {d.ville && <p className="text-[9px] text-[#6B7280]">{d.ville}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
