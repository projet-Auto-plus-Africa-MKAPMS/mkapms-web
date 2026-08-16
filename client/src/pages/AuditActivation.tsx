/**
 * Point 91 — Audit d'activation général (PDG / Direction).
 *
 * L'écran répond à une seule question, domaine par domaine : la fonction
 * existe-t-elle, est-elle connectée, activée, accessible, testée, réellement
 * utilisée, son moteur est-il branché, le Système Intelligent la voit-il ?
 *
 * Rien n'est déclaré terminé parce que le code existe : chaque case cochée
 * s'appuie sur une observation (procédure montée, battement de cœur reçu,
 * lignes en base, preuve de test enregistrée), et chaque case vide affiche le
 * motif exact du manque.
 */
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ClipboardList, RefreshCw, XCircle } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Etat = "operationnelle" | "partielle" | "non_connectee" | "hors_service" | "non_configuree";

const ETAT_TON: Record<Etat, string> = {
  operationnelle: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partielle: "bg-amber-50 text-amber-700 border-amber-200",
  non_connectee: "bg-orange-50 text-orange-700 border-orange-200",
  hors_service: "bg-red-50 text-red-700 border-red-200",
  non_configuree: "bg-black/5 text-black/50 border-black/10",
};

const ETAT_LABEL: Record<Etat, string> = {
  operationnelle: "🟢 Opérationnelle et testée",
  partielle: "🟡 Existe mais partielle",
  non_connectee: "🟠 Existe mais non connectée",
  hors_service: "🔴 Ne fonctionne pas",
  non_configuree: "⚪ Non configurée",
};

const ETATS: Etat[] = [
  "operationnelle",
  "partielle",
  "non_connectee",
  "hors_service",
  "non_configuree",
];

const MAILLONS: { key: string; label: string }[] = [
  { key: "existe", label: "Existe" },
  { key: "connecte", label: "Connectée" },
  { key: "active", label: "Activée" },
  { key: "accessible", label: "Accessible" },
  { key: "teste", label: "Testée" },
  { key: "utilise", label: "Utilisée réellement" },
  { key: "moteurConnecte", label: "Moteur connecté" },
  { key: "systemeIntelligentConnecte", label: "Système Intelligent" },
];

