/**
 * Points 60-63, 83, 87 — Mémoire automobile MKA.P-MS (Automotive Knowledge Engine).
 *
 * Ce que l'écran refuse de faire, volontairement :
 *  - il n'affiche jamais une connaissance comme publiable sans provenance dont
 *    la licence est établie (point 83) ;
 *  - il ne prétend pas qu'une source est active tant qu'aucune synchronisation
 *    n'a réellement abouti (point 62) ;
 *  - il ne publie rien : une découverte attend une décision du PDG (point 61) ;
 *  - il montre les domaines encore vides au lieu de laisser croire que la
 *    mémoire est complète.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  ChevronLeft,
  Clock,
  Globe,
  Link2,
  Plug,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Onglet = "memoire" | "decouvertes" | "sources" | "couverture" | "verifier";

const ONGLETS: { key: Onglet; label: string }[] = [
  { key: "memoire", label: "Mémoire" },
  { key: "decouvertes", label: "Découvertes" },
  { key: "sources", label: "Sources" },
  { key: "couverture", label: "Couverture" },
  { key: "verifier", label: "À vérifier" },
];

const CLASSIFICATIONS: Record<string, { label: string; ton: string }> = {
  critique: { label: "Critique", ton: "bg-red-50 text-red-700" },
  important: { label: "Important", ton: "bg-orange-50 text-orange-700" },
  opportunite: { label: "Opportunité", ton: "bg-amber-50 text-amber-700" },
  information: { label: "Information", ton: "bg-black/5 text-black/60" },
};

const DECISIONS: Record<string, string> = {
  attente: "En attente de décision",
  oui: "Intégrée",
  non: "Refusée",
  plus_tard: "Reportée",
  analyser: "À analyser davantage",
};

/** État réel d'une source : jamais « actif » sans preuve de synchronisation. */
const ETATS_SOURCE: Record<string, { label: string; ton: string }> = {
  actif: { label: "Actif — synchronisation obtenue", ton: "bg-emerald-50 text-emerald-700" },
  configure_non_confirme: {
    label: "Configuré, pas encore confirmé actif",
    ton: "bg-amber-50 text-amber-700",
  },
  non_configure: { label: "Non configuré", ton: "bg-black/5 text-black/60" },
  autorisation_non_confirmee: {
    label: "Autorisation non confirmée — absorption bloquée",
    ton: "bg-orange-50 text-orange-700",
  },
  erreur: { label: "Erreur de synchronisation", ton: "bg-red-50 text-red-700" },
  interdite: { label: "Interdite", ton: "bg-red-50 text-red-700" },
};

const STATUTS_NOEUD: Record<string, string> = {
  propose: "Observé une fois",
  confirme: "Confirmé",
  conteste: "Contesté",
  obsolete: "Obsolète",
};

function dateCourte(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{titre}</p>
      <p className="mt-1 text-lg font-black text-[#111]">{valeur}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-black/50">{detail}</p> : null}
    </div>
  );
}

