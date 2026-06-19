import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { Link } from "react-router-dom";

const STEPS = [
  { key: "demande", label: "Demande", icon: "📋" },
  { key: "expertise", label: "Expertise", icon: "🔍" },
  { key: "accepte", label: "Accepté", icon: "✓" },
  { key: "photos_en_cours", label: "Photos", icon: "📸" },
  { key: "en_ligne", label: "En ligne", icon: "🌐" },
  { key: "negociation", label: "Négociation", icon: "💬" },
  { key: "vendu", label: "Vendu", icon: "🎉" },
  { key: "paiement_client", label: "Paiement", icon: "💰" },
  { key: "termine", label: "Terminé", icon: "✓" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  demande: "Demande reçue",
  expertise: "Expertise en cours",
  accepte: "Véhicule accepté",
  photos_en_cours: "Séance photos en cours",
  en_ligne: "Annonce en ligne",
  negociation: "Négociation en cours",
  vendu: "Véhicule vendu !",
  paiement_client: "Paiement en cours",
  termine: "Terminé",
  refuse: "Refusé",
  annule: "Annulé",
};

function StatusTimeline({ status }: { status: string }) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {STEPS.map((step, i) => {
        const done = i <= idx;
        const current = i === idx;
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center ${current ? "scale-110" : ""}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${done ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-red-500"}`}>
                {step.icon}
              </div>
              <span className={`mt-1 text-[10px] ${done ? "font-semibold text-[#111]" : "text-red-500"}`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-0.5 w-6 ${i < idx ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DepotVente() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"info" | "form" | "mes">(user ? "form" : "info");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-[#111]">Dépôt-Vente MKA.P-MS</h1>
      <p className="mb-6 text-[#6B7280]">
        Confiez votre véhicule, on s'occupe de tout : photos, annonce, négociation, vente. Commission automatique.
      </p>

      <div className="mb-6 flex gap-2 border-b border-[#E5E7EB]">
        <button onClick={() => setTab("info")} className={`px-4 py-2 text-sm font-medium ${tab === "info" ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-[#6B7280]"}`}>
          Comment ça marche
        </button>
        {user && (
          <>
            <button onClick={() => setTab("form")} className={`px-4 py-2 text-sm font-medium ${tab === "form" ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-[#6B7280]"}`}>
              Déposer un véhicule
            </button>
            <button onClick={() => setTab("mes")} className={`px-4 py-2 text-sm font-medium ${tab === "mes" ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-[#6B7280]"}`}>
              Mes dépôts
            </button>
          </>
        )}
      </div>

      {tab === "info" && <InfoTab loggedIn={!!user} onStart={() => setTab("form")} />}
      {tab === "form" && user && <FormTab />}
      {tab === "mes" && user && <MesDepots />}
    </div>
  );
}

function InfoTab({ loggedIn, onStart }: { loggedIn: boolean; onStart: () => void }) {
  const steps = [
    { num: 1, title: "Vous nous confiez votre véhicule", desc: "Remplissez le formulaire avec les détails de votre véhicule." },
    { num: 2, title: "Expertise gratuite", desc: "Notre équipe évalue votre véhicule et propose un prix juste." },
    { num: 3, title: "Photos professionnelles", desc: "Séance photo pro pour mettre en valeur votre véhicule." },
    { num: 4, title: "Annonce en ligne", desc: "Votre véhicule est publié sur MKA.P-MS et diffusé à des milliers d'acheteurs." },
    { num: 5, title: "Négociation et vente", desc: "On gère les appels, visites et négociations pour vous." },
    { num: 6, title: "Paiement sécurisé", desc: "Une fois vendu, vous recevez votre paiement (moins la commission)." },
  ];
  return (
    <div>
      <div className="mb-8 rounded-xl bg-gradient-to-r from-[#111] to-[#333] p-8 text-white">
        <h2 className="mb-2 text-2xl font-bold">Vendez sans effort</h2>
        <p className="mb-4 text-[#D4D4D4]">Pas de stress, pas de démarches. MKA.P-MS vend votre véhicule pour vous.</p>
        <div className="inline-block rounded-lg bg-[#D4AF37] px-3 py-1 text-sm font-semibold text-[#111]">Commission : à partir de 5%</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s) => (
          <div key={s.num} className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37] text-sm font-bold text-white">{s.num}</div>
            <h3 className="mb-1 font-semibold text-[#111]">{s.title}</h3>
            <p className="text-sm text-[#6B7280]">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        {loggedIn ? (
          <button onClick={onStart} className="rounded-lg bg-[#D4AF37] px-8 py-3 font-semibold text-white hover:bg-[#C5A028]">
            Déposer mon véhicule
          </button>
        ) : (
          <Link to="/connexion" className="inline-block rounded-lg bg-[#D4AF37] px-8 py-3 font-semibold text-white hover:bg-[#C5A028]">
            Connectez-vous pour déposer
          </Link>
        )}
      </div>
    </div>
  );
}

function FormTab() {
  const utils = trpc.useUtils();
  const create = trpc.depotVente.create.useMutation({
    onSuccess: () => {
      utils.depotVente.mine.invalidate();
      setSuccess(true);
    },
  });
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    marque: "", modele: "", annee: "", immatriculation: "", vin: "",
    kilometrage: "", carburant: "", boiteVitesse: "", couleur: "", description: "", prixSouhaite: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (success) {
    return (
      <div className="rounded-xl border border-[#16A34A] bg-[#F0FDF4] p-8 text-center">
        <div className="mb-2 text-4xl">🎉</div>
        <h3 className="mb-2 text-xl font-bold text-[#16A34A]">Demande envoyée !</h3>
        <p className="text-sm text-[#6B7280]">Notre équipe vous contactera rapidement pour organiser l'expertise de votre véhicule.</p>
        <button onClick={() => { setSuccess(false); setForm({ marque: "", modele: "", annee: "", immatriculation: "", vin: "", kilometrage: "", carburant: "", boiteVitesse: "", couleur: "", description: "", prixSouhaite: "" }); }} className="mt-4 text-sm text-[#D4AF37] hover:underline">
          Déposer un autre véhicule
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate({
          marque: form.marque,
          modele: form.modele,
          annee: form.annee ? Number(form.annee) : undefined,
          immatriculation: form.immatriculation || undefined,
          vin: form.vin || undefined,
          kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
          carburant: form.carburant || undefined,
          boiteVitesse: form.boiteVitesse || undefined,
          couleur: form.couleur || undefined,
          description: form.description || undefined,
          prixSouhaite: form.prixSouhaite ? Number(form.prixSouhaite) : undefined,
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Marque *</label>
          <input value={form.marque} onChange={(e) => set("marque", e.target.value)} required className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" placeholder="Ex: Renault" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Modèle *</label>
          <input value={form.modele} onChange={(e) => set("modele", e.target.value)} required className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" placeholder="Ex: Clio" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Année</label>
          <input type="number" value={form.annee} onChange={(e) => set("annee", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" placeholder="2020" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Kilométrage</label>
          <input type="number" value={form.kilometrage} onChange={(e) => set("kilometrage", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" placeholder="50000" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Immatriculation</label>
          <input value={form.immatriculation} onChange={(e) => set("immatriculation", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" placeholder="AB-123-CD" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">VIN</label>
          <input value={form.vin} onChange={(e) => set("vin", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Carburant</label>
          <select value={form.carburant} onChange={(e) => set("carburant", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none">
            <option value="">Sélectionner</option>
            <option value="essence">Essence</option>
            <option value="diesel">Diesel</option>
            <option value="electrique">Électrique</option>
            <option value="hybride">Hybride</option>
            <option value="gpl">GPL</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Boîte de vitesse</label>
          <select value={form.boiteVitesse} onChange={(e) => set("boiteVitesse", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none">
            <option value="">Sélectionner</option>
            <option value="manuelle">Manuelle</option>
            <option value="automatique">Automatique</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Couleur</label>
          <input value={form.couleur} onChange={(e) => set("couleur", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Prix souhaité (€)</label>
          <input type="number" value={form.prixSouhaite} onChange={(e) => set("prixSouhaite", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" placeholder="15000" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#374151]">Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" placeholder="État général, options, historique..." />
      </div>
      <button type="submit" disabled={create.isPending} className="rounded-lg bg-[#D4AF37] px-8 py-3 font-semibold text-white hover:bg-[#C5A028] disabled:opacity-50">
        {create.isPending ? "Envoi..." : "Envoyer ma demande de dépôt-vente"}
      </button>
    </form>
  );
}

function MesDepots() {
  const { data: depots, isLoading } = trpc.depotVente.mine.useQuery();

  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!depots?.length) return <div className="py-8 text-center text-[#6B7280]">Aucun dépôt-vente pour le moment.</div>;

  return (
    <div className="space-y-4">
      {depots.map((d) => (
        <div key={d.id} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-[#111]">{d.marque} {d.modele}</span>
              {d.annee && <span className="ml-2 text-sm text-[#6B7280]">{d.annee}</span>}
            </div>
            <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#92400E]">
              {STATUS_LABELS[d.status] ?? d.status}
            </span>
          </div>
          <StatusTimeline status={d.status} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {d.kilometrage != null && <div><span className="text-[#6B7280]">Km :</span> {Number(d.kilometrage).toLocaleString()}</div>}
            {d.prixSouhaite != null && <div><span className="text-[#6B7280]">Prix souhaité :</span> {Number(d.prixSouhaite).toLocaleString()} €</div>}
            {d.prixExpertise != null && <div><span className="text-[#6B7280]">Expertise :</span> {Number(d.prixExpertise).toLocaleString()} €</div>}
            {d.prixVenteEffectif != null && <div><span className="text-[#6B7280]">Vendu :</span> {Number(d.prixVenteEffectif).toLocaleString()} €</div>}
          </div>
          <div className="mt-2 text-xs text-red-500">Réf: DV-{d.id} — {new Date(d.createdAt).toLocaleDateString("fr-FR")}</div>
        </div>
      ))}
    </div>
  );
}
