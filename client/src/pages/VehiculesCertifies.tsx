import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import {
  ChevronLeft, Award, Star, Shield, History,
  Camera, Wrench, Car
} from "lucide-react";
import ReserverLocationButton from "../components/ReserverLocationButton";

/* ══════════════════════════════════════════════════════════════════════════
   VÉHICULES CERTIFIÉS MKA.P-MS
   Badge « Sélection MKA.P-MS » (server/routers/admin.ts : certifyVehicle,
   colonne annonces.selectionMka) — réservé à la Direction, déjà utilisé sur
   Home.tsx. Aucune note ni checklist par véhicule inventée : la certification
   est un fait binaire réel (certifié ou non), les critères ci-dessous
   décrivent la démarche générale, pas un résultat par véhicule fabriqué.
   ══════════════════════════════════════════════════════════════════════════ */

const CRITERES_CERTIFICATION = [
  { label: "Contrôle multi-points", desc: "Inspection mécanique, électrique et esthétique complète", icon: Shield },
  { label: "Historique vérifié", desc: "Aucun sinistre grave, kilométrage certifié, propriétaires vérifiés", icon: History },
  { label: "Photos certifiées", desc: "Photos prises par un inspecteur MKA.P-MS, non retouchées", icon: Camera },
  { label: "Entretien à jour", desc: "Carnet d'entretien complet, dernière révision vérifiée", icon: Wrench },
  { label: "Garantie MKA.P-MS", desc: "Attribuée par la Direction après vérification", icon: Award },
];

export default function VehiculesCertifies() {
  const certifiesQ = trpc.annonces.list.useQuery({ type: "location", selectionMka: true, limit: 30 });
  const vehicules = certifiesQ.data?.items ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} className="text-[#D4AF37]" /> Certifiés MKA.P-MS</h1>
        <p className="mt-1 text-sm text-white/60">Véhicules inspectés et validés par la Direction</p>
      </div>

      {/* Badge explanation */}
      <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a1a] border border-[#D4AF37]/30 p-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-1.5">
          <Star size={14} className="text-white" fill="white" />
          <span className="text-sm font-bold text-white">Sélection MKA.P-MS</span>
        </div>
        <p className="mt-2 text-xs text-white/60">Seuls les véhicules validés par la Direction reçoivent ce badge. Votre garantie de qualité.</p>
      </div>

      {/* Certification criteria */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Critères de certification</h2>
        <div className="mt-3 space-y-2">
          {CRITERES_CERTIFICATION.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10"><Icon size={16} className="text-[#D4AF37]" /></div>
                <div><h3 className="text-sm font-bold text-[#111]">{c.label}</h3><p className="text-[10px] text-[#6B7280]">{c.desc}</p></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certified vehicles — trpc.annonces.list(selectionMka: true) */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Véhicules certifiés disponibles</h2>
        {certifiesQ.isLoading && <p className="mt-2 text-xs text-[#9CA3AF]">Chargement…</p>}
        {!certifiesQ.isLoading && vehicules.length === 0 && (
          <div className="mt-3 rounded-xl bg-white border border-[#E5E7EB] p-6 text-center">
            <Car size={22} className="mx-auto text-[#9CA3AF]" />
            <p className="mt-2 text-sm text-[#6B7280]">Aucun véhicule certifié disponible pour le moment.</p>
          </div>
        )}
        <div className="mt-3 space-y-3">
          {vehicules.map((v: any) => (
            <div key={v.id} className="rounded-xl bg-white border border-[#D4AF37]/30 overflow-hidden">
              <div className="relative h-[150px] bg-[#F5F3EF]">
                {v.photoPrincipale && <img src={v.photoPrincipale} alt={v.titre ?? ""} className="w-full h-full object-cover" loading="lazy" />}
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[9px] font-bold text-white"><Star size={10} fill="white" /> Certifié</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111]">{v.titre || `${v.marque ?? ""} ${v.modele ?? ""}`}</h3>
                <p className="text-[10px] text-[#6B7280]">{[v.annee, v.kilometrage ? `${Number(v.kilometrage).toLocaleString("fr-FR")} km` : null].filter(Boolean).join(" · ")}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xl font-black text-[#D4AF37]">{Math.round(Number(v.prixJour ?? v.prix))} €</span>
                    <span className="text-xs text-[#6B7280]"> / jour</span>
                  </div>
                  <ReserverLocationButton
                    univers="certifie"
                    vehiculeRef={String(v.id)}
                    vehiculeTitre={v.titre || `${v.marque ?? ""} ${v.modele ?? ""}`}
                    montantEstime={v.prixJour ? Number(v.prixJour) : Number(v.prix)}
                    className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white active:scale-[0.98] transition disabled:opacity-60"
                  >
                    Réserver
                  </ReserverLocationButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
