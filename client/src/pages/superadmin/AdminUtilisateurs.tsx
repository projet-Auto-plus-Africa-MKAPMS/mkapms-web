import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, Search, Shield, Car, Wrench, Key, ChevronDown, X, Phone, Mail, MapPin, Calendar, AlertTriangle, Trash2, Edit3, Ban, CheckCircle, MessageSquare, Send, Star } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   UTILISATEURS (superadmin)
   Données réelles : trpc.admin.usersList/usersStats (server/routers/admin.ts).
   "Suspendre"/"Réactiver" posent users.status — revérifié à CHAQUE requête
   authentifiée (server/trpc.ts createContext), pas seulement à la prochaine
   connexion : un jeton dure 30 jours, donc sans ce contrôle la suspension
   n'aurait aucun effet réel avant son expiration. "Supprimer" dépose une
   vraie demande de suppression (admin.requestUserDeletion, un employé
   demande, la Direction approuve — moteur déjà existant, jamais dupliqué).
   "Contacter" crée une vraie notification in-app (moteur notifications
   existant). "achats" a été retiré : aucune notion d'achat de véhicule
   n'existe dans ce dépôt (les annonces n'ont qu'un propriétaire/vendeur,
   jamais un acheteur enregistré) — retiré plutôt qu'inventé.
   ══════════════════════════════════════════════════════════════════════════ */

const ROLE_ICONS: Record<string, typeof Users> = { user: Users, pro: Car, garage: Wrench, vtc: Key, carrosserie: Shield, admin: Shield, super_admin: Shield };
const ROLE_LABELS: Record<string, string> = { user: "Particulier", pro: "Professionnel", garage: "Garage / Atelier", vtc: "VTC / Taxi", carrosserie: "Carrosserie", admin: "Administrateur", super_admin: "PDG" };

