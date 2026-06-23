import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, ChevronDown, Phone, Mail, Clock, Star, X, Calendar, Briefcase, Award, MapPin, FileText, CheckCircle } from "lucide-react";

const EMPLOYES = [
  { id: 1, nom: "Karim M.", poste: "Responsable technique", service: "Atelier", statut: "actif", email: "karim@mkapms.fr", tel: "06 12 34 56 78", anciennete: "2 ans", performance: 92, dateEmbauche: "15/03/2024", adresse: "12 Rue de la Paix, Paris", competences: ["Mécanique générale", "Diagnostic électronique", "Climatisation", "Révision complète"], diplome: "BTS Maintenance Véhicules", contrat: "CDI" },
  { id: 2, nom: "Sarah B.", poste: "Charge clientele", service: "Support", statut: "actif", email: "sarah@mkapms.fr", tel: "06 23 45 67 89", anciennete: "1 an", performance: 88, dateEmbauche: "10/06/2025", adresse: "5 Avenue Foch, Lyon", competences: ["Accueil client", "Gestion réclamations", "Suivi commandes", "CRM"], diplome: "Licence Commerce", contrat: "CDI" },
  { id: 3, nom: "Omar L.", poste: "Mecanicien senior", service: "Atelier", statut: "actif", email: "omar@mkapms.fr", tel: "06 34 56 78 90", anciennete: "3 ans", performance: 85, dateEmbauche: "01/01/2023", adresse: "8 Bd Haussmann, Paris", competences: ["Moteur diesel", "Boîte de vitesse", "Freinage", "Géométrie"], diplome: "CAP Mécanique Auto", contrat: "CDI" },
  { id: 4, nom: "Julie P.", poste: "Comptable", service: "Finance", statut: "conge", email: "julie@mkapms.fr", tel: "06 45 67 89 01", anciennete: "6 mois", performance: 90, dateEmbauche: "01/12/2025", adresse: "22 Rue Rivoli, Paris", competences: ["Facturation", "TVA", "Bilan", "Relance paiements"], diplome: "DCG Comptabilité", contrat: "CDD" },
  { id: 5, nom: "Ahmed T.", poste: "Developpeur", service: "Tech", statut: "actif", email: "ahmed@mkapms.fr", tel: "06 56 78 90 12", anciennete: "1 an", performance: 95, dateEmbauche: "15/06/2025", adresse: "3 Rue du Code, Bordeaux", competences: ["React", "TypeScript", "Node.js", "PostgreSQL"], diplome: "Master Informatique", contrat: "CDI" },
];

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const HEURES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const PLANNING_DATA: Record<number, Record<string, { debut: string; fin: string; tache: string }[]>> = {
  1: { Lun: [{ debut: "08:00", fin: "12:00", tache: "Diagnostic BMW X3" }, { debut: "14:00", fin: "18:00", tache: "Révision Peugeot 308" }], Mar: [{ debut: "08:00", fin: "12:00", tache: "Changement embrayage" }], Mer: [{ debut: "09:00", fin: "17:00", tache: "Formation constructeur" }], Jeu: [{ debut: "08:00", fin: "12:00", tache: "Climatisation Renault" }, { debut: "14:00", fin: "16:00", tache: "Réunion équipe" }], Ven: [{ debut: "08:00", fin: "18:00", tache: "Grosses réparations" }] },
  2: { Lun: [{ debut: "09:00", fin: "12:00", tache: "Accueil clients" }, { debut: "14:00", fin: "17:00", tache: "Suivi dossiers" }], Mar: [{ debut: "09:00", fin: "18:00", tache: "Permanence support" }], Mer: [{ debut: "09:00", fin: "12:00", tache: "Réclamations" }], Jeu: [{ debut: "09:00", fin: "17:00", tache: "Suivi commandes" }], Ven: [{ debut: "09:00", fin: "15:00", tache: "Bilan semaine" }] },
  3: { Lun: [{ debut: "08:00", fin: "17:00", tache: "Moteur diesel Audi A4" }], Mar: [{ debut: "08:00", fin: "12:00", tache: "Boîte vitesse Golf" }, { debut: "14:00", fin: "18:00", tache: "Géométrie" }], Mer: [{ debut: "08:00", fin: "18:00", tache: "Freinage + contrôle" }], Jeu: [{ debut: "08:00", fin: "12:00", tache: "Vidange + filtres" }], Ven: [{ debut: "08:00", fin: "16:00", tache: "Distribution Clio" }] },
  4: { Lun: [{ debut: "09:00", fin: "12:00", tache: "Facturation" }, { debut: "14:00", fin: "17:00", tache: "Relances" }], Mar: [{ debut: "09:00", fin: "17:00", tache: "Comptabilité" }], Jeu: [{ debut: "09:00", fin: "12:00", tache: "Déclarations TVA" }] },
  5: { Lun: [{ debut: "09:00", fin: "18:00", tache: "Développement features" }], Mar: [{ debut: "09:00", fin: "12:00", tache: "Code review" }, { debut: "14:00", fin: "18:00", tache: "Corrections bugs" }], Mer: [{ debut: "09:00", fin: "18:00", tache: "Sprint dev" }], Jeu: [{ debut: "09:00", fin: "18:00", tache: "Tests + déploiement" }], Ven: [{ debut: "09:00", fin: "16:00", tache: "Rétrospective + planning" }] },
};

