import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Home, MessageSquare } from "lucide-react";

/**
 * Page de confirmation affichée lorsque la passerelle de paiement en ligne
 * (Stripe) n'est pas configurée sur l'environnement. Le paiement est
 * enregistré côté serveur en statut « en attente » ; cette page confirme la
 * prise en compte de la demande au client.
 */
export default function PaiementSimulation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = params.get("payment");

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 size={34} className="text-emerald-600" />
      </div>
      <h1 className="mt-4 text-xl font-black text-[#111]">Demande enregistrée</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Votre demande de paiement a bien été prise en compte
        {paymentId ? ` (référence #${paymentId})` : ""}. L'équipe MKA.P-MS vous contactera pour
        finaliser la transaction en toute sécurité.
      </p>
      <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
        <button
          onClick={() => navigate("/messagerie")}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#111] py-3 text-sm font-bold text-white"
        >
          <MessageSquare size={16} /> Ouvrir la messagerie
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white py-3 text-sm font-bold text-[#374151]"
        >
          <Home size={16} /> Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
