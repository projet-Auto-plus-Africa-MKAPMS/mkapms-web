import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Sparkles, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { trpc } from "../../lib/trpc";

const AUDIENCE_LABELS: Record<string, string> = {
  decouverte: "Découverte / Essai / Crédits",
  particulier: "Particuliers",
  professionnel: "Professionnels",
  developpeur: "Développeurs",
  automobile: "Automobile (add-on)",
  marchand: "Marchands & e-commerce",
  equipe: "Équipes & organisations",
  specialise: "Offres spécialisées",
};

interface EditState {
  price: string;
  active: boolean;
  refundPolicy: string;
}

export default function AdminTarifsIA() {
  const utils = trpc.useUtils();
  const catalog = trpc.iaCommerce.adminCatalog.useQuery();
  const margins = trpc.iaCommerce.adminMargins.useQuery();
  const seed = trpc.iaCommerce.adminSeed.useMutation({ onSuccess: () => { utils.iaCommerce.adminCatalog.invalidate(); utils.iaCommerce.adminMargins.invalidate(); } });
  const upsert = trpc.iaCommerce.adminUpsert.useMutation({ onSuccess: () => { utils.iaCommerce.adminCatalog.invalidate(); utils.iaCommerce.adminMargins.invalidate(); } });
  const setActive = trpc.iaCommerce.adminSetActive.useMutation({ onSuccess: () => { utils.iaCommerce.adminCatalog.invalidate(); utils.iaCommerce.adminMargins.invalidate(); } });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

  const chargement = catalog.isLoading || margins.isLoading;
  const erreur = catalog.error || margins.error;
  const margeByCode = new Map((margins.data ?? []).map((m) => [m.code, m]));

  const parAudience = new Map<string, typeof catalog.data>();
  for (const p of catalog.data ?? []) {
    const audience = (p.meta?.audience as string) ?? "autre";
    const liste = parAudience.get(audience) ?? [];
    liste.push(p);
    parAudience.set(audience, liste as any);
  }

  const nbActifs = (catalog.data ?? []).filter((p) => p.active).length;
  const nbTotal = catalog.data?.length ?? 0;

  function openEdit(code: string, price: number, active: boolean, refundPolicy: string | null) {
    setExpanded(expanded === code ? null : code);
    setEdit({ price: String(price), active, refundPolicy: refundPolicy ?? "" });
  }

  function save(p: NonNullable<typeof catalog.data>[number]) {
    if (!edit) return;
    upsert.mutate({
      code: p.code,
      name: p.name,
      paymentCase: p.paymentCase,
      price: Number(edit.price),
      currency: p.currency,
      vatRate: p.vatRate,
      countryCode: p.countryCode,
      paymentType: p.paymentType === "recurring" ? "recurring" : "unique",
      periodicity: p.periodicity as any,
      validityDays: p.validityDays,
      refundPolicy: edit.refundPolicy || null,
      active: edit.active,
      metadata: p.metadata,
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Sparkles size={20} className="text-[#D4AF37]" /> Tarifs AL-HOUDOUD·M</h1>
        <p className="mt-1 text-xs text-white/50">
          {chargement ? "Chargement…" : `${nbActifs} offre(s) active(s) sur ${nbTotal} — modifiez le prix ou activez une offre ci-dessous, sans toucher au code.`}
        </p>
        <button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white"
        >
          {seed.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Amorcer la grille recommandée (n'écrase jamais un prix déjà modifié)
        </button>
        {seed.data && <p className="mt-1 text-[10px] text-white/40">{seed.data.inserted} offre(s) ajoutée(s), {seed.data.total} au total dans le registre.</p>}
      </div>

      <div className="mx-4 mt-4 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-3 text-[11px] text-[#7A5B00]">
        Tant qu'une offre reste inactive, elle n'apparaît sur aucune page commerciale et ne peut pas être achetée. Aucun prélèvement réel, aucun renouvellement automatique, aucune publication commerciale tant que vous ne l'activez pas ici.
      </div>

      {chargement && <div className="flex justify-center py-10 text-[#6B7280]"><Loader2 className="animate-spin" size={20} /></div>}
      {erreur && !chargement && <p className="px-4 py-6 text-sm text-red-600">Données indisponibles : {erreur.message}</p>}
      {!chargement && !erreur && nbTotal === 0 && (
        <p className="px-4 py-6 text-sm text-[#6B7280]">Registre vide — cliquez sur « Amorcer la grille recommandée » pour charger la proposition du PDG.</p>
      )}

      <div className="px-4 mt-4 space-y-5">
        {[...parAudience.entries()].map(([audience, produits]) => (
          <div key={audience}>
            <h2 className="text-xs font-black uppercase tracking-wide text-[#6B7280] mb-2">{AUDIENCE_LABELS[audience] ?? audience}</h2>
            <div className="space-y-2">
              {(produits ?? []).map((p) => {
                const isExp = expanded === p.code;
                const marge = margeByCode.get(p.code);
                return (
                  <div key={p.code} className={`rounded-xl bg-white border overflow-hidden ${p.active ? "border-[#D4AF37]/50" : "border-[#E5E7EB] opacity-80"}`}>
                    <button onClick={() => openEdit(p.code, p.price, p.active, p.refundPolicy)} className="w-full text-left p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#111]">{p.meta?.tier ?? p.name} <span className="text-[10px] text-[#9CA3AF] font-normal">({p.meta?.periodiciteLabel ?? "—"})</span></p>
                        <p className="text-[10px] text-[#6B7280]">
                          {p.meta?.creditsInclus ?? 0} unités incluses · coût réel estimé {marge?.coutReelEstimeEur?.toFixed(2) ?? "?"} € · marge {marge?.margeEur?.toFixed(2) ?? "?"} € {marge?.margePct != null ? `(${marge.margePct}%)` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.active ? "ACTIVE" : "BROUILLON"}</span>
                        <span className="text-sm font-black text-[#D4AF37]">{p.price.toLocaleString("fr-FR")} €</span>
                        <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {isExp && edit && (
                      <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                        {p.meta?.features && (
                          <ul className="text-[10px] text-[#6B7280] list-disc pl-4 space-y-0.5">
                            {p.meta.features.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-[10px] text-[#6B7280]">
                            Prix (€)
                            <input
                              type="number" step="0.01" value={edit.price}
                              onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                              className="mt-0.5 w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-sm font-bold text-[#111]"
                            />
                          </label>
                          <label className="text-[10px] text-[#6B7280] flex items-center gap-2 mt-4">
                            <input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />
                            Offre active (visible et achetable)
                          </label>
                        </div>
                        <label className="text-[10px] text-[#6B7280] block">
                          Conditions / politique de remboursement
                          <textarea
                            value={edit.refundPolicy} onChange={(e) => setEdit({ ...edit, refundPolicy: e.target.value })}
                            className="mt-0.5 w-full rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-xs text-[#111]" rows={2}
                          />
                        </label>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => save(p)}
                            disabled={upsert.isPending}
                            className="flex-1 rounded-lg bg-[#111] text-white text-xs font-bold py-2"
                          >
                            {upsert.isPending ? "Enregistrement…" : "Enregistrer le prix"}
                          </button>
                          <button
                            onClick={() => setActive.mutate({ code: p.code, active: !p.active })}
                            disabled={setActive.isPending}
                            className={`rounded-lg px-3 py-2 text-xs font-bold ${p.active ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
                          >
                            {p.active ? "Désactiver" : "Activer"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
