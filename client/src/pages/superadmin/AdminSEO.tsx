import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, ChevronDown, RefreshCw, ExternalLink, FileText, Lightbulb, Send, Tag } from "lucide-react";
import { trpc } from "../../lib/trpc";

const TYPE_LABELS: Record<string, string> = {
  service: "Services", geo_service: "Service × ville", piece: "Pièces",
  location: "Locations", geo_country: "Pays", marque: "Marques",
  modele: "Modèles", geo_ville: "Villes", annonce: "Annonces",
};

export default function AdminSEO() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const byType = trpc.seo.pagesByType.useQuery();
  const utils = trpc.useUtils();
  const generate = trpc.seo.generateProgrammaticPages.useMutation({
    onSuccess: () => { utils.seo.pagesByType.invalidate(); utils.seo.analyze.invalidate(); },
  });
  const analysis = trpc.seo.analyze.useQuery();
  const indexNow = trpc.seo.indexNowConfigured.useQuery();
  const submit = trpc.seo.submitToIndexNow.useMutation();
  const keywordCatalog = trpc.seo.keywordCatalog.useQuery();
  const keywordStats = trpc.seo.keywordStats.useQuery();
  const seedKeywords = trpc.seo.seedKeywords.useMutation({
    onSuccess: () => { utils.seo.keywordStats.invalidate(); utils.seo.listKeywords.invalidate(); },
  });
  const associations = trpc.seo.keywordAssociations.useQuery();
  const associate = trpc.seo.associateKeywords.useMutation({
    onSuccess: () => { utils.seo.keywordAssociations.invalidate(); utils.seo.listKeywords.invalidate(); },
  });
  const countByUnivers = (u: string) =>
    Number(keywordStats.data?.byUnivers.find((r) => r.univers === u)?.count ?? 0);
  const targets = associations.data?.targets ?? {};

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

      {/* SEO OS intelligent — suggestions (validation humaine) */}
      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={16} className="text-[#D4AF37]" />
            <p className="text-sm font-bold text-[#111]">SEO OS intelligent — suggestions</p>
          </div>
          <p className="text-[11px] text-[#6B7280] mb-3">
            Le système observe les données réelles et propose. Aucune action n'est
            exécutée sans validation : cliquez « Générer » ci-dessus pour appliquer.
          </p>
          {(analysis.data?.suggestions ?? []).length === 0 ? (
            <p className="text-[11px] text-green-700">Aucune page manquante détectée — couverture à jour.</p>
          ) : (
            <div className="space-y-2">
              {(analysis.data?.suggestions ?? []).map((s) => (
                <div key={s.type} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-bold text-amber-900">{s.label}</p>
                  <p className="text-[10px] text-amber-800 mt-0.5">{s.reason}</p>
                </div>
              ))}
            </div>
          )}
          {analysis.data && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { l: "Marques (top)", v: analysis.data.topMarques.length },
                { l: "Villes (top)", v: analysis.data.topVilles.length },
                { l: "Modèles (top)", v: analysis.data.topModeles.length },
              ].map((x) => (
                <div key={x.l} className="rounded-lg bg-[#F5F3EF] p-2">
                  <p className="text-sm font-black text-[#111]">{x.v}</p>
                  <p className="text-[8px] text-[#6B7280]">{x.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Indexation (soumission moteurs) */}
      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Send size={16} className="text-[#D4AF37]" />
            <p className="text-sm font-bold text-[#111]">Soumission aux moteurs (IndexNow)</p>
          </div>
          <p className="text-[11px] text-[#6B7280] mb-3">
            {indexNow.data?.configured
              ? "IndexNow configuré. La soumission accélère la découverte (Bing, Yandex…) — l'indexation finale reste décidée par les moteurs."
              : "IndexNow non configuré (clé INDEXNOW_KEY manquante). Le sitemap reste découvrable via robots.txt ; ajoutez la clé pour la soumission active."}
          </p>
          <button
            onClick={() => submit.mutate({ baseUrl: window.location.origin })}
            disabled={submit.isPending || !indexNow.data?.configured}
            className="w-full rounded-lg bg-[#111] py-2 text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={12} />
            {submit.isPending ? "Soumission…" : "Soumettre les pages à IndexNow"}
          </button>
          {submit.data && (
            <p className={`mt-2 text-[11px] ${submit.data.success ? "text-green-700" : "text-red-600"}`}>
              {submit.data.provider} — {submit.data.submitted} URL(s) — {submit.data.detail}
            </p>
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

      {/* Base de mots-clés SEO (Phase 1 — tous les univers) */}
      <div className="px-4 mt-5">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={16} className="text-[#D4AF37]" />
            <p className="text-sm font-bold text-[#111]">Base de mots-clés SEO</p>
          </div>
          <p className="text-[11px] text-[#6B7280] mb-3">
            Fondation du référencement : {keywordStats.data?.catalogTotal ?? keywordCatalog.data?.total ?? 0} mots-clés
            curés couvrant tous les univers (vente, location, garage, carrosserie, contrôle
            technique, administratif, pièces, professionnels, marketplace, Afrique). Le seed est
            idempotent — relançable sans doublon.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
              <p className="text-sm font-black text-blue-600">{(keywordStats.data?.total ?? 0).toLocaleString("fr-FR")}</p>
              <p className="text-[8px] text-[#6B7280]">Mots-clés enregistrés</p>
            </div>
            <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
              <p className="text-sm font-black text-[#D4AF37]">{keywordCatalog.data?.universes ?? 0}</p>
              <p className="text-[8px] text-[#6B7280]">Univers couverts</p>
            </div>
          </div>
          <button
            onClick={() => seedKeywords.mutate({})}
            disabled={seedKeywords.isPending}
            className="w-full rounded-lg bg-[#111] py-2 text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={12} className={seedKeywords.isPending ? "animate-spin" : ""} />
            {seedKeywords.isPending ? "Alimentation…" : "Alimenter / compléter la base de mots-clés"}
          </button>
          {seedKeywords.data && (
            <p className="mt-2 text-[11px] text-green-700 font-medium">
              {seedKeywords.data.inserted.toLocaleString("fr-FR")} mot(s)-clé(s) ajouté(s),
              {" "}{seedKeywords.data.skipped.toLocaleString("fr-FR")} déjà présent(s) — {seedKeywords.data.universes} univers.
            </p>
          )}
          {seedKeywords.error && (
            <p className="mt-2 text-[11px] text-red-600">{seedKeywords.error.message}</p>
          )}
        </div>

        {/* Phase 2 — Association intelligente mots-clé → page cible */}
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={16} className="text-[#D4AF37]" />
            <p className="text-sm font-bold text-[#111]">Association mots-clés → pages</p>
          </div>
          <p className="text-[11px] text-[#6B7280] mb-3">
            Chaque mot-clé est relié à sa page canonique réellement rendue (aucun lien mort).
            {associations.data
              ? ` ${associations.data.associated.toLocaleString("fr-FR")} / ${associations.data.total.toLocaleString("fr-FR")} mots-clés associés.`
              : ""}
          </p>
          <button
            onClick={() => associate.mutate()}
            disabled={associate.isPending}
            className="w-full rounded-lg bg-[#111] py-2 text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={12} className={associate.isPending ? "animate-spin" : ""} />
            {associate.isPending ? "Association…" : "Associer les mots-clés à leurs pages"}
          </button>
          {associate.data && (
            <p className="mt-2 text-[11px] text-green-700 font-medium">
              {associate.data.updated.toLocaleString("fr-FR")} mot(s)-clé(s) reliés,
              {" "}{associate.data.alreadySet.toLocaleString("fr-FR")} déjà à jour — {associate.data.total.toLocaleString("fr-FR")} au total.
            </p>
          )}
          {associate.error && (
            <p className="mt-2 text-[11px] text-red-600">{associate.error.message}</p>
          )}
        </div>

        <p className="text-[11px] font-bold text-[#6B7280] mb-2 uppercase">Mots-clés par univers</p>
        <div className="space-y-2">
          {(keywordCatalog.data?.catalog ?? []).map((g) => (
            <KeywordUniverse
              key={g.univers}
              univers={g.univers}
              label={g.label}
              catalogCount={g.keywords.length}
              savedCount={countByUnivers(g.univers)}
              target={targets[g.univers]}
              open={expanded === g.univers}
              onToggle={() => setExpanded(expanded === g.univers ? null : g.univers)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function KeywordUniverse(props: {
  univers: string;
  label: string;
  catalogCount: number;
  savedCount: number;
  target?: string;
  open: boolean;
  onToggle: () => void;
}) {
  const list = trpc.seo.listKeywords.useQuery(
    { univers: props.univers, limit: 500 },
    { enabled: props.open },
  );
  return (
    <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
      <button onClick={props.onToggle} className="w-full text-left p-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-blue-50 grid place-items-center text-[10px] font-black text-blue-600">
          {props.savedCount || props.catalogCount}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#111]">{props.label}</p>
          <p className="text-[10px] text-[#6B7280]">
            {props.catalogCount} mots-clés au catalogue
            {props.savedCount ? ` · ${props.savedCount} en base` : " · non alimenté"}
          </p>
          {props.target && (
            <p className="text-[10px] text-blue-600 truncate">→ {props.target}</p>
          )}
        </div>
        <ChevronDown size={12} className={`text-[#9CA3AF] transition ${props.open ? "rotate-180" : ""}`} />
      </button>
      {props.open && (
        <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
          {list.isLoading ? (
            <p className="text-[10px] text-[#6B7280]">Chargement…</p>
          ) : (list.data ?? []).length === 0 ? (
            <p className="text-[10px] text-[#6B7280]">Aucun mot-clé en base — cliquez « Alimenter » ci-dessus.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(list.data ?? []).map((k) => (
                <span key={k.id} className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[10px] text-[#374151] border border-[#E5E7EB]">
                  {k.keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
