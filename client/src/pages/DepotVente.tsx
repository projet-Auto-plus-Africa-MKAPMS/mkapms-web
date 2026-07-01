import { useState, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { Link } from "react-router-dom";
import { HandshakeIcon, Camera, Search, Globe, BadgeCheck, TrendingUp } from "lucide-react";

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
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${done ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>
                {step.icon}
              </div>
              <span className={`mt-1 text-[10px] ${done ? "font-semibold text-[#111]" : "text-[#9CA3AF]"}`}>{step.label}</span>
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

  // ── HERO VIDÉO CAROUSEL ──
  const HERO_VIDEOS = [
    { src: "/videos/depot-vente/depot_confier.mp4", label: "Confier" },
    { src: "/videos/depot-vente/depot_expertise.mp4", label: "Expertise" },
    { src: "/videos/depot-vente/depot_photos.mp4", label: "Photos" },
    { src: "/videos/depot-vente/depot_annonce.mp4", label: "Annonce" },
    { src: "/videos/depot-vente/depot_vente_finale.mp4", label: "Vente" },
  ];
  const [heroVidIdx, setHeroVidIdx] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const startProgress = () => {
    setHeroProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setHeroProgress((p) => {
        if (p >= 100) { clearInterval(progressRef.current!); return 100; }
        return p + 100 / 80;
      });
    }, 100);
  };

  // Avancer automatiquement toutes les 8s
  useEffect(() => {
    const t = setInterval(() => {
      setHeroVidIdx((i) => (i + 1) % HERO_VIDEOS.length);
    }, 8000);
    startProgress();
    return () => { clearInterval(t); if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  // Quand l'index change : mettre en pause toutes les autres vidéos, jouer la nouvelle
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === heroVidIdx) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
    startProgress();
  }, [heroVidIdx]);

  return (
    <div className="min-h-screen bg-[#F5F3EF]">

      {/* ── HERO VIDÉO PREMIUM ── */}
      <div className="relative overflow-hidden bg-[#111]" style={{ height: 320 }}>
        {HERO_VIDEOS.map((v, i) => (
          <video
            key={v.src}
            ref={(el) => { videoRefs.current[i] = el; }}
            src={v.src}
            autoPlay={i === 0}
            muted
            playsInline
            loop
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: i === heroVidIdx ? 0.7 : 0, zIndex: i === heroVidIdx ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#111]/30 via-[#111]/10 to-[#111]/50" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider mb-3">
            <HandshakeIcon size={12} /> Dépôt-Vente
          </span>
          <h1 className="text-[26px] md:text-4xl font-black text-white leading-tight">
            Vendez sans effort avec <span className="text-[#D4AF37]">MKA.P-MS</span>
          </h1>
          <p className="mt-2 text-sm text-white/70 max-w-sm">
            Confiez votre véhicule, on s'occupe de tout : photos, annonce, négociation, vente.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            {[
              { val: "5%", label: "commission seulement" },
              { val: "48h", label: "mise en ligne" },
              { val: "100%", label: "prise en charge" },
            ].map((s) => (
              <div key={s.val} className="flex flex-col items-center rounded-xl bg-white/10 backdrop-blur px-4 py-2 border border-white/10">
                <span className="text-base font-black text-[#D4AF37]">{s.val}</span>
                <span className="text-[9px] text-white/60 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {HERO_VIDEOS.map((v, i) => (
              <button
                key={i}
                onClick={() => { setHeroVidIdx(i); }}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${i === heroVidIdx ? 'opacity-100' : 'opacity-35 hover:opacity-60'}`}
              >
                {/* Barre de progression animée or */}
                <div className="relative h-[3px] rounded-full overflow-hidden" style={{ width: i === heroVidIdx ? 40 : 20, background: 'rgba(255,255,255,0.25)', transition: 'width 0.3s' }}>
                  {i === heroVidIdx && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${heroProgress}%`,
                        background: 'linear-gradient(90deg, #D4AF37, #F5D76E)',
                        boxShadow: '0 0 6px #D4AF37',
                        transition: 'width 0.1s linear',
                      }}
                    />
                  )}
                </div>
                <span className={`text-[8px] font-semibold tracking-wide ${i === heroVidIdx ? 'text-[#D4AF37]' : 'text-white/50'}`}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="mx-auto max-w-5xl px-4 py-8">
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
    </div>
  );
}

function InfoTab({ loggedIn, onStart }: { loggedIn: boolean; onStart: () => void }) {
  const steps = [
    { num: 1, title: "Vous nous confiez votre véhicule", desc: "Remplissez le formulaire avec les détails de votre véhicule.", icon: <HandshakeIcon size={18} /> },
    { num: 2, title: "Expertise gratuite", desc: "Notre équipe évalue votre véhicule et propose un prix juste.", icon: <Search size={18} /> },
    { num: 3, title: "Photos professionnelles", desc: "Séance photo pro pour mettre en valeur votre véhicule.", icon: <Camera size={18} /> },
    { num: 4, title: "Annonce en ligne", desc: "Votre véhicule est publié sur MKA.P-MS et diffusé à des milliers d'acheteurs.", icon: <Globe size={18} /> },
    { num: 5, title: "Négociation et vente", desc: "On gère les appels, visites et négociations pour vous.", icon: <TrendingUp size={18} /> },
    { num: 6, title: "Paiement sécurisé", desc: "Une fois vendu, vous recevez votre paiement (moins la commission).", icon: <BadgeCheck size={18} /> },
  ];
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s) => (
          <div key={s.num} className="rounded-lg border border-[#E5E7EB] bg-white p-5 hover:border-[#D4AF37]/40 transition-colors">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">{s.icon}</div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-bold text-[#D4AF37]">Étape {s.num}</span>
            </div>
            <h3 className="mb-1 font-semibold text-[#111]">{s.title}</h3>
            <p className="text-sm text-[#6B7280]">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Avantages */}
      <div className="mt-8 rounded-xl bg-[#111] p-6 text-white">
        <h2 className="mb-4 text-lg font-bold text-center">Pourquoi choisir le Dépôt-Vente MKA.P-MS ?</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Zéro stress", desc: "On s'occupe de tout, de A à Z" },
            { title: "Commission dès 5%", desc: "Parmi les plus bas du marché" },
            { title: "Réseau national", desc: "Milliers d'acheteurs potentiels" },
          ].map((a) => (
            <div key={a.title} className="rounded-lg bg-white/5 border border-white/10 p-4 text-center">
              <div className="mb-1 font-bold text-[#D4AF37]">{a.title}</div>
              <div className="text-xs text-white/60">{a.desc}</div>
            </div>
          ))}
        </div>
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
          <div className="mt-2 text-xs text-[#9CA3AF]">Réf: DV-{d.id} — {new Date(d.createdAt).toLocaleDateString("fr-FR")}</div>
        </div>
      ))}
    </div>
  );
}
