import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { isAdmin, isPro, ROLE_LABELS } from "@shared/roles";
import type { UserRole } from "@shared/roles";
import FileUpload from "../components/FileUpload";

type Tab = "annonces" | "toutes-annonces" | "publicites" | "favoris" | "recherches" | "reservations" | "devis" | "abonnements" | "litiges" | "fidelite" | "coffre" | "vehicules" | "rapports" | "services" | "profil";

const DEMO_RAPPORTS = [
  { id: 1, plaque: "AB-123-CD", vinPartiel: "VF1KR****567890", type: "Rapport Complet", prix: "7,99 \u20ac", date: "28/05/2024", statut: "Disponible" },
  { id: 2, plaque: "EF-456-GH", vinPartiel: "WBA8E****123456", type: "Rapport Express", prix: "4,99 \u20ac", date: "15/04/2024", statut: "Disponible" },
];

const ALL_SERVICES = [
  { label: "Acheter un v\u00e9hicule", to: "/acheter", emoji: "\ud83d\ude97", desc: "Parcourez les annonces et trouvez votre v\u00e9hicule id\u00e9al" },
  { label: "Vendre un v\u00e9hicule", to: "/vendre", emoji: "\ud83d\udcb0", desc: "D\u00e9posez une annonce et vendez rapidement" },
  { label: "Location", to: "/louer", emoji: "\ud83d\udd11", desc: "Louez un v\u00e9hicule en toute confiance" },
  { label: "Garage & R\u00e9paration", to: "/garages", emoji: "\ud83d\udd27", desc: "Trouvez un garage et demandez un devis" },
  { label: "D\u00e9pannage", to: "/depannage", emoji: "\ud83d\ude91", desc: "Assistance routi\u00e8re 24h/24, 7j/7" },
  { label: "Carte Grise", to: "/carte-grise", emoji: "\ud83d\udcc4", desc: "D\u00e9marches carte grise en ligne" },
  { label: "Livraison", to: "/livraison", emoji: "\ud83d\ude9a", desc: "Livraison France & Afrique" },
  { label: "Historique V\u00e9hicule", to: "/historique", emoji: "\ud83d\udcca", desc: "Rapport complet kilom\u00e9trage, entretien, CT" },
  { label: "Pi\u00e8ces Auto", to: "/pieces", emoji: "\u2699\ufe0f", desc: "Catalogue pi\u00e8ces d\u00e9tach\u00e9es" },
  { label: "Moto & Scooter", to: "/acheter?type=moto", emoji: "\ud83c\udfcd\ufe0f", desc: "V\u00e9hicules deux roues" },
  { label: "Financement", to: "/abonnements", emoji: "\ud83c\udfe6", desc: "Solutions de financement auto" },
  { label: "Support", to: "/aide", emoji: "\ud83d\udcde", desc: "Aide et assistance 7j/7" },
];

const TIER_LABELS: Record<string, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum", elite: "Elite" };

