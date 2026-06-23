import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Briefcase, ChevronDown, Check, Clock, X, CheckCircle, Search, Ban, Trash2, FileText, Mail, Phone, MapPin, Edit } from "lucide-react";

const PROS = [
  { id: 1, nom: "Garage Auto 93", type: "Garage", ville: "Bobigny", plan: "Pro Premium", siret: "123 456 789", verifie: true, email: "contact@garageauto93.fr", tel: "01 48 12 34 56", adresse: "12 Rue de la Republique, 93000 Bobigny", annonces: 45, dateInscription: "15/01/2024", statut: "actif", docs: ["Kbis", "Assurance RC Pro", "Carte professionnelle"] },
  { id: 2, nom: "LuxDrive VTC", type: "VTC / Taxi", ville: "Paris", plan: "VTC Max", siret: "987 654 321", verifie: true, email: "pro@luxdrive.fr", tel: "06 12 34 56 78", adresse: "8 Av des Champs-Elysees, 75008 Paris", annonces: 12, dateInscription: "03/03/2024", statut: "actif", docs: ["Licence VTC", "Assurance", "Kbis"] },
  { id: 3, nom: "Flash Location", type: "Location", ville: "Lyon", plan: "Location Ultimate", siret: "456 789 123", verifie: true, email: "info@flashlocation.fr", tel: "04 72 34 56 78", adresse: "25 Rue de la Part-Dieu, 69003 Lyon", annonces: 78, dateInscription: "20/11/2023", statut: "actif", docs: ["Kbis", "Assurance flotte", "RIB"] },
  { id: 4, nom: "Carrosserie SD", type: "Carrosserie", ville: "Marseille", plan: "Garage Elite", siret: "789 123 456", verifie: false, email: "carrosserie.sd@mail.com", tel: "04 91 12 34 56", adresse: "3 Bd Michelet, 13008 Marseille", annonces: 5, dateInscription: "01/06/2026", statut: "en_attente", docs: ["Kbis (en attente)"] },
  { id: 5, nom: "MotoSpeed", type: "Vente", ville: "Toulouse", plan: "Pro Start", siret: "321 654 987", verifie: true, email: "contact@motospeed.fr", tel: "05 61 12 34 56", adresse: "14 Allee Jean Jaures, 31000 Toulouse", annonces: 23, dateInscription: "08/09/2024", statut: "actif", docs: ["Kbis", "Carte pro", "RIB"] },
];

