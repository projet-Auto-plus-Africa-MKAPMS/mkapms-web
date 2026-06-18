import { useState } from "react";
import {
  Bell, Car, CreditCard, FileText, Calendar, Tag, Check,
  ChevronRight, Trash2, CheckCheck
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRE DE NOTIFICATIONS
   Notifications: générales, véhicules, paiements, documents, réservations, abonnements.
   ══════════════════════════════════════════════════════════════════════════ */

type NotifType = "general" | "vehicule" | "paiement" | "document" | "reservation" | "abonnement";

const TABS: { id: NotifType | "tous"; label: string; icon: typeof Bell }[] = [
  { id: "tous", label: "Tous", icon: Bell },
  { id: "vehicule", label: "Véhicules", icon: Car },
  { id: "paiement", label: "Paiements", icon: CreditCard },
  { id: "document", label: "Documents", icon: FileText },
  { id: "reservation", label: "Réservations", icon: Calendar },
  { id: "abonnement", label: "Abonnements", icon: Tag },
];

const NOTIFS = [
  { id: 1, type: "document" as NotifType, titre: "Document validé", desc: "Votre pièce d'identité a été validée avec succès.", date: "Il y a 2h", lu: false },
  { id: 2, type: "reservation" as NotifType, titre: "Réservation acceptée", desc: "Votre réservation Mercedes Classe E du 15/03 au 15/04 a été acceptée.", date: "Il y a 5h", lu: false },
  { id: 3, type: "paiement" as NotifType, titre: "Paiement reçu", desc: "Votre paiement de 1 350 € a été reçu. Facture disponible.", date: "Hier", lu: false },
  { id: 4, type: "vehicule" as NotifType, titre: "Contrôle technique", desc: "Le contrôle technique de votre véhicule AB-123-CD expire dans 30 jours.", date: "Hier", lu: true },
  { id: 5, type: "general" as NotifType, titre: "Bienvenue sur MKA.P-MS", desc: "Votre compte a été créé avec succès. Complétez votre profil pour commencer.", date: "Il y a 3 jours", lu: true },
  { id: 6, type: "abonnement" as NotifType, titre: "Renouvellement", desc: "Votre abonnement Pro expire dans 7 jours. Renouvelez maintenant.", date: "Il y a 3 jours", lu: true },
  { id: 7, type: "document" as NotifType, titre: "Document refusé", desc: "Votre justificatif de domicile a été refusé. Veuillez renvoyer un document récent.", date: "Il y a 4 jours", lu: true },
  { id: 8, type: "paiement" as NotifType, titre: "Facture disponible", desc: "Votre facture n°2025-0042 est disponible au téléchargement.", date: "Il y a 5 jours", lu: true },
  { id: 9, type: "reservation" as NotifType, titre: "Rappel : retrait demain", desc: "N'oubliez pas : retrait de votre BMW Série 5 demain à 9h00, Agence Paris 12e.", date: "Il y a 6 jours", lu: true },
  { id: 10, type: "vehicule" as NotifType, titre: "Nouveau véhicule", desc: "Un nouveau véhicule correspond à votre recherche : Tesla Model 3 LR à 135 €/jour.", date: "Il y a 7 jours", lu: true },
];

const TYPE_ICON: Record<NotifType, typeof Bell> = {
  general: Bell, vehicule: Car, paiement: CreditCard, document: FileText, reservation: Calendar, abonnement: Tag,
};
const TYPE_COLOR: Record<NotifType, string> = {
  general: "bg-[#D4AF37]/10 text-[#D4AF37]", vehicule: "bg-blue-50 text-blue-600", paiement: "bg-green-50 text-green-600", document: "bg-purple-50 text-purple-600", reservation: "bg-amber-50 text-amber-600", abonnement: "bg-pink-50 text-pink-600",
};

export default function Notifications() {
  const [tab, setTab] = useState<NotifType | "tous">("tous");
  const [notifs, setNotifs] = useState(NOTIFS);
  const nonLus = notifs.filter((n) => !n.lu).length;

  const filtered = tab === "tous" ? notifs : notifs.filter((n) => n.type === tab);

  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, lu: true })));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Notifications</h1>
            <p className="mt-0.5 text-sm text-white/60">{nonLus > 0 ? `${nonLus} non lue${nonLus > 1 ? "s" : ""}` : "Tout est lu"}</p>
          </div>
          {nonLus > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
              <CheckCheck size={12} /> Tout lire
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count = t.id === "tous" ? notifs.length : notifs.filter((n) => n.type === t.id).length;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {t.label} <span className="text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-2">
        {filtered.map((n) => {
          const Icon = TYPE_ICON[n.type];
          const color = TYPE_COLOR[n.type];
          return (
            <div key={n.id} className={`rounded-xl bg-white border p-4 transition ${n.lu ? "border-[#E5E7EB]" : "border-[#D4AF37]/40 bg-[#D4AF37]/[0.02]"}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#111] truncate">{n.titre}</h3>
                    {!n.lu && <span className="h-2 w-2 rounded-full bg-[#D4AF37] shrink-0" />}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{n.desc}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">{n.date}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Bell size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune notification</p>
        </div>
      )}
    </div>
  );
}
