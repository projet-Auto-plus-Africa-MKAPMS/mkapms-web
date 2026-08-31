/**
 * Stock de pièces de l'atelier — lignes réellement tenues par le Moteur
 * d'Atelier (`atelierEngine.stock`), pas le catalogue public des pièces.
 *
 * L'écran affichait cinq références inventées avec une « valeur de stock »
 * calculée sur ces mêmes chiffres. Chaque écriture crée maintenant un
 * mouvement daté côté serveur, et une quantité au seuil publie
 * `atelier.stock_bas` sur l'Event Bus (alerte Système Intelligent).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Package, Search, AlertTriangle, ChevronDown, Plus } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { trpc } from "../../lib/trpc";

interface Saisie {
  reference: string;
  designation: string;
  quantite: string;
  seuil: string;
  prixAchat: string;
  prixVente: string;
  emplacement: string;
  motif: string;
}

const SAISIE_VIDE: Saisie = {
  reference: "",
  designation: "",
  quantite: "",
  seuil: "",
  prixAchat: "",
  prixVente: "",
  emplacement: "",
  motif: "",
};

function euros(cents: number | null): string {
  if (cents == null) return "—";
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}

export default function StockPieces() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [recherche, setRecherche] = useState("");
  const [saisie, setSaisie] = useState<Saisie>(SAISIE_VIDE);
  const [formOuvert, setFormOuvert] = useState(false);
  const [message, setMessage] = useState("");

  const stock = trpc.atelierEngine.stock.useQuery(undefined, { retry: false });

  const enregistrer = trpc.atelierEngine.enregistrerStock.useMutation({
    onSuccess: (l) => {
      setMessage(
        `Référence ${l.reference} enregistrée à ${l.quantite} en stock. Le mouvement est tracé avec votre nom et la date.`,
      );
      setSaisie(SAISIE_VIDE);
      setFormOuvert(false);
      stock.refetch();
    },
    onError: (e) => setMessage(e.message),
  });

  const lignes = stock.data?.lignes ?? [];
  const alertes = stock.data?.alertes ?? [];

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return lignes;
    return lignes.filter(
      (l) => l.reference.toLowerCase().includes(q) || l.designation.toLowerCase().includes(q),
    );
  }, [lignes, recherche]);

  // Valeur du stock : seulement sur les lignes dont le prix d'achat est
  // réellement renseigné. Une ligne sans prix n'est pas estimée à sa place.
  const valeur = useMemo(() => {
    const avecPrix = lignes.filter((l) => l.prixAchatCents != null);
    const total = avecPrix.reduce((s, l) => s + (l.prixAchatCents ?? 0) * l.quantite, 0);
    return { total, comptees: avecPrix.length, sansPrix: lignes.length - avecPrix.length };
  }, [lignes]);

  function envoyer() {
    if (!saisie.reference.trim() || !saisie.designation.trim()) {
      setMessage("Référence et désignation sont obligatoires : une ligne de stock sans référence n'est pas retrouvable.");
      return;
    }
    const quantite = Number(saisie.quantite);
    if (!Number.isInteger(quantite) || quantite < 0) {
      setMessage("Indiquez la quantité réellement en rayon (nombre entier, 0 accepté).");
      return;
    }
    enregistrer.mutate({
      reference: saisie.reference.trim(),
      designation: saisie.designation.trim(),
      quantite,
      seuil: saisie.seuil ? Number(saisie.seuil) : undefined,
      prixAchatCents: saisie.prixAchat ? Math.round(Number(saisie.prixAchat) * 100) : undefined,
      prixVenteCents: saisie.prixVente ? Math.round(Number(saisie.prixVente) * 100) : undefined,
      emplacement: saisie.emplacement.trim() || undefined,
      motif: saisie.motif.trim() || undefined,
    });
  }

  function preremplir(l: (typeof lignes)[number]) {
    setSaisie({
      reference: l.reference,
      designation: l.designation,
      quantite: String(l.quantite),
      seuil: String(l.seuil),
      prixAchat: l.prixAchatCents != null ? String(l.prixAchatCents / 100) : "",
      prixVente: l.prixVenteCents != null ? String(l.prixVenteCents / 100) : "",
      emplacement: l.emplacement ?? "",
      motif: "",
    });
    setFormOuvert(true);
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Garage
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Package size={20} className="text-[#D4AF37]" /> Stock pièces
        </h1>
        <p className="mt-1 text-sm text-white/60">Stock de votre atelier, distinct du catalogue public</p>
      </div>

      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-sm font-black text-[#D4AF37]">{lignes.length}</p>
          <p className="text-[8px] text-[#6B7280]">Références</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-sm font-black text-red-500">{alertes.length}</p>
          <p className="text-[8px] text-[#6B7280]">Alertes stock</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-sm font-black text-green-600">{euros(valeur.total)}</p>
          <p className="text-[8px] text-[#6B7280]">
            {valeur.sansPrix > 0 ? `${valeur.comptees} réf. chiffrées` : "Valeur du stock"}
          </p>
        </div>
      </div>

      {valeur.sansPrix > 0 && (
        <p className="mx-4 mt-2 text-[9px] text-[#6B7280]">
          {valeur.sansPrix} référence(s) sans prix d'achat renseigné ne sont pas comptées dans la valeur.
        </p>
      )}

      <div className="px-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-3">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par référence ou désignation…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="px-4 mt-3">
        <button
          type="button"
          onClick={() => setFormOuvert(!formOuvert)}
          className="w-full rounded-xl bg-white border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#111] flex items-center justify-center gap-1"
        >
          <Plus size={12} className="text-[#D4AF37]" />
          {formOuvert ? "Fermer la saisie" : "Ajouter ou corriger une référence"}
        </button>
      </div>

      {formOuvert && (
        <div className="mx-4 mt-2 rounded-xl bg-white border border-[#E5E7EB] p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={saisie.reference}
              onChange={(e) => setSaisie({ ...saisie, reference: e.target.value })}
              placeholder="Référence"
              className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
            <input
              type="text"
              value={saisie.emplacement}
              onChange={(e) => setSaisie({ ...saisie, emplacement: e.target.value })}
              placeholder="Emplacement"
              className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
          </div>
          <input
            type="text"
            value={saisie.designation}
            onChange={(e) => setSaisie({ ...saisie, designation: e.target.value })}
            placeholder="Désignation"
            className="w-full rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              value={saisie.quantite}
              onChange={(e) => setSaisie({ ...saisie, quantite: e.target.value })}
              placeholder="Qté"
              className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
            <input
              type="number"
              value={saisie.seuil}
              onChange={(e) => setSaisie({ ...saisie, seuil: e.target.value })}
              placeholder="Seuil"
              className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
            <input
              type="number"
              value={saisie.prixAchat}
              onChange={(e) => setSaisie({ ...saisie, prixAchat: e.target.value })}
              placeholder="Achat €"
              className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
            <input
              type="number"
              value={saisie.prixVente}
              onChange={(e) => setSaisie({ ...saisie, prixVente: e.target.value })}
              placeholder="Vente €"
              className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
          </div>
          <input
            type="text"
            value={saisie.motif}
            onChange={(e) => setSaisie({ ...saisie, motif: e.target.value })}
            placeholder="Motif du mouvement (réception, sortie chantier…)"
            className="w-full rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
          />
          <BoutonMoteur
            code="garage_stock_ajuster"
            className="block w-full rounded-lg bg-[#D4AF37] py-2 text-[11px] font-bold text-white text-center"
            onExecuter={envoyer}
          >
            {enregistrer.isPending ? "Enregistrement…" : "Enregistrer le stock"}
          </BoutonMoteur>
        </div>
      )}

      {message && (
        <p className="mx-4 mt-2 rounded-lg bg-white border border-[#E5E7EB] p-2 text-[11px] text-[#374151]">
          {message}
        </p>
      )}

      {stock.isError && (
        <p className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
          Stock indisponible : {stock.error.message}
        </p>
      )}

      {!stock.isLoading && !stock.isError && lignes.length === 0 && (
        <p className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 text-xs text-[#6B7280]">
          Aucune référence en stock pour l'instant. Rien n'est affiché ici qui ne vienne de votre stock réel.
        </p>
      )}

      <div className="px-4 mt-3 space-y-2">
        {filtrees.map((p) => {
          const isExp = expanded === p.id;
          const bas = p.seuil > 0 && p.quantite <= p.seuil;
          return (
            <div
              key={p.id}
              className={`rounded-xl bg-white border overflow-hidden ${bas ? "border-red-300" : "border-[#E5E7EB]"}`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExp ? null : p.id)}
                className="w-full text-left p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#111] truncate">{p.designation}</h3>
                    {bas && <AlertTriangle size={10} className="text-red-500" />}
                  </div>
                  <p className="text-[9px] text-[#6B7280]">
                    {p.reference}
                    {p.emplacement ? ` · ${p.emplacement}` : ""}
                  </p>
                </div>
                <span className={`text-xs font-bold ${bas ? "text-red-600" : "text-green-600"}`}>
                  {p.quantite}
                </span>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>

              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                      <span className="text-[#6B7280]">Achat</span>
                      <p className="font-bold">{euros(p.prixAchatCents)}</p>
                    </div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                      <span className="text-[#6B7280]">Vente</span>
                      <p className="font-bold">{euros(p.prixVenteCents)}</p>
                    </div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                      <span className="text-[#6B7280]">Stock</span>
                      <p className={`font-bold ${bas ? "text-red-600" : "text-green-600"}`}>{p.quantite}</p>
                    </div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                      <span className="text-[#6B7280]">Seuil</span>
                      <p className="font-bold">{p.seuil}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <BoutonMoteur
                      code="garage_stock_commander"
                      className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white text-center"
                      query={{ ref: p.reference }}
                    >
                      Commander
                    </BoutonMoteur>
                    <button
                      type="button"
                      onClick={() => preremplir(p)}
                      className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]"
                    >
                      Corriger la quantité
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
