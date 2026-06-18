import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Globe, FileText, Search, Check, AlertTriangle, BarChart3, Code, RefreshCw } from "lucide-react";

const SITEMAP_STATS = [
  { type: "Annonces véhicules", count: 8320 },
  { type: "Annonces motos", count: 1450 },
  { type: "Annonces utilitaires", count: 890 },
  { type: "Annonces location", count: 1840 },
  { type: "Garages", count: 142 },
  { type: "Pages services", count: 35 },
];

const SEO_CHECKS = [
  { label: "robots.txt", status: "ok", detail: "Configuré : pages publiques autorisées, admin bloqué" },
  { label: "Sitemap XML", status: "ok", detail: "12 677 URLs indexées, mis à jour automatiquement" },
  { label: "Balises meta", status: "ok", detail: "Title + description sur toutes les pages publiques" },
  { label: "Open Graph", status: "ok", detail: "Facebook, LinkedIn, WhatsApp compatibles" },
  { label: "Twitter Card", status: "ok", detail: "Aperçu riche sur Twitter/X" },
  { label: "Schema.org Vehicle", status: "ok", detail: "Données structurées sur toutes les annonces" },
  { label: "Schema.org LocalBusiness", status: "ok", detail: "Données structurées sur tous les garages" },
  { label: "Google Search Console", status: "warning", detail: "À connecter avec les clés Google" },
  { label: "URLs SEO", status: "ok", detail: "/vente/marque-modele-annee-energie-ville-id" },
  { label: "Canonical URLs", status: "ok", detail: "Pas de contenu dupliqué" },
];

export default function AdminSEO() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Globe size={20} className="text-[#D4AF37]" /> SEO & Indexation Google</h1>
        <p className="text-xs text-white/50 mt-1">Sitemap · Balises · Schema.org · Search Console</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm"><p className="text-lg font-black text-green-500">12 677</p><p className="text-[9px] text-[#6B7280]">URLs indexées</p></div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm"><p className="text-lg font-black text-[#D4AF37]">98%</p><p className="text-[9px] text-[#6B7280]">Score SEO</p></div>
      </div>
      <div className="px-4 mb-4">
        <h2 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Vérifications SEO</h2>
        <div className="space-y-1.5">{SEO_CHECKS.map(c => (
          <div key={c.label} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            {c.status === "ok" ? <Check size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-yellow-500" />}
            <div className="flex-1"><p className="text-xs font-semibold text-[#111]">{c.label}</p><p className="text-[9px] text-[#6B7280]">{c.detail}</p></div>
          </div>
        ))}</div>
      </div>
      <div className="px-4 mb-4">
        <h2 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Sitemap — Contenu indexé</h2>
        <div className="space-y-1.5">{SITEMAP_STATS.map(s => (
          <div key={s.type} className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <span className="text-xs font-semibold text-[#111]">{s.type}</span>
            <span className="text-xs font-bold text-[#D4AF37]">{s.count.toLocaleString("fr-FR")}</span>
          </div>
        ))}</div>
      </div>
      <div className="px-4"><button className="w-full flex items-center justify-center gap-2 py-3 bg-[#D4AF37] text-white rounded-xl text-xs font-bold"><RefreshCw size={14} /> Regénérer le sitemap</button></div>
    </div>
  );
}
