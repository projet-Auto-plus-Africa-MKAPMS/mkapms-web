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
  FileText,
  FolderCheck,
  Eye as EyeIcon,
  Download,
  CreditCard,
  Send,
  Building2,
} from "lucide-react";

/* ── Classification des tiers ── */
type VehicleTier = "officiel" | "elite" | "premium" | "professionnel" | "particulier";

function getVehicleTier(v: any): VehicleTier {
  const id = v.id;
  // MKA.P-MS stock officiel (8000-8005)
  if (id >= 8000 && id <= 8005) return "officiel";
  // Elite: boosted + officiel vendeurType
  if (v.tier === "elite") return "elite";
  // Premium: boosted annonces pro
  if (v.boosted && v.vendeurType === "professionnel") return "premium";
  // Professionnel
  if (v.vendeurType === "professionnel" || v.vendeurType === "concession") return "professionnel";
  return "particulier";
}
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { ACOMPTE_PALIERS } from "@shared/plans";
import { computeTrustScore, TRUST_LEVEL_LABEL } from "@shared/trust";
import { computeBadges } from "@shared/badges";
import { BadgeChip } from "../components/VehicleCard";

/* ── Véhicules démo (IDs >= 8000) ── */
const DEMO_VEHICLES: Record<number, any> = Object.fromEntries([
  { id: 8001, titre: "Peugeot 308 GT", marque: "Peugeot", modele: "308", annee: 2023, kilometrage: 12000, carburant: "Essence", prix: 26900, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", description: "Peugeot 308 GT en excellent état, premier propriétaire. Véhicule révisé et garanti MKA.P-MS.", photoPrincipale: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80" },
  { id: 8002, titre: "Renault Austral Iconic", marque: "Renault", modele: "Austral", annee: 2024, kilometrage: 5000, carburant: "Hybride", prix: 34500, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", description: "Renault Austral Iconic hybride, faible kilométrage. Garantie constructeur.", photoPrincipale: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80" },
  { id: 8003, titre: "Citroën C5 X Shine", marque: "Citroën", modele: "C5 X", annee: 2023, kilometrage: 18000, carburant: "Diesel", prix: 31900, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", description: "Citroën C5 X Shine, confort et élégance. Entretien complet.", photoPrincipale: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80" },
  { id: 8004, titre: "Mercedes GLA 200", marque: "Mercedes", modele: "GLA", annee: 2022, kilometrage: 22000, carburant: "Essence", prix: 38900, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", description: "Mercedes GLA 200, SUV compact premium. Garantie MKA.P-MS.", photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80" },
  { id: 8005, titre: "BMW X1 sDrive18i", marque: "BMW", modele: "X1", annee: 2023, kilometrage: 15000, carburant: "Essence", prix: 35500, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", description: "BMW X1 sDrive18i, motorisation essence efficiente. État impeccable.", photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80" },
  { id: 9001, titre: "Peugeot 3008 GT Line", marque: "Peugeot", modele: "3008", annee: 2022, kilometrage: 35000, carburant: "Diesel", prix: 28900, type: "vente", ville: "Paris", vendeurType: "professionnel", description: "Peugeot 3008 GT Line, SUV familial. Révision complète effectuée.", photoPrincipale: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80" },
  { id: 9002, titre: "Renault Clio V Intens", marque: "Renault", modele: "Clio", annee: 2023, kilometrage: 18000, carburant: "Essence", prix: 16500, type: "vente", ville: "Lyon", vendeurType: "particulier", description: "Renault Clio V Intens, citadine polyvalente en parfait état.", photoPrincipale: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80" },
  { id: 9003, titre: "BMW Série 3 320d M Sport", marque: "BMW", modele: "Série 3", annee: 2021, kilometrage: 42000, carburant: "Diesel", prix: 35900, type: "vente", ville: "Marseille", vendeurType: "professionnel", boosted: true, description: "BMW Série 3 M Sport, performance et élégance.", photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80" },
  { id: 9004, titre: "Mercedes Classe A 200", marque: "Mercedes", modele: "Classe A", annee: 2022, kilometrage: 25000, carburant: "Essence", prix: 32000, type: "vente", ville: "Toulouse", vendeurType: "professionnel", boosted: true, description: "Mercedes Classe A 200, compacte premium.", photoPrincipale: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80" },
  { id: 9005, titre: "Citroën C3 Aircross", marque: "Citroën", modele: "C3 Aircross", annee: 2023, kilometrage: 12000, carburant: "Essence", prix: 19900, type: "vente", ville: "Bordeaux", vendeurType: "particulier", description: "Citroën C3 Aircross, petit SUV pratique.", photoPrincipale: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80" },
  { id: 9006, titre: "Volkswagen Golf 8 R-Line", marque: "Volkswagen", modele: "Golf", annee: 2022, kilometrage: 30000, carburant: "Essence", prix: 27500, type: "vente", ville: "Nice", vendeurType: "professionnel", boosted: true, description: "VW Golf 8 R-Line, compacte sportive.", photoPrincipale: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80" },
  { id: 9007, titre: "Toyota Yaris Hybride", marque: "Toyota", modele: "Yaris", annee: 2023, kilometrage: 8000, carburant: "Hybride", prix: 21500, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 45, description: "Toyota Yaris Hybride en location. Économique et fiable.", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80" },
  { id: 9008, titre: "Audi A4 Avant S-Line", marque: "Audi", modele: "A4", annee: 2021, kilometrage: 55000, carburant: "Diesel", prix: 31900, type: "vente", ville: "Lille", vendeurType: "professionnel", boosted: true, description: "Audi A4 Avant S-Line, break sportif.", photoPrincipale: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80" },
  { id: 9009, titre: "Dacia Sandero Stepway", marque: "Dacia", modele: "Sandero", annee: 2022, kilometrage: 22000, carburant: "Essence", prix: 14500, type: "vente", ville: "Nantes", vendeurType: "particulier", description: "Dacia Sandero Stepway, rapport qualité-prix imbattable.", photoPrincipale: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80" },
  { id: 9010, titre: "Fiat 500 Lounge", marque: "Fiat", modele: "500", annee: 2021, kilometrage: 32000, carburant: "Essence", prix: 13900, type: "vente", ville: "Strasbourg", vendeurType: "particulier", description: "Fiat 500 Lounge, citadine iconique.", photoPrincipale: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80" },
  { id: 9101, titre: "Peugeot 208 GT", marque: "Peugeot", modele: "208", annee: 2023, kilometrage: 5000, carburant: "Essence", prix: 35, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 35, description: "Peugeot 208 GT disponible en location. Compacte et sportive.", photoPrincipale: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80" },
  { id: 9102, titre: "Renault Captur Intens", marque: "Renault", modele: "Captur", annee: 2022, kilometrage: 15000, carburant: "Diesel", prix: 42, type: "location", ville: "Lyon", vendeurType: "professionnel", prixJour: 42, description: "Renault Captur Intens en location. SUV compact et confortable.", photoPrincipale: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&q=80" },
  { id: 9103, titre: "Citroën C4 Feel", marque: "Citroën", modele: "C4", annee: 2023, kilometrage: 8000, carburant: "Hybride", prix: 48, type: "location", ville: "Marseille", vendeurType: "professionnel", prixJour: 48, description: "Citroën C4 Feel hybride. Confort et économie.", photoPrincipale: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80" },
  { id: 9104, titre: "Mercedes Classe C", marque: "Mercedes", modele: "Classe C", annee: 2022, kilometrage: 20000, carburant: "Diesel", prix: 75, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 75, boosted: true, description: "Mercedes Classe C premium en location. Élégance et performance.", photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80" },
  { id: 9105, titre: "Toyota RAV4 Hybride", marque: "Toyota", modele: "RAV4", annee: 2023, kilometrage: 10000, carburant: "Hybride", prix: 55, type: "location", ville: "Toulouse", vendeurType: "professionnel", prixJour: 55, description: "Toyota RAV4 Hybride. SUV familial en location.", photoPrincipale: "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=800&q=80" },
  { id: 9106, titre: "BMW Série 1 118i", marque: "BMW", modele: "Série 1", annee: 2022, kilometrage: 18000, carburant: "Essence", prix: 60, type: "location", ville: "Bordeaux", vendeurType: "professionnel", prixJour: 60, boosted: true, description: "BMW Série 1 118i en location. Compacte premium.", photoPrincipale: "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80" },
].map((v) => [v.id, { ...v, photos: [{ url: v.photoPrincipale }], contactTelephone: "+33123456789", reference: `DEMO-${v.id}`, vendeur: { rating: "4.5", reviewCount: 12 } }]));

export default function Vehicule() {
  const { format: formatPrice } = useCurrency();
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [acompte, setAcompte] = useState<number>(ACOMPTE_PALIERS[1]);

  const isDemo = annonceId >= 8000;
  const q = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: !!annonceId && !isDemo });
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

  if (!isDemo && q.isLoading) return <div className="container-page py-16 text-slate-500">Chargement…</div>;

  const demoV = isDemo ? DEMO_VEHICLES[annonceId] : null;
  const realV = !isDemo ? q.data : null;
  const v = demoV || realV;

  if (!v) return <div className="container-page py-16 text-slate-500">Véhicule introuvable.</div>;

  const photos = v.photos?.length ? v.photos.map((p: any) => p.url) : (v.photoPrincipale ? [v.photoPrincipale] : []);
  const isLocation = v.type === "location";
  const isVtcTaxi = v.segmentLocation === "vtc_taxi";
  const tier = getVehicleTier(v);
  const isOfficiel = tier === "officiel" || tier === "elite" || tier === "premium";

  /* Photo height classes per tier (responsive) */
  const photoHeightClass =
    tier === "officiel" || tier === "elite"
      ? "h-[520px] md:h-[600px] lg:h-[720px] xl:h-[850px]"
      : tier === "premium"
        ? "h-[420px] md:h-[500px] lg:h-[650px]"
        : tier === "professionnel"
          ? "h-[280px] md:h-[340px] lg:h-[380px]"
          : "h-[220px] md:h-[250px] lg:h-[280px]";

  /* Badge label */
  const tierBadge =
    tier === "officiel" ? "MKA.P-MS Officiel"
    : tier === "elite" ? "Élite"
    : tier === "premium" ? "Premium"
    : null;

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
        ? "text-gold-dark"
        : trust.niveau === "moyen"
          ? "text-amber-600"
          : "text-slate-500";
  const whatsapp = `https://wa.me/${(v.contactTelephone || "").replace(/\D/g, "")}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé par l'annonce "${v.titre}" (réf #${v.id}) sur MKA.P-MS.`,
  )}`;
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

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
    <div className="container-page py-6 pb-32 md:pb-10">
      {/* Fil d'ariane */}
      <div className="mb-4 flex items-center gap-1 text-xs text-slate-400">
        <Link to="/acheter" className="hover:text-noir">Annonces</Link>
        <ChevronRight size={13} />
        <span className="text-slate-500">{v.marque} {v.modele}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* ===== 1. PHOTOS ===== */}
        <section className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className={`card overflow-hidden ${isOfficiel ? "border-[#D4AF37]/40 shadow-lg" : ""}`}>
            <div className={`relative w-full ${photoHeightClass} bg-slate-100`}>
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
              {/* Badges automatiques — coin supérieur gauche, max 3 */}
              {(() => {
                const vehicleBadges = computeBadges({
                  id: v.id, vendeurType: v.vendeurType, type: v.type,
                  status: v.status, boosted: v.boosted, certified: v.certified,
                  tier: v.tier, planCode: v.planCode, createdAt: v.createdAt,
                });
                return vehicleBadges.length > 0 ? (
                  <div className="absolute left-3 top-3 flex flex-col gap-1">
                    {vehicleBadges.map((b) => <BadgeChip key={b.code} badge={b} />)}
                  </div>
                ) : null;
              })()}
            </div>
            {/* Galerie : 6 photos mobile, 12 desktop */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {photos.slice(0, typeof window !== "undefined" && window.innerWidth >= 1024 ? 12 : 6).map((p, i) => (
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

            {/* BOUTONS d'action — adaptés au tier et au type */}
            <div className="mt-5 space-y-2">
              {isLocation ? (
                /* ── LOCATION : tout passe par MKA.P-MS, pas de tel/WhatsApp direct ── */
                isVtcTaxi ? (
                  /* VTC / Taxi */
                  <>
                    <button className="btn-acheter w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/messages"))}><Send size={16} /> Demander location</button>
                    <button className="btn-message w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/documents"))}><FileText size={16} /> Envoyer documents</button>
                    <button className="btn-outline w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/dossiers"))}><EyeIcon size={16} /> Suivre validation</button>
                    <button className="btn-gold w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/contrats"))}><FolderCheck size={16} /> Signer contrat</button>
                    <button className="btn-reserver w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/paiements"))}><CreditCard size={16} /> Payer acompte</button>
                  </>
                ) : (
                  /* Location classique */
                  <>
                    <button className="btn-acheter w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/messages"))}><Send size={16} /> Faire une demande</button>
                    <button className="btn-message w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/documents"))}><FileText size={16} /> Déposer dossier</button>
                    <button className="btn-outline w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/dossiers"))}><EyeIcon size={16} /> Suivre dossier</button>
                    <button className="btn-gold w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/contrats"))}><Download size={16} /> Télécharger contrat</button>
                    <button className="btn-reserver w-full h-[54px] lg:h-[60px]" onClick={() => requireLogin(() => navigate("/compte/paiements"))}><CreditCard size={16} /> Effectuer paiement</button>
                  </>
                )
              ) : tier === "professionnel" ? (
                /* ── VENTE PRO : Message + Téléphone + WhatsApp + Voir société ── */
                <>
                  <button className="btn-acheter w-full h-[56px] lg:h-[64px]" onClick={primaryAction}>Acheter ce véhicule</button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn-message h-[56px] lg:h-[64px]" onClick={messageAction}><MessageSquare size={16} /> Message</button>
                    {v.contactTelephone ? (
                      <a href={`tel:${v.contactTelephone}`} className="btn-appeler h-[56px] lg:h-[64px]"><Phone size={16} /> Appeler</a>
                    ) : (
                      <button className="btn-outline h-[56px] lg:h-[64px]" onClick={messageAction}><Phone size={16} /> Appeler</button>
                    )}
                  </div>
                  {v.contactTelephone && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-whatsapp w-full h-[56px] lg:h-[64px]">WhatsApp</a>
                  )}
                  <button className="btn-outline w-full h-[56px] lg:h-[64px]" onClick={() => navigate("/pro")}><Building2 size={16} /> Voir société</button>
                </>
              ) : (
                /* ── VENTE PARTICULIER : Message + Téléphone + WhatsApp ── */
                <>
                  <button className="btn-acheter w-full h-[54px] lg:h-[60px]" onClick={primaryAction}>Acheter ce véhicule</button>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="btn-message h-[54px] lg:h-[60px]" onClick={messageAction}><MessageSquare size={16} /> Message</button>
                    {v.contactTelephone ? (
                      <a href={`tel:${v.contactTelephone}`} className="btn-appeler h-[54px] lg:h-[60px]"><Phone size={16} /> Appeler</a>
                    ) : (
                      <button className="btn-outline h-[54px] lg:h-[60px]" onClick={messageAction}><Phone size={16} /> Appeler</button>
                    )}
                  </div>
                  {v.contactTelephone && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-whatsapp w-full h-[54px] lg:h-[60px]">WhatsApp</a>
                  )}
                </>
              )}
              <div className="flex items-center justify-between pt-1">
                <button
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-noir"
                  onClick={() => requireLogin(() => toggleFav.mutate({ annonceId: v.id }))}
                >
                  <Heart size={16} /> Ajouter aux favoris
                </button>
                <button
                  onClick={() => requireLogin(() => setShowReport(true))}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500"
                >
                  <Flag size={13} /> Signaler
                </button>
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

          {/* Finance+ MKA.P-MS */}
          {!isLocation && (
            <div className="card border-[#D4AF37]/20 p-5">
              <h3 className="flex items-center gap-2 font-bold text-noir">
                <Star size={16} className="text-[#D4AF37]" fill="#D4AF37" /> Finance+
              </h3>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><ShieldCheck size={12} className="text-[#D4AF37]" /> Disponible en LOA</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><ShieldCheck size={12} className="text-[#D4AF37]" /> Disponible en paiement fractionné</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><ShieldCheck size={12} className="text-[#D4AF37]" /> Simulation immédiate</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600"><ShieldCheck size={12} className="text-[#D4AF37]" /> Réponse rapide</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/finance" className="flex items-center justify-center gap-1 rounded-lg bg-[#D4AF37] py-2 text-[10px] font-bold text-white hover:bg-[#C5A028]">Simuler</Link>
                <Link to="/finance" className="flex items-center justify-center gap-1 rounded-lg border border-[#D4AF37] py-2 text-[10px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">Conditions</Link>
              </div>
            </div>
          )}
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
      {/* ── Modal signalement interne ── */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowReport(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[#111]">Signaler cette annonce</h3>
            <p className="mt-1 text-xs text-slate-500">Réf. {v.reference || `#${v.id}`} — {v.titre}</p>
            {reportSent ? (
              <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-sm font-semibold text-green-700">Signalement envoyé</p>
                <p className="mt-1 text-xs text-green-600">Notre équipe va examiner cette annonce. Merci.</p>
                <button onClick={() => { setShowReport(false); setReportSent(false); setReportReason(""); }} className="mt-3 rounded-lg bg-[#111] px-4 py-2 text-xs font-bold text-white">Fermer</button>
              </div>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  {["Annonce frauduleuse", "Photos non conformes", "Prix incorrect", "Véhicule déjà vendu", "Contenu inapproprié", "Autre"].map((r) => (
                    <button key={r} onClick={() => setReportReason(r)} className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${reportReason === r ? "border-[#D4AF37] bg-[#D4AF37]/10 font-semibold text-[#111]" : "border-slate-200 text-slate-600 hover:border-[#D4AF37]"}`}>{r}</button>
                  ))}
                </div>
                <button
                  disabled={!reportReason}
                  onClick={() => setReportSent(true)}
                  className="mt-4 w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40"
                >Envoyer le signalement</button>
                <button onClick={() => setShowReport(false)} className="mt-2 w-full text-center text-xs text-slate-400 hover:text-slate-600">Annuler</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Barre fixe mobile — adaptée au type */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white/95 p-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
        <div className="container-page">
          {isLocation ? (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-acheter h-[48px] text-xs" onClick={() => requireLogin(() => navigate("/compte/messages"))}><Send size={14} /> Demande</button>
              <button className="btn-message h-[48px] text-xs" onClick={() => requireLogin(() => navigate("/compte/documents"))}><FileText size={14} /> Dossier</button>
            </div>
          ) : (
            <div className={`grid gap-2 ${v.contactTelephone ? "grid-cols-3" : "grid-cols-2"}`}>
              <button className="btn-message h-[48px] text-xs" onClick={messageAction}><MessageSquare size={14} /> Message</button>
              {v.contactTelephone && (
                <a href={`tel:${v.contactTelephone}`} className="btn-appeler h-[48px] text-xs"><Phone size={14} /> Appeler</a>
              )}
              <button className="btn-acheter h-[48px] text-xs" onClick={primaryAction}>{isLocation ? "Louer" : "Acheter"}</button>
            </div>
          )}
        </div>
      </div>

      {/* Boutons flottants — UNIQUEMENT pour MKA.P-MS Officiel */}
      {isOfficiel && v.contactTelephone && !isLocation && (
        <div className="fixed bottom-32 right-4 z-40 flex flex-col gap-3 md:bottom-8 md:right-8">
          <a href={`tel:${v.contactTelephone}`} className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111] text-white shadow-lg hover:bg-[#333] lg:h-20 lg:w-20">
            <Phone size={24} className="lg:hidden" /><Phone size={30} className="hidden lg:block" />
          </a>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg hover:bg-[#1ebe57] lg:h-20 lg:w-20">
            <MessageSquare size={24} className="lg:hidden" /><MessageSquare size={30} className="hidden lg:block" />
          </a>
        </div>
      )}
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
