import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Sparkles, PenLine, Loader2, AlertTriangle, CheckCircle, Paperclip, X, FileText } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { isDirection } from "@shared/roles";
import MicroVocal from "../../components/MicroVocal";

// La requête entière passe par express.json({ limit: "50mb" }) (server/index.ts) : le
// base64 ajoute ~33 % à la taille d'origine, donc ces plafonds restent nettement en
// dessous pour laisser de la marge au reste du corps de la requête.
const TAILLE_MAX_DOCUMENT = 4 * 1024 * 1024;
const MAX_DOCUMENTS = 6;

interface DocumentJoint {
  nom: string;
  type: string;
  contenuBase64: string;
}

/* ══════════════════════════════════════════════════════════════════════════
   DÉPÔT RAPIDE — Véhicule sur commande (sections 2, 4, 5, demande PDG)
   RÈGLE ABSOLUE : le bouton « Manuel » ouvre directement le dépôt existant
   (/acheter/depot-annonce) — jamais un second formulaire. Le mode assisté
   par IA n'est qu'un outil d'aide (Vehicle Engine existant, LOT 2) : si
   l'analyse IA échoue ou n'est pas branchée, le reste de la préparation
   continue normalement — l'IA ne bloque jamais.
   ══════════════════════════════════════════════════════════════════════════ */

