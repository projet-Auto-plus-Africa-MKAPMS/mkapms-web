import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, CheckCircle, X, Film, Image as ImageIcon } from "lucide-react";

const TYPES_ACTIVITE = [
  { value: "garage", label: "Garage / Réparation automobile" },
  { value: "pieces", label: "Vendeur de pièces détachées" },
  { value: "restaurant", label: "Restaurateur / Alimentation" },
  { value: "assurance", label: "Assurance / Financement" },
  { value: "livraison", label: "Livraison / Transport" },
  { value: "concession", label: "Concessionnaire / Vendeur auto" },
  { value: "lavage", label: "Lavage / Nettoyage auto" },
  { value: "autre", label: "Autre activité" },
];

const EMPLACEMENTS = [
  { value: "accueil-1", label: "Page d'accueil — Carrousel #1 (entre annonces)", prix: "50€/jour" },
  { value: "accueil-2", label: "Page d'accueil — Carrousel #2 (section premium)", prix: "80€/jour" },
  { value: "produit", label: "Page produit — Bas de page (carrousel)", prix: "30€/jour" },
  { value: "recherche", label: "Page recherche — Sidebar", prix: "40€/jour" },
  { value: "resultats", label: "Page résultats — Entre les annonces", prix: "35€/jour" },
];

const DUREES = [
  { value: "1h", label: "1 heure", multi: 1 },
  { value: "3h", label: "3 heures", multi: 3 },
  { value: "1j", label: "1 jour (24h)", multi: 10 },
  { value: "7j", label: "1 semaine", multi: 50 },
  { value: "30j", label: "1 mois", multi: 150 },
  { value: "90j", label: "3 mois", multi: 350 },
];

