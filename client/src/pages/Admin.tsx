import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { isAdmin, isDirection } from "@shared/roles";
import { Eye, Pencil, Trash2, Pause, Play, ChevronDown, ChevronUp, X, Car, Wrench, FileText, CreditCard, Calendar, MessageSquare, ShieldAlert, Users, Layout, Settings, LogOut, TrendingUp, Package, Truck, ShieldCheck, MapPin } from "lucide-react";

export default function Admin() {
  const { user, isSessionLoading } = useAuth();
  const enabled = true; // Forcé pour debug
  const direction = true; // Forcé pour debug

  const stats = trpc.admin.stats.useQuery(undefined, { enabled });
  const dashboard = trpc.admin.dashboard.useQuery(undefined, { enabled });
  const disputesList = trpc.disputes.listAll.useQuery(undefined, { enabled });
  const annoncesPending = trpc.admin.annoncesPending.useQuery(undefined, { enabled });
  const [annoncesFilter, setAnnoncesFilter] = useState<"vente" | "location" | undefined>(undefined);
  const annoncesAll = trpc.admin.annoncesAll.useQuery({ limit: 50, offset: 0, type: annoncesFilter }, { enabled });
  const garagesPending = trpc.admin.garagesPending.useQuery(undefined, { enabled });
  const kycPending = trpc.admin.kycPending.useQuery(undefined, { enabled });
  const payments = trpc.admin.paymentsList.useQuery({ limit: 20 }, { enabled });
  const reservations = trpc.admin.reservationsList.useQuery({ limit: 20 }, { enabled });
  const staffList = trpc.admin.staffList.useQuery(undefined, { enabled: direction });
  const promoList = trpc.admin.promoList.useQuery(undefined, { enabled });
  const usersList = trpc.admin.usersList.useQuery({ limit: 30, offset: 0 }, { enabled });
  const deletionRequests = trpc.admin.deletionRequests.useQuery(undefined, { enabled });
  const modulesList = trpc.modules.list.useQuery(undefined, { enabled: direction });
  const kpis = trpc.admin.kpis.useQuery(undefined, { enabled });
  const ticketsListQ = trpc.admin.ticketsList.useQuery(undefined, { enabled });

  const utils = trpc.useUtils();
  const moderate = trpc.admin.moderateAnnonce.useMutation({ onSuccess: () => { utils.admin.annoncesPending.invalidate(); utils.admin.annoncesAll.invalidate(); } });
  const validateGarage = trpc.admin.validateGarage.useMutation({ onSuccess: () => utils.admin.garagesPending.invalidate() });
  const validateKyc = trpc.admin.validateKyc.useMutation({ onSuccess: () => utils.admin.kycPending.invalidate() });
  const createStaff = trpc.admin.createStaff.useMutation({
    onSuccess: () => { utils.admin.staffList.invalidate(); setStaff({ email: "", name: "", password: "", role: "employee", poste: "" }); },
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => utils.admin.staffList.invalidate() });
  const respondTicket = trpc.support.respond.useMutation({ onSuccess: () => { utils.admin.ticketsList.invalidate(); setTicketReply({}); } });
  const setTicketStatus = trpc.support.setStatus.useMutation({ onSuccess: () => utils.admin.ticketsList.invalidate() });
  const decideDeletion = trpc.admin.decideDeletion.useMutation({
    onSuccess: () => { utils.admin.deletionRequests.invalidate(); utils.admin.usersList.invalidate(); },
  });
  const requestDeletion = trpc.admin.requestUserDeletion.useMutation({ onSuccess: () => utils.admin.deletionRequests.invalidate() });

  const [staff, setStaff] = useState({ email: "", name: "", password: "", role: "employee" as "employee" | "admin", poste: "" });
  const [ticketReply, setTicketReply] = useState<Record<number, string>>({});
  const [selectedAnnonce, setSelectedAnnonce] = useState<any>(null);
  const [adminTab, setAdminTab] = useState<"backoffice" | "superadmin" | "direction">(() => {
    const saved = localStorage.getItem("mka_admin_tab");
    return (saved as any) || "backoffice";
  });
  const navigate = useNavigate();

  const changeTab = (tab: "backoffice" | "superadmin" | "direction") => {
    setAdminTab(tab);
    localStorage.setItem("mka_admin_tab", tab);
  };

  // if (isSessionLoading) {
  //   return <div className="min-h-screen bg-[#111] py-16 text-center text-white/50">Chargement...</div>;
  // }
  // if (!enabled) {
  //   return (
  //     <div className="min-h-screen bg-[#111] py-16 text-center">
  //       <p className="text-white/50">Accès réservé au back-office.</p>
  //       <Link to="/" className="btn-primary mt-4 inline-flex">Retour</Link>
  //     </div>
  //   );
  // }

  const eur = (v: any) => (v != null ? `${Number(v).toLocaleString("fr-FR")} €` : "—");

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Header Admin */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
	            <div className="flex items-center justify-between w-full gap-4">
	              <div className="flex items-center gap-3 shrink-0">
	                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
	                  <Layout size={20} className="text-black" />
	                </div>
	                <div>
	                  <h1 className="text-sm font-black uppercase tracking-tighter text-white">Espace Gestion</h1>
	                  <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest opacity-80">MKA.P-MS Administration</p>
	                </div>
	              </div>
	              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
	                <button onClick={() => changeTab("backoffice")} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${adminTab === "backoffice" ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20" : "text-white/40 hover:text-white"}`}>Back-office</button>
	                <button onClick={() => changeTab("superadmin")} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${adminTab === "superadmin" ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20" : "text-white/40 hover:text-white"}`}>Super Admin</button>
	                {direction && (
	                  <button onClick={() => changeTab("direction")} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${adminTab === "direction" ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20" : "text-white/40 hover:text-white"}`}>Direction</button>
	                )}
	              </div>
	            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* ═══════ ONGLET SUPER ADMIN ═══════ */}
        {adminTab === "superadmin" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                Tableau de Bord Global
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {[
                  { l: "Utilisateurs", v: stats.data?.users, icon: <Users size={20} />, path: "/superadmin/admin-utilisateurs" },
                  { l: "Annonces", v: stats.data?.annonces, icon: <Car size={20} />, path: "/superadmin/admin-moderation-annonces" },
                  { l: "Garages", v: stats.data?.garages, icon: <Wrench size={20} />, path: "/superadmin/admin-garage" },
                  { l: "Abonnements", v: stats.data?.subscriptions, icon: <CreditCard size={20} />, path: "/superadmin/admin-abonnements" },
                  { l: "Paiements", v: stats.data?.payments, icon: <TrendingUp size={20} />, path: "/superadmin/admin-paiements" },
                ].map((c) => (
                  <button key={c.l} onClick={() => navigate(c.path)} className="group flex flex-col items-center justify-center rounded-2xl bg-[#1A1A1A] p-6 text-center border border-white/5 hover:border-[#D4AF37] transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-[#D4AF37] mb-3 group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                      {c.icon}
                    </div>
                    <div className="text-2xl font-black text-white">{c.v ?? "—"}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{c.l}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                Accès Rapide aux Modules
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
                {[
                  { label: "Atelier Pro", to: "/atelier-pro", emoji: "🛠️" },
                  { label: "Comptabilité", to: "/superadmin/comptabilite-complete", emoji: "💹" },
                  { label: "Suivi Véhicule", to: "/suivi-vehicule", emoji: "📍" },
                  { label: "Enchères Pro", to: "/encheres", emoji: "🔨" },
                  { label: "Dossier Client", to: "/dossier-client", emoji: "📁" },
                  { label: "Dossier Véhicule", to: "/dossier-vehicule-numerique", emoji: "📝" },
	                  { label: "Notifications", to: "/notifications", emoji: "🔔" },
	                  { label: "Abonnements", to: "/superadmin/admin-abonnements", emoji: "💳" },
	                  { label: "Atelier Mécanique", to: "/atelier-pro", emoji: "🔧" },
	                  { label: "Enchères Pro", to: "/encheres", emoji: "⚖️" },
	                  { label: "Logistique & Transport", to: "/livraison", emoji: "🚚" },
	                  { label: "Centre de Documents", to: "/dossier-client", emoji: "📄" },
	                  { label: "RH & Recrutement", to: "/superadmin/admin-utilisateurs", emoji: "👥" },
	                  { label: "Publicité & Marketing", to: "/superadmin/admin-paiements", emoji: "📢" },
	                  { label: "API Partenaires", to: "/superadmin/admin-utilisateurs", emoji: "🔗" },
	                ].map((s) => (
                  <Link key={s.to} to={s.to} className="group flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-[#1A1A1A] p-5 text-center transition-all hover:border-[#D4AF37]">
                    <div className="text-2xl">{s.emoji}</div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-[#D4AF37]">{s.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ═══════ ONGLET DIRECTION ═══════ */}
        {adminTab === "direction" && direction && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                Centre de Commandement PDG
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                {[
                  { l: "CA du jour", v: eur(dashboard.data?.caJour), icon: <TrendingUp size={18} />, path: "/superadmin/comptabilite-complete" },
                  { l: "CA semaine", v: eur(dashboard.data?.caSemaine), icon: <TrendingUp size={18} />, path: "/superadmin/comptabilite-complete" },
                  { l: "CA du mois", v: eur(dashboard.data?.caMois), icon: <TrendingUp size={18} />, path: "/superadmin/comptabilite-complete" },
                  { l: "Bénéfice", v: eur(dashboard.data?.beneficeEstime), icon: <ShieldCheck size={18} />, path: "/superadmin/comptabilite-complete" },
                  { l: "Commissions", v: eur(dashboard.data?.commissionsMois), icon: <CreditCard size={18} />, path: "/superadmin/comptabilite-complete" },
	                  { l: "Litiges", v: dashboard.data?.litigesOuverts, icon: <ShieldAlert size={18} />, path: "/superadmin/admin-litiges", alert: !!dashboard.data?.litigesOuverts },
	                  { l: "Stock MKA", v: stats.data?.annonces, icon: <Package size={18} />, path: "/superadmin/admin-moderation-annonces" },
	                  { l: "Réseau Garages", v: stats.data?.garages, icon: <MapPin size={18} />, path: "/superadmin/admin-garage" },
	                ].map((c) => (
                  <button key={c.l} onClick={() => navigate(c.path)} className={`flex flex-col items-center justify-center rounded-2xl bg-[#1A1A1A] p-5 border border-white/5 hover:border-[#D4AF37] transition-all ${c.alert ? "ring-1 ring-red-500/50" : ""}`}>
                    <div className={`mb-2 ${c.alert ? "text-red-500" : "text-[#D4AF37]"}`}>{c.icon}</div>
                    <div className="text-sm font-black text-white">{c.v ?? "—"}</div>
                    <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">{c.l}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                Gestion de l'Équipe Interne
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-6">
                  <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-4">Ajouter un Collaborateur</h3>
                  <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); createStaff.mutate(staff); }}>
                    <input className="w-full rounded-xl bg-white/5 border-none text-xs font-bold text-white px-4 py-3 focus:ring-1 focus:ring-[#D4AF37]" placeholder="Nom complet" value={staff.name} onChange={e => setStaff({...staff, name: e.target.value})} />
                    <input className="w-full rounded-xl bg-white/5 border-none text-xs font-bold text-white px-4 py-3 focus:ring-1 focus:ring-[#D4AF37]" placeholder="Email professionnel" value={staff.email} onChange={e => setStaff({...staff, email: e.target.value})} />
                    <input className="w-full rounded-xl bg-white/5 border-none text-xs font-bold text-white px-4 py-3 focus:ring-1 focus:ring-[#D4AF37]" placeholder="Poste / Fonction" value={staff.poste} onChange={e => setStaff({...staff, poste: e.target.value})} />
                    <button className="w-full py-3 rounded-xl bg-[#D4AF37] text-xs font-black text-black uppercase tracking-widest hover:bg-white transition-all">Enregistrer</button>
                  </form>
                </div>
                <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-6 overflow-y-auto max-h-[400px]">
                  <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-4">Membres de l'Équipe</h3>
                  <div className="space-y-3">
                    {staffList.data?.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <div className="text-xs font-black text-white uppercase">{s.name}</div>
                          <div className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest">{s.poste || s.role}</div>
                        </div>
                        <button onClick={() => { if(confirm("Supprimer ce membre ?")) deleteUser.mutate({ userId: s.id }); }} className="text-white/20 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══════ ONGLET BACK-OFFICE ═══════ */}
        {adminTab === "backoffice" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Litiges */}
              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Litiges en cours
                </h2>
                <div className="space-y-4">
                  {disputesList.data?.map((d) => (
                    <div key={d.id} className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-5 hover:border-[#D4AF37] transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-white uppercase">{d.reference ?? `#${d.id}`}</span>
                        <span className="text-[9px] font-black text-amber-500 uppercase bg-amber-500/10 px-2 py-1 rounded-full">{d.status}</span>
                      </div>
                      <p className="text-[10px] text-white/60 mb-4 line-clamp-2">"{d.description}"</p>
                      <div className="flex gap-2">
                        <button onClick={() => navigate("/superadmin/admin-litiges")} className="flex-1 py-2 rounded-lg bg-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all">Gérer</button>
                      </div>
                    </div>
                  ))}
                  {disputesList.data?.length === 0 && <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-white/20 text-[10px] font-black uppercase tracking-widest">Aucun litige</div>}
                </div>
              </section>

              {/* Modération */}
              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                  À Valider
                </h2>
                <div className="space-y-3">
                  {/* Annonces */}
                  {annoncesPending.data?.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1A1A1A] border border-white/5">
                      <div className="flex items-center gap-3">
                        <Car size={16} className="text-[#D4AF37]" />
                        <span className="text-xs font-black text-white uppercase truncate max-w-[150px]">{a.titre}</span>
                      </div>
                      <button onClick={() => moderate.mutate({ id: a.id, action: "publiee" })} className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[9px] font-black text-black uppercase tracking-widest hover:bg-white transition-all">Publier</button>
                    </div>
                  ))}
                  {/* Garages */}
                  {garagesPending.data?.slice(0, 2).map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1A1A1A] border border-white/5">
                      <div className="flex items-center gap-3">
                        <Wrench size={16} className="text-[#D4AF37]" />
                        <span className="text-xs font-black text-white uppercase truncate max-w-[150px]">{g.name}</span>
                      </div>
                      <button onClick={() => validateGarage.mutate({ id: g.id, action: "valide" })} className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[9px] font-black text-black uppercase tracking-widest hover:bg-white transition-all">Valider</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Support Client */}
            <section className="mt-12">
              <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                Support & Assistance
              </h2>
              <div className="grid gap-4">
                {ticketsListQ.data?.slice(0, 3).map((t) => (
                  <div key={t.id} className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-6 hover:border-[#D4AF37] transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xs font-black text-white uppercase">{t.sujet}</div>
                        <div className="text-[9px] font-bold text-white/40 uppercase mt-0.5">{t.contactEmail}</div>
                      </div>
                      <span className="text-[9px] font-black text-amber-500 uppercase bg-amber-500/10 px-2 py-1 rounded-full">{t.status}</span>
                    </div>
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const txt = ticketReply[t.id]?.trim(); if (txt) respondTicket.mutate({ id: t.id, response: txt, status: "resolu" }); }}>
                      <input className="flex-1 rounded-xl bg-white/5 border-none text-xs font-bold text-white px-4 py-2 focus:ring-1 focus:ring-[#D4AF37]" placeholder="Répondre..." value={ticketReply[t.id] ?? ""} onChange={e => setTicketReply(s => ({ ...s, [t.id]: e.target.value }))} />
                      <button className="px-6 py-2 rounded-xl bg-[#D4AF37] text-[9px] font-black text-black uppercase tracking-widest hover:bg-white transition-all">Envoyer</button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