export default function DepotRapideVehiculeSurCommande() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const direction = isDirection(user?.role);

  const [supplierProfileId, setSupplierProfileId] = useState("");
  const [supplierVehicleId, setSupplierVehicleId] = useState("");
  const [ingestMethod, setIngestMethod] = useState("manuel");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [annee, setAnnee] = useState("");
  const [prixFournisseurSaisi, setPrixFournisseurSaisi] = useState("");
  const [description, setDescription] = useState("");
  const [documents, setDocuments] = useState<DocumentJoint[]>([]);
  const [erreurFichier, setErreurFichier] = useState("");
  const [assistantResult, setAssistantResult] = useState<any>(null);
  const [prix, setPrix] = useState({ supplierPrice: "", supplierCurrency: "EUR", commissionRatePct: "10", pickupCity: "", pickupCountryCode: "FR" });
  const [prepResult, setPrepResult] = useState<any>(null);

  const assistant = trpc.orderEngine.assistantDepot.useMutation({
    onSuccess: (r) => {
      setAssistantResult(r);
      if (prixFournisseurSaisi.trim()) setPrix((p) => ({ ...p, supplierPrice: p.supplierPrice || prixFournisseurSaisi.trim() }));
    },
  });
  const preparer = trpc.orderEngine.preparerPublicationAssistee.useMutation({ onSuccess: setPrepResult });
  const publier = trpc.orderEngine.publierVehiculeSurCommande.useMutation({ onSuccess: (r) => navigate(`/vehicule/${r.annonceId}`) });

  function ajouterDocuments(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    setErreurFichier("");
    const liste = Array.from(fichiers);
    if (documents.length + liste.length > MAX_DOCUMENTS) { setErreurFichier(`Maximum ${MAX_DOCUMENTS} fichiers.`); return; }
    for (const fichier of liste) {
      if (fichier.size > TAILLE_MAX_DOCUMENT) { setErreurFichier(`${fichier.name} dépasse 4 Mo.`); continue; }
      const lecteur = new FileReader();
      lecteur.onload = () => {
        const resultat = typeof lecteur.result === "string" ? lecteur.result : "";
        setDocuments((d) => [...d, { nom: fichier.name, type: fichier.type, contenuBase64: resultat.slice(resultat.indexOf(",") + 1) }]);
      };
      lecteur.onerror = () => setErreurFichier(`Lecture de ${fichier.name} impossible.`);
      lecteur.readAsDataURL(fichier);
    }
  }

  function retirerDocument(nom: string) {
    setDocuments((d) => d.filter((doc) => doc.nom !== nom));
  }

  function lancerAssistant() {
    if (!supplierProfileId || !supplierVehicleId) { alert("Fournisseur et identifiant véhicule fournisseur requis."); return; }
    const rawData: Record<string, unknown> = {
      ...(marque.trim() ? { marque: marque.trim() } : {}),
      ...(modele.trim() ? { modele: modele.trim() } : {}),
      ...(annee.trim() ? { annee: annee.trim() } : {}),
      ...(prixFournisseurSaisi.trim() ? { prixFournisseur: prixFournisseurSaisi.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(documents.length ? { documents } : {}),
    };
    assistant.mutate({ supplierProfileId: Number(supplierProfileId), supplierVehicleId, ingestMethod, rawData });
  }

  const manuelUrl = supplierProfileId
    ? `/acheter/depot-annonce?vehiculeSurCommande=1&supplierProfileId=${encodeURIComponent(supplierProfileId)}`
    : `/acheter/depot-annonce`;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-5">
        <Link to="/vehicule-sur-commande" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Véhicule sur commande</Link>
        <h1 className="text-xl font-black text-white">Déposer un véhicule sur commande</h1>
        <p className="mt-1 text-xs text-white/50">Plaque, carte grise, documents et photos — préparation en ~1 minute, validation humaine avant publication.</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Fournisseur</label>
          <input placeholder="ID fournisseur (Supplier Engine)" value={supplierProfileId} onChange={(e) => setSupplierProfileId(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
        </div>

        {/* ── Mode Manuel : ouvre directement le système existant ── */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#111]"><PenLine size={16} className="text-[#6B7280]" /> Manuel</h2>
          <p className="mt-1 text-xs text-[#6B7280]">Ouvre directement le dépôt d'annonce déjà existant sur la plateforme — aucun second formulaire. Le fournisseur ci-dessus est facultatif ; renseignez-le seulement si ce dépôt est lié à une commande fournisseur précise.</p>
          <Link to={manuelUrl} className="mt-3 block w-full rounded-lg border border-[#111] py-2.5 text-center text-sm font-bold text-[#111]">
            Continuer en manuel
          </Link>
        </div>

        {/* ── Mode assisté par IA : outil d'aide uniquement ── */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#111]"><Sparkles size={16} className="text-[#D4AF37]" /> Assisté par IA (outil d'aide)</h2>
          <p className="text-xs text-[#6B7280]">Décrivez le véhicule à l'oral ou à l'écrit, joignez les photos et documents reçus du fournisseur. Utilise le Vehicle Engine existant (ingestion, normalisation, détection de doublons, contrôle qualité). Exige une méthode de connexion déjà enregistrée pour ce fournisseur (Connector Engine) ; si l'analyse IA elle-même n'est pas disponible, la préparation continue normalement.</p>

          <input placeholder="Identifiant véhicule fournisseur" value={supplierVehicleId} onChange={(e) => setSupplierVehicleId(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
          <select value={ingestMethod} onChange={(e) => setIngestMethod(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
            <option value="manuel">Saisie manuelle</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="api_rest">API REST</option>
            <option value="import_programme">Import programmé</option>
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Marque" value={marque} onChange={(e) => setMarque(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <input placeholder="Modèle" value={modele} onChange={(e) => setModele(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <input placeholder="Année" inputMode="numeric" value={annee} onChange={(e) => setAnnee(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <input placeholder="Prix fournisseur" inputMode="decimal" value={prixFournisseurSaisi} onChange={(e) => setPrixFournisseurSaisi(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-2.5">
            <div className="flex items-start gap-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le véhicule, parlez ou collez le texte reçu du fournisseur…"
                rows={3}
                className="flex-1 resize-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
              />
              <MicroVocal titre="Dicter la description du véhicule" onTexte={(texte) => setDescription(texte)} className="mt-1" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#D4AF37]/50 bg-[#D4AF37]/5 py-2.5 text-xs font-bold text-[#111]">
              <Paperclip size={14} className="text-[#D4AF37]" /> Joindre photos, carte grise ou documents PDF
              <input type="file" multiple accept="image/*,application/pdf" hidden onChange={(e) => { ajouterDocuments(e.target.files); e.currentTarget.value = ""; }} />
            </label>
            {erreurFichier && <p role="alert" className="text-[11px] text-red-700">{erreurFichier}</p>}
            {documents.length > 0 && (
              <ul className="space-y-1">
                {documents.map((doc) => (
                  <li key={doc.nom} className="flex items-center justify-between gap-2 rounded-lg bg-[#F5F3EF] px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5 truncate text-[#374151]"><FileText size={12} className="shrink-0 text-[#6B7280]" /> {doc.nom}</span>
                    <button type="button" onClick={() => retirerDocument(doc.nom)} aria-label={`Retirer ${doc.nom}`} className="shrink-0 text-[#9CA3AF] hover:text-red-600"><X size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={lancerAssistant} disabled={assistant.isPending} className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] disabled:opacity-50">
            {assistant.isPending ? <Loader2 size={14} className="inline animate-spin mr-1" /> : null} Lancer l'assistant
          </button>

          {assistant.error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" /> {assistant.error.message}</div>
          )}

          {assistantResult && (
            <div className="rounded-lg bg-[#F5F3EF] p-3 space-y-1.5 text-xs">
              <p className="font-bold text-[#111]">Véhicule ingéré #{assistantResult.vehicleItemId}</p>
              <p className="text-[#374151]">
                Analyse IA : <span className="font-semibold">{assistantResult.ia.status === "NOT_CONNECTED" ? "non disponible actuellement" : assistantResult.ia.status}</span>
                {assistantResult.ia.status === "NOT_CONNECTED" && " — n'empêche pas la suite."}
              </p>
              {assistantResult.doublons?.length > 0 && <p className="text-amber-700">⚠ {assistantResult.doublons.length} doublon(s) potentiel(s) à trancher.</p>}
              {assistantResult.qualite?.resultat === "error" && <p className="text-red-700">⚠ Contrôle qualité en erreur — vérifier les données avant publication.</p>}

              <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5">
                <p className="font-bold text-[#111]">Prix et territoires</p>
                <input placeholder="Prix fournisseur" value={prix.supplierPrice} onChange={(e) => setPrix((p) => ({ ...p, supplierPrice: e.target.value }))} className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5" />
                <input placeholder="Commission % (ex: 10)" value={prix.commissionRatePct} onChange={(e) => setPrix((p) => ({ ...p, commissionRatePct: e.target.value }))} className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5" />
                <input placeholder="Ville d'enlèvement" value={prix.pickupCity} onChange={(e) => setPrix((p) => ({ ...p, pickupCity: e.target.value }))} className="w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5" />
                <button
                  onClick={() => preparer.mutate({ vehicleItemId: assistantResult.vehicleItemId, supplierPrice: Number(prix.supplierPrice), supplierCurrency: prix.supplierCurrency, commissionRatePct: Number(prix.commissionRatePct), pickupCity: prix.pickupCity || undefined, pickupCountryCode: prix.pickupCountryCode || undefined })}
                  disabled={preparer.isPending || !prix.supplierPrice}
                  className="w-full rounded-lg bg-[#111] py-2 text-xs font-bold text-[#D4AF37] disabled:opacity-50"
                >
                  Préparer la publication
                </button>
              </div>

              {prepResult && !prepResult.pret && (
                <div className="rounded-lg bg-amber-50 p-2 text-amber-800">
                  <p className="font-bold">Préparation incomplète :</p>
                  <ul className="list-disc ml-4">{prepResult.manques.map((m: string, i: number) => <li key={i}>{m}</li>)}</ul>
                </div>
              )}
              {prepResult?.pret && (
                direction ? (
                  <button onClick={() => publier.mutate({ vehicleItemId: assistantResult.vehicleItemId })} disabled={publier.isPending} className="w-full flex items-center justify-center gap-1 rounded-lg bg-green-600 py-2 text-xs font-bold text-white disabled:opacity-50">
                    <CheckCircle size={14} /> Valider et publier
                  </button>
                ) : (
                  <p className="rounded-lg bg-blue-50 p-2 text-blue-800">Prêt à publier — en attente de validation par la Direction.</p>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
