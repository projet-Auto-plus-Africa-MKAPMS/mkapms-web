import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Camera, CheckCircle2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { isAdmin, isPro, ROLE_LABELS } from "@shared/roles";
import type { UserRole } from "@shared/roles";
import FileUpload from "../components/FileUpload";

type Tab = "annonces" | "toutes-annonces" | "publicites" | "favoris" | "recherches" | "reservations" | "devis" | "abonnements" | "litiges" | "fidelite" | "coffre" | "vehicules" | "rapports" | "services" | "profil" | "notifications";

const DEMO_RAPPORTS = [
  { id: 1, plaque: "AB-123-CD", vinPartiel: "VF1KR****567890", type: "Rapport Complet", prix: "7,99 \u20ac", date: "28/05/2024", statut: "Disponible" },
  { id: 2, plaque: "EF-456-GH", vinPartiel: "WBA8E****123456", type: "Rapport Express", prix: "4,99 \u20ac", date: "15/04/2024", statut: "Disponible" },
];

const ALL_SERVICES = [
  { label: "Acheter un v\u00e9hicule", to: "/acheter", emoji: "\ud83d\ude97", desc: "Parcourez les annonces et trouvez votre v\u00e9hicule id\u00e9al" },
  { label: "Vendre un v\u00e9hicule", to: "/vendre", emoji: "\ud83d\udcb0", desc: "D\u00e9posez une annonce et vendez rapidement" },
  { label: "Location", to: "/louer", emoji: "\ud83d\udd11", desc: "Louez un v\u00e9hicule en toute confiance" },
  { label: "Garage & R\u00e9paration", to: "/garages", emoji: "\ud83d\udd27", desc: "Trouvez un garage et demandez un devis" },
  { label: "Atelier Pro", to: "/atelier-pro", emoji: "\ud83d\udee0\ufe0f", desc: "Gestion atelier, planning, suivi temps r\u00e9el" },
  { label: "Catalogue Technique", to: "/catalogue-technique", emoji: "\ud83d\udcd6", desc: "AutoData — couples de serrage, temps bar\u00e9m\u00e9s, pi\u00e8ces" },
  { label: "Suivi V\u00e9hicule", to: "/suivi-vehicule", emoji: "\ud83d\udccd", desc: "Suivez vos r\u00e9parations en temps r\u00e9el" },
  { label: "Favoris", to: "/favoris", emoji: "\u2764\ufe0f", desc: "Vos favoris : v\u00e9hicules, garages, locations" },
  { label: "Comparateur", to: "/comparateur", emoji: "\ud83d\udd0d", desc: "Comparez 2 \u00e0 4 v\u00e9hicules c\u00f4te \u00e0 c\u00f4te" },
  { label: "Historique Consultations", to: "/historique-consultations", emoji: "\ud83d\udd70\ufe0f", desc: "Retrouvez ce que vous avez vu r\u00e9cemment" },
  { label: "Dossier Client", to: "/dossier-client", emoji: "\ud83d\udcc1", desc: "Tout votre historique centralis\u00e9" },
  { label: "Dossier V\u00e9hicule", to: "/dossier-vehicule-numerique", emoji: "\ud83d\udcdd", desc: "Carnet num\u00e9rique entretien, CT, factures" },
  { label: "Notifications", to: "/notifications", emoji: "\ud83d\udd14", desc: "Centre de notifications unifi\u00e9" },
  { label: "Comptabilit\u00e9", to: "/superadmin/comptabilite-complete", emoji: "\ud83d\udcb9", desc: "Tableau de bord dirigeant CA, finances" },
  { label: "D\u00e9pannage", to: "/depannage", emoji: "\ud83d\ude91", desc: "Assistance routi\u00e8re 24h/24, 7j/7" },
  { label: "Carte Grise", to: "/carte-grise", emoji: "\ud83d\udcc4", desc: "D\u00e9marches carte grise en ligne" },
  { label: "Livraison", to: "/livraison", emoji: "\ud83d\ude9a", desc: "Livraison France & Afrique" },
  { label: "Historique V\u00e9hicule", to: "/historique", emoji: "\ud83d\udcca", desc: "Rapport complet kilom\u00e9trage, entretien, CT" },
  { label: "Pi\u00e8ces Auto", to: "/pieces", emoji: "\u2699\ufe0f", desc: "Catalogue pi\u00e8ces d\u00e9tach\u00e9es" },
  { label: "Moto & Scooter", to: "/acheter?type=moto", emoji: "\ud83c\udfcd\ufe0f", desc: "V\u00e9hicules deux roues" },
  { label: "Journal d'activit\u00e9", to: "/journal-activite", emoji: "\ud83d\udcdc", desc: "Historique de toutes vos actions" },
  { label: "Abonnements", to: "/abonnements", emoji: "\ud83c\udfe6", desc: "Abonnements et tarifs" },
  { label: "MKA.P-MS Rewards", to: "/rewards", emoji: "\u2b50", desc: "Points fidelite, niveaux, recompenses" },
  { label: "Support", to: "/aide", emoji: "\ud83d\udcde", desc: "Aide et assistance 7j/7" },
];