export default function CentreConnaissance() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";
  const [onglet, setOnglet] = useState<Onglet>("memoire");
  const [recherche, setRecherche] = useState("");
  const [domaine, setDomaine] = useState("");
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const referentiels = trpc.knowledgeEngine.referentiels.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const stats = trpc.knowledgeEngine.stats.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const noeuds = trpc.knowledgeEngine.rechercher.useQuery(
    { query: recherche || undefined, domain: domaine || undefined, limit: 120 },
    { enabled: !!isDirection && onglet === "memoire", refetchOnWindowFocus: false },
  );
  const memoire = trpc.knowledgeEngine.memoire.useQuery(
    { nodeId: ouvert ?? 0 },
    { enabled: !!isDirection && ouvert !== null, refetchOnWindowFocus: false },
  );
  const decouvertes = trpc.knowledgeEngine.decouvertes.useQuery(
    { limit: 120 },
    { enabled: !!isDirection && onglet === "decouvertes", refetchOnWindowFocus: false },
  );
  const decouvertesStats = trpc.knowledgeEngine.decouvertesStats.useQuery(undefined, {
    enabled: !!isDirection && onglet === "decouvertes",
    refetchOnWindowFocus: false,
  });
  const sources = trpc.knowledgeEngine.sources.useQuery(undefined, {
    enabled: !!isDirection && onglet === "sources",
    refetchOnWindowFocus: false,
  });
  const couverture = trpc.knowledgeEngine.couvertureManquante.useQuery(undefined, {
    enabled: !!isDirection && onglet === "couverture",
    refetchOnWindowFocus: false,
  });
  const aVerifier = trpc.knowledgeEngine.connaissancesAVerifier.useQuery(
    { jours: 180 },
    { enabled: !!isDirection && onglet === "verifier", refetchOnWindowFocus: false },
  );

  const apprendre = trpc.knowledgeEngine.apprendreInterne.useMutation({
    onSuccess: (r) => {
      const resume = r.rapports
        .map((b) => `${b.domaine} : ${b.noeudsCrees} nouvelle(s), ${b.liensCrees} lien(s)`)
        .join(" · ");
      setMessage(
        r.erreurs.length > 0
          ? `${resume} — ${r.erreurs.length} bloc(s) en erreur : ${r.erreurs.join(" ; ")}`
          : resume || "Aucune donnée interne exploitable pour l'instant.",
      );
      stats.refetch();
      noeuds.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const initialiserSources = trpc.knowledgeEngine.initialiserSources.useMutation({
    onSuccess: (r) => {
      setMessage(`${r.crees} source(s) enregistrée(s), ${r.existants} déjà connue(s).`);
      sources.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const decider = trpc.knowledgeEngine.deciderDecouverte.useMutation({
    onSuccess: (r) => {
      setMessage(
        r.ok
          ? r.actionTaskId
            ? `Décision enregistrée — action #${r.actionTaskId} ouverte dans le Centre d'Actions.`
            : "Décision enregistrée."
          : r.raison,
      );
      decouvertes.refetch();
      decouvertesStats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const s = stats.data;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Brain size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Mémoire automobile</h1>
            <p className="text-xs text-white/50">
              Ce que la plateforme sait, d'où elle le tient, et depuis quand — apprendre n'est pas
              publier.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stats.refetch();
              noeuds.refetch();
            }}
            className="rounded-lg bg-white/10 p-2 text-white/70"
            aria-label="Recharger"
          >
            <RefreshCw size={16} className={stats.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => {
              setOnglet(o.key);
              setOuvert(null);
            }}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
              onglet === o.key ? "bg-[#111] text-white" : "bg-white text-black/60"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 px-4">
        {message ? (
          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3 text-xs text-black/70">
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Carte titre="Connaissances" valeur={String(s?.noeuds ?? 0)} />
          <Carte
            titre="Confirmées"
            valeur={String(s?.confirmes ?? 0)}
            detail="observées plusieurs fois"
          />
          <Carte titre="Liens" valeur={String(s?.liens ?? 0)} detail="relations réellement établies" />
          <Carte
            titre="Territoriales"
            valeur={String(s?.territoriaux ?? 0)}
            detail="rattachées à un pays précis"
          />
          <Carte
            titre="Licence inconnue"
            valeur={String(s?.licenceInconnue ?? 0)}
            detail="publication interdite"
          />
          <Carte
            titre="Jamais vérifiées"
            valeur={String(s?.sansProvenance ?? 0)}
            detail="aucune confrontation à une source"
          />
        </div>

        {onglet === "memoire" ? (
          <div className="space-y-3">
            {isPdg ? (
              <button
                type="button"
                onClick={() => apprendre.mutate({ limit: 400 })}
                disabled={apprendre.isPending}
                className="w-full rounded-xl bg-[#111] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {apprendre.isPending
                  ? "Absorption des données MKA.P-MS en cours…"
                  : "Apprendre des données MKA.P-MS (annonces, pièces, pannes confirmées)"}
              </button>
            ) : null}

            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                <Search size={14} className="text-black/30" />
                <input
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher une marque, un modèle, une pièce…"
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
              <select
                value={domaine}
                onChange={(e) => setDomaine(e.target.value)}
                className="rounded-xl border border-black/10 bg-white px-2 text-xs"
              >
                <option value="">Tous domaines</option>
                {(referentiels.data?.domaines ?? []).map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {noeuds.isLoading ? (
              <p className="text-sm text-black/50">Chargement de la mémoire…</p>
            ) : (noeuds.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">
                Aucune connaissance enregistrée pour cette recherche. La mémoire ne contient que ce
                qui a réellement été observé.
              </p>
            ) : (
              <div className="space-y-2">
                {(noeuds.data ?? []).map((n) => (
                  <div key={n.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <button
                      type="button"
                      onClick={() => setOuvert(ouvert === n.id ? null : n.id)}
                      className="flex w-full items-start gap-2 text-left"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#111]">{n.label}</p>
                        <p className="mt-0.5 text-[11px] text-black/50">
                          {referentiels.data?.domaines.find((d) => d.code === n.domain)?.label ??
                            n.domain}{" "}
                          · {n.kind} ·{" "}
                          {n.countryCode ? `pays ${n.countryCode}` : "pays non renseigné"}
                        </p>
                      </div>
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/60">
                        {STATUTS_NOEUD[n.status] ?? n.status}
                      </span>
                    </button>

                    {n.summary ? (
                      <p className="mt-2 text-[11px] text-black/60">{n.summary}</p>
                    ) : null}

                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-black/40">
                      <span>{n.observations} observation(s)</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> vérifiée le {dateCourte(n.lastVerifiedAt)}
                      </span>
                      {n.learnedByEngine ? <span>apprise par {n.learnedByEngine}</span> : null}
                    </p>

                    {ouvert === n.id ? (
                      <div className="mt-3 border-t border-black/5 pt-2">
                        {memoire.isLoading ? (
                          <p className="text-[11px] text-black/40">Chargement…</p>
                        ) : !memoire.data ? (
                          <p className="text-[11px] text-black/40">Connaissance introuvable.</p>
                        ) : (
                          <>
                            <p
                              className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                memoire.data.publiable
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-orange-50 text-orange-700"
                              }`}
                            >
                              {memoire.data.publiable
                                ? "Publiable — licence établie"
                                : "Interne seulement — licence non établie"}
                            </p>

                            <p className="mb-1 text-[11px] font-bold text-black/60">
                              Relations enregistrées
                            </p>
                            {memoire.data.neighbours.length === 0 ? (
                              <p className="text-[11px] text-black/40">
                                Aucune relation. Rien n'est déduit par ressemblance de nom.
                              </p>
                            ) : (
                              <ul className="space-y-1">
                                {memoire.data.neighbours.map((v, i) => (
                                  <li
                                    key={`${v.node.id}-${v.relation}-${i}`}
                                    className="flex items-center gap-1 text-[11px] text-black/60"
                                  >
                                    <Link2 size={11} className="shrink-0 text-black/30" />
                                    <span className="font-bold">{v.relation}</span>
                                    <span>{v.direction === "sortant" ? "→" : "←"}</span>
                                    <button
                                      type="button"
                                      onClick={() => setOuvert(v.node.id)}
                                      className="underline"
                                    >
                                      {v.node.label}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <p className="mb-1 mt-3 text-[11px] font-bold text-black/60">
                              Provenance
                            </p>
                            {memoire.data.provenance.length === 0 ? (
                              <p className="text-[11px] text-black/40">
                                Aucune provenance : connaissance utilisable en interne, jamais
                                publiée.
                              </p>
                            ) : (
                              <ul className="space-y-1">
                                {memoire.data.provenance.map((p) => (
                                  <li key={p.id} className="text-[11px] text-black/60">
                                    {p.sourceCode} ·{" "}
                                    {referentiels.data?.licences.find((l) => l.code === p.license)
                                      ?.label ?? p.license}{" "}
                                    · observée le {dateCourte(p.observedAt)}
                                    {p.countryCode ? ` · pays ${p.countryCode}` : ""}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {onglet === "decouvertes" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Carte
                titre="En attente"
                valeur={String(decouvertesStats.data?.attente ?? 0)}
                detail="aucune n'est publiée"
              />
              <Carte titre="Critiques" valeur={String(decouvertesStats.data?.critiques ?? 0)} />
            </div>

            {decouvertes.isLoading ? (
              <p className="text-sm text-black/50">Chargement des découvertes…</p>
            ) : (decouvertes.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">
                Aucune découverte enregistrée. Elles n'apparaîtront qu'à partir de sources
                réellement autorisées.
              </p>
            ) : (
              <div className="space-y-2">
                {(decouvertes.data ?? []).map((d) => {
                  const cl = CLASSIFICATIONS[d.classification] ?? {
                    label: d.classification,
                    ton: "bg-black/5 text-black/60",
                  };
                  return (
                    <div key={d.id} className="rounded-xl border border-black/5 bg-white p-3">
                      <div className="flex items-start gap-2">
                        <BookOpen size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#111]">{d.title}</p>
                          <p className="mt-0.5 text-[11px] text-black/50">
                            {d.domain} ·{" "}
                            {d.countryCode ? `pays ${d.countryCode}` : "pays non renseigné"} ·{" "}
                            {d.sourceCode ?? "source non renseignée"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cl.ton}`}
                        >
                          {cl.label}
                        </span>
                      </div>

                      {d.detail ? (
                        <p className="mt-2 text-[11px] text-black/60">{d.detail}</p>
                      ) : null}
                      {d.interest ? (
                        <p className="mt-1 text-[11px] text-black/50">→ {d.interest}</p>
                      ) : null}

                      <p className="mt-2 text-[11px] text-black/40">
                        {DECISIONS[d.decision] ?? d.decision}
                        {d.decidedAt ? ` le ${dateCourte(d.decidedAt)}` : ""}
                        {d.actionTaskId ? ` · action #${d.actionTaskId}` : ""}
                      </p>

                      {isPdg && (d.decision === "attente" || d.decision === "analyser") ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => decider.mutate({ id: d.id, decision: "oui" })}
                            disabled={decider.isPending}
                            className="rounded-lg bg-[#111] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                          >
                            Oui — intégrer
                          </button>
                          <button
                            type="button"
                            onClick={() => decider.mutate({ id: d.id, decision: "non" })}
                            disabled={decider.isPending}
                            className="rounded-lg border border-black/10 px-3 py-1.5 text-[11px] font-bold text-black/60 disabled:opacity-50"
                          >
                            Non
                          </button>
                          <button
                            type="button"
                            onClick={() => decider.mutate({ id: d.id, decision: "plus_tard" })}
                            disabled={decider.isPending}
                            className="rounded-lg border border-black/10 px-3 py-1.5 text-[11px] font-bold text-black/60 disabled:opacity-50"
                          >
                            Plus tard
                          </button>
                          {d.decision === "attente" ? (
                            <button
                              type="button"
                              onClick={() => decider.mutate({ id: d.id, decision: "analyser" })}
                              disabled={decider.isPending}
                              className="rounded-lg border border-black/10 px-3 py-1.5 text-[11px] font-bold text-black/60 disabled:opacity-50"
                            >
                              Analyser davantage
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {onglet === "sources" ? (
          <div className="space-y-3">
            {isPdg ? (
              <button
                type="button"
                onClick={() => initialiserSources.mutate()}
                disabled={initialiserSources.isPending}
                className="w-full rounded-xl bg-[#111] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Enregistrer le catalogue des sources prévues
              </button>
            ) : null}

            {sources.isLoading ? (
              <p className="text-sm text-black/50">Chargement des sources…</p>
            ) : (sources.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">
                Aucune source enregistrée pour l'instant.
              </p>
            ) : (
              <div className="space-y-2">
                {(sources.data ?? []).map((src) => {
                  const et = ETATS_SOURCE[src.etatAffiche] ?? {
                    label: src.etatAffiche,
                    ton: "bg-black/5 text-black/60",
                  };
                  return (
                    <div key={src.id} className="rounded-xl border border-black/5 bg-white p-3">
                      <div className="flex items-start gap-2">
                        <Plug size={14} className="mt-0.5 shrink-0 text-black/30" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#111]">{src.label}</p>
                          <p className="mt-0.5 text-[11px] text-black/50">
                            {src.kindLabel} · {src.authorizationLabel} ·{" "}
                            {src.countryCode ? `pays ${src.countryCode}` : "tous pays"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${et.ton}`}
                        >
                          {et.label}
                        </span>
                      </div>

                      {src.authorizationRef ? (
                        <p className="mt-2 text-[11px] text-black/60">{src.authorizationRef}</p>
                      ) : null}

                      <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-black/40">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> dernière synchronisation{" "}
                          {src.lastSyncAt ? dateCourte(src.lastSyncAt) : "jamais"}
                        </span>
                        {src.rateLimit ? <span>limite : {src.rateLimit}</span> : null}
                        <span>
                          fiabilité :{" "}
                          {src.reliability === null ? "non mesurée" : `${src.reliability}/100`}
                        </span>
                      </p>

                      {!src.absorptionAutorisee ? (
                        <p className="mt-2 flex items-start gap-1 rounded-lg bg-orange-50 p-2 text-[11px] text-orange-700">
                          <ShieldAlert size={12} className="mt-0.5 shrink-0" />
                          <span>
                            Aucune connaissance ne peut entrer par cette source : son autorisation
                            n'est pas établie.
                          </span>
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {onglet === "couverture" ? (
          couverture.isLoading ? (
            <p className="text-sm text-black/50">Analyse de la couverture…</p>
          ) : (couverture.data ?? []).length === 0 ? (
            <p className="text-sm text-black/50">
              Tous les domaines suivis contiennent au moins une connaissance.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-black/50">
                Domaines encore vides. C'est un constat, pas une estimation : une source autorisée
                est nécessaire pour les alimenter.
              </p>
              <div className="flex flex-wrap gap-2">
                {(couverture.data ?? []).map((g) => (
                  <span
                    key={g.domain}
                    className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] text-black/60"
                  >
                    <Globe size={11} className="text-black/30" /> {g.label}
                  </span>
                ))}
              </div>
            </div>
          )
        ) : null}

        {onglet === "verifier" ? (
          aVerifier.isLoading ? (
            <p className="text-sm text-black/50">Chargement…</p>
          ) : (aVerifier.data ?? []).length === 0 ? (
            <p className="text-sm text-black/50">
              Aucune connaissance en attente de vérification.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-600" />
                <span>
                  Connaissances jamais confrontées à une source, ou pas depuis six mois. Une
                  information ancienne reste utilisable, mais elle doit être datable.
                </span>
              </p>
              {(aVerifier.data ?? []).map((n) => (
                <div key={n.id} className="rounded-xl border border-black/5 bg-white p-3">
                  <p className="text-sm font-bold text-[#111]">{n.label}</p>
                  <p className="mt-0.5 text-[11px] text-black/50">
                    {n.domain} · dernière vérification {dateCourte(n.lastVerifiedAt)}
                  </p>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
