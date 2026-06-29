import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, User, Car, ShoppingCart, Tag, FileText, Calendar,
  Key, CreditCard, Heart, MessageSquare, Clock,
  Download, Eye, Wrench, X, CheckCircle, Printer, Phone, Mail
} from "lucide-react";
import { DocumentView, buildDevisData, buildFactureData, buildContratData } from "../components/DocumentPDF";

type DossierTab = "achetes" | "vendus" | "devis" | "reservations" | "locations" | "paiements" | "favoris" | "messages";

const TABS: { id: DossierTab; label: string; icon: typeof Car; count: number }[] = [
  { id: "achetes", label: "Achetes", icon: ShoppingCart, count: 2 },
  { id: "vendus", label: "Vendus", icon: Tag, count: 1 },
  { id: "devis", label: "Devis", icon: FileText, count: 3 },
  { id: "reservations", label: "Reservations", icon: Calendar, count: 1 },
  { id: "locations", label: "Locations", icon: Key, count: 2 },
  { id: "paiements", label: "Paiements", icon: CreditCard, count: 5 },
  { id: "favoris", label: "Favoris", icon: Heart, count: 8 },
  { id: "messages", label: "Messages", icon: MessageSquare, count: 12 },
];

const ACHETES = [
  { id: 1, nom: "Peugeot 3008 GT Hybrid", prix: "28 500 EUR", date: "15/03/2024", vendeur: "Pro Vente Paris", plaque: "AB-123-CD", km: "15 000 km", photo: "/categories/loc_suv.jpg",
    historique: [
      { date: "15/03/2024", event: "Achat sur MKA.P-MS", detail: "Achat auprès de Pro Vente Paris — 28 500 EUR" },
      { date: "20/03/2024", event: "Carte grise mise à jour", detail: "Nouvelle immatriculation AB-123-CD" },
      { date: "10/04/2024", event: "Première révision", detail: "Garage Auto Express — vidange + filtres" },
      { date: "25/05/2024", event: "Contrôle technique", detail: "Résultat : favorable sans contre-visite" },
    ],
    documents: [
      { nom: "Facture d'achat", type: "PDF", date: "15/03/2024", statut: "Disponible" },
      { nom: "Carte grise", type: "PDF", date: "20/03/2024", statut: "Disponible" },
      { nom: "Contrôle technique", type: "PDF", date: "25/05/2024", statut: "Disponible" },
      { nom: "Attestation assurance", type: "PDF", date: "01/04/2024", statut: "Disponible" },
    ],
    entretiens: [
      { date: "10/04/2024", type: "Révision complète", garage: "Garage Auto Express", montant: "350 EUR", statut: "Terminé" },
      { date: "25/05/2024", type: "Contrôle technique", garage: "CT Auto 93", montant: "75 EUR", statut: "Terminé" },
      { date: "15/08/2024", type: "Changement plaquettes", garage: "Garage Premium", montant: "280 EUR", statut: "Planifié" },
    ],
  },
  { id: 2, nom: "Renault Clio V TCe", prix: "18 500 EUR", date: "10/01/2024", vendeur: "Particulier", plaque: "EF-456-GH", km: "5 000 km", photo: "/categories/loc_citadine.jpg",
    historique: [
      { date: "10/01/2024", event: "Achat sur MKA.P-MS", detail: "Achat auprès d'un particulier — 18 500 EUR" },
      { date: "15/01/2024", event: "Carte grise mise à jour", detail: "Nouvelle immatriculation EF-456-GH" },
    ],
    documents: [
      { nom: "Facture d'achat", type: "PDF", date: "10/01/2024", statut: "Disponible" },
      { nom: "Carte grise", type: "PDF", date: "15/01/2024", statut: "Disponible" },
    ],
    entretiens: [
      { date: "15/06/2024", type: "Première révision", garage: "Garage Auto Express", montant: "220 EUR", statut: "Planifié" },
    ],
  },
];

const VENDUS = [
  { id: 1, nom: "Citroen C3 Aircross", prix: "14 200 EUR", date: "05/02/2024", acheteur: "Particulier via MKA.P-MS", plaque: "IJ-789-KL", photo: "/categories/loc_suv.jpg" },
];

