import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calculator, FileText, CheckCircle, ArrowRight, Shield, Clock, CreditCard,
  Car, Truck, AlertTriangle, Star, ChevronDown, ChevronRight, Users,
  Bell, FolderOpen, Download, Eye, Wallet, Calendar, TrendingUp, Lock,
  Bike, MapPin, Zap,
} from "lucide-react";

/* ═══ TYPES ═══ */
type VehiculeType = "voiture" | "utilitaire" | "moto" | "scooter" | "vtc" | "taxi";
type ModePaiement = "loa" | "fractionne";

const VEHICLE_TYPES: { id: VehiculeType; label: string; icon: typeof Car }[] = [
  { id: "voiture", label: "Voiture", icon: Car },
  { id: "utilitaire", label: "Utilitaire", icon: Truck },
  { id: "moto", label: "Moto", icon: Bike },
  { id: "scooter", label: "Scooter", icon: Bike },
  { id: "vtc", label: "Véhicule VTC", icon: Car },
  { id: "taxi", label: "Véhicule Taxi", icon: Car },
];

const LOA_DUREES = [24, 36, 48, 60];
const FRAC_PARTS_PART = [2, 3, 4, 5, 10];
const FRAC_PARTS_PRO = [2, 3, 4, 5];

const STEPS_LOA = ["Véhicule", "Simulation", "Dossier", "Validation", "Signature", "Livraison"];
const STEPS_FRAC = ["Véhicule", "Simulation", "Validation"];

const DOC_PARTICULIER = [
  { key: "identite", label: "Pièce d'identité" },
  { key: "domicile", label: "Justificatif de domicile" },
  { key: "revenus", label: "Justificatif de revenus" },
  { key: "permis", label: "Permis de conduire" },
];
const DOC_PRO = [
  { key: "kbis", label: "KBIS ou équivalent" },
  { key: "identite_dir", label: "Pièce d'identité dirigeant" },
  { key: "siret", label: "SIRET" },
  { key: "tva", label: "N° TVA intracommunautaire" },
  { key: "rib", label: "RIB société" },
];

const STATUTS_DOSSIER = [
  { id: "recu", label: "Dossier reçu", color: "text-blue-600" },
  { id: "analyse", label: "En cours d'analyse", color: "text-orange-600" },
  { id: "manquant", label: "Documents manquants", color: "text-red-600" },
  { id: "accepte", label: "Accepté", color: "text-green-600" },
  { id: "refuse", label: "Refusé", color: "text-red-700" },
];

const NOTIF_ECHEANCES = [
  "30 jours avant échéance", "15 jours avant échéance", "7 jours avant échéance",
  "3 jours avant échéance", "Jour J", "Retard paiement", "Paiement reçu", "Contrat terminé",
];

/* ═══ DEMO DATA ═══ */
const DEMO_CONTRATS = [
  { id: 1, vehicule: "Peugeot 208 1.2 PureTech", type: "LOA", mensualite: 299, duree: 48, restant: 36, paye: 3588, total: 14352, statut: "Actif", prochaine: "15/07/2026" },
  { id: 2, vehicule: "Renault Clio V dCi", type: "Paiement fractionné (4x)", mensualite: 3125, duree: 4, restant: 2, paye: 6250, total: 12500, statut: "Actif", prochaine: "01/08/2026" },
];

