import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Sparkles, PenLine, Loader2, AlertTriangle, CheckCircle, X } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { isDirection } from "@shared/roles";
import MicroVocal from "../../components/MicroVocal";
import FileUpload from "../../components/FileUpload";

/* ══════════════════════════════════════════════════════════════════════════
   DÉPÔT RAPIDE — Véhicule sur commande (sections 2, 4, 5, demande PDG)
   RÈGLE ABSOLUE : le bouton « Manuel » ouvre directement le dépôt existant
   (/vendre — le même parcours « Publier » que tout le reste de la
   plateforme) — jamais un second formulaire. Le mode assisté par IA n'est
   qu'un outil d'aide (Vehicle Engine existant, LOT 2) : si l'analyse IA
   échoue ou n'est pas branchée, le reste de la préparation continue
   normalement — l'IA ne bloque jamais.
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
  // Même emplacement, même système que le reste de la plateforme (Vendre.tsx) :
  // FileUpload envoie réellement les fichiers au serveur et renvoie leur URL — jamais
  // un encodage base64 local distinct.
  const [documentsUrls, setDocumentsUrls] = useState<{ url: string; originalName: string }[]>([]);
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

  function lancerAssistant() {
    if (!supplierProfileId || !supplierVehicleId) { alert("Fournisseur et identifiant véhicule fournisseur requis."); return; }
    const rawData: Record<string, unknown> = {
      ...(marque.trim() ? { marque: marque.trim() } : {}),
      ...(modele.trim() ? { modele: modele.trim() } : {}),
      ...(annee.trim() ? { annee: annee.trim() } : {}),
      ...(prixFournisseurSaisi.trim() ? { prixFournisseur: prixFournisseurSaisi.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(documentsUrls.length ? { documents: documentsUrls } : {}),
    };
    assistant.mutate({ supplierProfileId: Number(supplierProfileId), supplierVehicleId, ingestMethod, rawData });
  }

  // Le dépôt manuel doit ouvrir directement l'étape 1 du parcours
  // existant, même si le fournisseur sera renseigné plus tard.
  const manuelUrl = `/vendre?depot=1&vehiculeSurCommande=1${supplierProfileId.trim() ? `&supplierProfileId=${encodeURIComponent(supplierProfileId.trim())}` : ""}`;

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
          <p className="mt-1 text-xs text-[#6B7280]">Ouvre directement le dépôt d'annonce déjà existant sur la plateforme — aucun second formulaire. Le fournisseur est requis pour conserver le contexte « véhicule sur commande » et afficher uniquement ses étapes supplémentaires.</p>
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
            <FileUpload
              label={`Joindre photos, carte grise ou documents PDF (${documentsUrls.length})`}
              accept="image/*,application/pdf"
              multiple
              maxFiles={6}
              onUploaded={(files) => setDocumentsUrls((d) => [...d, ...files.map((f) => ({ url: f.url, originalName: f.originalName }))])}
            />
            {documentsUrls.length > 0 && (
              <ul className="space-y-1">
                {documentsUrls.map((doc) => (
                  <li key={doc.url} className="flex items-center justify-between gap-2 rounded-lg bg-[#F5F3EF] px-2.5 py-1.5 text-xs">
                    <span className="truncate text-[#374151]">{doc.originalName}</span>
                    <button type="button" onClick={() => setDocumentsUrls((d) => d.filter((x) => x.url !== doc.url))} aria-label={`Retirer ${doc.originalName}`} className="shrink-0 text-[#9CA3AF] hover:text-red-600"><X size={14} /></button>
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

              {prepResult?.prix && (() => {
                const p = prepResult.prix;
                const achat = Number(p.supplierPrice), conseille = Number(p.publicPrice);
                const margeNegociation = conseille * 0.05;
                const prixMinimum = p.minPriceContractual != null ? Number(p.minPriceContractual) : Math.max(achat, conseille - margeNegociation);
                const benefice = conseille - achat;
                return (
                  <div className="rounded-lg bg-[#F5F3EF] p-3 space-y-1.5 text-xs">
                    <p className="font-bold text-[#111]">Estimation — avant publication (Vehicle Pricing Engine)</p>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Prix d'achat fournisseur</span><span className="font-bold text-[#111]">{achat.toLocaleString("fr-FR")} {p.supplierCurrency}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Prix conseillé de vente</span><span className="font-bold text-[#D4AF37]">{conseille.toLocaleString("fr-FR")} {p.publicCurrency}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Petite marge de négociation (5%)</span><span className="font-bold text-[#111]">{margeNegociation.toLocaleString("fr-FR")} {p.publicCurrency}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Prix minimum conseillé</span><span className="font-bold text-[#111]">{prixMinimum.toLocaleString("fr-FR")} {p.publicCurrency}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Bénéfice estimé</span><span className="font-bold text-green-600">{benefice.toLocaleString("fr-FR")} {p.publicCurrency}</span></div>
                  </div>
                );
              })()}
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