const DEVIS_LIST = [
  { id: 1, type: "Revision complete", garage: "Garage Auto Express", montant: "350 EUR", date: "20/05/2024", statut: "Accepte", vehicule: "Peugeot 3008 GT", tel: "01 42 33 44 55", email: "contact@autoexpress.fr" },
  { id: 2, type: "Changement freins AV", garage: "Garage Premium Motors", montant: "280 EUR", date: "15/04/2024", statut: "En attente", vehicule: "Peugeot 3008 GT", tel: "01 55 66 77 88", email: "info@premiummotors.fr" },
  { id: 3, type: "Pneus hiver x4", garage: "Garage Auto Express", montant: "520 EUR", date: "01/11/2023", statut: "Termine", vehicule: "Renault Clio V", tel: "01 42 33 44 55", email: "contact@autoexpress.fr" },
];

const RESERVATIONS = [
  { id: 1, vehicule: "BMW Serie 5 530e", type: "Achat", acompte: "500 EUR", date: "28/05/2024", statut: "Active", vendeur: "MKA.P-MS Officiel", ref: "RES-2024-0042" },
];

const LOCATIONS_LIST = [
  { id: 1, vehicule: "Mercedes Classe E Break", duree: "15/03 au 15/04/2024", prix: "1 350 EUR", statut: "Terminee", agence: "MKA.P-MS Location Paris", ref: "LOC-2024-0018" },
  { id: 2, vehicule: "Peugeot 208", duree: "01/06 au 07/06/2024", prix: "196 EUR", statut: "En cours", agence: "MKA.P-MS Location Lyon", ref: "LOC-2024-0034" },
];

const PAIEMENTS = [
  { id: 1, objet: "Achat Peugeot 3008 GT", montant: "28 500 EUR", date: "15/03/2024", methode: "Virement", statut: "Paye", ref: "PAY-2024-0001" },
  { id: 2, objet: "Location Mercedes Classe E", montant: "1 350 EUR", date: "15/03/2024", methode: "CB", statut: "Paye", ref: "PAY-2024-0002" },
  { id: 3, objet: "Revision Garage Auto Express", montant: "350 EUR", date: "20/05/2024", methode: "CB", statut: "Paye", ref: "PAY-2024-0003" },
  { id: 4, objet: "Abonnement Pro Premium", montant: "89 EUR/mois", date: "01/06/2024", methode: "CB", statut: "Actif", ref: "PAY-2024-0004" },
  { id: 5, objet: "Acompte BMW Serie 5", montant: "500 EUR", date: "28/05/2024", methode: "CB", statut: "Reserve", ref: "PAY-2024-0005" },
];

const MESSAGES_LIST = [
  { id: 1, de: "Garage Auto Express", objet: "Votre revision est terminee", date: "Il y a 2h", lu: false },
  { id: 2, de: "Pro Vente Paris", objet: "Documents de vente disponibles", date: "Hier", lu: false },
  { id: 3, de: "MKA.P-MS Location", objet: "Rappel: retour vehicule demain", date: "Hier", lu: true },
  { id: 4, de: "Support MKA.P-MS", objet: "Bienvenue sur la plateforme", date: "Il y a 3 jours", lu: true },
];

