import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  Phone,
  Star,
  ShieldCheck,
  Clock,
  BadgeCheck,
  TrendingUp,
  Flag,
  History,
  ChevronRight,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { ACOMPTE_PALIERS } from "@shared/plans";
import { computeTrustScore, TRUST_LEVEL_LABEL } from "@shared/trust";

export default function Vehicule() {
  const { format: formatPrice } = useCurrency();
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [acompte, setAcompte] = useState<number>(ACOMPTE_PALIERS[1]);

  const q = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: !!annonceId });
  const legal = trpc.meta.legal.useQuery();
  const estimateQuery = trpc.annonces.estimate.useQuery(
    {
      marque: q.data?.marque ?? "",
      modele: q.data?.modele ?? "",
      annee: q.data?.annee ?? undefined,
      kilometrage: q.data?.kilometrage ?? undefined,
    },
    { enabled: !!q.data && q.data.type === "vente" && !!q.data.marque && !!q.data.modele },
  );
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

  // Indice de Confiance MKA.P-MS (Partie 5) — calcul transparent.
  const trust = computeTrustScore({
    vendeurProfessionnel: v.vendeurType === "professionnel" || v.vendeurType === "concession",
    rating: v.vendeur ? Number(v.vendeur.rating || 0) : 0,
    reviewCount: v.vendeur?.reviewCount ?? 0,
    photosCount: v.photos.length,
    hasDescription: !!v.description && v.description.length > 20,
    hasLocalisation: !!(v.ville || v.codePostal),
    hasContact: !!v.contactTelephone,
  });
  const trustColor =
    trust.niveau === "excellent"
      ? "text-emerald-600"
      : trust.niveau === "bon"
        ? "text-brand"
        : trust.niveau === "moyen"
          ? "text-amber-600"
          : "text-slate-500";
  const whatsapp = `https://wa.me/${(v.contactTelephone || "").replace(/\D/g, "")}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par l'annonce "${v.titre}" (réf #${v.id}) sur MKA.P-MS.`,
  )}`;
  const reportHref = `mailto:${legal.data?.email ?? "mka.garageauto@gmail.com"}?subject=${encodeURIComponent(
    `Signalement annonce ${v.reference || `#${v.id}`} — ${v.titre}`,
  )}&body=${encodeURIComponent(
    `Bonjour,\n\nJe souhaite signaler l'annonce "${v.titre}" (réf ${v.reference || `#${v.id}`}) pour la raison suivante :\n\n`,
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

  const primaryAction = () =>
    requireLogin(() => {
      if (isLocation) {
        navigate("/compte/messages");
      } else {
        document.getElementById("reserver")?.scrollIntoView({ behavior: "smooth" });
      }
    });
  const messageAction = () => requireLogin(() => navigate("/compte/messages"));

  return (
    <div className="container-page py-6 pb-44 md:pb-10">
      {/* Fil d'ariane */}
      <div className="mb-4 flex items-center gap-1 text-xs text-slate-400">
        <Link to="/acheter" className="hover:text-noir">Annonces</Link>
        <ChevronRight size={13} />
        <span className="text-slate-500">{v.marque} {v.modele}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* ===== 1. PHOTOS ===== */}
        <section className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/10] bg-slate-100">
              {photos.length ? (
                <img src={photos[photoIdx]} alt={v.titre} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-slate-400">Pas de photo</div>
              )}
              {photos.length > 1 && (
                <span className="badge absolute bottom-3 right-3 bg-noir/70 text-white">
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
                    className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg ring-offset-1 ${
                      i === photoIdx ? "ring-2 ring-gold" : "ring-1 ring-slate-200"
                    }`}
                  >
                    <img src={p} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===== 2. PRIX + 3. BOUTONS (bloc d'action — à droite sur desktop, sous les photos sur mobile) ===== */}
        <aside className="space-y-5 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
              {v.vendeurType === "professionnel" ? "MKA.P-MS Garage" : "Particulier"}
            </p>
            <h1 className="mt-1 text-xl font-extrabold text-noir">{v.titre}</h1>
            <p className="text-sm text-slate-500">{v.version || `${v.marque} ${v.modele}`}</p>
            {v.reference && (
              <p className="mt-1 text-xs font-medium text-slate-400">Réf. annonce : {v.reference}</p>
            )}

            {/* PRIX */}
            <div className="mt-3 text-3xl font-extrabold text-noir">
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

            {/* Positionnement prix vs estimation marché (Partie 5) */}
            {!isLocation && estimateQuery.data && Number(v.prix) > 0 && (() => {
              const est = estimateQuery.data;
              const prixNum = Number(v.prix);
              const label =
                prixNum <= est.mid * 0.97
                  ? { t: "Bon prix", c: "bg-success/10 text-success-dark" }
                  : prixNum <= est.high
                    ? { t: "Prix du marché", c: "bg-gold-soft text-gold-dark" }
                    : { t: "Au-dessus du marché", c: "bg-warning/10 text-amber-700" };
              return (
                <div className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${label.c}`}>
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp size={14} /> {label.t}
                  </span>
                  <span className="ml-1 font-normal opacity-80">
                    · estimation {formatPrice(est.low)} – {formatPrice(est.high)}
                    {est.method === "comparables" ? ` (${est.sampleSize} similaires)` : ""}
                  </span>
                </div>
              );
            })()}

            {/* BOUTONS d'action standardisés */}
            <div className="mt-5 space-y-2">
              <button className="btn-acheter w-full" onClick={primaryAction}>
                {isLocation ? "Louer ce véhicule" : "Acheter ce véhicule"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-message" onClick={messageAction}>
                  <MessageSquare size={16} /> Message
                </button>
                {v.contactTelephone ? (
                  <a href={`tel:${v.contactTelephone}`} className="btn-appeler">
                    <Phone size={16} /> Appeler
                  </a>
                ) : (
                  <button className="btn-outline" onClick={messageAction}>
                    <Phone size={16} /> Appeler
                  </button>
                )}
              </div>
              {v.contactTelephone && (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-whatsapp w-full">
                  WhatsApp
                </a>
              )}
              <div className="flex items-center justify-between pt-1">
                <button
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-noir"
                  onClick={() => requireLogin(() => toggleFav.mutate({ annonceId: v.id }))}
                >
                  <Heart size={16} /> Ajouter aux favoris
                </button>
                <a
                  href={reportHref}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-danger"
                >
                  <Flag size={13} /> Signaler
                </a>
              </div>
            </div>
          </div>

          {/* Réserver avec acompte (vente) */}
          {!isLocation && (
            <div id="reserver" className="card p-5">
              <h3 className="font-bold text-noir">Réserver avec acompte</h3>
              <p className="mt-1 text-sm text-slate-500">
                Bloquez ce véhicule 24 h, le temps de finaliser.
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {ACOMPTE_PALIERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAcompte(p)}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      acompte === p
                        ? "border-gold bg-gold-soft text-gold-dark"
                        : "border-slate-300 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {p} €
                  </button>
                ))}
              </div>
              <button
                className="btn-reserver mt-4 w-full"
                disabled={reserve.isPending}
                onClick={() => requireLogin(() => reserve.mutate({ annonceId: v.id, acompte }))}
              >
                {reserve.isPending ? "Redirection…" : "Réserver maintenant"}
              </button>
            </div>
          )}

          {/* Indice de Confiance MKA.P-MS (Partie 5 §4) */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-noir">Indice de Confiance</h3>
              <span className={`text-2xl font-extrabold ${trustColor}`}>{trust.score}<span className="text-sm text-slate-400">/100</span></span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${trust.niveau === "excellent" ? "bg-success" : trust.niveau === "bon" ? "bg-gold" : trust.niveau === "moyen" ? "bg-warning" : "bg-slate-400"}`}
                style={{ width: `${trust.score}%` }}
              />
            </div>
            <p className={`mt-2 text-xs font-semibold ${trustColor}`}>{TRUST_LEVEL_LABEL[trust.niveau]}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {trust.badges.map((b) => (
                <span key={b.code} className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-slate-600">
                  <BadgeCheck size={13} className="text-gold-dark" /> {b.label}
                </span>
              ))}
            </div>
            <Link to="/confiance" className="mt-3 inline-block text-xs font-semibold text-gold-dark">
              Comment ça marche ? →
            </Link>
          </div>
        </aside>

        {/* ===== 4 → 8 : Infos, Description, Historique, Vendeur, Avis ===== */}
        <section className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-2">
          {/* 4. INFOS VÉHICULE */}
          <div className="card p-5">
            <h2 className="mb-4 font-bold text-noir">Caractéristiques</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
              {details
                .filter(([, val]) => val != null && val !== "")
                .map(([k, val]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-400">{k}</dt>
                    <dd className="text-sm font-medium text-ink">{String(val)}</dd>
                  </div>
                ))}
            </dl>
            {(v.ville || v.codePostal) && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <dt className="text-xs text-slate-400">Localisation</dt>
                <dd className="text-sm font-medium text-ink">
                  {[v.ville, v.codePostal].filter(Boolean).join(" ")}
                </dd>
              </div>
            )}
          </div>

          {/* 5. DESCRIPTION */}
          <div className="card p-5">
            <h2 className="mb-3 font-bold text-noir">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {v.description || "Aucune description fournie par le vendeur."}
            </p>
          </div>

          {/* 6. HISTORIQUE */}
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-noir">
              <History size={18} className="text-gold-dark" /> Historique du véhicule
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
              {v.annee != null && (
                <div>
                  <dt className="text-xs text-slate-400">1re mise en circulation</dt>
                  <dd className="text-sm font-medium text-ink">{v.annee}</dd>
                </div>
              )}
              {v.kilometrage != null && (
                <div>
                  <dt className="text-xs text-slate-400">Kilométrage</dt>
                  <dd className="text-sm font-medium text-ink">{v.kilometrage.toLocaleString("fr-FR")} km</dd>
                </div>
              )}
              {v.etat && (
                <div>
                  <dt className="text-xs text-slate-400">État</dt>
                  <dd className="text-sm font-medium text-ink">{String(v.etat)}</dd>
                </div>
              )}
            </dl>
            <Link
              to="/historique"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-dark"
            >
              Vérifier l'historique complet (CarVertical / QR) <ChevronRight size={15} />
            </Link>
          </div>

          {/* 7. VENDEUR */}
          <div className="card p-5">
            <h3 className="font-bold text-noir">Vendeur</h3>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {v.vendeurType === "professionnel" ? "MKA.P-MS Garage" : v.contactNom || "Particulier"}
                </p>
                {v.vendeur && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm">
                    <Star size={15} className="fill-gold text-gold" />
                    <span className="font-medium text-slate-700">{Number(v.vendeur.rating || 0).toFixed(1)}</span>
                    <span className="text-slate-400">({v.vendeur.reviewCount || 0} avis)</span>
                  </div>
                )}
              </div>
              <button className="btn-message" onClick={messageAction}>
                <MessageSquare size={16} /> Contacter
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-gold-dark" /> Paiement sécurisé Stripe
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-gold-dark" /> Réponse rapide
              </li>
            </ul>
          </div>

          {/* 8. AVIS */}
          {v.vendeur && (
            <AvisSection targetUserId={v.vendeur.id} canReview={!!user && user.id !== v.vendeur.id} />
          )}

          <Link to="/acheter" className="block text-center text-sm font-semibold text-gold-dark">
            ← Retour aux annonces
          </Link>
        </section>
      </div>

      {/* Barre d'actions fixe (mobile) — toujours visible, au-dessus de la navigation */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-slate-200 bg-white/95 p-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
        <div className={`container-page grid gap-2 ${v.contactTelephone ? "grid-cols-3" : "grid-cols-2"}`}>
          <button className="btn-message" onClick={messageAction}>
            <MessageSquare size={16} /> Message
          </button>
          {v.contactTelephone && (
            <a href={`tel:${v.contactTelephone}`} className="btn-appeler">
              <Phone size={16} /> Appeler
            </a>
          )}
          <button className="btn-acheter" onClick={primaryAction}>
            {isLocation ? "Louer" : "Acheter"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AvisSection({ targetUserId, canReview }: { targetUserId: number; canReview: boolean }) {
  const utils = trpc.useUtils();
  const list = trpc.reviews.listForUser.useQuery({ targetUserId });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const create = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setComment("");
      utils.reviews.listForUser.invalidate({ targetUserId });
      utils.annonces.get.invalidate();
    },
  });

  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-800">Avis clients</h3>
      {canReview && (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-600">Laisser un avis</p>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} étoiles`}>
                <Star
                  size={20}
                  className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                />
              </button>
            ))}
          </div>
          <textarea
            className="input mt-2 text-sm"
            rows={2}
            placeholder="Votre commentaire (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            className="btn-primary mt-2 w-full text-sm"
            disabled={create.isPending}
            onClick={() => create.mutate({ targetUserId, rating, comment: comment || undefined })}
          >
            {create.isPending ? "Envoi…" : "Publier mon avis"}
          </button>
          {create.isSuccess && <p className="mt-1 text-xs text-emerald-600">Merci, votre avis est publié.</p>}
        </div>
      )}
      <div className="mt-3 space-y-3">
        {list.data?.map((r) => (
          <div key={r.id} className="border-b border-slate-50 pb-2 last:border-0">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={13}
                  className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                />
              ))}
              <span className="ml-1 text-xs font-medium text-slate-500">{r.authorName ?? "Client"}</span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
          </div>
        ))}
        {list.data && list.data.length === 0 && (
          <p className="text-sm text-slate-500">Aucun avis pour le moment.</p>
        )}
      </div>
    </div>
  );
}
