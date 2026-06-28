import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, Car, CreditCard, FileText, Calendar, Tag, Check,
  ChevronRight, Trash2, CheckCheck, Key, Wrench, Gavel,
  MessageSquare, User, Shield, ShoppingBag, ChevronLeft, Filter
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRE DE NOTIFICATIONS UNIFIE MKA.P-MS
   Tout centralise — Vente, Location, Garage, Encheres, Compte
   Filtres: Non lues, Lues, par categorie
   Historique complet — pas de WhatsApp, tout dans la plateforme
   ══════════════════════════════════════════════════════════════════════════ */

type NotifCategory = "vente" | "location" | "garage" | "encheres" | "compte" | "paiement";

interface Notification {
  id: number;
  category: NotifCategory;
  titre: string;
  desc: string;
  date: string;
  lu: boolean;
  url: string;
}

const NOTIFS: Notification[] = [
  // Vente
  { id: 1, category: "vente", titre: "Nouveau message", desc: "Un acheteur interesse par votre Peugeot 3008 GT vous a envoye un message.", date: "Il y a 5 min", lu: false, url: "/compte?tab=annonces" },
  { id: 2, category: "vente", titre: "Nouvelle offre", desc: "Offre de 27 500 EUR recue sur votre Peugeot 3008 GT.", date: "Il y a 30 min", lu: false, url: "/compte?tab=annonces" },
  { id: 3, category: "vente", titre: "Annonce validee", desc: "Votre annonce 'BMW Serie 3 320i' a ete validee et est maintenant en ligne.", date: "Il y a 2h", lu: false, url: "/vehicule/3" },
  { id: 4, category: "vente", titre: "Annonce expiree", desc: "Votre annonce 'Citroen C3 Aircross' a expire. Renouvelez-la pour continuer.", date: "Hier", lu: true, url: "/compte?tab=annonces" },
  { id: 5, category: "vente", titre: "Annonce boostee", desc: "Votre boost Premium 30j sur 'Peugeot 3008 GT' est actif.", date: "Il y a 2 jours", lu: true, url: "/vehicule/1" },

  // Location
  { id: 6, category: "location", titre: "Reservation recue", desc: "Nouvelle reservation pour Mercedes Classe E Break du 20/06 au 25/06.", date: "Il y a 1h", lu: false, url: "/compte?tab=reservations" },
  { id: 7, category: "location", titre: "Reservation confirmee", desc: "Votre reservation Renault Clio V du 01/07 au 07/07 est confirmee.", date: "Il y a 3h", lu: false, url: "/compte?tab=reservations" },
  { id: 8, category: "location", titre: "Reservation annulee", desc: "La reservation #R-2024-0089 a ete annulee par le client.", date: "Hier", lu: true, url: "/compte?tab=reservations" },
  { id: 9, category: "location", titre: "Paiement recu", desc: "Paiement de 1 350 EUR recu pour la location Mercedes Classe E Break.", date: "Il y a 2 jours", lu: true, url: "/comptabilite?tab=ecritures" },

  // Garage
  { id: 10, category: "garage", titre: "Nouveau devis", desc: "Devis revision complete pour Peugeot 3008 GT — 350 EUR.", date: "Il y a 2h", lu: false, url: "/compte?tab=devis" },
  { id: 11, category: "garage", titre: "Devis accepte", desc: "Le client a accepte votre devis #D-2024-0542.", date: "Hier", lu: true, url: "/compte?tab=devis" },
  { id: 12, category: "garage", titre: "Vehicule arrive", desc: "Le vehicule AB-123-CD est arrive a l'atelier.", date: "Hier", lu: true, url: "/suivi-vehicule" },
  { id: 13, category: "garage", titre: "Reparation terminee", desc: "La revision de la Peugeot 3008 GT est terminee.", date: "Il y a 3 jours", lu: true, url: "/suivi-vehicule" },
  { id: 14, category: "garage", titre: "Vehicule pret", desc: "Le vehicule AB-123-CD est pret a etre recupere.", date: "Il y a 3 jours", lu: true, url: "/suivi-vehicule" },

  // Encheres
  { id: 15, category: "encheres", titre: "Nouvelle enchere", desc: "Lot #127 — Nouvelle enchere ouverte: Peugeot 208 + Citroen C3.", date: "Il y a 4h", lu: false, url: "/encheres" },
  { id: 16, category: "encheres", titre: "Vous etes depasse", desc: "Votre offre sur le Lot #134 a ete depassee. Nouvelle offre: 6 800 EUR.", date: "Il y a 6h", lu: false, url: "/encheres" },
  { id: 17, category: "encheres", titre: "Enchere remportee", desc: "Felicitations! Vous avez remporte le Lot #112 — Renault Kangoo a 3 200 EUR.", date: "Il y a 2 jours", lu: true, url: "/encheres" },
  { id: 18, category: "encheres", titre: "Enchere perdue", desc: "Vous n'avez pas remporte le Lot #098. Le lot est parti a 5 600 EUR.", date: "Il y a 5 jours", lu: true, url: "/encheres" },

  // Compte
  { id: 19, category: "compte", titre: "Validation documents", desc: "Votre piece d'identite a ete validee avec succes.", date: "Il y a 1 jour", lu: true, url: "/compte?tab=coffre" },
  { id: 20, category: "compte", titre: "Changement abonnement", desc: "Votre abonnement a ete mis a niveau vers Pro Premium (89 EUR/mois).", date: "Il y a 3 jours", lu: true, url: "/abonnements" },
  { id: 21, category: "compte", titre: "Facture disponible", desc: "Votre facture n'2024-0042 est disponible au telechargement.", date: "Il y a 5 jours", lu: true, url: "/comptabilite?tab=ecritures" },
  
  // Paiement
  { id: 22, category: "paiement", titre: "Paiement confirme", desc: "Votre paiement de 89 EUR pour l'abonnement Pro Premium a ete confirme.", date: "Il y a 3 jours", lu: true, url: "/comptabilite?tab=ecritures" },
  { id: 23, category: "paiement", titre: "Remboursement traite", desc: "Un remboursement de 50 EUR a ete effectue sur votre compte.", date: "Il y a 7 jours", lu: true, url: "/comptabilite?tab=ecritures" },
];

