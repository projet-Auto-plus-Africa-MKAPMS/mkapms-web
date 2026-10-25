import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Plus, ChevronDown, ChevronUp, CheckCircle, ShieldCheck, FileSignature, Plug, Power, PauseCircle, PlayCircle, XCircle, UserPlus, Undo2 } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { isDirection } from "@shared/roles";

/**
 * Direction/Admin — Gestion des fournisseurs (Plan Maître Fournisseurs LOT 1).
 *
 * Le Supplier Engine (création, onboarding, Connector Engine, cycle de vie)
 * existe depuis longtemps côté serveur, entièrement testé — mais n'avait
 * AUCUN écran pour l'utiliser : impossible de créer un fournisseur sans
 * écrire du code. Cet écran est ce consommateur manquant, rien de plus —
 * aucune logique métier nouvelle, uniquement les mutations/queries déjà
 * exposées par `supplierEngine` et `partners`.
 *
 * Un profil fournisseur s'appuie sur un partenaire déjà créé (carnet
 * d'adresses, Partie 15) de type fournisseur_vehicules / fournisseur_pieces /
 * transporteur — on peut en choisir un existant ou en créer un ici.
 */

const SUPPLIER_TYPE_LABEL: Record<string, string> = {
  vehicules: "Véhicules (automobile)",
  pieces: "Pièces détachées",
  transport: "Transport",
  multi: "Multi (véhicules + pièces)",
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "bg-slate-500" },
  en_verification: { label: "En vérification", color: "bg-amber-500" },
  valide_direction: { label: "Validé Direction", color: "bg-blue-500" },
  contrat_signe: { label: "Contrat signé", color: "bg-indigo-500" },
  test_connexion: { label: "Test connexion", color: "bg-purple-500" },
  actif: { label: "Actif", color: "bg-green-600" },
  suspendu: { label: "Suspendu", color: "bg-orange-600" },
  desactive: { label: "Désactivé", color: "bg-red-700" },
};

const PARTNER_SUPPLIER_TYPES = ["fournisseur_vehicules", "fournisseur_pieces", "transporteur"];

