import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Bell, AlertTriangle, CheckCircle, X, Clock,
  Shield, CreditCard, Target, Package, Zap, Eye, Download, Trash2
} from "lucide-react";

type Tab = "toutes" | "critiques" | "paiements" | "stock" | "abonnements" | "securite";
type Gravite = "critique" | "haute" | "moyenne" | "info";

interface Alerte {
  id: number;
  titre: string;
  detail: string;
  type: string;
  gravite: Gravite;
  date: string;
  heure: string;
  lue: boolean;
  icon: typeof Bell;
}

const ALERTES: Alerte[] = [
  { id: 1, titre: "Tentative de fraude detectee", detail: "Adresse IP 185.xx.xx.xx — 5 tentatives de paiement avec carte invalide depuis le meme appareil", type: "securite", gravite: "critique", date: "09/06/2026", heure: "18:05", lue: false, icon: Shield },
  { id: 2, titre: "Paiement refuse — 1 580 EUR", detail: "Client: Jean-Pierre D. · Ref: PAY-2026-0408 · Motif: Provision insuffisante", type: "paiements", gravite: "haute", date: "09/06/2026", heure: "17:42", lue: false, icon: CreditCard },
  { id: 3, titre: "Facture impayee — 45 000 EUR", detail: "Facture FA-2026-0498 · Client: Pierre K. · Echeance depassee de 15 jours · Enchere Porsche 911", type: "paiements", gravite: "critique", date: "09/06/2026", heure: "16:30", lue: false, icon: AlertTriangle },
  { id: 4, titre: "Rupture de stock — Plaquettes frein Bosch", detail: "Reference: PLQ-B-2045 · Stock actuel: 0 unite · Derniere commande: 15/05/2026 · Fournisseur: Bosch France", type: "stock", gravite: "haute", date: "09/06/2026", heure: "15:20", lue: false, icon: Package },
  { id: 5, titre: "Abonnement expire — Garage Auto 93", detail: "Plan: Pro Premium · Expire le 01/06/2026 · Aucun renouvellement detecte · 3 relances envoyees", type: "abonnements", gravite: "moyenne", date: "08/06/2026", heure: "09:00", lue: true, icon: Clock },
  { id: 6, titre: "Objectif CA Location atteint", detail: "Objectif mensuel: 65 000 EUR · Realise: 68 200 EUR (105%) · Felicitations a l'equipe location!", type: "info", gravite: "info", date: "08/06/2026", heure: "08:15", lue: true, icon: Target },
  { id: 7, titre: "Depassement budget marketing", detail: "Budget mensuel: 5 000 EUR · Depense actuelle: 5 800 EUR (+16%) · Action requise: validation PDG", type: "paiements", gravite: "haute", date: "07/06/2026", heure: "14:30", lue: true, icon: AlertTriangle },
  { id: 8, titre: "Objectif Garage non atteint", detail: "Objectif: 40 000 EUR · Realise: 34 800 EUR (87%) · Ecart: -5 200 EUR", type: "info", gravite: "moyenne", date: "07/06/2026", heure: "08:00", lue: true, icon: Target },
  { id: 9, titre: "Paiement recu — 28 500 EUR", detail: "Client: Martin D. · Ref: PAY-2026-0412 · Virement SEPA · Vente Peugeot 3008 GT", type: "paiements", gravite: "info", date: "06/06/2026", heure: "10:45", lue: true, icon: CheckCircle },
  { id: 10, titre: "Activite inhabituelle detectee", detail: "12 connexions depuis la meme adresse IP en 5 minutes · Compte: admin@garage-meca.fr", type: "securite", gravite: "haute", date: "06/06/2026", heure: "03:22", lue: true, icon: Shield },
  { id: 11, titre: "Abonnement suspendu — Livraison Pro", detail: "Client: Livraison Rapide · Plan: Pro 69 EUR/mois · Motif: 3 paiements echoues consecutifs", type: "abonnements", gravite: "moyenne", date: "05/06/2026", heure: "09:00", lue: true, icon: Clock },
  { id: 12, titre: "Stock critique — Filtres a huile", detail: "Reference: FH-M-1082 · Stock: 2 unites · Seuil d'alerte: 5 · Delai fournisseur: 7 jours", type: "stock", gravite: "moyenne", date: "05/06/2026", heure: "07:30", lue: true, icon: Package },
];

