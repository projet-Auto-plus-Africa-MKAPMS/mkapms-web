import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Download, FileText, Table, File, Check } from "lucide-react";
const EXPORTS = [
  { label: "Rapport ventes", formats: ["PDF", "Excel", "CSV"] },
  { label: "Rapport stock", formats: ["PDF", "Excel"] },
  { label: "Rapport comptable", formats: ["PDF", "Excel", "CSV"] },
  { label: "Liste clients", formats: ["Excel", "CSV"] },
  { label: "Factures", formats: ["PDF"] },
];
export default function CentreExport() {
  const [derniers, setDerniers] = useState<Record<string, { format: string; heure: string }>>({});
  const marquerGenere = (rapport: string, format: string) => {
    setDerniers((prev) => ({
      ...prev,
      [rapport]: { format, heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) },
    }));
  };
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/resume-vendeur" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Download size={20} /> Export</h1></div>
      <div className="px-4 mt-4 space-y-2">{EXPORTS.map(e => {
        const dernier = derniers[e.label];
        return (
        <div key={e.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111] mb-2">{e.label}</h3>
          <div className="flex gap-2 flex-wrap">{e.formats.map(f => (
            <button
              key={f}
              onClick={() => marquerGenere(e.label, f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${dernier?.format === f ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-700"}`}
            >
              {f}
            </button>
          ))}</div>
          {dernier && (
            <p className="mt-1.5 text-[9px] text-green-600 font-semibold flex items-center gap-1"><Check size={10} /> Format {dernier.format} sélectionné à {dernier.heure}</p>
          )}
        </div>);
      })}</div>
    </div>
  );
}
