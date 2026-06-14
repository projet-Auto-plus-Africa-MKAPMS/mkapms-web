import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const ACTIVITIES = [
  { value: "vente_pro", label: "Vente Pro", icon: "🚗", desc: "Vendeur automobile professionnel" },
  { value: "location_pro", label: "Location Pro", icon: "🔑", desc: "Société de location de véhicules" },
  { value: "vtc_taxi", label: "VTC / TAXI", icon: "🚕", desc: "Location de véhicules conformes VTC & Taxi" },
  { value: "garage_plus", label: "Garage+", icon: "🔧", desc: "Atelier mécanique, carrosserie" },
  { value: "pieces_auto", label: "Pièces Auto", icon: "⚙", desc: "Boutique / stock de pièces" },
  { value: "livraison", label: "Livraison", icon: "🚚", desc: "Service de livraison" },
  { value: "depannage", label: "Dépannage", icon: "🆘", desc: "Dépanneur / remorqueur" },
  { value: "carte_grise", label: "Carte Grise", icon: "📋", desc: "Démarches administratives" },
  { value: "cabinet_comptable", label: "Cabinet Comptable", icon: "📊", desc: "Expert-comptable" },
  { value: "boutique_stock", label: "Boutique / Stock", icon: "📦", desc: "Commerce automobile" },
] as const;

type Activity = typeof ACTIVITIES[number]["value"];

