import { useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Heart, Star, Check, Fuel, Settings2,
  Zap, Users, DoorOpen, Gauge, Calendar, Shield, Clock, Lock,
  ChevronDown, MapPin, Headphones, FileCheck, Navigation,
  CreditCard, Car, Baby, Eye
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE PRODUIT — LOCATION PARTICULIER
   Rassurer le client. Vacances, week-end, remplacement.
   ══════════════════════════════════════════════════════════════════════════ */

const VEHICLE = {
  titre: "Peugeot 3008 GT",
  sousTitre: "SUV | 2024 | Hybride | Automatique",
  prixJour: 52, prixSemaine: 312, prixMois: 1050,
  note: 4.7, nbAvis: 86,
  annee: 2024, km: 8000, carburant: "Hybride", transmission: "Automatique",
  puissance: "225 ch", places: 5, portes: 5, consommation: "1.4 L/100km", critair: 1,
};

const GALLERY = [
  "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=500&fit=crop",
];

const EQUIPEMENTS = ["GPS", "Caméra de recul", "Climatisation auto", "Régulateur adaptatif", "Apple CarPlay / Android Auto", "Bluetooth", "Sièges chauffants", "Grand coffre 591L", "Toit panoramique"];

const CONDITIONS = [
  "Permis B valide depuis minimum 1 an",
  "Pièce d'identité en cours de validité",
  "Carte bancaire au nom du conducteur",
  "Caution : empreinte bancaire 500 € (non débitée)",
  "Véhicule restitué propre et avec le même niveau de carburant",
  "Assurance tous risques incluse (franchise 800 €)",
  "Option franchise réduite à 0 € disponible (+8 €/jour)",
];

const SERVICES = [
  { label: "Livraison du véhicule", prix: "40 €" },
  { label: "Retrait rapide en agence", prix: "Gratuit" },
  { label: "Conducteur supplémentaire", prix: "8 €/jour" },
  { label: "GPS navigation", prix: "Inclus" },
  { label: "Siège enfant", prix: "5 €/jour" },
  { label: "Extension kilométrique illimité", prix: "+15 €/jour" },
  { label: "Assistance 24h/24", prix: "Incluse" },
  { label: "Protection franchise 0 €", prix: "+8 €/jour" },
];

const AVIS = [
  { nom: "Pierre M.", note: 5, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", commentaire: "Parfait pour nos vacances en famille ! Le 3008 est spacieux et très confortable. Réservation ultra simple." },
  { nom: "Julie R.", note: 5, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", commentaire: "Top ! Véhicule comme neuf, processus rapide, retrait en 5 minutes. Je recommande." },
  { nom: "Thomas B.", note: 4, photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", commentaire: "Très bon SUV pour un week-end à la montagne. Bon rapport qualité-prix." },
];

const FAQ = [
  { q: "Comment récupérer le véhicule ?", a: "Présentez-vous en agence avec votre permis, pièce d'identité et code de réservation. Ou choisissez la livraison à domicile (+40 €)." },
  { q: "Quelle est la caution ?", a: "Empreinte bancaire de 500 € (non débitée). Libérée sous 7 jours après restitution en bon état." },
  { q: "L'assurance est-elle incluse ?", a: "Oui, assurance tous risques incluse avec franchise de 800 €. Option franchise 0 € disponible (+8 €/jour)." },
  { q: "Peut-on annuler ?", a: "Annulation gratuite jusqu'à 48h avant. 50% entre 48h et 24h. Montant total en dessous de 24h." },
  { q: "Le kilométrage est-il limité ?", a: "200 km/jour inclus en standard. Option kilométrage illimité disponible (+15 €/jour)." },
];

const SIMILAIRES = [
  { titre: "Renault Clio V", prix: 28, type: "Citadine", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=260&fit=crop" },
  { titre: "BMW Série 3", prix: 55, type: "Berline", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop" },
  { titre: "VW Tiguan", prix: 58, type: "SUV", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop" },
  { titre: "Mercedes Classe C", prix: 65, type: "Premium", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop" },
];

export default function ProduitParticulier() {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [fav, setFav] = useState(false);
  const [showAllChars, setShowAllChars] = useState(false);
  const [showAllEquip, setShowAllEquip] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const today = new Date();
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const [dateDebut, setDateDebut] = useState(fmt(today));
  const [dateFin, setDateFin] = useState(fmt(nextWeek));

  const nbJours = useMemo(() => {
    const diff = Math.ceil((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [dateDebut, dateFin]);
  const total = nbJours <= 6 ? nbJours * VEHICLE.prixJour : nbJours <= 29 ? Math.ceil(nbJours / 7) * VEHICLE.prixSemaine : Math.ceil(nbJours / 30) * VEHICLE.prixMois;

  const prevPhoto = useCallback(() => setPhotoIdx((i) => (i === 0 ? GALLERY.length - 1 : i - 1)), []);
  const nextPhoto = useCallback(() => setPhotoIdx((i) => (i === GALLERY.length - 1 ? 0 : i + 1)), []);
  const resvRef = useRef<HTMLDivElement>(null);
  const scrollToResv = () => resvRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">

      {/* BLOC 1 — PHOTOS */}
      <div className="relative">
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur px-4 py-3 border-b border-[#E5E7EB]">
          <Link to="/louer/particulier" className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280]">
            <ChevronLeft size={18} /> Retour Particulier
          </Link>
          <button onClick={() => setFav(!fav)} className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F3F4F6]">
            <Heart size={18} className={fav ? "fill-red-500 text-red-500" : "text-[#111]"} />
          </button>
        </div>
        <div className="relative">
          <img src={GALLERY[photoIdx]} alt={VEHICLE.titre} className="w-full h-[280px] object-cover" />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white"><Car size={12} /> PARTICULIER</span>
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">{photoIdx + 1} / {GALLERY.length}</div>
          <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur flex items-center justify-center"><ChevronLeft size={18} /></button>
          <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur flex items-center justify-center"><ChevronRight size={18} /></button>
        </div>
        <div className="bg-white px-4 pt-2 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {GALLERY.slice(0, 8).map((img, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)} className={`w-14 h-10 shrink-0 rounded-md overflow-hidden border-2 ${photoIdx === i ? "border-[#D4AF37]" : "border-transparent opacity-70"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BLOC 2 — PRIX */}
      <div className="bg-white px-4 py-4 border-t border-[#F3F4F6]">
        <h1 className="text-xl font-extrabold text-[#111]">{VEHICLE.titre}</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">{VEHICLE.sousTitre}</p>
        <div className="mt-2 flex items-center gap-2">
          <Star size={14} className="text-[#D4AF37]" fill="#D4AF37" />
          <span className="text-sm font-bold">{VEHICLE.note}</span>
          <span className="text-xs text-[#6B7280]">({VEHICLE.nbAvis} avis)</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-2.5 text-center">
            <p className="text-[9px] text-[#D4AF37] uppercase font-bold">Jour</p>
            <p className="text-base font-black text-[#111]">{VEHICLE.prixJour} €</p>
          </div>
          <div className="rounded-lg bg-[#F5F3EF] p-2.5 text-center">
            <p className="text-[9px] text-[#6B7280] uppercase">Semaine</p>
            <p className="text-base font-black text-[#111]">{VEHICLE.prixSemaine} €</p>
          </div>
          <div className="rounded-lg bg-[#F5F3EF] p-2.5 text-center">
            <p className="text-[9px] text-[#6B7280] uppercase">Mois</p>
            <p className="text-base font-black text-[#111]">{VEHICLE.prixMois} €</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">200 km/jour inclus · Assurance tous risques incluse</p>
      </div>

      {/* BLOC 3 — RÉSERVATION */}
      <div className="px-4 mt-3">
        <button onClick={scrollToResv} className="w-full rounded-xl bg-[#D4AF37] py-4 text-base font-extrabold text-white shadow-lg active:scale-[0.98] transition">RÉSERVER MAINTENANT</button>
      </div>

      {/* BLOC 4 — CARACTÉRISTIQUES */}
      <div className="bg-white px-4 py-5 mt-3">
        <h2 className="text-lg font-bold text-[#111]">Caractéristiques</h2>
        <div className="mt-3">
          {[
            { icon: Fuel, label: "Carburant", value: VEHICLE.carburant },
            { icon: Settings2, label: "Transmission", value: VEHICLE.transmission },
            { icon: Zap, label: "Puissance", value: VEHICLE.puissance },
            { icon: Users, label: "Places", value: String(VEHICLE.places) },
            { icon: DoorOpen, label: "Portes", value: String(VEHICLE.portes) },
            ...(showAllChars ? [
              { icon: Gauge, label: "Consommation", value: VEHICLE.consommation },
              { icon: Shield, label: "Crit'Air", value: String(VEHICLE.critair) },
              { icon: Calendar, label: "Année", value: String(VEHICLE.annee) },
              { icon: Navigation, label: "Kilométrage", value: `${VEHICLE.km.toLocaleString("fr-FR")} km` },
            ] : []),
          ].map((c, i) => { const Icon = c.icon; return (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
              <div className="flex items-center gap-3"><Icon size={16} className="text-[#6B7280]" /><span className="text-sm text-[#6B7280]">{c.label}</span></div>
              <span className="text-sm font-semibold text-[#111]">{c.value}</span>
            </div>
          ); })}
        </div>
        <button onClick={() => setShowAllChars(!showAllChars)} className="mt-3 w-full rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#6B7280]">{showAllChars ? "Masquer" : "Voir plus"}</button>
      </div>

      {/* BLOC 5 — ÉQUIPEMENTS */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Équipements</h2>
        <div className="mt-3 space-y-2.5">
          {(showAllEquip ? EQUIPEMENTS : EQUIPEMENTS.slice(0, 5)).map((e, i) => (
            <div key={i} className="flex items-center gap-3"><div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37]/10"><Check size={12} className="text-[#D4AF37]" /></div><span className="text-sm text-[#111]">{e}</span></div>
          ))}
        </div>
        {EQUIPEMENTS.length > 5 && <button onClick={() => setShowAllEquip(!showAllEquip)} className="mt-3 w-full rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-semibold text-[#6B7280]">{showAllEquip ? "Masquer" : "Voir tout"}</button>}
      </div>

      {/* BLOC 6 — DESCRIPTION / DATES */}
      <div ref={resvRef} className="mx-4 mt-4 rounded-2xl bg-white border-2 border-[#D4AF37]/30 overflow-hidden shadow-sm">
        <div className="bg-[#D4AF37] px-4 py-3"><h2 className="text-base font-bold text-white">Réservation</h2></div>
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-[#6B7280]">Date de début</label><input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
            <div><label className="text-xs text-[#6B7280]">Date de fin</label><input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
          </div>
          <div className="rounded-lg bg-[#F5F3EF] p-3 flex justify-between items-center">
            <span className="text-xs text-[#6B7280]">Durée</span>
            <span className="text-sm font-bold">{nbJours} jour{nbJours > 1 ? "s" : ""}</span>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] p-3 space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Location ({nbJours}j)</span><span className="font-semibold">{total} €</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Kilométrage 200km/j</span><span className="font-semibold text-[#D4AF37]">Inclus</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Assurance tous risques</span><span className="font-semibold text-green-600">Incluse</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Caution</span><span className="font-semibold">500 €</span></div>
            <div className="border-t-2 border-[#111] pt-2 flex justify-between"><span className="text-sm font-bold">Total</span><span className="text-xl font-black">{total} € <span className="text-xs font-normal text-[#6B7280]">TTC</span></span></div>
          </div>
          <button className="w-full rounded-xl bg-[#D4AF37] py-4 text-base font-extrabold text-white flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"><Lock size={16} /> Payer et réserver</button>
          <div className="flex items-center justify-center gap-1"><Lock size={12} className="text-[#6B7280]" /><span className="text-xs text-[#6B7280]">Paiement 100% sécurisé</span></div>
          <div className="flex items-center justify-center gap-4">
            <span className="text-xs font-bold text-[#1a1f71]">VISA</span>
            <span className="text-xs font-bold text-[#eb001b]">Master<span className="text-[#f79e1b]">card</span></span>
            <span className="text-xs font-bold text-[#111]">Apple Pay</span>
            <span className="text-xs font-bold text-[#4285f4]">Google Pay</span>
          </div>
        </div>
      </div>

      {/* BLOC 7 — DOCUMENTS */}
      <div className="bg-white px-4 py-5 mt-4">
        <h2 className="text-lg font-bold text-[#111]">Documents demandés</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Permis de conduire", "Pièce d'identité", "Justificatif de domicile", "Carte bancaire"].map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F3EF] px-3 py-1.5 text-xs font-semibold text-[#111]"><FileCheck size={12} className="text-[#D4AF37]" /> {d}</span>
          ))}
        </div>
      </div>

      {/* BLOC 8 — CONDITIONS */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Conditions de location</h2>
        <div className="mt-3 space-y-2">
          {CONDITIONS.map((c, i) => (<div key={i} className="flex items-start gap-2"><Check size={14} className="text-[#D4AF37] mt-0.5 shrink-0" /><span className="text-sm text-[#111]">{c}</span></div>))}
        </div>
      </div>

      {/* BLOC 9 — SERVICES */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Services complémentaires</h2>
        <div className="mt-3 space-y-2">
          {SERVICES.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
              <span className="text-sm text-[#111]">{s.label}</span>
              <span className={`text-sm font-semibold ${s.prix === "Gratuit" || s.prix === "Inclus" || s.prix === "Incluse" ? "text-green-600" : "text-[#111]"}`}>{s.prix}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BLOC 10 — AVIS */}
      <div className="bg-white px-4 py-5 mt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111]">Avis clients</h2>
          <div className="flex items-center gap-1"><Star size={14} className="text-[#D4AF37]" fill="#D4AF37" /><span className="text-sm font-bold">{VEHICLE.note}/5</span><span className="text-xs text-[#6B7280]">({VEHICLE.nbAvis})</span></div>
        </div>
        <div className="mt-4 space-y-3">
          {AVIS.map((a, i) => (
            <div key={i} className="rounded-xl border border-[#F3F4F6] p-3">
              <div className="flex items-center gap-3">
                <img src={a.photo} alt={a.nom} className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1"><p className="text-sm font-bold text-[#111]">{a.nom}</p></div>
                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => (<Star key={j} size={10} className={j < a.note ? "text-[#D4AF37]" : "text-[#E5E7EB]"} fill={j < a.note ? "#D4AF37" : "none"} />))}</div>
              </div>
              <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">{a.commentaire}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BLOC 11 — FAQ */}
      <div className="bg-white px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Questions fréquentes</h2>
        <div className="mt-3">
          {FAQ.map((f, i) => (
            <div key={i} className="border-b border-[#F3F4F6] last:border-0">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between py-3.5 text-left">
                <span className="text-sm font-semibold text-[#111] pr-4">{f.q}</span>
                <ChevronDown size={16} className={`shrink-0 text-[#6B7280] transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="pb-3 text-xs text-[#6B7280] leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* BLOC 12 — SIMILAIRES */}
      <div className="px-4 py-5 mt-2">
        <h2 className="text-lg font-bold text-[#111]">Véhicules similaires</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {SIMILAIRES.map((v, i) => (
            <Link key={i} to="/louer/particulier" className="w-[200px] shrink-0 rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-md transition">
              <div className="relative h-[120px]"><img src={v.photo} alt={v.titre} className="w-full h-full object-cover" loading="lazy" /><span className="absolute top-2 left-2 rounded-full bg-[#D4AF37]/90 px-2 py-0.5 text-[9px] font-bold text-white">{v.type}</span></div>
              <div className="p-3"><h3 className="text-sm font-bold text-[#111] truncate">{v.titre}</h3><p className="text-sm font-bold text-[#D4AF37] mt-1">{v.prix} € <span className="text-[10px] font-normal text-[#6B7280]">/ jour</span></p></div>
            </Link>
          ))}
        </div>
      </div>

      {/* Aide */}
      <div className="mx-4 mb-6 rounded-2xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10"><Headphones size={20} className="text-[#D4AF37]" /></div>
        <div><h3 className="text-sm font-bold text-[#111]">Besoin d'aide ?</h3><p className="text-xs text-[#6B7280]">09 70 70 50 50 · 7j/7 de 8h à 20h</p></div>
      </div>

      {/* BARRE FIXE */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center justify-between" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div><span className="text-[10px] text-[#6B7280]">À partir de</span><p className="text-lg font-black text-[#111]">{VEHICLE.prixJour} € <span className="text-xs font-normal text-[#6B7280]">/ jour</span></p></div>
        <button onClick={scrollToResv} className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-extrabold text-white shadow-lg active:scale-[0.98] transition">Réserver</button>
      </div>
    </div>
  );
}
