/**
 * Points 92-93-98-99-100-101 — Moniteur d'indexation (PDG / Direction).
 *
 * L'écran sépare strictement deux choses que rien ne doit confondre :
 *   • ce que la plateforme fait  → publier, déclarer au sitemap, autoriser le crawl ;
 *   • ce que Google fait         → indexer, ce qui ne se sait qu'avec Search Console.
 *
 * Tant qu'aucun accès Search Console n'est fourni, aucune page n'est affichée
 * « INDEXÉ » : elle reste « EN ATTENTE », avec le motif écrit noir sur blanc.
 */
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Globe,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Statut =
  | "indexe"
  | "non_indexe"
  | "bloque"
  | "erreur"
  | "decouvert_non_indexe"
  | "action_requise";

const STATUT_LABEL: Record<Statut, string> = {
  indexe: "🟢 INDEXÉ",
  non_indexe: "🟠 NON INDEXÉ",
  bloque: "🔴 BLOQUÉ",
  erreur: "🔴 ERREUR",
  decouvert_non_indexe: "🟡 DÉCOUVERT, PAS ENCORE INDEXÉ",
  action_requise: "🟠 ACTION REQUISE",
};

const STATUT_TON: Record<Statut, string> = {
  indexe: "bg-emerald-50 text-emerald-700 border-emerald-200",
  non_indexe: "bg-orange-50 text-orange-700 border-orange-200",
  bloque: "bg-red-50 text-red-700 border-red-200",
  erreur: "bg-red-50 text-red-700 border-red-200",
  decouvert_non_indexe: "bg-amber-50 text-amber-700 border-amber-200",
  action_requise: "bg-orange-50 text-orange-700 border-orange-200",
};

const STATUTS: Statut[] = [
  "indexe",
  "decouvert_non_indexe",
  "action_requise",
  "non_indexe",
  "bloque",
  "erreur",
];

const FAMILLE_LABEL: Record<string, string> = {
  vehicule: "Véhicule",
  piece: "Pièce / produit",
  garage: "Garage",
  location: "Location",
  controle_technique: "Contrôle technique",
  pro: "Page professionnelle",
  service: "Service",
  promotion: "Promotion",
  pays: "Page pays",
  categorie: "Catégorie",
};

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{titre}</p>
      <p className="mt-1 text-lg font-black text-[#111]">{valeur}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-black/50">{detail}</p> : null}
    </div>
  );
}

function Pastille({ vrai, label }: { vrai: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-black/60">
      {vrai ? (
        <CheckCircle2 size={13} className="text-emerald-600" />
      ) : (
        <XCircle size={13} className="text-black/25" />
      )}
      {label}
    </span>
  );
}

