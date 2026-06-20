import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, Search, Shield, Car, Wrench, Key, UserCheck, ChevronDown } from "lucide-react";

const USERS = [
  { id: 1, nom: "Martin D.", email: "martin.d@email.com", role: "particulier", ville: "Paris", annonces: 2, inscrit: "15/01/2025", statut: "actif", badge: "Verifice" },
  { id: 2, nom: "Sophie L.", email: "sophie.l@email.com", role: "particulier", ville: "Lyon", annonces: 1, inscrit: "22/02/2025", statut: "actif", badge: "Verifice" },
  { id: 3, nom: "Garage Auto 93", email: "contact@auto93.fr", role: "pro_vente", ville: "Bobigny", annonces: 45, inscrit: "01/11/2024", statut: "actif", badge: "Pro Premium" },
  { id: 4, nom: "Garage Express", email: "info@express.fr", role: "garage", ville: "Paris 12e", annonces: 0, inscrit: "05/12/2024", statut: "actif", badge: "Garage Elite" },
  { id: 5, nom: "Ahmed K.", email: "ahmed.k@email.com", role: "particulier", ville: "Marseille", annonces: 3, inscrit: "10/03/2025", statut: "actif", badge: "" },
  { id: 6, nom: "LuxDrive VTC", email: "contact@luxdrive.fr", role: "vtc", ville: "Paris", annonces: 12, inscrit: "15/01/2025", statut: "actif", badge: "VTC Premium" },
  { id: 7, nom: "Pierre M.", email: "pierre.m@email.com", role: "particulier", ville: "Bordeaux", annonces: 0, inscrit: "20/04/2025", statut: "suspendu", badge: "" },
  { id: 8, nom: "Carrosserie Saint-Denis", email: "contact@carrosserie-sd.fr", role: "carrosserie", ville: "Saint-Denis", annonces: 0, inscrit: "10/02/2025", statut: "actif", badge: "Pro" },
];

const ROLE_ICONS: Record<string, typeof Users> = { particulier: Users, pro_vente: Car, garage: Wrench, vtc: Key, carrosserie: Shield };

export default function AdminUtilisateurs() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = USERS.filter((u) => u.nom.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Utilisateurs</h1>
        <p className="mt-1 text-xs text-white/50">{USERS.length} comptes actifs</p>
      </div>

      {/* Stats */}
      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {[
          { l: "Total", v: "12 450", c: "text-[#D4AF37]" },
          { l: "Pros", v: "342", c: "text-blue-500" },
          { l: "Nouveaux", v: "+89", c: "text-green-500" },
          { l: "Suspendus", v: "12", c: "text-red-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." className="flex-1 text-sm outline-none" />
        </div>
      </div>

      {/* Liste */}
      <div className="px-4 mt-3 space-y-2">
        {filtered.map((u) => {
          const isExp = expanded === u.id;
          const Icon = ROLE_ICONS[u.role] || Users;
          return (
            <div key={u.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : u.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#D4AF37]/10 grid place-items-center shrink-0"><Icon size={16} className="text-[#D4AF37]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{u.nom}</p>
                  <p className="text-[10px] text-[#6B7280]">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${u.statut === "actif" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{u.statut}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Role</span><p className="font-bold text-[#111]">{u.role}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Ville</span><p className="font-bold text-[#111]">{u.ville}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Annonces</span><p className="font-bold text-[#D4AF37]">{u.annonces}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Inscrit le</span><p className="font-bold text-[#111]">{u.inscrit}</p></div>
                  </div>
                  {u.badge && <span className="mt-2 inline-block rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[9px] font-bold text-[#D4AF37]">{u.badge}</span>}
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Voir profil</button>
                    <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Contacter</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
