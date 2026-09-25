import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, ChevronRight } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { BoutonMoteur } from "../../lib/boutonMoteur";

const CLASSE_CARTE =
  "flex w-full items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 text-left active:scale-[0.99]";

/** Chaque carte porte un code littéral déclaré au Moteur de boutons (une action par démarche du catalogue). */
function CarteDemarche({ code, children }: { code: string; children: ReactNode }) {
  switch (code) {
    case "changement-adresse":
      return <BoutonMoteur code="demarches_ouvrir_changement_adresse" className={CLASSE_CARTE}>{children}</BoutonMoteur>;
    case "changement-titulaire":
      return <BoutonMoteur code="demarches_ouvrir_changement_titulaire" className={CLASSE_CARTE}>{children}</BoutonMoteur>;
    case "declaration-cession":
      return <BoutonMoteur code="demarches_ouvrir_declaration_cession" className={CLASSE_CARTE}>{children}</BoutonMoteur>;
    case "duplicata-demarche":
      return <BoutonMoteur code="demarches_ouvrir_duplicata_demarche" className={CLASSE_CARTE}>{children}</BoutonMoteur>;
    case "immatriculation-provisoire":
      return <BoutonMoteur code="demarches_ouvrir_immatriculation_provisoire" className={CLASSE_CARTE}>{children}</BoutonMoteur>;
    case "importation-vehicule":
      return <BoutonMoteur code="demarches_ouvrir_importation_vehicule" className={CLASSE_CARTE}>{children}</BoutonMoteur>;
    case "succession-vehicule":
      return <BoutonMoteur code="demarches_ouvrir_succession_vehicule" className={CLASSE_CARTE}>{children}</BoutonMoteur>;
    case "ww-garage":
      return <BoutonMoteur code="demarches_ouvrir_ww_garage" className={CLASSE_CARTE}>{children}</BoutonMoteur>;
    case "plaques-immatriculation":
      return <BoutonMoteur code="demarches_ouvrir_plaques_immatriculation" className={CLASSE_CARTE}>{children}</BoutonMoteur>;
    default:
      return null;
  }
}

/** Liste des démarches déclarées par le moteur Démarches ; chaque carte ouvre son écran de dépôt. */
export default function CarteGriseDemarche() {
  const catalogue = trpc.carteGrise.catalogue.useQuery(undefined, { staleTime: 300_000 });
  const demarches = catalogue.data?.demarches ?? [];
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Carte grise</h1></div>
      <div className="px-4 mt-4 space-y-2">
        {catalogue.isLoading && <p className="text-sm text-[#6B7280]">Chargement du catalogue…</p>}
        {demarches.map((d) => (
          <CarteDemarche key={d.code} code={d.code}>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#111]">{d.titre}{d.proUniquement && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">PRO</span>}</h3>
              <p className="text-[10px] text-[#6B7280]">{d.description}</p>
              <p className="mt-1 text-[9px] text-[#9CA3AF]">{d.pieces.filter((p) => p.obligatoire).length} pièce(s) obligatoire(s)</p>
            </div>
            <ChevronRight size={14} className="text-red-500" />
          </CarteDemarche>
        ))}
      </div>
    </div>
  );
}
