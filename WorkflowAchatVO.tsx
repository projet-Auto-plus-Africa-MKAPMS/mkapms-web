import { useState } from "react";
import { ChevronLeft, CheckCircle, Car, Shield, FileText, Send, Loader2, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const ETAPES_WORKFLOW = [
  { label: "Véhicule acheté", fait: true, date: "10/03 09:00" },
  { label: "Documents uploadés", fait: true, date: "10/03 10:30" },
  { label: "Transport organisé", fait: true, date: "10/03 14:00" },
  { label: "Réception véhicule", fait: true, date: "12/03 11:00" },
  { label: "Diagnostic", fait: true, date: "12/03 14:30" },
  { label: "Travaux", fait: true, date: "13/03 09:00" },
  { label: "Photos", fait: false, date: "" },
  { label: "Publication", fait: false, date: "" },
  { label: "Réservation", fait: false, date: "" },
  { label: "Vente", fait: false, date: "" },
  { label: "Livraison", fait: false, date: "" },
  { label: "Archivage", fait: false, date: "" },
];

export default function WorkflowAchatVO() {
  const [view, setView] = useState<"workflow" | "form">("workflow");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    immatriculation: "",
    marque: "",
    modele: "",
    annee: "",
    kilometrage: "",
    prixVente: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation d'enregistrement
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate("/vente/stock"), 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente/stock" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Stock</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} /> Workflow Achat VO</h1>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setView("workflow")} className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${view === "workflow" ? "bg-white text-blue-800" : "bg-white/20 text-white"}`}>Suivi Workflow</button>
          <button onClick={() => setView("form")} className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${view === "form" ? "bg-white text-blue-800" : "bg-white/20 text-white"}`}>Nouvel Achat</button>
        </div>
      </div>

      <div className="px-4 mt-4">
        {view === "workflow" ? (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
            <div className="space-y-0">
              {ETAPES_WORKFLOW.map((e, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${e.fait ? "bg-blue-600 text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}>{e.fait ? <Check size={12} /> : i + 1}</div>
                    {i < ETAPES_WORKFLOW.length - 1 && <div className={`w-0.5 h-8 ${e.fait ? "bg-blue-600" : "bg-[#E5E7EB]"}`} />}
                  </div>
                  <div className="pb-4"><p className={`text-sm ${e.fait ? "font-bold text-[#111]" : "text-[#9CA3AF]"}`}>{e.label}</p>{e.date && <p className="text-[9px] text-[#9CA3AF]">{e.date}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        ) : success ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-[#E5E7EB]">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-[#111]">Véhicule enregistré !</h2>
            <p className="text-sm text-slate-500 mt-2">Le véhicule a été ajouté à votre stock avec succès. Redirection en cours...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E5E7EB] space-y-3">
              <h3 className="text-sm font-bold text-[#111] border-b pb-2 mb-3">Détails du véhicule</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Immatriculation</label>
                  <input name="immatriculation" value={formData.immatriculation} onChange={handleInputChange} required placeholder="AB-123-CD" className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-800" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Marque</label>
                  <input name="marque" value={formData.marque} onChange={handleInputChange} required placeholder="Peugeot" className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-800" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Modèle</label>
                  <input name="modele" value={formData.modele} onChange={handleInputChange} required placeholder="3008" className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-800" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Année</label>
                  <input name="annee" value={formData.annee} onChange={handleInputChange} required placeholder="2022" className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-800" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Kilométrage</label>
                  <input name="kilometrage" value={formData.kilometrage} onChange={handleInputChange} required placeholder="45000" className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-800" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#E5E7EB]">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Prix d'achat proposé (EUR)</label>
              <input name="prixVente" value={formData.prixVente} onChange={handleInputChange} required placeholder="18500" className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-lg font-black text-blue-800 outline-none focus:border-blue-800" />
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-800 py-4 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {loading ? "Enregistrement..." : "Confirmer l'achat et enregistrer"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