export default function AdminEmployes() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [profilModal, setProfilModal] = useState<number | null>(null);
  const [planningModal, setPlanningModal] = useState<number | null>(null);

  const emp = profilModal ? EMPLOYES.find((e) => e.id === profilModal) : null;
  const planEmp = planningModal ? EMPLOYES.find((e) => e.id === planningModal) : null;
  const planning = planningModal ? PLANNING_DATA[planningModal] || {} : {};

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Employes MKA.P-MS</h1>
      </div>

      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {[
          { l: "Total", v: "12", c: "text-[#D4AF37]" },
          { l: "Actifs", v: "10", c: "text-green-500" },
          { l: "Conge", v: "2", c: "text-amber-500" },
          { l: "Perf. moy.", v: "90%", c: "text-blue-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[8px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {EMPLOYES.map((e) => {
          const isExp = expanded === e.id;
          return (
            <div key={e.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : e.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#D4AF37]/10 grid place-items-center shrink-0"><Users size={16} className="text-[#D4AF37]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{e.nom}</p>
                  <p className="text-[10px] text-[#6B7280]">{e.poste} · {e.service}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${e.statut === "actif" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{e.statut}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Mail size={10} className="text-[#D4AF37]" /><p className="font-bold text-[#111]">{e.email}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Phone size={10} className="text-[#D4AF37]" /><p className="font-bold text-[#111]">{e.tel}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Clock size={10} className="text-[#D4AF37]" /><p className="font-bold text-[#111]">{e.anciennete}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" /><p className={`font-bold ${e.performance >= 90 ? "text-green-600" : "text-amber-600"}`}>{e.performance}%</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setProfilModal(e.id)} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white active:scale-[0.97] transition">Profil</button>
                    <button onClick={() => setPlanningModal(e.id)} className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] active:scale-[0.97] transition">Planning</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modal Profil ── */}
      {emp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setProfilModal(null)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header profil */}
            <div className="bg-[#111] rounded-t-2xl px-5 pt-5 pb-4 relative">
              <button onClick={() => setProfilModal(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16} className="text-white" /></button>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-[#D4AF37]/20 grid place-items-center"><Users size={24} className="text-[#D4AF37]" /></div>
                <div>
                  <h2 className="text-lg font-black text-white">{emp.nom}</h2>
                  <p className="text-xs text-white/60">{emp.poste}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold ${emp.statut === "actif" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>{emp.statut}</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Infos contact */}
              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Contact</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><Mail size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{emp.email}</span></div>
                  <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><Phone size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{emp.tel}</span></div>
                  <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><MapPin size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{emp.adresse}</span></div>
                </div>
              </div>

              {/* Infos emploi */}
              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Emploi</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Service</p><p className="text-xs font-bold text-[#111]">{emp.service}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Contrat</p><p className="text-xs font-bold text-[#111]">{emp.contrat}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Date embauche</p><p className="text-xs font-bold text-[#111]">{emp.dateEmbauche}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2.5"><p className="text-[9px] text-[#6B7280]">Ancienneté</p><p className="text-xs font-bold text-[#111]">{emp.anciennete}</p></div>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Performance</h3>
                <div className="rounded-lg bg-[#F5F3EF] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#111]">Score global</span>
                    <span className={`text-sm font-black ${emp.performance >= 90 ? "text-green-600" : emp.performance >= 80 ? "text-amber-600" : "text-red-600"}`}>{emp.performance}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full ${emp.performance >= 90 ? "bg-green-500" : emp.performance >= 80 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${emp.performance}%` }} />
                  </div>
                </div>
              </div>

              {/* Diplome */}
              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Formation</h3>
                <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] p-2.5"><Award size={14} className="text-[#D4AF37] shrink-0" /><span className="text-xs font-semibold text-[#111]">{emp.diplome}</span></div>
              </div>

              {/* Compétences */}
              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Compétences</h3>
                <div className="flex flex-wrap gap-1.5">
                  {emp.competences.map((c) => (
                    <span key={c} className="rounded-full bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-semibold text-[#D4AF37] flex items-center gap-1"><CheckCircle size={10} />{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Planning ── */}
      {planEmp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setPlanningModal(null)}>
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header planning */}
            <div className="bg-[#111] rounded-t-2xl px-5 pt-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-[#D4AF37]" />
                <div>
                  <h2 className="text-lg font-black text-white">Planning</h2>
                  <p className="text-xs text-white/60">{planEmp.nom} — {planEmp.poste}</p>
                </div>
              </div>
              <button onClick={() => setPlanningModal(null)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16} className="text-white" /></button>
            </div>

            <div className="p-4 space-y-3">
              {JOURS.map((jour) => {
                const taches = planning[jour] || [];
                return (
                  <div key={jour} className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                    <div className={`px-3 py-2 text-xs font-bold ${taches.length > 0 ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-slate-50 text-slate-400"}`}>
                      {jour}{taches.length === 0 && " — Repos"}
                    </div>
                    {taches.length > 0 && (
                      <div className="divide-y divide-[#E5E7EB]">
                        {taches.map((t, i) => (
                          <div key={i} className="px-3 py-2 flex items-center gap-2">
                            <div className="shrink-0 rounded bg-[#D4AF37]/10 px-2 py-0.5">
                              <span className="text-[9px] font-bold text-[#D4AF37]">{t.debut} - {t.fin}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-[#111] truncate">{t.tache}</p>
                            </div>
                            <Briefcase size={12} className="text-[#9CA3AF] shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Résumé heures */}
              <div className="rounded-xl bg-[#F5F3EF] p-3 mt-2">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase mb-1">Résumé semaine</p>
                <div className="flex gap-3">
                  <div><span className="text-sm font-black text-[#D4AF37]">{Object.values(planning).reduce((acc, t) => acc + t.length, 0)}</span><span className="text-[9px] text-[#6B7280] ml-1">tâches</span></div>
                  <div><span className="text-sm font-black text-green-600">{Object.keys(planning).length}</span><span className="text-[9px] text-[#6B7280] ml-1">jours travaillés</span></div>
                  <div><span className="text-sm font-black text-blue-600">{JOURS.length - Object.keys(planning).length}</span><span className="text-[9px] text-[#6B7280] ml-1">repos</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
