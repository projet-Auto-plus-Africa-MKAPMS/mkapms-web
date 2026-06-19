import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, PlusCircle, Car, Bike, Truck, ChevronRight, Camera, Check, Upload, FileText, Search, Sparkles, Bot, Star } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   DÉPÔT D'ANNONCE — Adapté selon le type
   Voiture / Moto / Utilitaire / Camion / VTC
   Système plaque pour voiture ET moto. Champs adaptés à chaque type.
   ══════════════════════════════════════════════════════════════════════════ */

const TYPES = [
  { id: "voiture", label: "Déposer une voiture", icon: Car, color: "bg-[#D4AF37]" },
  { id: "moto", label: "Déposer une moto / scooter / quad", icon: Bike, color: "bg-red-600" },
  { id: "utilitaire", label: "Déposer un utilitaire", icon: Truck, color: "bg-orange-600" },
  { id: "camion", label: "Déposer un camion", icon: Truck, color: "bg-gray-700" },
  { id: "vtc", label: "Déposer un véhicule VTC", icon: Car, color: "bg-[#111]" },
];

const CATEGORIES_MOTO = [
  "Roadster", "Sportive", "Trail", "Adventure", "Custom", "Cruiser", "Touring",
  "Naked", "Café Racer", "Scrambler", "Enduro", "Supermotard", "Cross", "Trial",
  "Scooter", "Scooter GT", "125 cm³", "50 cm³", "Électrique", "3 roues", "Quad",
];

const MARQUES_MOTO = [
  "Honda", "Yamaha", "Kawasaki", "Suzuki", "BMW", "KTM", "Ducati", "Harley-Davidson",
  "Triumph", "Aprilia", "Husqvarna", "Royal Enfield", "Indian", "Moto Guzzi", "MV Agusta",
  "Vespa", "Piaggio", "Kymco", "SYM", "Benelli", "CFMOTO", "GasGas", "Beta",
  "Can-Am", "Zero", "Energica", "LiveWire", "Derbi", "MBK", "Peugeot",
];

const MARQUES_VOITURE = [
  "Peugeot", "Renault", "Citroën", "Volkswagen", "BMW", "Mercedes", "Audi", "Toyota",
  "Ford", "Opel", "Fiat", "Dacia", "Hyundai", "Kia", "Nissan", "Tesla", "Volvo",
  "Skoda", "Seat", "Porsche", "Mini", "Mazda", "Jeep", "Land Rover", "Jaguar",
];

const CYLINDREES_MOTO = ["50 cm³", "125 cm³", "250 cm³", "300 cm³", "400 cm³", "500 cm³", "600 cm³", "650 cm³", "700 cm³", "750 cm³", "800 cm³", "900 cm³", "1000 cm³", "1100 cm³", "1200 cm³", "1300 cm³+"];

const PERMIS_MOTO = ["AM (50 cm³)", "A1 (125 cm³)", "A2 (≤ 35 kW)", "A (toutes)"];

const PHOTOS_VOITURE = ["Face avant", "Face arrière", "Côté gauche", "Côté droit", "Tableau de bord", "Compteur", "Coffre", "Sièges", "Moteur", "Pneus/Jantes", "Écran multimédia"];
const PHOTOS_MOTO = ["Face avant", "Face arrière", "Côté gauche", "Côté droit", "Tableau de bord / Compteur", "Moteur", "Pot d'échappement", "Pneus", "Selle", "Réservoir"];