const GRAVITE_STYLE: Record<Gravite, string> = {
  critique: "bg-red-50 border-red-200 text-red-700",
  haute: "bg-amber-50 border-amber-200 text-amber-700",
  moyenne: "bg-blue-50 border-blue-200 text-blue-700",
  info: "bg-green-50 border-green-200 text-green-700",
};

const GRAVITE_LABEL: Record<Gravite, string> = {
  critique: "Critique",
  haute: "Haute",
  moyenne: "Moyenne",
  info: "Info",
};

export default function Alertes() {
  const [tab, setTab] = useState<Tab>("toutes");
  const [modalAlerte, setModalAlerte] = useState<Alerte | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = ALERTES.filter(a => {
    if (tab === "critiques") return a.gravite === "critique" || a.gravite === "haute";
    if (tab === "paiements") return a.type === "paiements";
    if (tab === "stock") return a.type === "stock";
    if (tab === "abonnements") return a.type === "abonnements";
    if (tab === "securite") return a.type === "securite";
    return true;
  });

  const nonLues = ALERTES.filter(a => !a.lue).length;
  const critiques = ALERTES.filter(a => a.gravite === "critique").length;

  const Overlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-[#F5F3EF] grid place-items-center"><X size={16} /></button>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/compta-dirigeant" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Comptabilite</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> Centre d'alertes</h1>
        <p className="mt-0.5 text-sm text-white/60">Alertes en temps reel — paiements, stock, securite</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-red-500">{nonLues}</p>
          <p className="text-[9px] text-[#6B7280]">Non lues</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm">
          <p className="text-2xl font-black text-amber-600">{critiques}</p>
          <p className="text-[9px] text-[#6B7280]">Critiques</p>
        </div>
      </div>

      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {(["toutes", "critiques", "paiements", "stock", "abonnements", "securite"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {t === "toutes" ? "Toutes" : t === "critiques" ? "Urgentes" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {filtered.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.id} onClick={() => setModalAlerte(a)} className={`w-full rounded-xl border p-3 text-left active:scale-[0.98] transition ${a.lue ? "bg-white border-[#E5E7EB]" : "bg-white border-[#D4AF37] shadow-sm"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-8 w-8 rounded-lg grid place-items-center shrink-0 ${GRAVITE_STYLE[a.gravite].split(" ").slice(0, 1).join("")}`}>
                  <Icon size={14} className={GRAVITE_STYLE[a.gravite].split(" ").pop()} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-bold text-[#111] truncate ${!a.lue ? "" : "opacity-70"}`}>{a.titre}</p>
                    {!a.lue && <div className="h-2 w-2 rounded-full bg-[#D4AF37] shrink-0" />}
                  </div>
                  <p className="text-[10px] text-[#6B7280] line-clamp-1">{a.detail}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${GRAVITE_STYLE[a.gravite]}`}>{GRAVITE_LABEL[a.gravite]}</span>
                    <span className="text-[9px] text-[#9CA3AF]">{a.date} · {a.heure}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {modalAlerte && (
        <Overlay onClose={() => setModalAlerte(null)}>
          <div className="p-5 pt-10">
            <div className="flex items-center gap-2 mb-2">
              <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${GRAVITE_STYLE[modalAlerte.gravite]}`}>{GRAVITE_LABEL[modalAlerte.gravite]}</span>
              <span className="text-[10px] text-[#6B7280]">{modalAlerte.date} · {modalAlerte.heure}</span>
            </div>
            <h2 className="text-lg font-black text-[#111] mb-2">{modalAlerte.titre}</h2>
            <div className="rounded-xl bg-[#F5F3EF] p-4 mb-4">
              <p className="text-xs text-[#6B7280] leading-relaxed">{modalAlerte.detail}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { showToast("Alerte marquee comme traitee"); setModalAlerte(null); }} className="flex-1 rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1"><CheckCircle size={14} /> Traiter</button>
              <button onClick={() => { showToast("Alerte supprimee"); setModalAlerte(null); }} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Trash2 size={14} /> Supprimer</button>
            </div>
          </div>
        </Overlay>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[90%]">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400 shrink-0" /><span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
