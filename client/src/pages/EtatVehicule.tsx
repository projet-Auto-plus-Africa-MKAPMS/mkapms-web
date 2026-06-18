import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Camera, Check, Clock, Upload, Image,
  AlertCircle, Shield, Car, FileText, Pen, Eye
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   ÉTATS DU VÉHICULE + SIGNATURE NUMÉRIQUE + CAUTION INTELLIGENTE
   Photos obligatoires avant/après. Signature contrat dans l'app.
   Caution: bloquée / partielle / restituée visible dans le compte.
   ══════════════════════════════════════════════════════════════════════════ */

const ZONES_PHOTO = [
  "Avant (face)", "Arrière", "Côté gauche", "Côté droit",
  "Tableau de bord", "Compteur kilométrique", "Intérieur avant",
  "Intérieur arrière", "Coffre", "Pneus",
];

const RESERVATIONS = [
  {
    id: 1, vehicule: "Mercedes Classe E Break", ref: "LOC-2025-0042",
    photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop",
    etatDepart: { statut: "complete" as const, date: "15/03/2025 09:15", photos: 10, km: 32450 },
    etatRetour: { statut: "en_attente" as const, date: "-", photos: 0, km: 0 },
    contrat: { statut: "signe" as const, date: "15/03/2025 09:10" },
    caution: { montant: 1000, statut: "bloquee" as const, dateBloc: "15/03/2025" },
  },
  {
    id: 2, vehicule: "Peugeot 3008 GT", ref: "LOC-2025-0038",
    photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop",
    etatDepart: { statut: "complete" as const, date: "01/03/2025 10:00", photos: 10, km: 8200 },
    etatRetour: { statut: "complete" as const, date: "08/03/2025 10:30", photos: 10, km: 9100 },
    contrat: { statut: "signe" as const, date: "01/03/2025 09:55" },
    caution: { montant: 500, statut: "restituee" as const, dateBloc: "15/03/2025" },
  },
];

const CAUTION_CONFIG = {
  bloquee: { label: "Caution bloquée", color: "text-amber-600", bg: "bg-amber-50" },
  partielle: { label: "Caution partielle", color: "text-orange-600", bg: "bg-orange-50" },
  restituee: { label: "Caution restituée", color: "text-green-600", bg: "bg-green-50" },
};

