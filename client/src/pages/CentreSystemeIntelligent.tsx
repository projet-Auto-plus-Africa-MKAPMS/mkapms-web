/**
 * Points 102-103 — audit et activation réelle du Système Intelligent (PDG).
 *
 * L'écran répond à une seule question : que sait *réellement* faire le système
 * aujourd'hui ? Une capacité n'est verte que si son usage est prouvé par des
 * enregistrements réels. Ce qui manque est nommé, jamais arrondi.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  CircleDashed,
  Play,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const ETAT_STYLE: Record<string, { pastille: string; texte: string }> = {
  active: { pastille: "bg-emerald-500", texte: "text-emerald-700" },
  partielle: { pastille: "bg-amber-500", texte: "text-amber-700" },
  inactive: { pastille: "bg-orange-500", texte: "text-orange-700" },
  non_disponible: { pastille: "bg-black/30", texte: "text-black/50" },
};

const AUTONOMIE_LABEL: Record<string, string> = {
  observation: "Observation",
  proposition: "Observation + proposition",
  execution_validee: "Exécution après validation",
  autonome_encadre: "Autonome encadré",
  partiel: "Socle incomplet",
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

export default function CentreSystemeIntelligent() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const [message, setMessage] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);

  const audit = trpc.smartAudit.latest.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const cycles = trpc.smartAudit.cycles.useQuery(
    { limit: 5 },
    { enabled: !!isDirection, refetchOnWindowFocus: false },
  );

  const auditer = trpc.smartAudit.auditer.useMutation({
    onSuccess: (r) => {
      setMessage(
        `Audit terminé : ${r.parEtat.active ?? 0} capacité(s) attestée(s) sur ${r.total}. Niveau réel : ${AUTONOMIE_LABEL[r.autonomie] ?? r.autonomie}.`,
      );
      audit.refetch();
    },
    onError: (e) => setMessage(`Échec de l'audit : ${e.message}`),
  });

  const executer = trpc.smartAudit.executerCycle.useMutation({
    onSuccess: (r) => {
      setMessage(
        `Cycle exécuté : ${r.alertesCreees} alerte(s), ${r.propositionsCreees} proposition(s), ${r.correctionsAppliquees} correction(s)${r.echecs > 0 ? `, ${r.echecs} étape(s) en échec` : ""}.`,
      );
      cycles.refetch();
      audit.refetch();
    },
    onError: (e) => setMessage(`Échec du cycle : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const rapport = audit.data ?? null;
  const enCours = auditer.isPending || executer.isPending;

  return (
    <div className="min-h-screen bg-[#f6f6f7] pb-20">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-black/60">
          <ChevronLeft size={16} /> Retour
        </Link>

        <header className="rounded-2xl bg-[#111] p-5 text-white">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <Activity size={20} className="text-[#d4af37]" />
            Système Intelligent — ce qu'il sait réellement faire
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Une capacité n'est pas active parce que son code existe. Elle l'est quand son usage est
            prouvé par des enregistrements réels. Ce qui manque est écrit ci-dessous, capacité par
            capacité.
          </p>
        </header>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => auditer.mutate()}
            disabled={enCours}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <RefreshCw size={15} className={auditer.isPending ? "animate-spin" : ""} />
            Auditer les 16 capacités
          </button>
          <button
            type="button"
            onClick={() => executer.mutate()}
            disabled={enCours}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#111] disabled:opacity-50"
          >
            <Play size={15} className={executer.isPending ? "animate-pulse" : ""} />
            Exécuter le cycle complet
          </button>
        </div>

        {message ? (
          <p className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-sm text-black/70">
            {message}
          </p>
        ) : null}

        {!rapport ? (
          <p className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm text-black/60">
            Aucun audit n'a encore été effectué. Tant qu'il n'a pas tourné, aucun état n'est affiché
            — un écran vide vaut mieux qu'un état inventé.
          </p>
        ) : (
          <>
            <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-black text-[#111]">
                <ShieldCheck size={16} className="text-[#d4af37]" />
                Niveau d'autonomie réellement atteint
              </h2>
              <p className="mt-1 text-lg font-black text-[#111]">
                {AUTONOMIE_LABEL[rapport.autonomie] ?? rapport.autonomie}
              </p>
              <p className="mt-1 text-sm text-black/60">{rapport.autonomieMotif}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Carte titre="Attestées" valeur={String(rapport.parEtat.active ?? 0)} />
                <Carte titre="Partielles" valeur={String(rapport.parEtat.partielle ?? 0)} />
                <Carte titre="Inactives" valeur={String(rapport.parEtat.inactive ?? 0)} />
                <Carte
                  titre="Non disponibles"
                  valeur={String(rapport.parEtat.non_disponible ?? 0)}
                />
              </div>
              <p className="mt-3 rounded-xl bg-[#f6f6f7] p-3 text-[12px] text-black/60">
                <strong>Agent développeur :</strong> {rapport.generationCode.detail}
              </p>
            </section>

            <section className="mt-4 space-y-2">
              {rapport.capacites.map((c) => {
                const style = ETAT_STYLE[c.etat] ?? ETAT_STYLE.non_disponible;
                const estOuvert = ouvert === c.code;
                return (
                  <div key={c.code} className="rounded-2xl border border-black/5 bg-white">
                    <button
                      type="button"
                      onClick={() => setOuvert(estOuvert ? null : c.code)}
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.pastille}`} />
                      <span className="text-[11px] font-bold text-black/30">{c.ordre}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-[#111]">{c.label}</span>
                        <span className={`block text-[11px] ${style.texte}`}>{c.etatLabel}</span>
                      </span>
                      <span className="text-[11px] text-black/40">
                        {c.lignes > 0 ? `${c.lignes} trace(s)` : "aucune trace"}
                      </span>
                    </button>
                    {estOuvert ? (
                      <div className="border-t border-black/5 px-3 py-3 text-[12px] text-black/70">
                        <p className="text-black/60">{c.attendu}</p>
                        <p className="mt-2 font-medium text-[#111]">{c.motif}</p>
                        {c.manquant.length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {c.manquant.map((m) => (
                              <li key={m} className="flex items-center gap-1 text-orange-700">
                                <AlertTriangle size={12} /> {m}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <p className="mt-2 text-black/40">
                          Autonomie prévue : {c.autonomie.replace(/_/g, " ")}
                          {c.dernierUsage
                            ? ` — dernier usage le ${new Date(c.dernierUsage).toLocaleDateString("fr-FR")}`
                            : ""}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </section>
          </>
        )}

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-black text-[#111]">Derniers cycles exécutés</h2>
          {(cycles.data ?? []).length === 0 ? (
            <p className="rounded-xl border border-black/10 bg-white p-3 text-sm text-black/60">
              Aucun cycle n'a encore été exécuté.
            </p>
          ) : (
            <div className="space-y-2">
              {(cycles.data ?? []).map((c) => (
                <div key={c.id} className="rounded-2xl border border-black/5 bg-white p-3">
                  <p className="text-[12px] font-bold text-[#111]">
                    Cycle #{c.id} — {new Date(c.startedAt).toLocaleString("fr-FR")}
                  </p>
                  <p className="text-[11px] text-black/50">
                    {c.alertesCreees} alerte(s) · {c.propositionsCreees} proposition(s) ·{" "}
                    {c.correctionsAppliquees} correction(s) · {c.echecs} échec(s)
                  </p>
                  <ul className="mt-2 space-y-1">
                    {c.etapes.map((e, i) => (
                      <li key={`${c.id}-${i}`} className="flex items-start gap-2 text-[12px]">
                        <CircleDashed
                          size={12}
                          className={`mt-0.5 ${e.resultat === "ok" ? "text-emerald-600" : "text-red-600"}`}
                        />
                        <span className="text-black/70">
                          <strong className="text-[#111]">{e.etape.replace(/_/g, " ")}</strong> —{" "}
                          {e.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