export default function DemandePublicite() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [societe, setSociete] = useState("");
  const [desc, setDesc] = useState("");
  const [emplacement, setEmplacement] = useState("");
  const [duree, setDuree] = useState("");
  const [lien, setLien] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [contentType, setContentType] = useState<"photo" | "video" | "lien">("photo");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Champs dynamiques selon le type
  const [sousType, setSousType] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-[#111]">Demande envoyée !</h1>
        <p className="text-sm text-slate-500">Votre demande de publicité a été soumise. Notre équipe va l'examiner et vous contacter sous 24h.</p>
        <Link to="/" className="mt-4 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-6">
      <Link to="/" className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-[#D4AF37]">
        <ArrowLeft size={16} /> Retour
      </Link>

      <h1 className="text-xl font-bold text-[#111]">Demande de publicité</h1>
      <p className="mt-1 text-sm text-slate-500">Remplissez le formulaire pour soumettre votre demande. Notre équipe l'examinera rapidement.</p>

      {/* Indicateur d'étapes */}
      <div className="mt-4 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= s ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-400"}`}>
              {s}
            </div>
            {s < 3 && <div className={`h-0.5 w-8 ${step > s ? "bg-[#D4AF37]" : "bg-slate-200"}`} />}
          </div>
        ))}
        <span className="ml-2 text-xs text-slate-400">
          {step === 1 ? "Votre activité" : step === 2 ? "Emplacement & durée" : "Contenu de la pub"}
        </span>
      </div>

      {/* ÉTAPE 1 — Type d'activité */}
      {step === 1 && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">Type d'activité *</label>
            <select value={type} onChange={(e) => { setType(e.target.value); setSousType(""); }} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm">
              <option value="">Sélectionnez votre activité</option>
              {TYPES_ACTIVITE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Champs dynamiques selon le type */}
          {type === "garage" && (
            <div>
              <label className="text-sm font-bold text-slate-700">Spécialité du garage</label>
              <select value={sousType} onChange={(e) => setSousType(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm">
                <option value="">Sélectionnez</option>
                <option value="mecanique">Mécanique générale</option>
                <option value="carrosserie">Carrosserie / Peinture</option>
                <option value="electrique">Électricité auto</option>
                <option value="diagnostic">Diagnostic / Contrôle technique</option>
                <option value="pneus">Pneumatiques</option>
              </select>
            </div>
          )}
          {type === "pieces" && (
            <div>
              <label className="text-sm font-bold text-slate-700">Genre de pièces</label>
              <select value={sousType} onChange={(e) => setSousType(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm">
                <option value="">Sélectionnez</option>
                <option value="neuves">Pièces neuves d'origine</option>
                <option value="occasion">Pièces d'occasion</option>
                <option value="accessoires">Accessoires & tuning</option>
                <option value="huiles">Huiles & lubrifiants</option>
                <option value="pneus">Pneus</option>
              </select>
            </div>
          )}
          {type === "restaurant" && (
            <div>
              <label className="text-sm font-bold text-slate-700">Type de restauration</label>
              <select value={sousType} onChange={(e) => setSousType(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm">
                <option value="">Sélectionnez</option>
                <option value="fast-food">Fast-food / Snack</option>
                <option value="traiteur">Traiteur / Événementiel</option>
                <option value="boulangerie">Boulangerie / Pâtisserie</option>
                <option value="superette">Supérette / Épicerie</option>
              </select>
            </div>
          )}
          {type === "autre" && (
            <div>
              <label className="text-sm font-bold text-slate-700">Précisez votre activité</label>
              <input value={sousType} onChange={(e) => setSousType(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Ex: École de conduite, Car wash..." />
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-slate-700">Nom de la société *</label>
            <input value={societe} onChange={(e) => setSociete(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Ex: Garage Saint-Denis" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-slate-700">Nom complet *</label>
              <input value={nom} onChange={(e) => setNom(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Prénom Nom" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Téléphone *</label>
              <input value={tel} onChange={(e) => setTel(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="06 XX XX XX XX" />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="contact@societe.fr" />
          </div>

          <button onClick={() => setStep(2)} disabled={!type || !societe || !nom} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-40">
            Suivant →
          </button>
        </div>
      )}

      {/* ÉTAPE 2 — Emplacement & Durée */}
      {step === 2 && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">Emplacement souhaité *</label>
            <div className="mt-2 space-y-2">
              {EMPLACEMENTS.map((e) => (
                <label key={e.value} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${emplacement === e.value ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="emplacement" value={e.value} checked={emplacement === e.value} onChange={(ev) => setEmplacement(ev.target.value)} className="accent-[#D4AF37]" />
                    <span className="text-sm text-slate-700">{e.label}</span>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37]">{e.prix}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700">Durée d'affichage *</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DUREES.map((d) => (
                <button key={d.value} type="button" onClick={() => setDuree(d.value)} className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${duree === d.value ? "border-[#D4AF37] bg-[#FFFDF5] text-[#B8960C]" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700">Description de votre annonce</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Décrivez ce que vous souhaitez mettre en avant..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600">← Retour</button>
            <button onClick={() => setStep(3)} disabled={!emplacement || !duree} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-40">Suivant →</button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 — Contenu */}
      {step === 3 && (
        <div className="mt-6 space-y-4">
          {/* Choix type de contenu */}
          <div>
            <label className="text-sm font-bold text-slate-700">Type de contenu publicitaire *</label>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { setContentType("photo"); setLien(""); }} className={`flex-1 rounded-xl border-2 p-3 text-center text-xs font-bold transition flex flex-col items-center gap-1 ${contentType === "photo" ? "border-[#D4AF37] bg-[#FFFDF5] text-[#B8960C]" : "border-slate-200 text-slate-500"}`}>
                <ImageIcon size={18} /> Image / Photo
              </button>
              <button type="button" onClick={() => { setContentType("video"); setLien(""); }} className={`flex-1 rounded-xl border-2 p-3 text-center text-xs font-bold transition flex flex-col items-center gap-1 ${contentType === "video" ? "border-[#D4AF37] bg-[#FFFDF5] text-[#B8960C]" : "border-slate-200 text-slate-500"}`}>
                <Film size={18} /> Vidéo
              </button>
              <button type="button" onClick={() => { setContentType("lien"); setLien("https://"); removeFile(); }} className={`flex-1 rounded-xl border-2 p-3 text-center text-xs font-bold transition flex flex-col items-center gap-1 ${contentType === "lien" ? "border-[#D4AF37] bg-[#FFFDF5] text-[#B8960C]" : "border-slate-200 text-slate-500"}`}>
                <Upload size={18} /> Lien du site
              </button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={contentType === "video" ? "video/mp4,video/webm,video/quicktime,video/*" : "image/jpeg,image/png,image/webp,image/gif,image/*"}
            onChange={handleFileChange}
          />

          {/* Si lien */}
          {contentType === "lien" && (
            <div>
              <label className="text-sm font-bold text-slate-700">Lien de votre site / page *</label>
              <input value={lien} onChange={(e) => setLien(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="https://www.votresite.fr" />
            </div>
          )}

          {/* Si photo ou vidéo */}
          {(contentType === "photo" || contentType === "video") && (
            <div>
              <label className="text-sm font-bold text-slate-700">
                {contentType === "video" ? "Vidéo publicitaire *" : "Image / Visuel de la publicité *"}
              </label>

              {/* Preview if file uploaded */}
              {uploadedFile && previewUrl ? (
                <div className="mt-1 relative rounded-xl border-2 border-[#D4AF37] bg-[#FFFDF5] overflow-hidden">
                  {contentType === "video" ? (
                    <video src={previewUrl} controls className="w-full h-48 object-cover rounded-xl" />
                  ) : (
                    <img src={previewUrl} alt="Aperçu" className="w-full h-48 object-cover rounded-xl" />
                  )}
                  <div className="p-2 flex items-center justify-between">
                    <p className="text-xs text-slate-600 truncate flex-1">{uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(1)} Mo)</p>
                    <button onClick={removeFile} className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100"><X size={12} /> Supprimer</button>
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/5 border-t border-[#D4AF37]/20">Changer le fichier</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex h-40 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#D4AF37]/50 bg-[#FFFDF5] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition"
                >
                  <div className="flex flex-col items-center gap-2 text-[#B8960C]">
                    {contentType === "video" ? <Film size={28} /> : <Upload size={28} />}
                    <span className="text-sm font-bold">Cliquez pour uploader {contentType === "video" ? "votre vidéo" : "votre visuel"}</span>
                    <span className="text-[10px] text-slate-400">
                      {contentType === "video" ? "MP4, WebM, MOV — max 50 Mo" : "JPG, PNG, WebP — max 5 Mo · Format recommandé : 600×400px"}
                    </span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Récapitulatif */}
          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#FFFDF5] p-4">
            <p className="text-sm font-bold text-[#111]">Récapitulatif</p>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>Société : <span className="font-bold">{societe}</span></p>
              <p>Type : <span className="font-bold">{TYPES_ACTIVITE.find((t) => t.value === type)?.label}</span></p>
              <p>Emplacement : <span className="font-bold">{EMPLACEMENTS.find((e) => e.value === emplacement)?.label}</span></p>
              <p>Durée : <span className="font-bold">{DUREES.find((d) => d.value === duree)?.label}</span></p>
              <p>Prix estimé : <span className="font-bold text-[#B8960C]">{EMPLACEMENTS.find((e) => e.value === emplacement)?.prix}</span></p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400">En soumettant cette demande, vous acceptez nos conditions générales. Les publicités liées à l'alcool, au tabac, aux armes ou à tout contenu illicite seront refusées.</p>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600">← Retour</button>
            <button onClick={handleSubmit} className="flex-1 rounded-xl bg-[#B8960C] py-3 text-sm font-bold text-white hover:bg-[#9a7d0a]">Envoyer la demande</button>
          </div>
        </div>
      )}
    </div>
  );
}
