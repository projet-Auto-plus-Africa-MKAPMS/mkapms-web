import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Search, Car, Camera, FileText, Phone, CheckCircle } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import FileUpload from "../components/FileUpload";

/* ═══════════════════════════════════════════════════════════
   6 ÉTAPES : Estimation → Détails → Photos → Description/Prix → Contact → Publication
   ═══════════════════════════════════════════════════════════ */
const STEPS = [
  { num: 1, label: "Estimation", icon: Search },
  { num: 2, label: "Détails", icon: Car },
  { num: 3, label: "Photos", icon: Camera },
  { num: 4, label: "Description & Prix", icon: FileText },
  { num: 5, label: "Contact", icon: Phone },
  { num: 6, label: "Publication", icon: CheckCircle },
];

const MARQUES = [
  "Renault", "Peugeot", "Citroën", "Volkswagen", "BMW", "Mercedes", "Audi",
  "Toyota", "Nissan", "Ford", "Opel", "Fiat", "Hyundai", "Kia", "Dacia",
  "Skoda", "Seat", "Volvo", "Mazda", "Honda", "Suzuki", "Mitsubishi",
  "Jeep", "Land Rover", "Porsche", "Tesla", "Mini", "Alfa Romeo", "DS",
  "Jaguar", "Lexus", "Chevrolet", "Dodge", "Autre",
];

const ETATS = ["Excellent", "Très bon", "Bon", "Correct", "À rénover"];

