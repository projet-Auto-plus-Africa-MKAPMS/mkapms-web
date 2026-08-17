/**
 * Points 71-72-75 — Centre de Commandes (écran PDG / Direction).
 *
 * Ce que l'écran refuse de faire, volontairement :
 *  - il n'invente pas une intention : une demande non comprise est affichée
 *    comme telle, avec les formulations que la plateforme sait recevoir ;
 *  - il n'exécute jamais une action critique sur une phrase : il renvoie à la
 *    confirmation renforcée du Centre de Résilience ;
 *  - il n'affiche pas un micro qui ne marche pas : si le navigateur ne sait pas
 *    dicter, c'est écrit ;
 *  - il ne prétend pas que l'agent développeur écrit du code : tant qu'aucun
 *    générateur n'est branché, le dossier s'arrête au plan et le dit ;
 *  - aucun dossier n'annonce une mise en production : il ouvre un passage dont
 *    les étapes restent à franchir.
 */
import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ChevronLeft,
  GitBranch,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  ShieldAlert,
  Terminal,
  Wrench,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { speechRecognitionConstructor, startDictation } from "../lib/speech";

type Onglet = "commande" | "voix" | "developpement" | "journal";

const ONGLETS: { key: Onglet; label: string }[] = [
  { key: "commande", label: "Commande écrite" },
  { key: "voix", label: "Commande vocale" },
  { key: "developpement", label: "Agent développeur" },
  { key: "journal", label: "Journal" },
];

const VERDICTS: Record<string, { label: string; ton: string }> = {
  comprise: { label: "Comprise", ton: "bg-emerald-50 text-emerald-700" },
  ambigue: { label: "Ambiguë — rien exécuté", ton: "bg-amber-50 text-amber-700" },
  hors_perimetre: { label: "Hors périmètre", ton: "bg-black/5 text-black/60" },
  refusee: { label: "Refusée", ton: "bg-red-50 text-red-700" },
};

