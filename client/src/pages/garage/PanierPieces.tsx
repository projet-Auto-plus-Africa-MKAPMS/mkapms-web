import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import {
  lirePanier,
  retirerDuPanier,
  viderPanier,
  totauxPanier,
  pieceParRef,
} from "../../lib/panierPieces";

export default function PanierPieces() {
  const { user } = useAuth();
  const [lignes, setLignes] = useState(() => lirePanier());
  const [erreur, setErreur] = useState("");
  const [reference, setReference] = useState("");
  const totaux = totauxPanier(lignes);

  const commander = trpc.devis.create.useMutation({
    onSuccess: (d) => {
      setErreur("");
      setReference(`DEV-${d.id}`);
      setLignes(viderPanier());
    },
    onError: (e) => {
      setReference("");
      setErreur(e.message);
    },
  });

  function envoyer() {
    if (!user) {
      setErreur("Connecte-toi pour envoyer la commande à l'atelier.");
      return;
    }
    if (lignes.length === 0) return;
    const avecMontage = lignes.some((l) => l.montage);
    const detail = lignes
      .map((l) => {
        const p = pieceParRef(l.ref);
        if (!p) return "";
        return `${l.quantite} × ${p.label} (${p.ref}, ${p.marque}) — ${p.prix} €${l.montage ? ` + montage ${p.montagePrix} €` : ""}`;
      })
      .filter(Boolean)
      .join("\n");
    commander.mutate({
      contactNom: user.name,
      contactEmail: user.email,
      typeIntervention: avecMontage ? "Commande de pièces avec montage" : "Commande de pièces",
      description: `${detail}\n\nPièces : ${totaux.pieces} €\nMontage : ${totaux.montage} €\nTotal indicatif : ${totaux.total} €`,
      devisType: avecMontage ? "pieces_main_oeuvre" : "pieces_seules",
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage/boutique-pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Boutique</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><ShoppingCart size={20} className="text-[#D4AF37]" /> Mon panier</h1></div>

      {reference && (
        <div className="mx-4 mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-xs text-green-700">
          Commande enregistrée sous la référence <span className="font-bold">{reference}</span>. Elle est suivie dans ton compte, l'atelier confirme les prix et la disponibilité.
        </div>
      )}

      {lignes.length === 0 ? (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
          <p className="text-sm text-[#6B7280]">Ton panier est vide.</p>
          <Link to="/garage/boutique-pieces" className="mt-3 block rounded-xl bg-[#D4AF37] py-2.5 text-center text-sm font-bold text-white">Parcourir la boutique</Link>
        </div>
      ) : (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          {lignes.map((l) => {
            const p = pieceParRef(l.ref);
            if (!p) return null;
            return (
              <div key={`${l.ref}-${l.montage}`} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6]">
                <div className="flex-1">
                  <h3 className="text-sm text-[#111]">{l.quantite > 1 ? `${l.quantite} × ` : ""}{p.label}</h3>
                  <p className="text-[9px] text-[#6B7280]">{p.ref}</p>
                  {l.montage && <p className="text-[9px] text-[#D4AF37]">+ Montage {p.montagePrix} €</p>}
                </div>
                <span className="text-sm font-bold">{(p.prix + (l.montage ? p.montagePrix : 0)) * l.quantite} €</span>
                <button
                  onClick={() => setLignes(retirerDuPanier(l.ref, l.montage))}
                  aria-label={`Retirer ${p.label}`}
                  className="text-[#9CA3AF]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Pièces</span><span className="font-bold">{totaux.pieces} €</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Montage</span><span className="font-bold">{totaux.montage} €</span></div>
          <div className="flex justify-between pt-2 border-t-2 border-[#D4AF37] text-base"><span className="font-black">Total indicatif</span><span className="font-black text-[#D4AF37]">{totaux.total} €</span></div>
          {erreur && <p className="text-xs text-red-600">{erreur}</p>}
          <button
            onClick={envoyer}
            disabled={commander.isPending}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
          >
            {commander.isPending && <Loader2 size={14} className="animate-spin" />}
            {commander.isPending ? "Envoi…" : "Commander"}
          </button>
          <p className="text-[9px] text-[#6B7280]">Le total est indicatif : l'atelier confirme le prix et la disponibilité avant facturation.</p>
        </div>
      )}
    </div>
  );
}
