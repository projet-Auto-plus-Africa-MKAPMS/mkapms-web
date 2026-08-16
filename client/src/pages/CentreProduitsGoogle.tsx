/**
 * Points 94-95-96-97 — Google Product Engine (PDG / Direction).
 *
 * L'écran montre d'abord ce que presque personne ne distingue : les pièces se
 * vendent comme des produits, les véhicules s'annoncent. Les véhicules
 * motorisés sont exclus des fiches gratuites Merchant Center — les y pousser
 * ne produirait que des refus, donc la plateforme ne le fait pas et l'écrit.
 *
 * Ensuite, pour chaque fiche produit, les trois états du point 96 restent
 * séparés : envoyé ≠ approuvé ≠ visible.
 */
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AlertTriangle, Boxes, Car, CheckCircle2, ChevronLeft, RefreshCw, XCircle } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{titre}</p>
      <p className="mt-1 text-lg font-black text-[#111]">{valeur}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-black/50">{detail}</p> : null}
    </div>
  );
}

function Etat({ vrai, label }: { vrai: boolean; label: string }) {
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

export default function CentreProduitsGoogle() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const [filtre, setFiltre] = useState<"tous" | "eligibles" | "bloquees">("tous");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pipelines = trpc.productEngine.pipelines.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const dernier = trpc.productEngine.latest.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });

  const rafraichir = trpc.productEngine.refresh.useMutation({
    onSuccess: (r) => {
      setMessage(
        `Catalogue relu : ${r.examines} fiche(s) examinée(s), ${r.eligibles} exploitable(s) par Google.`,
      );
      dernier.refetch();
      pipelines.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  const rapport = dernier.data ?? null;

  const items = useMemo(() => {
    if (!rapport) return [];
    if (filtre === "eligibles") return rapport.items.filter((i) => i.eligible);
    if (filtre === "bloquees") return rapport.items.filter((i) => !i.eligible);
    return rapport.items;
  }, [rapport, filtre]);

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const merchant = rapport?.merchant ?? pipelines.data?.produit.merchant ?? null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Boxes size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Produits Google &amp; Merchant</h1>
            <p className="text-xs text-white/60">
              Points 94 à 97 — un véhicule n&apos;est pas un produit de catalogue
            </p>
          </div>
          <button
            onClick={() => rafraichir.mutate({ limit: 200 })}
            disabled={rafraichir.isPending}
            className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#111] disabled:opacity-50"
          >
            <RefreshCw size={13} className={rafraichir.isPending ? "animate-spin" : ""} />
            {rafraichir.isPending ? "Lecture…" : "Relire"}
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {message ? (
          <p className="mb-3 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-xs text-[#111]">
            {message}
          </p>
        ) : null}

        {merchant && !merchant.configure ? (
          <div className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-900">Merchant Center non connecté</p>
              <p className="mt-0.5 text-[11px] text-amber-800">{merchant.detail}</p>
            </div>
          </div>
        ) : null}

        {/* ─── Les deux tuyaux (point 94) ──────────────────────────────────── */}
        <h2 className="mb-2 text-sm font-black text-[#111]">Deux tuyaux séparés</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <div className="flex items-center gap-2">
              <Boxes size={16} className="text-[#D4AF37]" />
              <p className="text-sm font-bold text-[#111]">
                {pipelines.data?.produit.libelle ?? "Produits / pièces"}
              </p>
            </div>
            <p className="mt-1 text-2xl font-black text-[#111]">
              {pipelines.data?.produit.fiches ?? 0}
              <span className="ml-1 text-[11px] font-normal text-black/50">fiche(s)</span>
            </p>
            <p className="text-[11px] text-black/50">
              dont <b className="text-[#111]">{pipelines.data?.produit.exploitables ?? 0}</b> exploitable(s) par Google
            </p>
            <ul className="mt-2 space-y-0.5">
              {(pipelines.data?.produit.canaux ?? []).map((c) => (
                <li key={c} className="text-[11px] text-black/60">• {c}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-black/5 bg-white p-4">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-[#D4AF37]" />
              <p className="text-sm font-bold text-[#111]">
                {pipelines.data?.vehicule.libelle ?? "Véhicules"}
              </p>
            </div>
            <p className="mt-1 text-2xl font-black text-[#111]">
              {pipelines.data?.vehicule.fiches ?? 0}
              <span className="ml-1 text-[11px] font-normal text-black/50">annonce(s) publiée(s)</span>
            </p>
            <ul className="mt-2 space-y-0.5">
              {(pipelines.data?.vehicule.canaux ?? []).map((c) => (
                <li key={c} className="text-[11px] text-black/60">• {c}</li>
              ))}
            </ul>
            {pipelines.data?.vehicule.exclusion ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
                {pipelines.data.vehicule.exclusion}
              </p>
            ) : null}
          </div>
        </div>

        {/* ─── Flux produit (points 95-96) ─────────────────────────────────── */}
        <h2 className="mt-6 mb-2 text-sm font-black text-[#111]">Flux produit</h2>

        {!rapport ? (
          <div className="rounded-xl border border-black/5 bg-white p-5 text-sm text-black/60">
            {dernier.isLoading
              ? "Lecture du dernier état…"
              : "Aucun flux produit encore construit. « Relire » parcourt le catalogue réel et projette chaque fiche vers les canaux Google."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Carte titre="Fiches examinées" valeur={String(rapport.examines)} />
              <Carte
                titre="Exploitables"
                valeur={String(rapport.eligibles)}
                detail="attributs obligatoires complets"
              />
              <Carte
                titre="Bloquées"
                valeur={String(rapport.inelligibles)}
                detail="motif écrit fiche par fiche"
              />
              <Carte
                titre="Dernière lecture"
                valeur={new Date(rapport.checkedAt).toLocaleString("fr-FR")}
              />
            </div>

            {Object.keys(rapport.parMotif).length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(rapport.parMotif)
                  .sort((a, b) => b[1] - a[1])
                  .map(([motif, n]) => (
                    <span
                      key={motif}
                      className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-black/60"
                    >
                      {motif.replace(/_/g, " ")} : <b className="text-[#111]">{n}</b>
                    </span>
                  ))}
              </div>
            ) : null}

            <p className="mt-2 text-[11px] text-black/50">
              Flux public lu par Google :{" "}
              <a href={rapport.feedUrl} target="_blank" rel="noreferrer" className="underline">
                {rapport.feedUrl}
              </a>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  ["tous", `Toutes (${rapport.items.length})`],
                  ["eligibles", `Exploitables (${rapport.items.filter((i) => i.eligible).length})`],
                  ["bloquees", `Bloquées (${rapport.items.filter((i) => !i.eligible).length})`],
                ] as const
              ).map(([cle, label]) => (
                <button
                  key={cle}
                  onClick={() => setFiltre(cle)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                    filtre === cle
                      ? "border-[#111] bg-[#111] text-white"
                      : "border-black/10 bg-white text-black/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {items.map((item) => {
                const cle = `${item.source}-${item.sourceId}`;
                return (
                  <div key={cle} className="rounded-xl border border-black/5 bg-white">
                    <button
                      onClick={() => setOuvert(ouvert === cle ? null : cle)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#111]">
                          {item.titre || `Fiche ${item.offerId}`}
                        </p>
                        <p className="text-[11px] text-black/50">
                          {item.offerId} ·{" "}
                          {item.prix ? `${item.prix} ${item.devise}` : "prix absent"} ·{" "}
                          {item.disponibilite.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          item.eligible
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-orange-200 bg-orange-50 text-orange-700"
                        }`}
                      >
                        {item.eligible ? "Exploitable" : "Bloquée"}
                      </span>
                    </button>

                    {ouvert === cle ? (
                      <div className="border-t border-black/5 px-3 py-3">
                        {item.motif ? <p className="text-xs text-black/70">{item.motif}</p> : null}

                        <div className="mt-3 grid grid-cols-3 gap-1.5">
                          <Etat vrai={item.envoye} label="Envoyé" />
                          <Etat vrai={item.approuve} label="Approuvé" />
                          <Etat vrai={item.visible} label="Visible" />
                        </div>
                        <p className="mt-1 text-[10px] text-black/40">
                          Trois états distincts : une fiche envoyée n&apos;est ni approuvée ni visible tant
                          que Google ne l&apos;a pas confirmé.
                        </p>

                        {item.manquants.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-[11px] font-bold text-black/60">Attributs à compléter</p>
                            <ul className="mt-1 space-y-0.5">
                              {item.manquants.map((m) => (
                                <li key={m} className="flex items-start gap-1.5 text-[11px] text-black/60">
                                  <XCircle size={12} className="mt-0.5 shrink-0 text-orange-500" />
                                  {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-block text-[11px] font-semibold text-[#111] underline"
                          >
                            Ouvrir la page produit
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