export default function GestionFournisseurs() {
  const { user } = useAuth();
  const direction = isDirection(user?.role);
  const utils = trpc.useUtils();

  const fournisseurs = trpc.supplierEngine.liste.useQuery();
  const partenaires = trpc.partners.list.useQuery();

  const [formOuvert, setFormOuvert] = useState(false);
  const [nouveauPartenaire, setNouveauPartenaire] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [partnerNom, setPartnerNom] = useState("");
  const [partnerType, setPartnerType] = useState("fournisseur_vehicules");
  const [partnerPays, setPartnerPays] = useState("FR");
  const [supplierType, setSupplierType] = useState("vehicules");
  const [companyLegalName, setCompanyLegalName] = useState("");
  const [countryCode, setCountryCode] = useState("FR");
  const [currency, setCurrency] = useState("");
  const [paymentTermsDays, setPaymentTermsDays] = useState("30");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [commercialTerms, setCommercialTerms] = useState("");

  const countries = trpc.country.list.useQuery({ activeOnly: true });

  const createPartner = trpc.partners.create.useMutation();
  const createFournisseur = trpc.supplierEngine.creer.useMutation({
    onSuccess: () => {
      utils.supplierEngine.liste.invalidate();
      setFormOuvert(false);
      setPartnerId("");
      setPartnerNom("");
      setCompanyLegalName("");
      setRegistrationNumber("");
      setVatNumber("");
      setCommercialTerms("");
    },
  });

  async function soumettre() {
    let id = Number(partnerId);
    if (nouveauPartenaire) {
      if (!partnerNom.trim()) { alert("Nom du partenaire requis."); return; }
      const p = await createPartner.mutateAsync({ name: partnerNom.trim(), type: partnerType as any, country: partnerPays || undefined });
      id = p.id;
      utils.partners.list.invalidate();
    }
    if (!id || Number.isNaN(id)) { alert("Choisissez ou créez un partenaire d'abord."); return; }
    if (!companyLegalName.trim()) { alert("Nom légal de l'entreprise requis."); return; }
    createFournisseur.mutate({
      partnerId: id,
      supplierType: supplierType as any,
      companyLegalName: companyLegalName.trim(),
      countryCode,
      currency: currency || undefined,
      paymentTermsDays: paymentTermsDays ? Number(paymentTermsDays) : undefined,
      registrationNumber: registrationNumber.trim() || undefined,
      vatNumber: vatNumber.trim() || undefined,
      commercialTerms: commercialTerms.trim() || undefined,
    });
  }

  const partenairesCompatibles = (partenaires.data ?? []).filter((p: any) => PARTNER_SUPPLIER_TYPES.includes(p.type));

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-24">
      <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-purple-400" /> Fournisseurs</h1>
        <p className="mt-1 text-xs text-white/40">Créer, vérifier et activer les fournisseurs utilisables dans le dépôt manuel et le portail « Véhicule sur commande ».</p>
      </div>

      <div className="px-4 mt-5">
        <button
          onClick={() => setFormOuvert(!formOuvert)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-[#111]"
        >
          <Plus size={16} /> Ajouter un fournisseur
        </button>
      </div>

      {formOuvert && (
        <div className="mx-4 mt-3 rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-2">Partenaire (carnet d'adresses)</p>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setNouveauPartenaire(false)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${!nouveauPartenaire ? "bg-[#D4AF37] text-[#111]" : "bg-white/10 text-white/60"}`}>Partenaire existant</button>
              <button onClick={() => setNouveauPartenaire(true)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${nouveauPartenaire ? "bg-[#D4AF37] text-[#111]" : "bg-white/10 text-white/60"}`}>Nouveau partenaire</button>
            </div>
            {!nouveauPartenaire ? (
              <select className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white" value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                <option value="" className="text-black">Choisir un partenaire…</option>
                {partenairesCompatibles.map((p: any) => (
                  <option key={p.id} value={p.id} className="text-black">{p.name} ({p.type})</option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input className="col-span-2 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30" placeholder="Nom du partenaire" value={partnerNom} onChange={(e) => setPartnerNom(e.target.value)} />
                <select className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white" value={partnerType} onChange={(e) => setPartnerType(e.target.value)}>
                  <option value="fournisseur_vehicules" className="text-black">Fournisseur véhicules</option>
                  <option value="fournisseur_pieces" className="text-black">Fournisseur pièces</option>
                  <option value="transporteur" className="text-black">Transporteur</option>
                </select>
                <input className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30" placeholder="Pays (FR)" value={partnerPays} onChange={(e) => setPartnerPays(e.target.value.toUpperCase())} maxLength={2} />
              </div>
            )}
            {partenairesCompatibles.length === 0 && !nouveauPartenaire && (
              <p className="text-[10px] text-white/40 mt-1">Aucun partenaire fournisseur/transporteur pour l'instant — créez-en un ci-dessus.</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-2">Profil fournisseur</p>
            <div className="grid grid-cols-2 gap-2">
              <select className="col-span-2 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white" value={supplierType} onChange={(e) => setSupplierType(e.target.value)}>
                {Object.entries(SUPPLIER_TYPE_LABEL).map(([k, l]) => <option key={k} value={k} className="text-black">{l}</option>)}
              </select>
              <input className="col-span-2 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30" placeholder="Nom légal de l'entreprise *" value={companyLegalName} onChange={(e) => setCompanyLegalName(e.target.value)} />
              <select className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                {(countries.data ?? []).map((c: any) => <option key={c.code} value={c.code} className="text-black">{c.nameFr ?? c.code}</option>)}
                {(countries.data ?? []).length === 0 && <option value="FR" className="text-black">France (FR)</option>}
              </select>
              <input className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30" placeholder="Devise (ex: EUR)" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={8} />
              <input className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30" placeholder="Délai de paiement (jours)" inputMode="numeric" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} />
              <input className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30" placeholder="N° immatriculation (facultatif)" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
              <input className="col-span-2 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30" placeholder="N° TVA (facultatif)" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
              <textarea className="col-span-2 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-white/30" rows={2} placeholder="Conditions commerciales (facultatif)" value={commercialTerms} onChange={(e) => setCommercialTerms(e.target.value)} />
            </div>
          </div>

          {createFournisseur.error && <p className="text-xs text-red-400">{createFournisseur.error.message}</p>}
          {createPartner.error && <p className="text-xs text-red-400">{createPartner.error.message}</p>}

          <button
            onClick={soumettre}
            disabled={createFournisseur.isPending || createPartner.isPending}
            className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {createFournisseur.isPending || createPartner.isPending ? "Création…" : "Créer le fournisseur"}
          </button>
        </div>
      )}

      <div className="px-4 mt-5 space-y-3">
        {fournisseurs.isLoading && <p className="text-sm text-white/40">Chargement…</p>}
        {fournisseurs.data?.length === 0 && <p className="text-sm text-white/40">Aucun fournisseur enregistré pour l'instant.</p>}
        {fournisseurs.data?.map((f: any) => (
          <FournisseurCard key={f.id} fournisseur={f} direction={direction} />
        ))}
      </div>
    </div>
  );
}

function FournisseurCard({ fournisseur, direction }: { fournisseur: any; direction: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const utils = trpc.useUtils();
  const s = STATUS_LABEL[fournisseur.status] ?? { label: fournisseur.status, color: "bg-slate-500" };

  const [methode, setMethode] = useState("manuel");
  const [contratId, setContratId] = useState("");
  const [contactNom, setContactNom] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactTel, setContactTel] = useState("");

  const invalidate = () => utils.supplierEngine.liste.invalidate();
  const verifier = trpc.supplierEngine.verifierEntreprise.useMutation({ onSuccess: invalidate });
  const validerDirection = trpc.supplierEngine.validerParDirection.useMutation({ onSuccess: invalidate });
  const enregistrerContrat = trpc.supplierEngine.enregistrerContratSigne.useMutation({ onSuccess: invalidate });
  const enregistrerConnexion = trpc.supplierEngine.enregistrerConnexion.useMutation({ onSuccess: invalidate });
  const activer = trpc.supplierEngine.activer.useMutation({ onSuccess: invalidate });
  const suspendre = trpc.supplierEngine.suspendre.useMutation({ onSuccess: invalidate });
  const reactiver = trpc.supplierEngine.reactiver.useMutation({ onSuccess: invalidate });
  const desactiver = trpc.supplierEngine.desactiver.useMutation({ onSuccess: invalidate });
  const ajouterContact = trpc.supplierEngine.ajouterContact.useMutation({
    onSuccess: () => { setContactNom(""); setContactEmail(""); setContactTel(""); },
  });

  const [returnAllowed, setReturnAllowed] = useState(!!fournisseur.returnAllowed);
  const [returnPremiumEnabled, setReturnPremiumEnabled] = useState(!!fournisseur.returnPremiumEnabled);
  const [returnDelayHours, setReturnDelayHours] = useState(fournisseur.returnDelayHours ? String(fournisseur.returnDelayHours) : "");
  const [returnFee, setReturnFee] = useState(fournisseur.returnFee ?? "");
  const [returnTransportResponsibility, setReturnTransportResponsibility] = useState(fournisseur.returnTransportResponsibility ?? "fournisseur");
  const [returnEligibilityConditions, setReturnEligibilityConditions] = useState(fournisseur.returnEligibilityConditions ?? "");
  const [returnRequiredVehicleCondition, setReturnRequiredVehicleCondition] = useState(fournisseur.returnRequiredVehicleCondition ?? "");
  const [returnRequiredDocuments, setReturnRequiredDocuments] = useState(fournisseur.returnRequiredDocuments ?? "");
  const [returnRefundPolicy, setReturnRefundPolicy] = useState(fournisseur.returnRefundPolicy ?? "");
  const definirPolitiqueRetour = trpc.supplierEngine.definirPolitiqueRetour.useMutation({ onSuccess: invalidate });

  const erreur = verifier.error || validerDirection.error || enregistrerContrat.error || enregistrerConnexion.error || activer.error || suspendre.error || reactiver.error || desactiver.error || ajouterContact.error;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <button onClick={() => setOuvert(!ouvert)} className="w-full p-4 flex items-center gap-3 text-left">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{fournisseur.companyLegalName}</p>
          <p className="text-[10px] text-white/40">{fournisseur.reference} · {SUPPLIER_TYPE_LABEL[fournisseur.supplierType] ?? fournisseur.supplierType} · {fournisseur.countryCode}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold text-white ${s.color}`}>{s.label}</span>
        {ouvert ? <ChevronUp size={16} className="text-white/40 shrink-0" /> : <ChevronDown size={16} className="text-white/40 shrink-0" />}
      </button>

      {ouvert && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          {erreur && <p className="text-xs text-red-400">{erreur.message}</p>}

          <div className="flex flex-wrap gap-2">
            <button onClick={() => verifier.mutate({ supplierProfileId: fournisseur.id, decision: "verifie" })} disabled={verifier.isPending || fournisseur.kybStatus === "verifie"} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
              <ShieldCheck size={13} /> {fournisseur.kybStatus === "verifie" ? "KYB vérifié" : "Vérifier l'entreprise (KYB)"}
            </button>
            {direction && (
              <button onClick={() => validerDirection.mutate({ supplierProfileId: fournisseur.id })} disabled={validerDirection.isPending || fournisseur.status !== "en_verification"} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                <CheckCircle size={13} /> Valider par la Direction
              </button>
            )}
          </div>

          {direction && (
            <div className="flex items-center gap-2">
              <input className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-xs text-white placeholder-white/30" placeholder="N° de contrat" inputMode="numeric" value={contratId} onChange={(e) => setContratId(e.target.value)} />
              <button onClick={() => contratId && enregistrerContrat.mutate({ supplierProfileId: fournisseur.id, contractTermsId: Number(contratId) })} disabled={enregistrerContrat.isPending || fournisseur.status !== "valide_direction" || !contratId} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white disabled:opacity-40 shrink-0">
                <FileSignature size={13} /> Contrat signé
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-xs text-white placeholder-white/30" placeholder="Méthode de connexion (ex: manuel)" value={methode} onChange={(e) => setMethode(e.target.value)} />
            <button onClick={() => methode.trim() && enregistrerConnexion.mutate({ supplierProfileId: fournisseur.id, method: methode.trim(), authType: "none" })} disabled={enregistrerConnexion.isPending || !methode.trim()} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white disabled:opacity-40 shrink-0">
              <Plug size={13} /> Enregistrer
            </button>
          </div>
          <p className="text-[10px] text-white/30">Aucune API n'est requise ici : « manuel » suffit pour autoriser l'activation. Le branchement d'un vrai connecteur se fait plus tard, sans tout recommencer.</p>

          {direction && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-white/10">
              {fournisseur.status !== "actif" && fournisseur.status !== "suspendu" && fournisseur.status !== "desactive" && (
                <button onClick={() => activer.mutate({ supplierProfileId: fournisseur.id })} disabled={activer.isPending} className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                  <Power size={13} /> Activer
                </button>
              )}
              {fournisseur.status === "actif" && (
                <button onClick={() => { const reason = prompt("Motif de la suspension ?"); if (reason) suspendre.mutate({ supplierProfileId: fournisseur.id, reason }); }} disabled={suspendre.isPending} className="flex items-center gap-1.5 rounded-lg bg-orange-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                  <PauseCircle size={13} /> Suspendre
                </button>
              )}
              {fournisseur.status === "suspendu" && (
                <button onClick={() => reactiver.mutate({ supplierProfileId: fournisseur.id })} disabled={reactiver.isPending} className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                  <PlayCircle size={13} /> Réactiver
                </button>
              )}
              {fournisseur.status !== "desactive" && (
                <button onClick={() => { if (confirm("Désactiver définitivement ce fournisseur ?")) desactiver.mutate({ supplierProfileId: fournisseur.id }); }} disabled={desactiver.isPending} className="flex items-center gap-1.5 rounded-lg bg-red-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                  <XCircle size={13} /> Désactiver
                </button>
              )}
            </div>
          )}
          {!direction && fournisseur.status !== "actif" && (
            <p className="text-[10px] text-white/30">La validation Direction, le contrat et l'activation finale sont réservés à la Direction.</p>
          )}

          <div className="pt-1 border-t border-white/10 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1"><UserPlus size={12} /> Ajouter un contact</p>
            <div className="grid grid-cols-3 gap-1.5">
              <input className="rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white placeholder-white/30" placeholder="Nom" value={contactNom} onChange={(e) => setContactNom(e.target.value)} />
              <input className="rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white placeholder-white/30" placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              <input className="rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white placeholder-white/30" placeholder="Téléphone" value={contactTel} onChange={(e) => setContactTel(e.target.value)} />
            </div>
            <button
              onClick={() => ajouterContact.mutate({ supplierProfileId: fournisseur.id, kind: "commercial", name: contactNom.trim() || undefined, email: contactEmail.trim() || undefined, phone: contactTel.trim() || undefined })}
              disabled={ajouterContact.isPending || (!contactNom.trim() && !contactEmail.trim() && !contactTel.trim())}
              className="w-full rounded-lg bg-white/10 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              Ajouter le contact
            </button>
          </div>

          <div className="pt-1 border-t border-white/10 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1"><Undo2 size={12} /> Politique de retour / refus</p>
            <label className="flex items-center gap-2 text-xs text-white/70">
              <input type="checkbox" checked={returnAllowed} onChange={(e) => setReturnAllowed(e.target.checked)} />
              Retour autorisé pour ce fournisseur
            </label>
            {returnAllowed && (
              <>
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={returnPremiumEnabled} onChange={(e) => setReturnPremiumEnabled(e.target.checked)} />
                  Retour « premium » (type garantie 24h) activé
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input className="rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white placeholder-white/30" placeholder="Délai (heures)" inputMode="numeric" value={returnDelayHours} onChange={(e) => setReturnDelayHours(e.target.value)} />
                  <input className="rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white placeholder-white/30" placeholder="Frais de retour" value={returnFee} onChange={(e) => setReturnFee(e.target.value)} />
                </div>
                <select className="w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white" value={returnTransportResponsibility} onChange={(e) => setReturnTransportResponsibility(e.target.value)}>
                  <option value="fournisseur">Transport retour à la charge du fournisseur</option>
                  <option value="mka_pms">Transport retour à la charge de MKA.P-MS</option>
                  <option value="client">Transport retour à la charge du client</option>
                </select>
                <textarea className="w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white placeholder-white/30" rows={2} placeholder="Conditions d'éligibilité (ex: kilométrage max, délai de signalement)" value={returnEligibilityConditions} onChange={(e) => setReturnEligibilityConditions(e.target.value)} />
                <textarea className="w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white placeholder-white/30" rows={2} placeholder="État du véhicule requis au retour" value={returnRequiredVehicleCondition} onChange={(e) => setReturnRequiredVehicleCondition(e.target.value)} />
                <textarea className="w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white placeholder-white/30" rows={2} placeholder="Documents requis pour le retour" value={returnRequiredDocuments} onChange={(e) => setReturnRequiredDocuments(e.target.value)} />
                <textarea className="w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs text-white placeholder-white/30" rows={2} placeholder="Politique de remboursement" value={returnRefundPolicy} onChange={(e) => setReturnRefundPolicy(e.target.value)} />
              </>
            )}
            <button
              onClick={() => definirPolitiqueRetour.mutate({
                supplierProfileId: fournisseur.id,
                returnAllowed,
                returnPremiumEnabled,
                returnDelayHours: returnDelayHours.trim() ? Number(returnDelayHours) : undefined,
                returnFee: returnFee.toString().trim() ? Number(returnFee) : undefined,
                returnTransportResponsibility: returnTransportResponsibility || undefined,
                returnEligibilityConditions: returnEligibilityConditions.trim() || undefined,
                returnRequiredVehicleCondition: returnRequiredVehicleCondition.trim() || undefined,
                returnRequiredDocuments: returnRequiredDocuments.trim() || undefined,
                returnRefundPolicy: returnRefundPolicy.trim() || undefined,
              })}
              disabled={definirPolitiqueRetour.isPending}
              className="w-full rounded-lg bg-white/10 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              Enregistrer la politique de retour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
