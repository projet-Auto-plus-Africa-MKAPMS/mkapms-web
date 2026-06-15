import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Wrench, ShoppingCart, MapPin, Calendar, Bell, ChevronRight, Check, Star, Clock, Building2, Phone, Mail, Minus, Plus } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const STEPS = [
  "Véhicule",
  "Catalogue pièces",
  "Panier",
  "Fournisseur",
  "Garage",
  "Calendrier",
  "Récapitulatif",
  "Suivi",
];

// Catalogue complet organisé par catégorie
const CATEGORIES_PIECES = [
  {
    categorie: "Freinage",
    pieces: [
      { ref: "PLQ-AV-01", nom: "Plaquettes de frein avant", prix: 35 },
      { ref: "PLQ-AR-01", nom: "Plaquettes de frein arrière", prix: 30 },
      { ref: "DSQ-AV-01", nom: "Disques de frein avant (x2)", prix: 65 },
      { ref: "DSQ-AR-01", nom: "Disques de frein arrière (x2)", prix: 55 },
      { ref: "FLX-FR-01", nom: "Flexible de frein", prix: 18 },
      { ref: "ETR-FR-01", nom: "Étrier de frein", prix: 95 },
      { ref: "LIQ-FR-01", nom: "Liquide de frein DOT4 (1L)", prix: 12 },
    ],
  },
  {
    categorie: "Moteur",
    pieces: [
      { ref: "FLT-HUI-01", nom: "Filtre à huile", prix: 12 },
      { ref: "FLT-AIR-01", nom: "Filtre à air", prix: 18 },
      { ref: "BUG-AV-01", nom: "Bougie d'allumage (x4)", prix: 28 },
      { ref: "HUI-5W30", nom: "Huile moteur 5W30 (5L)", prix: 35 },
      { ref: "HUI-5W40", nom: "Huile moteur 5W40 (5L)", prix: 32 },
      { ref: "CRO-DST-01", nom: "Kit courroie de distribution", prix: 180 },
      { ref: "CRO-ACC-01", nom: "Courroie d'accessoires", prix: 25 },
      { ref: "JNT-CUL-01", nom: "Joint de culasse", prix: 85 },
      { ref: "PMP-EAU-01", nom: "Pompe à eau", prix: 65 },
      { ref: "THR-01", nom: "Thermostat", prix: 22 },
      { ref: "VAN-EGR-01", nom: "Vanne EGR", prix: 200 },
      { ref: "TRB-01", nom: "Turbo (échange standard)", prix: 650 },
      { ref: "INJ-01", nom: "Injecteur (x1)", prix: 120 },
    ],
  },
  {
    categorie: "Suspension & Direction",
    pieces: [
      { ref: "AMO-AV-01", nom: "Amortisseur avant", prix: 75 },
      { ref: "AMO-AR-01", nom: "Amortisseur arrière", prix: 65 },
      { ref: "RST-AV-01", nom: "Ressort de suspension avant", prix: 45 },
      { ref: "BLF-AV-01", nom: "Biellette de direction", prix: 28 },
      { ref: "RTL-01", nom: "Rotule de direction", prix: 32 },
      { ref: "SLB-01", nom: "Silent bloc bras de suspension", prix: 18 },
      { ref: "CRM-DIR-01", nom: "Crémaillère de direction", prix: 280 },
    ],
  },
  {
    categorie: "Embrayage & Transmission",
    pieces: [
      { ref: "EMB-KIT", nom: "Kit embrayage complet", prix: 250 },
      { ref: "VOL-MOT-01", nom: "Volant moteur bimasse", prix: 350 },
      { ref: "CRD-01", nom: "Cardan (transmission)", prix: 120 },
      { ref: "SFT-01", nom: "Soufflet de cardan", prix: 22 },
    ],
  },
  {
    categorie: "Électricité & Batterie",
    pieces: [
      { ref: "BAT-01", nom: "Batterie 12V 60Ah", prix: 95 },
      { ref: "BAT-02", nom: "Batterie 12V 70Ah", prix: 110 },
      { ref: "ALT-01", nom: "Alternateur", prix: 180 },
      { ref: "DEM-01", nom: "Démarreur", prix: 150 },
      { ref: "LAM-H7", nom: "Lampe H7 (x2)", prix: 18 },
      { ref: "LAM-H4", nom: "Lampe H4 (x2)", prix: 16 },
      { ref: "LAM-LED", nom: "Ampoule LED position (x2)", prix: 12 },
      { ref: "FUS-KIT", nom: "Kit fusibles complet", prix: 8 },
    ],
  },
  {
    categorie: "Échappement & Antipollution",
    pieces: [
      { ref: "POT-ECH", nom: "Pot d'échappement", prix: 110 },
      { ref: "CAT-01", nom: "Catalyseur", prix: 280 },
      { ref: "FAP-01", nom: "Filtre à particules (FAP)", prix: 450 },
      { ref: "SND-LMB-01", nom: "Sonde lambda", prix: 55 },
    ],
  },
  {
    categorie: "Climatisation",
    pieces: [
      { ref: "FLT-HAB-01", nom: "Filtre habitacle", prix: 15 },
      { ref: "CMP-CLM-01", nom: "Compresseur de climatisation", prix: 320 },
      { ref: "GAZ-CLM-01", nom: "Recharge gaz clim R134a", prix: 45 },
      { ref: "CND-CLM-01", nom: "Condenseur de climatisation", prix: 150 },
    ],
  },
  {
    categorie: "Pneumatiques & Roues",
    pieces: [
      { ref: "PNU-ETE-01", nom: "Pneu été 205/55 R16", prix: 65 },
      { ref: "PNU-HIV-01", nom: "Pneu hiver 205/55 R16", prix: 75 },
      { ref: "PNU-4S-01", nom: "Pneu 4 saisons 205/55 R16", prix: 70 },
      { ref: "VLV-TPMS", nom: "Valve TPMS capteur pression", prix: 28 },
      { ref: "BLN-EQU", nom: "Équilibrage (x4 roues)", prix: 30 },
    ],
  },
  {
    categorie: "Carrosserie & Vitrage",
    pieces: [
      { ref: "ESS-GLACE", nom: "Essuie-glaces (x2)", prix: 22 },
      { ref: "RTR-EXT-01", nom: "Rétroviseur extérieur", prix: 65 },
      { ref: "PRB-AV-01", nom: "Pare-brise avant", prix: 280 },
      { ref: "PHR-AV-01", nom: "Phare avant complet", prix: 150 },
      { ref: "FEU-AR-01", nom: "Feu arrière complet", prix: 85 },
    ],
  },
  {
    categorie: "Refroidissement",
    pieces: [
      { ref: "RAD-01", nom: "Radiateur de refroidissement", prix: 120 },
      { ref: "VNT-RAD-01", nom: "Ventilateur de radiateur", prix: 85 },
      { ref: "DUR-RAD-01", nom: "Durite de radiateur", prix: 18 },
      { ref: "LIQ-REF-01", nom: "Liquide de refroidissement (5L)", prix: 15 },
      { ref: "VAS-EXP-01", nom: "Vase d'expansion", prix: 25 },
    ],
  },
];