export default function Vendre() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { format: formatPrice } = useCurrency();
  const utils = trpc.useUtils();

  const [step, setStep] = useState(1);
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateResult, setPlateResult] = useState<any>(null);
  const [etatGeneral, setEtatGeneral] = useState("Bon");

  const [typeAnnonce, setTypeAnnonce] = useState<"vente" | "location">("vente");
  const [form, setForm] = useState({
    titre: "",
    marque: "",
    modele: "",
    version: "",
    annee: "2020",
    kilometrage: "",
    prix: "",
    carburant: "diesel",
    boite: "manuelle",
    categorie: "berline",
    famille: "auto",
    ville: "",
    codePostal: "",
    contactTelephone: "",
    description: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);

  const [estim, setEstim] = useState<
    { low: number; mid: number; high: number; method: string; sampleSize: number } | null
  >(null);
  const [estimLoading, setEstimLoading] = useState(false);

  const create = trpc.annonces.create.useMutation({
    onSuccess: (a) => navigate(`/vehicule/${a.id}`),
  });

  if (!user) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-slate-900">Connectez-vous pour publier une annonce</h1>
          <p className="mt-2 text-sm text-slate-500">
            C'est gratuit pour les particuliers, jusqu'à 4 photos incluses. Photos supplémentaires payantes.
          </p>
          <Link to="/connexion" className="btn-primary mt-6 w-full">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const maxPhotos = user.accountType === "professionnel" ? 10 : 4;

  function set<K extends keyof typeof form>(k: K, val: string) {
    setForm((f) => ({ ...f, [k]: val }));
  }

  function onFilesUploaded(files: { url: string; originalName: string }[]) {
    setPhotos((prev) => [...prev, ...files.map((f) => f.url)].slice(0, maxPhotos));
  }

  /* Identification par plaque / VIN */
  async function identifierVehicule() {
    const query = plaque.trim() || vin.trim();
    const type = plaque.trim() ? "plaque" : "vin";
    if (!query) return;
    setPlateLoading(true);
    try {
      const r = await utils.annonces.lookupPlate.fetch({ type, query });
      if (r) {
        setPlateResult(r);
        if (r.marque) set("marque", r.marque);
        if (r.modele) set("modele", r.modele);
        if (r.version) set("version", r.version);
        if (r.annee) set("annee", String(r.annee));
        if (r.carburant) set("carburant", r.carburant);
        if (r.boite) set("boite", r.boite);
        if (r.categorie) set("categorie", r.categorie);
      }
    } catch {
      // lookup failed — user fills manually
    } finally {
      setPlateLoading(false);
    }
  }

  /* Estimation du prix */
  async function estimerPrix() {
    if (!form.marque) return;
    setEstimLoading(true);
    try {
      const r = await utils.annonces.estimate.fetch({
        marque: form.marque,
        modele: form.modele || "standard",
        annee: form.annee ? Number(form.annee) : undefined,
        kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
        carburant: form.carburant || undefined,
        boite: form.boite || undefined,
        etat: etatGeneral || undefined,
      });
      setEstim(r);
    } finally {
      setEstimLoading(false);
    }
  }

  function submit() {
    create.mutate({
      type: typeAnnonce,
      titre: form.titre || `${form.marque} ${form.modele}`,
      marque: form.marque,
      modele: form.modele,
      version: form.version || undefined,
      annee: form.annee ? Number(form.annee) : undefined,
      kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
      prix: form.prix ? Number(form.prix) : 0,
      carburant: form.carburant,
      boite: form.boite,
      categorie: form.categorie as any,
      famille: form.famille as any,
      ville: form.ville || undefined,
      codePostal: form.codePostal || undefined,
      contactTelephone: form.contactTelephone || undefined,
      description: form.description || undefined,
      photos,
    });
  }

  function canNext(): boolean {
    if (step === 1) return true;
    if (step === 2) return !!form.marque && !!form.modele;
    if (step === 3) return true;
    if (step === 4) return !!form.prix;
    if (step === 5) return true;
    return true;
  }

  return (
    <div className="container-page py-8">
      {/* Header */}
      <h1 className="text-2xl font-extrabold text-slate-900">Déposer une annonce</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gratuit pour les particuliers · {maxPhotos} photos incluses
      </p>

      {/* Stepper */}
      <div className="mt-6 flex items-center justify-between overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white p-3">
        {STEPS.map((s, i) => {
          const done = step > s.num;
          const active = step === s.num;
          const Icon = s.icon;
          return (
            <div key={s.num} className="flex items-center">
              <button
                type="button"
                onClick={() => s.num <= step && setStep(s.num)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition
                  ${active ? "bg-[#D4AF37] text-white shadow-sm" : done ? "bg-green-100 text-green-700" : "text-[#9CA3AF]"}`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.num}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 w-4 ${done ? "bg-green-400" : "bg-[#E5E7EB]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Contenu de l'étape */}
      <div className="mt-6">
        {/* ═══ ÉTAPE 1 — ESTIMATION DE VOITURE ═══ */}
        {step === 1 && (
          <div className="card mx-auto max-w-2xl p-6">
            {/* Choix Vente / Location — pros only */}
            {user.accountType === "professionnel" && (
              <div className="mb-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setTypeAnnonce("vente")}
                  className={`flex-1 rounded-xl border-2 p-3 text-center font-bold transition ${typeAnnonce === "vente" ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-[#E5E7EB] text-[#6B7280]"}`}
                >
                  Vendre
                </button>
                <button
                  type="button"
                  onClick={() => setTypeAnnonce("location")}
                  className={`flex-1 rounded-xl border-2 p-3 text-center font-bold transition ${typeAnnonce === "location" ? "border-[#D4AF37] bg-[#FFFBEB] text-[#111]" : "border-[#E5E7EB] text-[#6B7280]"}`}
                >
                  Mettre en location
                </button>
              </div>
            )}

            <h2 className="mb-1 text-2xl font-extrabold text-[#111]">Estimation de voiture</h2>
            <p className="mb-6 text-sm text-[#6B7280]">
              Obtenez une estimation gratuite en quelques secondes.
            </p>

            {/* Plaque + VIN côte à côte — alignés comme page accueil */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Plaque</label>
                <input
                  className="input text-sm"
                  placeholder="AB-123-CD"
                  value={plaque}
                  onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">VIN</label>
                <input
                  className="input text-sm"
                  placeholder="VF1XXXXX..."
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  maxLength={17}
                />
              </div>
            </div>

            {/* Gros bouton Rechercher */}
            <button
              type="button"
              className="mb-4 w-full rounded-xl bg-[#D4AF37] px-4 py-4 text-base font-bold text-white shadow-md hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={(!plaque.trim() && !vin.trim()) || plateLoading}
              onClick={identifierVehicule}
            >
              <Search size={20} />
              {plateLoading ? "Recherche en cours..." : "Rechercher et remplir automatiquement"}
            </button>

            {/* Résultat identification */}
            {plateResult && (
              <div className="mb-4 rounded-xl bg-green-50 border border-green-200 p-4">
                <p className="text-sm font-bold text-green-700">Véhicule identifié !</p>
                <p className="mt-1 text-sm text-green-600">
                  {plateResult.marque} {plateResult.modele} {plateResult.version ?? ""} {plateResult.annee ? `(${plateResult.annee})` : ""}
                </p>
              </div>
            )}

            {/* Formulaire estimation */}
            <div className="space-y-4">
              {/* Marque + Modèle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#D4AF37]">Marque *</label>
                  <select className="input" value={form.marque} onChange={(e) => set("marque", e.target.value)}>
                    <option value="">Choisir</option>
                    {MARQUES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#D4AF37]">Modèle *</label>
                  <input className="input" value={form.modele} onChange={(e) => set("modele", e.target.value)} placeholder="Ex : 308, Clio..." />
                </div>
              </div>

              {/* Année + Carburant */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#D4AF37]">Année *</label>
                  <select className="input" value={form.annee} onChange={(e) => set("annee", e.target.value)}>
                    {Array.from({ length: 30 }, (_, i) => 2025 - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#D4AF37]">Carburant</label>
                  <select className="input" value={form.carburant} onChange={(e) => set("carburant", e.target.value)}>
                    <option value="diesel">Diesel</option>
                    <option value="essence">Essence</option>
                    <option value="electrique">Électrique</option>
                    <option value="hybride">Hybride</option>
                    <option value="gpl">GPL</option>
                  </select>
                </div>
              </div>

              {/* Kilométrage (slider) */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#D4AF37]">
                  Kilométrage : {form.kilometrage ? Number(form.kilometrage).toLocaleString() : "0"} km
                </label>
                <input
                  type="range"
                  min="0"
                  max="300000"
                  step="1000"
                  value={form.kilometrage || "0"}
                  onChange={(e) => set("kilometrage", e.target.value)}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #D4AF37 ${(Number(form.kilometrage || 0) / 300000) * 100}%, #E5E7EB ${(Number(form.kilometrage || 0) / 300000) * 100}%)` }}
                />
                <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
                  <span>0 km</span>
                  <span>150 000 km</span>
                  <span>300 000 km</span>
                </div>
              </div>

              {/* Boîte de vitesse */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#D4AF37]">Boîte de vitesse</label>
                <select className="input" value={form.boite} onChange={(e) => set("boite", e.target.value)}>
                  <option value="manuelle">Manuelle</option>
                  <option value="automatique">Automatique</option>
                </select>
              </div>

              {/* État général */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#D4AF37]">État général</label>
                <div className="flex flex-wrap gap-2">
                  {ETATS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEtatGeneral(e)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        etatGeneral === e
                          ? "border-[#D4AF37] bg-[#D4AF37] text-white"
                          : "border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nom + Téléphone (optionnel) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-[#6B7280]">Votre nom (optionnel)</label>
                  <input className="input" placeholder="Votre nom" value={form.titre} onChange={(e) => set("titre", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[#6B7280]">Téléphone (optionnel)</label>
                  <input className="input" placeholder="+33 6 XX XX XX" value={form.contactTelephone} onChange={(e) => set("contactTelephone", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Bouton Obtenir estimation */}
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-[#111] px-4 py-4 text-base font-bold text-white hover:bg-[#333] disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={!form.marque || estimLoading}
              onClick={estimerPrix}
            >
              <TrendingUp size={20} />
              {estimLoading ? "Calcul en cours..." : "Obtenir mon estimation gratuite"}
            </button>

            {/* Résultat estimation — Analyse IA MKA.P-MS */}
            {estim && (
              <div className="mt-5 rounded-xl border-2 border-[#D4AF37] bg-[#FFFBEB] p-6 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37]"><span className="text-[8px] font-bold text-white">IA</span></div>
                  <p className="text-sm font-bold text-[#92400E]">Estimation IA MKA.P-MS</p>
                </div>
                <p className="mt-2 text-3xl font-extrabold text-[#D4AF37]">
                  {formatPrice(estim.low)} – {formatPrice(estim.high)}
                </p>
                <p className="mt-2 text-base text-[#111]">
                  Prix conseillé : <strong>{formatPrice(estim.mid)}</strong>
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">
                  {estim.method === "comparables"
                    ? `Basée sur ${estim.sampleSize} véhicules similaires en vente`
                    : "Analyse IA basée sur la cote du marché français, ajustée selon marque, modèle, année, km, état et carburant"}
                </p>
                <div className="mt-2 flex items-center justify-center gap-3 text-[9px] text-green-700">
                  <span>✓ Analyse IA</span>
                  <span>✓ Données marché</span>
                  <span>✓ Mise à jour en temps réel</span>
                </div>
                <button
                  type="button"
                  className="mt-4 rounded-lg bg-[#D4AF37] px-6 py-2 text-sm font-bold text-white hover:bg-[#C5A028]"
                  onClick={() => { set("prix", String(estim.mid)); setStep(2); }}
                >
                  Utiliser ce prix et continuer →
                </button>
              </div>
            )}

            {/* Bouton passer à l'étape 2 */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
              >
                {form.marque ? "Continuer sans estimation →" : "Saisir manuellement →"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 2 — DÉTAILS ═══ */}
        {step === 2 && (
          <div className="card mx-auto max-w-3xl p-6">
            <h2 className="mb-4 text-xl font-bold text-[#111]">Détails du véhicule</h2>
            {plateResult && (
              <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                Champs pré-remplis depuis votre plaque. Vérifiez et complétez si nécessaire.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Famille</label>
                <select className="input" value={form.famille} onChange={(e) => set("famille", e.target.value)}>
                  <option value="auto">Auto</option>
                  <option value="moto">Moto / Scooter</option>
                </select>
              </div>
              <div>
                <label className="label">Catégorie</label>
                <select className="input" value={form.categorie} onChange={(e) => set("categorie", e.target.value)}>
                  {["citadine", "berline", "break", "suv", "coupe", "cabriolet", "monospace", "utilitaire", "camion", "moto", "scooter", "quad", "luxe"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Marque *</label>
                <select className="input" value={form.marque} onChange={(e) => set("marque", e.target.value)}>
                  <option value="">Choisir</option>
                  {MARQUES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><label className="label">Modèle *</label><input className="input" value={form.modele} onChange={(e) => set("modele", e.target.value)} placeholder="Clio" /></div>
              <div><label className="label">Version</label><input className="input" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="RS Line" /></div>
              <div>
                <label className="label">Année</label>
                <select className="input" value={form.annee} onChange={(e) => set("annee", e.target.value)}>
                  {Array.from({ length: 30 }, (_, i) => 2025 - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div><label className="label">Kilométrage (km)</label><input className="input" type="number" value={form.kilometrage} onChange={(e) => set("kilometrage", e.target.value)} placeholder="50000" /></div>
              <div>
                <label className="label">Énergie</label>
                <select className="input" value={form.carburant} onChange={(e) => set("carburant", e.target.value)}>
                  {["essence", "diesel", "electrique", "hybride", "gpl"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Boîte de vitesse</label>
                <select className="input" value={form.boite} onChange={(e) => set("boite", e.target.value)}>
                  <option value="manuelle">Manuelle</option>
                  <option value="automatique">Automatique</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-[#D1D5DB] px-4 py-3 text-sm font-medium text-[#374151]">← Retour</button>
              <button type="button" onClick={() => setStep(3)} disabled={!canNext()} className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-50">Continuer →</button>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 3 — PHOTOS ═══ */}
        {step === 3 && (
          <div className="card mx-auto max-w-3xl p-6">
            <h2 className="mb-2 text-xl font-bold text-[#111]">Photos du véhicule</h2>
            <p className="mb-4 text-sm text-[#6B7280]">
              Ajoutez jusqu'à {maxPhotos} photos gratuites. Plus de photos = plus de visibilité.
            </p>
            <FileUpload
              label={`Ajouter des photos (${photos.length}/${maxPhotos})`}
              accept="image/*"
              multiple
              maxFiles={maxPhotos - photos.length}
              onUploaded={onFilesUploaded}
              iaAnalysis
            />
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p} alt="" className="aspect-square w-full rounded-xl object-cover border border-[#E5E7EB]" />
                    <button
                      onClick={() => setPhotos((arr) => arr.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white hover:bg-red-600"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            {photos.length >= maxPhotos && user.accountType !== "professionnel" && (
              <div className="mt-4 rounded-lg bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
                Limite atteinte ({maxPhotos} photos gratuites). Passez Pro pour plus de photos.
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-[#D1D5DB] px-4 py-3 text-sm font-medium text-[#374151]">← Retour</button>
              <button type="button" onClick={() => setStep(4)} className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white hover:bg-[#C5A028]">Continuer →</button>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 4 — DESCRIPTION & PRIX ═══ */}
        {step === 4 && (
          <div className="card mx-auto max-w-3xl p-6">
            <h2 className="mb-4 text-xl font-bold text-[#111]">Description & Prix</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Titre de l'annonce</label>
                <input className="input" value={form.titre} onChange={(e) => set("titre", e.target.value)} placeholder={`${form.marque} ${form.modele} ${form.version}`.trim() || "Mon véhicule"} />
                <p className="mt-1 text-xs text-[#9CA3AF]">Laissez vide pour un titre automatique</p>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-32" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Décrivez votre véhicule : état, équipements, historique d'entretien..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">{typeAnnonce === "location" ? "Prix / jour (€) *" : "Prix de vente (€) *"}</label>
                  <input className="input text-lg font-bold" type="number" value={form.prix} onChange={(e) => set("prix", e.target.value)} placeholder={typeAnnonce === "location" ? "45" : "12 500"} />
                </div>
                {estim && (
                  <div className="flex items-center justify-center rounded-lg bg-[#FFFBEB] p-3 text-center">
                    <div>
                      <p className="text-xs text-[#6B7280]">Prix estimé</p>
                      <p className="text-lg font-bold text-[#D4AF37]">{formatPrice(estim.mid)}</p>
                      <button type="button" className="text-xs text-[#D4AF37] font-medium" onClick={() => set("prix", String(estim.mid))}>Utiliser ce prix</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="rounded-lg border border-[#D1D5DB] px-4 py-3 text-sm font-medium text-[#374151]">← Retour</button>
              <button type="button" onClick={() => setStep(5)} disabled={!canNext()} className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-50">Continuer →</button>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 5 — CONTACT ═══ */}
        {step === 5 && (
          <div className="card mx-auto max-w-3xl p-6">
            <h2 className="mb-4 text-xl font-bold text-[#111]">Coordonnées</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Ville</label><input className="input" value={form.ville} onChange={(e) => set("ville", e.target.value)} placeholder="Paris" /></div>
              <div><label className="label">Code postal</label><input className="input" value={form.codePostal} onChange={(e) => set("codePostal", e.target.value)} placeholder="75001" /></div>
              <div className="sm:col-span-2"><label className="label">Téléphone de contact</label><input className="input" value={form.contactTelephone} onChange={(e) => set("contactTelephone", e.target.value)} placeholder="+33 6 12 34 56 78" /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(4)} className="rounded-lg border border-[#D1D5DB] px-4 py-3 text-sm font-medium text-[#374151]">← Retour</button>
              <button type="button" onClick={() => setStep(6)} className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white hover:bg-[#C5A028]">Continuer →</button>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 6 — PUBLICATION ═══ */}
        {step === 6 && (
          <div className="card mx-auto max-w-3xl p-6">
            <h2 className="mb-4 text-xl font-bold text-[#111]">Récapitulatif & Publication</h2>
            <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <span className="font-bold text-[#111] text-lg">{form.marque} {form.modele} {form.version}</span>
                <span className="text-xl font-extrabold text-[#D4AF37]">{form.prix ? `${Number(form.prix).toLocaleString()} €` : "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {form.annee && <p><span className="text-[#6B7280]">Année :</span> {form.annee}</p>}
                {form.kilometrage && <p><span className="text-[#6B7280]">Km :</span> {Number(form.kilometrage).toLocaleString()}</p>}
                {form.carburant && <p><span className="text-[#6B7280]">Énergie :</span> {form.carburant}</p>}
                {form.boite && <p><span className="text-[#6B7280]">Boîte :</span> {form.boite}</p>}
                {form.ville && <p><span className="text-[#6B7280]">Ville :</span> {form.ville}</p>}
                {form.contactTelephone && <p><span className="text-[#6B7280]">Tél :</span> {form.contactTelephone}</p>}
              </div>
              {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2">
                  {photos.map((p, i) => (
                    <img key={i} src={p} alt="" className="h-16 w-16 rounded-lg object-cover border border-[#E5E7EB]" />
                  ))}
                </div>
              )}
              {form.description && <p className="text-sm text-[#6B7280] pt-2">{form.description}</p>}
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(5)} className="rounded-lg border border-[#D1D5DB] px-4 py-3 text-sm font-medium text-[#374151]">← Retour</button>
              <button
                type="button"
                onClick={submit}
                disabled={create.isPending || !form.marque || !form.modele}
                className="flex-1 rounded-lg bg-[#111] px-4 py-3 text-sm font-bold text-white hover:bg-[#333] disabled:opacity-50"
              >
                {create.isPending ? "Publication en cours…" : "Publier l'annonce"}
              </button>
            </div>
            {create.error && <p className="mt-3 text-sm text-red-600">{create.error.message}</p>}
            <p className="mt-3 text-xs text-[#9CA3AF] text-center">
              Des options de mise en avant (Boost) seront proposées après la publication.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