export default function AdminComptesPro() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [data, setData] = useState(PROS);
  const [profilModal, setProfilModal] = useState<number | null>(null);
  const [docsModal, setDocsModal] = useState<number | null>(null);
  const [editModal, setEditModal] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = data.filter((p) => p.nom.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase()));

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2000); }
  function doAction() {
    if (!confirmAction) return;
    const { id, action } = confirmAction;
    if (action === "supprimer") { setData((prev) => prev.filter((p) => p.id !== id)); showToast("Compte supprime"); }
    else if (action === "suspendre") { setData((prev) => prev.map((p) => p.id === id ? { ...p, statut: "suspendu" } : p)); showToast("Compte suspendu"); }
    else if (action === "suspendre_def") { setData((prev) => prev.map((p) => p.id === id ? { ...p, statut: "suspendu_def" } : p)); showToast("Compte suspendu definitivement"); }
    else if (action === "reactiver") { setData((prev) => prev.map((p) => p.id === id ? { ...p, statut: "actif" } : p)); showToast("Compte reactive"); }
    else if (action === "verifier") { setData((prev) => prev.map((p) => p.id === id ? { ...p, verifie: true, statut: "actif" } : p)); showToast("Compte verifie"); }
    setConfirmAction(null);
  }

  const profilPro = profilModal ? data.find((p) => p.id === profilModal) : null;
  const docsPro = docsModal ? data.find((p) => p.id === docsModal) : null;
  const editPro = editModal ? data.find((p) => p.id === editModal) : null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Briefcase size={20} className="text-[#D4AF37]" /> Comptes Pro</h1>
        <p className="mt-1 text-xs text-white/50">{data.length} comptes professionnels</p>
      </div>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"><CheckCircle size={16} /> {toast}</div>}

      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Total Pro", v: String(data.length), c: "text-[#D4AF37]" },
          { l: "Verifies", v: String(data.filter((p) => p.verifie).length), c: "text-green-500" },
          { l: "En attente", v: String(data.filter((p) => !p.verifie).length), c: "text-amber-500" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="px-4 mt-3"><div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un pro..." className="flex-1 text-sm outline-none" /></div></div>

      <div className="px-4 mt-3 space-y-2">
        {filtered.map((p) => {
          const isExp = expanded === p.id;
          return (
            <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : p.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${p.verifie ? "bg-green-50" : "bg-amber-50"}`}>
                  {p.verifie ? <Check size={14} className="text-green-500" /> : <Clock size={14} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{p.nom}</p>
                  <p className="text-[10px] text-[#6B7280]">{p.type} · {p.ville}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Plan</span><p className="font-bold text-[#D4AF37]">{p.plan}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">SIRET</span><p className="font-bold text-[#111]">{p.siret}</p></div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={() => setProfilModal(p.id)} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Voir profil</button>
                    <button onClick={() => setDocsModal(p.id)} className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] active:scale-[0.97]">Documents</button>
                    <button onClick={() => setEditModal(p.id)} className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Modifier</button>
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {!p.verifie && <button onClick={() => setConfirmAction({ id: p.id, action: "verifier" })} className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Verifier</button>}
                    {p.statut === "actif" && <button onClick={() => setConfirmAction({ id: p.id, action: "suspendre" })} className="flex-1 rounded-lg bg-amber-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Suspendre</button>}
                    {p.statut === "suspendu" && <button onClick={() => setConfirmAction({ id: p.id, action: "reactiver" })} className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Reactiver</button>}
                    {p.statut !== "suspendu_def" && <button onClick={() => setConfirmAction({ id: p.id, action: "suspendre_def" })} className="flex-1 rounded-lg bg-orange-600 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Susp. Def.</button>}
                    <button onClick={() => setConfirmAction({ id: p.id, action: "supprimer" })} className="flex-1 rounded-lg bg-red-500 py-1.5 text-[9px] font-bold text-white active:scale-[0.97]">Supprimer</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PROFIL MODAL */}
      {profilPro && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setProfilModal(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-base font-black text-[#111]">Profil — {profilPro.nom}</h2>
              <button onClick={() => setProfilModal(null)} className="p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2"><div className={`h-10 w-10 rounded-full grid place-items-center ${profilPro.verifie ? "bg-green-50" : "bg-amber-50"}`}>{profilPro.verifie ? <Check size={18} className="text-green-500" /> : <Clock size={18} className="text-amber-500" />}</div><div><p className="text-sm font-bold">{profilPro.nom}</p><p className="text-[10px] text-[#6B7280]">{profilPro.verifie ? "Verifie" : "En attente de verification"}</p></div></div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Type", value: profilPro.type, icon: <Briefcase size={10} className="text-[#D4AF37]" /> },
                  { label: "Ville", value: profilPro.ville, icon: <MapPin size={10} className="text-[#D4AF37]" /> },
                  { label: "Email", value: profilPro.email, icon: <Mail size={10} className="text-[#D4AF37]" /> },
                  { label: "Telephone", value: profilPro.tel, icon: <Phone size={10} className="text-[#D4AF37]" /> },
                  { label: "SIRET", value: profilPro.siret, icon: <FileText size={10} className="text-[#D4AF37]" /> },
                  { label: "Plan", value: profilPro.plan, icon: <Briefcase size={10} className="text-[#D4AF37]" /> },
                  { label: "Annonces", value: String(profilPro.annonces), icon: <FileText size={10} className="text-[#D4AF37]" /> },
                  { label: "Inscription", value: profilPro.dateInscription, icon: <Clock size={10} className="text-[#D4AF37]" /> },
                ].map((f) => (
                  <div key={f.label} className="rounded-lg bg-[#F5F3EF] p-2">
                    <p className="text-[7px] text-[#6B7280] flex items-center gap-1">{f.icon} {f.label}</p>
                    <p className="text-[10px] font-bold text-[#111] mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-[#F5F3EF] p-2"><p className="text-[7px] text-[#6B7280] flex items-center gap-1"><MapPin size={10} className="text-[#D4AF37]" /> Adresse</p><p className="text-[10px] font-bold text-[#111] mt-0.5">{profilPro.adresse}</p></div>
              <p className="text-[9px] text-[#6B7280]">Statut : <span className={`font-bold ${profilPro.statut === "actif" ? "text-green-600" : profilPro.statut === "en_attente" ? "text-amber-600" : "text-red-600"}`}>{profilPro.statut}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTS MODAL */}
      {docsPro && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDocsModal(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-base font-black text-[#111]">Documents — {docsPro.nom}</h2>
              <button onClick={() => setDocsModal(null)} className="p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-2">
              {docsPro.docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-[#F5F3EF] p-3 border border-[#E5E7EB]">
                  <FileText size={16} className="text-[#D4AF37] shrink-0" />
                  <div className="flex-1 min-w-0"><p className="text-xs font-bold text-[#111]">{doc}</p><p className="text-[9px] text-[#6B7280]">{doc.includes("attente") ? "En cours de verification" : "Valide"}</p></div>
                  <span className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${doc.includes("attente") ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{doc.includes("attente") ? "En attente" : "OK"}</span>
                </div>
              ))}
              {docsPro.docs.length === 0 && <p className="text-xs text-[#6B7280] text-center py-6">Aucun document</p>}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editPro && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-base font-black text-[#111]">Modifier — {editPro.nom}</h2>
              <button onClick={() => setEditModal(null)} className="p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "Nom", field: "nom" as const, value: editPro.nom },
                { label: "Email", field: "email" as const, value: editPro.email },
                { label: "Telephone", field: "tel" as const, value: editPro.tel },
                { label: "Adresse", field: "adresse" as const, value: editPro.adresse },
                { label: "Plan", field: "plan" as const, value: editPro.plan },
              ].map((f) => (
                <div key={f.label}><label className="text-[10px] font-bold text-[#6B7280]">{f.label}</label><input defaultValue={f.value} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]" onBlur={(e) => setData((prev) => prev.map((p) => p.id === editPro.id ? { ...p, [f.field]: e.target.value } : p))} /></div>
              ))}
              <button onClick={() => { setEditModal(null); showToast("Modifications enregistrees"); }} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white active:scale-[0.97]">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-[#111] mb-2">Confirmer l'action</p>
            <p className="text-xs text-[#6B7280] mb-4">
              {confirmAction.action === "supprimer" && "Supprimer definitivement ce compte pro ?"}
              {confirmAction.action === "suspendre" && "Suspendre temporairement ce compte pro ?"}
              {confirmAction.action === "suspendre_def" && "Suspendre definitivement ce compte pro ?"}
              {confirmAction.action === "reactiver" && "Reactiver ce compte pro ?"}
              {confirmAction.action === "verifier" && "Valider et verifier ce compte pro ?"}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)} className="flex-1 rounded-xl bg-[#F5F3EF] py-2 text-sm font-bold text-[#111]">Annuler</button>
              <button onClick={doAction} className={`flex-1 rounded-xl py-2 text-sm font-bold text-white ${confirmAction.action === "supprimer" || confirmAction.action === "suspendre_def" ? "bg-red-500" : confirmAction.action === "suspendre" ? "bg-amber-500" : "bg-green-500"}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
