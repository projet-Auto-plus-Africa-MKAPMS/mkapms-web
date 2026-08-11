/**
 * Points 84-85-86-88-89-90 — Centre IA, coûts & supervision (PDG / Direction).
 *
 * L'écran refuse quatre illusions :
 *  • un fournisseur « prêt » alors qu'aucun accès n'est fourni ;
 *  • une capacité présentée comme sûre alors qu'un seul acteur la rend ;
 *  • une économie affichée alors que personne ne l'a déclarée ;
 *  • une sauvegarde de mémoire annoncée sans contrôle d'intégrité.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Activity,
  ChevronLeft,
  Coins,
  Database,
  Network,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Onglet = "fournisseurs" | "dependance" | "couts" | "memoire" | "supervision" | "regle";

const ONGLETS: { key: Onglet; label: string }[] = [
  { key: "fournisseurs", label: "Fournisseurs" },
  { key: "dependance", label: "Dépendance" },
  { key: "couts", label: "Coûts & économie" },
  { key: "memoire", label: "Mémoire sauvegardée" },
  { key: "supervision", label: "Supervision moteurs" },
  { key: "regle", label: "Règle finale" },
];

const STATUT_TON: Record<string, string> = {
  actif: "bg-emerald-50 text-emerald-700",
  configure: "bg-blue-50 text-blue-700",
  non_configure: "bg-black/5 text-black/50",
  suspendu: "bg-red-50 text-red-700",
};

const STATUT_LABEL: Record<string, string> = {
  actif: "Actif",
  configure: "Configuré, jamais appelé",
  non_configure: "Non configuré",
  suspendu: "Suspendu",
};

const VERDICT_TON: Record<string, string> = {
  remplacable: "bg-emerald-50 text-emerald-700",
  fournisseur_unique: "bg-amber-50 text-amber-700",
  aucun_fournisseur: "bg-red-50 text-red-700",
};

const VERDICT_LABEL: Record<string, string> = {
  remplacable: "Remplaçable",
  fournisseur_unique: "Fournisseur unique",
  aucun_fournisseur: "Aucun fournisseur",
};

const ETAT_TON: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700",
  partiel: "bg-blue-50 text-blue-700",
  degrade: "bg-amber-50 text-amber-700",
  hors_service: "bg-red-50 text-red-700",
  non_configure: "bg-black/5 text-black/50",
};

const ROUTE_LABEL: Record<string, string> = {
  route: "Routé",
  aucun_fournisseur: "Aucun fournisseur",
  refus_confidentialite: "Refus — confidentialité",
  refus_capacite: "Refus — capacité inconnue",
};

function euros(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`;
}

function dateCourte(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("fr-FR");
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

export default function CentreIA() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";
  const [onglet, setOnglet] = useState<Onglet>("fournisseurs");
  const [message, setMessage] = useState<string | null>(null);
  const [essai, setEssai] = useState({ capacite: "ia_texte", tache: "", confidentialite: "publique" });

  const stats = trpc.aiFabric.stats.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const referentiels = trpc.aiFabric.referentiels.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const fournisseurs = trpc.aiFabric.fournisseurs.useQuery(undefined, {
    enabled: !!isDirection && onglet === "fournisseurs",
    refetchOnWindowFocus: false,
  });
  const routages = trpc.aiFabric.routages.useQuery(undefined, {
    enabled: !!isDirection && onglet === "fournisseurs",
    refetchOnWindowFocus: false,
  });
  const dependance = trpc.aiFabric.dependance.useQuery(undefined, {
    enabled: !!isDirection && onglet === "dependance",
    refetchOnWindowFocus: false,
  });
  const couts = trpc.aiFabric.couts.useQuery(
    { jours: 30 },
    { enabled: !!isDirection && onglet === "couts", refetchOnWindowFocus: false },
  );
  const sauvegardes = trpc.aiFabric.sauvegardesMemoire.useQuery(undefined, {
    enabled: !!isDirection && onglet === "memoire",
    refetchOnWindowFocus: false,
  });
  const supervision = trpc.aiFabric.supervision.useQuery(undefined, {
    enabled: !!isDirection && onglet === "supervision",
    refetchOnWindowFocus: false,
  });
  const regle = trpc.aiFabric.regleFinale.useQuery(undefined, {
    enabled: !!isDirection && onglet === "regle",
    refetchOnWindowFocus: false,
  });

  const simuler = trpc.aiFabric.simulerRoutage.useMutation({
    onSuccess: (r) => {
      setMessage(`${ROUTE_LABEL[r.verdict] ?? r.verdict} — ${r.reason}`);
      routages.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const suspendre = trpc.aiFabric.suspendreFournisseur.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      fournisseurs.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const sauvegarder = trpc.aiFabric.sauvegarderMemoire.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      sauvegardes.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const verifier = trpc.aiFabric.verifierMemoire.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      sauvegardes.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const restaurer = trpc.aiFabric.demanderRestauration.useMutation({
    onSuccess: (r) => setMessage(r.detail),
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
            <Network size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Fournisseurs, coûts & supervision</h1>
            <p className="text-xs text-white/50">
              Pouvoir changer de fournisseur sans reconstruire la plateforme, et savoir ce que
              chaque automatisation coûte réellement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => stats.refetch()}
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
            titre="Fournisseurs"
            valeur={`${s?.fournisseurs.actifs ?? 0}/${s?.fournisseurs.total ?? 0}`}
            detail={`${s?.fournisseurs.nonConfigures ?? 0} sans accès fourni`}
          />
          <Carte
            titre="Capacités à risque"
            valeur={String(s?.dependance.risqueEleve ?? 0)}
            detail={`sur ${s?.dependance.capacites ?? 0} capacités suivies`}
          />
          <Carte
            titre="Dépense 30 jours"
            valeur={euros(s?.couts.totalCents ?? 0)}
            detail={`${euros(s?.couts.mesureCents ?? 0)} réellement mesurés`}
          />
          <Carte
            titre="Mémoire"
            valeur={String(s?.memoire.sauvegardes ?? 0)}
            detail={`${s?.memoire.tablesSuivies ?? 0} tables de connaissance suivies`}
          />
        </div>

        {/* ── Points 84-85 ─────────────────────────────────────────── */}
        {onglet === "fournisseurs" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <ShieldAlert size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  Aucun moteur n'appelle un fournisseur en dur : tout passe par cette couche. Un
                  fournisseur n'est « actif » qu'après un usage réellement constaté — figurer au
                  catalogue ne suffit pas. Aucun secret n'est stocké : seuls les noms des variables
                  attendues sont affichés.
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-xs font-bold text-[#111]">Essayer un routage</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  value={essai.capacite}
                  onChange={(e) => setEssai((v) => ({ ...v, capacite: e.target.value }))}
                  className="rounded-lg border border-black/10 p-2 text-xs"
                >
                  {(referentiels.data?.capacites ?? []).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={essai.confidentialite}
                  onChange={(e) => setEssai((v) => ({ ...v, confidentialite: e.target.value }))}
                  className="rounded-lg border border-black/10 p-2 text-xs"
                >
                  {(referentiels.data?.confidentialites ?? []).map((c) => (
                    <option key={c} value={c}>
                      Donnée {c}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={essai.tache}
                onChange={(e) => setEssai((v) => ({ ...v, tache: e.target.value }))}
                placeholder="Tâche (ex. analyse_anomalie)"
                className="mt-2 w-full rounded-lg border border-black/10 p-2 text-xs"
              />
              <button
                type="button"
                disabled={essai.tache.trim().length < 2 || simuler.isPending}
                onClick={() =>
                  simuler.mutate({
                    capacite: essai.capacite,
                    tache: essai.tache.trim(),
                    confidentialite: essai.confidentialite as "publique",
                  })
                }
                className="mt-2 w-full rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Voir quel fournisseur serait choisi
              </button>
            </div>

            <div className="space-y-2">
              {(fournisseurs.data ?? []).map((f) => (
                <div key={f.code} className="rounded-xl border border-black/5 bg-white p-3">
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm font-bold text-[#111]">{f.label}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        STATUT_TON[f.status] ?? "bg-black/5 text-black/60"
                      }`}
                    >
                      {STATUT_LABEL[f.status] ?? f.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-black/60">{f.statusReason}</p>
                  <p className="mt-1 text-[10px] text-black/40">
                    {f.capability.replace(/_/g, " ")} · données traitées :{" "}
                    {f.dataResidency ?? "résidence non documentée"} · accepte jusqu'à{" "}
                    {f.confidentialityMax}
                  </p>
                  {f.switchingNote ? (
                    <p className="mt-1 text-[10px] text-black/50">{f.switchingNote}</p>
                  ) : null}
                  {isPdg ? (
                    <button
                      type="button"
                      disabled={suspendre.isPending}
                      onClick={() =>
                        suspendre.mutate({ code: f.code, suspendu: f.status !== "suspendu" })
                      }
                      className="mt-2 w-full rounded-lg bg-black/5 py-1.5 text-xs font-bold text-black/70 disabled:opacity-40"
                    >
                      {f.status === "suspendu" ? "Réactiver" : "Suspendre"}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            {(routages.data ?? []).length > 0 ? (
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-xs font-bold text-[#111]">Derniers routages, refus compris</p>
                <div className="mt-2 space-y-1">
                  {(routages.data ?? []).slice(0, 12).map((r) => (
                    <div key={r.id} className="rounded-lg bg-black/[0.02] p-2">
                      <p className="text-[11px] font-bold text-[#111]">
                        {ROUTE_LABEL[r.verdict] ?? r.verdict} · {r.taskType}
                      </p>
                      <p className="text-[10px] text-black/50">{r.reason}</p>
                      <p className="text-[10px] text-black/30">{dateCourte(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Point 84 ─────────────────────────────────────────────── */}
        {onglet === "dependance" ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-[11px] text-black/50">
                Payer pour construire des capacités durables plutôt que refaire éternellement les
                mêmes tâches — à condition de pouvoir changer d'acteur. Une capacité critique tenue
                par un seul fournisseur est signalée, même si tout fonctionne aujourd'hui.
              </p>
            </div>
            {(dependance.data?.capacites ?? []).map((c) => (
              <div key={c.capability} className="rounded-xl border border-black/5 bg-white p-3">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-sm font-bold text-[#111]">
                    {c.label}
                    {c.critique ? <span className="text-red-600"> · critique</span> : null}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      VERDICT_TON[c.verdict] ?? "bg-black/5 text-black/60"
                    }`}
                  >
                    {VERDICT_LABEL[c.verdict] ?? c.verdict}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-black/60">{c.detail}</p>
                {c.configurables.length > 0 ? (
                  <p className="mt-1 text-[10px] text-black/40">
                    Alternatives possibles, non branchées : {c.configurables.join(", ")}.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* ── Point 86 ─────────────────────────────────────────────── */}
        {onglet === "couts" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-xs text-black/70">
                <Coins size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                <span>{couts.data?.lecture ?? "Chargement…"}</span>
              </p>
            </div>

            {(couts.data?.parMoteur ?? []).length === 0 ? (
              <p className="text-sm text-black/50">
                Aucune dépense enregistrée. Le système n'invente pas de chiffre en attendant.
              </p>
            ) : (
              <>
                <div className="rounded-xl border border-black/5 bg-white p-3">
                  <p className="text-xs font-bold text-[#111]">Par moteur</p>
                  <div className="mt-2 space-y-1">
                    {(couts.data?.parMoteur ?? []).map((m) => (
                      <div key={m.engine} className="flex items-center gap-2 text-[11px]">
                        <span className="flex-1 text-black/70">{m.engine}</span>
                        <span className="font-bold text-[#111]">{euros(m.costCents)}</span>
                        <span className="text-black/40">
                          {m.opsEvitees > 0 ? `${m.opsEvitees} op. évitées` : "économie non déclarée"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-black/5 bg-white p-3">
                  <p className="text-xs font-bold text-[#111]">Par tâche</p>
                  <div className="mt-2 space-y-1">
                    {(couts.data?.parTache ?? []).map((t) => (
                      <div key={t.taskType} className="flex items-center gap-2 text-[11px]">
                        <span className="flex-1 text-black/70">{t.taskType}</span>
                        <span className="text-black/40">{t.appels} appel(s)</span>
                        <span className="font-bold text-[#111]">{euros(t.costCents)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* ── Point 88 ─────────────────────────────────────────────── */}
        {onglet === "memoire" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <Database size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  La connaissance est un actif : une panne ne doit pas effacer des années
                  d'apprentissage. Les lignes elles-mêmes sont confiées au Backup OS existant ;
                  cette page y ajoute la version, l'empreinte d'intégrité et l'écart depuis la
                  sauvegarde. Une restauration reste une demande soumise à validation humaine.
                </span>
              </p>
            </div>

            {isPdg ? (
              <button
                type="button"
                disabled={sauvegarder.isPending}
                onClick={() => sauvegarder.mutate({})}
                className="w-full rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Sauvegarder la mémoire maintenant
              </button>
            ) : null}

            {(sauvegardes.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">
                Aucune sauvegarde de mémoire enregistrée à ce jour.
              </p>
            ) : (
              <div className="space-y-2">
                {(sauvegardes.data ?? []).map((b) => (
                  <div key={b.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm font-bold text-[#111]">Version {b.version}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          b.integrity === "intacte"
                            ? "bg-emerald-50 text-emerald-700"
                            : b.integrity === "alteree"
                              ? "bg-red-50 text-red-700"
                              : "bg-black/5 text-black/50"
                        }`}
                      >
                        {b.integrity === "intacte"
                          ? "Intègre"
                          : b.integrity === "alteree"
                            ? "Altérée"
                            : "Non vérifiée"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-black/60">
                      {b.totalRows} ligne(s) sur {b.scope.length} table(s) · {dateCourte(b.createdAt)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={verifier.isPending}
                        onClick={() => verifier.mutate({ id: b.id })}
                        className="flex-1 rounded-lg bg-black/5 py-1.5 text-xs font-bold text-black/70 disabled:opacity-40"
                      >
                        Contrôler l'intégrité
                      </button>
                      {isPdg ? (
                        <button
                          type="button"
                          disabled={restaurer.isPending}
                          onClick={() => restaurer.mutate({ id: b.id })}
                          className="flex-1 rounded-lg bg-black/5 py-1.5 text-xs font-bold text-black/70 disabled:opacity-40"
                        >
                          Demander une restauration
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* ── Point 89 ─────────────────────────────────────────────── */}
        {onglet === "supervision" ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-xs text-black/70">
                <Activity size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                <span>
                  {supervision.data
                    ? `${supervision.data.total} moteurs supervisés, ${supervision.data.aTraiter} à traiter. Chaque état porte son motif, sa date et l'action proposée.`
                    : "Chargement…"}
                </span>
              </p>
            </div>
            {(supervision.data?.moteurs ?? [])
              .slice()
              .sort((a, b) => (a.operational === "ok" ? 1 : 0) - (b.operational === "ok" ? 1 : 0))
              .map((m) => (
                <div key={m.name} className="rounded-xl border border-black/5 bg-white p-3">
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm font-bold text-[#111]">{m.label}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        ETAT_TON[m.operational] ?? "bg-black/5 text-black/60"
                      }`}
                    >
                      {m.operational.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-black/60">{m.reason}</p>
                  {m.operational !== "ok" ? (
                    <>
                      <p className="mt-1 text-[10px] text-black/40">{m.depuisDetail}</p>
                      <p className="mt-0.5 text-[10px] text-black/40">Impact : {m.impact}</p>
                      <p className="mt-1 text-[11px] font-bold text-[#8a6d1b]">
                        Action proposée : {m.actionProposee}
                      </p>
                    </>
                  ) : null}
                </div>
              ))}
          </div>
        ) : null}

        {/* ── Point 90 ─────────────────────────────────────────────── */}
        {onglet === "regle" ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-xs font-bold text-[#111]">
                Une validation du PDG doit produire une action traçable. Une action doit produire un
                résultat. Un résultat doit être vérifié. Une erreur doit devenir une connaissance.
                Une connaissance utile doit rester disponible.
              </p>
              <p className="mt-1 text-[11px] text-black/50">
                {regle.data?.detail ?? "Chargement…"} Ces chiffres sont comptés en base, pas
                affirmés.
              </p>
            </div>
            {(regle.data?.chaine ?? []).map((c) => (
              <div key={c.etape} className="rounded-xl border border-black/5 bg-white p-3">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-sm font-bold text-[#111]">{c.etape}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.tenue ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {c.tenue ? "Tenu" : "Non tenu"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-black/50">{c.question}</p>
                <p className="mt-1 text-base font-black text-[#111]">{c.valeur}</p>
                <p className="mt-0.5 text-[11px] text-black/60">{c.detail}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