export default function DossierClient() {
  const [tab, setTab] = useState<DossierTab>("achetes");
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Modals
  const [modalHistorique, setModalHistorique] = useState<typeof ACHETES[0] | null>(null);
  const [modalDocuments, setModalDocuments] = useState<typeof ACHETES[0] | null>(null);
  const [modalEntretien, setModalEntretien] = useState<typeof ACHETES[0] | null>(null);
  const [modalDevis, setModalDevis] = useState<typeof DEVIS_LIST[0] | null>(null);
  const [modalReservation, setModalReservation] = useState<typeof RESERVATIONS[0] | null>(null);
  const [modalLocation, setModalLocation] = useState<typeof LOCATIONS_LIST[0] | null>(null);
  const [modalPaiement, setModalPaiement] = useState<typeof PAIEMENTS[0] | null>(null);
  const [modalMessage, setModalMessage] = useState<typeof MESSAGES_LIST[0] | null>(null);
  const [viewFactureVente, setViewFactureVente] = useState<typeof VENDUS[0] | null>(null);

  const Overlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
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
        <p className="mt-1 text-sm text-white/60">Tout votre historique MKA.P-MS centralise</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {t.label} <span className="text-[10px] opacity-60">({t.count})</span>
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* Vehicules achetes */}
        {tab === "achetes" && ACHETES.map((v) => (
          <div key={v.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <Link to={`/vehicule/${v.id}`} className="flex active:bg-[#F5F3EF] transition">
              <img src={v.photo} alt={v.nom} className="w-28 h-24 object-cover shrink-0" />
              <div className="p-3 flex-1">
                <p className="text-sm font-bold text-[#111]">{v.nom}</p>
                <p className="text-xs text-slate-500 mt-0.5">{v.plaque} . {v.km}</p>
                <p className="text-xs text-slate-400">Achete le {v.date} . {v.vendeur}</p>
                <p className="text-sm font-bold text-[#D4AF37] mt-1">{v.prix}</p>
              </div>
            </Link>
            <div className="border-t border-[#F3F4F6] px-3 py-2 flex gap-2">
              <button onClick={() => setModalHistorique(v)} className="text-[10px] font-bold text-[#D4AF37] flex items-center gap-1 active:scale-95 transition"><Eye size={10} /> Historique</button>
              <button onClick={() => setModalDocuments(v)} className="text-[10px] font-bold text-slate-500 flex items-center gap-1 active:scale-95 transition"><FileText size={10} /> Documents</button>
              <button onClick={() => setModalEntretien(v)} className="text-[10px] font-bold text-slate-500 flex items-center gap-1 active:scale-95 transition"><Wrench size={10} /> Entretien</button>
            </div>
          </div>
        ))}

        {/* Vehicules vendus */}
        {tab === "vendus" && VENDUS.map((v) => (
          <div key={v.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <button onClick={() => setExpandedItem(expandedItem === v.id + 100 ? null : v.id + 100)} className="w-full text-left">
              <div className="flex">
                <img src={v.photo} alt={v.nom} className="w-28 h-24 object-cover shrink-0" />
                <div className="p-3 flex-1">
                  <p className="text-sm font-bold text-[#111]">{v.nom}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{v.plaque}</p>
                  <p className="text-xs text-slate-400">Vendu le {v.date} · {v.acheteur}</p>
                  <p className="text-sm font-bold text-green-600 mt-1">{v.prix}</p>
                </div>
              </div>
            </button>
            {expandedItem === v.id + 100 && (
              <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Plaque</span><p className="font-bold text-[#111]">{v.plaque}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Prix vente</span><p className="font-bold text-green-600">{v.prix}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Acheteur</span><p className="font-bold text-[#111]">{v.acheteur}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Date</span><p className="font-bold text-[#111]">{v.date}</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewFactureVente(v)} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white flex items-center justify-center gap-1"><Download size={10} /> Facture</button>
                  <Link to={`/vehicule/${v.id}`} className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white flex items-center justify-center gap-1"><Eye size={10} /> Voir fiche</Link>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Devis */}
        {tab === "devis" && DEVIS_LIST.map((d) => (
          <button key={d.id} onClick={() => setModalDevis(d)} className="w-full rounded-xl bg-white border border-[#E5E7EB] overflow-hidden text-left active:scale-[0.98] transition">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#111]">{d.type}</p>
                  <p className="text-xs text-slate-500">{d.garage} · {d.vehicule}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{d.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#D4AF37]">{d.montant}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.statut === "Accepte" ? "bg-green-50 text-green-700" : d.statut === "Termine" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{d.statut}</span>
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Reservations */}
        {tab === "reservations" && RESERVATIONS.map((r) => (
          <button key={r.id} onClick={() => setModalReservation(r)} className="w-full rounded-xl bg-white border border-[#E5E7EB] overflow-hidden text-left active:scale-[0.98] transition">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#111]">{r.vehicule}</p>
                  <p className="text-xs text-slate-500">{r.type} · {r.vendeur}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Acompte: {r.acompte} · {r.date}</p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-green-50 text-green-700">{r.statut}</span>
              </div>
            </div>
          </button>
        ))}

        {/* Locations */}
        {tab === "locations" && LOCATIONS_LIST.map((l) => (
          <button key={l.id} onClick={() => setModalLocation(l)} className="w-full rounded-xl bg-white border border-[#E5E7EB] overflow-hidden text-left active:scale-[0.98] transition">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#111]">{l.vehicule}</p>
                  <p className="text-xs text-slate-500">{l.agence}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{l.duree}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#D4AF37]">{l.prix}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${l.statut === "En cours" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{l.statut}</span>
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Paiements */}
        {tab === "paiements" && PAIEMENTS.map((p) => (
          <button key={p.id} onClick={() => setModalPaiement(p)} className="w-full rounded-xl bg-white border border-[#E5E7EB] overflow-hidden text-left active:scale-[0.98] transition">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#111]">{p.objet}</p>
                  <p className="text-xs text-slate-500">{p.methode} · {p.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#111]">{p.montant}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${p.statut === "Paye" ? "bg-green-50 text-green-700" : p.statut === "Actif" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{p.statut}</span>
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Favoris shortcut */}
        {tab === "favoris" && (
          <div className="text-center py-6">
            <Heart size={32} className="mx-auto text-[#D4AF37]" />
            <p className="mt-2 text-sm font-semibold text-[#6B7280]">Vos favoris sont centralises</p>
            <Link to="/favoris" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Voir mes favoris</Link>
          </div>
        )}

        {/* Messages */}
        {tab === "messages" && MESSAGES_LIST.map((m) => (
          <button key={m.id} onClick={() => setModalMessage(m)} className={`w-full text-left block rounded-xl bg-white border p-3 active:scale-[0.98] transition ${m.lu ? "border-[#E5E7EB]" : "border-[#D4AF37]/40"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#111] flex items-center gap-2">
                  {m.de}
                  {!m.lu && <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{m.objet}</p>
              </div>
              <span className="text-[10px] text-[#9CA3AF]">{m.date}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Historique vehicule */}
      {modalHistorique && (
        <Overlay onClose={() => setModalHistorique(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111]">Historique</h2>
            <p className="text-xs text-slate-500 mb-4">{modalHistorique.nom} — {modalHistorique.plaque}</p>
            <div className="space-y-3">
              {modalHistorique.historique.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-[#D4AF37] shrink-0 mt-1" />
                    {i < modalHistorique.historique.length - 1 && <div className="flex-1 w-px bg-[#E5E7EB]" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-bold text-[#111]">{h.event}</p>
                    <p className="text-[10px] text-slate-500">{h.detail}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{h.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { showToast("Historique complet exporté en PDF"); setModalHistorique(null); }} className="w-full mt-4 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Download size={14} /> Exporter l'historique</button>
          </div>
        </Overlay>
      )}

      {/* Documents vehicule */}
      {modalDocuments && (
        <Overlay onClose={() => setModalDocuments(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111]">Documents</h2>
            <p className="text-xs text-slate-500 mb-4">{modalDocuments.nom} — {modalDocuments.plaque}</p>
            <div className="space-y-2">
              {modalDocuments.documents.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-[#F5F3EF] p-3">
                  <div>
                    <p className="text-xs font-bold text-[#111]">{d.nom}</p>
                    <p className="text-[10px] text-slate-400">{d.type} · {d.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold bg-green-50 text-green-700">{d.statut}</span>
                    <button onClick={() => showToast(`${d.nom} téléchargé`)} className="h-7 w-7 rounded-full bg-[#D4AF37] grid place-items-center active:scale-90 transition"><Download size={12} className="text-white" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { showToast("Tous les documents téléchargés"); setModalDocuments(null); }} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Download size={14} /> Tout télécharger</button>
              <button onClick={() => { showToast("Impression lancée"); setModalDocuments(null); }} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Printer size={14} /> Imprimer</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Entretien vehicule */}
      {modalEntretien && (
        <Overlay onClose={() => setModalEntretien(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111]">Entretien</h2>
            <p className="text-xs text-slate-500 mb-4">{modalEntretien.nom} — {modalEntretien.plaque}</p>
            <div className="space-y-2">
              {modalEntretien.entretiens.map((e, i) => (
                <div key={i} className="rounded-xl bg-[#F5F3EF] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#111]">{e.type}</p>
                      <p className="text-[10px] text-slate-500">{e.garage} · {e.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#D4AF37]">{e.montant}</p>
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${e.statut === "Terminé" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{e.statut}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Link to="/reparer" onClick={() => setModalEntretien(null)} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Wrench size={14} /> Prendre RDV garage</Link>
              <button onClick={() => { showToast("Carnet d'entretien exporté"); setModalEntretien(null); }} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Download size={14} /> Export PDF</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Devis detail — PDF visuel */}
      {modalDevis && (
        <DocumentView
          doc={buildDevisData({ type: modalDevis.type, garage: modalDevis.garage, montant: modalDevis.montant, date: modalDevis.date, vehicule: modalDevis.vehicule, client: modalDevis.garage, ref: `DV-${modalDevis.id}` })}
          onClose={() => setModalDevis(null)}
        />
      )}

      {/* Reservation detail */}
      {modalReservation && (
        <Overlay onClose={() => setModalReservation(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111]">{modalReservation.vehicule}</h2>
            <p className="text-xs text-slate-500 mb-4">Réservation {modalReservation.ref}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Type</p><p className="text-sm font-black text-[#111]">{modalReservation.type}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Acompte</p><p className="text-sm font-black text-[#D4AF37]">{modalReservation.acompte}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Vendeur</p><p className="text-sm font-bold text-[#111]">{modalReservation.vendeur}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-slate-400">Date</p><p className="text-sm font-bold text-[#111]">{modalReservation.date}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { showToast("Confirmation de réservation téléchargée"); setModalReservation(null); }} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Download size={14} /> Confirmation</button>
              <button onClick={() => { showToast("Annulation envoyée"); setModalReservation(null); }} className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><X size={14} /> Annuler</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Location detail — Contrat PDF visuel */}
      {modalLocation && (
        <DocumentView
          doc={buildContratData({ vehicule: modalLocation.vehicule, client: "Titulaire du contrat", type: "Location", duree: modalLocation.duree, prix: modalLocation.prix, ref: modalLocation.ref, agence: modalLocation.agence })}
          onClose={() => setModalLocation(null)}
        />
      )}

      {/* Paiement detail — Facture PDF visuel */}
      {modalPaiement && (
        <DocumentView
          doc={buildFactureData({ ref: modalPaiement.ref, objet: modalPaiement.objet, client: "Client MKA.P-MS", montant: modalPaiement.montant, date: modalPaiement.date, statut: modalPaiement.statut, type: "Paiement" })}
          onClose={() => setModalPaiement(null)}
        />
      )}

      {/* Message detail */}
      {modalMessage && (
        <Overlay onClose={() => setModalMessage(null)}>
          <div className="p-5 pt-10">
            <div className="flex items-center gap-2 mb-1">
              {!modalMessage.lu && <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />}
              <h2 className="text-lg font-black text-[#111]">{modalMessage.de}</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">{modalMessage.date}</p>
            <div className="rounded-xl bg-[#F5F3EF] p-4 mb-4">
              <p className="text-sm font-bold text-[#111] mb-2">{modalMessage.objet}</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bonjour, ceci est le contenu complet du message de {modalMessage.de}. Vous pouvez répondre directement depuis cette interface ou contacter l'expéditeur.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { showToast("Réponse envoyée"); setModalMessage(null); }} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Mail size={14} /> Répondre</button>
              <button onClick={() => { showToast("Message marqué comme lu"); setModalMessage(null); }} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><CheckCircle size={14} /> Lu</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Facture de vente — PDF visuel */}
      {viewFactureVente && (
        <DocumentView
          doc={buildFactureData({ ref: `FA-VENTE-${viewFactureVente.id}`, objet: `Vente ${viewFactureVente.nom}`, client: viewFactureVente.acheteur, montant: viewFactureVente.prix, date: viewFactureVente.date, statut: "Paye", type: "Vente" })}
          onClose={() => setViewFactureVente(null)}
        />
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
