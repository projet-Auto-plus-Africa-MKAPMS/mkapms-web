import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, Heart, Car, Bell, MessageSquare, Home } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   TABLEAU DE BORD PERSONNEL (/utilisateurs/tableau-de-bord)
   Agrégation de compteurs réels déjà exposés par plusieurs moteurs —
   jamais un chiffre calculé ou estimé pour cet écran.
   ══════════════════════════════════════════════════════════════════════════ */

export default function TableauBordPerso() {
  const favoris = trpc.favoris.mine.useQuery();
  const annonces = trpc.annonces.mine.useQuery();
  const notifs = trpc.notifications.unreadCount.useQuery();
  const messages = trpc.messages.unreadCount.useQuery();
  const reservations = trpc.reservations.mine.useQuery();

  const cartes = [
    { icon: Heart, label: "Favoris", value: favoris.data?.length, lien: "/utilisateurs/centre-favoris-utilisateur" },
    { icon: Car, label: "Mes véhicules", value: annonces.data?.length, lien: "/utilisateurs/mes-vehicules" },
    { icon: Bell, label: "Notifications non lues", value: notifs.data, lien: "/notifications" },
    { icon: MessageSquare, label: "Messages non lus", value: messages.data, lien: "/utilisateurs/messagerie-globale" },
    { icon: Home, label: "Réservations", value: reservations.data?.length, lien: "/utilisateurs/historique-locations" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Tableau de bord</h1>
        <p className="mt-1 text-sm text-white/60">Vue d'ensemble de votre compte</p>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        {cartes.map((c) => (
          <Link key={c.label} to={c.lien} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <c.icon size={18} className="text-[#D4AF37]" />
            <p className="mt-2 text-2xl font-black text-[#111]">{c.value ?? "…"}</p>
            <p className="text-xs text-[#6B7280]">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
