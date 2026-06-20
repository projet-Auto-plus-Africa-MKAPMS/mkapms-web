import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, BarChart3, TrendingUp, TrendingDown, Euro, CreditCard,
  Users, Clock, Bell, AlertTriangle, CheckCircle, Eye, Download,
  Car, Key, Wrench, Gavel, Megaphone, FileText, Calendar,
  Target, Award, Shield, ArrowUp, ArrowDown, UserCheck
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   COMPTABILITE MKA.P-MS — TABLEAU DE BORD DIRIGEANT
   CA par univers, suivi financier, employes, alertes automatiques.
   Le PDG pilote toute l'activite depuis un seul tableau de bord.
   ══════════════════════════════════════════════════════════════════════════ */

type CompTab = "ca" | "finances" | "employes" | "alertes";

export default function ComptaDirigeant() {
  const [tab, setTab] = useState<CompTab>("ca");
  const [periode, setPeriode] = useState<"jour" | "semaine" | "mois" | "annee">("mois");
  const [expandedUnivers, setExpandedUnivers] = useState<string | null>(null);
  const [expandedFinance, setExpandedFinance] = useState<string | null>(null);
  const [expandedEmploye, setExpandedEmploye] = useState<number | null>(null);
  const [expandedAlerte, setExpandedAlerte] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Tableau de bord dirigeant</h1>
        <p className="mt-0.5 text-sm text-white/60">Pilotez toute l'activite MKA.P-MS</p>

        {/* CA Total */}
        <div className="mt-4 rounded-xl bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Chiffre d'affaires total</p>
              <p className="text-2xl font-black text-[#D4AF37]">287 450 EUR</p>
              <p className="text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +12.4% vs mois precedent</p>
            </div>
            <div className="flex gap-1">
              {(["jour", "semaine", "mois", "annee"] as const).map((p) => (
                <button key={p} onClick={() => setPeriode(p)} className={`rounded-lg px-2 py-1 text-[9px] font-bold ${periode === p ? "bg-[#D4AF37] text-white" : "bg-white/10 text-white/50"}`}>
                  {p === "jour" ? "J" : p === "semaine" ? "S" : p === "mois" ? "M" : "A"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          { id: "ca" as CompTab, label: "Chiffre d'affaires", icon: Euro },
          { id: "finances" as CompTab, label: "Suivi financier", icon: CreditCard },
          { id: "employes" as CompTab, label: "Employes", icon: Users },
          { id: "alertes" as CompTab, label: "Alertes", icon: Bell },
        ]).map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        {/* ━━━━━ CA PAR UNIVERS ━━━━━ */}
        {tab === "ca" && (
          <div className="space-y-3">
            {[
              { univers: "Vente", icon: Car, ca: "142 500 EUR", pct: "+8.2%", up: true, color: "text-blue-600", bg: "bg-blue-50", transactions: 47, barWidth: "85%" },
              { univers: "Location", icon: Key, ca: "68 200 EUR", pct: "+15.1%", up: true, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", transactions: 156, barWidth: "65%" },
              { univers: "Garage", icon: Wrench, ca: "34 800 EUR", pct: "+22.3%", up: true, color: "text-green-600", bg: "bg-green-50", transactions: 89, barWidth: "42%" },
              { univers: "Encheres", icon: Gavel, ca: "28 950 EUR", pct: "+5.7%", up: true, color: "text-purple-600", bg: "bg-purple-50", transactions: 12, barWidth: "35%" },
              { univers: "Publicite", icon: Megaphone, ca: "13 000 EUR", pct: "-3.2%", up: false, color: "text-orange-600", bg: "bg-orange-50", transactions: 34, barWidth: "18%" },
            ].map((u) => {
              const Icon = u.icon;
              const isExp = expandedUnivers === u.univers;
              return (
                <div key={u.univers} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpandedUnivers(isExp ? null : u.univers)} className="w-full text-left p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-lg ${u.bg} grid place-items-center`}>
                          <Icon size={18} className={u.color} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111]">{u.univers}</p>
                          <p className="text-[10px] text-slate-400">{u.transactions} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-[#111]">{u.ca}</p>
                        <p className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${u.up ? "text-green-600" : "text-red-500"}`}>
                          {u.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {u.pct}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${u.color.replace("text-", "bg-")}`} style={{ width: u.barWidth }} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-4 pb-4 border-t border-[#E5E7EB] pt-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-slate-400">Transactions</span><p className="font-bold text-[#111]">{u.transactions}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-slate-400">Evolution</span><p className={`font-bold ${u.up ? "text-green-600" : "text-red-500"}`}>{u.pct}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-slate-400">CA total</span><p className="font-bold text-[#D4AF37]">{u.ca}</p></div>
                      </div>
                      <button className="w-full rounded-lg bg-[#111] py-2 text-[10px] font-bold text-[#D4AF37]">Voir les details {u.univers}</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Commissions plateforme */}
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <h3 className="text-xs font-bold text-[#D4AF37] mb-2">Commissions plateforme</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-lg font-black text-white">8 520 EUR</p><p className="text-[8px] text-white/50">Commission vente (3%)</p></div>
                <div><p className="text-lg font-black text-white">4 260 EUR</p><p className="text-[8px] text-white/50">Commission location (5%)</p></div>
                <div><p className="text-lg font-black text-white">2 130 EUR</p><p className="text-[8px] text-white/50">Commission encheres (5%)</p></div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━ SUIVI FINANCIER ━━━━━ */}
        {tab === "finances" && (
          <div className="space-y-3">
            {/* Cartes resume — grid 2 cols, expandable */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "recus", label: "Paiements recus", montant: "198 450 EUR", icon: ArrowDown, color: "text-green-600", bg: "bg-green-50", detail: "48 transactions ce mois · Moyenne 4 134 EUR", pct: "+12% vs mois dernier" },
                { id: "attente", label: "Paiements en attente", montant: "42 300 EUR", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", detail: "6 transactions en cours · Max 28 500 EUR", pct: "Delai moyen 3.2 jours" },
                { id: "rembours", label: "Remboursements", montant: "3 800 EUR", icon: ArrowUp, color: "text-red-500", bg: "bg-red-50", detail: "4 remboursements traites · Taux 1.9%", pct: "-0.3% vs mois dernier" },
                { id: "abos", label: "Abonnements actifs", montant: "24 680 EUR/mois", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", detail: "312 abonnes actifs · 8 nouveaux", pct: "+5% ce mois" },
              ].map((c) => {
                const Icon = c.icon;
                const isExp = expandedFinance === c.id;
                return (
                  <div key={c.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                    <button onClick={() => setExpandedFinance(isExp ? null : c.id)} className="w-full text-left p-3">
                      <div className={`h-8 w-8 rounded-lg ${c.bg} grid place-items-center mb-2`}>
                        <Icon size={14} className={c.color} />
                      </div>
                      <p className="text-[10px] text-slate-400">{c.label}</p>
                      <p className="text-sm font-black text-[#111]">{c.montant}</p>
                    </button>
                    {isExp && (
                      <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-1">
                        <p className="text-[10px] text-slate-500">{c.detail}</p>
                        <p className={`text-[10px] font-bold ${c.color}`}>{c.pct}</p>
                        <button className="w-full mt-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Voir details</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Derniers paiements — expandable */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37]">Derniers paiements</h3></div>
              {[
                { objet: "Vente Peugeot 3008 GT", montant: "+28 500 EUR", date: "09/06/2025", statut: "Recu", type: "vente", client: "Martin D.", ref: "FA-2025-0412" },
                { objet: "Location Mercedes E Break", montant: "+1 350 EUR", date: "08/06/2025", statut: "Recu", type: "location", client: "Sophie L.", ref: "FA-2025-0411" },
                { objet: "Abonnement Pro Premium x12", montant: "+1 068 EUR", date: "07/06/2025", statut: "Recu", type: "abo", client: "Garage Auto 93", ref: "AB-2025-0089" },
                { objet: "Devis Garage Auto Express", montant: "+389 EUR", date: "06/06/2025", statut: "En attente", type: "garage", client: "Auto Express", ref: "DV-2025-0156" },
                { objet: "Boost Premium Annonce #142", montant: "+29 EUR", date: "06/06/2025", statut: "Recu", type: "pub", client: "Pierre K.", ref: "PUB-2025-0042" },
                { objet: "Remboursement reservation", montant: "-50 EUR", date: "05/06/2025", statut: "Traite", type: "remb", client: "Ahmed M.", ref: "RB-2025-0008" },
              ].map((p, i) => {
                const isExp = expandedFinance === `paiement_${i}`;
                return (
                  <div key={i} className="border-b border-[#F3F4F6] last:border-0">
                    <button onClick={() => setExpandedFinance(isExp ? null : `paiement_${i}`)} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
                      <div>
                        <p className="text-xs font-bold text-[#111]">{p.objet}</p>
                        <p className="text-[10px] text-slate-400">{p.date}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${p.montant.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{p.montant}</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${p.statut === "Recu" ? "bg-green-50 text-green-700" : p.statut === "En attente" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{p.statut}</span>
                      </div>
                    </button>
                    {isExp && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#F3F4F6]">
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Client</span><p className="font-bold text-[#111]">{p.client}</p></div>
                          <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Reference</span><p className="font-bold text-[#111]">{p.ref}</p></div>
                          <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Type</span><p className="font-bold text-[#111]">{p.type}</p></div>
                          <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Montant</span><p className="font-bold text-[#D4AF37]">{p.montant}</p></div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Voir facture</button>
                          <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Telecharger</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Abonnements actifs — expandable */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#D4AF37]">Abonnements actifs</h3>
                <span className="text-[10px] text-white/50">312 abonnes</span>
              </div>
              {[
                { plan: "Pro Vente Premium", abonnes: 45, revenu: "4 005 EUR/mois", taux: "99%", dernier: "09/06/2025" },
                { plan: "Pro Vente Elite", abonnes: 12, revenu: "2 148 EUR/mois", taux: "100%", dernier: "08/06/2025" },
                { plan: "Location Pro", abonnes: 67, revenu: "5 963 EUR/mois", taux: "97%", dernier: "09/06/2025" },
                { plan: "Garage Pro Premium", abonnes: 34, revenu: "3 026 EUR/mois", taux: "98%", dernier: "07/06/2025" },
                { plan: "Atelier Pro", abonnes: 28, revenu: "2 492 EUR/mois", taux: "100%", dernier: "06/06/2025" },
                { plan: "Encheres Pro", abonnes: 15, revenu: "735 EUR/mois", taux: "93%", dernier: "08/06/2025" },
                { plan: "Comptabilite Pro", abonnes: 22, revenu: "1 298 EUR/mois", taux: "95%", dernier: "07/06/2025" },
                { plan: "Carrosserie Pro", abonnes: 18, revenu: "1 062 EUR/mois", taux: "100%", dernier: "09/06/2025" },
              ].map((a, i) => {
                const isExp = expandedFinance === `abo_${i}`;
                return (
                  <div key={i} className="border-b border-[#F3F4F6] last:border-0">
                    <button onClick={() => setExpandedFinance(isExp ? null : `abo_${i}`)} className="w-full flex items-center justify-between px-3 py-2 text-left">
                      <div>
                        <p className="text-xs font-bold text-[#111]">{a.plan}</p>
                        <p className="text-[10px] text-slate-400">{a.abonnes} abonnes</p>
                      </div>
                      <p className="text-xs font-bold text-[#D4AF37]">{a.revenu}</p>
                    </button>
                    {isExp && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#F3F4F6]">
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-slate-400">Abonnes</span><p className="font-bold text-[#111]">{a.abonnes}</p></div>
                          <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-slate-400">Taux renouvl.</span><p className="font-bold text-green-600">{a.taux}</p></div>
                          <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-slate-400">Dernier</span><p className="font-bold text-[#111]">{a.dernier}</p></div>
                        </div>
                        <button className="w-full mt-2 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Gerer les abonnes</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ━━━━━ EMPLOYES ━━━━━ */}
        {tab === "employes" && (
          <div className="space-y-3">
            {/* Stats globales — grid clickable */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Total", val: "28", color: "text-[#D4AF37]" },
                { label: "Presents", val: "24", color: "text-green-600" },
                { label: "Absents", val: "2", color: "text-red-500" },
                { label: "Conges", val: "2", color: "text-blue-500" },
              ].map((s) => (
                <button key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center hover:shadow-md transition active:scale-[0.97]">
                  <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                  <p className="text-[9px] text-slate-400">{s.label}</p>
                </button>
              ))}
            </div>

            {/* Liste employes — expandable */}
            {[
              { nom: "Karim M.", poste: "Mecanicien senior — Atelier", heuresM: "168h", presence: "98%", taches: 34, perf: 92, statut: "present", salaire: "2 800 EUR", anciennete: "4 ans", contact: "06 12 34 56 78" },
              { nom: "Youssef B.", poste: "Mecanicien — Atelier", heuresM: "155h", presence: "95%", taches: 28, perf: 85, statut: "present", salaire: "2 200 EUR", anciennete: "2 ans", contact: "06 23 45 67 89" },
              { nom: "Omar L.", poste: "Mecanicien — Atelier", heuresM: "142h", presence: "90%", taches: 22, perf: 78, statut: "present", salaire: "2 000 EUR", anciennete: "1 an", contact: "06 34 56 78 90" },
              { nom: "Sarah K.", poste: "Responsable location", heuresM: "160h", presence: "97%", taches: 45, perf: 94, statut: "present", salaire: "3 200 EUR", anciennete: "5 ans", contact: "06 45 67 89 01" },
              { nom: "Mohamed A.", poste: "Commercial vente", heuresM: "162h", presence: "96%", taches: 38, perf: 88, statut: "present", salaire: "2 600 EUR", anciennete: "3 ans", contact: "06 56 78 90 12" },
              { nom: "Fatima B.", poste: "Comptabilite", heuresM: "158h", presence: "99%", taches: 52, perf: 96, statut: "present", salaire: "2 900 EUR", anciennete: "6 ans", contact: "06 67 89 01 23" },
              { nom: "Rachid T.", poste: "Apprenti mecanicien", heuresM: "130h", presence: "88%", taches: 15, perf: 65, statut: "present", salaire: "1 200 EUR", anciennete: "6 mois", contact: "06 78 90 12 34" },
              { nom: "Amina D.", poste: "Accueil / Administration", heuresM: "160h", presence: "100%", taches: 40, perf: 91, statut: "conge", salaire: "2 400 EUR", anciennete: "3 ans", contact: "06 89 01 23 45" },
            ].map((e, i) => {
              const isExp = expandedEmploye === i;
              return (
                <div key={i} className={`rounded-xl bg-white border overflow-hidden ${e.statut === "present" ? "border-[#E5E7EB]" : e.statut === "conge" ? "border-blue-200" : "border-red-200"}`}>
                  <button onClick={() => setExpandedEmploye(isExp ? null : i)} className="w-full text-left p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#111] flex items-center gap-2">
                          {e.nom}
                          <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${e.statut === "present" ? "bg-green-50 text-green-700" : e.statut === "conge" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
                            {e.statut === "present" ? "Present" : e.statut === "conge" ? "Conge" : "Absent"}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">{e.poste}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${e.perf >= 90 ? "text-green-600" : e.perf >= 75 ? "text-amber-600" : "text-red-500"}`}>{e.perf}%</p>
                        <p className="text-[9px] text-slate-400">performance</p>
                      </div>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#111]">{e.heuresM}</p><p className="text-slate-400">Heures/mois</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#111]">{e.presence}</p><p className="text-slate-400">Presence</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#111]">{e.taches}</p><p className="text-slate-400">Taches/mois</p></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#D4AF37]">{e.salaire}</p><p className="text-slate-400">Salaire</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#111]">{e.anciennete}</p><p className="text-slate-400">Anciennete</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#111]">{e.contact}</p><p className="text-slate-400">Telephone</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Voir profil</button>
                        <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Contacter</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━ ALERTES ━━━━━ */}
        {tab === "alertes" && (
          <div className="space-y-2">
            {[
              { type: "urgent", titre: "Facture impayee — Garage Premium", desc: "Facture FA-2025-0310 de 1 580 EUR en attente depuis 3 jours. Client: Jean-Pierre D.", date: "Il y a 3 jours", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", action: "Relancer le client", detail: "Montant: 1 580 EUR · Echeance: 06/06/2025 · 2eme relance envoyee" },
              { type: "urgent", titre: "Abonnement expire — Pro Vente", desc: "L'abonnement Pro Premium de Garage Auto 93 a expire le 07/06. Pas de renouvellement.", date: "Il y a 2 jours", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", action: "Contacter le client", detail: "Plan: Pro Premium (89 EUR/mois) · Derniere connexion: 05/06/2025" },
              { type: "info", titre: "Paiement recu — 28 500 EUR", desc: "Virement recu pour l'achat de la Peugeot 3008 GT par Martin D.", date: "Il y a 1 jour", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", action: "Voir la transaction", detail: "Ref: FA-2025-0412 · Methode: Virement SEPA · Delai: 2 jours" },
              { type: "info", titre: "Objectif mensuel atteint — Location", desc: "Objectif de 65 000 EUR atteint pour la Location. Actuel: 68 200 EUR (+105%).", date: "Il y a 1 jour", icon: Target, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/30", action: "Voir le rapport", detail: "Objectif: 65 000 EUR · Realise: 68 200 EUR · +4.9% vs mois dernier" },
              { type: "warning", titre: "Anomalie financiere detectee", desc: "Double facturation detectee sur le compte de Sophie L. — 2 factures identiques de 780 EUR.", date: "Aujourd'hui", icon: Shield, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", action: "Verifier et corriger", detail: "Client: Sophie L. · Ref doublons: FA-0389 & FA-0390 · Total: 1 560 EUR" },
              { type: "info", titre: "Nouvel abonne — Atelier Pro", desc: "Garage Meca Plus (Montreuil) a souscrit a l'option Atelier Pro Premium (89 EUR/mois).", date: "Aujourd'hui", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", action: "Voir le compte", detail: "Garage Meca Plus · SIRET: 891 234 567 · Plan: Atelier Premium" },
              { type: "warning", titre: "Stock critique — 3 articles", desc: "Courroie distribution Gates, Amortisseur AR Monroe, Kit embrayage Valeo en rupture.", date: "Aujourd'hui", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", action: "Commander", detail: "3 refs en rupture · Delai reappro: 48h · Commande auto possible" },
              { type: "info", titre: "Paiement recu — 920 EUR", desc: "CB recu pour la reparation Tesla Model 3 (pneus + geometrie) par Thomas R.", date: "Hier", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", action: "Voir la facture", detail: "Ref: FA-2025-0410 · Methode: CB · Montant: 920 EUR" },
            ].map((a, i) => {
              const Icon = a.icon;
              const isExp = expandedAlerte === i;
              return (
                <div key={i} className={`rounded-xl bg-white border ${a.border} overflow-hidden`}>
                  <button onClick={() => setExpandedAlerte(isExp ? null : i)} className="w-full text-left p-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 shrink-0 rounded-lg ${a.bg} grid place-items-center`}>
                        <Icon size={16} className={a.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111]">{a.titre}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{a.date}</p>
                      </div>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <p className="text-xs text-slate-500">{a.desc}</p>
                      <div className="rounded-lg bg-[#F5F3EF] p-2 text-[10px]">
                        <p className="text-slate-500">{a.detail}</p>
                      </div>
                      <button className={`w-full rounded-lg py-1.5 text-[9px] font-bold text-white ${a.type === "urgent" ? "bg-red-500" : a.type === "warning" ? "bg-amber-500" : "bg-[#D4AF37]"}`}>{a.action}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
