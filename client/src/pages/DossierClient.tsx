import { useState } from "react";
import { Link } from "react-router-dom";
import { imprimerFeuille } from "../lib/documents";
import { getAnnonceUrl } from "../lib/annonceUrl";
import {
  ChevronLeft, User, Car, ShoppingCart, Tag, FileText, Calendar,
  Key, CreditCard, Heart, MessageSquare,
  Download, Eye, Wrench, X, CheckCircle, Printer,
} from "lucide-react";
import { trpc } from "../lib/trpc";

/**
 * Mon dossier (/dossier-client) — vue centralisée réelle.
 *
 * Avant ce lot : chaque onglet (achetés, vendus, devis, réservations,
 * locations, paiements, favoris, messages) affichait des tableaux
 * entièrement inventés en dur (véhicules, historiques d'entretien,
 * documents marqués « Disponible », messages, paiements), sans un seul
 * appel serveur dans tout le fichier. Chaque onglet reprend maintenant
 * exactement le moteur réel déjà utilisé par l'écran jumeau honnête
 * correspondant sous client/src/pages/utilisateurs/ (HistoriqueAchats,
 * MesVehicules, HistoriqueLocations, FacturesUtilisateur,
 * HistoriqueEntretiens, MessagerieGlobale, CentreFavorisUtilisateur) et
 * server/routers/devis.ts — jamais un second registre inventé pour cette
 * page. Ce qui n'a aucune donnée réelle correspondante (liste de documents
 * archivés par véhicule, annulation de réservation) a été retiré plutôt
 * que remplacé par une fabrication.
 */

type DossierTab = "achetes" | "vendus" | "devis" | "reservations" | "locations" | "paiements" | "favoris" | "messages";

const TABS: { id: DossierTab; label: string; icon: typeof Car }[] = [
  { id: "achetes", label: "Achetés", icon: ShoppingCart },
  { id: "vendus", label: "Vendus", icon: Tag },
  { id: "devis", label: "Devis", icon: FileText },
  { id: "reservations", label: "Réservations", icon: Calendar },
  { id: "locations", label: "Locations", icon: Key },
  { id: "paiements", label: "Paiements", icon: CreditCard },
  { id: "favoris", label: "Favoris", icon: Heart },
  { id: "messages", label: "Messages", icon: MessageSquare },
];

const PAIEMENT_STATUT: Record<string, { label: string; color: string }> = {
  paid: { label: "Payé", color: "text-green-600 bg-green-50" },
  pending: { label: "En attente", color: "text-amber-600 bg-amber-50" },
  failed: { label: "Échoué", color: "text-red-600 bg-red-50" },
  refunded: { label: "Remboursé", color: "text-slate-600 bg-slate-100" },
  cancelled: { label: "Annulé", color: "text-slate-600 bg-slate-100" },
};

const BOOKING_STATUT: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  rejected: "Refusée",
  cancelled: "Annulée",
  completed: "Terminée",
};

const BOOKING_TYPE_LABEL: Record<string, string> = {
  test_drive: "Essai routier",
  purchase_visit: "Visite d'achat",
  rental: "Location",
};

const RDV_STATUT: Record<string, string> = {
  en_attente: "En attente",
  confirme: "Confirmé",
  honore: "Honoré",
  annule_client: "Annulé par vous",
  annule_garage: "Annulé par le garage",
  no_show: "Non présenté",
};

const DEVIS_STATUT: Record<string, string> = {
  nouveau: "Nouveau",
  recu_par_garages: "Envoyé aux garages",
  offres_recues: "Offres reçues",
  accepte: "Accepté",
  refuse: "Refusé",
  annule: "Annulé",
  termine: "Terminé",
};

const ANNONCE_STATUT: Record<string, string> = {
  brouillon: "Brouillon",
  en_validation: "En validation",
  publiee: "En ligne",
  vendue: "Vendue",
  louee: "Louée",
  archivee: "Archivée",
  refusee: "Refusée",
  expiree: "Expirée",
};

