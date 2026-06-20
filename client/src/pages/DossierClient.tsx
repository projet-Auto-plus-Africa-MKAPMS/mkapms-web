import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, User, Car, ShoppingCart, Tag, FileText, Calendar,
  Key, CreditCard, Heart, MessageSquare, MapPin, Clock,
  Download, Eye, ChevronRight, Wrench, Gavel
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   DOSSIER UNIQUE CLIENT — Espace centralise
   Vehicules achetes/vendus, devis, reservations, locations, paiements,
   favoris, messages — tout en un seul endroit.
   ══════════════════════════════════════════════════════════════════════════ */

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
  { id: 1, nom: "Peugeot 3008 GT Hybrid", prix: "28 500 EUR", date: "15/03/2024", vendeur: "Pro Vente Paris", plaque: "AB-123-CD", km: "15 000 km", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=300&h=200&fit=crop" },
  { id: 2, nom: "Renault Clio V TCe", prix: "18 500 EUR", date: "10/01/2024", vendeur: "Particulier", plaque: "EF-456-GH", km: "5 000 km", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=300&h=200&fit=crop" },
];

const VENDUS = [
  { id: 1, nom: "Citroen C3 Aircross", prix: "14 200 EUR", date: "05/02/2024", acheteur: "Particulier via MKA.P-MS", plaque: "IJ-789-KL", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=300&h=200&fit=crop" },
];

const DEVIS_LIST = [
  { id: 1, type: "Revision complete", garage: "Garage Auto Express", montant: "350 EUR", date: "20/05/2024", statut: "Accepte", vehicule: "Peugeot 3008 GT" },
  { id: 2, type: "Changement freins AV", garage: "Garage Premium Motors", montant: "280 EUR", date: "15/04/2024", statut: "En attente", vehicule: "Peugeot 3008 GT" },
  { id: 3, type: "Pneus hiver x4", garage: "Garage Auto Express", montant: "520 EUR", date: "01/11/2023", statut: "Termine", vehicule: "Renault Clio V" },
];

const RESERVATIONS = [
  { id: 1, vehicule: "BMW Serie 5 530e", type: "Achat", acompte: "500 EUR", date: "28/05/2024", statut: "Active", vendeur: "MKA.P-MS Officiel" },
];

const LOCATIONS_LIST = [
  { id: 1, vehicule: "Mercedes Classe E Break", duree: "15/03 au 15/04/2024", prix: "1 350 EUR", statut: "Terminee", agence: "MKA.P-MS Location Paris" },
  { id: 2, vehicule: "Peugeot 208", duree: "01/06 au 07/06/2024", prix: "196 EUR", statut: "En cours", agence: "MKA.P-MS Location Lyon" },
];

const PAIEMENTS = [
  { id: 1, objet: "Achat Peugeot 3008 GT", montant: "28 500 EUR", date: "15/03/2024", methode: "Virement", statut: "Paye" },
  { id: 2, objet: "Location Mercedes Classe E", montant: "1 350 EUR", date: "15/03/2024", methode: "CB", statut: "Paye" },
  { id: 3, objet: "Revision Garage Auto Express", montant: "350 EUR", date: "20/05/2024", methode: "CB", statut: "Paye" },
  { id: 4, objet: "Abonnement Pro Premium", montant: "89 EUR/mois", date: "01/06/2024", methode: "CB", statut: "Actif" },
  { id: 5, objet: "Acompte BMW Serie 5", montant: "500 EUR", date: "28/05/2024", methode: "CB", statut: "Reserve" },
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
            <div className="flex">
              <img src={v.photo} alt={v.nom} className="w-28 h-24 object-cover shrink-0" />
              <div className="p-3 flex-1">
                <p className="text-sm font-bold text-[#111]">{v.nom}</p>
                <p className="text-xs text-slate-500 mt-0.5">{v.plaque} . {v.km}</p>
                <p className="text-xs text-slate-400">Achete le {v.date} . {v.vendeur}</p>
                <p className="text-sm font-bold text-[#D4AF37] mt-1">{v.prix}</p>
              </div>
            </div>
            <div className="border-t border-[#F3F4F6] px-3 py-2 flex gap-2">
              <Link to="/historique" className="text-[10px] font-bold text-[#D4AF37] flex items-center gap-1"><Eye size={10} /> Historique</Link>
              <Link to="/compte" className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><FileText size={10} /> Documents</Link>
              <Link to="/reparer" className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Wrench size={10} /> Entretien</Link>
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
                  <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Facture</button>
                  <button className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white">Historique</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Devis */}
        {tab === "devis" && DEVIS_LIST.map((d) => (
          <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <button onClick={() => setExpandedItem(expandedItem === d.id + 200 ? null : d.id + 200)} className="w-full text-left p-3">
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
            </button>
            {expandedItem === d.id + 200 && (
              <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Garage</span><p className="font-bold text-[#111]">{d.garage}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Vehicule</span><p className="font-bold text-[#111]">{d.vehicule}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Type</span><p className="font-bold text-[#111]">{d.type}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Montant</span><p className="font-bold text-[#D4AF37]">{d.montant}</p></div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Voir devis</button>
                  <button className="flex-1 rounded-lg bg-green-500 py-1.5 text-[10px] font-bold text-white">Accepter</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Reservations */}
        {tab === "reservations" && RESERVATIONS.map((r) => (
          <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <button onClick={() => setExpandedItem(expandedItem === r.id + 300 ? null : r.id + 300)} className="w-full text-left p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#111]">{r.vehicule}</p>
                  <p className="text-xs text-slate-500">{r.type} · {r.vendeur}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Acompte: {r.acompte} · {r.date}</p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-green-50 text-green-700">{r.statut}</span>
              </div>
            </button>
            {expandedItem === r.id + 300 && (
              <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Vehicule</span><p className="font-bold text-[#111]">{r.vehicule}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Type</span><p className="font-bold text-[#111]">{r.type}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Vendeur</span><p className="font-bold text-[#111]">{r.vendeur}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Acompte</span><p className="font-bold text-[#D4AF37]">{r.acompte}</p></div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Details</button>
                  <button className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white">Contacter</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Locations */}
        {tab === "locations" && LOCATIONS_LIST.map((l) => (
          <div key={l.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <button onClick={() => setExpandedItem(expandedItem === l.id + 400 ? null : l.id + 400)} className="w-full text-left p-3">
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
            </button>
            {expandedItem === l.id + 400 && (
              <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Vehicule</span><p className="font-bold text-[#111]">{l.vehicule}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Agence</span><p className="font-bold text-[#111]">{l.agence}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Duree</span><p className="font-bold text-[#111]">{l.duree}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Prix</span><p className="font-bold text-[#D4AF37]">{l.prix}</p></div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Contrat</button>
                  <button className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white">Prolonger</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Paiements */}
        {tab === "paiements" && PAIEMENTS.map((p) => (
          <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <button onClick={() => setExpandedItem(expandedItem === p.id + 500 ? null : p.id + 500)} className="w-full text-left p-3">
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
            </button>
            {expandedItem === p.id + 500 && (
              <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Objet</span><p className="font-bold text-[#111]">{p.objet}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Methode</span><p className="font-bold text-[#111]">{p.methode}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Montant</span><p className="font-bold text-[#D4AF37]">{p.montant}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Date</span><p className="font-bold text-[#111]">{p.date}</p></div>
                </div>
                <button className="w-full rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Telecharger facture</button>
              </div>
            )}
          </div>
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
          <Link key={m.id} to="/compte/messages" className={`block rounded-xl bg-white border p-3 hover:border-[#D4AF37] transition ${m.lu ? "border-[#E5E7EB]" : "border-[#D4AF37]/40"}`}>
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
          </Link>
        ))}
      </div>
    </div>
  );
}