export default function CentreIndexation() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const [filtre, setFiltre] = useState<Statut | "tous">("tous");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const moniteur = trpc.indexation.monitor.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const dernier = trpc.indexation.latest.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const historique = trpc.indexation.history.useQuery(
    { limit: 10 },
    { enabled: !!isDirection, refetchOnWindowFocus: false },
  );

  const lancer = trpc.indexation.run.useMutation({
    onSuccess: (r) => {
      setMessage(
        `Contrôle n°${r.auditId} terminé — ${r.total} URL(s) réellement interrogée(s) sur ${r.base}.`,
      );
      dernier.refetch();
      moniteur.refetch();
      historique.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const surveiller = trpc.indexation.watchRecent.useMutation({
    onSuccess: (r) => {
      setMessage(`${r.controlees} page(s) récemment publiée(s) recontrôlée(s).`);
      moniteur.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const rapport = dernier.data ?? null;

  const items = useMemo(() => {
    if (!rapport) return [];
    const liste = filtre === "tous" ? rapport.items : rapport.items.filter((i) => i.statut === filtre);
    const rang = (s: string) => STATUTS.indexOf(s as Statut);
    return [...liste].sort((a, b) => rang(b.statut) - rang(a.statut) || a.url.localeCompare(b.url));
  }, [rapport, filtre]);

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const gsc = moniteur.data?.searchConsole ?? rapport?.searchConsole ?? null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Search size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Indexation &amp; visibilité Google</h1>
            <p className="text-xs text-white/60">
              Points 92 à 101 — une soumission n&apos;est jamais une indexation
            </p>
          </div>
          <button
            onClick={() => lancer.mutate({ parFamille: 3 })}
            disabled={lancer.isPending}
            className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#111] disabled:opacity-50"
          >
            <RefreshCw size={13} className={lancer.isPending ? "animate-spin" : ""} />
            {lancer.isPending ? "Contrôle…" : "Contrôler"}
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {message ? (
          <p className="mb-3 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-xs text-[#111]">
            {message}
          </p>
        ) : null}

        {gsc && !gsc.configure ? (
          <div className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-900">Search Console non connectée</p>
              <p className="mt-0.5 text-[11px] text-amber-800">{gsc.detail}</p>
            </div>
          </div>
        ) : null}

        {/* ─── Moniteur d'indexation (point 99) ────────────────────────────── */}
        <h2 className="mb-2 text-sm font-black text-[#111]">Moniteur d&apos;indexation</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Carte
            titre="Pages publiques"
            valeur={String(moniteur.data?.pagesPubliques ?? 0)}
            detail="annonces, pièces, garages, pages générées"
          />
          <Carte titre="Indexées (preuve Google)" valeur={String(moniteur.data?.indexees ?? 0)} />
          <Carte
            titre="En attente"
            valeur={String(moniteur.data?.enAttente ?? 0)}
            detail="déclarées, pas encore confirmées"
          />
          <Carte titre="Exclues" valeur={String(moniteur.data?.exclues ?? 0)} />
          <Carte titre="Erreurs" valeur={String(moniteur.data?.erreurs ?? 0)} />
          <Carte
            titre="Dernier contrôle"
            valeur={
              moniteur.data?.dernierControle
                ? new Date(moniteur.data.dernierControle).toLocaleString("fr-FR")
                : "jamais"
            }
          />
        </div>

        {moniteur.data?.detailPubliques ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(moniteur.data.detailPubliques).map(([cle, n]) => (
              <span
                key={cle}
                className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-black/60"
              >
                {cle.replace(/_/g, " ")} : <b className="text-[#111]">{n}</b>
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => surveiller.mutate({ limit: 20 })}
            disabled={surveiller.isPending}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[11px] font-semibold text-[#111] disabled:opacity-50"
          >
            {surveiller.isPending ? "Contrôle en cours…" : "Recontrôler les dernières pages publiées"}
          </button>
        </div>

        {/* ─── Diagnostic URL par URL (points 92-93) ──────────────────────── */}
        <h2 className="mt-6 mb-2 text-sm font-black text-[#111]">Diagnostic URL par URL</h2>

        {!rapport ? (
          <div className="rounded-xl border border-black/5 bg-white p-5 text-sm text-black/60">
            {dernier.isLoading
              ? "Lecture du dernier contrôle…"
              : "Aucun contrôle enregistré. « Contrôler » interroge réellement le site public, famille par famille (véhicule, pièce, garage, location, contrôle technique, page pro, service, promotion, pays, catégorie)."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Carte titre="URLs contrôlées" valeur={String(rapport.total)} />
              <Carte
                titre="robots.txt"
                valeur={rapport.robotsTrouve ? "lu" : "introuvable"}
                detail={rapport.base}
              />
              <Carte
                titre="Sitemap"
                valeur={rapport.sitemapTrouve ? `${rapport.sitemapUrls} URL(s)` : "introuvable"}
              />
              <Carte
                titre="Dernier contrôle"
                valeur={new Date(rapport.checkedAt).toLocaleString("fr-FR")}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFiltre("tous")}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                  filtre === "tous"
                    ? "border-[#111] bg-[#111] text-white"
                    : "border-black/10 bg-white text-black/60"
                }`}
              >
                Toutes ({rapport.total})
              </button>
              {STATUTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setFiltre(s)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                    filtre === s ? "border-[#111] bg-[#111] text-white" : STATUT_TON[s]
                  }`}
                >
                  {STATUT_LABEL[s]} ({rapport.parStatut?.[s] ?? 0})
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {items.map((item) => (
                <div key={item.url} className="rounded-xl border border-black/5 bg-white">
                  <button
                    onClick={() => setOuvert(ouvert === item.url ? null : item.url)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#111]">{item.url}</p>
                      <p className="text-[11px] text-black/50">
                        {FAMILLE_LABEL[item.famille] ?? item.famille} ·{" "}
                        {item.pipeline === "produit" ? "tuyau produit" : item.pipeline === "annonce" ? "tuyau annonce" : "page"} ·
                        HTTP {item.httpStatus ?? "—"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        STATUT_TON[item.statut as Statut]
                      }`}
                    >
                      {STATUT_LABEL[item.statut as Statut]}
                    </span>
                  </button>

                  {ouvert === item.url ? (
                    <div className="border-t border-black/5 px-3 py-3">
                      <p className="text-xs text-black/70">{item.motif}</p>

                      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        <Pastille vrai={item.publique} label="Accessible publiquement" />
                        <Pastille vrai={item.indexable} label="Indexable" />
                        <Pastille vrai={item.crawlAutorise} label="Crawl autorisé" />
                        <Pastille vrai={item.dansSitemap} label="Dans le sitemap" />
                        <Pastille vrai={item.canonicalCoherent} label="Canonique cohérente" />
                        <Pastille vrai={!!item.title} label="Titre" />
                        <Pastille vrai={!!item.description} label="Description" />
                        <Pastille
                          vrai={item.donneesStructurees.length > 0}
                          label={`Données structurées (${item.donneesStructurees.length})`}
                        />
                        <Pastille vrai={!!item.langue} label={`Langue ${item.langue ?? "—"}`} />
                      </div>

                      <dl className="mt-3 space-y-1 text-[11px] text-black/60">
                        {item.title ? (
                          <div>
                            <dt className="inline font-semibold text-black/70">Titre : </dt>
                            <dd className="inline">{item.title}</dd>
                          </div>
                        ) : null}
                        {item.description ? (
                          <div>
                            <dt className="inline font-semibold text-black/70">Description : </dt>
                            <dd className="inline">{item.description}</dd>
                          </div>
                        ) : null}
                        {item.canonical ? (
                          <div>
                            <dt className="inline font-semibold text-black/70">Canonique : </dt>
                            <dd className="inline break-all">{item.canonical}</dd>
                          </div>
                        ) : null}
                        <div>
                          <dt className="inline font-semibold text-black/70">Contenu visible : </dt>
                          <dd className="inline">{item.contenuVisible} caractères</dd>
                        </div>
                        {item.donneesStructurees.length > 0 ? (
                          <div>
                            <dt className="inline font-semibold text-black/70">Schémas : </dt>
                            <dd className="inline">{item.donneesStructurees.join(", ")}</dd>
                          </div>
                        ) : null}
                        {item.pays ? (
                          <div>
                            <dt className="inline font-semibold text-black/70">Pays : </dt>
                            <dd className="inline">{item.pays}</dd>
                          </div>
                        ) : null}
                      </dl>

                      {item.manquant.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-[11px] font-bold text-black/60">Ce qui manque</p>
                          <ul className="mt-1 space-y-0.5">
                            {item.manquant.map((m) => (
                              <li key={m} className="flex items-start gap-1.5 text-[11px] text-black/60">
                                <XCircle size={12} className="mt-0.5 shrink-0 text-orange-500" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#111] underline"
                      >
                        <Globe size={12} /> Ouvrir la page
                      </a>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {rapport.famillesVides.length > 0 ? (
              <div className="mt-4 rounded-xl border border-black/5 bg-white p-3">
                <p className="text-xs font-bold text-[#111]">Familles sans donnée réelle</p>
                <p className="mt-0.5 text-[11px] text-black/50">
                  Aucune URL d&apos;exemple n&apos;est inventée : sans donnée, la famille reste non contrôlée.
                </p>
                <ul className="mt-2 space-y-1">
                  {rapport.famillesVides.map((f) => (
                    <li key={f.famille} className="text-[11px] text-black/60">
                      <b className="text-[#111]">{FAMILLE_LABEL[f.famille] ?? f.famille}</b> — {f.motif}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}

        {/* ─── Suivi par famille ──────────────────────────────────────────── */}
        {moniteur.data && moniteur.data.parFamille.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-black text-[#111]">Suivi par famille</h2>
            <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
              <table className="w-full text-[11px]">
                <thead className="bg-black/[0.03] text-black/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Famille</th>
                    <th className="px-3 py-2 text-right font-semibold">Suivies</th>
                    <th className="px-3 py-2 text-right font-semibold">Indexées</th>
                    <th className="px-3 py-2 text-right font-semibold">En attente</th>
                    <th className="px-3 py-2 text-right font-semibold">Exclues</th>
                    <th className="px-3 py-2 text-right font-semibold">Erreurs</th>
                  </tr>
                </thead>
                <tbody>
                  {moniteur.data.parFamille.map((f) => (
                    <tr key={f.famille} className="border-t border-black/5">
                      <td className="px-3 py-2 font-semibold text-[#111]">
                        {FAMILLE_LABEL[f.famille] ?? f.famille}
                      </td>
                      <td className="px-3 py-2 text-right">{f.suivies}</td>
                      <td className="px-3 py-2 text-right">{f.indexees}</td>
                      <td className="px-3 py-2 text-right">{f.enAttente}</td>
                      <td className="px-3 py-2 text-right">{f.exclues}</td>
                      <td className="px-3 py-2 text-right">{f.erreurs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* ─── Historique ─────────────────────────────────────────────────── */}
        {historique.data && historique.data.length > 1 ? (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-black text-[#111]">Historique des contrôles</h2>
            <div className="space-y-1.5">
              {historique.data.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-lg border border-black/5 bg-white px-3 py-2 text-[11px]"
                >
                  <span className="text-black/60">
                    n°{h.id} · {new Date(h.date).toLocaleString("fr-FR")} · {h.trigger}
                  </span>
                  <span className="text-black/50">
                    {h.total} URL(s) · sitemap {h.sitemapUrls}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