type Achat = { id: number; vehicleId: number | null; amount: string; currency: string; status: string; createdAt: string | Date };
type Intervention = { id: number; garageId: number; annonceId: number | null; motif: string | null; status: string; dateHeure: string | Date };

export default function DossierClient() {
  const [tab, setTab] = useState<DossierTab>("achetes");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const paiementsQuery = trpc.reservations.mesPaiements.useQuery();
  const paiements = paiementsQuery.data ?? [];
  const achats = paiements.filter((p) => p.type === "vehicle_purchase");

  const annoncesQuery = trpc.annonces.mine.useQuery();
  const mesAnnonces = annoncesQuery.data ?? [];
  const ventes = mesAnnonces.filter((a) => a.status === "vendue");

  const devisQuery = trpc.devis.mine.useQuery();
  const devis = devisQuery.data ?? [];

  const reservationsQuery = trpc.reservations.mine.useQuery();
  const bookings = reservationsQuery.data ?? [];
  const reservationsAchat = bookings.filter((b) => b.type !== "rental");
  const locations = bookings.filter((b) => b.type === "rental");

  const interventionsQuery = trpc.garages.myInterventions.useQuery();
  const interventions: Intervention[] = interventionsQuery.data ?? [];
  const interventionsDuVehicule = (vehicleId: number | null) =>
    vehicleId ? interventions.filter((r) => r.annonceId === vehicleId) : [];

  const favorisQuery = trpc.favoris.mine.useQuery();
  const favorisToggle = trpc.favoris.toggle.useMutation({ onSuccess: () => favorisQuery.refetch() });
  const favoris = favorisQuery.data ?? [];

  const threadsQuery = trpc.messages.listThreads.useQuery();
  const threads = threadsQuery.data ?? [];

  // Modals
  const [modalHistorique, setModalHistorique] = useState<Achat | null>(null);
  const [modalEntretien, setModalEntretien] = useState<Achat | null>(null);
  const [reservationDetailId, setReservationDetailId] = useState<number | null>(null);

  function historiqueDuVehicule(achat: Achat) {
    const events = [
      {
        date: achat.createdAt,
        label: "Achat sur MKA.P-MS",
        detail: `${Number(achat.amount).toLocaleString("fr-FR")} ${achat.currency}`,
      },
      ...interventionsDuVehicule(achat.vehicleId).map((r) => ({
        date: r.dateHeure,
        label: r.motif ?? "Intervention garage",
        detail: `${RDV_STATUT[r.status] ?? r.status} — Garage #${r.garageId}`,
      })),
    ];
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  function imprimerHistorique(achat: Achat) {
    const events = historiqueDuVehicule(achat);
    const ok = imprimerFeuille({
      typeDocument: "rapport_historique",
      titre: "Historique du véhicule",
      reference: `ACH-${achat.id}`,
      sousTitre: `Véhicule #${achat.vehicleId ?? "?"}`,
      colonnes: [
        { cle: "date", titre: "Date" },
        { cle: "label", titre: "Événement" },
        { cle: "detail", titre: "Détail" },
      ],
      lignes: events.map((e) => ({
        date: new Date(e.date).toLocaleDateString("fr-FR"),
        label: e.label,
        detail: e.detail,
      })),
      mentions: ["MKA.P-MS — Auto Plus Africa. Historique réel issu de vos paiements et rendez-vous garage enregistrés sur la plateforme."],
      entiteLiee: achat.vehicleId ? { type: "annonce", id: achat.vehicleId } : undefined,
    });
    showToast(ok ? "Historique ouvert — enregistrable en PDF" : "Le navigateur a bloqué la fenêtre d'impression");
  }

  function imprimerCarnet(achat: Achat) {
    const rdvs = interventionsDuVehicule(achat.vehicleId);
    const ok = imprimerFeuille({
      typeDocument: "carnet_entretien",
      titre: "Carnet d'entretien",
      reference: `ACH-${achat.id}`,
      sousTitre: `Véhicule #${achat.vehicleId ?? "?"}`,
      colonnes: [
        { cle: "date", titre: "Date" },
        { cle: "motif", titre: "Intervention" },
        { cle: "garage", titre: "Garage" },
        { cle: "statut", titre: "Statut" },
      ],
      lignes: rdvs.map((r) => ({
        date: new Date(r.dateHeure).toLocaleDateString("fr-FR"),
        motif: r.motif ?? "Rendez-vous garage",
        garage: `#${r.garageId}`,
        statut: RDV_STATUT[r.status] ?? r.status,
      })),
      mentions: ["MKA.P-MS — Auto Plus Africa. Carnet issu des rendez-vous garage réellement enregistrés sur la plateforme."],
      entiteLiee: achat.vehicleId ? { type: "annonce", id: achat.vehicleId } : undefined,
    });
    showToast(rdvs.length === 0
      ? "Aucun rendez-vous garage enregistré pour ce véhicule — feuille ouverte tout de même"
      : ok ? "Carnet ouvert — enregistrable en PDF" : "Le navigateur a bloqué la fenêtre d'impression");
  }

  const Overlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-[#F5F3EF] grid place-items-center"><X size={16} /></button>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><User size={20} className="text-[#D4AF37]" /> Mon dossier</h1>
        <p className="mt-1 text-sm text-white/60">Tout votre historique MKA.P-MS centralisé</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count = {
            achetes: achats.length,
            vendus: ventes.length,
            devis: devis.length,
            reservations: reservationsAchat.length,
            locations: locations.length,
            paiements: paiements.length,
            favoris: favoris.length,
            messages: threads.length,
          }[t.id];
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {t.label} <span className="text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* Véhicules achetés — trpc.reservations.mesPaiements filtré vehicle_purchase */}
        {tab === "achetes" && (
          <>
            {paiementsQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}
            {achats.map((a) => {
              const s = PAIEMENT_STATUT[a.status] ?? PAIEMENT_STATUT.pending;
              return (
                <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <Link to={`/vehicule/${a.vehicleId}`} className="flex items-center gap-3 p-3 active:bg-[#F5F3EF] transition">
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100"><Car size={20} className="text-slate-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#111]">Véhicule #{a.vehicleId}</p>
                      <p className="text-xs text-slate-400">Acheté le {new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
                      <p className="text-sm font-bold text-[#D4AF37] mt-1">{Number(a.amount).toLocaleString("fr-FR")} {a.currency}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.color}`}>{s.label}</span>
                  </Link>
                  <div className="border-t border-[#F3F4F6] px-3 py-2 flex gap-3">
                    <button onClick={() => setModalHistorique(a)} className="text-[10px] font-bold text-[#D4AF37] flex items-center gap-1 active:scale-95 transition"><Eye size={10} /> Historique</button>
                    <Link to={`/vehicule/${a.vehicleId}`} className="text-[10px] font-bold text-slate-500 flex items-center gap-1 active:scale-95 transition"><FileText size={10} /> Fiche véhicule</Link>
                    <button onClick={() => setModalEntretien(a)} className="text-[10px] font-bold text-slate-500 flex items-center gap-1 active:scale-95 transition"><Wrench size={10} /> Entretien</button>
                  </div>
                </div>
              );
            })}
            {!paiementsQuery.isLoading && achats.length === 0 && (
              <div className="text-center py-8">
                <ShoppingCart size={32} className="mx-auto text-[#D4AF37]" />
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun achat pour le moment.</p>
              </div>
            )}
          </>
        )}

        {/* Véhicules vendus — trpc.annonces.mine filtré vendue */}
        {tab === "vendus" && (
          <>
            {annoncesQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}
            {ventes.map((v) => (
              <Link key={v.id} to={getAnnonceUrl(v.id, v.categorieAnnonce, v.vendeurType)} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100"><Car size={20} className="text-slate-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{[v.marque, v.modele].filter(Boolean).join(" ")}</p>
                  {v.plaque && <p className="text-xs text-slate-500">{v.plaque}</p>}
                  <p className="text-sm font-bold text-green-600 mt-1">{Number(v.prix).toLocaleString("fr-FR")} {v.devise}</p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 shrink-0">{ANNONCE_STATUT[v.status] ?? v.status}</span>
              </Link>
            ))}
            {!annoncesQuery.isLoading && ventes.length === 0 && (
              <div className="text-center py-8">
                <Tag size={32} className="mx-auto text-[#D4AF37]" />
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun véhicule vendu pour le moment.</p>
              </div>
            )}
          </>
        )}

        {/* Devis — trpc.devis.mine (server/routers/devis.ts, table devis_garage_requests) */}
        {tab === "devis" && (
          <>
            {devisQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}
            {devis.map((d) => (
              <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{d.typeIntervention}</p>
                    <p className="text-xs text-slate-500">{[d.vehiculeMarque, d.vehiculeModele].filter(Boolean).join(" ") || "Véhicule non précisé"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-700 shrink-0">{DEVIS_STATUT[d.status] ?? d.status}</span>
                </div>
              </div>
            ))}
            {!devisQuery.isLoading && devis.length === 0 && (
              <div className="text-center py-8">
                <FileText size={32} className="mx-auto text-[#D4AF37]" />
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune demande de devis pour le moment.</p>
                <Link to="/devis" className="mt-3 inline-block text-xs font-bold text-[#D4AF37] underline">Demander un devis</Link>
              </div>
            )}
          </>
        )}

        {/* Réservations (visite d'achat / essai routier) — trpc.reservations.mine */}
        {tab === "reservations" && (
          <>
            {reservationsQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}
            {reservationsAchat.map((r) => (
              <button key={r.id} onClick={() => setReservationDetailId(r.id)} className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98] transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111]">Véhicule #{r.vehicleId}</p>
                    <p className="text-xs text-slate-500">{BOOKING_TYPE_LABEL[r.type] ?? r.type}</p>
                    {r.cautionAmount && <p className="text-[10px] text-slate-400 mt-0.5">Acompte : {Number(r.cautionAmount).toLocaleString("fr-FR")} {r.cautionCurrency ?? "EUR"}</p>}
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">{BOOKING_STATUT[r.status] ?? r.status}</span>
                </div>
              </button>
            ))}
            {!reservationsQuery.isLoading && reservationsAchat.length === 0 && (
              <div className="text-center py-8">
                <Calendar size={32} className="mx-auto text-[#D4AF37]" />
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune réservation pour le moment.</p>
              </div>
            )}
          </>
        )}

        {/* Locations — trpc.reservations.mine filtré rental */}
        {tab === "locations" && (
          <>
            {reservationsQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}
            {locations.map((l) => (
              <Link key={l.id} to={`/vehicule/${l.vehicleId}`} className="block rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#111]">Véhicule #{l.vehicleId}</p>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600">{BOOKING_STATUT[l.status] ?? l.status}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Du {new Date(l.startDate).toLocaleDateString("fr-FR")}{l.endDate ? ` au ${new Date(l.endDate).toLocaleDateString("fr-FR")}` : ""}
                </p>
                {l.cautionAmount && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Caution : {Number(l.cautionAmount).toLocaleString("fr-FR")} {l.cautionCurrency ?? "EUR"} — {l.cautionStatus}</p>
                )}
              </Link>
            ))}
            {!reservationsQuery.isLoading && locations.length === 0 && (
              <div className="text-center py-8">
                <Key size={32} className="mx-auto text-[#D4AF37]" />
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune location pour le moment.</p>
              </div>
            )}
          </>
        )}

        {/* Paiements — trpc.reservations.mesPaiements (tous types) */}
        {tab === "paiements" && (
          <>
            {paiementsQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}
            {paiements.map((p) => {
              const s = PAIEMENT_STATUT[p.status] ?? PAIEMENT_STATUT.pending;
              return (
                <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{p.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#111]">{Number(p.amount).toLocaleString("fr-FR")} {p.currency}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${s.color}`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
            {!paiementsQuery.isLoading && paiements.length === 0 && (
              <div className="text-center py-8">
                <CreditCard size={32} className="mx-auto text-[#D4AF37]" />
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun paiement pour le moment.</p>
              </div>
            )}
          </>
        )}

        {/* Favoris — trpc.favoris.mine/toggle */}
        {tab === "favoris" && (
          <>
            {favorisQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}
            {favoris.map(({ annonce }) => (
              <div key={annonce.id} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3">
                <Link to={`/vehicule/${annonce.id}`} className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
                  {annonce.photoPrincipale ? <img src={annonce.photoPrincipale} alt="" className="h-full w-full object-cover" /> : <Heart size={20} className="text-slate-400" />}
                </Link>
                <Link to={`/vehicule/${annonce.id}`} className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#111] truncate">{[annonce.marque, annonce.modele].filter(Boolean).join(" ") || "Véhicule"}</h3>
                  <p className="text-[10px] text-[#6B7280]">{annonce.prix ? `${Number(annonce.prix).toLocaleString("fr-FR")} €` : ""}</p>
                </Link>
                <button
                  onClick={() => favorisToggle.mutate({ annonceId: annonce.id })}
                  disabled={favorisToggle.isPending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#D4AF37] disabled:opacity-50"
                >
                  <Heart size={14} className="fill-[#D4AF37]" />
                </button>
              </div>
            ))}
            {!favorisQuery.isLoading && favoris.length === 0 && (
              <div className="text-center py-6">
                <Heart size={32} className="mx-auto text-[#D4AF37]" />
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun favori pour le moment.</p>
                <Link to="/favoris" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Voir mes favoris</Link>
              </div>
            )}
          </>
        )}

        {/* Messages — trpc.messages.listThreads */}
        {tab === "messages" && (
          <>
            {threadsQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}
            {threads.map((t) => (
              <Link key={t.id} to={`/messagerie?thread=${t.id}`} className={`flex items-center gap-3 rounded-xl bg-white border p-3 ${t.unread > 0 ? "border-[#D4AF37]/40" : "border-[#E5E7EB]"}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-bold text-sm">
                  {t.other.nom?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#111] truncate">{t.other.nom ?? "Utilisateur"}</p>
                    {t.unread > 0 && <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />}
                  </div>
                  {t.annonceTitre && <p className="text-[10px] text-[#9CA3AF] truncate">{t.annonceTitre}</p>}
                  {t.lastMessage && <p className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessage}</p>}
                </div>
                {t.lastMessageAt && <span className="text-[10px] text-[#9CA3AF] shrink-0">{new Date(t.lastMessageAt).toLocaleDateString("fr-FR")}</span>}
              </Link>
            ))}
            {!threadsQuery.isLoading && threads.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare size={32} className="mx-auto text-[#D4AF37]" />
                <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune conversation pour le moment.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Historique véhicule acheté (achat réel + rendez-vous garage réels) */}
      {modalHistorique && (
        <Overlay onClose={() => setModalHistorique(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111]">Historique</h2>
            <p className="text-xs text-slate-500 mb-4">Véhicule #{modalHistorique.vehicleId}</p>
            <div className="space-y-3">
              {historiqueDuVehicule(modalHistorique).map((h, i, arr) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-[#D4AF37] shrink-0 mt-1" />
                    {i < arr.length - 1 && <div className="flex-1 w-px bg-[#E5E7EB]" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-bold text-[#111]">{h.label}</p>
                    <p className="text-[10px] text-slate-500">{h.detail}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{new Date(h.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => imprimerHistorique(modalHistorique)} className="w-full mt-4 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Download size={14} /> Exporter l'historique</button>
          </div>
        </Overlay>
      )}

      {/* Entretien véhicule acheté — trpc.garages.myInterventions filtré sur ce véhicule */}
      {modalEntretien && (
        <Overlay onClose={() => setModalEntretien(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111]">Entretien</h2>
            <p className="text-xs text-slate-500 mb-4">Véhicule #{modalEntretien.vehicleId}</p>
            <div className="space-y-2">
              {interventionsDuVehicule(modalEntretien.vehicleId).map((r) => (
                <div key={r.id} className="rounded-xl bg-[#F5F3EF] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#111]">{r.motif ?? "Rendez-vous garage"}</p>
                      <p className="text-[10px] text-slate-500">Garage #{r.garageId} · {new Date(r.dateHeure).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold bg-slate-100 text-slate-600">{RDV_STATUT[r.status] ?? r.status}</span>
                  </div>
                </div>
              ))}
              {interventionsDuVehicule(modalEntretien.vehicleId).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Aucun rendez-vous garage enregistré pour ce véhicule.</p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Link to="/reparer" onClick={() => setModalEntretien(null)} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Wrench size={14} /> Prendre RDV garage</Link>
              <button onClick={() => imprimerCarnet(modalEntretien)} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Download size={14} /> Export PDF</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Détail réservation — trpc.reservations.detail + paiement réel de l'acompte */}
      {reservationDetailId !== null && (
        <ReservationDetailModal id={reservationDetailId} onClose={() => setReservationDetailId(null)} onToast={showToast} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[90%]">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400 shrink-0" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Fiche détaillée d'une réservation — trpc.reservations.detail (booking +
 * annonce + paiements réels) et trpc.reservations.payCaution pour régler un
 * acompte réellement en attente. Aucune action « Annuler » : le moteur de
 * réservation n'expose aucune mutation d'annulation, en inventer une aurait
 * affiché une confirmation sans effet réel.
 */
function ReservationDetailModal({ id, onClose, onToast }: { id: number; onClose: () => void; onToast: (msg: string) => void }) {
  const detail = trpc.reservations.detail.useQuery({ id });
  const payCaution = trpc.reservations.payCaution.useMutation({
    onSuccess: (r) => {
      if (r.url?.startsWith("http")) window.location.href = r.url;
      else if (r.url) { onClose(); }
    },
    onError: (e) => onToast(e.message),
  });
  const booking = detail.data?.booking;
  const annonce = detail.data?.annonce;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 pt-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-[#F5F3EF] grid place-items-center"><X size={16} /></button>
        {detail.isLoading && <p className="py-8 text-center text-sm text-slate-400">Chargement…</p>}
        {!detail.isLoading && booking && (
          <>
            <h2 className="text-lg font-black text-[#111]">{annonce ? [annonce.marque, annonce.modele].filter(Boolean).join(" ") : `Véhicule #${booking.vehicleId}`}</h2>
            <p className="text-xs text-slate-500 mb-4">{BOOKING_TYPE_LABEL[booking.type] ?? booking.type} — Réservation #{booking.id}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Statut</p><p className="text-sm font-black text-[#111]">{BOOKING_STATUT[booking.status] ?? booking.status}</p></div>
              {booking.cautionAmount && (
                <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Acompte</p><p className="text-sm font-black text-[#D4AF37]">{Number(booking.cautionAmount).toLocaleString("fr-FR")} {booking.cautionCurrency ?? "EUR"}</p></div>
              )}
            </div>
            <div className="flex gap-2">
              {booking.cautionStatus === "pending" && (
                <button
                  onClick={() => payCaution.mutate({ bookingId: booking.id })}
                  disabled={payCaution.isPending}
                  className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {payCaution.isPending ? "Ouverture…" : "Régler l'acompte"}
                </button>
              )}
              <Link to={`/vehicule/${booking.vehicleId}`} onClick={onClose} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] text-center flex items-center justify-center gap-1"><Printer size={14} /> Voir le véhicule</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