const TIER_LABELS: Record<string, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum", elite: "Elite" };

export default function Compte() {
  const { format: formatPrice } = useCurrency();
  const { user, logout, isSessionLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("annonces");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "1") {
      setTab("abonnements");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    if (params.get("tab")) {
      setTab(params.get("tab") as Tab);
    }
  }, [location]);

  const mineAnnonces = trpc.annonces.mine.useQuery(undefined, { enabled: !!user && tab === "annonces" });
  const favoris = trpc.favoris.mine.useQuery(undefined, { enabled: !!user && tab === "favoris" });
  const reservations = trpc.reservations.mine.useQuery(undefined, { enabled: !!user && tab === "reservations" });
  const devis = trpc.devis.mine.useQuery(undefined, { enabled: !!user && tab === "devis" });
  const abos = trpc.abonnements.mine.useQuery(undefined, { enabled: !!user && tab === "abonnements" });
  const recherches = trpc.searches.list.useQuery(undefined, { enabled: !!user && tab === "recherches" });
  const litiges = trpc.disputes.mine.useQuery(undefined, { enabled: !!user && tab === "litiges" });
  const utils = trpc.useUtils();
  const setAlert = trpc.searches.setAlert.useMutation({ onSuccess: () => utils.searches.list.invalidate() });
  const removeSearch = trpc.searches.remove.useMutation({ onSuccess: () => utils.searches.list.invalidate() });
  const openDispute = trpc.disputes.open.useMutation({ onSuccess: () => { utils.disputes.mine.invalidate(); setLitige({ univers: "vente", category: "", description: "" }); } });
  const [litige, setLitige] = useState({ univers: "vente", category: "", description: "" });
  const fidelite = trpc.loyalty.me.useQuery(undefined, { enabled: !!user && tab === "fidelite" });
  const coffre = trpc.documents.list.useQuery(undefined, { enabled: !!user && tab === "coffre" });
  const dossiers = trpc.dossiers.list.useQuery(undefined, { enabled: !!user && tab === "vehicules" });
  const addDoc = trpc.documents.add.useMutation({ onSuccess: () => { utils.documents.list.invalidate(); setDoc({ category: "carte_grise", title: "", fileUrl: "" }); } });
  const removeDoc = trpc.documents.remove.useMutation({ onSuccess: () => utils.documents.list.invalidate() });
  const createDossier = trpc.dossiers.create.useMutation({ onSuccess: () => { utils.dossiers.list.invalidate(); setDossier({ marque: "", modele: "", immatriculation: "" }); } });
  const [doc, setDoc] = useState({ category: "carte_grise", title: "", fileUrl: "" });
  const [dossier, setDossier] = useState({ marque: "", modele: "", immatriculation: "" });

  if (isSessionLoading) {
    return <div className="container-page py-16 text-center text-slate-500">Chargement...</div>;
  }
  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-500">Connectez-vous pour accéder à votre compte.</p>
        <Link to="/connexion" className="btn-primary mt-4 inline-flex">Se connecter</Link>
      </div>
    );
  }

  const baseTabs: [Tab, string][] = [
    ["annonces", "Mes annonces"],
    ["favoris", "Favoris"],
    ["recherches", "Recherches"],
    ["reservations", "Réservations"],
    ["devis", "Devis Garage"],
    ["abonnements", "Abonnements"],
    ["litiges", "Litiges"],
    ["fidelite", "Rewards"],
    ["coffre", "Coffre-fort"],
    ["vehicules", "Dossier V\u00e9hicules"],
    ["rapports", "Rapports Historique"],
    ["notifications", "Notifications"],
    ["services", "Services"],
    ["profil", "Profil"],
  ];
  const adminTabs: [Tab, string][] = isAdmin(user.role)
    ? [["toutes-annonces", "Toutes les annonces"], ["publicites", "Publicités"]]
    : [];
  const TABS: [Tab, string][] = [
    ["annonces", "Mes annonces"],
    ...adminTabs,
    ...baseTabs.slice(1),
  ];

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="container-page py-8 relative">
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 rounded-2xl bg-green-600 p-4 text-white shadow-2xl">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <div>
              <p className="text-sm font-black">Paiement réussi !</p>
              <p className="text-[10px] opacity-90">Votre service est activé. Merci de votre confiance.</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {/* Photo de profil cliquable */}
          <button
            onClick={() => photoRef.current?.click()}
            className="relative shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#111] flex items-center justify-center overflow-hidden border-2 border-[#D4AF37] hover:opacity-90 transition active:scale-95 group"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Photo profil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-white">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera size={18} className="text-white" />
            </div>
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Bonjour, {user.name?.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">
            {ROLE_LABELS[(user.role as UserRole)] || user.role}
            {(user as any).staffPosition === "pdg" && " — PDG / Fondateur"}
            {(user as any).staffPosition === "directeur" && " — Directeur"}
            {(user as any).staffPosition === "adjoint" && " — Adjoint de direction"}
            {user.email ? ` · ${user.email}` : ""}
          </p>
          {(user as { reference?: string | null }).reference && (
            <p className="text-xs font-medium text-slate-400">
              Réf. compte : {(user as { reference?: string | null }).reference}
            </p>
          )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isPro(user.role) && <Link to="/garage-plus" className="btn-outline">Espace Garage+</Link>}
          {isAdmin(user.role) && <Link to="/admin" className="btn-primary">Espace Gestion</Link>}
          <button className="btn-outline" onClick={() => { logout(); navigate("/"); }}>Déconnexion</button>
        </div>
      </div>

      {/* Dashboard PDG — accès rapide à tous les modules (visible uniquement pour le PDG) */}
      {user.role === "super_admin" && (
        <div className="mt-4 rounded-2xl border-2 border-[#D4AF37]/30 bg-gradient-to-r from-[#111] to-[#1a1a1a] p-5">
          <h2 className="text-sm font-black text-[#D4AF37] mb-3">Acc&egrave;s PDG — Tous les modules</h2>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-5 lg:grid-cols-7">
            {[
              { label: "Espace Gestion", to: "/admin", emoji: "\ud83d\udc51" },
              { label: "Comptabilit\u00e9", to: "/superadmin/comptabilite-complete", emoji: "\ud83d\udcb9" },
              { label: "Atelier Pro", to: "/atelier-pro", emoji: "\ud83d\udee0\ufe0f" },
              { label: "Catalogue", to: "/catalogue-technique", emoji: "\ud83d\udcd6" },
              { label: "Suivi v\u00e9hicule", to: "/suivi-vehicule", emoji: "\ud83d\udccd" },
              { label: "Ench\u00e8res Pro", to: "/acheter/encheres", emoji: "\ud83d\udd28" },
              { label: "Journal", to: "/journal-activite", emoji: "\ud83d\udcdc" },
              { label: "Notifications", to: "/notifications", emoji: "\ud83d\udd14" },
              { label: "Dossier Client", to: "/dossier-client", emoji: "\ud83d\udcc1" },
              { label: "Dossier V\u00e9hicule", to: "/dossier-vehicule-numerique", emoji: "\ud83d\udcdd" },
              { label: "Favoris", to: "/favoris", emoji: "\u2764\ufe0f" },
              { label: "Comparateur", to: "/comparateur", emoji: "\ud83d\udd0d" },
              { label: "Abonnements", to: "/abonnements", emoji: "\ud83d\udcb3" },
            ].map((m) => (
              <Link key={m.to} to={m.to} className="flex flex-col items-center gap-1 rounded-xl bg-white/5 border border-white/10 p-2.5 text-center transition hover:bg-white/10 hover:border-[#D4AF37]/50">
                <span className="text-lg">{m.emoji}</span>
                <span className="text-[9px] font-bold text-white/80 leading-tight">{m.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isPro(user.role) && (
        <Link to="/compte/validation" className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>Validez votre compte professionnel en soumettant vos documents (KBIS, RIB, identité…).</span>
          <span className="font-semibold underline">Compléter ma validation →</span>
        </Link>
      )}

      <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => { setTab(v); window.scrollTo(0, 0); }}
            className={`px-4 py-2 text-sm font-semibold ${tab === v ? "border-b-2 border-gold text-noir" : "text-slate-500"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "annonces" && (
          <div className="space-y-3">
            <Link to="/vendre" className="btn-primary inline-flex">+ Déposer une annonce</Link>
            {mineAnnonces.data?.map((a) => (
              <Link key={a.id} to={`/vehicule/${a.id}`} className="card flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-800">{a.titre}</p>
                  <p className="text-xs text-slate-400">
                    {(a as { reference?: string | null }).reference ? `${(a as { reference?: string | null }).reference} · ` : ""}
                    {a.status} · {formatPrice(Number(a.prix))}
                  </p>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>
            ))}
            {mineAnnonces.data?.length === 0 && <p className="text-sm text-slate-500">Aucune annonce.</p>}
          </div>
        )}

        {/* TOUTES LES ANNONCES — admin/PDG uniquement */}
        {tab === "toutes-annonces" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Toutes les annonces de la plateforme (tous les utilisateurs : pro, particulier, société).</p>
            {mineAnnonces.data?.map((a) => (
              <Link key={a.id} to={`/vehicule/${a.id}`} className="card flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-800">{a.titre}</p>
                  <p className="text-xs text-slate-400">
                    {(a as { reference?: string | null }).reference ? `${(a as { reference?: string | null }).reference} · ` : ""}
                    {a.status} · {formatPrice(Number(a.prix))}
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Vendeur ID: {a.userId}</p>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>
            ))}
          </div>
        )}

        {/* PUBLICITÉS — gestion emplacements */}
        {tab === "publicites" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Emplacements publicitaires sur la plateforme. Cliquez pour voir les détails de chaque emplacement.</p>
            {[
              { id: 1, name: "Page d'accueil — Carrousel #1", cases: 5, actif: 3, status: "actif" },
              { id: 2, name: "Page d'accueil — Carrousel #2", cases: 5, actif: 1, status: "actif" },
              { id: 3, name: "Page d'accueil — Carrousel #3 (Premium)", cases: 5, actif: 2, status: "actif" },
              { id: 4, name: "Page produit — Bas de page", cases: 4, actif: 4, status: "actif" },
              { id: 5, name: "Page recherche — Sidebar", cases: 3, actif: 0, status: "inactif" },
              { id: 6, name: "Page résultats — Entre annonces", cases: 4, actif: 0, status: "inactif" },
            ].map((emp) => (
              <Link key={emp.id} to="/demande-publicite" className="card p-4 hover:bg-slate-50 transition cursor-pointer block">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">#{emp.id} — {emp.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{emp.cases} cases disponibles · {emp.actif} occupées</p>
                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: emp.cases }).map((_, i) => (
                        <div key={i} className={`h-3 w-8 rounded ${i < emp.actif ? "bg-[#D4AF37]" : "bg-slate-200"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${emp.status === "actif" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{emp.status}</span>
                    <span className="text-xs text-slate-400">→</span>
                  </div>
                </div>
              </Link>
            ))}

            <div className="mt-4">
              <p className="text-sm font-bold text-slate-700">Demandes en attente</p>
              <div className="mt-2 space-y-2">
                {[
                  { id: "PUB-001", entreprise: "AutoPièces Express", type: "Vendeur de pièces", emplacement: "#4", status: "en_attente" },
                  { id: "PUB-002", entreprise: "Garage Saint-Denis", type: "Réparateur", emplacement: "#1", status: "en_attente" },
                  { id: "PUB-003", entreprise: "CleanCar 95", type: "Service lavage", emplacement: "#4", status: "approuvée" },
                ].map((d) => (
                  <Link key={d.id} to={`/publicite/${d.id}`} className="card flex items-center justify-between p-3 hover:bg-slate-50 transition cursor-pointer">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{d.entreprise} <span className="text-xs text-slate-400">({d.id})</span></p>
                      <p className="text-xs text-slate-500">{d.type} · Emplacement {d.emplacement}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.status === "approuvée" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{d.status === "approuvée" ? "Approuvée" : "En attente"}</span>
                      <span className="text-xs text-slate-400">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "favoris" && (
          <div className="grid gap-3 md:grid-cols-2">
            {favoris.data?.map((f) => (
              <Link key={f.annonce.id} to={`/vehicule/${f.annonce.id}`} className="card p-4">
                <p className="font-semibold text-slate-800">{f.annonce.titre}</p>
                <p className="text-sm text-gold-dark">{formatPrice(Number(f.annonce.prix))}</p>
              </Link>
            ))}
            {favoris.data?.length === 0 && <p className="text-sm text-slate-500">Aucun favori.</p>}
          </div>
        )}
        {tab === "recherches" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Vos recherches enregistrées. Activez l'alerte pour être notifié dès qu'une
              nouvelle annonce correspond.
            </p>
            {recherches.data?.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-slate-800">{s.label}</p>
                  <p className="text-xs text-slate-400">
                    {s.univers} · {s.alertEnabled ? "Alerte active" : "Alerte en pause"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn-outline text-xs"
                    onClick={() => setAlert.mutate({ id: s.id, alertEnabled: !s.alertEnabled })}
                  >
                    {s.alertEnabled ? "Mettre en pause" : "Réactiver"}
                  </button>
                  <button
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => removeSearch.mutate({ id: s.id })}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            {recherches.data?.length === 0 && (
              <p className="text-sm text-slate-500">
                Aucune recherche enregistrée. Depuis « Acheter », cliquez sur « Enregistrer la recherche ».
              </p>
            )}
          </div>
        )}
        {tab === "reservations" && (
          <div className="space-y-3">
            {reservations.data?.map((r) => (
              <div key={r.id} onClick={() => navigate(`/acheter`)} className="card p-4 text-sm cursor-pointer hover:border-[#D4AF37] hover:shadow-md transition">
                <p className="font-semibold text-slate-800">Réservation #{r.id}</p>
                <p className="text-slate-500">Acompte {r.cautionAmount} € · {r.status} · {r.cautionStatus}</p>
              </div>
            ))}
            {reservations.data?.length === 0 && <p className="text-sm text-slate-500">Aucune réservation.</p>}
          </div>
        )}
        {tab === "devis" && (
          <div className="space-y-3">
            {devis.data?.map((d) => (
              <div key={d.id} onClick={() => navigate("/reparer")} className="card p-4 text-sm cursor-pointer hover:border-[#D4AF37] hover:shadow-md transition">
                <p className="font-semibold text-slate-800">{d.typeIntervention}</p>
                <p className="text-slate-500">{d.vehiculeMarque} {d.vehiculeModele} · {d.status}</p>
              </div>
            ))}
            {devis.data?.length === 0 && <p className="text-sm text-slate-500">Aucune demande de devis.</p>}
          </div>
        )}
        {tab === "abonnements" && (
          <div className="space-y-3">
            <Link to="/abonnements" className="btn-outline inline-flex">Voir les offres</Link>
            {abos.data?.map((s) => (
              <div key={s.id} onClick={() => navigate("/abonnements")} className="card p-4 text-sm cursor-pointer hover:border-[#D4AF37] hover:shadow-md transition">
                <p className="font-semibold text-slate-800">{s.planCode}</p>
                <p className="text-slate-500">{s.status} {s.amount ? `· ${s.amount} €` : ""}</p>
              </div>
            ))}
            {abos.data?.length === 0 && <p className="text-sm text-slate-500">Aucun abonnement actif.</p>}


          </div>
        )}
        {tab === "litiges" && (
          <div className="space-y-4">
            <form
              className="card space-y-2 p-4"
              onSubmit={(e) => { e.preventDefault(); if (litige.category && litige.description) openDispute.mutate({ univers: litige.univers as "vente", category: litige.category, description: litige.description }); }}
            >
              <p className="font-semibold text-slate-800">Ouvrir un litige</p>
              <div className="flex flex-wrap gap-2">
                <select className="input max-w-[180px]" value={litige.univers} onChange={(e) => setLitige({ ...litige, univers: e.target.value })}>
                  <option value="vente">Vente</option>
                  <option value="location">Location</option>
                  <option value="livraison">Livraison</option>
                  <option value="pieces">Pièces Auto</option>
                  <option value="garage">Garage</option>
                  <option value="autre">Autre</option>
                </select>
                <input className="input max-w-xs" placeholder="Motif (ex. véhicule non conforme)" value={litige.category} onChange={(e) => setLitige({ ...litige, category: e.target.value })} />
              </div>
              <textarea className="input" rows={3} placeholder="Décrivez le problème…" value={litige.description} onChange={(e) => setLitige({ ...litige, description: e.target.value })} />
              <button className="btn-primary !text-sm">Envoyer le litige</button>
              {openDispute.isSuccess && <p className="text-sm text-green-600">Litige ouvert. Notre équipe va l'analyser.</p>}
            </form>
            {litiges.data?.map((d) => (
              <div key={d.id} className="card p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{d.reference ?? `#${d.id}`} · {d.univers} · {d.category}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{d.status}</span>
                </div>
                <p className="mt-1 text-slate-500">{d.description}</p>
                {d.resolution && <p className="mt-1 text-xs text-gold-dark">Réponse : {d.resolution}</p>}
              </div>
            ))}
            {litiges.data?.length === 0 && <p className="text-sm text-slate-500">Aucun litige.</p>}
          </div>
        )}
        {tab === "fidelite" && (
          <div className="space-y-4">
            <div className="card p-5">
              <p className="text-sm text-slate-500">Niveau de fidélité MKA</p>
              <p className="text-3xl font-extrabold text-gold-dark">{TIER_LABELS[fidelite.data?.tier ?? "bronze"]}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{(fidelite.data?.points ?? 0).toLocaleString("fr-FR")} <span className="text-sm font-normal text-slate-500">points MKA</span></p>
              {fidelite.data?.nextTier && (
                <p className="mt-2 text-xs text-slate-500">Encore <strong>{fidelite.data.pointsToNext.toLocaleString("fr-FR")}</strong> points pour passer {TIER_LABELS[fidelite.data.nextTier]}.</p>
              )}
              <p className="mt-3 text-xs text-slate-400">Gagnez des points sur vos achats, ventes, locations, pièces, livraisons et entretiens. À utiliser en réduction d'abonnement, boost d'annonce ou historique véhicule.</p>
            </div>
            <div className="space-y-2">
              {fidelite.data?.transactions.map((t) => (
                <div key={t.id} className="card flex items-center justify-between p-3 text-sm">
                  <span className="text-slate-600">{t.reason}</span>
                  <span className={t.points >= 0 ? "font-semibold text-green-600" : "font-semibold text-red-500"}>{t.points >= 0 ? "+" : ""}{t.points}</span>
                </div>
              ))}
              {fidelite.data?.transactions.length === 0 && <p className="text-sm text-slate-500">Aucun point pour le moment.</p>}
            </div>
          </div>
        )}
        {tab === "coffre" && (
          <div className="space-y-4">
            <form
              className="card space-y-2 p-4"
              onSubmit={(e) => { e.preventDefault(); if (doc.title && doc.fileUrl) addDoc.mutate(doc as { category: "carte_grise"; title: string; fileUrl: string }); }}
            >
              <p className="font-semibold text-slate-800">Ajouter un document</p>
              <p className="text-xs text-slate-500">Cartes grises, factures, contrôles techniques, contrats, assurances — stockés dans votre espace sécurisé.</p>
              <div className="flex flex-wrap gap-2">
                <select className="input max-w-[180px]" value={doc.category} onChange={(e) => setDoc({ ...doc, category: e.target.value })}>
                  <option value="carte_grise">Carte grise</option>
                  <option value="facture">Facture</option>
                  <option value="controle_technique">Contrôle technique</option>
                  <option value="contrat">Contrat</option>
                  <option value="assurance">Assurance</option>
                  <option value="autre">Autre</option>
                </select>
                <input className="input max-w-xs" placeholder="Titre" value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
              </div>
              <FileUpload
                label="Ajouter le fichier (photo, PDF)"
                accept="image/*,.pdf,.doc,.docx"
                multiple={false}
                maxFiles={1}
                onUploaded={(files) => {
                  if (files.length > 0) setDoc({ ...doc, fileUrl: files[0].url });
                }}
                iaAnalysis
              />
              {doc.fileUrl && <p className="text-xs text-green-600">Fichier ajouté</p>}
              <button className="btn-primary !text-sm">Enregistrer</button>
            </form>
            {coffre.data?.map((d) => (
              <div key={d.id} className="card flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{d.title}</p>
                  <p className="text-xs text-slate-500">{d.category} · <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-gold-dark underline">ouvrir</a></p>
                </div>
                <button className="text-xs text-red-500 hover:underline" onClick={() => removeDoc.mutate({ id: d.id })}>Supprimer</button>
              </div>
            ))}
            {coffre.data?.length === 0 && <p className="text-sm text-slate-500">Coffre-fort vide.</p>}
          </div>
        )}
        {tab === "vehicules" && (
          <div className="space-y-4">
            <form
              className="card flex flex-wrap items-end gap-2 p-4"
              onSubmit={(e) => { e.preventDefault(); if (dossier.marque || dossier.immatriculation) createDossier.mutate(dossier); }}
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Ajouter un véhicule à mon carnet</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input className="input max-w-[140px]" placeholder="Marque" value={dossier.marque} onChange={(e) => setDossier({ ...dossier, marque: e.target.value })} />
                  <input className="input max-w-[140px]" placeholder="Modèle" value={dossier.modele} onChange={(e) => setDossier({ ...dossier, modele: e.target.value })} />
                  <input className="input max-w-[140px]" placeholder="Immatriculation" value={dossier.immatriculation} onChange={(e) => setDossier({ ...dossier, immatriculation: e.target.value })} />
                </div>
              </div>
              <button className="btn-primary !text-sm">Créer le dossier</button>
            </form>
            {dossiers.data?.map((d) => (
              <div key={d.id} className="card p-3 text-sm">
                <p className="font-semibold text-slate-800">{[d.marque, d.modele].filter(Boolean).join(" ") || "Véhicule"} {d.immatriculation ? `· ${d.immatriculation}` : ""}</p>
                <p className="text-xs text-slate-500">Carnet de santé numérique : achat, entretien, réparations, contrôle technique, photos, ventes.</p>
              </div>
            ))}
            {dossiers.data?.length === 0 && <p className="text-sm text-slate-500">Aucun véhicule dans votre carnet.</p>}
          </div>
        )}
        {tab === "notifications" && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-[#111] flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#D4AF37]" /> Notifications
            </h2>
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 text-center">
              <p className="text-sm font-bold text-[#111] mb-4">Accédez à votre centre de notifications complet.</p>
              <Link to="/notifications" className="inline-block rounded-xl bg-[#D4AF37] px-6 py-3 text-xs font-bold text-white">Ouvrir les notifications</Link>
            </div>
          </div>
        )}
        {tab === "rapports" && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mes rapports historiques</h2>
                <p className="mt-1 text-sm text-slate-500">Tous vos rapports véhicule achetés</p>
              </div>
              <Link to="/historique" className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white hover:bg-[#C5A028]">
                Acheter un rapport
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {DEMO_RAPPORTS.map((r) => (
                <div key={r.id} onClick={() => navigate(`/historique?plaque=${r.plaque}`)} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 cursor-pointer hover:border-[#D4AF37] hover:shadow-md transition">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{r.plaque}</p>
                    <p className="text-[10px] text-slate-400">VIN : {r.vinPartiel}</p>
                    <p className="text-[10px] text-slate-500">{r.type} · {r.prix} · {r.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700">{r.statut}</span>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/historique?plaque=${r.plaque}`); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-[#111] hover:bg-slate-50">Voir</button>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/historique?plaque=${r.plaque}&pdf=1`); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-[#111] hover:bg-slate-50">PDF</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-slate-400 italic">Vos rapports sont aussi disponibles dans : Messagerie interne, Centre documents {'>'} Véhicules {'>'} Historiques.</p>
          </div>
        )}
        {tab === "services" && (
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tous les services MKA.P-MS</h2>
            <p className="mt-1 text-sm text-slate-500">Accédez à tous nos services depuis votre compte</p>
            <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {ALL_SERVICES.map((s) => (
                <Link key={s.to} to={s.to} className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                  <span className="text-3xl">{s.emoji}</span>
                  <h3 className="text-xs font-bold text-[#111]">{s.label}</h3>
                  <p className="text-[10px] text-slate-500 leading-tight">{s.desc}</p>
                </Link>
              ))}
              {/* Bloc Publicités — dans la grille comme les autres */}
              {isAdmin(user.role) && (
                <button onClick={() => { setTab("publicites"); window.scrollTo(0, 0); }} className="group flex flex-col items-center gap-2 rounded-xl border-2 border-[#D4AF37]/40 bg-[#FFFDF5] p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                  <span className="text-3xl">📢</span>
                  <h3 className="text-xs font-bold text-[#111]">Publicités</h3>
                  <p className="text-[10px] text-slate-500 leading-tight">Emplacements & tarifs pub</p>
                </button>
              )}
            </div>
          </div>
        )}
        {tab === "profil" && <ProfilForm />}
      </div>
    </div>
  );
}

function ProfilForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "",
    city: "",
    companyName: user?.companyName || "",
  });
  const [profilPhoto, setProfilPhoto] = useState<string | null>(null);
  const profilPhotoRef = useRef<HTMLInputElement>(null);
  const update = trpc.auth.updateProfile.useMutation({ onSuccess: (u) => setUser(u as any) });

  function handleProfilPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="card max-w-lg space-y-4 p-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => profilPhotoRef.current?.click()}
          className="relative shrink-0 h-20 w-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#111] flex items-center justify-center overflow-hidden border-2 border-[#D4AF37] hover:opacity-90 transition active:scale-95 group"
        >
          {profilPhoto ? (
            <img src={profilPhoto} alt="Photo profil" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl font-black text-white">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input ref={profilPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilPhoto} />
        <div>
          <p className="text-sm font-bold text-[#111]">Photo de profil</p>
          <button onClick={() => profilPhotoRef.current?.click()} className="text-xs text-[#D4AF37] font-semibold hover:underline">Changer la photo</button>
        </div>
      </div>
      <div><label className="label">Nom</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
      <div><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
      <div><label className="label">Ville</label><input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
      <div><label className="label">Société (si pro)</label><input className="input" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} /></div>
      <button className="btn-primary" disabled={update.isPending} onClick={() => update.mutate(form)}>
        {update.isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {update.isSuccess && <p className="text-sm text-green-600">Profil mis à jour.</p>}
    </div>
  );
}
