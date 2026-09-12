import { useState } from "react";
import {
  AlertTriangle, MapPin, Car, Camera, CreditCard, CheckCircle, Phone, MessageSquare,
  Clock, Star, Navigation, Wrench, Battery, Fuel, Truck, ChevronRight, Shield,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

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

const STEPS = ["Type de panne", "Localisation", "Véhicule", "Photos", "Paiement", "Validation"];

/**
 * Reflète le vrai cycle de statut (server/modules/depannage.ts::breakdownStatusEnum).
 * Jamais une progression simulée : l'étape affichée dépend du statut réel
 * renvoyé par trpc.depannage.myRequests.
 */
const STATUT_AFFICHAGE: Record<string, { label: string; desc: string; color: string; ordre: number }> = {
  demande: { label: "Demande envoyée", desc: "Votre demande a été transmise aux dépanneurs du secteur.", color: "bg-blue-500", ordre: 0 },
  en_recherche: { label: "Recherche en cours", desc: "Recherche du dépanneur le plus proche…", color: "bg-blue-500", ordre: 0 },
  devis_envoye: { label: "Devis reçu", desc: "Un dépanneur a envoyé un devis — validez-le pour continuer.", color: "bg-indigo-500", ordre: 1 },
  acceptee: { label: "Mission acceptée", desc: "Le dépanneur a accepté votre demande.", color: "bg-purple-500", ordre: 2 },
  en_intervention: { label: "Intervention en cours", desc: "Le dépanneur est sur place ou en route.", color: "bg-[#D4AF37]", ordre: 3 },
  terminee: { label: "Terminé", desc: "Intervention terminée avec succès.", color: "bg-green-500", ordre: 4 },
  annulee: { label: "Annulée", desc: "La demande a été annulée.", color: "bg-slate-400", ordre: 0 },
  litige: { label: "Litige en cours", desc: "Un litige est ouvert sur cette demande.", color: "bg-red-500", ordre: 3 },
};

export default function Depannage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<"home" | "demande" | "suivi">("home");
  const [step, setStep] = useState(0);

  // Step 1 — Type
  const [typePanne, setTypePanne] = useState("");
  // Step 2 — Localisation
  const [useGPS, setUseGPS] = useState(true);
  const [adresse, setAdresse] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsResult, setGpsResult] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Step 3 — Véhicule
  const [plaque, setPlaque] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [couleur, setCouleur] = useState("");
  // Step 4 — Photos (libellés indicatifs — l'upload réel de fichiers n'est pas encore branché ici, voir FileUpload pour un futur lot)
  const [photos, setPhotos] = useState<string[]>([]);
  // Step 5 — Paiement (préférence transmise au dépanneur ; le paiement réel se fait au moment du devis, voir payQuote)
  const [paiement, setPaiement] = useState("");
  // Suivi — id de la demande réellement créée côté serveur
  const [requestId, setRequestId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const providers = trpc.depannage.providers.useQuery({});
  const myRequests = trpc.depannage.myRequests.useQuery(undefined, { enabled: !!user, refetchInterval: mode === "suivi" ? 8000 : false });
  const demandeActuelle = myRequests.data?.find((r) => r.id === requestId) ?? null;
  const quotes = trpc.depannage.quotes.useQuery({ requestId: requestId ?? 0 }, { enabled: !!requestId, refetchInterval: mode === "suivi" ? 8000 : false });
  const createRequest = trpc.depannage.createRequest.useMutation();
  const payQuote = trpc.depannage.payQuote.useMutation({
    onSuccess: (r) => { if (r.url) window.location.href = r.url; },
  });

  const handleGPS = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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
    if (!user) {
      showToast("Connectez-vous pour envoyer votre demande de dépannage.");
      return;
    }
    const vehicule = [plaque, marque, modele, couleur].filter(Boolean).join(" — ");
    const descriptionParts = [
      couleur ? `Couleur : ${couleur}.` : null,
      photos.length > 0 ? `Photos signalées : ${photos.join(", ")}.` : null,
      paiement ? `Paiement préféré : ${paiement === "cb" ? "carte bancaire" : paiement === "especes" ? "espèces" : "après intervention"}.` : null,
    ].filter(Boolean);
    createRequest.mutate(
      {
        typePanne: TYPES_PANNE.find((t) => t.id === typePanne)?.label,
        description: descriptionParts.join(" ") || undefined,
        vehicule: vehicule || undefined,
        adresse: !useGPS && adresse ? adresse : undefined,
        lat: useGPS && gpsCoords ? gpsCoords.lat : undefined,
        lng: useGPS && gpsCoords ? gpsCoords.lng : undefined,
      },
      {
        onSuccess: (r) => {
          setRequestId(r.id);
          setMode("suivi");
        },
        onError: (e) => showToast(`Échec de la demande : ${e.message}`),
      },
    );
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
              <p className="text-xs text-slate-500">Demande #{requestId ?? "…"}</p>
            </div>
          </div>

          {myRequests.isLoading && <p className="mt-6 text-sm text-slate-500 text-center">Chargement…</p>}

          {!myRequests.isLoading && !demandeActuelle && (
            <p className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 text-center">
              Demande introuvable. Elle a peut-être été annulée.
            </p>
          )}

          {demandeActuelle && (
            <>
              {/* Statut réel — jamais une progression simulée */}
              <div className="mt-6 rounded-xl border border-[#D4AF37]/20 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${STATUT_AFFICHAGE[demandeActuelle.status]?.color ?? "bg-slate-400"}`}>
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111]">{STATUT_AFFICHAGE[demandeActuelle.status]?.label ?? demandeActuelle.status}</p>
                    <p className="text-xs text-slate-500">{STATUT_AFFICHAGE[demandeActuelle.status]?.desc ?? ""}</p>
                  </div>
                </div>
              </div>

              {/* Devis réellement reçus — jamais un dépanneur ni un tarif inventé */}
              {(quotes.data?.length ?? 0) > 0 && demandeActuelle.status !== "terminee" && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-bold text-[#111]">Devis reçus</h3>
                  {quotes.data!.map((q) => (
                    <div key={q.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[#111]">{Number(q.montant).toFixed(2)} {q.currency}</p>
                        {q.accepte ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Accepté</span>
                        ) : (
                          <button
                            onClick={() => payQuote.mutate({ quoteId: q.id })}
                            disabled={payQuote.isPending}
                            className="rounded-lg bg-[#111] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {payQuote.isPending ? "…" : "Payer ce devis"}
                          </button>
                        )}
                      </div>
                      {q.description && <p className="mt-1 text-xs text-slate-500">{q.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Intervention terminée : renvoi vers le vrai système d'avis, jamais un formulaire dupliqué */}
              {demandeActuelle.status === "terminee" && (
                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                  <CheckCircle size={24} className="mx-auto text-green-600" />
                  <h3 className="mt-2 text-sm font-bold text-green-800">Intervention terminée</h3>
                  <p className="mt-1 text-xs text-green-700">Votre avis est attendu dans votre espace « Mes avis ».</p>
                  <a href="/compte/avis" className="mt-3 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
                    Déposer mon avis
                  </a>
                </div>
              )}
            </>
          )}

          <button onClick={() => { setMode("home"); setStep(0); setRequestId(null); }} className="mt-6 w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600">
            Retour à l'accueil dépannage
          </button>
        </div>
        {toast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]">
            <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400 shrink-0" />
              <span>{toast}</span>
            </div>
          </div>
        )}
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
              <button type="button" onClick={handleSubmit} disabled={createRequest.isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
                {createRequest.isPending ? "Envoi…" : "Valider ma demande"}
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

      {/* Dépanneurs partenaires — données réelles (server/routers/depannage.ts::providers), jamais une liste inventée */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#111]">Dépanneurs partenaires</h2>
        <p className="mt-1 text-xs text-slate-500">Envoyez votre demande : les dépanneurs de votre secteur vous répondent avec un devis.</p>
        {providers.isLoading && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}
        {!providers.isLoading && (providers.data?.length ?? 0) === 0 && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Aucun dépanneur partenaire enregistré pour le moment. Envoyez tout de même votre demande — elle sera transmise dès qu'un dépanneur rejoint la plateforme dans votre secteur.
          </p>
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(providers.data ?? []).map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111]">{d.nom}</h3>
                  {d.zone && <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin size={10} /> {d.zone}</p>}
                </div>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">Actif</span>
              </div>
              {d.rating != null && (
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <Star size={10} className="fill-amber-400 text-amber-400" /> {Number(d.rating).toFixed(1)}
                </div>
              )}
              <button onClick={() => setMode("demande")} className="mt-3 flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-[10px] font-bold text-white">
                <Wrench size={10} /> Demander
              </button>
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
