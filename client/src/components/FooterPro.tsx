/**
 * MKA.P-MS — Pied de page du portail B2B
 * Colonnes : MKA.P-MS · Professionnels · Investisseurs · Partenaires ·
 * Assistance · Informations légales. Tous les liens pointent vers des
 * pages réellement construites (voir audit avant construction).
 */
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Logo } from "./Logo";

export default function FooterPro() {
  const { data: legal } = trpc.meta.legal.useQuery();

  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col items-start gap-2">
          <Logo variant="closed" size={32} withWordmark />
          <p className="max-w-sm text-sm text-white/50">
            Le portail B2B de MKA.P-MS — même base de données, mêmes moteurs que mkapms.fr et mkapms.site,
            pensé pour les professionnels, investisseurs, partenaires et transporteurs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">MKA.P-MS</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/" className="hover:text-white">Plateforme principale</Link></li>
              <li><Link to="/b2b" className="hover:text-white">Portail B2B</Link></li>
              <li><Link to="/aide" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Professionnels</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/espace-pro" className="hover:text-white">Espace Pro</Link></li>
              <li><Link to="/pro/demarrer" className="hover:text-white">Démarrer mon offre</Link></li>
              <li><Link to="/abonnements" className="hover:text-white">Abonnements</Link></li>
              <li><Link to="/depot-annonce" className="hover:text-white">Déposer une annonce</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Investisseurs</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/investissement" className="hover:text-white">Opportunités</Link></li>
              <li><Link to="/investissement/devenir-investisseur" className="hover:text-white">Devenir investisseur</Link></li>
              <li><Link to="/investisseurs/espace-investisseurs" className="hover:text-white">Espace investisseur</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Partenaires</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/partenaires" className="hover:text-white">Devenir partenaire</Link></li>
              <li><Link to="/partenaires/inscription-partenaire" className="hover:text-white">Candidature</Link></li>
              <li><Link to="/espace-transporteur" className="hover:text-white">Transport & Livraison</Link></li>
              <li><Link to="/espace-fournisseur" className="hover:text-white">Espace fournisseur</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Assistance & légal</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/aide" className="hover:text-white">Centre d'aide</Link></li>
              <li><Link to="/aide#cgv" className="hover:text-white">CGV / CGU</Link></li>
              <li><Link to="/confidentialite" className="hover:text-white">Confidentialité</Link></li>
              <li><Link to="/aide#mentions" className="hover:text-white">Mentions légales</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-white/30">
        © {new Date().getFullYear()} {legal?.raisonSociale} — {legal?.forme}, capital {legal?.capital}. SIREN {legal?.siren} · TVA {legal?.tva}.
      </div>
    </footer>
  );
}
