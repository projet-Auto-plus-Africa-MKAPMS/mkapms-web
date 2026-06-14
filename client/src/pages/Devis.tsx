import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Wrench, ShoppingCart, MapPin } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const STEPS = [
  "Véhicule",
  "Pièces",
  "Intervention",
  "Localisation",
  "Coordonnées",
  "Récapitulatif",
  "Confirmation",
];

const PIECES_CATALOGUE = [
  { ref: "PLQ-AV-01", nom: "Plaquettes de frein avant", prix: 35 },
  { ref: "PLQ-AR-01", nom: "Plaquettes de frein arrière", prix: 30 },
  { ref: "DSQ-AV-01", nom: "Disques de frein avant (x2)", prix: 65 },
  { ref: "DSQ-AR-01", nom: "Disques de frein arrière (x2)", prix: 55 },
  { ref: "FLT-HUI-01", nom: "Filtre à huile", prix: 12 },
  { ref: "FLT-AIR-01", nom: "Filtre à air", prix: 18 },
  { ref: "FLT-HAB-01", nom: "Filtre habitacle", prix: 15 },
  { ref: "BUG-AV-01", nom: "Bougie d'allumage (x4)", prix: 28 },
  { ref: "BAT-01", nom: "Batterie 12V 60Ah", prix: 95 },
  { ref: "CRO-DST-01", nom: "Kit courroie de distribution", prix: 180 },
  { ref: "AMO-AV-01", nom: "Amortisseur avant", prix: 75 },
  { ref: "AMO-AR-01", nom: "Amortisseur arrière", prix: 65 },
  { ref: "HUI-5W30", nom: "Huile moteur 5W30 (5L)", prix: 35 },
  { ref: "HUI-5W40", nom: "Huile moteur 5W40 (5L)", prix: 32 },
  { ref: "ESS-GLACE", nom: "Essuie-glaces (x2)", prix: 22 },
  { ref: "LAM-H7", nom: "Lampe H7 (x2)", prix: 18 },
  { ref: "PNU-ÉTÉ", nom: "Pneu été 205/55 R16", prix: 65 },
  { ref: "PNU-HIV", nom: "Pneu hiver 205/55 R16", prix: 75 },
  { ref: "EMB-KIT", nom: "Kit embrayage complet", prix: 250 },
  { ref: "RAD-01", nom: "Radiateur de refroidissement", prix: 120 },
  { ref: "ALT-01", nom: "Alternateur", prix: 180 },
  { ref: "DEM-01", nom: "Démarreur", prix: 150 },
  { ref: "POT-ECH", nom: "Pot d'échappement", prix: 110 },
  { ref: "CAT-01", nom: "Catalyseur", prix: 280 },
  { ref: "VAN-EAU", nom: "Vanne EGR", prix: 200 },
];

