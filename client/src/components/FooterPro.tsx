/**
 * MKA.P-MS — Pied de page du portail B2B
 * Colonnes : MKA.P-MS · Professionnels · Investisseurs · Partenaires ·
 * Assistance · Informations légales. Tous les liens pointent vers des
 * pages réellement construites (voir audit avant construction).
 */
import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Linkedin } from "lucide-react";
import { trpc } from "../lib/trpc";
import { Logo } from "./Logo";

/* Icône TikTok (absente de lucide-react) — même style que les autres réseaux. */
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.3 2 1.5 3.6 3.5 3.9v2.6c-1.2.1-2.4-.2-3.5-.8v5.9c0 3.2-2.6 5.4-5.5 5.4S5.5 17.8 5.5 14.9 8 9.6 10.9 9.9v2.7c-.4-.1-.8-.2-1.2-.1-1.2.1-2.1 1.1-2 2.3.1 1.2 1.1 2.1 2.3 2 1.2-.1 2-1 2-2.2V3h2.5z" />
    </svg>
  );
}

/** Icône par famille de canal social configurée côté PDG (aucune marque codée en dur ailleurs). */
const ICONE_RESEAU: Record<string, React.ElementType> = {
  video_court: TikTokIcon,
  video_long: Youtube,
  photo: Instagram,
  general: Facebook,
  pro: Linkedin,
};

export default function FooterPro() {
  const { data: legal } = trpc.meta.legal.useQuery();
  const { data: reseauxData } = trpc.visibilityOs.reseauxPublics.useQuery(undefined, { staleTime: 300_000 });
  const reseaux = reseauxData ?? [];

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

        {reseaux.length > 0 && (
          <div className="mt-8 flex items-center gap-2.5 border-t border-white/5 pt-6">
            {reseaux.map((r) => {
              const Ic = ICONE_RESEAU[r.connector] ?? Facebook;
              return (
                <a
                  key={r.channelKey}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={r.label}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-[#D4AF37] hover:text-white transition"
                >
                  <Ic size={16} />
                </a>
              );
            })}
          </div>
        )}
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-white/30">
        © {new Date().getFullYear()} {legal?.raisonSociale} — {legal?.forme}, capital {legal?.capital}. SIREN {legal?.siren} · TVA {legal?.tva}.
      </div>
    </footer>
  );
}
