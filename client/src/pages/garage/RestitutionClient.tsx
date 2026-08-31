import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check, FileText, Euro, Download, Car } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { imprimerFeuille } from "../../lib/documents";

const ETAPES = [
  { cle: "signature", label: "Signature client", icon: FileText },
  { cle: "facture", label: "Facture remise", icon: Euro },
  { cle: "paiement", label: "Paiement encaissé", icon: Euro },
  { cle: "archivage", label: "Dossier archivé", icon: Download },
] as const;

export default function RestitutionClient() {
  const [faites, setFaites] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const restantes = ETAPES.filter(e => !faites[e.cle]);

  function editerBon() {
    if (restantes.length > 0) {
      setMessage(`À faire avant la restitution : ${restantes.map(e => e.label.toLowerCase()).join(", ")}.`);
      return;
    }
    const ok = imprimerFeuille({
      titre: "Bon de restitution",
      sousTitre: "Atelier — remise du véhicule au client",
      informations: ETAPES.map(e => ({ libelle: e.label, valeur: "Fait" })),
      mentions: [
        "Les étapes cochées le sont par l'atelier sur cet appareil : elles ne sont pas encore enregistrées côté serveur, donc ce bon n'a pas valeur de preuve de paiement.",
      ],
      typeDocument: "export_donnees",
    });
    setMessage(
      ok
        ? "Bon de restitution ouvert : imprimez-le et faites-le signer au client."
        : "La fenêtre d'impression a été bloquée par le navigateur : autorisez les fenêtres pour ce site.",
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Restitution</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <p className="text-sm font-bold text-[#111]">Étapes de restitution</p>
        <p className="text-[10px] text-[#6B7280]">À cocher par l'atelier au fur et à mesure. Rien n'est coché d'avance : une étape non faite ne doit pas apparaître comme validée.</p>
      </div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        {ETAPES.map(e => (
          <button
            key={e.cle}
            type="button"
            onClick={() => setFaites(f => ({ ...f, [e.cle]: !f[e.cle] }))}
            className="flex w-full items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0 text-left"
          >
            <e.icon size={14} className="text-[#D4AF37]" />
            <span className="flex-1 text-sm text-[#111]">{e.label}</span>
            {faites[e.cle]
              ? <Check size={14} className="text-green-600" />
              : <div className="h-4 w-4 rounded-full border-2 border-[#D4D4D4]" />}
          </button>))}
        <div className="pt-1 space-y-2">
          <BoutonMoteur
            code="garage_restitution_bon"
            className="block w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white text-center active:scale-[0.98]"
            onExecuter={editerBon}
          >
            Éditer le bon de restitution
          </BoutonMoteur>
          <BoutonMoteur
            code="garage_restitution_facture"
            className="block w-full rounded-xl bg-white border border-[#E5E7EB] py-3 text-sm font-bold text-[#111] text-center"
          >
            Facturer le dossier
          </BoutonMoteur>
        </div>
        {message && <p className="rounded-lg bg-[#F5F3EF] p-2 text-[11px] text-[#374151]">{message}</p>}
      </div>
    </div>
  );
}
