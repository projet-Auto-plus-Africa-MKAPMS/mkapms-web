import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, Check, Clock, X, Euro, FileText, Eye } from "lucide-react";
import { DocumentView, buildContratData } from "../../components/DocumentPDF";
const RESERVATIONS = [
  { id: 1, client: "Marie L.", vehicule: "Peugeot 3008 GT", acompte: 1000, date: "15/03", statut: "validee" as const },
  { id: 2, client: "Jean D.", vehicule: "BMW 320d", acompte: 1500, date: "14/03", statut: "recue" as const },
  { id: 3, client: "SAS Auto+", vehicule: "Mercedes E 220d", acompte: 2000, date: "12/03", statut: "refusee" as const },
];
export default function ReservationsVente() {
  const [modalDoc, setModalDoc] = useState<any>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} /> Réservations Vente</h1></div>
      <div className="px-4 mt-4 space-y-2">{RESERVATIONS.map((r) => (
        <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><div><h3 className="text-sm font-bold text-[#111]">{r.client}</h3><p className="text-[10px] text-[#6B7280]">{r.vehicule} · {r.date}</p></div>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold h-fit ${r.statut === "validee" ? "bg-green-50 text-green-600" : r.statut === "recue" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>{r.statut === "validee" ? "Validée" : r.statut === "recue" ? "Reçue" : "Refusée"}</span></div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2"><Euro size={12} className="text-[#D4AF37]" /><span className="text-sm font-bold text-[#D4AF37]">Acompte: {r.acompte} €</span></div>
            {r.statut === "validee" && (
              <button 
                onClick={() => setModalDoc(buildContratData({ vehicule: r.vehicule, client: r.client, type: "Réservation", prix: `${r.acompte} € (Acompte)`, ref: `RES-${r.id}` }))}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
              >
                <Eye size={12} /> Voir Reçu
              </button>
            )}
          </div>
          {r.statut === "recue" && <div className="mt-2 grid grid-cols-2 gap-2"><button className="rounded-lg bg-green-600 py-2 text-xs font-bold text-white">Valider</button><button className="rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600">Refuser</button></div>}
        </div>))}</div>
      {modalDoc && <DocumentView doc={modalDoc} onClose={() => setModalDoc(null)} />}
    </div>
  );
}
