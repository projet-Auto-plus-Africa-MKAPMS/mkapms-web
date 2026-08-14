import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, CreditCard, ShieldCheck, Wallet } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { ACOMPTE_PALIERS } from "@shared/plans";
import MoyensPaiement from "../components/MoyensPaiement";

/**
 * Page de paiement d'un véhicule.
 * - Bouton « Acheter » → mode "comptant" (prix total).
 * - Bouton « Réserver » → mode "acompte" (blocage 24h, choix du palier).
 * L'utilisateur peut basculer entre les deux modes.
 */
export default function PaiementVehicule() {
  const { id } = useParams();
  const annonceId = Number(id);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<"comptant" | "acompte">(
    params.get("mode") === "acompte" ? "acompte" : "comptant",
  );
  const [acompte, setAcompte] = useState<number>(ACOMPTE_PALIERS[1] ?? ACOMPTE_PALIERS[0]);
  const [erreur, setErreur] = useState<string | null>(null);

  const q = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: Number.isFinite(annonceId) });

  useEffect(() => {
    if (!user) navigate(`/connexion?next=/paiement-vehicule/${annonceId}`);
  }, [user, annonceId, navigate]);

  const onPaid = (r: { url?: string | null }) => {
    if (r.url) {
      if (r.url.startsWith("http")) window.location.href = r.url;
      else navigate(r.url);
    }
  };
  const buyNow = trpc.reservations.buyNow.useMutation({ onSuccess: onPaid, onError: (e) => setErreur(e.message) });
  const reserve = trpc.reservations.create.useMutation({ onSuccess: onPaid, onError: (e) => setErreur(e.message) });

  const pending = buyNow.isPending || reserve.isPending;
  const v = q.data;
  const prix = v ? Number(v.prix) : 0;
  const fmt = (n: number) => n.toLocaleString("fr-FR") + " " + (v?.devise || "EUR");

  const pay = () => {
    setErreur(null);
    if (mode === "comptant") buyNow.mutate({ annonceId });
    else reserve.mutate({ annonceId, acompte });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-white/60 mb-3">
          <ChevronLeft size={14} /> Retour
        </button>
        <h1 className="text-xl font-black text-white">Paiement</h1>
        <p className="mt-0.5 text-sm text-white/60">Transaction sécurisée MKA.P-MS</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {q.isLoading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : !v ? (
          <p className="text-sm text-slate-500">Véhicule introuvable.</p>
        ) : (
          <>
            {/* Récapitulatif véhicule */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <p className="text-xs font-semibold text-[#9CA3AF]">Véhicule</p>
              <p className="mt-0.5 font-bold text-[#111]">{v.titre}</p>
              <p className="text-sm text-slate-500">
                {v.marque} {v.modele} {v.version ?? ""}
              </p>
              <p className="mt-2 text-2xl font-black text-[#111]">{fmt(prix)}</p>
              <Link to={`/vehicule/${annonceId}`} className="text-xs font-semibold text-[#B8960C]">
                Voir l'annonce
              </Link>
            </div>

            {/* Choix du mode */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("comptant")}
                className={`rounded-xl border p-3 text-left transition ${
                  mode === "comptant" ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-[#E5E7EB] bg-white"
                }`}
              >
                <Wallet size={18} className="text-[#B8960C]" />
                <p className="mt-1 text-sm font-bold text-[#111]">Payer comptant</p>
                <p className="text-[11px] text-slate-500">Prix total : {fmt(prix)}</p>
              </button>
              <button
                onClick={() => setMode("acompte")}
                className={`rounded-xl border p-3 text-left transition ${
                  mode === "acompte" ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-[#E5E7EB] bg-white"
                }`}
              >
                <CreditCard size={18} className="text-[#B8960C]" />
                <p className="mt-1 text-sm font-bold text-[#111]">Réserver (acompte)</p>
                <p className="text-[11px] text-slate-500">Bloque le véhicule 24 h</p>
              </button>
            </div>

            {/* Palier d'acompte */}
            {mode === "acompte" && (
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                <p className="text-sm font-semibold text-[#111]">Montant de l'acompte</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {ACOMPTE_PALIERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAcompte(p)}
                      className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                        acompte === p
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#B8960C]"
                          : "border-slate-300 text-slate-600"
                      }`}
                    >
                      {p} €
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Moyens réellement acceptés pour ce pays et cette devise */}
            <MoyensPaiement
              countryCode={v.pays ?? "FR"}
              currency={v.devise ?? "EUR"}
              service={mode === "comptant" ? "vente" : "reservation"}
            />

            {erreur && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreur}</div>
            )}

            <button
              onClick={pay}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111] py-4 text-sm font-bold text-white disabled:opacity-60"
            >
              <ShieldCheck size={16} />
              {pending
                ? "Redirection…"
                : mode === "comptant"
                ? `Payer ${fmt(prix)}`
                : `Payer l'acompte de ${acompte} €`}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              Le numéro de carte est saisi sur la page sécurisée du prestataire, jamais sur MKA.P-MS.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