const ALL_PIECES = CATEGORIES_PIECES.flatMap((c) => c.pieces.map((p) => ({ ...p, categorie: c.categorie })));

const GARAGES = [
  { id: 1, nom: "Garage MKA.P-MS Centre", adresse: "12 Rue de la République, Paris", note: 4.8, avis: 124, tel: "01 42 00 00 01" },
  { id: 2, nom: "Auto Service Pro", adresse: "45 Avenue Jean Jaurès, Lyon", note: 4.6, avis: 87, tel: "04 78 00 00 02" },
  { id: 3, nom: "Garage du Pont Neuf", adresse: "8 Boulevard Carnot, Marseille", note: 4.5, avis: 65, tel: "04 91 00 00 03" },
  { id: 4, nom: "MécaPro Toulouse", adresse: "22 Route de Bayonne, Toulouse", note: 4.7, avis: 93, tel: "05 61 00 00 04" },
  { id: 5, nom: "Atelier Express", adresse: "3 Rue Sainte-Catherine, Bordeaux", note: 4.4, avis: 52, tel: "05 56 00 00 05" },
];

const CRENEAUX = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function Devis() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    vehiculeMarque: "", vehiculeModele: "", vehiculeAnnee: "", vehiculeEnergie: "",
    immatriculation: "", vin: "",
    typeIntervention: "", description: "",
    ville: "", codePostal: "",
    contactNom: "", contactEmail: "", contactTelephone: "",
    fournisseurPiece: "garage",
  });
  const [plateLoading, setPlateLoading] = useState(false);
  const [pieceSearch, setPieceSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [selectedPieces, setSelectedPieces] = useState<{ ref: string; nom: string; prix: number; qty: number; categorie: string }[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCreneau, setSelectedCreneau] = useState("");

  const create = trpc.devis.create.useMutation({ onSuccess: () => setStep(7) });
  const lookupPlate = trpc.annonces.lookupPlate.useMutation();

  function set<K extends keyof typeof f>(k: K, v: string) { setF((o) => ({ ...o, [k]: v })); }

  async function identifierVehicule() {
    const q = f.immatriculation.trim() || f.vin.trim();
    if (!q) return;
    setPlateLoading(true);
    try {
      const r = await lookupPlate.mutateAsync({ q });
      if (r) {
        if (r.marque) set("vehiculeMarque", r.marque);
        if (r.modele) set("vehiculeModele", r.modele);
        if (r.annee) set("vehiculeAnnee", String(r.annee));
      }
    } catch {} finally { setPlateLoading(false); }
  }

  const filteredPieces = ALL_PIECES.filter((p) => {
    const s = pieceSearch.toLowerCase();
    const matchSearch = !s || p.nom.toLowerCase().includes(s) || p.ref.toLowerCase().includes(s) || p.categorie.toLowerCase().includes(s);
    const matchCat = !catFilter || p.categorie === catFilter;
    return matchSearch && matchCat;
  });

  function addPiece(p: typeof ALL_PIECES[0]) {
    setSelectedPieces((prev) => {
      const existing = prev.find((x) => x.ref === p.ref);
      if (existing) return prev.map((x) => x.ref === p.ref ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...p, qty: 1 }];
    });
  }

  function updateQty(ref: string, delta: number) {
    setSelectedPieces((prev) => prev.map((x) => x.ref === ref ? { ...x, qty: Math.max(1, x.qty + delta) } : x));
  }

  function removePiece(ref: string) {
    setSelectedPieces((prev) => prev.filter((x) => x.ref !== ref));
  }

  const totalPieces = selectedPieces.reduce((sum, p) => sum + p.prix * p.qty, 0);

  if (!user) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-slate-900">Connectez-vous pour demander un devis</h1>
          <Link to="/connexion" className="btn-primary mt-6 w-full">Se connecter</Link>
        </div>
      </div>
    );
  }

  function submit() {
    create.mutate({
      contactNom: f.contactNom || user!.name,
      contactEmail: f.contactEmail || user!.email,
      contactTelephone: f.contactTelephone || undefined,
      vehiculeMarque: f.vehiculeMarque || undefined,
      vehiculeModele: f.vehiculeModele || undefined,
      vehiculeAnnee: f.vehiculeAnnee ? Number(f.vehiculeAnnee) : undefined,
      immatriculation: f.immatriculation || undefined,
      typeIntervention: f.typeIntervention,
      description: f.description || undefined,
      ville: f.ville || undefined,
      codePostal: f.codePostal || undefined,
    });
  }

  // Dates disponibles (les 14 prochains jours ouvrés)
  const availableDates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 21 && availableDates.length < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) { // Pas dimanche
      availableDates.push(d.toISOString().split("T")[0]);
    }
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Réparer mon véhicule — Devis</h1>
      <p className="mt-1 text-sm text-slate-500">Parcours complet étape par étape</p>

      {/* Barre de progression */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition ${
              i === step ? "bg-[#D4AF37] text-white" :
              i < step ? "bg-[#D4AF37]/20 text-[#D4AF37]" :
              "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}>
              {i < step ? <Check size={10} /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={12} className="text-[#D1D5DB]" />}
          </div>
        ))}
      </div>

      <div className="card mt-6 max-w-3xl p-6">

        {/* ═══ ÉTAPE 0: IDENTIFICATION VÉHICULE ═══ */}
        {step === 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]">
              <Search size={20} className="text-[#D4AF37]" /> Identifiez votre véhicule
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">Entrez votre plaque ou VIN pour identifier automatiquement votre véhicule</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Plaque d'immatriculation</label>
                <input className="input text-sm" placeholder="AB-123-CD" value={f.immatriculation} onChange={(e) => set("immatriculation", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Numéro VIN</label>
                <input className="input text-sm" placeholder="VF1XXXXX..." value={f.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} maxLength={17} />
              </div>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={(!f.immatriculation.trim() && !f.vin.trim()) || plateLoading}
              onClick={identifierVehicule}
            >
              <Search size={16} />
              {plateLoading ? "Recherche en cours..." : "Rechercher et remplir automatiquement"}
            </button>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="label">Marque</label><input className="input" value={f.vehiculeMarque} onChange={(e) => set("vehiculeMarque", e.target.value)} /></div>
              <div><label className="label">Modèle</label><input className="input" value={f.vehiculeModele} onChange={(e) => set("vehiculeModele", e.target.value)} /></div>
              <div><label className="label">Année</label><input className="input" type="number" value={f.vehiculeAnnee} onChange={(e) => set("vehiculeAnnee", e.target.value)} /></div>
              <div>
                <label className="label">Type d'intervention *</label>
                <select className="input" value={f.typeIntervention} onChange={(e) => set("typeIntervention", e.target.value)}>
                  <option value="">Choisir…</option>
                  {["Révision / entretien", "Freinage", "Pneumatiques", "Distribution", "Climatisation", "Carrosserie", "Diagnostic électronique", "Vidange", "Embrayage", "Suspension", "Échappement", "Électricité", "Autre"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Description du problème</label>
              <textarea className="input min-h-20 text-sm" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Décrivez votre problème ou l'intervention souhaitée..." />
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 1: CATALOGUE PIÈCES COMPLET ═══ */}
        {step === 1 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]">
              <Wrench size={20} className="text-[#D4AF37]" /> Catalogue de pièces
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">Recherchez par nom, référence ou catégorie. {ALL_PIECES.length} pièces disponibles.</p>

            {/* Barre de recherche */}
            <div className="mt-4 relative">
              <Search size={16} className="absolute left-3 top-3 text-[#9CA3AF]" />
              <input
                className="input pl-9 text-sm"
                placeholder="Rechercher : plaquettes, PLQ-AV-01, filtre, turbo..."
                value={pieceSearch}
                onChange={(e) => setPieceSearch(e.target.value)}
              />
            </div>

            {/* Filtres par catégorie */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setCatFilter("")}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${!catFilter ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"}`}
              >
                Toutes
              </button>
              {CATEGORIES_PIECES.map((c) => (
                <button
                  key={c.categorie}
                  onClick={() => setCatFilter(c.categorie)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${catFilter === c.categorie ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"}`}
                >
                  {c.categorie} ({c.pieces.length})
                </button>
              ))}
            </div>

            {/* Liste des pièces */}
            <div className="mt-3 max-h-72 overflow-y-auto space-y-1 border border-[#E5E7EB] rounded-lg p-2">
              {filteredPieces.map((p) => (
                <button
                  key={p.ref}
                  type="button"
                  onClick={() => addPiece(p)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[#D4AF37]/10 transition"
                >
                  <div>
                    <span className="font-medium text-[#111]">{p.nom}</span>
                    <span className="ml-2 text-[9px] text-[#9CA3AF]">{p.ref}</span>
                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280]">{p.categorie}</span>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-[#D4AF37]">{p.prix} €</span>
                </button>
              ))}
              {filteredPieces.length === 0 && (
                <p className="py-6 text-center text-sm text-[#9CA3AF]">
                  Aucune pièce trouvée — le garage pourra la commander pour vous.
                </p>
              )}
            </div>

            <p className="mt-2 text-[10px] text-[#9CA3AF]">Cliquez sur une pièce pour l'ajouter au panier. Vous pouvez ajuster les quantités à l'étape suivante.</p>
          </div>
        )}

        {/* ═══ ÉTAPE 2: PANIER / SÉLECTION ═══ */}
        {step === 2 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]">
              <ShoppingCart size={20} className="text-[#D4AF37]" /> Votre panier
            </h3>

            {selectedPieces.length === 0 ? (
              <div className="mt-4 py-8 text-center">
                <p className="text-sm text-[#9CA3AF]">Aucune pièce sélectionnée.</p>
                <button className="btn-outline mt-3 text-sm" onClick={() => setStep(1)}>← Retour au catalogue</button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {selectedPieces.map((p) => (
                  <div key={p.ref} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111]">{p.nom}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{p.ref} · {p.categorie}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQty(p.ref, -1)} className="rounded-full border border-[#E5E7EB] p-1 hover:bg-[#F3F4F6]"><Minus size={12} /></button>
                      <span className="w-6 text-center text-sm font-bold">{p.qty}</span>
                      <button type="button" onClick={() => updateQty(p.ref, 1)} className="rounded-full border border-[#E5E7EB] p-1 hover:bg-[#F3F4F6]"><Plus size={12} /></button>
                    </div>
                    <span className="w-16 text-right text-sm font-bold text-[#D4AF37]">{p.prix * p.qty} €</span>
                    <button type="button" onClick={() => removePiece(p.ref)} className="text-red-400 hover:text-red-600 text-xs">×</button>
                  </div>
                ))}
                <div className="rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/30 p-3 flex justify-between items-center">
                  <span className="font-bold text-[#111]">Total pièces</span>
                  <span className="text-lg font-extrabold text-[#D4AF37]">{totalPieces} €</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ÉTAPE 3: QUI FOURNIT LES PIÈCES ═══ */}
        {step === 3 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]">
              <Wrench size={20} className="text-[#D4AF37]" /> Qui fournit les pièces ?
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">Choisissez si le garage fournit les pièces ou si vous les ramenez vous-même.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => set("fournisseurPiece", "garage")}
                className={`rounded-xl border-2 p-6 text-center transition ${
                  f.fournisseurPiece === "garage"
                    ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-md"
                    : "border-[#E5E7EB] hover:border-[#D4AF37]/50"
                }`}
              >
                <Wrench size={32} className="mx-auto text-[#D4AF37]" />
                <h4 className="mt-3 font-bold text-[#111]">Le garage fournit</h4>
                <p className="mt-1 text-xs text-[#6B7280]">Le garage commande et installe les pièces. Prix main-d'œuvre + pièces inclus.</p>
                {f.fournisseurPiece === "garage" && <Check size={20} className="mx-auto mt-3 text-[#D4AF37]" />}
              </button>
              <button
                type="button"
                onClick={() => set("fournisseurPiece", "client")}
                className={`rounded-xl border-2 p-6 text-center transition ${
                  f.fournisseurPiece === "client"
                    ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-md"
                    : "border-[#E5E7EB] hover:border-[#D4AF37]/50"
                }`}
              >
                <ShoppingCart size={32} className="mx-auto text-[#D4AF37]" />
                <h4 className="mt-3 font-bold text-[#111]">Je ramène la pièce</h4>
                <p className="mt-1 text-xs text-[#6B7280]">Vous achetez les pièces en boutique et les apportez au garage. Prix main-d'œuvre uniquement.</p>
                {f.fournisseurPiece === "client" && <Check size={20} className="mx-auto mt-3 text-[#D4AF37]" />}
              </button>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 4: CHOIX DU GARAGE ═══ */}
        {step === 4 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]">
              <Building2 size={20} className="text-[#D4AF37]" /> Choisissez votre garage
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">Sélectionnez le garage partenaire de votre choix.</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label flex items-center gap-1"><MapPin size={14} className="text-[#D4AF37]" /> Ville</label>
                <input className="input text-sm" value={f.ville} onChange={(e) => set("ville", e.target.value)} placeholder="Votre ville" />
              </div>
              <div>
                <label className="label">Code postal</label>
                <input className="input text-sm" value={f.codePostal} onChange={(e) => set("codePostal", e.target.value)} placeholder="75001" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {GARAGES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGarage(g.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition ${
                    selectedGarage === g.id
                      ? "border-[#D4AF37] bg-[#D4AF37]/5"
                      : "border-[#E5E7EB] hover:border-[#D4AF37]/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#111]">{g.nom}</h4>
                      <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5"><MapPin size={10} /> {g.adresse}</p>
                      <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5"><Phone size={10} /> {g.tel}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-[#D4AF37]" fill="#D4AF37" />
                        <span className="text-sm font-bold">{g.note}</span>
                      </div>
                      <p className="text-[10px] text-[#9CA3AF]">{g.avis} avis</p>
                    </div>
                  </div>
                  {selectedGarage === g.id && <Check size={16} className="text-[#D4AF37] mt-2" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 5: CALENDRIER ═══ */}
        {step === 5 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]">
              <Calendar size={20} className="text-[#D4AF37]" /> Choisissez une date et un créneau
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">
              Garage sélectionné : <b>{GARAGES.find((g) => g.id === selectedGarage)?.nom || "—"}</b>
            </p>

            <div className="mt-4">
              <label className="label">Date</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
                {availableDates.map((d) => {
                  const date = new Date(d);
                  const jour = date.toLocaleDateString("fr-FR", { weekday: "short" });
                  const num = date.getDate();
                  const mois = date.toLocaleDateString("fr-FR", { month: "short" });
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`rounded-lg border p-2 text-center transition ${
                        selectedDate === d ? "border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]" : "border-[#E5E7EB] hover:border-[#D4AF37]/50"
                      }`}
                    >
                      <p className="text-[10px] text-[#6B7280] capitalize">{jour}</p>
                      <p className="text-lg font-bold text-[#111]">{num}</p>
                      <p className="text-[10px] text-[#6B7280] capitalize">{mois}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="mt-4">
                <label className="label">Créneau horaire</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {CRENEAUX.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCreneau(c)}
                      className={`rounded-lg border p-2 text-center text-sm font-semibold transition ${
                        selectedCreneau === c ? "border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37] text-[#D4AF37]" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D4AF37]/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="label">Nom</label><input className="input text-sm" value={f.contactNom} onChange={(e) => set("contactNom", e.target.value)} placeholder={user.name} /></div>
              <div><label className="label">Téléphone</label><input className="input text-sm" value={f.contactTelephone} onChange={(e) => set("contactTelephone", e.target.value)} placeholder="+33 6 ..." /></div>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 6: RÉCAPITULATIF ═══ */}
        {step === 6 && (
          <div>
            <h3 className="text-lg font-bold text-[#111] mb-4">Récapitulatif de votre devis</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-[#F8F9FA] p-3">
                <p className="text-xs font-semibold text-[#D4AF37]">Véhicule</p>
                <p className="font-medium text-[#111]">{f.vehiculeMarque} {f.vehiculeModele} {f.vehiculeAnnee}</p>
                {f.immatriculation && <p className="text-xs text-[#6B7280]">Plaque : {f.immatriculation}</p>}
                <p className="text-xs text-[#6B7280]">Intervention : {f.typeIntervention}</p>
                {f.description && <p className="text-xs text-[#6B7280]">{f.description}</p>}
              </div>

              {selectedPieces.length > 0 && (
                <div className="rounded-lg bg-[#F8F9FA] p-3">
                  <p className="text-xs font-semibold text-[#D4AF37]">Pièces ({selectedPieces.length})</p>
                  {selectedPieces.map((p) => (
                    <p key={p.ref} className="text-[#111]">{p.nom} x{p.qty} — <b>{p.prix * p.qty} €</b></p>
                  ))}
                  <p className="mt-1 font-bold text-[#D4AF37]">Total pièces : {totalPieces} €</p>
                  <p className="text-[10px] text-[#6B7280]">
                    {f.fournisseurPiece === "garage" ? "→ Le garage fournit les pièces" : "→ Vous ramenez les pièces"}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-[#F8F9FA] p-3">
                <p className="text-xs font-semibold text-[#D4AF37]">Garage</p>
                <p className="font-medium text-[#111]">{GARAGES.find((g) => g.id === selectedGarage)?.nom || "—"}</p>
                <p className="text-xs text-[#6B7280]">{GARAGES.find((g) => g.id === selectedGarage)?.adresse || ""}</p>
              </div>

              <div className="rounded-lg bg-[#F8F9FA] p-3">
                <p className="text-xs font-semibold text-[#D4AF37]">Rendez-vous</p>
                <p className="font-medium text-[#111]">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—"}
                  {selectedCreneau && ` à ${selectedCreneau}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 7: SUIVI DES RÉPARATIONS ═══ */}
        {step === 7 && (
          <div className="py-4">
            <div className="text-center mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-[#111]">Devis envoyé !</h3>
              <p className="mt-2 text-sm text-[#6B7280]">Votre demande a été transmise au garage. Suivez l'avancement ici.</p>
            </div>

            {/* Suivi étape par étape */}
            <h4 className="text-sm font-bold text-[#111] flex items-center gap-2">
              <Bell size={16} className="text-[#D4AF37]" /> Suivi de la réparation
            </h4>
            <div className="mt-3 space-y-0">
              {[
                { label: "Devis envoyé", desc: "Votre demande est transmise au garage", done: true, date: "Maintenant" },
                { label: "Devis accepté par le garage", desc: "Le garage confirme la prise en charge", done: false, date: "En attente" },
                { label: "Réception du véhicule", desc: "Le garage réceptionne votre véhicule", done: false, date: "—" },
                { label: "Diagnostic", desc: "Le garagiste effectue le diagnostic complet", done: false, date: "—" },
                { label: "Réparation en cours", desc: "Les pièces sont montées et les travaux sont en cours", done: false, date: "—" },
                { label: "Contrôle qualité", desc: "Vérification finale avant restitution", done: false, date: "—" },
                { label: "Véhicule prêt", desc: "Votre véhicule est prêt à être récupéré", done: false, date: "—" },
              ].map((e, i) => (
                <div key={e.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs ${e.done ? "bg-green-500" : "bg-[#E5E7EB]"}`}>
                      {e.done ? <Check size={12} /> : <span className="text-[#9CA3AF]">{i + 1}</span>}
                    </div>
                    {i < 6 && <div className={`w-0.5 h-8 ${e.done ? "bg-green-300" : "bg-[#E5E7EB]"}`} />}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-medium ${e.done ? "text-green-700" : "text-[#111]"}`}>{e.label}</p>
                    <p className="text-[10px] text-[#6B7280]">{e.desc}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{e.date}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-800">
                <b>Notifications activées</b> — Vous recevrez une notification à chaque étape de la réparation : email + notification dans l'app.
              </p>
            </div>

            {f.fournisseurPiece === "client" && selectedPieces.length > 0 && (
              <Link to="/pieces" className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
                <ShoppingCart size={16} /> Acheter mes pièces en boutique →
              </Link>
            )}
            <Link to="/compte" className="btn-outline mt-2 w-full block text-center">Voir mes demandes</Link>
          </div>
        )}

        {/* Navigation */}
        {step < 7 && (
          <div className="mt-6 flex justify-between">
            <button className="btn-outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              ← Précédent
            </button>
            {step < 6 ? (
              <button
                className="btn-primary"
                disabled={step === 0 && !f.typeIntervention}
                onClick={() => setStep((s) => s + 1)}
              >
                Suivant →
              </button>
            ) : (
              <button className="btn-primary" disabled={create.isPending} onClick={submit}>
                {create.isPending ? "Envoi…" : "Valider le devis"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