export default function EtatVehicule() {
  const [activeRes, setActiveRes] = useState(0);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const r = RESERVATIONS[activeRes];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white">États & Contrats</h1>
        <p className="mt-1 text-sm text-white/60">Photos, signature numérique, caution</p>
      </div>

      {/* Reservation tabs */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {RESERVATIONS.map((res, i) => (
          <button key={res.id} onClick={() => setActiveRes(i)} className={`shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${activeRes === i ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            <Car size={12} /> {res.ref}
          </button>
        ))}
      </div>

      {/* Vehicle info */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 flex gap-3">
        <img src={r.photo} alt={r.vehicule} className="w-20 h-14 rounded-lg object-cover" />
        <div>
          <h2 className="text-sm font-bold text-[#111]">{r.vehicule}</h2>
          <p className="text-[10px] text-[#6B7280]">Réf: {r.ref}</p>
        </div>
      </div>

      {/* ─── SECTION: ÉTAT AU DÉPART ─── */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-green-50 px-4 py-2.5 flex items-center gap-2">
          <Camera size={14} className="text-green-600" />
          <h3 className="text-sm font-bold text-green-800">État au départ</h3>
          {r.etatDepart.statut === "complete" && <Check size={14} className="text-green-600 ml-auto" />}
        </div>
        <div className="p-4">
          {r.etatDepart.statut === "complete" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Date</p><p className="text-xs font-bold">{r.etatDepart.date}</p></div>
                <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Photos</p><p className="text-xs font-bold">{r.etatDepart.photos} / 10</p></div>
              </div>
              <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Kilométrage départ</p><p className="text-sm font-bold">{r.etatDepart.km.toLocaleString("fr-FR")} km</p></div>
              <button className="w-full rounded-lg border border-[#E5E7EB] py-2 text-xs font-semibold text-[#6B7280] flex items-center justify-center gap-1"><Eye size={12} /> Voir les photos</button>
            </div>
          ) : (
            <button onClick={() => setShowPhotoUpload(true)} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98]">
              <Camera size={14} /> Prendre les photos de départ
            </button>
          )}
        </div>
      </div>

      {/* ─── SECTION: ÉTAT AU RETOUR ─── */}
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className={`px-4 py-2.5 flex items-center gap-2 ${r.etatRetour.statut === "complete" ? "bg-green-50" : "bg-amber-50"}`}>
          <Camera size={14} className={r.etatRetour.statut === "complete" ? "text-green-600" : "text-amber-600"} />
          <h3 className={`text-sm font-bold ${r.etatRetour.statut === "complete" ? "text-green-800" : "text-amber-800"}`}>État au retour</h3>
          {r.etatRetour.statut === "complete" && <Check size={14} className="text-green-600 ml-auto" />}
        </div>
        <div className="p-4">
          {r.etatRetour.statut === "complete" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Date</p><p className="text-xs font-bold">{r.etatRetour.date}</p></div>
                <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Photos</p><p className="text-xs font-bold">{r.etatRetour.photos} / 10</p></div>
              </div>
              <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Kilométrage retour</p><p className="text-sm font-bold">{r.etatRetour.km.toLocaleString("fr-FR")} km</p></div>
              <div className="rounded-lg bg-blue-50 p-2 text-center"><p className="text-[9px] text-blue-600">Km parcourus</p><p className="text-sm font-bold text-blue-700">{(r.etatRetour.km - r.etatDepart.km).toLocaleString("fr-FR")} km</p></div>
            </div>
          ) : (
            <div className="text-center py-2">
              <Clock size={20} className="mx-auto text-amber-500" />
              <p className="mt-1 text-sm font-semibold text-[#6B7280]">En attente du retour</p>
              <p className="text-xs text-[#9CA3AF]">Les photos seront prises lors de la restitution</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── SECTION: SIGNATURE NUMÉRIQUE ─── */}
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#111] px-4 py-2.5 flex items-center gap-2">
          <Pen size={14} className="text-[#D4AF37]" />
          <h3 className="text-sm font-bold text-white">Signature numérique</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#6B7280]" />
              <span className="text-sm text-[#111]">Contrat de location</span>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.contrat.statut === "signe" ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
              {r.contrat.statut === "signe" ? <><Check size={10} /> Signé</> : <><Clock size={10} /> En attente</>}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#6B7280]" />
              <span className="text-sm text-[#111]">État des lieux</span>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.etatDepart.statut === "complete" ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
              {r.etatDepart.statut === "complete" ? <><Check size={10} /> Signé</> : <><Clock size={10} /> En attente</>}
            </span>
          </div>
          {r.contrat.statut === "signe" && <p className="mt-2 text-[10px] text-[#9CA3AF]">Signé le {r.contrat.date}</p>}
          {r.contrat.statut !== "signe" && (
            <button className="mt-3 w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2">
              <Pen size={14} /> Signer le contrat
            </button>
          )}
        </div>
      </div>

      {/* ─── SECTION: CAUTION INTELLIGENTE ─── */}
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#111] px-4 py-2.5 flex items-center gap-2">
          <Shield size={14} className="text-[#D4AF37]" />
          <h3 className="text-sm font-bold text-white">Caution</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black text-[#111]">{r.caution.montant} €</p>
              <p className="text-[10px] text-[#6B7280]">Bloquée le {r.caution.dateBloc}</p>
            </div>
            {(() => {
              const c = CAUTION_CONFIG[r.caution.statut];
              return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${c.color} ${c.bg}`}>{c.label}</span>;
            })()}
          </div>
          <div className="mt-3 rounded-lg bg-[#F5F3EF] p-3">
            <p className="text-xs text-[#6B7280]">
              {r.caution.statut === "bloquee" && "Votre caution est retenue sur votre compte. Elle sera restituée sous 7 jours ouvrés après restitution du véhicule en bon état."}
              {r.caution.statut === "partielle" && "Une partie de votre caution a été retenue suite à des dommages constatés. Consultez le détail ci-dessous."}
              {r.caution.statut === "restituee" && "Votre caution a été intégralement restituée. Le virement apparaîtra sous 3 à 5 jours ouvrés."}
            </p>
          </div>
        </div>
      </div>

      {/* Photo upload modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#111]">Photos obligatoires</h3>
              <button onClick={() => setShowPhotoUpload(false)} className="text-[#6B7280]">Fermer</button>
            </div>
            <p className="text-xs text-[#6B7280] mb-4">Prenez une photo de chaque zone du véhicule pour l'état des lieux.</p>
            <div className="grid grid-cols-2 gap-2">
              {ZONES_PHOTO.map((z, i) => (
                <button key={i} className="rounded-xl border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 p-4 flex flex-col items-center gap-1.5 active:scale-[0.98]">
                  <Camera size={20} className="text-[#D4AF37]" />
                  <span className="text-[10px] font-semibold text-[#111] text-center">{z}</span>
                </button>
              ))}
            </div>
            <button className="mt-4 w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white">Valider l'état des lieux</button>
          </div>
        </div>
      )}
    </div>
  );
}
