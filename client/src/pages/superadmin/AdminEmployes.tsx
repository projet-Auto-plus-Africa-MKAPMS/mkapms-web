import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, ChevronDown, Phone, Mail, Clock, Star, X, Calendar, Briefcase, Award, MapPin, FileText, CheckCircle } from "lucide-react";

import { trpc } from "../../lib/trpc";
import { BoutonMoteur } from "../../lib/boutonMoteur";
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const heure=(minute:number)=>`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));

export default function AdminEmployes() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [profilModal, setProfilModal] = useState<number | null>(null);
  const [planningModal, setPlanningModal] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedEmp, setEditedEmp] = useState<any>(null);
  const [editPlanning, setEditPlanning] = useState(false);
  const [newTache, setNewTache] = useState({ debut: "08:00", fin: "12:00", tache: "" });
  const [selectedDay, setSelectedDay] = useState("Lun");

  const directory=trpc.hr.staffDirectory.useQuery();
  const schedule=trpc.hr.staffPlanning.useQuery({userId:planningModal??0},{enabled:planningModal!==null});
  const utils=trpc.useUtils();
  const [filter,setFilter]=useState("Total");
  const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
  const save=trpc.hr.saveStaffProfile.useMutation({onSuccess:async()=>{await utils.hr.staffDirectory.invalidate();setEditMode(false);}});
  const add=trpc.hr.addStaffTask.useMutation({onSuccess:async()=>{await utils.hr.staffPlanning.invalidate();setNewTache({debut:"08:00",fin:"12:00",tache:""});setRequestId(crypto.randomUUID());}});
  const cancel=trpc.hr.cancelStaffTask.useMutation({onSuccess:()=>utils.hr.staffPlanning.invalidate()});
  const EMPLOYES=(directory.data??[]).map(e=>({id:e.id,nom:e.name,poste:e.poste??"",service:e.profile?.service??"",statut:e.onLeave?"conge":e.profile?.statut??(e.status==='active'?'actif':'absent'),email:e.email,tel:e.phone??"",anciennete:e.dateEmbauche?`${Math.max(0,Math.floor((Date.now()-new Date(e.dateEmbauche).getTime())/86400000))} jours`:"Non renseignée",performance:e.performance,dateEmbauche:e.dateEmbauche?new Date(e.dateEmbauche).toLocaleDateString():"Non renseignée",adresse:e.profile?.adresse??"",competences:e.profile?.competences??[],diplome:e.profile?.diplome??"Non renseigné",contrat:e.contractType??"Non renseigné"}));
  const scores=EMPLOYES.filter(e=>e.performance!==null);
  const moyenne=scores.length?Math.round(scores.reduce((n,e)=>n+(e.performance??0),0)/scores.length):null;
  const filtered=EMPLOYES.filter(e=>filter==='Total'||filter==='Actifs'&&e.statut==='actif'||filter==='Conge'&&e.statut==='conge'||filter==='Perf. moy.'&&e.performance!==null);
  const planning:Record<string,{id:number;debut:string;fin:string;tache:string}[]>={};
  for(const t of schedule.data??[])if(!t.cancelled)(planning[JOURS[t.day]]??=[]).push({id:t.id,debut:heure(t.startMinute),fin:heure(t.endMinute),tache:t.title});
  for(const tasks of Object.values(planning))tasks.sort((a,b)=>a.debut.localeCompare(b.debut));
  const emp = profilModal ? EMPLOYES.find((e) => e.id === profilModal) : null;
  const planEmp = planningModal ? EMPLOYES.find((e) => e.id === planningModal) : null;


  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Employes MKA.P-MS</h1>
      </div>

      {(directory.error||schedule.error||save.error||add.error||cancel.error) && <p role="alert" className="fixed top-0 inset-x-0 z-[100] bg-red-100 p-3 text-red-800">{(directory.error||schedule.error||save.error||add.error||cancel.error)?.message}</p>}
      {directory.isLoading && <p role="status" className="p-4">Chargement des employés…</p>}
      {!directory.isLoading&&!directory.error&&!EMPLOYES.length&&<p className="p-4">Aucun compte employé enregistré.</p>}
      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {[
          { l: "Total", v: String(EMPLOYES.length), c: "text-[#D4AF37]" },
          { l: "Actifs", v: String(EMPLOYES.filter(e=>e.statut==='actif').length), c: "text-green-500" },
          { l: "Conge", v: String(EMPLOYES.filter(e=>e.statut==='conge').length), c: "text-amber-500" },
          { l: "Perf. moy.", v: moyenne===null?"Non évalué":`${moyenne}%`, c: "text-blue-500" },
        ].map((s) => (
          <BoutonMoteur code="admin_employes_filtrer" onExecuter={()=>setFilter(s.l)} key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[8px] text-[#6B7280]">{s.l}</p>
          </BoutonMoteur>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {filtered.map((e) => {
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
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" /><p className={`font-bold ${(e.performance??0) >= 90 ? "text-green-600" : "text-amber-600"}`}>{e.performance===null?"Non évalué":`${e.performance}%`}</p></div>
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
              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase">Nom complet</label>
                    <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedEmp?.nom} onChange={(e) => setEditedEmp({ ...editedEmp, nom: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase">Poste</label>
                    <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedEmp?.poste} onChange={(e) => setEditedEmp({ ...editedEmp, poste: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase">Email</label>
                      <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedEmp?.email} onChange={(e) => setEditedEmp({ ...editedEmp, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase">Téléphone</label>
                      <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedEmp?.tel} onChange={(e) => setEditedEmp({ ...editedEmp, tel: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase">Adresse</label>
                    <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedEmp?.adresse} onChange={(e) => setEditedEmp({ ...editedEmp, adresse: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase">Service</label>
                      <select className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedEmp?.service} onChange={(e) => setEditedEmp({ ...editedEmp, service: e.target.value })}>
                        <option>Atelier</option><option>Support</option><option>Finance</option><option>Tech</option><option>Direction</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase">Statut</label>
                      <select className="w-full rounded-lg border border-[#E5E7EB] bg-[#F5F3EF] p-2.5 text-xs font-semibold" value={editedEmp?.statut} onChange={(e) => setEditedEmp({ ...editedEmp, statut: e.target.value })}>
                        <option value="actif">Actif</option><option value="conge">Congé</option><option value="absent">Absent</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setEditMode(false)} className="flex-1 rounded-lg border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#6B7280]">Annuler</button>
                    <BoutonMoteur code="admin_employes_enregistrer" desactive={save.isPending?"Enregistrement en cours":undefined} onExecuter={async() => { if(editedEmp)await save.mutateAsync({id:editedEmp.id,nom:editedEmp.nom,email:editedEmp.email,tel:editedEmp.tel,poste:editedEmp.poste,service:editedEmp.service,adresse:editedEmp.adresse,statut:editedEmp.statut}); }} className="flex-1 rounded-lg bg-[#D4AF37] py-2.5 text-xs font-bold text-white">Enregistrer</BoutonMoteur>
                  </div>
                </div>
              ) : (
                <>
                  {/* Infos contact */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-[#6B7280] uppercase">Contact</h3>
                      <button onClick={() => { setEditedEmp(emp); setEditMode(true); }} className="text-[10px] font-bold text-[#D4AF37] underline">Modifier</button>
                    </div>
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
                </>
              )}

              {/* Performance */}
              <div>
                <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Performance</h3>
                <div className="rounded-lg bg-[#F5F3EF] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#111]">Score global</span>
                    <span className={`text-sm font-black ${(emp.performance??0) >= 90 ? "text-green-600" : (emp.performance??0) >= 80 ? "text-amber-600" : "text-red-600"}`}>{emp.performance===null?"Non évalué":`${emp.performance}%`}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full ${(emp.performance??0) >= 90 ? "bg-green-500" : (emp.performance??0) >= 80 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${emp.performance??0}%` }} />
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

            <div className="p-4 space-y-3">{schedule.isLoading&&<p role="status">Chargement du planning…</p>}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#6B7280] uppercase">Planning hebdomadaire type</h3>
                <button onClick={() => setEditPlanning(!editPlanning)} className="text-[10px] font-bold text-[#D4AF37] underline">{editPlanning ? "Terminer" : "Modifier le planning"}</button>
              </div>

              {editPlanning && (
                <div className="mb-4 rounded-xl bg-[#F5F3EF] p-3 border border-[#D4AF37]/20">
                  <p className="text-[10px] font-bold text-[#111] mb-2 uppercase">Ajouter une mission</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select className="rounded-lg border border-[#E5E7EB] bg-white p-2 text-[10px] font-semibold" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
                      {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                    <input className="rounded-lg border border-[#E5E7EB] bg-white p-2 text-[10px] font-semibold" placeholder="Tâche..." value={newTache.tache} onChange={(e) => setNewTache({...newTache, tache: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="time" className="rounded-lg border border-[#E5E7EB] bg-white p-2 text-[10px] font-semibold" value={newTache.debut} onChange={(e) => setNewTache({...newTache, debut: e.target.value})} />
                    <input type="time" className="rounded-lg border border-[#E5E7EB] bg-white p-2 text-[10px] font-semibold" value={newTache.fin} onChange={(e) => setNewTache({...newTache, fin: e.target.value})} />
                  </div>
                  <BoutonMoteur code="admin_employes_ajouter_mission" desactive={add.isPending?"Enregistrement en cours":undefined} onExecuter={async() => { if(planningModal)await add.mutateAsync({userId:planningModal,requestId,day:JOURS.indexOf(selectedDay),startMinute:minutes(newTache.debut),endMinute:minutes(newTache.fin),title:newTache.tache}); }} className="w-full rounded-lg bg-[#D4AF37] py-2 text-[10px] font-bold text-white">Ajouter au planning</BoutonMoteur>
                </div>
              )}

              {JOURS.map((jour) => {
                const taches = planning[jour] || [];
                return (
                  <div key={jour} className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                    <div className={`px-3 py-2 text-xs font-bold flex justify-between items-center ${taches.length > 0 ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-slate-50 text-slate-400"}`}>
                      <span>{jour}{taches.length === 0 && " — Aucune mission"}</span>

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
                            {editPlanning ? (
                              <BoutonMoteur code="admin_employes_retirer_mission" desactive={cancel.isPending?"Enregistrement en cours":undefined} onExecuter={async()=>{if(!window.confirm("Retirer cette mission du planning ? Son historique sera conservé."))return false;await cancel.mutateAsync({id:t.id});}} className="h-6 w-6 rounded-full bg-red-50 flex items-center justify-center text-red-500"><span className="sr-only">Retirer la mission</span><X size={10} /></BoutonMoteur>
                            ) : (
                              <Briefcase size={12} className="text-[#9CA3AF] shrink-0" />
                            )}
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
                  <div><span className="text-sm font-black text-blue-600">{JOURS.length - Object.keys(planning).length}</span><span className="text-[9px] text-[#6B7280] ml-1">jours sans mission</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
