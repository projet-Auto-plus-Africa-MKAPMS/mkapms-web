import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, ChevronDown, TrendingUp, RefreshCw, ExternalLink, FileText } from "lucide-react";
import { trpc } from "../../lib/trpc";

const KEYWORDS = [
  { id: 1, mot: "voiture occasion france", position: 3, volume: "12 400/mois", tendance: "+2" },
  { id: 2, mot: "vente voiture particulier", position: 7, volume: "8 100/mois", tendance: "+5" },
  { id: 3, mot: "location voiture pas cher", position: 12, volume: "22 000/mois", tendance: "-1" },
  { id: 4, mot: "garage reparation auto", position: 5, volume: "6 600/mois", tendance: "+3" },
  { id: 5, mot: "estimation voiture gratuit", position: 4, volume: "14 800/mois", tendance: "0" },
];

const TYPE_LABELS: Record<string, string> = {
  service: "Services", geo_service: "Service × ville", piece: "Pièces",
  location: "Locations", geo_country: "Pays", marque: "Marques",
  modele: "Modèles", geo_ville: "Villes", annonce: "Annonces",
};

export default function AdminSEO() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const byType = trpc.seo.pagesByType.useQuery();
  const utils = trpc.useUtils();
  const generate = trpc.seo.generateProgrammaticPages.useMutation({
    onSuccess: () => utils.seo.pagesByType.invalidate(),
  });

  const totalPages = (byType.data ?? []).reduce((s, r) => s + Number(r.count), 0);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Search size={20} className="text-[#D4AF37]" /> SEO &amp; Visibilité</h1>
      </div>

      {/* Stats réelles */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-blue-500">{totalPages.toLocaleString("fr-FR")}</p>
          <p className="text-[8px] text-[#6B7280]">Pages SEO générées</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-[#D4AF37]">{(byType.data ?? []).length}</p>
          <p className="text-[8px] text-[#6B7280]">Types de pages</p>
        </div>
        <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
          <p className="text-lg font-black text-green-600 flex items-center justify-center gap-1"><ExternalLink size={14} /></p>
          <p className="text-[8px] text-[#6B7280]">Sitemap</p>
        </a>
      </div>

      {/* Génération des pages programmatiques */}
      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-[#D4AF37]" />
            <p className="text-sm font-bold text-[#111]">Générateur de pages SEO</p>
          </div>
          <p className="text-[11px] text-[#6B7280] mb-3">
            Crée / met à jour les pages indexables (services, pièces, locations, pays,
            marques, modèles, villes) à partir du catalogue et des annonces réelles. Idempotent.
          </p>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="w-full rounded-lg bg-[#111] py-2 text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={12} className={generate.isPending ? "animate-spin" : ""} />
            {generate.isPending ? "Génération en cours…" : "Générer / mettre à jour les pages"}
          </button>
          {generate.data && (
            <p className="mt-2 text-[11px] text-green-700 font-medium">
              {generate.data.total.toLocaleString("fr-FR")} pages générées/mises à jour
              (services {generate.data.services}, service×ville {generate.data.serviceCities},
              pièces {generate.data.pieces}, locations {generate.data.locations},
              pays {generate.data.pays}, marques {generate.data.marques},
              modèles {generate.data.modeles}, villes {generate.data.villes}).
            </p>
          )}
          {generate.error && (
            <p className="mt-2 text-[11px] text-red-600">{generate.error.message}</p>
          )}
        </div>
      </div>

      {/* Répartition par type */}
      {(byType.data ?? []).length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-[11px] font-bold text-[#6B7280] mb-2 uppercase">Répartition des pages</p>
          <div className="grid grid-cols-2 gap-2">
            {(byType.data ?? []).map((r) => (
              <div key={r.pageType} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
                <span className="text-xs font-medium text-[#111]">{TYPE_LABELS[r.pageType] || r.pageType}</span>
                <span className="text-sm font-black text-blue-600">{Number(r.count).toLocaleString("fr-FR")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mots-clés suivis (exemples) */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-bold text-[#6B7280] mb-2 uppercase">Mots-clés suivis (exemples)</p>
        <div className="space-y-2">
          {KEYWORDS.map((k) => {
            const isExp = expanded === k.id;
            return (
              <div key={k.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <button onClick={() => setExpanded(isExp ? null : k.id)} className="w-full text-left p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-50 grid place-items-center text-xs font-black text-blue-600">#{k.position}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-[#111]">{k.mot}</p><p className="text-[10px] text-[#6B7280]">{k.volume}</p></div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={10} className={k.tendance.startsWith("+") ? "text-green-500" : k.tendance === "0" ? "text-slate-400" : "text-red-500"} />
                    <span className={`text-[10px] font-bold ${k.tendance.startsWith("+") ? "text-green-600" : "text-red-600"}`}>{k.tendance}</span>
                  </div>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </button>
                {isExp && (
                  <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                    <p className="text-[10px] text-[#6B7280]">Analyse et suggestions à venir (SEO OS intelligent).</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
