import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Sparkles, PenLine, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { isDirection } from "@shared/roles";

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
  const [rawDataText, setRawDataText] = useState('{\n  "marque": "",\n  "modele": "",\n  "annee": "",\n  "prixFournisseur": ""\n}');
  const [assistantResult, setAssistantResult] = useState<any>(null);
  const [prix, setPrix] = useState({ supplierPrice: "", supplierCurrency: "EUR", commissionRatePct: "10", pickupCity: "", pickupCountryCode: "FR" });
  const [prepResult, setPrepResult] = useState<any>(null);

  const assistant = trpc.orderEngine.assistantDepot.useMutation({ onSuccess: setAssistantResult });
  const preparer = trpc.orderEngine.preparerPublicationAssistee.useMutation({ onSuccess: setPrepResult });
  const publier = trpc.orderEngine.publierVehiculeSurCommande.useMutation({ onSuccess: (r) => navigate(`/vehicule/${r.annonceId}`) });

  function lancerAssistant() {
    let rawData: Record<string, unknown>;
    try { rawData = JSON.parse(rawDataText); } catch { alert("Données brutes invalides (JSON attendu)."); return; }
    if (!supplierProfileId || !supplierVehicleId) { alert("Fournisseur et identifiant véhicule fournisseur requis."); return; }
    assistant.mutate({ supplierProfileId: Number(supplierProfileId), supplierVehicleId, ingestMethod, rawData });
  }

  const manuelUrl = supplierProfileId
    ? `/acheter/depot-annonce?vehiculeSurCommande=1&supplierProfileId=${encodeURIComponent(supplierProfileId)}`
    : null;

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
          <p className="mt-1 text-xs text-[#6B7280]">Ouvre directement le dépôt d'annonce déjà existant sur la plateforme — aucun second formulaire.</p>
          {manuelUrl ? (
            <Link to={manuelUrl} className="mt-3 block w-full rounded-lg border border-[#111] py-2.5 text-center text-sm font-bold text-[#111]">
              Continuer en manuel
            </Link>
          ) : (
            <p className="mt-3 text-[11px] text-[#9CA3AF]">Renseignez le fournisseur ci-dessus pour continuer en manuel.</p>
          )}
        </div>

        {/* ── Mode assisté par IA : outil d'aide uniquement ── */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#111]"><Sparkles size={16} className="text-[#D4AF37]" /> Assisté par IA (outil d'aide)</h2>
          <p className="text-xs text-[#6B7280]">Utilise le Vehicle Engine existant (ingestion, normalisation, détection de doublons, contrôle qualité). Si l'analyse IA n'est pas disponible, la préparation continue normalement.</p>

          <input placeholder="Identifiant véhicule fournisseur" value={supplierVehicleId} onChange={(e) => setSupplierVehicleId(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
          <select value={ingestMethod} onChange={(e) => setIngestMethod(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
            <option value="manuel">Saisie manuelle</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="api_rest">API REST</option>
            <option value="import_programme">Import programmé</option>
          </select>
          <textarea value={rawDataText} onChange={(e) => setRawDataText(e.target.value)} rows={5} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-mono" />
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
