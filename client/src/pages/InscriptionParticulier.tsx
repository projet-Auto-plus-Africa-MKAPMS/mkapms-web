import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, User, Mail, Phone, MapPin, Lock, Check, Eye, EyeOff, Globe } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   1. INSCRIPTION COMPTE PARTICULIER
   Prénom, nom, email, téléphone, pays, ville, mot de passe. CGU.
   ══════════════════════════════════════════════════════════════════════════ */

export default function InscriptionParticulier() {
  const [showPwd, setShowPwd] = useState(false);
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center px-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-6 text-center max-w-sm w-full">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-50"><Check size={28} className="text-green-600" /></div>
          <h2 className="text-xl font-black text-[#111] mt-4">Compte créé !</h2>
          <p className="text-sm text-[#6B7280] mt-1">Votre compte particulier MKA.P-MS est prêt.</p>
          <Link to="/tableau-de-bord" className="mt-4 inline-block w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Accéder à mon espace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Accueil</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><User size={20} className="text-[#D4AF37]" /> Créer un compte</h1>
        <p className="mt-1 text-sm text-white/60">Inscription particulier MKA.P-MS</p>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-[#6B7280]">Prénom *</label><div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><User size={14} className="text-[#6B7280]" /><input type="text" placeholder="Moussa" className="w-full bg-transparent text-sm outline-none" /></div></div>
          <div><label className="text-xs text-[#6B7280]">Nom *</label><div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><User size={14} className="text-[#6B7280]" /><input type="text" placeholder="Konaté" className="w-full bg-transparent text-sm outline-none" /></div></div>
        </div>
        <div><label className="text-xs text-[#6B7280]">Email *</label><div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><Mail size={14} className="text-[#6B7280]" /><input type="email" placeholder="moussa@email.com" className="w-full bg-transparent text-sm outline-none" /></div></div>
        <div><label className="text-xs text-[#6B7280]">Téléphone *</label><div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><Phone size={14} className="text-[#6B7280]" /><input type="tel" placeholder="+33 6 12 34 56 78" className="w-full bg-transparent text-sm outline-none" /></div></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-[#6B7280]">Pays *</label><div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><Globe size={14} className="text-[#6B7280]" /><select className="w-full bg-transparent text-sm outline-none"><option>France</option><option>Belgique</option><option>Luxembourg</option><option>Suisse</option><option>Côte d'Ivoire</option><option>Sénégal</option><option>Mali</option></select></div></div>
          <div><label className="text-xs text-[#6B7280]">Ville *</label><div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><MapPin size={14} className="text-[#6B7280]" /><input type="text" placeholder="Paris" className="w-full bg-transparent text-sm outline-none" /></div></div>
        </div>
        <div><label className="text-xs text-[#6B7280]">Mot de passe *</label><div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><Lock size={14} className="text-[#6B7280]" /><input type={showPwd ? "text" : "password"} placeholder="8 caractères minimum" className="w-full bg-transparent text-sm outline-none" /><button onClick={() => setShowPwd(!showPwd)}>{showPwd ? <EyeOff size={14} className="text-[#6B7280]" /> : <Eye size={14} className="text-[#6B7280]" />}</button></div></div>

        <div className="space-y-2 pt-2">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={acceptCGU} onChange={(e) => setAcceptCGU(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#D4D4D4] accent-[#D4AF37]" />
            <span className="text-xs text-[#6B7280]">J'accepte les <span className="text-[#D4AF37] font-semibold">CGU</span> et la <span className="text-[#D4AF37] font-semibold">politique de confidentialité</span> MKA.P-MS *</span>
          </label>
        </div>

        <button onClick={() => setStep("success")} className={`mt-2 w-full rounded-xl py-3.5 text-sm font-bold text-white transition ${acceptCGU ? "bg-[#D4AF37] active:scale-[0.98] shadow-md" : "bg-[#D4D4D4]"}`} disabled={!acceptCGU}>
          Créer mon compte
        </button>

        <p className="text-center text-xs text-[#6B7280]">Déjà inscrit ? <Link to="/connexion" className="text-[#D4AF37] font-semibold">Se connecter</Link></p>
      </div>
    </div>
  );
}
