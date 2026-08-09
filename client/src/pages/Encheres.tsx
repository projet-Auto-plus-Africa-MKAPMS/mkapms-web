/**
 * MKA.P-MS — Univers Enchères (points 30-31).
 *
 * Deux entrées distinctes : enchères particuliers et enchères professionnels.
 * Toutes les données viennent de l'Auction Engine : les offres, le montant
 * minimal et le gagnant sont décidés côté serveur, jamais ici.
 */
import { useState } from "react";
import { Gavel, Clock, Users, Lock, Loader2, AlertCircle, Plus } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Audience = "particulier" | "professionnel";

function remaining(endsAt: string | Date) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Terminée";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h >= 24 ? `${Math.floor(h / 24)} j ${h % 24} h` : h > 0 ? `${h} h ${m} min` : `${m} min`;
}

const STATUT_LABEL: Record<string, string> = {
  programmee: "Programmée",
  en_cours: "En cours",
  terminee: "Terminée",
  adjugee: "Adjugée",
  sans_suite: "Sans suite",
  annulee: "Annulée",
};

export default function Encheres() {
  const { user } = useAuth();
  const [audience, setAudience] = useState<Audience>("particulier");
  const [openId, setOpenId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const list = trpc.auctionEngine.list.useQuery({ audience });
  const detail = trpc.auctionEngine.detail.useQuery(
    { id: openId ?? 0 },
    { enabled: openId !== null },
  );
  const utils = trpc.useUtils();
  const bid = trpc.auctionEngine.bid.useMutation({
    onSuccess: (r) => {
      setFeedback(r.accepted ? `Offre de ${r.amount} enregistrée.` : (r.reason ?? "Offre refusée."));
      if (r.accepted) setAmount("");
      utils.auctionEngine.list.invalidate();
      if (openId !== null) utils.auctionEngine.detail.invalidate({ id: openId });
    },
    onError: (e) => setFeedback(e.message),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Gavel className="w-7 h-7 text-[#D4AF37]" />
        <h1 className="text-2xl font-bold">Enchères MKA.P-MS</h1>
      </div>
      <p className="text-gray-600 mb-6">
        Les offres sont enregistrées et validées par le moteur d'enchères. Le prix de réserve
        éventuel n'est jamais dévoilé.
      </p>

      <div className="inline-flex rounded-xl border overflow-hidden mb-6">
        {(["particulier", "professionnel"] as Audience[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => { setAudience(a); setOpenId(null); }}
            className={`px-5 py-2.5 text-sm font-semibold ${
              audience === a ? "bg-[#0B1B34] text-white" : "bg-white text-gray-700"
            }`}
          >
            {a === "particulier" ? "Enchères particuliers" : "Enchères professionnels"}
          </button>
        ))}
      </div>

      {list.isLoading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des lots…
        </div>
      )}

      {list.data && list.data.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Aucune enchère publiée pour le moment.</p>
            <p className="text-sm text-gray-600">
              Cet espace n'affiche que des lots réels : rien n'est simulé. Déposez un véhicule pour
              ouvrir la première enchère.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {list.data?.map((a) => (
          <div key={a.id} className="border rounded-xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{a.title}</h2>
              <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5">
                {STATUT_LABEL[a.status] ?? a.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {a.reference} · {[a.city, a.countryCode].filter(Boolean).join(", ")}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="font-semibold">
                Départ {a.startPrice} {a.currency}
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <Users className="w-3.5 h-3.5" /> {a.bidCount} offre(s)
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <Clock className="w-3.5 h-3.5" /> {remaining(a.endsAt)}
              </span>
            </div>
            {a.hasReserve && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Prix de réserve défini (montant confidentiel)
              </p>
            )}
            <button
              type="button"
              onClick={() => { setOpenId(openId === a.id ? null : a.id); setFeedback(null); }}
              className="mt-3 w-full rounded-lg border py-2 text-sm font-medium"
            >
              {openId === a.id ? "Masquer le détail" : "Voir le détail et enchérir"}
            </button>

            {openId === a.id && (
              <div className="mt-4 border-t pt-4">
                {detail.isLoading && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                  </div>
                )}
                {detail.data && (
                  <>
                    <p className="text-sm text-gray-700 mb-3">{detail.data.auction.description}</p>
                    <p className="text-sm font-medium mb-2">Meilleures offres</p>
                    {detail.data.bids.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucune offre pour l'instant.</p>
                    ) : (
                      <ul className="text-sm space-y-1">
                        {detail.data.bids.slice(0, 5).map((b) => (
                          <li key={b.id} className="flex justify-between">
                            <span className="text-gray-600">Enchérisseur #{b.bidderId}</span>
                            <span className="font-medium">{b.amount} {a.currency}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {user ? (
                      <div className="flex gap-2 mt-4">
                        <input
                          type="number"
                          className="flex-1 border rounded-lg px-3 py-2 text-sm"
                          placeholder={`Montant en ${a.currency}`}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                        <button
                          type="button"
                          disabled={bid.isPending || !amount}
                          onClick={() =>
                            bid.mutate({ auctionId: a.id, amount: Number(amount) })
                          }
                          className="rounded-lg bg-[#D4AF37] text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                        >
                          Enchérir
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-4">
                        Connectez-vous pour enchérir.
                      </p>
                    )}

                    {feedback && (
                      <p className="text-sm mt-2 text-gray-700">{feedback}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {user && (
        <a
          href="/acheter/depot-annonce"
          className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-[#0B1B34]"
        >
          <Plus className="w-4 h-4" /> Déposer un véhicule pour le mettre en enchère
        </a>
      )}
    </div>
  );
}
