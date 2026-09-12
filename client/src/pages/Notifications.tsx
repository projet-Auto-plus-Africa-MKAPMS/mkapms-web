import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, Car, CreditCard, FileText, Tag, Check,
  ChevronRight, CheckCheck, Key, Wrench, Gavel,
  MessageSquare, Shield, ChevronLeft,
  Eye, Printer, X, AlertTriangle, Truck, LifeBuoy, ShoppingBag, IdCard,
} from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRE DE NOTIFICATIONS UNIFIÉ MKA.P-MS
   Données réelles : trpc.notifications.list (table `notifications`,
   alimentée par notifyEvent() depuis tout le serveur — jamais une liste
   inventée). `type` est le champ réel stocké (inappType du catalogue de
   déclencheurs, server/notification-os/triggers.ts) : c'est le seul filtre
   honnête disponible, les 19 écrans /notifications/* passent leur propre
   sous-ensemble de types réels via `filtreTypes`.
   ══════════════════════════════════════════════════════════════════════════ */

export type NotifType =
  | "abonnement" | "annonce" | "carte_grise" | "commande" | "depannage"
  | "depot_vente" | "devis" | "dispute" | "enchere" | "facture" | "garage"
  | "livraison" | "message" | "paiement" | "reservation" | "securite"
  | "support" | "systeme" | "validation" | "vo";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  createdAt: string | Date;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  abonnement: { label: "Abonnement", icon: Tag, color: "bg-amber-50 text-amber-600" },
  annonce: { label: "Annonces", icon: Car, color: "bg-blue-50 text-blue-600" },
  carte_grise: { label: "Carte grise", icon: IdCard, color: "bg-slate-50 text-slate-600" },
  commande: { label: "Commandes", icon: ShoppingBag, color: "bg-orange-50 text-orange-600" },
  depannage: { label: "Dépannage", icon: LifeBuoy, color: "bg-red-50 text-red-600" },
  depot_vente: { label: "Dépôt-vente", icon: Car, color: "bg-blue-50 text-blue-600" },
  devis: { label: "Devis", icon: FileText, color: "bg-indigo-50 text-indigo-600" },
  dispute: { label: "Litiges", icon: AlertTriangle, color: "bg-red-50 text-red-600" },
  enchere: { label: "Enchères", icon: Gavel, color: "bg-purple-50 text-purple-600" },
  facture: { label: "Factures", icon: FileText, color: "bg-emerald-50 text-emerald-600" },
  garage: { label: "Garage", icon: Wrench, color: "bg-green-50 text-green-600" },
  livraison: { label: "Livraison", icon: Truck, color: "bg-cyan-50 text-cyan-600" },
  message: { label: "Messages", icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
  paiement: { label: "Paiements", icon: CreditCard, color: "bg-emerald-50 text-emerald-600" },
  reservation: { label: "Réservations", icon: Key, color: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  securite: { label: "Sécurité", icon: Shield, color: "bg-red-50 text-red-600" },
  support: { label: "Support", icon: LifeBuoy, color: "bg-slate-50 text-slate-600" },
  systeme: { label: "Système", icon: Bell, color: "bg-slate-50 text-slate-600" },
  validation: { label: "Validation", icon: Check, color: "bg-green-50 text-green-600" },
  vo: { label: "Véhicule d'occasion", icon: Car, color: "bg-blue-50 text-blue-600" },
};

function configOf(type: string) {
  return TYPE_CONFIG[type] ?? { label: type, icon: Bell, color: "bg-slate-50 text-slate-600" };
}

interface NotificationsProps {
  /** Sous-ensemble de types réels (server/notification-os/triggers.ts) à afficher. Absent = tous. */
  filtreTypes?: NotifType[];
  titre?: string;
  sousTitre?: string;
  retourUrl?: string;
}

export default function Notifications({ filtreTypes, titre = "Notifications", sousTitre, retourUrl = "/compte" }: NotificationsProps) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const liste = trpc.notifications.list.useQuery({ limit: 100 });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  const [lecture, setLecture] = useState<"tous" | "non_lues" | "lues">("tous");
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const toutes = (liste.data ?? []) as Notification[];
  const dansLePerimetre = filtreTypes ? toutes.filter((n) => filtreTypes.includes(n.type as NotifType)) : toutes;
  const nonLus = dansLePerimetre.filter((n) => !n.read).length;

  const filtered = (() => {
    if (lecture === "non_lues") return dansLePerimetre.filter((n) => !n.read);
    if (lecture === "lues") return dansLePerimetre.filter((n) => n.read);
    return dansLePerimetre;
  })();

  const typesPresents = Array.from(new Set(dansLePerimetre.map((n) => n.type)));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to={retourUrl} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> {titre}</h1>
            <p className="mt-0.5 text-sm text-white/60">{sousTitre ?? (nonLus > 0 ? `${nonLus} non lue${nonLus > 1 ? "s" : ""}` : "Tout est lu")}</p>
          </div>
          {nonLus > 0 && (
            <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              <CheckCheck size={12} /> Tout lire
            </button>
          )}
        </div>
      </div>

      {/* Filtres lu/non lu */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          ["tous", `Tous (${dansLePerimetre.length})`],
          ["non_lues", `Non lues (${nonLus})`],
          ["lues", `Lues (${dansLePerimetre.filter((n) => n.read).length})`],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setLecture(id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${lecture === id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {label}
          </button>
        ))}
      </div>

      {liste.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      {/* Liste — réelle, cliquable, ouvre le détail */}
      <div className="px-4 mt-4 space-y-2">
        {filtered.map((n) => {
          const cfg = configOf(n.type);
          const Icon = cfg.icon;
          return (
            <button
              key={n.id}
              onClick={() => { if (!n.read) markRead.mutate({ id: n.id }); setSelectedNotif(n); }}
              className={`w-full text-left block rounded-xl bg-white border p-4 transition hover:border-[#D4AF37] hover:shadow-md cursor-pointer ${n.read ? "border-[#E5E7EB]" : "border-[#D4AF37]/40 bg-[#D4AF37]/[0.02]"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#111] truncate">{n.title}</h3>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-[#D4AF37] shrink-0" />}
                  </div>
                  {n.body && <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{n.body}</p>}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-[#9CA3AF]">{new Date(n.createdAt).toLocaleString("fr-FR")}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 shrink-0 mt-1" />
              </div>
            </button>
          );
        })}
      </div>

      {!liste.isLoading && filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Bell size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune notification</p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            {filtreTypes ? `Rien pour ${typesPresents.length > 0 ? "ce filtre" : "cette catégorie"} pour le moment.` : "Vos notifications apparaîtront ici"}
          </p>
        </div>
      )}

      {/* ━━━━━ MODAL DÉTAIL NOTIFICATION ━━━━━ */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedNotif(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#111] px-5 pt-5 pb-4 rounded-t-2xl flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${configOf(selectedNotif.type).color}`}>
                  {(() => { const CIcon = configOf(selectedNotif.type).icon; return <CIcon size={16} />; })()}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{selectedNotif.title}</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold ${configOf(selectedNotif.type).color}`}>
                    {configOf(selectedNotif.type).label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"><X size={16} className="text-white" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-[#F5F3EF] p-4">
                {selectedNotif.body && <p className="text-sm text-[#111] leading-relaxed">{selectedNotif.body}</p>}
                <div className="mt-3 flex items-center gap-3 flex-wrap text-[10px]">
                  <span className="text-slate-400">{new Date(selectedNotif.createdAt).toLocaleString("fr-FR")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg bg-white border border-[#E5E7EB] p-2">
                  <p className="text-slate-400">Catégorie</p>
                  <p className="font-bold text-[#111]">{configOf(selectedNotif.type).label}</p>
                </div>
                <div className="rounded-lg bg-white border border-[#E5E7EB] p-2">
                  <p className="text-slate-400">Statut</p>
                  <p className="font-bold text-[#111]">{selectedNotif.read ? "Lu" : "Non lu"}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedNotif.url && (
                  <button onClick={() => { navigate(selectedNotif.url!); setSelectedNotif(null); }} className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] py-3 text-xs font-bold text-white hover:bg-[#C5A028] transition">
                    <Eye size={14} /> Voir le détail complet
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {!selectedNotif.read && (
                    <button onClick={() => markRead.mutate({ id: selectedNotif.id })} className="flex items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] py-2.5 text-[10px] font-bold text-[#111] hover:bg-[#F5F3EF] transition">
                      <Check size={12} /> Marquer lu
                    </button>
                  )}
                  <button onClick={() => window.print()} className={`flex items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] py-2.5 text-[10px] font-bold text-[#111] hover:bg-[#F5F3EF] transition ${selectedNotif.read ? "col-span-2" : ""}`}>
                    <Printer size={12} /> Imprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
