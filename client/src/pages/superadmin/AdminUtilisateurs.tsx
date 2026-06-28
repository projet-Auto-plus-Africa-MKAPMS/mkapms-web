import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, Search, Shield, Car, Wrench, Key, UserCheck, ChevronDown, X, Phone, Mail, MapPin, Calendar, ShoppingBag, AlertTriangle, Trash2, Edit3, Ban, CheckCircle, MessageSquare, Send } from "lucide-react";

const USERS = [
  { id: 1, nom: "Martin D.", email: "martin.d@email.com", role: "particulier", ville: "Paris", annonces: 2, inscrit: "15/01/2025", statut: "actif", badge: "Verifice", tel: "06 12 34 56 78", adresse: "12 Rue de Rivoli, 75001 Paris", achats: 1, ventes: 2, note: 4.5, dernierLogin: "09/06/2026" },
  { id: 2, nom: "Sophie L.", email: "sophie.l@email.com", role: "particulier", ville: "Lyon", annonces: 1, inscrit: "22/02/2025", statut: "actif", badge: "Verifice", tel: "06 23 45 67 89", adresse: "5 Avenue Foch, 69006 Lyon", achats: 0, ventes: 1, note: 4.8, dernierLogin: "08/06/2026" },
  { id: 3, nom: "Garage Auto 93", email: "contact@auto93.fr", role: "pro_vente", ville: "Bobigny", annonces: 45, inscrit: "01/11/2024", statut: "actif", badge: "Pro Premium", tel: "01 48 12 34 56", adresse: "23 Av. Paul Vaillant-Couturier, 93000 Bobigny", achats: 12, ventes: 89, note: 4.2, dernierLogin: "09/06/2026" },
  { id: 4, nom: "Garage Express", email: "info@express.fr", role: "garage", ville: "Paris 12e", annonces: 0, inscrit: "05/12/2024", statut: "actif", badge: "Garage Elite", tel: "01 43 56 78 90", adresse: "8 Rue de Bercy, 75012 Paris", achats: 0, ventes: 0, note: 4.6, dernierLogin: "07/06/2026" },
  { id: 5, nom: "Ahmed K.", email: "ahmed.k@email.com", role: "particulier", ville: "Marseille", annonces: 3, inscrit: "10/03/2025", statut: "actif", badge: "", tel: "06 34 56 78 90", adresse: "15 Bd Longchamp, 13001 Marseille", achats: 2, ventes: 3, note: 3.9, dernierLogin: "06/06/2026" },
  { id: 6, nom: "LuxDrive VTC", email: "contact@luxdrive.fr", role: "vtc", ville: "Paris", annonces: 12, inscrit: "15/01/2025", statut: "actif", badge: "VTC Premium", tel: "01 55 66 77 88", adresse: "100 Av. des Champs-Elysees, 75008 Paris", achats: 8, ventes: 5, note: 4.7, dernierLogin: "09/06/2026" },
  { id: 7, nom: "Pierre M.", email: "pierre.m@email.com", role: "particulier", ville: "Bordeaux", annonces: 0, inscrit: "20/04/2025", statut: "suspendu", badge: "", tel: "06 45 67 89 01", adresse: "3 Place Gambetta, 33000 Bordeaux", achats: 0, ventes: 0, note: 0, dernierLogin: "01/05/2025" },
  { id: 8, nom: "Carrosserie Saint-Denis", email: "contact@carrosserie-sd.fr", role: "carrosserie", ville: "Saint-Denis", annonces: 0, inscrit: "10/02/2025", statut: "actif", badge: "Pro", tel: "01 49 33 22 11", adresse: "45 Rue de la Republique, 93200 Saint-Denis", achats: 3, ventes: 0, note: 4.1, dernierLogin: "08/06/2026" },
];

const ROLE_ICONS: Record<string, typeof Users> = { particulier: Users, pro_vente: Car, garage: Wrench, vtc: Key, carrosserie: Shield };
const ROLE_LABELS: Record<string, string> = { particulier: "Particulier", pro_vente: "Professionnel Vente", garage: "Garage / Atelier", vtc: "VTC / Taxi", carrosserie: "Carrosserie" };

