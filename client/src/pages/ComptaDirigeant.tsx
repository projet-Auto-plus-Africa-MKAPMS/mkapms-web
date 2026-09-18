import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { imprimerFeuille, telechargerCSV } from "../lib/documents";
import { trpc } from "../lib/trpc";
import { ROLE_LABELS } from "@shared/roles";
import {
  ChevronLeft, BarChart3, TrendingUp, CreditCard,
  Users, Clock, Bell, AlertTriangle, CheckCircle, Eye, Download,
  Landmark, X, Printer, Mail, Phone, ChevronDown, ChevronRight,
} from "lucide-react";

/**
 * Tableau de bord dirigeant (/compta-dirigeant).
 *
 * Avant ce lot : les 4 onglets (CA, finances, employés, alertes)
 * affichaient un chiffre d'affaires par univers inventé, une commission
 * inventée, 28 employés fictifs avec salaire/email/téléphone/performance
 * inventés, des paiements et abonnements inventés, et des alertes
 * (facture impayée, abonnement expiré, stock critique) entièrement
 * fabriquées — zéro appel serveur dans tout le fichier.
 *
 * Reconnecté aux moteurs réels déjà existants : admin.dashboard (CA
 * jour/semaine/mois/année, commissions, remboursements réels),
 * admin.paymentsList (paiements réels tous utilisateurs),
 * admin.staffList (équipe réelle : email, téléphone, rôle, poste —
 * jamais un salaire, une performance ou une présence, qui n'existent
 * dans aucune table), et smartEngine.alerts/alertStats/resolveAlert (le
 * même Smart Engine déjà utilisé par SmartEngine/ControlCenter.tsx).
 *
 * Ce qui n'a aucune donnée réelle correspondante a été retiré plutôt que
 * fabriqué : le chiffre d'affaires par univers (vente/location/garage/
 * enchères/publicité — aucun type de paiement ne distingue aujourd'hui
 * ces univers), le détail des abonnements par plan avec revenu (aucune
 * agrégation de ce type n'existe), et toute donnée RH inventée.
 */

type CompTab = "ca" | "finances" | "employes" | "alertes";