export default function DepotAnnonce() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [plaqueMode, setPlaqueMode] = useState<"plaque" | "vin" | "manuel">("plaque");
  const [plaqueFound, setPlaqueFound] = useState(false);

  const isMoto = selectedType === "moto";
  const photos = isMoto ? PHOTOS_MOTO : PHOTOS_VOITURE;
  const marques = isMoto ? MARQUES_MOTO : MARQUES_VOITURE;

  if (!selectedType) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-[#111] px-4 pt-6 pb-5">
          <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><PlusCircle size={20} className="text-[#D4AF37]" /> Déposer une annonce</h1>
          <p className="mt-1 text-sm text-white/60">Vendez votre véhicule sur MKA.P-MS</p>
        </div>
        <div className="px-4 mt-6"><h2 className="text-base font-bold text-[#111]">Que souhaitez-vous vendre ?</h2>
          <div className="mt-4 space-y-2">
            {TYPES.map((t) => { const Icon = t.icon; return (
              <button key={t.id} onClick={() => { setSelectedType(t.id); setStep(0); setPlaqueFound(false); }} className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 active:scale-[0.99] transition">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.color}`}><Icon size={18} className="text-white" /></div>
                <span className="flex-1 text-sm font-bold text-[#111] text-left">{t.label}</span><ChevronRight size={16} className="text-red-500" />
              </button>
            ); })}
          </div>
        </div>
      </div>
    );
  }

  const ETAPES = ["Plaque / VIN", "Informations", "Photos", "Documents", "Vérification IA", "Publication"];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className={`px-4 pt-6 pb-5 ${isMoto ? "bg-red-600" : "bg-[#111]"}`}>
        <button onClick={() => { if (step > 0) setStep(step - 1); else setSelectedType(null); }} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> {step === 0 ? "Changer de type" : "Retour"}</button>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          {isMoto ? <Bike size={20} /> : <Car size={20} />}
          Déposer : {TYPES.find((t) => t.id === selectedType)?.label.replace("Déposer ", "")}
        </h1>
      </div>
      <div className="px-4 mt-4 flex gap-1">{ETAPES.map((e, i) => (<div key={i} className="flex-1"><div className={`h-1 rounded-full ${i <= step ? (isMoto ? "bg-red-600" : "bg-[#D4AF37]") : "bg-[#E5E7EB]"}`} /><p className={`text-[6px] mt-0.5 text-center ${i <= step ? (isMoto ? "text-red-600" : "text-[#D4AF37]") + " font-bold" : "text-red-500"}`}>{e}</p></div>))}</div>

      {/* Step 0: Plaque / VIN / Manuel */}
      {step === 0 && (
        <div className="mx-4 mt-4 space-y-3">
          <div className="flex gap-2">
            {(["plaque", "vin", "manuel"] as const).map(m => (
              <button key={m} onClick={() => { setPlaqueMode(m); setPlaqueFound(false); }} className={`flex-1 py-2 rounded-xl text-[10px] font-bold border ${plaqueMode === m ? (isMoto ? "bg-red-600 text-white border-red-600" : "bg-[#D4AF37] text-white border-[#D4AF37]") : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>
                {m === "plaque" ? (isMoto ? "Plaque moto" : "Plaque auto") : m === "vin" ? "VIN" : "Manuel"}
              </button>
            ))}
          </div>
          {plaqueMode === "plaque" && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
              <p className="text-xs text-[#6B7280] mb-2">{isMoto ? "Plaque d'immatriculation moto" : "Plaque d'immatriculation"}</p>
              <div className="flex gap-2">
                <input placeholder={isMoto ? "AA-123-BB" : "AA-123-BB"} className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm font-bold text-center uppercase" />
                <button onClick={() => setPlaqueFound(true)} className={`px-4 rounded-lg text-white text-xs font-bold ${isMoto ? "bg-red-600" : "bg-[#D4AF37]"}`}><Search size={16} /></button>
              </div>
              <p className="text-[8px] text-[#6B7280] mt-1">{isMoto ? "Format moto : même format que voiture (AA-123-BB)" : "Format : AA-123-BB"}</p>
            </div>
          )}
          {plaqueMode === "vin" && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
              <p className="text-xs text-[#6B7280] mb-2">Numéro VIN (17 caractères)</p>
              <div className="flex gap-2">
                <input placeholder="VF1XXXXXXXXX12345" className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-xs font-mono" />
                <button onClick={() => setPlaqueFound(true)} className={`px-4 rounded-lg text-white text-xs font-bold ${isMoto ? "bg-red-600" : "bg-[#D4AF37]"}`}><Search size={16} /></button>
              </div>
            </div>
          )}
          {plaqueMode === "manuel" && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm space-y-2">
              <p className="text-xs text-[#6B7280] mb-1">Saisie manuelle</p>
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Marque</label>
                <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                  <option value="">Choisir</option>
                  {marques.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {isMoto && <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Catégorie moto</label>
                <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                  <option value="">Choisir la catégorie</option>
                  {CATEGORIES_MOTO.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>}
              {["Modèle", "Année"].map(f => (<div key={f}><label className="text-[10px] font-bold text-[#6B7280] uppercase">{f}</label><input placeholder={f} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" /></div>))}
              {isMoto && <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Cylindrée</label>
                <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                  <option value="">Choisir</option>
                  {CYLINDREES_MOTO.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>}
              {!isMoto && <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Motorisation</label>
                <input placeholder="ex: 1.5 BlueHDi 130" className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
              </div>}
              <div>
                <label className="text-[10px] font-bold text-[#6B7280] uppercase">Énergie</label>
                <select className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                  <option value="">Choisir</option>
                  {(isMoto ? ["Essence", "Électrique", "Hybride"] : ["Essence", "Diesel", "Hybride", "Électrique", "GPL", "GNV"]).map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <button onClick={() => setPlaqueFound(true)} className={`w-full py-2.5 rounded-xl text-white text-xs font-bold ${isMoto ? "bg-red-600" : "bg-[#D4AF37]"}`}>Valider</button>
            </div>
          )}
          {plaqueFound && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2"><Check size={16} className="text-green-500" /><p className="text-sm font-bold text-green-700">{isMoto ? "Moto identifiée" : "Véhicule identifié"}</p></div>
              <div className="space-y-1">
                {isMoto
                  ? [["Marque", "Yamaha"], ["Modèle", "MT-07"], ["Année", "2023"], ["Cylindrée", "689 cm³"], ["Catégorie", "Roadster"], ["Énergie", "Essence"]].map(([k, v]) => (<div key={k} className="flex justify-between"><span className="text-[10px] text-[#6B7280]">{k}</span><span className="text-[10px] font-bold text-[#111]">{v}</span></div>))
                  : [["Marque", "Peugeot"], ["Modèle", "308"], ["Année", "2021"], ["Motorisation", "1.5 BlueHDi 130"], ["Énergie", "Diesel"]].map(([k, v]) => (<div key={k} className="flex justify-between"><span className="text-[10px] text-[#6B7280]">{k}</span><span className="text-[10px] font-bold text-[#111]">{v}</span></div>))
                }
              </div>
              <button onClick={() => setStep(1)} className={`mt-3 w-full py-2.5 rounded-xl text-white text-xs font-bold ${isMoto ? "bg-red-600" : "bg-[#D4AF37]"}`}>Continuer → Informations</button>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Informations adaptées */}
      {step === 1 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">{isMoto ? "Informations moto" : "Informations véhicule"}</h3>
          {isMoto ? (
            <>
              {[["Kilométrage", "ex: 8 000 km"], ["Prix", "ex: 6 500 €"]].map(([l, p]) => (<div key={l}><label className="text-xs text-[#6B7280]">{l}</label><input type="text" placeholder={p} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>))}
              <div><label className="text-xs text-[#6B7280]">Catégorie moto</label>
                <select className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm">
                  <option value="">Choisir</option>{CATEGORIES_MOTO.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-[#6B7280]">Cylindrée</label>
                <select className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm">
                  <option value="">Choisir</option>{CYLINDREES_MOTO.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-[#6B7280]">Permis requis</label>
                <select className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm">
                  <option value="">Choisir</option>{PERMIS_MOTO.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {[["Couleur", "ex: Noir"], ["Puissance (ch)", "ex: 73 ch"], ["État", "Excellent / Bon / Correct"], ["Ville", "ex: Paris"]].map(([l, p]) => (<div key={l}><label className="text-xs text-[#6B7280]">{l}</label><input type="text" placeholder={p} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>))}
              <div><label className="text-xs text-[#6B7280]">Équipements</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {["ABS", "Top case", "Sacoches", "Bulle", "Pot akra", "Poignées chauffantes", "GPS", "Protections", "Béquille centrale", "Alarme"].map(e => (
                    <button key={e} className="rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[9px] font-semibold text-[#6B7280] active:bg-red-600 active:text-white">{e}</button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {[["Kilométrage", "45 000 km"], ["Prix souhaité", "25 000 €"], ["Couleur", "ex: Gris Artense"], ["Nombre de portes", "3 / 5"], ["Nombre de places", "5"], ["État du véhicule", "Excellent / Bon / Correct"], ["Puissance fiscale", "ex: 7 CV"], ["Puissance DIN", "ex: 130 ch"], ["Ville", "Paris"]].map(([l, p]) => (
                <div key={l}><label className="text-xs text-[#6B7280]">{l}</label><input type="text" placeholder={p} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
              ))}
              <div><label className="text-xs text-[#6B7280]">Boîte de vitesse</label>
                <select className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm">
                  <option value="manuelle">Manuelle</option><option value="automatique">Automatique</option><option value="semi-auto">Semi-automatique</option>
                </select>
              </div>
              <div><label className="text-xs text-[#6B7280]">Équipements</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {["GPS", "Caméra recul", "Régulateur", "Sièges chauffants", "Toit ouvrant", "Radar", "Apple CarPlay", "Android Auto", "LED", "Keyless"].map(e => (
                    <button key={e} className="rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[9px] font-semibold text-[#6B7280] active:bg-[#D4AF37] active:text-white">{e}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div><label className="text-xs text-[#6B7280]">Description</label>
            <textarea placeholder={isMoto ? "Décrivez votre moto : entretien, modifications, état, historique…" : "Décrivez votre véhicule : historique, entretien, options, état…"} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm h-20" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#D4AF37]/10 p-2"><Sparkles size={12} className="text-[#D4AF37]" /><span className="text-[9px] text-[#374151]">L'IA améliorera automatiquement votre description</span></div>
          <button onClick={() => setStep(2)} className={`w-full rounded-xl py-3 text-sm font-bold text-white active:scale-[0.98] ${isMoto ? "bg-red-600" : "bg-[#D4AF37]"}`}>Suivant — Photos</button>
        </div>
      )}

      {/* Step 2: Photos adaptées */}
      {step === 2 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Photos {isMoto ? "moto" : "véhicule"} (minimum 5)</h3>
          <p className="text-[9px] text-[#6B7280]">{isMoto ? "10 emplacements — guidage photo moto" : "11 emplacements — guidage photo véhicule"}</p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((z) => (
              <button key={z} className={`rounded-lg border-2 border-dashed py-5 flex flex-col items-center gap-1 ${isMoto ? "border-red-600/40 bg-red-50" : "border-[#D4AF37]/40 bg-[#D4AF37]/5"}`}>
                <Camera size={14} className={isMoto ? "text-red-600" : "text-[#D4AF37]"} />
                <span className="text-[8px] font-semibold text-[#111] text-center px-1">{z}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#D4AF37]/10 p-2"><Star size={12} className="text-[#D4AF37]" /><span className="text-[9px] text-[#374151]">Score qualité calculé automatiquement selon vos photos</span></div>
          <button onClick={() => setStep(3)} className={`w-full rounded-xl py-3 text-sm font-bold text-white active:scale-[0.98] ${isMoto ? "bg-red-600" : "bg-[#D4AF37]"}`}>Suivant — Documents</button>
        </div>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Documents</h3>
          {(isMoto
            ? ["Carte grise moto", "Contrôle technique (si applicable)", "Factures entretien", "Historique moto"]
            : ["Carte grise", "Contrôle technique", "Factures entretien", "Historique véhicule"]
          ).map((d) => (
            <button key={d} className="w-full flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3">
              <FileText size={14} className={isMoto ? "text-red-600" : "text-[#D4AF37]"} /><span className="flex-1 text-sm text-[#111]">{d}</span><Upload size={14} className="text-[#6B7280]" />
            </button>
          ))}
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-2"><Bot size={12} className="text-blue-500" /><span className="text-[9px] text-blue-700">Vérification IA automatique + validation humaine obligatoire</span></div>
          <button onClick={() => setStep(4)} className={`w-full rounded-xl py-3 text-sm font-bold text-white active:scale-[0.98] ${isMoto ? "bg-red-600" : "bg-[#D4AF37]"}`}>Suivant — Vérification IA</button>
        </div>
      )}

      {/* Step 4: Vérification IA */}
      {step === 4 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3 text-center">
          <Bot size={32} className={`mx-auto ${isMoto ? "text-red-600" : "text-[#D4AF37]"}`} />
          <h3 className="text-base font-bold text-[#111]">Vérification IA en cours</h3>
          <p className="text-xs text-[#6B7280]">Analyse : prix, photos, documents, doublons, fraude</p>
          <div className="space-y-1.5 text-left">
            {[
              ["Cohérence prix", true], ["Qualité photos", true], ["Documents vérifiés", true],
              ["Doublons", true], ["Détection fraude", true], ["Score qualité", true],
            ].map(([s, done]) => (
              <div key={s as string} className="flex items-center gap-2 text-xs"><span className={`h-2 w-2 rounded-full ${done ? "bg-green-500" : "bg-[#E5E7EB]"}`} /><span className={done ? "text-[#111] font-semibold" : "text-red-500"}>{s as string}</span>{done && <Check size={12} className="text-green-500 ml-auto" />}</div>
            ))}
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-2"><p className="text-xs font-bold text-green-700">Score qualité : 85/100</p></div>
          <button onClick={() => setStep(5)} className={`w-full rounded-xl py-3 text-sm font-bold text-white active:scale-[0.98] ${isMoto ? "bg-red-600" : "bg-[#D4AF37]"}`}>Publier l'annonce</button>
        </div>
      )}

      {/* Step 5: Publication */}
      {step === 5 && (
        <div className="mx-4 mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center space-y-2">
          <Check size={32} className="mx-auto text-green-600" />
          <h3 className="text-base font-bold text-green-800">Annonce publiée !</h3>
          <p className="text-xs text-green-700">Votre {isMoto ? "moto" : "véhicule"} est maintenant visible sur MKA.P-MS.</p>
          <div className="flex gap-2 mt-2"><span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">PRO</span><span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">VÉRIFIÉ</span></div>
          <Link to="/acheter" className={`inline-block rounded-xl px-6 py-2.5 text-sm font-bold text-white mt-2 ${isMoto ? "bg-red-600" : "bg-[#D4AF37]"}`}>Voir mes annonces</Link>
        </div>
      )}
    </div>
  );
}
