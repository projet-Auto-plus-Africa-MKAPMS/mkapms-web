/**
 * Points 73-74-76-77-78 — Centre de Résilience (écran PDG / Direction).
 *
 * Ce que l'écran refuse de faire, volontairement :
 *  - il ne présente jamais une fermeture comme un arrêt de la plateforme : ce
 *    qui reste administrable est écrit noir sur blanc à côté du bouton ;
 *  - il n'exécute aucune action critique sur un clic : la phrase doit être
 *    ressaisie, et la confirmation expire ;
 *  - il n'affiche pas « prêt pour la production » tant qu'une étape obligatoire
 *    manque ou qu'aucun retour arrière n'est décrit ;
 *  - il ne présente pas une réparation comme réussie sans vérification ;
 *  - il distingue une leçon écrite d'une leçon validée : seule la seconde peut
 *    être rejouée automatiquement.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Activity,
  ChevronLeft,
  GitBranch,
  Globe,
  LifeBuoy,
  Lock,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Onglet = "ouverture" | "critiques" | "pipeline" | "reparation" | "lecons";

const ONGLETS: { key: Onglet; label: string }[] = [
  { key: "ouverture", label: "Ouverture au public" },
  { key: "critiques", label: "Actions critiques" },
  { key: "pipeline", label: "Avant production" },
  { key: "reparation", label: "Auto-réparation" },
  { key: "lecons", label: "Leçons" },
];

const NIVEAUX: Record<string, { label: string; ton: string }> = {
  ouvert: { label: "Ouvert au public", ton: "bg-emerald-50 text-emerald-700" },
  maintenance: { label: "Maintenance — public fermé", ton: "bg-amber-50 text-amber-700" },
  urgence: { label: "Urgence — public fermé", ton: "bg-red-50 text-red-700" },
};

const STATUTS_PIPELINE: Record<string, { label: string; ton: string }> = {
  en_cours: { label: "En cours", ton: "bg-black/5 text-black/60" },
  bloque: { label: "Bloqué", ton: "bg-red-50 text-red-700" },
  pret_production: { label: "Prêt pour la production", ton: "bg-emerald-50 text-emerald-700" },
  en_production: { label: "En production", ton: "bg-blue-50 text-blue-700" },
  annule: { label: "Annulé", ton: "bg-black/5 text-black/50" },
};

const STATUTS_CRITIQUE: Record<string, { label: string; ton: string }> = {
  attente: { label: "En attente de confirmation", ton: "bg-orange-50 text-orange-700" },
  confirme: { label: "Confirmée", ton: "bg-emerald-50 text-emerald-700" },
  consomme: { label: "Utilisée", ton: "bg-black/5 text-black/60" },
  refuse: { label: "Refusée", ton: "bg-red-50 text-red-700" },
  expire: { label: "Expirée", ton: "bg-black/5 text-black/50" },
};

function dateCourte(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
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

export default function CentreResilience() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";
  const [onglet, setOnglet] = useState<Onglet>("ouverture");
  const [message, setMessage] = useState<string | null>(null);

  const [scope, setScope] = useState<"mondial" | "pays" | "univers">("mondial");
  const [scopeKey, setScopeKey] = useState("");
  const [niveau, setNiveau] = useState<"ouvert" | "maintenance" | "urgence">("maintenance");
  const [motif, setMotif] = useState("");
  const [messagePublic, setMessagePublic] = useState("");

  const [phrases, setPhrases] = useState<Record<number, string>>({});
  const [leconEdit, setLeconEdit] = useState<Record<number, { cause: string; solution: string; prevention: string }>>({});

  const referentiels = trpc.resilience.referentiels.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const stats = trpc.resilience.stats.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const portees = trpc.resilience.portees.useQuery(undefined, {
    enabled: !!isDirection && onglet === "ouverture",
    refetchOnWindowFocus: false,
  });
  const journal = trpc.resilience.journalPortees.useQuery(
    { limit: 60 },
    { enabled: !!isDirection && onglet === "ouverture", refetchOnWindowFocus: false },
  );
  const critiques = trpc.resilience.demandesCritiques.useQuery(
    { limit: 100 },
    { enabled: !!isDirection && onglet === "critiques", refetchOnWindowFocus: false },
  );
  const passages = trpc.resilience.passages.useQuery(
    { limit: 100 },
    { enabled: !!isDirection && onglet === "pipeline", refetchOnWindowFocus: false },
  );
  const lecons = trpc.resilience.lecons.useQuery(
    { limit: 150 },
    { enabled: !!isDirection && onglet === "lecons", refetchOnWindowFocus: false },
  );

  const basculer = trpc.resilience.basculer.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      portees.refetch();
      journal.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const confirmer = trpc.resilience.confirmerCritique.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      critiques.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const refuser = trpc.resilience.refuserCritique.useMutation({
    onSuccess: () => {
      setMessage("Demande refusée : l'action critique n'aura pas lieu.");
      critiques.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const reparer = trpc.resilience.autoReparer.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      stats.refetch();
      lecons.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const completer = trpc.resilience.completerLecon.useMutation({
    onSuccess: () => {
      setMessage("Leçon complétée. Elle doit être validée avant d'être rejouée seule.");
      lecons.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const validerLecon = trpc.resilience.validerLecon.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail ?? "Leçon validée.");
      lecons.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const s = stats.data;
  const fermetures = (portees.data ?? []).filter((p) => p.level !== "ouvert");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <LifeBuoy size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Centre de Résilience</h1>
            <p className="text-xs text-white/50">
              Fermer au public sans rien détruire, protéger les actions critiques, et n'aller en
              production qu'après les étapes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stats.refetch();
              portees.refetch();
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
            onClick={() => setOnglet(o.key)}
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
          <Carte
            titre="Portées fermées"
            valeur={String(s?.fermetures ?? 0)}
            detail={s?.fermetures ? "le cœur reste administrable" : "plateforme ouverte"}
          />
          <Carte
            titre="Actions critiques en attente"
            valeur={String(s?.critiques.attente ?? 0)}
            detail="confirmation renforcée requise"
          />
          <Carte
            titre="Passages bloqués"
            valeur={String(s?.pipelines.bloques ?? 0)}
            detail={`${s?.pipelines.prets ?? 0} prêt(s) pour la production`}
          />
          <Carte
            titre="Leçons mémorisées"
            valeur={String(s?.lecons.total ?? 0)}
            detail={`${s?.lecons.reutilisables ?? 0} rejouable(s), ${s?.lecons.repetees ?? 0} répétée(s)`}
          />
        </div>

        {/* ── Point 73 ─────────────────────────────────────────────── */}
        {onglet === "ouverture" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <ShieldAlert size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  Fermer au public n'éteint pas MKA.P-MS. Restent joignables :{" "}
                  {(referentiels.data?.preservations ?? []).join(", ").replace(/_/g, " ") ||
                    "administration, journaux, base, sauvegardes, sécurité, supervision"}
                  . La réouverture est toujours possible.
                </span>
              </p>
            </div>

            {fermetures.length === 0 ? (
              <p className="text-sm text-black/50">
                Aucune fermeture en cours : toutes les portées sont ouvertes au public.
              </p>
            ) : (
              <div className="space-y-2">
                {fermetures.map((p) => (
                  <div key={p.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-black/30" />
                      <p className="flex-1 text-sm font-bold text-[#111]">
                        {p.scope === "mondial" ? "Toute la plateforme" : `${p.scope} — ${p.scopeKey}`}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          NIVEAUX[p.level]?.ton ?? "bg-black/5 text-black/60"
                        }`}
                      >
                        {NIVEAUX[p.level]?.label ?? p.level}
                      </span>
                    </div>
                    {p.reason ? <p className="mt-1 text-[11px] text-black/60">{p.reason}</p> : null}
                    <p className="mt-1 text-[10px] text-black/40">
                      Fermée le {dateCourte(p.activatedAt)}
                    </p>
                    {isPdg ? (
                      <button
                        type="button"
                        onClick={() =>
                          basculer.mutate({
                            scope: p.scope as "mondial" | "pays" | "univers",
                            scopeKey: p.scopeKey === "*" ? undefined : p.scopeKey,
                            level: "ouvert",
                          })
                        }
                        className="mt-2 rounded-lg bg-[#111] px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        Rouvrir au public
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {isPdg ? (
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-xs font-bold text-[#111]">Changer l'ouverture</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as typeof scope)}
                    className="rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                  >
                    <option value="mondial">Toute la plateforme</option>
                    <option value="pays">Un pays</option>
                    <option value="univers">Un univers</option>
                  </select>
                  <select
                    value={niveau}
                    onChange={(e) => setNiveau(e.target.value as typeof niveau)}
                    className="rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                  >
                    <option value="ouvert">Ouvrir au public</option>
                    <option value="maintenance">Maintenance — fermer au public</option>
                    <option value="urgence">Urgence — fermer et suspendre les dépôts</option>
                  </select>
                </div>
                {scope !== "mondial" ? (
                  <input
                    value={scopeKey}
                    onChange={(e) => setScopeKey(e.target.value)}
                    placeholder={scope === "pays" ? "Code pays (ex. SN, GN, CA)" : "Code univers"}
                    className="mt-2 w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                  />
                ) : null}
                <input
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Motif interne (conservé au journal)"
                  className="mt-2 w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                />
                <textarea
                  value={messagePublic}
                  onChange={(e) => setMessagePublic(e.target.value)}
                  placeholder="Message affiché aux visiteurs"
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                />
                <button
                  type="button"
                  disabled={basculer.isPending}
                  onClick={() =>
                    basculer.mutate({
                      scope,
                      scopeKey: scope === "mondial" ? undefined : scopeKey.trim() || undefined,
                      level: niveau,
                      reason: motif.trim() || undefined,
                      publicMessage: messagePublic.trim() || undefined,
                    })
                  }
                  className="mt-2 w-full rounded-lg bg-[#111] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Appliquer
                </button>
              </div>
            ) : null}

            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-xs font-bold text-[#111]">Journal des ouvertures et fermetures</p>
              {(journal.data ?? []).length === 0 ? (
                <p className="mt-1 text-[11px] text-black/50">Aucun basculement enregistré.</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {(journal.data ?? []).map((e) => (
                    <div key={e.id} className="border-t border-black/5 pt-1.5 text-[11px] text-black/60">
                      <span className="font-bold text-[#111]">
                        {e.scopeKey === "*" ? "Mondial" : e.scopeKey}
                      </span>{" "}
                      : {e.fromLevel} → {e.toLevel} — {dateCourte(e.createdAt)}
                      {e.reason ? <span className="block text-black/50">{e.reason}</span> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Point 74 ─────────────────────────────────────────────── */}
        {onglet === "critiques" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-xs font-bold text-[#111]">Trois niveaux d'actions</p>
              <div className="mt-2 space-y-1.5">
                {(referentiels.data?.risques ?? []).map((r) => (
                  <div key={r.niveau} className="border-t border-black/5 pt-1.5">
                    <p className="text-[11px] font-bold text-[#111]">{r.label}</p>
                    <p className="text-[11px] text-black/55">{r.regime}</p>
                  </div>
                ))}
              </div>
            </div>

            {(critiques.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">Aucune action critique demandée.</p>
            ) : (
              (critiques.data ?? []).map((c) => (
                <div key={c.id} className="rounded-xl border border-black/5 bg-white p-3">
                  <div className="flex items-start gap-2">
                    <Lock size={14} className="mt-0.5 text-black/30" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#111]">{c.title}</p>
                      <p className="text-[11px] text-black/50">{c.actionType}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        STATUTS_CRITIQUE[c.status]?.ton ?? "bg-black/5 text-black/60"
                      }`}
                    >
                      {STATUTS_CRITIQUE[c.status]?.label ?? c.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-black/65">{c.impact}</p>
                  <p className="mt-1 text-[10px] text-black/45">
                    {c.reversible ? "Réversible" : "Irréversible"} ·{" "}
                    {c.countryCode ? `Pays ${c.countryCode}` : "Pays non renseigné"} · expire le{" "}
                    {dateCourte(c.expiresAt)}
                  </p>

                  {isPdg && c.status === "attente" ? (
                    <div className="mt-2">
                      <p className="text-[11px] text-black/55">
                        Ressaisir exactement : <span className="font-bold text-[#111]">{c.challenge}</span>
                      </p>
                      <div className="mt-1.5 flex gap-2">
                        <input
                          value={phrases[c.id] ?? ""}
                          onChange={(e) => setPhrases((p) => ({ ...p, [c.id]: e.target.value }))}
                          placeholder="Phrase de confirmation"
                          className="flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            confirmer.mutate({ id: c.id, phrase: phrases[c.id] ?? "" })
                          }
                          className="rounded-lg bg-[#111] px-3 py-1.5 text-[11px] font-bold text-white"
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => refuser.mutate({ id: c.id })}
                          className="rounded-lg border border-black/10 px-3 py-1.5 text-[11px] font-bold text-black/60"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}

        {/* ── Point 76 ─────────────────────────────────────────────── */}
        {onglet === "pipeline" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <GitBranch size={12} className="mt-0.5 shrink-0 text-black/40" />
                <span>
                  Aucun changement ne passe en production sans avoir franchi ses étapes, et un
                  changement sans retour arrière décrit est refusé.
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(referentiels.data?.etapesPipeline ?? []).map((e) => (
                  <span
                    key={e.code}
                    className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/60"
                  >
                    {e.label}
                  </span>
                ))}
              </div>
            </div>

            {(passages.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">Aucun passage enregistré.</p>
            ) : (
              (passages.data ?? []).map((p) => (
                <div key={p.id} className="rounded-xl border border-black/5 bg-white p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#111]">{p.title}</p>
                      <p className="text-[11px] text-black/50">
                        {p.origin}
                        {p.originRef ? ` · ${p.originRef}` : ""} · niveau {p.riskLevel}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        STATUTS_PIPELINE[p.status]?.ton ?? "bg-black/5 text-black/60"
                      }`}
                    >
                      {STATUTS_PIPELINE[p.status]?.label ?? p.status}
                    </span>
                  </div>
                  {p.blockedReason ? (
                    <p className="mt-1.5 rounded-lg bg-red-50 p-2 text-[11px] text-red-700">
                      {p.blockedReason}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] text-black/45">
                    {p.rollbackPlan ? `Retour arrière : ${p.rollbackPlan}` : "Aucun retour arrière documenté"}
                  </p>
                  {p.steps.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {p.steps.map((st, i) => (
                        <div key={i} className="border-t border-black/5 pt-1 text-[11px] text-black/60">
                          <span
                            className={
                              st.status === "echec"
                                ? "font-bold text-red-700"
                                : st.status === "ok"
                                  ? "font-bold text-emerald-700"
                                  : "font-bold text-black/60"
                            }
                          >
                            {st.step}
                          </span>{" "}
                          — {st.detail}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}

        {/* ── Point 77 ─────────────────────────────────────────────── */}
        {onglet === "reparation" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <Wrench size={12} className="mt-0.5 shrink-0 text-black/40" />
                <span>
                  Une réparation n'est annoncée que si elle est vérifiée après coup. Une correction
                  appliquée mais non confirmée active est comptée comme un échec, pas comme une
                  réussite.
                </span>
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Carte titre="Recettes apprises" valeur={String(s?.recettes.total ?? 0)} />
                <Carte titre="Rejouables seules" valeur={String(s?.recettes.auto ?? 0)} />
                <Carte titre="Applications" valeur={String(s?.recettes.applied ?? 0)} />
              </div>
              {isPdg ? (
                <button
                  type="button"
                  disabled={reparer.isPending}
                  onClick={() => reparer.mutate()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#111] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Activity size={14} />
                  {reparer.isPending ? "Réparation en cours…" : "Lancer une réparation vérifiée"}
                </button>
              ) : (
                <p className="mt-2 text-[11px] text-black/50">
                  Le lancement d'une réparation est réservé au PDG.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Point 78 ─────────────────────────────────────────────── */}
        {onglet === "lecons" ? (
          <div className="space-y-3">
            <p className="text-[11px] text-black/50">
              Une erreur devient une connaissance : cause, solution, résultat, prévention. Une leçon
              n'est rejouée automatiquement qu'après validation, et sa réécriture annule cette
              validation.
            </p>
            {(lecons.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">Aucune erreur mémorisée pour l'instant.</p>
            ) : (
              (lecons.data ?? []).map((l) => {
                const brouillon = leconEdit[l.id] ?? {
                  cause: l.cause ?? "",
                  solution: l.solution ?? "",
                  prevention: l.prevention ?? "",
                };
                return (
                  <div key={l.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#111]">{l.problem}</p>
                        <p className="text-[11px] text-black/50">
                          {l.source} · {l.occurrences} occurrence(s) · vue le {dateCourte(l.lastSeenAt)}
                          {l.countryCode ? ` · ${l.countryCode}` : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          l.reusable
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {l.reusable ? "Rejouable" : "Non validée"}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      <input
                        value={brouillon.cause}
                        onChange={(e) =>
                          setLeconEdit((p) => ({ ...p, [l.id]: { ...brouillon, cause: e.target.value } }))
                        }
                        placeholder="Cause constatée"
                        className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                      />
                      <input
                        value={brouillon.solution}
                        onChange={(e) =>
                          setLeconEdit((p) => ({ ...p, [l.id]: { ...brouillon, solution: e.target.value } }))
                        }
                        placeholder="Solution appliquée"
                        className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                      />
                      <input
                        value={brouillon.prevention}
                        onChange={(e) =>
                          setLeconEdit((p) => ({ ...p, [l.id]: { ...brouillon, prevention: e.target.value } }))
                        }
                        placeholder="Prévention"
                        className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            completer.mutate({
                              id: l.id,
                              cause: brouillon.cause || undefined,
                              solution: brouillon.solution || undefined,
                              prevention: brouillon.prevention || undefined,
                            })
                          }
                          className="rounded-lg border border-black/10 px-3 py-1.5 text-[11px] font-bold text-black/60"
                        >
                          Enregistrer
                        </button>
                        {isPdg ? (
                          <button
                            type="button"
                            onClick={() => validerLecon.mutate({ id: l.id })}
                            className="rounded-lg bg-[#111] px-3 py-1.5 text-[11px] font-bold text-white"
                          >
                            Valider pour rejeu automatique
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
