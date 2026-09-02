/**
 * Page d'accueil d'une section (/labs, /operations, /formations…).
 *
 * Ces sections n'avaient aucune page d'accueil : chacun de leurs écrans
 * affichait un lien « Retour » vers une adresse introuvable, et personne ne
 * pouvait atteindre la section. Le sommaire vient de l'inventaire généré des
 * routes : il ne peut pas proposer un écran qui n'existe pas.
 *
 * Un écran encore vide est annoncé comme tel — on ne fait pas passer un
 * gabarit pour un service livré.
 */
import { Link, Navigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { sectionParPrefixe } from "@shared/sections";

export default function SectionAccueil() {
  const { pathname } = useLocation();
  const prefixe = "/" + (pathname.split("/").filter(Boolean)[0] ?? "");
  const section = sectionParPrefixe(prefixe);

  if (!section) return <Navigate to="/" replace />;

  const prets = section.entrees.filter((e) => !e.vide);
  const enPreparation = section.entrees.filter((e) => e.vide);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/" className="mb-2 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Accueil
        </Link>
        <h1 className="text-xl font-black text-white">{section.titre}</h1>
        <p className="mt-1 text-xs text-white/50">
          {section.entrees.length} section(s)
          {enPreparation.length > 0 ? ` · ${enPreparation.length} en préparation` : ""}
        </p>
      </div>

      {prets.length > 0 && (
        <div className="mx-4 mt-4 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          {prets.map((e) => (
            <Link
              key={e.chemin}
              to={e.chemin}
              className="flex items-center justify-between border-b border-[#F3F4F6] px-4 py-3 last:border-b-0"
            >
              <span className="text-sm font-semibold text-[#111]">{e.titre}</span>
              <ChevronRight size={16} className="text-[#9CA3AF]" />
            </Link>
          ))}
        </div>
      )}

      {enPreparation.length > 0 && (
        <div className="mx-4 mt-4">
          <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#6B7280]">
            <Clock size={12} /> En préparation
          </p>
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
            {enPreparation.map((e) => (
              <Link
                key={e.chemin}
                to={e.chemin}
                className="flex items-center justify-between border-b border-[#F3F4F6] px-4 py-3 last:border-b-0"
              >
                <span className="text-sm text-[#6B7280]">{e.titre}</span>
                <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">à venir</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
