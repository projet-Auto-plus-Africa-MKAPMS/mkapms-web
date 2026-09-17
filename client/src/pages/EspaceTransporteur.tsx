/**
 * Espace Transporteur.
 *
 * Audit réel (demande #3, parcours fournisseur/transporteur) : le rôle
 * "carrier" de l'app (server/supplier-engine/access.ts, table `partners`)
 * n'est PAS le même concept que les « carriers » de server/logistics-engine
 * (catalogue fixe de transporteurs colis/fret tiers — DHL, UPS… intégrés par
 * clé API, sans lien avec un compte utilisateur). Aucune table n'assigne
 * aujourd'hui une expédition ou une tâche précise à un partenaire
 * transporteur identifié : il n'existe donc pas encore d'action réelle à
 * proposer ici sans inventer un modèle métier. Cet écran affiche
 * honnêtement l'identité réelle du partenaire plutôt qu'un faux tableau de
 * bord d'activité.
 */
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { Truck, HelpCircle } from "lucide-react";

export default function EspaceTransporteur() {
  const { user } = useAuth();
  const monAcces = trpc.supplierPortal.monAcces.useQuery(undefined, { enabled: !!user });

  if (!user) {
    return <div className="container-page py-16 text-center text-slate-500">Connecte-toi pour accéder à ton espace transporteur.</div>;
  }
  if (monAcces.isLoading) {
    return <div className="container-page py-16 text-center text-slate-400">Chargement…</div>;
  }
  if (!monAcces.data || monAcces.data.accountType !== "carrier") {
    return <div className="container-page py-16 text-center text-slate-500">Aucun accès transporteur actif sur ce compte.</div>;
  }

  const acces = monAcces.data;
  const fiche = acces.fiche as { name: string; country: string | null } | null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-[#D4AF37]" /> Espace transporteur</h1>
        <p className="mt-1 text-sm text-white/60">{fiche?.name ?? ""} · {fiche?.country ?? ""}</p>
        <span className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#D4AF37]">{acces.status}</span>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
        <h2 className="text-sm font-black text-[#111]">Missions de transport</h2>
        <p className="text-sm text-[#4B5563]">
          Aucune mission ou expédition n'est encore assignable individuellement à un partenaire transporteur dans la plateforme :
          cette fonctionnalité n'existe pas encore.
        </p>
        <p className="text-sm text-[#4B5563]">
          L'équipe MKA.P-MS vous contacte directement, par les coordonnées de votre fiche, pour toute mission de transport à pourvoir.
        </p>
      </div>

      <Link to="/aide" className="mx-4 mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-white border border-[#E5E7EB] py-3 text-sm font-bold text-[#111]">
        <HelpCircle size={14} /> Contacter l'équipe MKA.P-MS
      </Link>
    </div>
  );
}
