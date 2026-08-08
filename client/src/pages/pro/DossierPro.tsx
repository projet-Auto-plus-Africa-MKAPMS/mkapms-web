/**
 * MKA.P-MS — Dossier professionnel (point 24).
 *
 * Étape légale entre la composition de l'offre et le paiement :
 * identité → entreprise → informations légales du pays et du métier →
 * coordonnées → justificatifs → conditions.
 *
 * Les champs et les justificatifs demandés viennent du serveur (règles
 * pays/métier). Rien n'est activé ici : l'activation dépend d'une
 * vérification humaine et d'un paiement réellement confirmé.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle, Check, ChevronLeft, FileText, Loader2, Lock, ShieldCheck,
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

type FormState = {
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  legalName: string;
  legalForm: string;
  registrationNumber: string;
  vatNumber: string;
  addressLine: string;
  city: string;
  postalCode: string;
  website: string;
};

const EMPTY: FormState = {
  contactFirstName: "", contactLastName: "", contactEmail: "", contactPhone: "",
  legalName: "", legalForm: "", registrationNumber: "", vatNumber: "",
  addressLine: "", city: "", postalCode: "", website: "",
};

/** Ordre d'affichage : identité, puis entreprise, puis coordonnées. */
const FIELD_ORDER: (keyof FormState)[] = [
  "contactFirstName", "contactLastName", "contactEmail", "contactPhone",
  "legalName", "legalForm", "registrationNumber", "vatNumber",
  "addressLine", "postalCode", "city", "website",
];

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  en_verification: "En cours de vérification",
  complement_requis: "Complément demandé",
  valide: "Dossier validé",
  refuse: "Dossier refusé",
  actif: "Compte professionnel actif",
};

const PAYMENT_LABELS: Record<string, string> = {
  non_requis: "Aucun paiement requis",
  en_attente: "Paiement non confirmé",
  confirme: "Paiement confirmé",
};