export default function AdminUtilisateurs() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "suspended">("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [profilModal, setProfilModal] = useState<number | null>(null);
  const [contactModal, setContactModal] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: number; action: "suspendre" | "reactiver" | "supprimer" } | null>(null);
  const [editModal, setEditModal] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", addressLine: "", city: "", postalCode: "" });
  const [msgText, setMsgText] = useState("");
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [deletionSent, setDeletionSent] = useState(false);

  const utils = trpc.useUtils();
  const statsQ = trpc.admin.usersStats.useQuery();
  const listQ = trpc.admin.usersList.useQuery({ limit: 50, search: search.trim() || undefined, status: statusFilter || undefined });

  const invalidateAll = () => { utils.admin.usersList.invalidate(); utils.admin.usersStats.invalidate(); };
  const suspendUser = trpc.admin.suspendUser.useMutation({ onSuccess: () => { invalidateAll(); setActionDone("Compte suspendu"); setTimeout(() => setActionDone(null), 2500); }, onError: (e) => alert(e.message) });
  const reactivateUser = trpc.admin.reactivateUser.useMutation({ onSuccess: () => { invalidateAll(); setActionDone("Compte réactivé"); setTimeout(() => setActionDone(null), 2500); }, onError: (e) => alert(e.message) });
  const requestDeletion = trpc.admin.requestUserDeletion.useMutation({ onSuccess: () => { setDeletionSent(true); setTimeout(() => setDeletionSent(false), 3000); }, onError: (e) => alert(e.message) });
  const contactUser = trpc.admin.contactUser.useMutation({ onSuccess: () => { setMsgText(""); setActionDone("Message envoyé"); setTimeout(() => { setActionDone(null); setContactModal(null); }, 1500); }, onError: (e) => alert(e.message) });
  const updateProfile = trpc.admin.updateUserProfile.useMutation({ onSuccess: () => { invalidateAll(); setEditModal(null); setActionDone("Profil mis à jour"); setTimeout(() => setActionDone(null), 2000); }, onError: (e) => alert(e.message) });

  const users = listQ.data ?? [];
  const profUser = profilModal ? users.find((u) => u.id === profilModal) : null;
  const contUser = contactModal ? users.find((u) => u.id === contactModal) : null;
  const editUser = editModal ? users.find((u) => u.id === editModal) : null;
  const confirmUser = confirmAction ? users.find((u) => u.id === confirmAction.userId) : null;

  function handleConfirmAction() {
    if (!confirmAction) return;
    const { userId, action } = confirmAction;
    if (action === "suspendre") suspendUser.mutate({ userId });
    if (action === "reactiver") reactivateUser.mutate({ userId });
    if (action === "supprimer") { setDeletionSent(false); requestDeletion.mutate({ userId }); }
    setConfirmAction(null);
    setProfilModal(null);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5 border-b border-white/5">
        <Link to="/superadmin" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 hover:text-[#D4AF37] transition-colors"><ChevronLeft size={12} /> Super Admin</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tighter italic">UTILISATEURS</h1>
            <p className="mt-1 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest opacity-80">{statsQ.data ? `${statsQ.data.total - statsQ.data.suspendus} COMPTES ACTIFS` : "…"}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 shadow-lg shadow-[#D4AF37]/5">
            <Users size={24} className="text-[#D4AF37]" />
          </div>
        </div>
      </div>

      {actionDone && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} /> {actionDone}
        </div>
      )}

      <div className="px-4 mt-6 grid grid-cols-4 gap-2">
        {[
          { l: "Total", v: statsQ.data ? String(statsQ.data.total) : "—", c: "text-[#D4AF37]" },
          { l: "Pros", v: statsQ.data ? String(statsQ.data.pros) : "—", c: "text-blue-400" },
          { l: "Nouveaux ce mois", v: statsQ.data ? String(statsQ.data.nouveauxCeMois) : "—", c: "text-green-400" },
          { l: "Suspendus", v: statsQ.data ? String(statsQ.data.suspendus) : "—", c: "text-red-400" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
            <p className={`text-xl font-black ${s.c} tracking-tighter`}>{s.v}</p>
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-2">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 focus-within:border-[#D4AF37]/50 transition-all">
          <Search size={16} className="text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou email..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20 font-medium" />
        </div>
        <div className="flex gap-2">
          {([["", "Tous"], ["active", "Actifs"], ["suspended", "Suspendus"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${statusFilter === v ? "bg-[#D4AF37] text-white" : "bg-white/5 text-white/40 border border-white/10"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {listQ.isLoading && <p className="text-center text-xs text-white/30 py-8">Chargement…</p>}
        {!listQ.isLoading && users.length === 0 && <p className="text-center text-xs text-white/30 py-8">Aucun utilisateur trouvé.</p>}
        {users.map((u) => {
          const isExp = expanded === u.id;
          const Icon = ROLE_ICONS[u.role] || Users;
          return (
            <div key={u.id} className={`rounded-3xl border transition-all duration-300 ${isExp ? "bg-white/10 border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/5" : "bg-white/5 border-white/10"}`}>
              <button onClick={() => setExpanded(isExp ? null : u.id)} className="w-full text-left p-4 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors ${isExp ? "bg-[#D4AF37] text-white" : "bg-white/5 text-[#D4AF37] border border-white/5"}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white tracking-tight truncate">{u.name}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-tighter ${u.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {u.status === "active" ? "actif" : u.status === "suspended" ? "suspendu" : "supprimé"}
                  </span>
                  <ChevronDown size={14} className={`text-white/20 transition-transform duration-300 ${isExp ? "rotate-180 text-[#D4AF37]" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Rôle</span>
                      <p className="text-xs font-black text-white mt-1">{ROLE_LABELS[u.role] || u.role}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Ville</span>
                      <p className="text-xs font-black text-white mt-1">{u.city || "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Annonces</span>
                      <p className="text-xs font-black text-[#D4AF37] mt-1">{u.annonces}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Inscrit le</span>
                      <p className="text-xs font-black text-white mt-1">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setProfilModal(u.id)} className="flex-1 rounded-2xl bg-[#D4AF37] py-3 text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition-all">Détails Profil</button>
                    <button onClick={() => { setContactModal(u.id); setMsgText(""); }} className="flex-1 rounded-2xl bg-white/5 border border-white/10 py-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all">Contacter</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modal Profil complet ── */}
      {profUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setProfilModal(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
            <div className="bg-[#111] rounded-t-2xl px-5 pt-5 pb-4 relative">
              <button onClick={() => setProfilModal(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16} className="text-white" /></button>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-[#D4AF37]/20 grid place-items-center">{(() => { const Icon = ROLE_ICONS[profUser.role] || Users; return <Icon size={24} className="text-[#D4AF37]" />; })()}</div>
                <div>
                  <h2 className="text-lg font-black text-white">{profUser.name}</h2>
                  <p className="text-xs text-white/60">{ROLE_LABELS[profUser.role] || profUser.role}</p>
                  <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[8px] font-bold ${profUser.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{profUser.status === "active" ? "actif" : "suspendu"}</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase">Contact</h3>
                  <button onClick={() => { setEditForm({ name: profUser.name, phone: profUser.phone ?? "", addressLine: profUser.addressLine ?? "", city: profUser.city ?? "", postalCode: profUser.postalCode ?? "" }); setEditModal(profUser.id); setProfilModal(null); }} className="text-[10px] font-bold text-[#D4AF37] underline">Modifier</button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><Mail size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{profUser.email}</span></div>
                  <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><Phone size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{profUser.phone || "Non renseigné"}</span></div>
                  <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><MapPin size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{[profUser.addressLine, profUser.postalCode, profUser.city].filter(Boolean).join(", ") || "Non renseignée"}</span></div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Activité</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Annonces</p><p className="text-sm font-black text-[#D4AF37]">{profUser.annonces}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Avis</p><p className="text-sm font-black text-blue-600">{profUser.reviewCount}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5 flex items-center gap-1"><Star size={12} className="text-amber-500" /><p className="text-sm font-black text-amber-500">{Number(profUser.rating) > 0 ? Number(profUser.rating).toFixed(1) : "—"}</p></div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Connexion</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5 flex items-center gap-2"><Calendar size={12} className="text-[#D4AF37]" /><div><p className="text-[9px] text-[#6B7280]">Inscrit le</p><p className="text-xs font-bold text-[#111]">{new Date(profUser.createdAt).toLocaleDateString("fr-FR")}</p></div></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5 flex items-center gap-2"><Calendar size={12} className="text-[#D4AF37]" /><div><p className="text-[9px] text-[#6B7280]">Dernière connexion</p><p className="text-xs font-bold text-[#111]">{profUser.dernierLogin ? new Date(profUser.dernierLogin).toLocaleDateString("fr-FR") : "Jamais"}</p></div></div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Actions</h3>
                <div className="space-y-2">
                  <button onClick={() => { setEditForm({ name: profUser.name, phone: profUser.phone ?? "", addressLine: profUser.addressLine ?? "", city: profUser.city ?? "", postalCode: profUser.postalCode ?? "" }); setEditModal(profUser.id); setProfilModal(null); }} className="w-full flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 active:scale-[0.98] transition"><Edit3 size={14} /> Modifier le profil</button>
                  {profUser.status === "active" ? (
                    <button onClick={() => setConfirmAction({ userId: profUser.id, action: "suspendre" })} className="w-full flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 active:scale-[0.98] transition"><Ban size={14} /> Suspendre le compte</button>
                  ) : (
                    <button onClick={() => setConfirmAction({ userId: profUser.id, action: "reactiver" })} className="w-full flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-xs font-bold text-green-700 active:scale-[0.98] transition"><CheckCircle size={14} /> Réactiver le compte</button>
                  )}
                  <button onClick={() => setConfirmAction({ userId: profUser.id, action: "supprimer" })} className="w-full flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 active:scale-[0.98] transition"><Trash2 size={14} /> Demander la suppression</button>
                  <button onClick={() => { setContactModal(profUser.id); setProfilModal(null); setMsgText(""); }} className="w-full flex items-center gap-2 rounded-lg bg-[#111] px-3 py-2.5 text-xs font-bold text-[#D4AF37] active:scale-[0.98] transition"><MessageSquare size={14} /> Envoyer un message</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Contacter ── */}
      {contUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setContactModal(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white" onClick={(ev) => ev.stopPropagation()}>
            <div className="bg-[#111] rounded-t-2xl px-5 pt-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-[#D4AF37]" />
                <div><h2 className="text-lg font-black text-white">Contacter</h2><p className="text-xs text-white/60">{contUser.name}</p></div>
              </div>
              <button onClick={() => setContactModal(null)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16} className="text-white" /></button>
            </div>
            <div className="p-5">
              {contactUser.isSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#111]">Notification envoyée</p>
                  <p className="text-xs text-[#6B7280] mt-1">{contUser.name} la recevra dans son espace</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5 mb-3">
                    <Mail size={14} className="text-[#D4AF37]" /><span className="text-xs text-[#6B7280]">{contUser.email}</span>
                  </div>
                  <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="Écrivez votre message..." rows={5} className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm outline-none focus:border-[#D4AF37] resize-none" />
                  <button disabled={!msgText.trim() || contactUser.isPending} onClick={() => contactUser.mutate({ userId: contUser.id, message: msgText.trim() })} className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition disabled:opacity-40"><Send size={16} /> Envoyer</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Modifier profil ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setEditModal(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
            <div className="bg-[#111] rounded-t-2xl px-5 pt-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3"><Edit3 size={20} className="text-[#D4AF37]" /><h2 className="text-lg font-black text-white">Modifier {editUser.name}</h2></div>
              <button onClick={() => setEditModal(null)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16} className="text-white" /></button>
            </div>
            <div className="p-5 space-y-3">
              {([
                ["Nom", "name"], ["Téléphone", "phone"], ["Adresse", "addressLine"], ["Ville", "city"], ["Code postal", "postalCode"],
              ] as const).map(([label, key]) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase">{label}</label>
                  <input value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" />
                </div>
              ))}
              <p className="text-[10px] text-[#6B7280]">L'email et le rôle ne se modifient pas depuis cet écran (identifiant de connexion).</p>
              <button disabled={updateProfile.isPending} onClick={() => updateProfile.mutate({ userId: editUser.id, ...editForm })} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition disabled:opacity-50">Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation action (suspendre/reactiver/supprimer) ── */}
      {confirmUser && confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setConfirmAction(null)}>
          <div className="w-[90%] max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(ev) => ev.stopPropagation()}>
            <div className={`mx-auto h-14 w-14 rounded-full grid place-items-center mb-3 ${confirmAction.action === "supprimer" ? "bg-red-50" : confirmAction.action === "suspendre" ? "bg-amber-50" : "bg-green-50"}`}>
              {confirmAction.action === "supprimer" ? <Trash2 size={24} className="text-red-500" /> : confirmAction.action === "suspendre" ? <Ban size={24} className="text-amber-500" /> : <CheckCircle size={24} className="text-green-500" />}
            </div>
            <h3 className="text-sm font-bold text-[#111]">
              {confirmAction.action === "supprimer" ? "Demander la suppression de ce compte ?" : confirmAction.action === "suspendre" ? "Suspendre ce compte ?" : "Réactiver ce compte ?"}
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">{confirmUser.name} — {confirmUser.email}</p>
            {confirmAction.action === "supprimer" && <p className="text-[10px] text-amber-600 mt-2 font-semibold flex items-center justify-center gap-1"><AlertTriangle size={12} /> Transmis à la Direction pour approbation</p>}
            {confirmAction.action === "suspendre" && <p className="text-[10px] text-[#6B7280] mt-2">L'accès est coupé immédiatement, même avec une session déjà ouverte.</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmAction(null)} className="flex-1 rounded-xl border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#6B7280]">Annuler</button>
              <button onClick={handleConfirmAction} className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white ${confirmAction.action === "supprimer" ? "bg-red-500" : confirmAction.action === "suspendre" ? "bg-amber-500" : "bg-green-500"}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {deletionSent && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-amber-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2">
          <AlertTriangle size={16} /> Demande de suppression envoyée à la Direction
        </div>
      )}
    </div>
  );
}
