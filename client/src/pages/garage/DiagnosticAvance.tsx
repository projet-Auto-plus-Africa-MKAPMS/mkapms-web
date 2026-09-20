import { Link } from "react-router-dom";
import { ChevronLeft, Search, AlertTriangle } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   DIAGNOSTIC AVANCÉ (/garage/diagnostic-avance)
   Les codes défaut (P0301, P0420…) proviennent d'un scanner OBD-II physique
   branché sur le véhicule : aucune intégration matérielle n'existe côté
   MKA.P-MS aujourd'hui. Afficher des codes fixes serait un diagnostic
   inventé sur un véhicule qu'on ne lit jamais réellement — jamais fait ici,
   contrairement à l'ancienne version de cet écran. « Capture écran » et
   « Exporter PDF » ont été retirés : exporter un diagnostic qui n'a jamais
   eu lieu serait la même fabrication, juste dans un fichier.
   ══════════════════════════════════════════════════════════════════════════ */

export default function DiagnosticAvance() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Search size={20} className="text-[#D4AF37]" /> Diagnostic avancé</h1></div>

      <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Scanner OBD-II non connecté</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Le diagnostic avancé nécessite un scanner OBD-II branché sur le véhicule. Aucune intégration matérielle
              n'est encore disponible sur MKA.P-MS : demandez un diagnostic à un garage partenaire via une demande de
              devis.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <Link
          to="/garage/prise-rendez-vous?type=Diagnostic"
          className="block w-full rounded-xl bg-[#D4AF37] py-3 text-center text-sm font-bold text-white active:scale-[0.98]"
        >
          Demander un diagnostic en garage
        </Link>
      </div>
    </div>
  );
}
