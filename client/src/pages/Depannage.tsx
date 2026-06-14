import { useState } from "react";
import {
  AlertTriangle, MapPin, Car, Camera, CreditCard, CheckCircle, Phone, MessageSquare,
  Clock, Star, Navigation, Wrench, Battery, Fuel, Truck, ChevronRight, Shield,
} from "lucide-react";

const TYPES_PANNE = [
  { id: "moteur", label: "Panne moteur", icon: Wrench, desc: "Le moteur ne démarre pas ou cale" },
  { id: "batterie", label: "Panne batterie", icon: Battery, desc: "Batterie à plat, plus de courant" },
  { id: "crevaison", label: "Crevaison", icon: Car, desc: "Pneu crevé ou éclaté" },
  { id: "accident", label: "Accident", icon: AlertTriangle, desc: "Collision ou dommages" },
  { id: "immobilise", label: "Véhicule immobilisé", icon: Car, desc: "Impossible de rouler" },
  { id: "carburant", label: "Erreur carburant", icon: Fuel, desc: "Mauvais carburant ou réservoir vide" },
  { id: "remorquage", label: "Remorquage simple", icon: Truck, desc: "Besoin de déplacer le véhicule" },
  { id: "autre", label: "Autre", icon: Wrench, desc: "Autre type de panne" },
];

const DEPANNEURS = [
  { id: 1, nom: "Dépannage Express IDF", zone: "Paris & Île-de-France", note: 4.8, avis: 342, tel: "01 45 67 89 00", distance: "2.3 km", dispo: true },
  { id: 2, nom: "SOS Auto 24/7", zone: "Paris 75", note: 4.6, avis: 218, tel: "01 42 33 44 55", distance: "3.1 km", dispo: true },
  { id: 3, nom: "Rapide Dépannage", zone: "Seine-Saint-Denis 93", note: 4.5, avis: 156, tel: "01 48 22 33 44", distance: "5.7 km", dispo: true },
  { id: 4, nom: "AutoSecours France", zone: "Val-de-Marne 94", note: 4.7, avis: 289, tel: "01 43 55 66 77", distance: "7.2 km", dispo: false },
  { id: 5, nom: "Dépannage Belloy-Auto", zone: "Val-d'Oise 95", note: 4.9, avis: 87, tel: "01 30 11 22 33", distance: "12 km", dispo: true },
];

const STEPS = ["Type de panne", "Localisation", "Véhicule", "Photos", "Paiement", "Validation"];

const MISSION_STATUTS = [
  { label: "Recherche en cours", desc: "Recherche du dépanneur le plus proche…", color: "bg-blue-500" },
  { label: "Dépanneur trouvé", desc: "Un dépanneur a été identifié", color: "bg-indigo-500" },
  { label: "Mission acceptée", desc: "Le dépanneur a accepté votre demande", color: "bg-purple-500" },
  { label: "En route", desc: "Le dépanneur est en route vers vous", color: "bg-amber-500" },
  { label: "Arrivé sur place", desc: "Le dépanneur est arrivé", color: "bg-orange-500" },
  { label: "Intervention en cours", desc: "Réparation ou remorquage en cours", color: "bg-[#D4AF37]" },
  { label: "Terminé", desc: "Intervention terminée avec succès", color: "bg-green-500" },
];

