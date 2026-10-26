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
import MediaAdSlot from "../components/MediaAdSlot";

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
    <div className="min-h-screen bg-[#F7F8FC] px-4 py-6 pb-24 sm:py-8">
      <div className="mx-auto max-w-5xl">
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#0B1B34] px-5 py-8 text-white shadow-xl sm:px-8 sm:py-12">
        <video className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30" autoPlay muted loop playsInline preload="metadata" poster="/pubs/hero5-pro.jpg" aria-hidden="true"><source src="/videos/home/home_finance.mp4" type="video/mp4" /></video>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0B1B34]/90 via-[#0B1B34]/80 to-[#2A1647]/80" />
        <div className="flex min-w-0 items-center gap-3"><Gavel className="w-7 shrink-0 text-[#D4AF37]" /><h1 className="break-words text-2xl font-black sm:text-4xl">Enchères MKA.P-MS</h1></div>
        <p className="mt-3 max-w-3xl break-words text-sm leading-relaxed text-white/70 sm:text-base">
        Les offres sont enregistrées et validées par le moteur d'enchères. Le prix de réserve
        éventuel n'est jamais dévoilé.
        </p>
      </section>
      <div className="mt-5"><MediaAdSlot label="Visibilité automobile et partenaires" /></div>

      <div className="mt-6 grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2">
        {(["particulier", "professionnel"] as Audience[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => { setAudience(a); setOpenId(null); }}
            className={`min-h-14 min-w-0 break-words px-4 py-3 text-sm font-semibold transition sm:px-5 ${
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {list.data?.map((a) => (
          <div key={a.id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <h2 className="min-w-0 flex-1 break-words font-semibold">{a.title}</h2>
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {STATUT_LABEL[a.status] ?? a.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {a.reference} · {[a.city, a.countryCode].filter(Boolean).join(", ")}
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
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
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                          className="w-full rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
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
          href="/vendre"
          className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-[#0B1B34]"
        >
          <Plus className="w-4 h-4" /> Déposer un véhicule pour le mettre en enchère
        </a>
      )}
      </div>
    </div>
  );
}