const STATUTS_DEV: Record<string, { label: string; ton: string }> = {
  analyse: { label: "En analyse", ton: "bg-black/5 text-black/60" },
  plan_pret: { label: "Plan prêt", ton: "bg-blue-50 text-blue-700" },
  en_pipeline: { label: "Dans le pipeline", ton: "bg-emerald-50 text-emerald-700" },
  bloque: { label: "Bloqué", ton: "bg-red-50 text-red-700" },
  livre: { label: "Livré", ton: "bg-emerald-50 text-emerald-700" },
  abandonne: { label: "Abandonné", ton: "bg-black/5 text-black/50" },
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

interface Reponse {
  verdict: string;
  reason: string;
  intent: string | null;
  effect: string | null;
  actionTaskId: number | null;
  candidates: string[];
  entities: Record<string, string>;
}

export default function CentreCommandes() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";
  const [onglet, setOnglet] = useState<Onglet>("commande");
  const [message, setMessage] = useState<string | null>(null);

  const [texte, setTexte] = useState("");
  const [reponse, setReponse] = useState<Reponse | null>(null);

  const [motDePasse, setMotDePasse] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionFin, setSessionFin] = useState<string | null>(null);
  const [dictee, setDictee] = useState("");
  const [ecoute, setEcoute] = useState(false);
  const dicteeRef = useRef<{ stop: () => void } | null>(null);
  const dicteeDisponible = speechRecognitionConstructor() !== null;

  const [besoin, setBesoin] = useState("");
  const [retours, setRetours] = useState<Record<number, string>>({});

  useEffect(
    () => () => {
      dicteeRef.current?.stop();
    },
    [],
  );

  const capacites = trpc.commandCenter.capacites.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const stats = trpc.commandCenter.stats.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const journal = trpc.commandCenter.journal.useQuery(
    { limite: 120 },
    { enabled: !!isDirection && onglet === "journal", refetchOnWindowFocus: false },
  );
  const nonComprises = trpc.commandCenter.nonComprises.useQuery(undefined, {
    enabled: !!isDirection && onglet === "journal",
    refetchOnWindowFocus: false,
  });
  const dossiers = trpc.commandCenter.dossiers.useQuery(undefined, {
    enabled: !!isDirection && onglet === "developpement",
    refetchOnWindowFocus: false,
  });
  const sessions = trpc.commandCenter.sessionsVocales.useQuery(undefined, {
    enabled: !!isDirection && onglet === "voix",
    refetchOnWindowFocus: false,
  });

  const envoyer = trpc.commandCenter.envoyer.useMutation({
    onSuccess: (r) => {
      setReponse(r);
      setMessage(null);
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const envoyerVocal = trpc.commandCenter.envoyerVocal.useMutation({
    onSuccess: (r) => {
      setReponse(r);
      setMessage(null);
      stats.refetch();
      sessions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const ouvrirSession = trpc.commandCenter.ouvrirSessionVocale.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      setMotDePasse("");
      if (r.ok && r.sessionId) {
        setSessionId(r.sessionId);
        setSessionFin(r.expiresAt ? String(r.expiresAt) : null);
      }
      sessions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const fermerSession = trpc.commandCenter.fermerSessionVocale.useMutation({
    onSuccess: () => {
      setSessionId(null);
      setSessionFin(null);
      setMessage("Session vocale fermée.");
      sessions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const ouvrirDossier = trpc.commandCenter.ouvrirDossier.useMutation({
    onSuccess: () => {
      setBesoin("");
      setMessage("Dossier ouvert : analyse et plan établis, rien n'est écrit en production.");
      dossiers.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const envoyerPipeline = trpc.commandCenter.envoyerAuPipeline.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      dossiers.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const s = stats.data;

  const basculerDictee = () => {
    if (ecoute) {
      dicteeRef.current?.stop();
      dicteeRef.current = null;
      setEcoute(false);
      return;
    }
    const controle = startDictation("fr-FR", {
      onText: (t) => setDictee(t),
      onError: (m) => {
        setMessage(m);
        setEcoute(false);
      },
      onEnd: () => {
        dicteeRef.current = null;
        setEcoute(false);
      },
    });
    if (!controle) {
      setMessage(
        "Ce navigateur ne fournit pas de reconnaissance vocale : la commande peut être saisie au clavier, elle suivra exactement le même contrôle.",
      );
      return;
    }
    dicteeRef.current = controle;
    setEcoute(true);
  };

  const blocReponse = reponse ? (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            VERDICTS[reponse.verdict]?.ton ?? "bg-black/5 text-black/60"
          }`}
        >
          {VERDICTS[reponse.verdict]?.label ?? reponse.verdict}
        </span>
        {reponse.actionTaskId ? (
          <Link
            to="/admin/actions"
            className="text-[11px] font-bold text-[#D4AF37] underline underline-offset-2"
          >
            Voir l'action #{reponse.actionTaskId}
          </Link>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-black/70">{reponse.reason}</p>
      {reponse.candidates.length > 0 ? (
        <ul className="mt-2 list-disc pl-4 text-[11px] text-black/60">
          {reponse.candidates.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}
      {Object.keys(reponse.entities).length > 0 ? (
        <p className="mt-2 text-[11px] text-black/50">
          Précisions retenues :{" "}
          {Object.entries(reponse.entities)
            .map(([k, v]) => `${k} = ${v}`)
            .join(", ")}
        </p>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Terminal size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Centre de Commandes</h1>
            <p className="text-xs text-white/50">
              Une phrase devient une action tracée, vérifiée, et jamais critique sur un simple clic.
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
            titre="Commandes reçues"
            valeur={String(s?.commandes.total ?? 0)}
            detail={`${s?.commandes.comprises ?? 0} comprise(s), ${s?.commandes.vocales ?? 0} dictée(s)`}
          />
          <Carte
            titre="Actions créées"
            valeur={String(s?.commandes.actions ?? 0)}
            detail="chacune vérifiable dans le Centre d'Actions"
          />
          <Carte
            titre="Non comprises"
            valeur={String(s?.commandes.horsPerimetre ?? 0)}
            detail={`${s?.commandes.ambigues ?? 0} ambiguë(s), ${s?.commandes.refusees ?? 0} refusée(s)`}
          />
          <Carte
            titre="Dossiers développement"
            valeur={String(s?.dev.total ?? 0)}
            detail={`${s?.dev.enPipeline ?? 0} dans le pipeline, ${s?.dev.bloques ?? 0} bloqué(s)`}
          />
        </div>

        {/* ── Point 71 ─────────────────────────────────────────────── */}
        {onglet === "commande" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <ShieldAlert size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  Une demande comprise devient une action du Centre d'Actions, avec son résultat
                  vérifié. Une demande non comprise n'est jamais rapprochée de force d'une autre
                  intention : rien n'est exécuté au hasard.
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-black/5 bg-white p-3">
              <label className="text-[11px] font-bold uppercase tracking-wide text-black/40">
                Votre demande
              </label>
              <textarea
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                rows={3}
                placeholder="Exemple : Analyse tous les paiements échoués aujourd'hui."
                className="mt-1 w-full rounded-lg border border-black/10 p-2 text-sm"
              />
              <button
                type="button"
                disabled={texte.trim().length < 3 || envoyer.isPending}
                onClick={() => envoyer.mutate({ texte: texte.trim() })}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                <Send size={14} /> Envoyer la commande
              </button>
            </div>

            {blocReponse}

            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-xs font-bold text-[#111]">
                Ce que la plateforme sait recevoir aujourd'hui
              </p>
              <p className="mt-0.5 text-[11px] text-black/50">
                Cette liste est la vérité du moteur : rien d'autre ne sera exécuté.
              </p>
              <div className="mt-2 space-y-2">
                {(capacites.data?.intentions ?? []).map((i) => (
                  <div key={i.code} className="rounded-lg bg-black/[0.02] p-2">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-xs font-bold text-[#111]">{i.label}</p>
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-black/60">
                        {i.execution === "action" ? "exécute" : "consulte"}
                      </span>
                      {i.riskLevel >= 3 ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          critique
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-black/60">{i.effect}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Point 72 ─────────────────────────────────────────────── */}
        {onglet === "voix" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <ShieldAlert size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  Voix → authentification forte → compréhension → niveau de risque →
                  exécution ou confirmation → journal. Une voix seule n'autorise rien, et une
                  commande critique dictée n'est jamais exécutée : elle demande la confirmation
                  renforcée du Centre de Résilience.
                </span>
              </p>
            </div>

            {!isPdg ? (
              <p className="text-sm text-black/50">
                La commande vocale est réservée au PDG. Les commandes écrites restent disponibles.
              </p>
            ) : sessionId === null ? (
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-xs font-bold text-[#111]">Authentification forte</p>
                <p className="mt-0.5 text-[11px] text-black/50">
                  Ressaisissez votre mot de passe : c'est le second facteur réellement vérifié
                  avant d'ouvrir la voix. La session dure 15 minutes.
                </p>
                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Mot de passe"
                  className="mt-2 w-full rounded-lg border border-black/10 p-2 text-sm"
                />
                <button
                  type="button"
                  disabled={motDePasse.length < 1 || ouvrirSession.isPending}
                  onClick={() =>
                    ouvrirSession.mutate({
                      motDePasse,
                      appareil:
                        typeof navigator === "undefined" ? undefined : navigator.userAgent.slice(0, 120),
                    })
                  }
                  className="mt-2 w-full rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  Ouvrir la session vocale
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-xs font-bold text-[#111]">
                    Session vocale #{sessionId} ouverte
                  </p>
                  <button
                    type="button"
                    onClick={() => fermerSession.mutate({ id: sessionId })}
                    className="rounded-lg bg-black/5 px-2 py-1 text-[11px] font-bold text-black/60"
                  >
                    Fermer
                  </button>
                </div>
                <p className="mt-0.5 text-[11px] text-black/50">
                  Valable jusqu'au {dateCourte(sessionFin)}.
                </p>

                {!dicteeDisponible ? (
                  <p className="mt-2 flex items-start gap-1 text-[11px] text-black/60">
                    <MicOff size={12} className="mt-0.5 shrink-0 text-black/40" />
                    <span>
                      Ce navigateur ne fournit pas de reconnaissance vocale. La commande peut être
                      saisie ci-dessous : elle suivra exactement le même contrôle.
                    </span>
                  </p>
                ) : null}

                <textarea
                  value={dictee}
                  onChange={(e) => setDictee(e.target.value)}
                  rows={3}
                  placeholder="Dictez ou saisissez la commande…"
                  className="mt-2 w-full rounded-lg border border-black/10 p-2 text-sm"
                />
                <div className="mt-2 flex gap-2">
                  {dicteeDisponible ? (
                    <button
                      type="button"
                      onClick={basculerDictee}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold ${
                        ecoute ? "bg-red-600 text-white" : "bg-black/5 text-black/70"
                      }`}
                    >
                      {ecoute ? <MicOff size={14} /> : <Mic size={14} />}
                      {ecoute ? "Arrêter" : "Dicter"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={dictee.trim().length < 3 || envoyerVocal.isPending}
                    onClick={() =>
                      envoyerVocal.mutate({ texte: dictee.trim(), sessionId })
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
                  >
                    <Send size={14} /> Envoyer
                  </button>
                </div>
              </div>
            )}

            {blocReponse}

            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-xs font-bold text-[#111]">Sessions vocales</p>
              {(sessions.data ?? []).length === 0 ? (
                <p className="mt-1 text-[11px] text-black/50">Aucune session ouverte à ce jour.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {(sessions.data ?? []).map((v) => (
                    <div key={v.id} className="rounded-lg bg-black/[0.02] p-2">
                      <p className="text-[11px] font-bold text-[#111]">
                        #{v.id} — {v.status} · {v.commandsCount} commande(s)
                      </p>
                      <p className="text-[10px] text-black/50">
                        {v.strongAuthMethod
                          ? `Second facteur : ${v.strongAuthMethod.replace(/_/g, " ")} le ${dateCourte(v.strongAuthAt)}`
                          : "Aucun second facteur constaté"}{" "}
                        · expire le {dateCourte(v.expiresAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Point 75 ─────────────────────────────────────────────── */}
        {onglet === "developpement" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <GitBranch size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  Besoin → analyse d'architecture → plan → environnement isolé → tests →
                  comparaison → validation → déploiement → surveillance → retour arrière.{" "}
                  {capacites.data?.generationCode
                    ? "La génération de code est branchée."
                    : "Aucune génération de code n'est branchée aujourd'hui : le dossier s'arrête au plan, et c'est écrit plutôt que promis."}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-black/5 bg-white p-3">
              <label className="text-[11px] font-bold uppercase tracking-wide text-black/40">
                Besoin à développer
              </label>
              <textarea
                value={besoin}
                onChange={(e) => setBesoin(e.target.value)}
                rows={3}
                placeholder="Décrivez le besoin : module concerné, comportement attendu, pays si la règle en dépend."
                className="mt-1 w-full rounded-lg border border-black/10 p-2 text-sm"
              />
              <button
                type="button"
                disabled={besoin.trim().length < 10 || ouvrirDossier.isPending}
                onClick={() => ouvrirDossier.mutate({ besoin: besoin.trim() })}
                className="mt-2 w-full rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Ouvrir un dossier
              </button>
            </div>

            {(dossiers.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">Aucun dossier de développement ouvert.</p>
            ) : (
              <div className="space-y-2">
                {(dossiers.data ?? []).map((d) => (
                  <div key={d.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <Wrench size={14} className="mt-0.5 shrink-0 text-black/30" />
                      <p className="flex-1 text-sm font-bold text-[#111]">#{d.id} — {d.need}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          STATUTS_DEV[d.status]?.ton ?? "bg-black/5 text-black/60"
                        }`}
                      >
                        {STATUTS_DEV[d.status]?.label ?? d.status}
                      </span>
                    </div>
                    {d.analysis ? (
                      <p className="mt-1 text-[11px] text-black/60">{d.analysis}</p>
                    ) : null}
                    {d.scope.length > 0 ? (
                      <p className="mt-1 text-[10px] text-black/40">
                        Périmètre : {d.scope.join(", ")}
                      </p>
                    ) : null}
                    {d.blockedReason ? (
                      <p className="mt-1 text-[11px] font-bold text-red-700">{d.blockedReason}</p>
                    ) : null}
                    {d.plan.length > 0 ? (
                      <ol className="mt-2 space-y-1">
                        {d.plan.map((p) => (
                          <li key={p.step} className="text-[11px] text-black/60">
                            <span className="font-bold text-[#111]">
                              {p.step.replace(/_/g, " ")}
                            </span>{" "}
                            — {p.detail}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    <p className="mt-1 text-[10px] text-black/40">
                      Ouvert le {dateCourte(d.createdAt)}
                      {d.pipelineRunId ? ` · passage pipeline #${d.pipelineRunId}` : ""}
                    </p>

                    {isPdg && !d.pipelineRunId && d.status !== "bloque" ? (
                      <div className="mt-2 rounded-lg bg-black/[0.02] p-2">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-black/40">
                          Retour arrière prévu (obligatoire)
                        </label>
                        <input
                          value={retours[d.id] ?? ""}
                          onChange={(e) => setRetours((v) => ({ ...v, [d.id]: e.target.value }))}
                          placeholder="Comment revenir en arrière si le changement casse quelque chose ?"
                          className="mt-1 w-full rounded-lg border border-black/10 p-2 text-xs"
                        />
                        <button
                          type="button"
                          disabled={(retours[d.id] ?? "").trim().length < 10 || envoyerPipeline.isPending}
                          onClick={() =>
                            envoyerPipeline.mutate({
                              id: d.id,
                              retourArriere: (retours[d.id] ?? "").trim(),
                            })
                          }
                          className="mt-2 w-full rounded-lg bg-[#111] py-1.5 text-xs font-bold text-white disabled:opacity-40"
                        >
                          Envoyer au pipeline obligatoire
                        </button>
                      </div>
                    ) : null}
                    {d.pipelineRunId ? (
                      <Link
                        to="/admin/resilience"
                        className="mt-2 inline-block text-[11px] font-bold text-[#D4AF37] underline underline-offset-2"
                      >
                        Suivre les étapes dans le Centre de Résilience
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* ── Journal ──────────────────────────────────────────────── */}
        {onglet === "journal" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-xs font-bold text-[#111]">
                Demandes que la plateforme ne sait pas encore traiter
              </p>
              <p className="mt-0.5 text-[11px] text-black/50">
                Elles sont conservées telles quelles : c'est la liste de ce qu'il reste à
                construire, pas un échec à masquer.
              </p>
              {(nonComprises.data ?? []).length === 0 ? (
                <p className="mt-1 text-[11px] text-black/50">
                  Aucune : toutes les demandes reçues ont été comprises.
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {(nonComprises.data ?? []).map((c) => (
                    <li key={c.id} className="rounded-lg bg-black/[0.02] p-2 text-[11px] text-black/70">
                      « {c.rawText} » — {dateCourte(c.createdAt)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(journal.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">Aucune commande enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {(journal.data ?? []).map((c) => (
                  <div key={c.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/60">
                        {c.channel === "vocal" ? "vocal" : "écrit"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          VERDICTS[c.verdict]?.ton ?? "bg-black/5 text-black/60"
                        }`}
                      >
                        {VERDICTS[c.verdict]?.label ?? c.verdict}
                      </span>
                      {c.riskLevel >= 3 ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          niveau 3
                        </span>
                      ) : null}
                      <span className="ml-auto text-[10px] text-black/40">
                        {dateCourte(c.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#111]">« {c.rawText} »</p>
                    <p className="mt-1 text-[11px] text-black/60">{c.reason}</p>
                    {c.actionTaskId ? (
                      <Link
                        to="/admin/actions"
                        className="mt-1 inline-block text-[11px] font-bold text-[#D4AF37] underline underline-offset-2"
                      >
                        Action #{c.actionTaskId}
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
