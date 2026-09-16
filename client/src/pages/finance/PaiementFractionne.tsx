import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, CreditCard, Check, Clock } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const OPTIONS_PARTICULIER = [2, 3, 4, 5, 10];
const OPTIONS_PRO = [2, 3, 4, 5];

const STATUT_LABEL: Record<string, string> = {
  demande: "Demande envoyée",
  valide_admin: "Validée",
  rejete: "Refusée",
};

export default function PaiementFractionne() {
  const { user } = useAuth();
  const isPro = user?.role === "pro";
  const options = isPro ? OPTIONS_PRO : OPTIONS_PARTICULIER;

  const [montant, setMontant] = useState("");
  const [fois, setFois] = useState(options[0]);
  const [erreur, setErreur] = useState("");

  const mesDemandes = trpc.installments.mine.useQuery(undefined, { enabled: !!user });
  const demander = trpc.installments.request.useMutation({
    onSuccess: () => {
      setErreur("");
      setMontant("");
      mesDemandes.refetch();
    },
    onError: (e) => setErreur(e.message),
  });

  const montantNombre = Number(montant);
  const parFois = montantNombre > 0 ? montantNombre / fois : 0;

  function envoyer() {
    if (!user) {
      setErreur("Connecte-toi pour demander un paiement fractionné.");
      return;
    }
    if (!montantNombre || montantNombre <= 0) {
      setErreur("Indique le montant réel à régler.");
      return;
    }
    demander.mutate({ montantTotal: montantNombre, nbEcheances: fois, isPro });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-700 px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><CreditCard size={20} /> Paiement en plusieurs fois</h1>
        <p className="mt-1 text-sm text-white/80">Fractionnement sans frais — validé par la Direction avant mise en place de l'échéancier.</p>
      </div>

      <div className="px-4 mt-4">
        <label className="text-xs font-bold text-[#374151]">Montant total à régler</label>
        <input
          type="number"
          min={0}
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Ex : 12500"
          className="mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm"
        />
      </div>

      <div className="px-4 mt-4 space-y-2">
        {options.map((f) => (
          <button
            key={f}
            onClick={() => setFois(f)}
            className={`w-full rounded-xl p-4 flex justify-between border-2 ${fois === f ? "border-blue-500 bg-blue-50" : "border-[#E5E7EB] bg-white"}`}
          >
            <span className="text-sm font-bold text-[#111]">{f}x sans frais</span>
            <span className="text-sm font-bold text-blue-700">
              {montantNombre > 0 ? `${parFois.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €/mois` : "—"}
            </span>
          </button>
        ))}
      </div>

      {erreur && <p className="px-4 mt-2 text-xs text-red-600">{erreur}</p>}

      <div className="px-4 mt-3">
        <button
          onClick={envoyer}
          disabled={demander.isPending}
          className="w-full rounded-xl bg-blue-700 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
        >
          {demander.isPending ? "Envoi…" : "Demander la validation"}
        </button>
      </div>

      {user && (
        <div className="px-4 mt-6">
          <h3 className="text-sm font-bold text-[#111] mb-2">Vos demandes</h3>
          {mesDemandes.isLoading ? (
            <p className="text-xs text-[#6B7280]">Chargement…</p>
          ) : (mesDemandes.data ?? []).length === 0 ? (
            <p className="text-xs text-[#6B7280]">Aucune demande envoyée pour l'instant.</p>
          ) : (
            (mesDemandes.data ?? []).map((d) => (
              <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 mb-2 flex items-center gap-3">
                {d.status === "valide_admin" ? <Check size={14} className="text-green-600" /> : <Clock size={14} className="text-amber-500" />}
                <div className="flex-1">
                  <p className="text-sm text-[#111]">{Number(d.montantTotal).toLocaleString("fr-FR")} € — {d.nbEcheances}x</p>
                  <p className="text-[9px] text-[#6B7280]">{STATUT_LABEL[d.status] ?? d.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
