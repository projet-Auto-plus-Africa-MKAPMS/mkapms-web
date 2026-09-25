import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Award, X } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   BADGES & CERTIFICATIONS
   Données réelles : trpc.badges.list/setCriteres/titulaires (server/routers/
   badges.ts). "Attribués" est un vrai comptage sur badge_attributions —
   aucune attribution automatique n'existe encore (les seuils réels par
   critère restent à valider par la Direction avant de construire un moteur
   d'évaluation), donc ce nombre commence honnêtement à 0.
   ══════════════════════════════════════════════════════════════════════════ */

const COULEURS = ["bg-green-50 text-green-600", "bg-[#D4AF37]/10 text-[#D4AF37]", "bg-purple-50 text-purple-600", "bg-blue-50 text-blue-600", "bg-amber-50 text-amber-600"];

export default function AdminBadges() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [titulairesDe, setTitulairesDe] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const listQ = trpc.badges.list.useQuery();
  const setCriteres = trpc.badges.setCriteres.useMutation({ onSuccess: () => utils.badges.list.invalidate() });
  const titulairesQ = trpc.badges.titulaires.useQuery({ badgeId: titulairesDe ?? 0 }, { enabled: titulairesDe !== null });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} className="text-[#D4AF37]" /> Badges & Certifications</h1>
      </div>
      {listQ.isLoading && <p className="px-4 mt-4 text-xs text-[#9CA3AF]">Chargement…</p>}
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {listQ.data?.map((b, i) => {
          const isExp = expanded === b.id;
          return (
            <div key={b.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : b.id)} className="w-full text-left p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${COULEURS[i % COULEURS.length]}`}>{b.nom}</span>
                </div>
                <p className="text-lg font-black text-[#111]">{b.attribues}</p>
                <p className="text-[9px] text-[#6B7280]">attribués</p>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                  <p className="text-[10px] text-[#6B7280]">{b.description}</p>
                  <p className="text-[9px] text-[#111] bg-[#F5F3EF] rounded-lg p-2">{b.criteres || "Aucun critère renseigné."}</p>
                  <div className="flex gap-2">
                    <button
                      disabled={setCriteres.isPending}
                      onClick={() => {
                        const valeur = prompt("Critères d'attribution :", b.criteres ?? "");
                        if (valeur == null) return;
                        setCriteres.mutate({ id: b.id, criteres: valeur });
                      }}
                      className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white disabled:opacity-50"
                    >
                      Gérer critères
                    </button>
                    <button onClick={() => setTitulairesDe(b.id)} className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">
                      Titulaires
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {titulairesDe !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setTitulairesDe(null)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#111]">Titulaires du badge</h2>
              <button onClick={() => setTitulairesDe(null)}><X size={18} className="text-[#6B7280]" /></button>
            </div>
            {titulairesQ.data?.length === 0 && <p className="text-xs text-[#6B7280]">Aucune attribution pour le moment.</p>}
            <div className="space-y-2">
              {titulairesQ.data?.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-[#F5F3EF] p-2 text-xs">
                  <span className="text-[#111] font-semibold">{t.userName || t.userEmail || `#${t.userId}`}</span>
                  <span className="text-[#6B7280]">{new Date(t.awardedAt).toLocaleDateString("fr-FR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