const ALERT_SEVERITE_LABEL: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "CRITIQUE", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  important: { label: "IMPORTANT", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  warning: { label: "ATTENTION", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  info: { label: "INFO", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
};

const ALERT_STATUT_LABEL: Record<string, string> = {
  open: "Ouverte",
  acknowledged: "Prise en compte",
  resolved: "Résolue",
  dismissed: "Ignorée",
};

const PAIEMENT_STATUT: Record<string, { label: string; color: string }> = {
  paid: { label: "Payé", color: "text-green-600 bg-green-50" },
  pending: { label: "En attente", color: "text-amber-600 bg-amber-50" },
  failed: { label: "Échoué", color: "text-red-600 bg-red-50" },
  refunded: { label: "Remboursé", color: "text-slate-600 bg-slate-100" },
  cancelled: { label: "Annulé", color: "text-slate-600 bg-slate-100" },
};

type Alerte = { id: number; category: string; title: string; description: string | null; severity: string; status: string; createdAt: string | Date; metadata: unknown };
type Employe = { id: number; email: string; name: string; phone: string | null; role: string; staffPosition: string | null; createdAt: string | Date };

function euros(v: number, currency = "EUR"): string {
  return `${v.toLocaleString("fr-FR")} ${currency}`;
}

export default function ComptaDirigeant() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CompTab>("ca");
  const [periode, setPeriode] = useState<"jour" | "semaine" | "mois" | "annee">("mois");
  const [roleFilter, setRoleFilter] = useState<string>("tous");
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);
  const [alerteFilter, setAlerteFilter] = useState<string>("tous");
  const [expandedPaiement, setExpandedPaiement] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const dashboard = trpc.admin.dashboard.useQuery();
  const paiementsQuery = trpc.admin.paymentsList.useQuery({ limit: 50 });
  const paiements = paiementsQuery.data ?? [];
  const staffQuery = trpc.admin.staffList.useQuery();
  const staff: Employe[] = staffQuery.data ?? [];
  const alertesQuery = trpc.smartEngine.alerts.useQuery(alerteFilter === "tous" ? {} : { category: alerteFilter });
  const alertes: Alerte[] = (alertesQuery.data as Alerte[] | undefined) ?? [];
  const alertStats = trpc.smartEngine.alertStats.useQuery();
  const resolveAlerte = trpc.smartEngine.resolveAlert.useMutation({
    onSuccess: () => { alertesQuery.refetch(); alertStats.refetch(); showToast("Alerte mise à jour"); },
    onError: (e) => showToast(e.message),
  });

  const d = dashboard.data;
  const caPeriode = d ? { jour: d.caJour, semaine: d.caSemaine, mois: d.caMois, annee: d.caAnnee }[periode] : null;

  /* Reçu de paiement : feuille réelle, enregistrable en PDF par le navigateur. */
  function imprimerRecu(p: (typeof paiements)[number]) {
    const ok = imprimerFeuille({
      typeDocument: "recu",
      titre: "Reçu de paiement",
      reference: `PAY-${p.id}`,
      sousTitre: p.type.replace(/_/g, " "),
      informations: [
        { libelle: "Client", valeur: `#${p.userId}` },
        { libelle: "Date", valeur: new Date(p.createdAt).toLocaleDateString("fr-FR") },
        { libelle: "Statut", valeur: PAIEMENT_STATUT[p.status]?.label ?? p.status },
        { libelle: "Montant", valeur: euros(Number(p.amount), p.currency) },
      ],
      mentions: ["MKA.P-MS — Auto Plus Africa. Reçu édité depuis le tableau de bord dirigeant."],
    });
    showToast(ok ? "Reçu ouvert — enregistrable en PDF" : "Le navigateur a bloqué la fenêtre d'impression");
  }

  function exporterPaiement(p: (typeof paiements)[number]) {
    const r = telechargerCSV(
      `paiement-${p.id}`,
      [
        { cle: "id", titre: "Référence" },
        { cle: "client", titre: "Client" },
        { cle: "type", titre: "Type" },
        { cle: "date", titre: "Date" },
        { cle: "statut", titre: "Statut" },
        { cle: "montant", titre: "Montant", numerique: true },
      ],
      [{ id: `PAY-${p.id}`, client: `#${p.userId}`, type: p.type, date: new Date(p.createdAt).toLocaleDateString("fr-FR"), statut: PAIEMENT_STATUT[p.status]?.label ?? p.status, montant: euros(Number(p.amount), p.currency) }],
      "recu",
    );
    showToast(r.ok ? `Fichier enregistré : ${r.nom}` : "Export impossible sur cet appareil");
  }

  /* Fiche employé imprimable — uniquement les champs réels (aucun salaire ni performance n'existe). */
  function imprimerFicheEmploye(e: Employe) {
    const ok = imprimerFeuille({
      typeDocument: "export_donnees",
      titre: "Fiche équipe",
      reference: `EMP-${e.id}`,
      sousTitre: `${e.name} — ${ROLE_LABELS[e.role as keyof typeof ROLE_LABELS] ?? e.role}`,
      informations: [
        { libelle: "Rôle", valeur: ROLE_LABELS[e.role as keyof typeof ROLE_LABELS] ?? e.role },
        ...(e.staffPosition ? [{ libelle: "Poste", valeur: e.staffPosition }] : []),
        { libelle: "Email", valeur: e.email },
        ...(e.phone ? [{ libelle: "Téléphone", valeur: e.phone }] : []),
        { libelle: "Compte créé le", valeur: new Date(e.createdAt).toLocaleDateString("fr-FR") },
      ],
      mentions: ["MKA.P-MS — Auto Plus Africa. Document interne, usage direction."],
    });
    showToast(ok ? "Fiche ouverte — enregistrable en PDF" : "Le navigateur a bloqué la fenêtre d'impression");
  }

  function imprimerAlerte(a: Alerte) {
    const sev = ALERT_SEVERITE_LABEL[a.severity] ?? ALERT_SEVERITE_LABEL.info;
    const ok = imprimerFeuille({
      typeDocument: "export_donnees",
      titre: "Alerte de direction",
      reference: `ALERTE-${a.id}`,
      sousTitre: a.title,
      informations: [
        { libelle: "Niveau", valeur: sev.label },
        { libelle: "Catégorie", valeur: a.category },
        { libelle: "Statut", valeur: ALERT_STATUT_LABEL[a.status] ?? a.status },
        { libelle: "Date", valeur: new Date(a.createdAt).toLocaleString("fr-FR") },
        { libelle: "Détail", valeur: a.description ?? "" },
      ],
      mentions: ["MKA.P-MS — Auto Plus Africa. Alerte issue du Smart Engine."],
    });
    showToast(ok ? "Alerte ouverte — enregistrable en PDF" : "Le navigateur a bloqué la fenêtre d'impression");
  }

  const filteredStaff = staff.filter((e) => roleFilter === "tous" || e.role === roleFilter);
  const staffCounts = staff.reduce<Record<string, number>>((acc, e) => { acc[e.role] = (acc[e.role] ?? 0) + 1; return acc; }, {});

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <div className="flex items-center justify-between mb-2">
          <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60"><ChevronLeft size={14} /> Mon compte</Link>
          <Link to="/comptabilite/investissement" className="flex items-center gap-1 text-xs font-bold text-[#D4AF37]"><Landmark size={14} /> Investissement</Link>
        </div>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Tableau de bord dirigeant</h1>
        <p className="mt-0.5 text-sm text-white/60">Pilotez toute l'activité MKA.P-MS</p>

        {/* CA de la période — réel (admin.dashboard) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTab("ca")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setTab("ca"); }}
          className="mt-4 w-full text-left rounded-xl bg-white/5 p-4 hover:bg-white/10 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Chiffre d'affaires encaissé</p>
              <p className="text-2xl font-black text-[#D4AF37]">{dashboard.isLoading ? "…" : caPeriode !== null ? euros(caPeriode) : "—"}</p>
            </div>
            <div className="flex gap-1">
              {(["jour", "semaine", "mois", "annee"] as const).map((p) => (
                <button key={p} onClick={(e) => { e.stopPropagation(); setPeriode(p); }} className={`rounded-lg px-2 py-1 text-[9px] font-bold ${periode === p ? "bg-[#D4AF37] text-white" : "bg-white/10 text-white/50"}`}>
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
          { id: "ca" as CompTab, label: "Chiffre d'affaires" },
          { id: "finances" as CompTab, label: "Suivi financier" },
          { id: "employes" as CompTab, label: `Équipe (${staff.length})` },
          { id: "alertes" as CompTab, label: `Alertes (${alertStats.data?.open ?? 0})` },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        {/* ━━━━━ CA — réel, agrégats globaux (aucune catégorisation par univers n'existe) ━━━━━ */}
        {tab === "ca" && (
          <div className="space-y-3">
            {dashboard.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}
            {d && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => navigate("/comptabilite?tab=ecritures")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-left hover:border-[#D4AF37] transition">
                    <p className="text-[10px] text-slate-400">Commissions ce mois</p>
                    <p className="text-base font-black text-[#D4AF37]">{euros(d.commissionsMois)}</p>
                  </button>
                  <button onClick={() => navigate("/comptabilite?tab=ecritures")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-left hover:border-[#D4AF37] transition">
                    <p className="text-[10px] text-slate-400">Remboursements ce mois</p>
                    <p className="text-base font-black text-red-500">{euros(d.remboursementsMois)}</p>
                  </button>
                  <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                    <p className="text-[10px] text-slate-400">Bénéfice estimé (mois)</p>
                    <p className="text-base font-black text-[#111]">{euros(d.beneficeEstime)}</p>
                  </div>
                  <button onClick={() => navigate("/acheter?type=vendue")} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-left hover:border-[#D4AF37] transition">
                    <p className="text-[10px] text-slate-400">Véhicules vendus</p>
                    <p className="text-base font-black text-[#111]">{d.vehiculesVendus}</p>
                    <p className="flex items-center gap-1 text-[10px] text-green-600"><TrendingUp size={10} /> total plateforme</p>
                  </button>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  Le chiffre d'affaires par univers (vente / location / garage / enchères / publicité) n'est pas encore disponible : aucun type de paiement ne distingue aujourd'hui ces univers entre eux. Suivi en cours (voir tâche dédiée).
                </div>
              </>
            )}
          </div>
        )}

        {/* ━━━━━ SUIVI FINANCIER — réel (admin.dashboard + admin.paymentsList) ━━━━━ */}
        {tab === "finances" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {d && (
                <>
                  <button onClick={() => navigate("/comptabilite?tab=ecritures")} className="w-full text-left rounded-xl bg-white border border-[#E5E7EB] p-3 hover:border-[#D4AF37] transition">
                    <div className="h-8 w-8 rounded-lg bg-green-50 grid place-items-center mb-2"><TrendingUp size={14} className="text-green-600" /></div>
                    <p className="text-[10px] text-slate-400">Encaissé ce mois</p>
                    <p className="text-sm font-black text-[#111]">{euros(d.caMois)}</p>
                  </button>
                  <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 grid place-items-center mb-2"><Clock size={14} className="text-amber-600" /></div>
                    <p className="text-[10px] text-slate-400">Paiements en attente</p>
                    <p className="text-sm font-black text-[#111]">{d.paiementsEnAttente}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                    <div className="h-8 w-8 rounded-lg bg-red-50 grid place-items-center mb-2"><AlertTriangle size={14} className="text-red-500" /></div>
                    <p className="text-[10px] text-slate-400">Paiements échoués</p>
                    <p className="text-sm font-black text-[#111]">{d.paiementsEchoues}</p>
                  </div>
                  <button onClick={() => navigate("/abonnements")} className="w-full text-left rounded-xl bg-white border border-[#E5E7EB] p-3 hover:border-[#D4AF37] transition">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 grid place-items-center mb-2"><CreditCard size={14} className="text-blue-600" /></div>
                    <p className="text-[10px] text-slate-400">Abonnements actifs</p>
                    <p className="text-sm font-black text-[#111]">{d.abonnementsActifs}</p>
                  </button>
                </>
              )}
            </div>

            {/* Derniers paiements — réels, tous utilisateurs (admin.paymentsList) */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37]">Derniers paiements</h3></div>
              {paiementsQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-4">Chargement…</p>}
              {paiements.map((p) => {
                const s = PAIEMENT_STATUT[p.status] ?? PAIEMENT_STATUT.pending;
                return (
                  <div key={p.id}>
                    <button onClick={() => setExpandedPaiement(expandedPaiement === p.id ? null : p.id)} className="w-full flex items-center justify-between px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F5F3EF]/50 transition">
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#111]">{p.type.replace(/_/g, " ")} — Client #{p.userId}</p>
                        <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#111]">{euros(Number(p.amount), p.currency)}</p>
                          <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${s.color}`}>{s.label}</span>
                        </div>
                        <ChevronDown size={12} className={`text-slate-300 transition ${expandedPaiement === p.id ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {expandedPaiement === p.id && (
                      <div className="px-3 py-3 bg-[#F5F3EF]/50 border-b border-[#F3F4F6] space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div><span className="text-slate-400">Référence :</span> <span className="font-bold text-[#111]">PAY-{p.id}</span></div>
                          <div><span className="text-slate-400">Client :</span> <span className="font-bold text-[#111]">#{p.userId}</span></div>
                          <div><span className="text-slate-400">Type :</span> <span className="font-bold text-[#111]">{p.type}</span></div>
                          <div><span className="text-slate-400">Devise :</span> <span className="font-bold text-[#111]">{p.currency}</span></div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => imprimerRecu(p)} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-[#111]"><Printer size={10} /> Imprimer</button>
                          <button onClick={() => exporterPaiement(p)} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-[#111]"><Download size={10} /> Export</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!paiementsQuery.isLoading && paiements.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Aucun paiement pour le moment.</p>
              )}
            </div>
          </div>
        )}

        {/* ━━━━━ ÉQUIPE — réel (admin.staffList), aucune donnée RH inventée ━━━━━ */}
        {tab === "employes" && (
          <div className="space-y-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {["tous", ...Object.keys(staffCounts)].map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${roleFilter === r ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
                  {r === "tous" ? `Tous (${staff.length})` : `${ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r} (${staffCounts[r]})`}
                </button>
              ))}
            </div>

            {staffQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}

            {filteredStaff.map((e) => (
              <button key={e.id} onClick={() => setSelectedEmploye(e)} className="w-full text-left rounded-xl bg-white border border-[#E5E7EB] p-3 hover:border-[#D4AF37] hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.email}</p>
                    {e.staffPosition && <p className="text-[10px] text-slate-400">{e.staffPosition}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">{ROLE_LABELS[e.role as keyof typeof ROLE_LABELS] ?? e.role}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </div>
              </button>
            ))}

            {!staffQuery.isLoading && filteredStaff.length === 0 && (
              <div className="text-center py-8">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Aucun compte dans cette catégorie</p>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━ ALERTES — réel (Smart Engine) ━━━━━ */}
        {tab === "alertes" && (
          <div className="space-y-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              <button onClick={() => setAlerteFilter("tous")} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${alerteFilter === "tous" ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
                Toutes {alertStats.data ? `(${alertStats.data.total})` : ""}
              </button>
              {["paiement", "annonce", "annonce_suspecte", "doublon", "faux_compte", "erreur", "redirection", "avis", "badge"].map((c) => (
                <button key={c} onClick={() => setAlerteFilter(c)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${alerteFilter === c ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
                  {c.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {alertesQuery.isLoading && <p className="text-sm text-[#6B7280] text-center py-6">Chargement…</p>}

            {alertes.map((a) => {
              const sev = ALERT_SEVERITE_LABEL[a.severity] ?? ALERT_SEVERITE_LABEL.info;
              return (
                <button key={a.id} onClick={() => setSelectedAlerte(a)} className={`w-full text-left rounded-xl bg-white border ${sev.border} p-3 hover:shadow-md transition`}>
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 shrink-0 rounded-lg ${sev.bg} grid place-items-center`}>
                      {a.status === "open" ? <AlertTriangle size={16} className={sev.color} /> : <CheckCircle size={16} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[#111]">{a.title}</p>
                        <ChevronRight size={14} className="text-slate-300 shrink-0" />
                      </div>
                      {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleString("fr-FR")}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">{ALERT_STATUT_LABEL[a.status] ?? a.status}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {!alertesQuery.isLoading && alertes.length === 0 && (
              <div className="text-center py-8">
                <Bell size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Aucune alerte dans cette catégorie</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━━━━ MODAL DÉTAIL ÉQUIPE ━━━━━ */}
      {selectedEmploye && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEmploye(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-5 pt-5 pb-4 rounded-t-2xl flex items-start justify-between">
              <div>
                <p className="text-lg font-black text-white">{selectedEmploye.name}</p>
                <p className="text-xs text-white/60">{selectedEmploye.email}</p>
                <span className="mt-1 inline-block rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">
                  {ROLE_LABELS[selectedEmploye.role as keyof typeof ROLE_LABELS] ?? selectedEmploye.role}
                </span>
              </div>
              <button onClick={() => setSelectedEmploye(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"><X size={16} className="text-white" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#111]">Informations</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    { label: "Email", val: selectedEmploye.email },
                    { label: "Téléphone", val: selectedEmploye.phone ?? "Non renseigné" },
                    { label: "Poste", val: selectedEmploye.staffPosition ?? "Non renseigné" },
                    { label: "Compte créé le", val: new Date(selectedEmploye.createdAt).toLocaleDateString("fr-FR") },
                  ].map((info) => (
                    <div key={info.label} className="rounded-lg bg-white border border-[#E5E7EB] p-2">
                      <p className="text-[9px] text-slate-400">{info.label}</p>
                      <p className="font-bold text-[#111] truncate">{info.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => navigate("/superadmin/admin-employes")} className="flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] py-3 text-xs font-bold text-white hover:bg-[#C5A028] transition"><Eye size={14} /> Gérer le compte</button>
                <button onClick={() => imprimerFicheEmploye(selectedEmploye)} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] py-3 text-xs font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Printer size={14} /> Imprimer la fiche</button>
                <a href={`mailto:${selectedEmploye.email}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] py-3 text-xs font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Mail size={14} /> Envoyer un mail</a>
                {selectedEmploye.phone && (
                  <a href={`tel:${selectedEmploye.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] py-3 text-xs font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Phone size={14} /> Appeler</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━ MODAL DÉTAIL ALERTE ━━━━━ */}
      {selectedAlerte && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAlerte(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            {(() => {
              const sev = ALERT_SEVERITE_LABEL[selectedAlerte.severity] ?? ALERT_SEVERITE_LABEL.info;
              return (
                <div className={`px-5 pt-5 pb-4 rounded-t-2xl flex items-start justify-between ${sev.bg} border-b ${sev.border}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/60 grid place-items-center">
                      <AlertTriangle size={18} className={sev.color} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#111]">{selectedAlerte.title}</p>
                      <span className="mt-0.5 inline-block rounded-full bg-white/80 px-2 py-0.5 text-[8px] font-bold text-[#111]">{sev.label}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAlerte(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 hover:bg-white transition"><X size={16} className="text-[#111]" /></button>
                </div>
              );
            })()}

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-[#F5F3EF] p-4">
                {selectedAlerte.description && <p className="text-sm text-[#111] leading-relaxed">{selectedAlerte.description}</p>}
                <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-400">
                  <span>{new Date(selectedAlerte.createdAt).toLocaleString("fr-FR")}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-500">{selectedAlerte.category}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-500">{ALERT_STATUT_LABEL[selectedAlerte.status] ?? selectedAlerte.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                {selectedAlerte.status === "open" && (
                  <button
                    onClick={() => resolveAlerte.mutate({ id: selectedAlerte.id, status: "resolved" })}
                    disabled={resolveAlerte.isPending}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] py-3 text-xs font-bold text-white hover:bg-[#C5A028] transition disabled:opacity-50"
                  >
                    <CheckCircle size={14} /> {resolveAlerte.isPending ? "…" : "Marquer comme résolue"}
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => imprimerAlerte(selectedAlerte)} className="flex items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] py-2.5 text-[10px] font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Printer size={12} /> Imprimer</button>
                  <button onClick={() => navigate("/admin/systeme-intelligent")} className="flex items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] py-2.5 text-[10px] font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Eye size={12} /> Centre de contrôle</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-[#111] px-4 py-2.5 text-[11px] font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
