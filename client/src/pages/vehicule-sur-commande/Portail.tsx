import { Link } from "react-router-dom";
import { PlusCircle, ClipboardList, Package, ShieldCheck, Search, Truck, Award } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { isAdmin } from "@shared/roles";
import MediaAdSlot from "../../components/MediaAdSlot";
import VehicleCard from "../../components/VehicleCard";

/* ══════════════════════════════════════════════════════════════════════════
   PORTAIL « VÉHICULE SUR COMMANDE » (/vehicule-sur-commande)
   Demande PDG : système totalement séparé du VO existant. Réutilise
   trpc.annonces.list filtré par ownership="partenaire" — jamais un second
   registre d'annonces. isAdmin ici inclut "employee" (@shared/roles).

   Polish (31/10) : fiches alignées sur le même VehicleCard que le reste de
   la plateforme (badges, km/année/carburant, ville) au lieu d'une carte
   minimale isolée — le badge "Disponible sur commande/visite" existait déjà
   dans @shared/badges (computeBadges), juste jamais branché sur ce champ
   dans VehicleCard. Explication du principe ajoutée : ce mode d'achat n'a
   pas d'équivalent ailleurs sur le site, un premier visiteur n'a aucun
   repère pour comprendre "commandable avant d'être physiquement chez
   MKA.P-MS" sans qu'on le dise en trois étapes.
   ══════════════════════════════════════════════════════════════════════════ */

const ETAPES = [
  { Icon: Search, titre: "Choisissez", texte: "Un véhicule sourcé chez un fournisseur partenaire, pas encore physiquement chez MKA.P-MS." },
  { Icon: ShieldCheck, titre: "Commandez", texte: "Acompte sécurisé pour réserver le véhicule au prix annoncé, sans risque de rupture." },
  { Icon: Truck, titre: "Suivez & recevez", texte: "Suivi d'étapes réel depuis votre espace « Mes commandes » jusqu'à la livraison." },
];

export default function PortailVehiculeSurCommande() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.annonces.list.useQuery({ ownership: "partenaire", limit: 24 });
  const annonces = data?.items ?? [];
  const employe = isAdmin(user?.role);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pb-8 pt-8 text-center">
        <video className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25" autoPlay muted loop playsInline preload="metadata" poster="/pubs/hero5-pro.jpg" aria-hidden="true"><source src="/videos/home/home_finance.mp4" type="video/mp4" /></video>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 to-black/90" />
        <h1 className="mx-auto flex max-w-4xl items-center justify-center gap-2 break-words text-3xl font-black text-white sm:text-5xl">
          <Package size={22} className="text-[#D4AF37]" /> Véhicule sur commande
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-white/65 sm:text-base">
          Un véhicule sourcé chez un fournisseur, commandable avant d'être physiquement chez MKA.P-MS. Système totalement séparé des véhicules d'occasion déjà en stock.
        </p>
        <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold text-white/70">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#D4AF37]" /> Acompte sécurisé</span>
          <span className="inline-flex items-center gap-1.5"><Award size={14} className="text-[#D4AF37]" /> Fournisseurs vérifiés</span>
          <span className="inline-flex items-center gap-1.5"><Truck size={14} className="text-[#D4AF37]" /> Suivi de livraison réel</span>
        </div>
        {employe && (
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Link to="/vehicule-sur-commande/depot" className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#111]">
              <PlusCircle size={14} /> Déposer un véhicule
            </Link>
            <Link to="/vehicule-sur-commande/mes-vehicules" className="flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white">
              <ClipboardList size={14} /> Mes véhicules attribués
            </Link>
          </div>
        )}
        {user && !employe && (
          <Link to="/vehicule-sur-commande/mes-commandes" className="mt-3 inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white">
            <ClipboardList size={14} /> Mes commandes
          </Link>
        )}
      </section>

      <div className="px-4 mt-6 mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ETAPES.map(({ Icon, titre, texte }, i) => (
            <div key={titre} className="relative rounded-xl border border-[#E5E7EB] bg-white p-4">
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#111]">
                <Icon size={16} className="text-[#D4AF37]" />
              </span>
              <p className="text-xs font-black uppercase tracking-wide text-[#8B7500]">Étape {i + 1}</p>
              <p className="mt-0.5 text-sm font-bold text-[#111]">{titre}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{texte}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <MediaAdSlot label="Partenaire mobilité internationale" />
        <h2 className="mb-3 mt-4 text-base font-black text-[#111]">Véhicules disponibles sur commande</h2>
        {isLoading && <p className="text-sm text-[#6B7280] text-center">Chargement…</p>}
        {!isLoading && annonces.length === 0 && (
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">
            Aucun véhicule sur commande disponible pour l'instant.
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a: any) => (
            <VehicleCard key={a.id} v={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
