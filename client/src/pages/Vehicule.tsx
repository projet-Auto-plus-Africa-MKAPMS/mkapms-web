import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Phone,
  Star,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { ACOMPTE_PALIERS } from "@shared/plans";

const TABS = ["Description", "Points forts", "Équipements", "Imperfections"] as const;

export default function Vehicule() {
  const { format: formatPrice } = useCurrency();
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Description");
  const [photoIdx, setPhotoIdx] = useState(0);
  const [acompte, setAcompte] = useState<number>(ACOMPTE_PALIERS[1]);

  const q = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: !!annonceId });
  const incView = trpc.annonces.incrementView.useMutation();
  const toggleFav = trpc.favoris.toggle.useMutation();
  const reserve = trpc.reservations.create.useMutation({
    onSuccess: (r) => {
      if (r.url) window.location.href = r.url;
    },
  });

  useEffect(() => {
    if (annonceId) incView.mutate({ id: annonceId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annonceId]);

  if (q.isLoading) return <div className="container-page py-16 text-slate-500">Chargement…</div>;
  if (q.error || !q.data)
    return <div className="container-page py-16 text-slate-500">Véhicule introuvable.</div>;

  const v = q.data;
  const photos = v.photos.length ? v.photos.map((p) => p.url) : [];
  const isLocation = v.type === "location";
  const whatsapp = `https://wa.me/${(v.contactTelephone || "").replace(/\D/g, "")}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par l'annonce "${v.titre}" (réf #${v.id}) sur MKA.P-MS.`,
  )}`;

  function requireLogin(action: () => void) {
    if (!user) return navigate("/connexion");
    action();
  }

  const details: [string, unknown][] = [
    ["Marque", v.marque],
    ["Modèle", v.modele],
    ["Version", v.version],
    ["Année", v.annee],
    ["Kilométrage", v.kilometrage != null ? `${v.kilometrage.toLocaleString("fr-FR")} km` : null],
    ["Énergie", v.carburant],
    ["Boîte", v.boite],
    ["Couleur", v.couleur],
    ["Portes", v.portes],
    ["Places", v.places],
    ["Puissance", v.puissanceCv ? `${v.puissanceCv} ch` : null],
    ["État", v.etat],
  ];

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Galerie + contenu */}
        <div>
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/10] bg-slate-100">
              {photos.length ? (
                <img src={photos[photoIdx]} alt={v.titre} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-slate-400">Pas de photo</div>
              )}
              {photos.length > 1 && (
                <span className="badge absolute bottom-3 right-3 bg-black/60 text-white">
                  {photoIdx + 1} / {photos.length}
                </span>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg ${
                      i === photoIdx ? "ring-2 ring-brand" : ""
                    }`}
                  >
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Onglets */}
          <div className="card mt-6 p-5">
            <div className="flex flex-wrap gap-1 border-b border-slate-200">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-semibold ${
                    tab === t ? "border-b-2 border-brand text-brand" : "text-slate-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="prose prose-sm mt-4 max-w-none text-slate-600">
              {tab === "Description" && <p>{v.description || "Aucune description fournie."}</p>}
              {tab !== "Description" && (
                <p className="text-slate-400">Information non renseignée par le vendeur.</p>
              )}
            </div>
          </div>

          {/* Détails techniques */}
          <div className="card mt-6 p-5">
            <h2 className="mb-4 font-bold text-slate-800">Détails du véhicule</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
              {details
                .filter(([, val]) => val != null && val !== "")
                .map(([k, val]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-400">{k}</dt>
                    <dd className="text-sm font-medium text-slate-800">{String(val)}</dd>
                  </div>
                ))}
            </dl>
            {(v.ville || v.codePostal) && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <dt className="text-xs text-slate-400">Localisation</dt>
                <dd className="text-sm font-medium text-slate-800">
                  {[v.ville, v.codePostal].filter(Boolean).join(" ")}
                </dd>
              </div>
            )}
          </div>
        </div>

        {/* Colonne action */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              {v.vendeurType === "professionnel" ? "MKA.P-MS Garage" : "Particulier"}
            </p>
            <h1 className="mt-1 text-xl font-extrabold text-slate-900">{v.titre}</h1>
            <p className="text-sm text-slate-500">{v.version || `${v.marque} ${v.modele}`}</p>
            <div className="mt-3 text-3xl font-extrabold text-slate-900">
              {isLocation && v.prixJour
                ? `${formatPrice(Number(v.prixJour))} /jour`
                : formatPrice(Number(v.prix))}
            </div>
            {isLocation && (
              <div className="mt-1 text-sm text-slate-500">
                {v.prixSemaine && `${formatPrice(Number(v.prixSemaine))}/sem · `}
                {v.prixMois && `${formatPrice(Number(v.prixMois))}/mois`}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="btn-primary"
                onClick={() => requireLogin(() => alert("Parcours d'achat sécurisé à finaliser."))}
              >
                {isLocation ? "Louer" : "Acheter"}
              </button>
              <button
                className="btn-outline"
                onClick={() => requireLogin(() => toggleFav.mutate({ annonceId: v.id }))}
              >
                <Heart size={16} /> Favori
              </button>
            </div>
          </div>

          {/* Réserver avec acompte */}
          {!isLocation && (
            <div className="card p-5">
              <h3 className="font-bold text-slate-800">Réserver avec acompte</h3>
              <p className="mt-1 text-sm text-slate-500">
                Bloquez ce véhicule 24 h, le temps de finaliser.
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {ACOMPTE_PALIERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAcompte(p)}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold ${
                      acompte === p ? "border-brand bg-brand/5 text-brand" : "border-slate-300 text-slate-600"
                    }`}
                  >
                    {p} €
                  </button>
                ))}
              </div>
              <button
                className="btn-gold mt-4 w-full"
                disabled={reserve.isPending}
                onClick={() => requireLogin(() => reserve.mutate({ annonceId: v.id, acompte }))}
              >
                {reserve.isPending ? "Redirection…" : "Réserver maintenant"}
              </button>
            </div>
          )}

          {/* Contact vendeur */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800">Contacter le vendeur</h3>
            {v.vendeur && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                <span className="font-medium text-slate-700">
                  {Number(v.vendeur.rating || 0).toFixed(1)}
                </span>
                <span className="text-slate-400">({v.vendeur.reviewCount || 0} avis)</span>
              </div>
            )}
            <div className="mt-3 grid gap-2">
              <button
                className="btn-outline"
                onClick={() => requireLogin(() => navigate("/compte/messages"))}
              >
                <MessageSquare size={16} /> Message
              </button>
              {v.contactTelephone && (
                <a href={`tel:${v.contactTelephone}`} className="btn-outline">
                  <Phone size={16} /> Appeler
                </a>
              )}
              {v.contactTelephone && (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-outline">
                  WhatsApp
                </a>
              )}
            </div>
            <ul className="mt-4 space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-brand" /> Paiement sécurisé Stripe
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-brand" /> Réponse rapide
              </li>
            </ul>
          </div>

          <Link to="/acheter" className="block text-center text-sm font-semibold text-brand">
            ← Retour aux annonces
          </Link>
        </aside>
      </div>
    </div>
  );
}