export default function Finance() {
  const [mode, setMode] = useState<ModePaiement | null>(null);
  const [step, setStep] = useState(0);
  const [vehiculeType, setVehiculeType] = useState<VehiculeType | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Simulation LOA
  const [loaPrix, setLoaPrix] = useState(15000);
  const [loaDuree, setLoaDuree] = useState(48);
  const [loaApport, setLoaApport] = useState(2000);
  const optionAchat = Math.round(loaPrix * 0.15);
  const loaMensualite = Math.round((loaPrix - loaApport - optionAchat) / loaDuree);

  // Simulation fractionné
  const [fracPrix, setFracPrix] = useState(8000);
  const [fracParts, setFracParts] = useState(4);
  const [isPro, setIsPro] = useState(false);
  const fracMensualite = Math.round(fracPrix / fracParts);

  // Dossier
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [dossierStatut, setDossierStatut] = useState("recu");

  // Accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const steps = mode === "loa" ? STEPS_LOA : STEPS_FRAC;

  /* ═══ TABLEAU DE BORD ═══ */
  if (showDashboard) {
    return (
      <div className="bg-white">
        <div className="border-b border-[#F5F5F5]">
          <div className="container-page py-4">
            <button onClick={() => setShowDashboard(false)} className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline">
              ← Retour à Finance+
            </button>
            <h1 className="mt-2 text-xl font-extrabold text-[#111]">Tableau de bord Finance+</h1>
            <p className="text-xs text-slate-500">Suivez vos contrats, paiements et échéances</p>
          </div>
        </div>
        <div className="container-page py-6">
          {/* Stats rapides */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {[
              { label: "Contrats actifs", value: "2", icon: FileText, color: "text-[#D4AF37]" },
              { label: "Paiements effectués", value: "9 838 €", icon: CheckCircle, color: "text-green-600" },
              { label: "Paiements restants", value: "17 014 €", icon: Clock, color: "text-orange-600" },
              { label: "Prochaine échéance", value: "15/07/2026", icon: Calendar, color: "text-blue-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#D4AF37]/20 bg-white p-4">
                <s.icon size={18} className={s.color} />
                <p className="mt-2 text-lg font-extrabold text-[#111]">{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Contrats */}
          <h2 className="mt-6 text-sm font-extrabold text-[#111]">Mes contrats</h2>
          <div className="mt-3 space-y-3">
            {DEMO_CONTRATS.map((c) => (
              <div key={c.id} className="rounded-xl border border-[#D4AF37]/20 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#111]">{c.vehicule}</h3>
                    <p className="text-[10px] text-slate-500">{c.type}</p>
                  </div>
                  <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[9px] font-bold text-green-700">{c.statut}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div><p className="text-[9px] text-slate-400">Mensualité</p><p className="text-sm font-bold text-[#111]">{c.mensualite} €</p></div>
                  <div><p className="text-[9px] text-slate-400">Mois restants</p><p className="text-sm font-bold text-[#111]">{c.restant} / {c.duree}</p></div>
                  <div><p className="text-[9px] text-slate-400">Payé</p><p className="text-sm font-bold text-green-600">{c.paye.toLocaleString()} €</p></div>
                  <div><p className="text-[9px] text-slate-400">Prochaine échéance</p><p className="text-sm font-bold text-[#111]">{c.prochaine}</p></div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => showToast(`Contrat ${c.vehicule} — ${c.type}, ${c.restant} mois restants`)} className="flex items-center gap-1 rounded-lg border border-[#D4AF37] px-3 py-1.5 text-[9px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition"><Eye size={10} /> Voir</button>
                  <button onClick={() => showToast(`Echeancier PDF ${c.vehicule} telecharge`)} className="flex items-center gap-1 rounded-lg border border-[#D4AF37] px-3 py-1.5 text-[9px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition"><Download size={10} /> Échéancier PDF</button>
                  <button onClick={() => showToast(`Documents du contrat ${c.vehicule} ouverts`)} className="flex items-center gap-1 rounded-lg border border-[#D4AF37] px-3 py-1.5 text-[9px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition"><FolderOpen size={10} /> Documents</button>
                </div>
              </div>
            ))}
          </div>

          {/* Notifications échéances */}
          <h2 className="mt-6 text-sm font-extrabold text-[#111]">Notifications automatiques</h2>
          <div className="mt-3 grid gap-2 grid-cols-2 md:grid-cols-4">
            {NOTIF_ECHEANCES.map((n) => (
              <div key={n} className="flex items-center gap-1.5 rounded-lg border border-[#F5F5F5] bg-white p-2 text-[9px] text-[#111]">
                <Bell size={10} className="text-[#D4AF37]" /> {n}
              </div>
            ))}
          </div>

          {/* Documents */}
          <h2 className="mt-6 text-sm font-extrabold text-[#111]">Centre de documents Finance+</h2>
          <p className="text-[10px] text-slate-500">Tous les documents restent dans MKA.P-MS. Aucun échange par email.</p>
          <div className="mt-3 grid gap-2 grid-cols-2 md:grid-cols-3">
            {["Contrats", "Factures", "Échéancier", "Justificatifs", "Signatures", "Conditions générales"].map((d) => (
              <button key={d} onClick={() => showToast(`Dossier ${d} ouvert`)} className="flex items-center gap-2 rounded-lg border border-[#D4AF37]/20 bg-white p-3 text-[10px] font-bold text-[#111] hover:border-[#D4AF37] transition">
                <FolderOpen size={14} className="text-[#D4AF37]" /> {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══ PARCOURS (STEP > 0) ═══ */
  if (mode && step > 0) {
    return (
      <div className="bg-white">
        <div className="border-b border-[#F5F5F5]">
          <div className="container-page py-4">
            <button onClick={() => { if (step > 1) setStep(step - 1); else { setStep(0); setMode(null); } }} className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline">
              ← Retour
            </button>
            <h1 className="mt-2 text-lg font-extrabold text-[#111]">
              {mode === "loa" ? "Location avec Option d'Achat" : "Paiement fractionné"}
            </h1>
            {/* Progress */}
            <div className="mt-3 flex gap-1">
              {steps.map((s, i) => (
                <div key={s} className={`flex-1 rounded-full py-1 text-center text-[8px] font-bold ${i + 1 <= step ? "bg-[#D4AF37] text-white" : "bg-[#F5F5F5] text-slate-400"}`}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container-page py-6">
          {/* STEP 1 — Véhicule */}
          {step === 1 && (
            <div>
              <h2 className="text-sm font-bold text-[#111]">Type de véhicule</h2>
              <p className="mt-1 text-xs text-slate-500">Sélectionnez le type de véhicule que vous souhaitez financer.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {VEHICLE_TYPES.map((v) => {
                  const Icon = v.icon;
                  return (
                    <button key={v.id} onClick={() => setVehiculeType(v.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${vehiculeType === v.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-200 hover:border-[#D4AF37]/50"}`}>
                      <Icon size={24} className={vehiculeType === v.id ? "text-[#D4AF37]" : "text-slate-400"} />
                      <span className="text-xs font-bold text-[#111]">{v.label}</span>
                    </button>
                  );
                })}
              </div>
              <button disabled={!vehiculeType} onClick={() => setStep(2)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-40">
                Continuer <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 2 — Simulation */}
          {step === 2 && mode === "loa" && (
            <div>
              <h2 className="text-sm font-bold text-[#111]">Simulation LOA</h2>
              <p className="mt-1 text-xs text-slate-500">Ajustez les paramètres pour voir votre mensualité estimée.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#111]">Prix du véhicule</label>
                  <input type="range" min={5000} max={80000} step={500} value={loaPrix} onChange={(e) => setLoaPrix(Number(e.target.value))}
                    className="mt-1 w-full accent-[#D4AF37]" />
                  <p className="text-right text-sm font-bold text-[#D4AF37]">{loaPrix.toLocaleString()} €</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#111]">Apport initial</label>
                  <input type="range" min={0} max={Math.round(loaPrix * 0.5)} step={500} value={loaApport} onChange={(e) => setLoaApport(Number(e.target.value))}
                    className="mt-1 w-full accent-[#D4AF37]" />
                  <p className="text-right text-sm font-bold text-[#111]">{loaApport.toLocaleString()} €</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#111]">Durée</label>
                  <div className="mt-1 flex gap-2">
                    {LOA_DUREES.map((d) => (
                      <button key={d} onClick={() => setLoaDuree(d)}
                        className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${loaDuree === d ? "bg-[#D4AF37] text-white" : "border border-[#D4AF37]/30 text-[#111] hover:bg-[#D4AF37]/5"}`}>
                        {d} mois
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Résultat simulation */}
              <div className="mt-6 rounded-xl border-2 border-[#D4AF37] bg-[#FFFDF5] p-5 text-center">
                <p className="text-xs font-semibold text-[#8B6914]">Votre mensualité estimée</p>
                <p className="mt-2 text-3xl font-extrabold text-[#D4AF37]">{loaMensualite} € <span className="text-sm font-normal text-slate-500">/mois</span></p>
                <p className="mt-1 text-xs text-[#111]">sur <strong>{loaDuree} mois</strong></p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-[9px] text-slate-400">Prix véhicule</p><p className="text-sm font-bold text-[#111]">{loaPrix.toLocaleString()} €</p></div>
                  <div><p className="text-[9px] text-slate-400">Apport</p><p className="text-sm font-bold text-[#111]">{loaApport.toLocaleString()} €</p></div>
                  <div><p className="text-[9px] text-slate-400">Option d'achat</p><p className="text-sm font-bold text-[#D4AF37]">{optionAchat.toLocaleString()} €</p></div>
                </div>
                <p className="mt-2 text-[9px] text-slate-400">Option d'achat disponible en fin de contrat</p>
              </div>
              <button onClick={() => setStep(3)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
                Constituer mon dossier <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 2 && mode === "fractionne" && (
            <div>
              <h2 className="text-sm font-bold text-[#111]">Simulation paiement fractionné</h2>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setIsPro(false)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${!isPro ? "bg-[#D4AF37] text-white" : "border border-[#D4AF37]/30 text-[#111]"}`}>Particulier</button>
                <button onClick={() => setIsPro(true)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${isPro ? "bg-[#D4AF37] text-white" : "border border-[#D4AF37]/30 text-[#111]"}`}>Professionnel</button>
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold text-[#111]">Prix du véhicule</label>
                <input type="range" min={1000} max={50000} step={500} value={fracPrix} onChange={(e) => setFracPrix(Number(e.target.value))}
                  className="mt-1 w-full accent-[#D4AF37]" />
                <p className="text-right text-sm font-bold text-[#D4AF37]">{fracPrix.toLocaleString()} €</p>
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold text-[#111]">Nombre de fois</label>
                <div className="mt-1 flex gap-2">
                  {(isPro ? FRAC_PARTS_PRO : FRAC_PARTS_PART).map((p) => (
                    <button key={p} onClick={() => setFracParts(p)}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${fracParts === p ? "bg-[#D4AF37] text-white" : "border border-[#D4AF37]/30 text-[#111]"}`}>
                      {p}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl border-2 border-[#D4AF37] bg-[#FFFDF5] p-5 text-center">
                <p className="text-xs font-semibold text-[#8B6914]">Votre paiement fractionné</p>
                <p className="mt-2 text-3xl font-extrabold text-[#D4AF37]">{fracParts} x {fracMensualite.toLocaleString()} €</p>
                <p className="mt-1 text-xs text-[#111]">Total : <strong>{fracPrix.toLocaleString()} €</strong></p>
                <p className="mt-1 text-[9px] text-slate-400">Sans frais supplémentaires</p>
              </div>
              <button onClick={() => setStep(3)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
                Valider <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 3 — Dossier (LOA) / Validation (fractionné) */}
          {step === 3 && mode === "loa" && (
            <div>
              <h2 className="text-sm font-bold text-[#111]">Constitution du dossier</h2>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setIsPro(false)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${!isPro ? "bg-[#D4AF37] text-white" : "border border-[#D4AF37]/30 text-[#111]"}`}>Particulier</button>
                <button onClick={() => setIsPro(true)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${isPro ? "bg-[#D4AF37] text-white" : "border border-[#D4AF37]/30 text-[#111]"}`}>Professionnel</button>
              </div>
              <div className="mt-4 space-y-2">
                {(isPro ? DOC_PRO : DOC_PARTICULIER).map((d) => (
                  <label key={d.key} className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-white p-3 cursor-pointer hover:border-[#D4AF37] transition">
                    <input type="checkbox" checked={!!docs[d.key]} onChange={(e) => setDocs({ ...docs, [d.key]: e.target.checked })}
                      className="h-4 w-4 rounded border-[#D4AF37] text-[#D4AF37] accent-[#D4AF37]" />
                    <span className="text-xs font-semibold text-[#111]">{d.label}</span>
                    {docs[d.key] && <CheckCircle size={14} className="ml-auto text-green-500" />}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-[9px] text-slate-400">Tous les documents restent dans MKA.P-MS. Aucun échange par email.</p>
              <button onClick={() => setStep(4)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
                Soumettre le dossier <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 3 && mode === "fractionne" && (
            <div>
              <h2 className="text-sm font-bold text-[#111]">Confirmation</h2>
              <div className="mt-4 rounded-xl border-2 border-green-400 bg-green-50 p-5 text-center">
                <CheckCircle size={32} className="mx-auto text-green-500" />
                <h3 className="mt-3 text-base font-extrabold text-green-800">Paiement fractionné validé !</h3>
                <p className="mt-1 text-xs text-green-700">{fracParts} x {fracMensualite.toLocaleString()} € — Total {fracPrix.toLocaleString()} €</p>
                <p className="mt-3 text-[10px] text-green-600">Votre échéancier est disponible dans votre espace MKA.P-MS.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={() => setShowDashboard(true)} className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white hover:bg-[#C5A028]"><Eye size={12} /> Voir mon tableau de bord</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Validation LOA */}
          {step === 4 && mode === "loa" && (
            <div>
              <h2 className="text-sm font-bold text-[#111]">Suivi du dossier</h2>
              <div className="mt-4 space-y-2">
                {STATUTS_DOSSIER.map((s, i) => (
                  <div key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 ${s.id === dossierStatut ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-[#F5F5F5]"}`}>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${s.id === dossierStatut ? "bg-[#D4AF37]" : "bg-[#F5F5F5]"}`}>
                      <span className={`text-[9px] font-bold ${s.id === dossierStatut ? "text-white" : "text-slate-400"}`}>{i + 1}</span>
                    </div>
                    <span className={`text-xs font-semibold ${s.id === dossierStatut ? s.color : "text-slate-400"}`}>{s.label}</span>
                    {s.id === dossierStatut && <CheckCircle size={14} className="ml-auto text-[#D4AF37]" />}
                  </div>
                ))}
              </div>
              <button onClick={() => { setDossierStatut("accepte"); setStep(5); }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
                Simuler l'acceptation <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 5 — Signature */}
          {step === 5 && mode === "loa" && (
            <div>
              <h2 className="text-sm font-bold text-[#111]">Signature électronique</h2>
              <p className="mt-1 text-xs text-slate-500">Signez votre contrat LOA et les conditions générales.</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Contrat LOA", desc: "Conditions de location avec option d'achat" },
                  { label: "Conditions générales", desc: "Conditions générales de Finance+ MKA.P-MS" },
                  { label: "Autorisations nécessaires", desc: "Autorisations liées au suivi du véhicule" },
                ].map((d) => (
                  <label key={d.label} className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/20 bg-white p-4 cursor-pointer hover:border-[#D4AF37] transition">
                    <input type="checkbox" className="h-4 w-4 accent-[#D4AF37]" />
                    <div><p className="text-xs font-bold text-[#111]">{d.label}</p><p className="text-[9px] text-slate-500">{d.desc}</p></div>
                  </label>
                ))}
              </div>
              <button onClick={() => setStep(6)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
                Signer et valider <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 6 — Livraison */}
          {step === 6 && mode === "loa" && (
            <div>
              <h2 className="text-sm font-bold text-[#111]">Livraison du véhicule</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Préparation", desc: "Le véhicule est en cours de préparation", done: true },
                  { label: "Livraison programmée", desc: "La date de livraison sera communiquée sous 48h", done: true },
                  { label: "Livré", desc: "Véhicule remis et contrat activé", done: false },
                ].map((s) => (
                  <div key={s.label} className={`flex items-center gap-3 rounded-xl border p-4 ${s.done ? "border-green-200 bg-green-50" : "border-[#F5F5F5]"}`}>
                    <CheckCircle size={16} className={s.done ? "text-green-500" : "text-slate-300"} />
                    <div><p className="text-xs font-bold text-[#111]">{s.label}</p><p className="text-[9px] text-slate-500">{s.desc}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border-2 border-green-400 bg-green-50 p-5 text-center">
                <CheckCircle size={32} className="mx-auto text-green-500" />
                <h3 className="mt-3 text-base font-extrabold text-green-800">Contrat LOA activé !</h3>
                <p className="mt-1 text-xs text-green-700">{loaMensualite} €/mois sur {loaDuree} mois — Option d'achat : {optionAchat.toLocaleString()} €</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={() => setShowDashboard(true)} className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white hover:bg-[#C5A028]"><Eye size={12} /> Mon tableau de bord</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══ LANDING PAGE ═══ */
  return (
    <div className="bg-white">

      {/* Hero — noir premium */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#111111] via-[#1A1A1A] to-[#0D0D0D]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.08)_0%,_transparent_60%)]" />
        <div className="container-page relative py-10 lg:py-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]"><Wallet size={16} className="text-white" /></div>
                <span className="text-xs font-bold text-[#D4AF37]">FINANCE+ MKA.P-MS</span>
              </div>
              <h1 className="mt-4 text-2xl font-extrabold uppercase leading-tight text-white sm:text-3xl">
                Financez votre<br /><span className="italic text-[#D4AF37]">véhicule</span>
              </h1>
              <p className="mt-3 text-sm text-white/50">LOA, paiement fractionné — des solutions adaptées à votre budget. Sans crédit classique.</p>
              <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-white/50">
                <span className="flex items-center gap-1"><CheckCircle size={10} className="text-[#D4AF37]" /> LOA flexible</span>
                <span className="flex items-center gap-1"><CheckCircle size={10} className="text-[#D4AF37]" /> Paiement fractionné</span>
                <span className="flex items-center gap-1"><CheckCircle size={10} className="text-[#D4AF37]" /> 100% dans MKA.P-MS</span>
                <span className="flex items-center gap-1"><CheckCircle size={10} className="text-[#D4AF37]" /> Réponse rapide</span>
              </div>
            </div>
            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#111]/80 p-5 text-center backdrop-blur-sm">
              <p className="text-[9px] font-semibold text-white/50">Exemple LOA</p>
              <p className="mt-2 text-3xl font-extrabold text-[#D4AF37]">À partir de</p>
              <p className="text-4xl font-extrabold text-white">199 €<span className="text-lg text-white/40">/mois</span></p>
              <p className="mt-1 text-[10px] text-white/40">sur 48 mois • Option d'achat disponible</p>
              <button onClick={() => { setMode("loa"); setStep(1); }}
                className="mt-3 w-full rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-white hover:bg-[#C5A028]">
                Simuler ma LOA
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bandeau exclusivité MKA.P-MS */}
      <div className="border-b border-[#D4AF37]/20 bg-[#FFFBEB]">
        <div className="container-page flex items-center gap-3 py-3">
          <Lock size={16} className="shrink-0 text-[#D4AF37]" />
          <p className="text-xs text-[#111]">
            <strong>Financement exclusif MKA.P-MS</strong> — Le programme Finance+ est actuellement réservé aux véhicules du stock MKA.P-MS.
            Vous êtes vendeur Pro ? <button onClick={() => document.getElementById("pro-finance-access")?.scrollIntoView({ behavior: "smooth" })} className="font-bold text-[#D4AF37] underline">Demandez l'accès →</button>
          </p>
        </div>
      </div>

      {/* Produits — fond blanc */}
      <section className="bg-white py-8">
        <div className="container-page">
          <h2 className="text-center text-base font-extrabold uppercase text-[#111]">Nos solutions de financement</h2>
          <p className="mt-1 text-center text-xs text-slate-500">Choisissez la formule adaptée à votre projet</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* LOA */}
            <div className="rounded-2xl border-2 border-[#D4AF37] bg-white p-5 shadow-lg shadow-[#D4AF37]/10">
              <div className="flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /><h3 className="text-sm font-extrabold text-[#111]">Location avec Option d'Achat</h3></div>
              <p className="mt-2 text-xs text-slate-500">Roulez immédiatement et décidez plus tard si vous achetez.</p>
              <div className="mt-3 space-y-1.5">
                {["Mensualités adaptées à votre budget", "Durée : 24, 36, 48 ou 60 mois", "Option d'achat en fin de contrat", "Apport initial facultatif", "Véhicules neufs et occasion", "Suivi complet dans MKA.P-MS"].map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> {f}</div>
                ))}
              </div>
              <button onClick={() => { setMode("loa"); setStep(1); }}
                className="mt-4 w-full rounded-full bg-[#D4AF37] py-2.5 text-xs font-bold text-white hover:bg-[#C5A028]">
                Simuler une LOA <ArrowRight size={12} className="inline ml-1" />
              </button>
            </div>
            {/* Fractionné */}
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-white p-5">
              <div className="flex items-center gap-2"><CreditCard size={20} className="text-[#D4AF37]" /><h3 className="text-sm font-extrabold text-[#111]">Paiement fractionné</h3></div>
              <p className="mt-2 text-xs text-slate-500">Étalez votre achat en plusieurs fois sans frais.</p>
              <div className="mt-3 space-y-1.5">
                {["Particuliers : 2x, 3x, 4x, 5x ou 10x", "Professionnels : 2x, 3x, 4x ou 5x", "Sans frais supplémentaires", "Simulation automatique instantanée", "Paiement sécurisé", "Suivi dans votre espace"].map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> {f}</div>
                ))}
              </div>
              <button onClick={() => { setMode("fractionne"); setStep(1); }}
                className="mt-4 w-full rounded-full border-2 border-[#D4AF37] py-2.5 text-xs font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">
                Simuler un paiement fractionné <ArrowRight size={12} className="inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-[#F5F5F5] py-8">
        <div className="container-page">
          <h2 className="text-center text-sm font-extrabold uppercase text-[#111]">Comment ça marche ?</h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {STEPS_LOA.map((s, i) => (
              <button key={s} onClick={() => { setMode("loa"); setStep(i + 1); }} className="flex flex-col items-center gap-2 rounded-xl border border-[#D4AF37]/20 bg-white p-3 text-center transition hover:border-[#D4AF37] hover:shadow-md cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-white">{i + 1}</div>
                <span className="text-[10px] font-bold text-[#111]">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tableau de bord preview */}
      <section className="bg-white py-8">
        <div className="container-page">
          <h2 className="text-center text-sm font-extrabold uppercase text-[#111]">Votre tableau de bord Finance+</h2>
          <p className="mt-1 text-center text-xs text-slate-500">Tout le suivi directement dans votre espace MKA.P-MS</p>
          <div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-4">
            {[
              { icon: FileText, label: "Contrats actifs" },
              { icon: CheckCircle, label: "Paiements effectués" },
              { icon: Clock, label: "Paiements restants" },
              { icon: Calendar, label: "Historique" },
              { icon: FolderOpen, label: "Documents" },
              { icon: FileText, label: "Factures" },
              { icon: Calendar, label: "Échéances" },
              { icon: Bell, label: "Notifications" },
            ].map((item) => (
              <button key={item.label} onClick={() => setShowDashboard(true)} className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/20 bg-white p-3 transition hover:border-[#D4AF37] hover:shadow-md cursor-pointer">
                <item.icon size={16} className="text-[#D4AF37]" />
                <span className="text-[10px] font-bold text-[#111]">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button onClick={() => setShowDashboard(true)} className="rounded-full bg-[#D4AF37] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#C5A028]">
              Accéder à mon tableau de bord <ArrowRight size={12} className="inline ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Sur chaque véhicule */}
      <section className="border-y border-[#D4AF37]/20 bg-[#FFFDF5] py-6">
        <div className="container-page">
          <h2 className="text-center text-sm font-extrabold uppercase text-[#111]">Sur chaque véhicule compatible</h2>
          <div className="mx-auto mt-4 max-w-md space-y-2">
            {[
              "Disponible en LOA",
              "Disponible en paiement fractionné",
              "Simulation immédiate",
              "Réponse rapide",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-[#111]"><CheckCircle size={12} className="text-[#D4AF37]" /> {f}</div>
            ))}
          </div>
          <div className="mx-auto mt-4 flex max-w-md gap-2">
            <button onClick={() => { setMode("loa"); setStep(2); }} className="flex-1 rounded-lg bg-[#D4AF37] py-2 text-[10px] font-bold text-white hover:bg-[#C5A028]">Simuler</button>
            <button onClick={() => { setMode("loa"); setStep(1); }} className="flex-1 rounded-lg border border-[#D4AF37] py-2 text-[10px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">Faire une demande</button>
            <button onClick={() => showToast("Conditions generales Finance+ — document en cours de preparation")} className="flex-1 rounded-lg border border-[#D4AF37] py-2 text-[10px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">Conditions</button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-8">
        <div className="container-page">
          <h2 className="text-center text-sm font-extrabold uppercase text-[#111]">Questions fréquentes</h2>
          <div className="mx-auto mt-4 max-w-xl space-y-2">
            {[
              { q: "Qu'est-ce que la LOA chez MKA.P-MS ?", a: "La Location avec Option d'Achat vous permet de rouler avec le véhicule de votre choix en payant des mensualités. À la fin du contrat, vous pouvez acheter le véhicule ou le restituer." },
              { q: "MKA.P-MS propose-t-il du crédit automobile ?", a: "Non. MKA.P-MS ne propose pas de crédit classique. Nous proposons des solutions d'acquisition progressive : LOA, paiement fractionné et financement partenaire." },
              { q: "Comment fonctionne le paiement fractionné ?", a: "Vous choisissez le nombre de fois (2x à 10x pour les particuliers, 2x à 5x pour les pros). Le montant est divisé en parts égales, sans frais supplémentaires." },
              { q: "Quels documents fournir ?", a: "Pour les particuliers : pièce d'identité, justificatif de domicile, revenus et permis. Pour les pros : KBIS, identité dirigeant, SIRET, TVA et RIB société." },
              { q: "Où suivre mon dossier ?", a: "Tout le suivi se fait dans votre espace MKA.P-MS : contrats, paiements, échéances, documents et notifications. Aucun échange obligatoire par email." },
            ].map((faq, i) => (
              <button key={i} onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full rounded-xl border border-[#D4AF37]/20 bg-white p-4 text-left transition hover:border-[#D4AF37]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111]">{faq.q}</span>
                  {expandedFaq === i ? <ChevronDown size={14} className="text-[#D4AF37]" /> : <ChevronRight size={14} className="text-red-500" />}
                </div>
                {expandedFaq === i && <p className="mt-2 text-[10px] text-slate-600">{faq.a}</p>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Garanties — fond blanc, icônes or */}
      <section className="border-t border-[#F5F5F5] bg-white py-6">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Shield, label: "Protection véhicule", desc: "Véhicule protégé pendant toute la durée du contrat" },
              { icon: Lock, label: "Paiement sécurisé", desc: "Transactions protégées par protocole SSL" },
              { icon: Zap, label: "Réponse rapide", desc: "Réponse à votre dossier sous 48h" },
              { icon: Clock, label: "Suivi 24h/24", desc: "Accédez à votre espace à tout moment" },
            ].map((b) => (
              <button key={b.label} onClick={() => {}} className="flex flex-col items-center gap-1 text-center transition hover:opacity-80 cursor-pointer rounded-xl border border-transparent hover:border-[#D4AF37]/30 p-2">
                <b.icon size={16} className="text-[#D4AF37]" />
                <h4 className="text-[9px] font-bold text-[#111]">{b.label}</h4>
                <p className="text-[7px] text-slate-500 leading-tight">{b.desc}</p>
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-center">
            <button onClick={() => {}} className="flex flex-col items-center gap-1 text-center transition hover:opacity-80 cursor-pointer rounded-xl border border-transparent hover:border-[#D4AF37]/30 p-2">
              <Users size={16} className="text-[#D4AF37]" />
              <h4 className="text-[9px] font-bold text-[#111]">Support dédié</h4>
              <p className="text-[7px] text-slate-500 leading-tight">Une équipe Finance+ à votre écoute</p>
            </button>
          </div>
        </div>
      </section>

      {/* ═══ SECTION VENDEURS PRO — Demande d'accès Finance+ ═══ */}
      <section id="pro-finance-access" className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-blue-800 px-3 py-1 text-[10px] font-bold text-white">VENDEURS PRO</span>
            <h2 className="mt-4 text-xl font-extrabold text-[#111]">Proposez le financement sur vos véhicules</h2>
            <p className="mt-2 text-sm text-slate-500">
              Le programme Finance+ MKA.P-MS permet à vos clients de financer l'achat de vos véhicules directement depuis la plateforme.
              Pour activer cette fonctionnalité, soumettez une demande d'accès.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-[#111]">Conditions d'accès</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {[
                  "Compte professionnel vérifié (KBIS, pièce d'identité)",
                  "Acceptation des conditions générales Finance+ MKA.P-MS",
                  "Mise à disposition des informations véhicule (carte grise, photos, historique)",
                  "Respect des règles de tarification et transparence MKA.P-MS",
                  "Engagement à répondre aux demandes clients sous 48 h",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" /> {t}
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 font-bold text-[#111]">Documents nécessaires</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {[
                  "KBIS ou extrait d'inscription",
                  "Pièce d'identité du dirigeant",
                  "SIRET / N° TVA intracommunautaire",
                  "RIB société",
                  "Conditions générales signées",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <FileText size={14} className="mt-0.5 shrink-0 text-slate-400" /> {t}
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-xl bg-[#FFFBEB] border border-[#D4AF37]/20 p-4">
                <p className="text-xs text-slate-600">
                  <strong className="text-[#111]">Processus de validation :</strong> Votre demande sera étudiée par l'équipe MKA.P-MS.
                  Après validation de vos documents et acceptation des conditions, le module Finance+ sera activé sur vos annonces.
                  Les règles de financement (taux, durée, conditions) sont définies par MKA.P-MS et peuvent varier selon le type de véhicule et le profil client.
                </p>
              </div>

              <Link
                to="/compte/messages"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] transition"
              >
                <ArrowRight size={16} /> Faire ma demande d'accès Finance+
              </Link>
              <p className="mt-2 text-center text-[10px] text-slate-400">
                Contact : mka.garageauto@gmail.com — Réponse sous 5 jours ouvrés
              </p>
            </div>
          </div>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400 shrink-0" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