export default function Depannage() {
  const [mode, setMode] = useState<"home" | "demande" | "suivi">("home");
  const [step, setStep] = useState(0);

  // Step 1 — Type
  const [typePanne, setTypePanne] = useState("");
  // Step 2 — Localisation
  const [useGPS, setUseGPS] = useState(true);
  const [adresse, setAdresse] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsResult, setGpsResult] = useState("");
  // Step 3 — Véhicule
  const [plaque, setPlaque] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [couleur, setCouleur] = useState("");
  // Step 4 — Photos
  const [photos, setPhotos] = useState<string[]>([]);
  // Step 5 — Paiement
  const [paiement, setPaiement] = useState("");
  // Step 6 — Validation
  const [submitted, setSubmitted] = useState(false);
  // Suivi
  const [currentStatut, setCurrentStatut] = useState(0);
  // Notation
  const [showRating, setShowRating] = useState(false);
  const [ratings, setRatings] = useState({ ponctualite: 0, professionnalisme: 0, accueil: 0, qualite: 0 });

  const handleGPS = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsResult(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          setGpsLoading(false);
        },
        () => {
          setGpsResult("Position non disponible — saisissez manuellement");
          setUseGPS(false);
          setGpsLoading(false);
        }
      );
    } else {
      setGpsResult("GPS non supporté");
      setUseGPS(false);
      setGpsLoading(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setMode("suivi");
    // Simulate progression
    let s = 0;
    const timer = setInterval(() => {
      s++;
      if (s >= MISSION_STATUTS.length) {
        clearInterval(timer);
        setShowRating(true);
      } else {
        setCurrentStatut(s);
      }
    }, 3000);
  };

  const canNext = () => {
    if (step === 0) return !!typePanne;
    if (step === 1) return useGPS ? !!gpsResult : !!adresse;
    if (step === 2) return !!plaque && !!marque;
    if (step === 3) return true; // photos optional
    if (step === 4) return !!paiement;
    return true;
  };

  if (mode === "suivi") {
    return (
      <div className="container-page py-8">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]">
              <Navigation size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#111]">Suivi de votre dépannage</h1>
              <p className="text-xs text-slate-500">Mission #DEP-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-6 space-y-0">
            {MISSION_STATUTS.map((s, i) => {
              const done = i <= currentStatut;
              const active = i === currentStatut;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold ${done ? s.color : "bg-slate-200"}`}>
                      {done ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    {i < MISSION_STATUTS.length - 1 && <div className={`h-8 w-0.5 ${done ? "bg-[#D4AF37]" : "bg-slate-200"}`} />}
                  </div>
                  <div className={`pb-4 ${active ? "" : ""}`}>
                    <p className={`text-sm font-bold ${done ? "text-[#111]" : "text-slate-400"}`}>{s.label}</p>
                    <p className={`text-xs ${done ? "text-slate-600" : "text-slate-300"}`}>{s.desc}</p>
                    {active && !showRating && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-[#D4AF37] font-semibold">
                        <Clock size={10} className="animate-spin" /> En cours…
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info dépanneur */}
          {currentStatut >= 1 && (
            <div className="mt-4 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
              <h3 className="text-sm font-bold text-[#111]">Votre dépanneur</h3>
              <p className="mt-1 text-sm text-slate-700 font-semibold">Dépannage Express IDF</p>
              <div className="mt-2 flex gap-3">
                <a href="tel:0145678900" className="flex items-center gap-1.5 rounded-lg bg-[#111] px-3 py-1.5 text-xs font-bold text-white">
                  <Phone size={12} /> Appeler
                </a>
                <button className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white">
                  <MessageSquare size={12} /> Message
                </button>
              </div>
              {currentStatut >= 3 && (
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1"><Clock size={10} /> Arrivée estimée : ~8 min</p>
              )}
            </div>
          )}

          {/* Notation */}
          {showRating && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
              <h3 className="text-sm font-bold text-green-800 flex items-center gap-2"><CheckCircle size={16} /> Intervention terminée !</h3>
              <p className="mt-1 text-xs text-green-700">Notez votre dépanneur pour aider la communauté.</p>
              <div className="mt-4 space-y-3">
                {(["ponctualite", "professionnalisme", "accueil", "qualite"] as const).map((key) => {
                  const labels: Record<string, string> = { ponctualite: "Ponctualité", professionnalisme: "Professionnalisme", accueil: "Accueil", qualite: "Qualité du service" };
                  return (
                    <div key={key}>
                      <label className="text-xs font-semibold text-slate-700">{labels[key]}</label>
                      <div className="mt-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setRatings((r) => ({ ...r, [key]: n }))}>
                            <Star size={20} className={n <= ratings[key] ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="mt-4 w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700">
                Envoyer mon avis
              </button>
            </div>
          )}

          <button onClick={() => { setMode("home"); setStep(0); setSubmitted(false); setCurrentStatut(0); setShowRating(false); }} className="mt-6 w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600">
            Retour à l'accueil dépannage
          </button>
        </div>
      </div>
    );
  }

  if (mode === "demande") {
    return (
      <div className="container-page py-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-xl font-extrabold text-[#111]">Demander une dépanneuse</h1>
          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full ${i <= step ? "bg-[#D4AF37]" : "bg-slate-200"}`} />
                <span className={`text-[8px] font-semibold ${i <= step ? "text-[#D4AF37]" : "text-slate-400"}`}>{s}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {/* STEP 0 — Type de panne */}
            {step === 0 && (
              <div>
                <h2 className="text-sm font-bold text-[#111]">Quel est le problème ?</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {TYPES_PANNE.map((t) => {
                    const Icon = t.icon;
                    const sel = typePanne === t.id;
                    return (
                      <button key={t.id} type="button" onClick={() => setTypePanne(t.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition ${sel ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-200 hover:border-[#D4AF37]/30"}`}>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${sel ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-500"}`}>
                          <Icon size={16} />
                        </div>
                        <span className={`text-xs font-bold ${sel ? "text-[#111]" : "text-slate-600"}`}>{t.label}</span>
                        <span className="text-[9px] text-slate-400">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 1 — Localisation */}
            {step === 1 && (
              <div>
                <h2 className="text-sm font-bold text-[#111]">Où êtes-vous ?</h2>
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setUseGPS(true); handleGPS(); }}
                      className={`flex-1 rounded-xl border-2 p-3 text-center text-xs font-bold transition ${useGPS ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#111]" : "border-slate-200 text-slate-500"}`}>
                      <Navigation size={16} className="mx-auto mb-1" />
                      GPS automatique
                    </button>
                    <button type="button" onClick={() => setUseGPS(false)}
                      className={`flex-1 rounded-xl border-2 p-3 text-center text-xs font-bold transition ${!useGPS ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#111]" : "border-slate-200 text-slate-500"}`}>
                      <MapPin size={16} className="mx-auto mb-1" />
                      Saisie manuelle
                    </button>
                  </div>
                  {useGPS && (
                    <div>
                      {!gpsResult && !gpsLoading && (
                        <button type="button" onClick={handleGPS} className="w-full rounded-lg bg-[#111] py-2.5 text-sm font-bold text-white">
                          Activer ma position
                        </button>
                      )}
                      {gpsLoading && <p className="text-sm text-[#D4AF37] text-center animate-pulse">Détection de votre position…</p>}
                      {gpsResult && <p className="text-sm text-green-600 font-semibold flex items-center gap-1"><MapPin size={14} /> {gpsResult}</p>}
                    </div>
                  )}
                  {!useGPS && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Adresse ou lieu</label>
                      <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]"
                        placeholder="Ex: 14 Rue du Petit, 95270 Belloy-en-France" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 — Véhicule */}
            {step === 2 && (
              <div>
                <h2 className="text-sm font-bold text-[#111]">Informations véhicule</h2>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Plaque d'immatriculation *</label>
                    <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]"
                      placeholder="AB-123-CD" value={plaque} onChange={(e) => setPlaque(e.target.value.toUpperCase())} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Marque *</label>
                      <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]"
                        placeholder="Ex: Peugeot" value={marque} onChange={(e) => setMarque(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Modèle</label>
                      <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]"
                        placeholder="Ex: 308" value={modele} onChange={(e) => setModele(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Couleur</label>
                    <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]"
                      placeholder="Ex: Gris" value={couleur} onChange={(e) => setCouleur(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Photos */}
            {step === 3 && (
              <div>
                <h2 className="text-sm font-bold text-[#111]">Photos (facultatif)</h2>
                <p className="mt-1 text-xs text-slate-500">Ajoutez des photos pour aider le dépanneur à préparer son intervention.</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {["Véhicule", "Panne", "Accident"].map((label) => (
                    <button key={label} type="button"
                      onClick={() => setPhotos((p) => p.includes(label) ? p.filter((x) => x !== label) : [...p, label])}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition ${photos.includes(label) ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-dashed border-slate-300"}`}>
                      <Camera size={20} className={photos.includes(label) ? "text-[#D4AF37]" : "text-slate-400"} />
                      <span className="text-[10px] font-semibold text-slate-600">{label}</span>
                      {photos.includes(label) && <CheckCircle size={12} className="text-[#D4AF37]" />}
                    </button>
                  ))}
                </div>
                {photos.length > 0 && <p className="mt-2 text-xs text-green-600">{photos.length} photo(s) sélectionnée(s)</p>}
              </div>
            )}

            {/* STEP 4 — Paiement */}
            {step === 4 && (
              <div>
                <h2 className="text-sm font-bold text-[#111]">Mode de paiement</h2>
                <div className="mt-3 space-y-2">
                  {[
                    { id: "cb", label: "Carte bancaire", desc: "Paiement sécurisé via Stripe", icon: CreditCard },
                    { id: "especes", label: "Espèces", desc: "Paiement en main propre au dépanneur", icon: CreditCard },
                    { id: "apres", label: "Après intervention", desc: "Si autorisé par le dépanneur", icon: Clock },
                  ].map((p) => {
                    const sel = paiement === p.id;
                    const Icon = p.icon;
                    return (
                      <button key={p.id} type="button" onClick={() => setPaiement(p.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${sel ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-200"}`}>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${sel ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-500"}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <span className={`text-sm font-bold ${sel ? "text-[#111]" : "text-slate-600"}`}>{p.label}</span>
                          <p className="text-[10px] text-slate-400">{p.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5 — Validation / Récap */}
            {step === 5 && (
              <div>
                <h2 className="text-sm font-bold text-[#111]">Récapitulatif</h2>
                <div className="mt-3 rounded-xl border border-[#D4AF37]/20 bg-[#FEFCE8] p-4 space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Type de panne</span><span className="font-bold text-[#111]">{TYPES_PANNE.find((t) => t.id === typePanne)?.label}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Localisation</span><span className="font-bold text-[#111]">{useGPS ? gpsResult : adresse}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Véhicule</span><span className="font-bold text-[#111]">{plaque} — {marque} {modele}</span></div>
                  {couleur && <div className="flex justify-between text-xs"><span className="text-slate-500">Couleur</span><span className="font-bold text-[#111]">{couleur}</span></div>}
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Photos</span><span className="font-bold text-[#111]">{photos.length > 0 ? `${photos.length} photo(s)` : "Aucune"}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Paiement</span><span className="font-bold text-[#111]">{paiement === "cb" ? "Carte bancaire" : paiement === "especes" ? "Espèces" : "Après intervention"}</span></div>
                </div>
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-800 flex items-center gap-1.5"><Shield size={12} /> Le dépanneur le plus proche et disponible sera automatiquement recherché.</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600">
                Retour
              </button>
            )}
            {step < 5 ? (
              <button type="button" onClick={() => setStep(step + 1)} disabled={!canNext()}
                className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white disabled:opacity-40 hover:bg-[#C5A028]">
                Suivant <ChevronRight size={14} className="inline ml-1" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700">
                Valider ma demande
              </button>
            )}
          </div>
          <button onClick={() => setMode("home")} className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600">Annuler</button>
        </div>
      </div>
    );
  }

  // HOME
  return (
    <div className="container-page py-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-6 text-white text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
          <AlertTriangle size={28} className="text-white" />
        </div>
        <h1 className="mt-3 text-2xl font-extrabold">Dépannage / Assistance</h1>
        <p className="mt-1 text-sm text-white/80">Assistance routière 24h/24, 7j/7 — un dépanneur près de chez vous en quelques minutes</p>
        <button onClick={() => setMode("demande")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-red-700 shadow-lg hover:bg-red-50">
          <Phone size={16} /> Demander une dépanneuse
        </button>
      </div>

      {/* Comment ça marche */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#111] text-center">Comment ça marche ?</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-3 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-white">{i + 1}</div>
              <span className="text-[10px] font-bold text-[#111]">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dépanneurs disponibles */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#111]">Dépanneurs disponibles</h2>
        <p className="mt-1 text-xs text-slate-500">Les dépanneurs les plus proches et les mieux notés</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DEPANNEURS.map((d) => (
            <div key={d.id} className={`rounded-xl border p-4 ${d.dispo ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111]">{d.nom}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin size={10} /> {d.zone}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.dispo ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                  {d.dispo ? "Disponible" : "Occupé"}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400" /> {d.note} ({d.avis} avis)</span>
                <span className="flex items-center gap-1"><Navigation size={10} /> {d.distance}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <a href={`tel:${d.tel.replace(/\s/g, "")}`} className="flex items-center gap-1 rounded-lg bg-[#111] px-3 py-1.5 text-[10px] font-bold text-white">
                  <Phone size={10} /> Appeler
                </a>
                <button onClick={() => setMode("demande")} className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-[10px] font-bold text-white">
                  <Wrench size={10} /> Demander
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Types de pannes */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#111]">Types de pannes pris en charge</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TYPES_PANNE.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.id} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-3 text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                  <Icon size={14} className="text-red-600" />
                </div>
                <span className="text-[10px] font-bold text-[#111]">{t.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA bottom */}
      <div className="mt-8 rounded-xl bg-[#111] p-6 text-center">
        <h3 className="text-lg font-bold text-white">Besoin d'un dépanneur maintenant ?</h3>
        <p className="mt-1 text-xs text-slate-400">Intervention rapide, suivi en temps réel, paiement sécurisé</p>
        <button onClick={() => setMode("demande")}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700">
          <Phone size={14} /> Demander une dépanneuse
        </button>
      </div>
    </div>
  );
}