function Pastille({ vrai }: { vrai: boolean }) {
  return vrai ? (
    <CheckCircle2 size={14} className="text-emerald-600" />
  ) : (
    <XCircle size={14} className="text-black/25" />
  );
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

export default function AuditActivation() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const [filtre, setFiltre] = useState<Etat | "tous">("tous");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const dernier = trpc.activationAudit.latest.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const historique = trpc.activationAudit.history.useQuery(
    { limit: 10 },
    { enabled: !!isDirection, refetchOnWindowFocus: false },
  );

  const lancer = trpc.activationAudit.run.useMutation({
    onSuccess: (r) => {
      setMessage(`Audit n°${r.runId} terminé — ${r.total} domaine(s) examiné(s).`);
      dernier.refetch();
      historique.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const rapport = dernier.data ?? null;

  const items = useMemo(() => {
    if (!rapport) return [];
    const liste = filtre === "tous" ? rapport.items : rapport.items.filter((i) => i.etat === filtre);
    const rang = (e: string) => ETATS.indexOf(e as Etat);
    return [...liste].sort((a, b) => rang(b.etat) - rang(a.etat) || a.label.localeCompare(b.label));
  }, [rapport, filtre]);

  if (!user || !isDirection) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <ClipboardList size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Audit d&apos;activation général</h1>
            <p className="text-xs text-white/60">
              Point 91 — une fonction n&apos;est jamais terminée parce que son code existe
            </p>
          </div>
          <button
            onClick={() => lancer.mutate()}
            disabled={lancer.isPending}
            className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#111] disabled:opacity-50"
          >
            <RefreshCw size={13} className={lancer.isPending ? "animate-spin" : ""} />
            {lancer.isPending ? "Audit…" : "Relancer"}
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {message ? (
          <p className="mb-3 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-xs text-[#111]">
            {message}
          </p>
        ) : null}

        {!rapport ? (
          <div className="rounded-xl border border-black/5 bg-white p-5 text-sm text-black/60">
            {dernier.isLoading
              ? "Lecture de la dernière photographie…"
              : "Aucun audit enregistré pour l'instant. « Relancer » examine chaque moteur du registre et enregistre le résultat."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Carte titre="Domaines examinés" valeur={String(rapport.total)} />
              <Carte
                titre="Opérationnelles et testées"
                valeur={String(rapport.parEtat.operationnelle ?? 0)}
                detail="preuve de test + usage réel"
              />
              <Carte
                titre="Avec preuve de test"
                valeur={String(rapport.couverture?.domainesAvecPreuveDeTest ?? 0)}
                detail="les autres restent non testées"
              />
              <Carte titre="Espaces d'API montés" valeur={String(rapport.couverture?.espacesTrpc ?? 0)} />
              <Carte
                titre="API sans moteur déclaré"
                valeur={String(rapport.couverture?.espacesTrpcSansMoteur ?? 0)}
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
                  filtre === "tous" ? "border-[#111] bg-[#111] text-white" : "border-black/10 bg-white text-black/60"
                }`}
              >
                Tous ({rapport.total})
              </button>
              {ETATS.map((e) => (
                <button
                  key={e}
                  onClick={() => setFiltre(e)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                    filtre === e ? "border-[#111] bg-[#111] text-white" : ETAT_TON[e]
                  }`}
                >
                  {ETAT_LABEL[e]} ({rapport.parEtat[e] ?? 0})
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {items.map((item) => (
                <div key={item.domain} className="rounded-xl border border-black/5 bg-white">
                  <button
                    onClick={() => setOuvert(ouvert === item.domain ? null : item.domain)}
                    className="flex w-full items-start gap-3 p-3 text-left"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-[#111]">{item.label}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ETAT_TON[item.etat as Etat]}`}
                        >
                          {ETAT_LABEL[item.etat as Etat]}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-black/35">
                          {item.category}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-black/55">{item.motif}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {MAILLONS.map((m) => (
                          <span key={m.key} className="flex items-center gap-1 text-[10px] text-black/50">
                            <Pastille vrai={Boolean((item as unknown as Record<string, boolean>)[m.key])} />
                            {m.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>

                  {ouvert === item.domain ? (
                    <div className="border-t border-black/5 px-3 py-3">
                      {item.manquant.length > 0 ? (
                        <>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-black/40">
                            Ce qui manque exactement
                          </p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-black/65">
                            {item.manquant.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="text-[11px] text-emerald-700">
                          Aucun maillon manquant : chaque étape est prouvée par une observation.
                        </p>
                      )}
                      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-black/40">
                        Preuves relevées
                      </p>
                      <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-black/[0.03] p-2 text-[10px] leading-relaxed text-black/70">
                        {JSON.stringify(item.preuves, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ))}
              {items.length === 0 ? (
                <p className="rounded-xl border border-black/5 bg-white p-4 text-sm text-black/50">
                  Aucun domaine dans cet état.
                </p>
              ) : null}
            </div>

            {historique.data && historique.data.length > 1 ? (
              <div className="mt-6 rounded-xl border border-black/5 bg-white p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-black/40">
                  Audits précédents — ce qui a réellement progressé
                </p>
                <div className="mt-2 space-y-1">
                  {historique.data.map((h) => (
                    <p key={h.id} className="text-[11px] text-black/60">
                      {new Date(h.date).toLocaleString("fr-FR")} — {h.total} domaine(s), 🟢{" "}
                      {h.parEtat.operationnelle ?? 0} · 🟡 {h.parEtat.partielle ?? 0} · 🟠{" "}
                      {h.parEtat.non_connectee ?? 0} · 🔴 {h.parEtat.hors_service ?? 0} · ⚪{" "}
                      {h.parEtat.non_configuree ?? 0}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