const CATEGORY_CONFIG: Record<NotifCategory, { label: string; icon: typeof Bell; color: string }> = {
  vente: { label: "Vente", icon: Car, color: "bg-blue-50 text-blue-600" },
  location: { label: "Location", icon: Key, color: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  garage: { label: "Garage", icon: Wrench, color: "bg-green-50 text-green-600" },
  encheres: { label: "Encheres", icon: Gavel, color: "bg-purple-50 text-purple-600" },
  compte: { label: "Compte", icon: User, color: "bg-slate-50 text-slate-600" },
  paiement: { label: "Paiements", icon: CreditCard, color: "bg-emerald-50 text-emerald-600" },
};

type FilterMode = "tous" | "non_lues" | "lues" | NotifCategory;

export default function Notifications() {
  const [notifs, setNotifs] = useState(NOTIFS);
  const [filter, setFilter] = useState<FilterMode>("tous");
  const nonLus = notifs.filter((n) => !n.lu).length;

  const filtered = (() => {
    if (filter === "tous") return notifs;
    if (filter === "non_lues") return notifs.filter((n) => !n.lu);
    if (filter === "lues") return notifs.filter((n) => n.lu);
    return notifs.filter((n) => n.category === filter);
  })();

  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, lu: true })));
  const markRead = (id: number) => setNotifs(notifs.map((n) => n.id === id ? { ...n, lu: true } : n));

  const filters: { id: FilterMode; label: string }[] = [
    { id: "tous", label: `Tous (${notifs.length})` },
    { id: "non_lues", label: `Non lues (${nonLus})` },
    { id: "lues", label: `Lues (${notifs.filter((n) => n.lu).length})` },
    ...Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
      id: key as FilterMode,
      label: `${cfg.label} (${notifs.filter((n) => n.category === key).length})`,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> Notifications</h1>
            <p className="mt-0.5 text-sm text-white/60">{nonLus > 0 ? `${nonLus} non lue${nonLus > 1 ? "s" : ""}` : "Tout est lu"}</p>
          </div>
          {nonLus > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
              <CheckCheck size={12} /> Tout lire
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === f.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="px-4 mt-4 space-y-2">
        {filtered.map((n) => {
          const cfg = CATEGORY_CONFIG[n.category];
          const Icon = cfg.icon;
          return (
            <Link
              key={n.id}
              to={n.url}
              onClick={() => markRead(n.id)}
              className={`block rounded-xl bg-white border p-4 transition hover:border-[#D4AF37] ${n.lu ? "border-[#E5E7EB]" : "border-[#D4AF37]/40 bg-[#D4AF37]/[0.02]"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#111] truncate">{n.titre}</h3>
                    {!n.lu && <span className="h-2 w-2 rounded-full bg-[#D4AF37] shrink-0" />}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{n.desc}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-[#9CA3AF]">{n.date}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 shrink-0 mt-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Bell size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune notification</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Vos notifications apparaitront ici</p>
        </div>
      )}
    </div>
  );
}