export default function Compte() {
  const { format: formatPrice } = useCurrency();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("annonces");

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
    ["recherches", "Mes alertes"],
    ["reservations", "Réservations"],
    ["devis", "Mes devis"],
    ["abonnements", "Abonnements"],
    ["litiges", "Mes litiges"],
    ["fidelite", "Fidélité"],
    ["coffre", "Coffre-fort"],
    ["vehicules", "Mes véhicules"],
    ["rapports", "Mes rapports"],
    ["services", "Tous les services"],
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

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Bonjour, {user.name?.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">
            {ROLE_LABELS[(user.role as UserRole)] || user.role}
            {user.email ? ` · ${user.email}` : ""}
          </p>
          {(user as { reference?: string | null }).reference && (
            <p className="text-xs font-medium text-slate-400">
              Réf. compte : {(user as { reference?: string | null }).reference}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isPro(user.role) && <Link to="/garage-plus" className="btn-outline">Espace Garage+</Link>}
          {isAdmin(user.role) && <Link to="/admin" className="btn-primary">Back-office</Link>}
          <button className="btn-outline" onClick={() => { logout(); navigate("/"); }}>Déconnexion</button>
        </div>
      </div>

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
            onClick={() => setTab(v)}
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
                  <div key={d.id} className="card p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{d.entreprise} <span className="text-xs text-slate-400">({d.id})</span></p>
                        <p className="text-xs text-slate-500">{d.type} · Emplacement {d.emplacement}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.status === "approuvée" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{d.status === "approuvée" ? "Approuvée" : "En attente"}</span>
                    </div>
                    {d.status === "en_attente" && (
                      <div className="mt-2 flex gap-2">
                        <button className="rounded-lg bg-green-600 px-3 py-1 text-xs font-bold text-white">Approuver</button>
                        <button className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white">Refuser</button>
                      </div>
                    )}
                  </div>
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
              <div key={r.id} className="card p-4 text-sm">
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
              <div key={d.id} className="card p-4 text-sm">
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
              <div key={s.id} className="card p-4 text-sm">
                <p className="font-semibold text-slate-800">{s.planCode}</p>
                <p className="text-slate-500">{s.status} {s.amount ? `· ${s.amount} €` : ""}</p>
              </div>
            ))}
            {abos.data?.length === 0 && <p className="text-sm text-slate-500">Aucun abonnement actif.</p>}

            {/* Abonnements Publicité — visible PDG/Directeur */}
            {isAdmin(user.role) && (
              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="text-sm font-bold text-slate-800 mb-3">Abonnements Publicité</p>
                {[
                  { code: "PUB-ACCUEIL-1", label: "Publicité Accueil — Carrousel #1", cases: 5, tarif: "50€/jour", status: "actif" },
                  { code: "PUB-ACCUEIL-2", label: "Publicité Accueil — Carrousel #2", cases: 5, tarif: "40€/jour", status: "actif" },
                  { code: "PUB-PREMIUM", label: "Publicité Premium — Carrousel #3", cases: 5, tarif: "80€/jour", status: "actif" },
                  { code: "PUB-PRODUIT", label: "Publicité Page Produit", cases: 4, tarif: "30€/jour", status: "actif" },
                  { code: "PUB-RECHERCHE", label: "Publicité Page Recherche", cases: 3, tarif: "40€/jour", status: "inactif" },
                  { code: "PUB-RESULTATS", label: "Publicité Entre Annonces", cases: 4, tarif: "35€/jour", status: "inactif" },
                ].map((p) => (
                  <Link key={p.code} to="/demande-publicite" className="card flex items-center justify-between p-4 mb-2 hover:bg-slate-50 transition cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{p.label}</p>
                      <p className="text-xs text-slate-400">{p.code} · {p.cases} cases · {p.tarif}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "actif" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
                  </Link>
                ))}
              </div>
            )}
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
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{r.plaque}</p>
                    <p className="text-[10px] text-slate-400">VIN : {r.vinPartiel}</p>
                    <p className="text-[10px] text-slate-500">{r.type} · {r.prix} · {r.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700">{r.statut}</span>
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-[#111] hover:bg-slate-50">Voir</button>
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-[#111] hover:bg-slate-50">PDF</button>
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
            </div>

            {/* Emplacements publicitaires détaillés */}
            {isAdmin(user.role) && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h3 className="text-base font-bold text-slate-900">Emplacements Publicités</h3>
                <p className="mt-1 text-xs text-slate-500">Détails de chaque emplacement publicitaire sur la plateforme. Cliquez pour gérer.</p>
                <div className="mt-4 space-y-3">
                  {[
                    { id: 1, name: "Accueil — Carrousel #1 (entre annonces)", cases: 5, occupees: 3, tarif: "50€/jour · 300€/semaine · 900€/mois", desc: "Situé entre les annonces Professionnels et Particuliers. Très visible." },
                    { id: 2, name: "Accueil — Carrousel #2 (après location)", cases: 5, occupees: 1, tarif: "40€/jour · 250€/semaine · 700€/mois", desc: "Après la section Location. Public mixte acheteurs/loueurs." },
                    { id: 3, name: "Accueil — Carrousel #3 Premium (fin de page)", cases: 5, occupees: 2, tarif: "80€/jour · 500€/semaine · 1500€/mois", desc: "Section dorée premium en bas de page. Haute conversion." },
                    { id: 4, name: "Page Produit — Carrousel bas de page", cases: 4, occupees: 4, tarif: "30€/jour · 180€/semaine · 500€/mois", desc: "Visible sous chaque fiche véhicule. Public qualifié acheteur." },
                    { id: 5, name: "Page Recherche — Sidebar droite", cases: 3, occupees: 0, tarif: "40€/jour · 250€/semaine · 700€/mois", desc: "Sidebar à droite des résultats de recherche." },
                    { id: 6, name: "Page Résultats — Entre les annonces", cases: 4, occupees: 0, tarif: "35€/jour · 200€/semaine · 600€/mois", desc: "Inséré entre les annonces dans les résultats. Natif et discret." },
                  ].map((emp) => (
                    <Link key={emp.id} to="/demande-publicite" className="card block p-4 hover:bg-slate-50 transition cursor-pointer">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">#{emp.id} — {emp.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${emp.occupees > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{emp.occupees > 0 ? "Actif" : "Inactif"}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{emp.desc}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex gap-1">
                          {Array.from({ length: emp.cases }).map((_, i) => (
                            <div key={i} className={`h-3 w-8 rounded ${i < emp.occupees ? "bg-[#D4AF37]" : "bg-slate-200"}`} />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400">{emp.occupees}/{emp.cases} cases · {emp.tarif}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
  const update = trpc.auth.updateProfile.useMutation({ onSuccess: (u) => setUser(u as any) });
  return (
    <div className="card max-w-lg space-y-4 p-6">
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
