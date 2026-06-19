import { Link } from "react-router-dom";
import { ChevronLeft, Award, Star, Shield, Check, Clock, MessageSquare } from "lucide-react";
const CRITERES = [{ label: "Avis clients", score: 96 }, { label: "Litiges résolus", score: 98 }, { label: "Délais respectés", score: 94 }, { label: "Documents complets", score: 100 }];
const BADGES = [{ label: "Vérifié", ok: true }, { label: "Premium", ok: true }, { label: "Elite", ok: false }, { label: "Expert VO", ok: false }];
export default function QualiteVendeur() {
  const avg = Math.round(CRITERES.reduce((s, c) => s + c.score, 0) / CRITERES.length);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} /> Qualité Vendeur</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 text-center"><p className="text-3xl font-black text-blue-700">{avg}/100</p><p className="text-sm font-bold text-green-600 mt-1">Excellent</p></div>
      <div className="px-4 mt-3 space-y-2">{CRITERES.map(c => (<div key={c.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3"><div className="flex justify-between text-sm"><span className="text-[#111]">{c.label}</span><span className="font-bold text-blue-700">{c.score}%</span></div><div className="mt-1.5 h-1.5 rounded-full bg-[#E5E7EB]"><div className="h-full rounded-full bg-blue-600" style={{width:`${c.score}%`}} /></div></div>))}</div>
      <div className="px-4 mt-4"><h3 className="text-sm font-bold text-[#111]">Badges</h3><div className="mt-2 flex flex-wrap gap-2">{BADGES.map(b => (<span key={b.label} className={`rounded-full px-3 py-1 text-xs font-bold ${b.ok ? "bg-blue-600 text-white" : "bg-[#E5E7EB] text-red-500"}`}>{b.label}</span>))}</div></div>
    </div>
  );
}