export default function AdminUtilisateurs() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [profilModal, setProfilModal] = useState<number | null>(null);
  const [contactModal, setContactModal] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: number; action: "suspendre" | "reactiver" | "supprimer" } | null>(null);
  const [editModal, setEditModal] = useState<number | null>(null);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [usersState, setUsersState] = useState(USERS);
  const [editedUser, setEditedUser] = useState<any>(null);

  const filtered = usersState.filter((u) => u.nom.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const profUser = profilModal ? usersState.find((u) => u.id === profilModal) : null;
  const contUser = contactModal ? usersState.find((u) => u.id === contactModal) : null;
  const editUser = editModal ? usersState.find((u) => u.id === editModal) : null;
  const confirmUser = confirmAction ? usersState.find((u) => u.id === confirmAction.userId) : null;

  function handleConfirmAction() {
    if (!confirmAction) return;
    const { userId, action } = confirmAction;
    setUsersState((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      if (action === "suspendre") return { ...u, statut: "suspendu" };
      if (action === "reactiver") return { ...u, statut: "actif" };
      return u;
    }).filter((u) => !(action === "supprimer" && u.id === userId)));
    setActionDone(action === "suspendre" ? "Compte suspendu" : action === "reactiver" ? "Compte réactivé" : "Compte supprimé");
    setConfirmAction(null);
    setProfilModal(null);
    setTimeout(() => setActionDone(null), 2500);
  }

  function handleSendMsg() {
    if (!msgText.trim()) return;
    setMsgSent(true);
    setMsgText("");
    setTimeout(() => { setMsgSent(false); setContactModal(null); }, 1800);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5 border-b border-white/5">
        <Link to="/superadmin" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 hover:text-[#D4AF37] transition-colors"><ChevronLeft size={12} /> Super Admin</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tighter italic">UTILISATEURS</h1>
            <p className="mt-1 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest opacity-80">{usersState.filter((u) => u.statut === "actif").length} COMPTES ACTIFS</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 shadow-lg shadow-[#D4AF37]/5">
            <Users size={24} className="text-[#D4AF37]" />
          </div>
        </div>
      </div>

      {/* Toast */}
      {actionDone && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} /> {actionDone}
        </div>
      )}

      <div className="px-4 mt-6 grid grid-cols-4 gap-2">
        {[
          { l: "Total", v: String(usersState.length), c: "text-[#D4AF37]" },
          { l: "Pros", v: String(usersState.filter((u) => u.role !== "particulier").length), c: "text-blue-400" },
          { l: "Nouveaux", v: "+89", c: "text-green-400" },
          { l: "Suspendus", v: String(usersState.filter((u) => u.statut === "suspendu").length), c: "text-red-400" },
        ].map((s) => (
          <button key={s.l} className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center active:scale-[0.97] transition-all hover:border-[#D4AF37]/30">
            <p className={`text-xl font-black ${s.c} tracking-tighter`}>{s.v}</p>
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">{s.l}</p>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 focus-within:border-[#D4AF37]/50 transition-all">
          <Search size={16} className="text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou email..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20 font-medium" />
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {filtered.map((u) => {
          const isExp = expanded === u.id;
          const Icon = ROLE_ICONS[u.role] || Users;
          return (
            <div key={u.id} className={`rounded-3xl border transition-all duration-300 ${isExp ? "bg-white/10 border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/5" : "bg-white/5 border-white/10"}`}>
              <button onClick={() => setExpanded(isExp ? null : u.id)} className="w-full text-left p-4 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors ${isExp ? "bg-[#D4AF37] text-white" : "bg-white/5 text-[#D4AF37] border border-white/5"}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white tracking-tight">{u.nom}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-tighter ${u.statut === "actif" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {u.statut}
                  </span>
                  <ChevronDown size={14} className={`text-white/20 transition-transform duration-300 ${isExp ? "rotate-180 text-[#D4AF37]" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Rôle</span>
                      <p className="text-xs font-black text-white mt-1">{ROLE_LABELS[u.role] || u.role}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Ville</span>
                      <p className="text-xs font-black text-white mt-1">{u.ville}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Annonces</span>
                      <p className="text-xs font-black text-[#D4AF37] mt-1">{u.annonces}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Inscrit le</span>
                      <p className="text-xs font-black text-white mt-1">{u.inscrit}</p>
                    </div>
                  </div>
                  {u.badge && (
                    <div className="mt-4 flex justify-center">
                      <span className="rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-4 py-1.5 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                        ⭐ {u.badge}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setProfilModal(u.id)} className="flex-1 rounded-2xl bg-[#D4AF37] py-3 text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition-all">Détails Profil</button>
                    <button onClick={() => setContactModal(u.id)} className="flex-1 rounded-2xl bg-white/5 border border-white/10 py-3 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all">Contacter</button>
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
                  <h2 className="text-lg font-black text-white">{profUser.nom}</h2>
                  <p className="text-xs text-white/60">{ROLE_LABELS[profUser.role] || profUser.role}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${profUser.statut === "actif" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{profUser.statut}</span>
                    {profUser.badge && <span className="rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[8px] font-bold text-[#D4AF37]">{profUser.badge}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Formulaire de modification */}
              {editModal === profUser.id ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Modifier le profil</h3>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase">Nom / Enseigne</label>
                    <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedUser?.nom} onChange={(e) => setEditedUser({ ...editedUser, nom: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase">Email</label>
                      <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedUser?.email} onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase">Téléphone</label>
                      <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedUser?.tel} onChange={(e) => setEditedUser({ ...editedUser, tel: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase">Adresse</label>
                    <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedUser?.adresse} onChange={(e) => setEditedUser({ ...editedUser, adresse: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase">Ville</label>
                      <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedUser?.ville} onChange={(e) => setEditedUser({ ...editedUser, ville: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase">Badge</label>
                      <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedUser?.badge} onChange={(e) => setEditedUser({ ...editedUser, badge: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setEditModal(null)} className="flex-1 rounded-lg border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#6B7280]">Annuler</button>
                    <button onClick={() => { setUsersState(prev => prev.map(u => u.id === editedUser.id ? editedUser : u)); setEditModal(null); setActionDone("Profil mis à jour"); setTimeout(() => setActionDone(null), 2000); }} className="flex-1 rounded-lg bg-[#D4AF37] py-2.5 text-xs font-bold text-white">Enregistrer</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Contact */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-[#6B7280] uppercase">Contact</h3>
                      <button onClick={() => { setEditedUser(profUser); setEditModal(profUser.id); }} className="text-[10px] font-bold text-[#D4AF37] underline">Modifier</button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><Mail size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{profUser.email}</span></div>
                      <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><Phone size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{profUser.tel}</span></div>
                      <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><MapPin size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{profUser.adresse}</span></div>
                    </div>
                  </div>
                </>
              )}

              {/* Statistiques */}
              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Activite</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Annonces</p><p className="text-sm font-black text-[#D4AF37]">{profUser.annonces}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Achats</p><p className="text-sm font-black text-blue-600">{profUser.achats}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Ventes</p><p className="text-sm font-black text-green-600">{profUser.ventes}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Note</p><p className="text-sm font-black text-amber-500">{profUser.note > 0 ? `${profUser.note}/5` : "—"}</p></div>
                </div>
              </div>

              {/* Info inscription */}
              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Inscription</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5 flex items-center gap-2"><Calendar size={12} className="text-[#D4AF37]" /><div><p className="text-[9px] text-[#6B7280]">Inscrit le</p><p className="text-xs font-bold text-[#111]">{profUser.inscrit}</p></div></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5 flex items-center gap-2"><Calendar size={12} className="text-[#D4AF37]" /><div><p className="text-[9px] text-[#6B7280]">Derniere connexion</p><p className="text-xs font-bold text-[#111]">{profUser.dernierLogin}</p></div></div>
                </div>
              </div>

              {/* Actions admin */}
              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Actions</h3>
                <div className="space-y-2">
                  <button onClick={() => { setEditModal(profUser.id); setProfilModal(null); }} className="w-full flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 active:scale-[0.98] transition"><Edit3 size={14} /> Modifier le profil</button>
                  {profUser.statut === "actif" ? (
                    <button onClick={() => setConfirmAction({ userId: profUser.id, action: "suspendre" })} className="w-full flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 active:scale-[0.98] transition"><Ban size={14} /> Suspendre le compte</button>
                  ) : (
                    <button onClick={() => setConfirmAction({ userId: profUser.id, action: "reactiver" })} className="w-full flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-xs font-bold text-green-700 active:scale-[0.98] transition"><CheckCircle size={14} /> Reactiver le compte</button>
                  )}
                  <button onClick={() => setConfirmAction({ userId: profUser.id, action: "supprimer" })} className="w-full flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 active:scale-[0.98] transition"><Trash2 size={14} /> Supprimer le compte</button>
                  <button onClick={() => { setContactModal(profUser.id); setProfilModal(null); setMsgText(""); setMsgSent(false); }} className="w-full flex items-center gap-2 rounded-lg bg-[#111] px-3 py-2.5 text-xs font-bold text-[#D4AF37] active:scale-[0.98] transition"><MessageSquare size={14} /> Envoyer un message</button>
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
                <div><h2 className="text-lg font-black text-white">Contacter</h2><p className="text-xs text-white/60">{contUser.nom}</p></div>
              </div>
              <button onClick={() => setContactModal(null)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16} className="text-white" /></button>
            </div>
            <div className="p-5">
              {msgSent ? (
                <div className="text-center py-8">
                  <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#111]">Message envoye !</p>
                  <p className="text-xs text-[#6B7280] mt-1">{contUser.nom} recevra votre message</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5 mb-3">
                    <Mail size={14} className="text-[#D4AF37]" /><span className="text-xs text-[#6B7280]">{contUser.email}</span>
                  </div>
                  <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="Ecrivez votre message..." rows={5} className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm outline-none focus:border-[#D4AF37] resize-none" />
                  <button onClick={handleSendMsg} disabled={!msgText.trim()} className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition disabled:opacity-40"><Send size={16} /> Envoyer</button>
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
              <div className="flex items-center gap-3"><Edit3 size={20} className="text-[#D4AF37]" /><h2 className="text-lg font-black text-white">Modifier {editUser.nom}</h2></div>
              <button onClick={() => setEditModal(null)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16} className="text-white" /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Nom", key: "nom", val: editUser.nom },
                { label: "Email", key: "email", val: editUser.email },
                { label: "Telephone", key: "tel", val: editUser.tel },
                { label: "Ville", key: "ville", val: editUser.ville },
                { label: "Adresse", key: "adresse", val: editUser.adresse },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] font-bold text-[#6B7280] uppercase">{f.label}</label>
                  <input defaultValue={f.val} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Role</label>
                <select defaultValue={editUser.role} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]">
                  <option value="particulier">Particulier</option>
                  <option value="pro_vente">Professionnel Vente</option>
                  <option value="garage">Garage / Atelier</option>
                  <option value="vtc">VTC / Taxi</option>
                  <option value="carrosserie">Carrosserie</option>
                </select>
              </div>
              <button onClick={() => { setActionDone("Profil modifie"); setEditModal(null); setTimeout(() => setActionDone(null), 2500); }} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] transition">Sauvegarder</button>
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
              {confirmAction.action === "supprimer" ? "Supprimer ce compte ?" : confirmAction.action === "suspendre" ? "Suspendre ce compte ?" : "Reactiver ce compte ?"}
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">{confirmUser.nom} — {confirmUser.email}</p>
            {confirmAction.action === "supprimer" && <p className="text-[10px] text-red-500 mt-2 font-semibold flex items-center justify-center gap-1"><AlertTriangle size={12} /> Cette action est irreversible</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmAction(null)} className="flex-1 rounded-xl border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#6B7280]">Annuler</button>
              <button onClick={handleConfirmAction} className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white ${confirmAction.action === "supprimer" ? "bg-red-500" : confirmAction.action === "suspendre" ? "bg-amber-500" : "bg-green-500"}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