export default function Devis() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    vehiculeMarque: "",
    vehiculeModele: "",
    vehiculeAnnee: "",
    immatriculation: "",
    vin: "",
    typeIntervention: "",
    description: "",
    ville: "",
    codePostal: "",
    contactNom: "",
    contactEmail: "",
    contactTelephone: "",
    fournisseurPiece: "garage", // "garage" = garage fournit, "client" = client ramène
  });
  const [plateLoading, setPlateLoading] = useState(false);
  const [pieceSearch, setPieceSearch] = useState("");
  const [selectedPieces, setSelectedPieces] = useState<{ ref: string; nom: string; prix: number; qty: number }[]>([]);

  const create = trpc.devis.create.useMutation({ onSuccess: () => setStep(6) });
  const lookupPlate = trpc.annonces.lookupPlate.useMutation();

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((o) => ({ ...o, [k]: v }));
  }

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

  const filteredPieces = PIECES_CATALOGUE.filter((p) => {
    const s = pieceSearch.toLowerCase();
    return !s || p.nom.toLowerCase().includes(s) || p.ref.toLowerCase().includes(s);
  });

  function addPiece(p: typeof PIECES_CATALOGUE[0]) {
    setSelectedPieces((prev) => {
      const existing = prev.find((x) => x.ref === p.ref);
      if (existing) return prev.map((x) => x.ref === p.ref ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...p, qty: 1 }];
    });
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

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Demande de devis garage</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`badge ${i === step ? "bg-gold text-noir" : i < step ? "bg-gold-soft text-gold-dark" : "bg-slate-100 text-slate-400"}`}
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      <div className="card mt-6 max-w-2xl p-6">
        {/* Étape 0: Véhicule avec plaque/VIN */}
        {step === 0 && (
          <div>
            <h3 className="text-lg font-bold text-[#111] mb-4">Identifiez votre véhicule</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Plaque</label>
                <input className="input text-sm" placeholder="AB-123-CD" value={f.immatriculation} onChange={(e) => set("immatriculation", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">VIN</label>
                <input className="input text-sm" placeholder="VF1XXXXX..." value={f.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} maxLength={17} />
              </div>
            </div>
            <button
              type="button"
              className="mb-4 w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={(!f.immatriculation.trim() && !f.vin.trim()) || plateLoading}
              onClick={identifierVehicule}
            >
              <Search size={16} />
              {plateLoading ? "Recherche..." : "Rechercher et remplir automatiquement"}
            </button>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Marque</label><input className="input" value={f.vehiculeMarque} onChange={(e) => set("vehiculeMarque", e.target.value)} /></div>
              <div><label className="label">Modèle</label><input className="input" value={f.vehiculeModele} onChange={(e) => set("vehiculeModele", e.target.value)} /></div>
              <div><label className="label">Année</label><input className="input" type="number" value={f.vehiculeAnnee} onChange={(e) => set("vehiculeAnnee", e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* Étape 1: Catalogue pièces */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-bold text-[#111] mb-3">Sélectionnez vos pièces</h3>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-3 text-[#9CA3AF]" />
              <input
                className="input pl-9 text-sm"
                placeholder="Rechercher par nom, référence..."
                value={pieceSearch}
                onChange={(e) => setPieceSearch(e.target.value)}
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 border border-[#E5E7EB] rounded-lg p-2">
              {filteredPieces.map((p) => (
                <button
                  key={p.ref}
                  type="button"
                  onClick={() => addPiece(p)}
                  className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[#D4AF37]/10 transition"
                >
                  <div>
                    <span className="font-medium text-[#111]">{p.nom}</span>
                    <span className="ml-2 text-[10px] text-[#9CA3AF]">{p.ref}</span>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-[#D4AF37]">{p.prix} €</span>
                </button>
              ))}
              {filteredPieces.length === 0 && (
                <p className="py-4 text-center text-sm text-[#9CA3AF]">Aucune pièce trouvée — le garage pourra la commander.</p>
              )}
            </div>

            {selectedPieces.length > 0 && (
              <div className="mt-4 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3">
                <h4 className="text-sm font-bold text-[#111] flex items-center gap-1"><ShoppingCart size={14} /> Pièces sélectionnées</h4>
                {selectedPieces.map((p) => (
                  <div key={p.ref} className="mt-2 flex items-center justify-between text-sm">
                    <span>{p.nom} x{p.qty}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{p.prix * p.qty} €</span>
                      <button type="button" onClick={() => removePiece(p.ref)} className="text-red-500 text-xs hover:underline">×</button>
                    </div>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-[#D4AF37]/30 flex justify-between font-bold text-sm">
                  <span>Total pièces</span>
                  <span className="text-[#D4AF37]">{totalPieces} €</span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="label">Qui fournit les pièces ?</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => set("fournisseurPiece", "garage")}
                  className={`rounded-lg border p-3 text-center text-sm font-medium transition ${f.fournisseurPiece === "garage" ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-[#E5E7EB] text-[#6B7280]"}`}
                >
                  <Wrench size={18} className="mx-auto mb-1" />
                  Le garage fournit
                </button>
                <button
                  type="button"
                  onClick={() => set("fournisseurPiece", "client")}
                  className={`rounded-lg border p-3 text-center text-sm font-medium transition ${f.fournisseurPiece === "client" ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-[#E5E7EB] text-[#6B7280]"}`}
                >
                  <ShoppingCart size={18} className="mx-auto mb-1" />
                  Je ramène la pièce
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2: Intervention */}
        {step === 2 && (
          <div>
            <label className="label">Type d'intervention *</label>
            <select className="input" value={f.typeIntervention} onChange={(e) => set("typeIntervention", e.target.value)}>
              <option value="">Choisir…</option>
              {["Révision / entretien", "Freinage", "Pneumatiques", "Distribution", "Climatisation", "Carrosserie", "Diagnostic électronique", "Vidange", "Embrayage", "Suspension", "Échappement", "Électricité", "Autre"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="label mt-4">Décrivez le besoin</label>
            <textarea className="input min-h-32" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Décrivez votre problème ou l'intervention souhaitée..." />
          </div>
        )}

        {/* Étape 3: Localisation */}
        {step === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label flex items-center gap-1"><MapPin size={14} className="text-[#D4AF37]" /> Ville</label>
              <input className="input" value={f.ville} onChange={(e) => set("ville", e.target.value)} />
            </div>
            <div><label className="label">Code postal</label><input className="input" value={f.codePostal} onChange={(e) => set("codePostal", e.target.value)} /></div>
          </div>
        )}

        {/* Étape 4: Coordonnées */}
        {step === 4 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="label">Nom</label><input className="input" value={f.contactNom} onChange={(e) => set("contactNom", e.target.value)} placeholder={user.name} /></div>
            <div><label className="label">Email</label><input className="input" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder={user.email} /></div>
            <div><label className="label">Téléphone</label><input className="input" value={f.contactTelephone} onChange={(e) => set("contactTelephone", e.target.value)} /></div>
          </div>
        )}

        {/* Étape 5: Récapitulatif */}
        {step === 5 && (
          <div className="space-y-2 text-sm text-slate-600">
            <p><b>Véhicule :</b> {f.vehiculeMarque} {f.vehiculeModele} {f.vehiculeAnnee} {f.immatriculation && `(${f.immatriculation})`}</p>
            {selectedPieces.length > 0 && (
              <div>
                <b>Pièces :</b>
                <ul className="ml-4 mt-1 list-disc">
                  {selectedPieces.map((p) => <li key={p.ref}>{p.nom} x{p.qty} — {p.prix * p.qty} €</li>)}
                </ul>
                <p className="mt-1 font-bold">Total pièces : {totalPieces} €</p>
                <p className="text-xs text-[#9CA3AF]">
                  {f.fournisseurPiece === "garage" ? "→ Le garage fournit les pièces" : "→ Vous ramenez les pièces (redirection vers boutique)"}
                </p>
              </div>
            )}
            <p><b>Intervention :</b> {f.typeIntervention || "—"}</p>
            <p><b>Description :</b> {f.description || "—"}</p>
            <p><b>Localisation :</b> {f.ville} {f.codePostal}</p>
            <p className="text-xs text-[#9CA3AF]">Votre demande sera transmise aux garages partenaires de votre zone.</p>
          </div>
        )}

        {/* Étape 6: Confirmation */}
        {step === 6 && (
          <div className="py-8 text-center">
            <h2 className="text-xl font-extrabold text-gold-dark">Demande envoyée</h2>
            <p className="mt-2 text-sm text-slate-500">
              Les garages partenaires vont vous recontacter avec leurs offres.
            </p>
            {f.fournisseurPiece === "client" && selectedPieces.length > 0 && (
              <Link to="/pieces" className="btn-gold mt-4 inline-block">
                Acheter mes pièces en boutique →
              </Link>
            )}
            <Link to="/compte" className="btn-primary mt-4 block">Voir mes demandes</Link>
          </div>
        )}

        {step < 6 && (
          <div className="mt-6 flex justify-between">
            <button className="btn-outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              ← Précédent
            </button>
            {step < 5 ? (
              <button
                className="btn-primary"
                disabled={step === 2 && !f.typeIntervention}
                onClick={() => setStep((s) => s + 1)}
              >
                Suivant →
              </button>
            ) : (
              <button className="btn-primary" disabled={create.isPending} onClick={submit}>
                {create.isPending ? "Envoi…" : "Envoyer la demande"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
