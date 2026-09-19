import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   DROITS D'ACCÈS (/vente/droits/:id)
   Données réelles : trpc.pro.venteEmployeDetail / venteEmployePermissionsModifier
   (server/routers/pro.ts, colonne permissions jsonb de vente_employes).
   Affichait avant un employé fictif ("Commercial — Jean D.") et des cases à
   cocher qui ne persistaient nulle part.
   ══════════════════════════════════════════════════════════════════════════ */

const MODULES = ["Véhicules", "Factures", "Documents", "Employés", "Paiements", "Comptabilité", "Statistiques"];

export default function DroitsAcces() {
  const { id } = useParams();
  const employeId = Number(id);
  const utils = trpc.useUtils();
  const { data: employe, isLoading } = trpc.pro.venteEmployeDetail.useQuery({ id: employeId }, { enabled: Number.isFinite(employeId) });
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (employe) setPerms(employe.permissions ?? {});
  }, [employe]);

  const enregistrer = trpc.pro.venteEmployePermissionsModifier.useMutation({
    onSuccess: () => {
      utils.pro.venteEmployeDetail.invalidate({ id: employeId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (!Number.isFinite(employeId)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Collaborateur introuvable — revenez depuis la fiche employé.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente/employes" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Employés</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Droits d'accès</h1>
        <p className="mt-1 text-sm text-white/80">{isLoading ? "Chargement…" : employe ? `${employe.poste || "Collaborateur"} — ${employe.nom}` : ""}</p>
      </div>

      {!isLoading && employe && (
        <>
          <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
            {MODULES.map((m) => (
              <label key={m} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0">
                <input
                  type="checkbox"
                  checked={perms[m] || false}
                  onChange={() => setPerms({ ...perms, [m]: !perms[m] })}
                  className="h-5 w-5 rounded accent-blue-600"
                />
                <span className="text-sm text-[#111]">{m}</span>
              </label>
            ))}
          </div>
          <div className="px-4 mt-4">
            {saved && <p className="mb-2 text-center text-xs font-bold text-emerald-600">Droits enregistrés.</p>}
            <button
              onClick={() => enregistrer.mutate({ id: employeId, permissions: perms })}
              disabled={enregistrer.isPending}
              className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
            >
              {enregistrer.isPending ? "Enregistrement…" : "Enregistrer les droits"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