function ChoixActivite({ onSelect }: { onSelect: (a: Activity) => void }) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-2 text-center text-3xl font-extrabold text-[#111]">Espace Professionnel</h1>
      <p className="mb-10 text-center text-[#6B7280]">Choisissez votre activité pour accéder aux outils adaptés à votre métier.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIVITIES.map((a) => (
          <button
            key={a.value}
            onClick={() => onSelect(a.value)}
            className="flex items-start gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 text-left transition hover:border-[#D4AF37] hover:shadow-md"
          >
            <span className="text-3xl">{a.icon}</span>
            <div>
              <h3 className="font-bold text-[#111]">{a.label}</h3>
              <p className="mt-1 text-sm text-[#6B7280]">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DashboardVentePro() {
  const dashboard = trpc.pro.dashboard.useQuery();
  const d = dashboard.data;
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-[#111]">Tableau de bord — Vente Pro</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Annonces" value={d?.annonces?.total ?? 0} />
        <StatCard label="Publiées" value={d?.annonces?.publiees ?? 0} color="text-green-600" />
        <StatCard label="Vendues" value={d?.annonces?.vendues ?? 0} color="text-[#D4AF37]" />
        <StatCard label="Documents" value={d?.documents?.valides ?? 0} sub={`${d?.documents?.enAttente ?? 0} en attente`} />
      </div>
    </div>
  );
}

function DashboardLocationPro() {
  const dashboard = trpc.pro.dashboard.useQuery();
  const flotte = trpc.pro.locationListFlotte.useQuery();
  const contrats = trpc.pro.locationListContrats.useQuery();
  const d = dashboard.data;
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-[#111]">Tableau de bord — Location Pro</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Véhicules" value={(d as any)?.flotte?.total ?? flotte.data?.length ?? 0} />
        <StatCard label="Disponibles" value={(d as any)?.flotte?.disponibles ?? 0} color="text-green-600" />
        <StatCard label="Loués" value={(d as any)?.flotte?.loues ?? 0} color="text-blue-600" />
        <StatCard label="Contrats" value={(d as any)?.contrats?.total ?? contrats.data?.length ?? 0} />
      </div>
      {flotte.data && flotte.data.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold text-[#6B7280]">FLOTTE</h3>
          <div className="space-y-2">
            {flotte.data.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3">
                <div>
                  <span className="font-medium text-[#111]">{v.marque} {v.modele}</span>
                  {v.immatriculation && <span className="ml-2 text-sm text-[#6B7280]">{v.immatriculation}</span>}
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardVtcTaxi() {
  const dashboard = trpc.pro.dashboard.useQuery();
  const societe = trpc.pro.vtcGetSociete.useQuery();
  const chauffeurs = trpc.pro.vtcListChauffeurs.useQuery();
  const vehicules = trpc.pro.vtcListVehicules.useQuery();
  const d = dashboard.data;
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-[#111]">Tableau de bord — Location VTC / TAXI</h2>
      <p className="mb-4 text-sm text-[#6B7280]">Gestion de votre flotte de véhicules conformes VTC & Taxi — location, contrats, documents.</p>
      {!societe.data ? (
        <p className="text-sm text-[#6B7280]">Créez votre société pour commencer.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Chauffeurs" value={(d as any)?.chauffeurs?.total ?? chauffeurs.data?.length ?? 0} />
            <StatCard label="Actifs" value={(d as any)?.chauffeurs?.actifs ?? 0} color="text-green-600" />
            <StatCard label="Véhicules" value={(d as any)?.vehicules?.total ?? vehicules.data?.length ?? 0} />
            <StatCard label="Disponibles" value={(d as any)?.vehicules?.disponibles ?? 0} color="text-blue-600" />
          </div>
          {chauffeurs.data && chauffeurs.data.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold text-[#6B7280]">CHAUFFEURS</h3>
              <div className="space-y-2">
                {chauffeurs.data.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3">
                    <span className="font-medium text-[#111]">{c.prenom} {c.nom}</span>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DashboardGeneric({ activity }: { activity: string }) {
  const dashboard = trpc.pro.dashboard.useQuery();
  const d = dashboard.data;
  const label = ACTIVITIES.find((a) => a.value === activity)?.label ?? activity;
  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-[#111]">Tableau de bord — {label}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Annonces" value={d?.annonces?.total ?? 0} />
        <StatCard label="Documents" value={d?.documents?.total ?? 0} />
        <StatCard label="Validés" value={d?.documents?.valides ?? 0} color="text-green-600" />
        <StatCard label="Expirés" value={d?.documents?.expires ?? 0} color="text-red-500" />
      </div>
    </div>
  );
}

function DocumentsPro() {
  const docs = trpc.pro.listDocuments.useQuery();
  return (
    <div>
      <h3 className="mb-3 text-lg font-bold text-[#111]">Mes documents</h3>
      {!docs.data?.length ? (
        <p className="text-sm text-[#6B7280]">Aucun document. Uploadez vos documents professionnels pour activer votre compte.</p>
      ) : (
        <div className="space-y-2">
          {docs.data.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3">
              <div>
                <span className="font-medium text-[#111]">{d.label || d.type}</span>
                {d.fileName && <span className="ml-2 text-xs text-[#6B7280]">{d.fileName}</span>}
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: number; color?: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color || "text-[#111]"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[#6B7280]">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    actif: "bg-green-100 text-green-700",
    disponible: "bg-green-100 text-green-700",
    valide: "bg-green-100 text-green-700",
    en_validation: "bg-yellow-100 text-yellow-700",
    envoye: "bg-blue-100 text-blue-700",
    en_analyse: "bg-blue-100 text-blue-700",
    reserve: "bg-purple-100 text-purple-700",
    loue: "bg-blue-100 text-blue-700",
    en_entretien: "bg-orange-100 text-orange-700",
    bloque: "bg-red-100 text-red-700",
    refuse: "bg-red-100 text-red-700",
    expire: "bg-red-100 text-red-700",
    suspect: "bg-red-100 text-red-700",
    inactif: "bg-gray-100 text-gray-600",
    suspendu: "bg-red-100 text-red-700",
    indisponible: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function EspacePro() {
  const { user } = useAuth();
  const profile = trpc.pro.getProfile.useQuery(undefined, { enabled: !!user });
  const createProfile = trpc.pro.createProfile.useMutation({ onSuccess: () => profile.refetch() });
  const [tab, setTab] = useState<"dashboard" | "documents">("dashboard");

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold text-[#111]">Espace Professionnel</h1>
        <p className="text-[#6B7280]">Connectez-vous pour accéder à votre espace professionnel.</p>
      </div>
    );
  }

  if (!profile.data) {
    return (
      <ChoixActivite onSelect={(activity) => createProfile.mutate({ activity })} />
    );
  }

  const activity = profile.data.activity;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111]">Espace Pro</h1>
          <p className="text-sm text-[#6B7280]">
            {ACTIVITIES.find((a) => a.value === activity)?.label} — {profile.data.companyName || user.name}
          </p>
        </div>
        <span className="rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-white">
          {ACTIVITIES.find((a) => a.value === activity)?.icon} {ACTIVITIES.find((a) => a.value === activity)?.label}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#F3F4F6] p-1">
        {(["dashboard", "documents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${tab === t ? "bg-white text-[#111] shadow-sm" : "text-[#6B7280] hover:text-[#111]"}`}
          >
            {t === "dashboard" ? "Tableau de bord" : "Documents"}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "dashboard" && (
        <>
          {activity === "vente_pro" && <DashboardVentePro />}
          {activity === "location_pro" && <DashboardLocationPro />}
          {activity === "vtc_taxi" && <DashboardVtcTaxi />}
          {!["vente_pro", "location_pro", "vtc_taxi"].includes(activity) && <DashboardGeneric activity={activity} />}
        </>
      )}
      {tab === "documents" && <DocumentsPro />}
    </div>
  );
}