export default function DossierPro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();

  const mine = trpc.proAccount.mine.useQuery(undefined, { enabled: !!user });

  const professionCode = params.get("metier") ?? mine.data?.professionCode ?? "";
  const countryCode = (params.get("pays") ?? mine.data?.countryCode ?? "").toUpperCase();
  const moduleCodes = useMemo(() => {
    const raw = params.get("modules");
    if (raw) return raw.split(",").filter(Boolean);
    return mine.data?.moduleCodes ?? [];
  }, [params, mine.data]);

  const requirements = trpc.proAccount.requirements.useQuery(
    { professionCode, countryCode },
    { enabled: !!professionCode && countryCode.length === 2 },
  );
  const check = trpc.proAccount.check.useQuery(undefined, { enabled: !!user });
  const save = trpc.proAccount.save.useMutation();
  const submit = trpc.proAccount.submit.useMutation();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [terms, setTerms] = useState(false);
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Reprise du dossier existant.
  useEffect(() => {
    if (loaded || !mine.data) return;
    setLoaded(true);
    const d = mine.data;
    setForm({
      contactFirstName: d.contactFirstName ?? "", contactLastName: d.contactLastName ?? "",
      contactEmail: d.contactEmail ?? "", contactPhone: d.contactPhone ?? "",
      legalName: d.legalName ?? "", legalForm: d.legalForm ?? "",
      registrationNumber: d.registrationNumber ?? "", vatNumber: d.vatNumber ?? "",
      addressLine: d.addressLine ?? "", city: d.city ?? "",
      postalCode: d.postalCode ?? "", website: d.website ?? "",
    });
    setTerms(!!d.termsAcceptedAt);
    const map: Record<string, boolean> = {};
    for (const doc of d.documents ?? []) map[doc.label] = doc.status === "fourni";
    setDocs(map);
  }, [mine.data, loaded]);

  const required = requirements.data?.requiredFields ?? [];
  const requiredKeys = new Set(required.map((f) => f.key));
  const labels = new Map(required.map((f) => [f.key, f.label]));

  function payload() {
    return {
      professionCode,
      countryCode,
      moduleCodes,
      ...form,
      documents: (requirements.data?.requiredDocs ?? []).map((label) => ({
        key: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 60),
        label,
        status: (docs[label] ? "fourni" : "manquant") as "fourni" | "manquant",
      })),
      termsAccepted: terms,
    };
  }

  async function handleSave() {
    setMessage(null);
    await save.mutateAsync(payload());
    await Promise.all([mine.refetch(), check.refetch()]);
    setMessage("Dossier enregistré. Il n'est pas encore soumis à vérification.");
  }

  async function handleSubmit() {
    setMessage(null);
    await save.mutateAsync(payload());
    const res = await submit.mutateAsync();
    await Promise.all([mine.refetch(), check.refetch()]);
    setMessage(
      res.ok
        ? "Dossier transmis. Il est en cours de vérification : vous serez prévenu de la décision."
        : "Dossier incomplet : il n'a pas été transmis. Complétez les éléments signalés ci-dessous.",
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] px-4 py-10">
        <div className="mx-auto max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 text-center">
          <Lock size={26} className="mx-auto text-[#D4AF37]" />
          <h1 className="mt-2 text-sm font-black text-[#111]">Connectez-vous pour créer votre dossier</h1>
          <p className="mt-1 text-xs text-[#6B7280]">
            Le dossier professionnel est rattaché à votre compte MKA.P-MS.
          </p>
          <button
            onClick={() => navigate("/connexion")}
            className="mt-4 w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-black text-white"
          >
            Me connecter
          </button>
        </div>
      </div>
    );
  }

  if (!professionCode || countryCode.length !== 2) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] px-4 py-10">
        <div className="mx-auto max-w-md rounded-xl border border-[#E5E7EB] bg-white p-6 text-center">
          <AlertCircle size={26} className="mx-auto text-[#D1D5DB]" />
          <h1 className="mt-2 text-sm font-black text-[#111]">Métier et pays à choisir d'abord</h1>
          <p className="mt-1 text-xs text-[#6B7280]">
            Les justificatifs demandés dépendent de votre métier et de votre pays.
          </p>
          <button
            onClick={() => navigate("/pro/demarrer")}
            className="mt-4 w-full rounded-xl bg-[#111] py-2.5 text-sm font-black text-[#D4AF37]"
          >
            Aller au Portail Professionnel
          </button>
        </div>
      </div>
    );
  }

  const status = mine.data?.status ?? "brouillon";
  const paymentStatus = mine.data?.paymentStatus ?? "en_attente";
  const report = check.data;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/pro/demarrer" className="mb-2 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Mon offre
        </Link>
        <h1 className="text-xl font-black text-white">
          Mon dossier <span className="text-[#D4AF37]">professionnel</span>
        </h1>
        <p className="mt-1 text-xs text-white/60">
          {requirements.data?.registrationLabel
            ? `Exigences ${countryCode} — ${requirements.data.registrationLabel}.`
            : "Informations légales exigées par votre pays et votre métier."}
        </p>
      </div>

      <div className="space-y-3 px-4 pt-4">
        {/* État réel : dossier et paiement sont deux choses distinctes. */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">État du dossier</span>
            <span className="font-black text-[#111]">{STATUS_LABELS[status] ?? status}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">État du paiement</span>
            <span className="font-black text-[#111]">{PAYMENT_LABELS[paymentStatus] ?? paymentStatus}</span>
          </div>
          <p className="mt-2 text-[11px] text-[#6B7280]">
            L'activation demande les deux : un dossier validé par notre équipe et un paiement confirmé
            (ou explicitement non requis). Elle n'est jamais automatique.
          </p>
        </div>

        {requirements.data && !requirements.data.paymentReady && (
          <Notice
            tone="warn"
            title="Pays configuré — prestataire de paiement manquant"
            text="Votre dossier peut être déposé, mais aucun moyen de paiement n'est encore disponible pour ce pays."
          />
        )}

        {mine.data?.reviewNote && (
          <Notice tone="info" title="Retour de l'équipe de vérification" text={mine.data.reviewNote} />
        )}

        {requirements.isLoading && <Loading />}

        {/* Champs exigés (pays + métier) + champs complémentaires utiles. */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <h2 className="mb-2 text-xs font-black text-[#111]">Informations</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FIELD_ORDER.map((key) => {
              const isRequired = requiredKeys.has(key);
              return (
                <label key={key} className="block">
                  <span className="text-[11px] font-bold text-[#6B7280]">
                    {key === "registrationNumber" && requirements.data?.registrationLabel
                      ? requirements.data.registrationLabel
                      : (labels.get(key) ?? DEFAULT_LABELS[key])}
                    {isRequired && <span className="text-[#D4AF37]"> *</span>}
                  </span>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="mt-0.5 w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-sm outline-none focus:border-[#D4AF37]"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Justificatifs exigés — déclarés ici, contrôlés par un humain. */}
        {(requirements.data?.requiredDocs ?? []).length > 0 && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-black text-[#111]">
              <FileText size={13} className="text-[#D4AF37]" /> Justificatifs exigés
            </h2>
            <ul className="space-y-1.5">
              {(requirements.data?.requiredDocs ?? []).map((doc) => (
                <li key={doc}>
                  <label className="flex items-start gap-2 text-[11px] text-[#374151]">
                    <input
                      type="checkbox"
                      checked={!!docs[doc]}
                      onChange={(e) => setDocs((d) => ({ ...d, [doc]: e.target.checked }))}
                      className="mt-0.5 accent-[#D4AF37]"
                    />
                    <span>{doc}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-[#6B7280]">
              Cochez ce que vous pouvez fournir. Les pièces vous seront demandées lors de la
              vérification : cocher ne vaut pas validation.
            </p>
          </div>
        )}

        <label className="flex items-start gap-2 rounded-xl border border-[#E5E7EB] bg-white p-3 text-[11px] text-[#374151]">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 accent-[#D4AF37]" />
          <span>
            J'accepte les conditions professionnelles MKA.P-MS et je certifie l'exactitude des
            informations déclarées.
          </span>
        </label>

        {/* Ce qui manque, dit précisément. */}
        {report && !report.complete && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
            <div className="text-xs font-black text-orange-800">Dossier incomplet</div>
            <ul className="mt-1 space-y-0.5 text-[11px] text-orange-800">
              {report.missingFields.map((f) => <li key={f.key}>• {f.label}</li>)}
              {report.missingDocs.map((d) => <li key={d}>• Justificatif : {d}</li>)}
              {!report.termsAccepted && <li>• Conditions non acceptées</li>}
            </ul>
          </div>
        )}

        {report?.complete && status === "brouillon" && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-[11px] font-bold text-green-800">
            <ShieldCheck size={14} /> Dossier complet — vous pouvez le transmettre à la vérification.
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-[11px] font-bold text-[#111]">
            {message}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleSubmit}
            disabled={submit.isPending || save.isPending || status === "actif"}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {submit.isPending || save.isPending ? "Envoi…" : "Transmettre mon dossier"}
          </button>
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-xs font-bold text-[#111] disabled:opacity-60"
          >
            Enregistrer sans transmettre
          </button>
        </div>

        {status === "actif" && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-[11px] font-bold text-green-800">
            <Check size={14} /> Compte professionnel actif.
          </div>
        )}
      </div>
    </div>
  );
}

const DEFAULT_LABELS: Record<keyof FormState, string> = {
  contactFirstName: "Prénom du représentant légal",
  contactLastName: "Nom du représentant légal",
  contactEmail: "Adresse e-mail professionnelle",
  contactPhone: "Téléphone professionnel",
  legalName: "Dénomination sociale",
  legalForm: "Forme juridique",
  registrationNumber: "Numéro d'immatriculation",
  vatNumber: "Numéro de TVA",
  addressLine: "Adresse de l'établissement",
  city: "Ville",
  postalCode: "Code postal",
  website: "Site internet",
};

function Loading() {
  return (
    <div className="flex items-center justify-center py-8 text-[#9CA3AF]">
      <Loader2 size={18} className="animate-spin" />
    </div>
  );
}

function Notice({ tone, title, text }: { tone: "warn" | "info"; title: string; text: string }) {
  const cls = tone === "warn"
    ? "border-orange-200 bg-orange-50 text-orange-800"
    : "border-blue-200 bg-blue-50 text-blue-800";
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="text-xs font-black">{title}</div>
      <p className="mt-0.5 text-[11px]">{text}</p>
    </div>
  );
}
