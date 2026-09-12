/**
 * MKA.P-MS Intelligence — module Permissions (LOT IA02B).
 *
 * Lecture réelle du tableau des permissions techniques
 * (server/intelligences/permissions.ts::tableau) : par rôle et par moteur.
 * Attribution volontairement laissée au Centre Intelligence direction
 * existant pour ce lot — ici, consultation seule, honnêtement présentée
 * comme telle.
 */
import { ShieldCheck } from "lucide-react";
import { trpc } from "../../../lib/trpc";

export function Permissions() {
  const permissions = trpc.intelligences.permissions.useQuery();

  if (permissions.isLoading) return <p className="text-sm text-black/40">Chargement…</p>;
  if (!permissions.data) return <p className="text-sm text-red-600">Tableau indisponible.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Permissions par rôle</h2>
        </div>
        <div className="space-y-2">
          {permissions.data.roles.map((r) => (
            <div key={r.cible} className="rounded-lg border border-black/5 bg-[#FAFAFA] p-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-bold text-[#111]">{r.cible}</span>
                <span className="text-[11px] text-black/30">{r.origine}</span>
              </div>
              <p className="mt-1 flex flex-wrap gap-1">
                {r.permissions.map((p) => (
                  <span key={p} className="rounded bg-black/5 px-1.5 py-0.5 text-[11px] font-bold text-black/60">
                    {p}
                  </span>
                ))}
                {r.permissions.length === 0 && <span className="text-xs text-black/30">aucune</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <h2 className="mb-3 text-base font-black text-[#111]">Permissions par moteur</h2>
        <div className="space-y-2">
          {permissions.data.moteurs.length === 0 && (
            <p className="text-sm text-black/40">Aucune exception de moteur enregistrée.</p>
          )}
          {permissions.data.moteurs.map((m) => (
            <div key={m.cible} className="rounded-lg border border-black/5 bg-[#FAFAFA] p-3">
              <span className="text-sm font-bold text-[#111]">{m.cible}</span>
              <p className="mt-1 flex flex-wrap gap-1">
                {m.permissions.map((p) => (
                  <span key={p} className="rounded bg-black/5 px-1.5 py-0.5 text-[11px] font-bold text-black/60">
                    {p}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
