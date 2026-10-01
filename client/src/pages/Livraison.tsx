import { useState } from "react";
import { Truck, AlertTriangle, CheckCircle, Loader2, Calculator, ShieldCheck, MapPin, Clock3, FileCheck2, PackageCheck, Globe2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { BoutonMoteur } from "../lib/boutonMoteur";
import { useCurrency } from "../lib/currency";
import { WORLD_COUNTRIES } from "@shared/countries";

export default function Livraison() {
  const { country, setCountry, format } = useCurrency();
  const [poids, setPoids] = useState(5);
  const [distance, setDistance] = useState(10);
  const [urgent, setUrgent] = useState(false);
  const [longueur, setLongueur] = useState(40);
  const [largeur, setLargeur] = useState(30);
  const [hauteur, setHauteur] = useState(30);
  const [heavyPart, setHeavyPart] = useState(false);
  const providers = trpc.livraison.providers.useQuery({ country: country || undefined, limit: 100 });
  // La query se déclenche automatiquement, mais on garde aussi un bouton
  // explicite pour rassurer l'utilisateur et permettre un recalcul volontaire.
  const quote = trpc.livraison.quote.useQuery(
    {
      poidsKg: poids,
      distanceKm: distance,
      urgent,
      longueurCm: longueur,
      largeurCm: largeur,
      hauteurCm: hauteur,
      heavyPart,
      countryCode: country || undefined,
    },
    { enabled: poids > 0 },
  );
  const isCalculating = quote.isFetching;

  function handleCalculate() {
    // Force un recalcul en réinjectant les paramètres actuels.
    quote.refetch();
    // Scroll doux vers la carte estimation.
    setTimeout(() => {
      const el = document.getElementById("livraison-estimation");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 text-[#111]">
      <header className="relative overflow-hidden border-b border-white/10 bg-[#101010] px-4 py-10 text-white sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,.16),transparent_36%),radial-gradient(circle_at_20%_85%,rgba(13,115,145,.18),transparent_30%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_46px_rgba(212,175,55,.18)]"><PackageCheck size={30} /></div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[.24em] text-[#D4AF37]">Logistique pièces & marchandises MKA.P-MS</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Livraison simple, suivie et transparente</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">Pour les pièces, accessoires et commandes de l’écosystème MKA.P‑MS. Le tarif affiché dépend toujours du pays, du poids, du volume et du niveau de service sélectionné.</p>
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[.12em] text-white/70"><span>Devis clair</span><span className="h-1 w-1 rounded-full bg-[#D4AF37]"/><span>Suivi</span><span className="h-1 w-1 rounded-full bg-[#D4AF37]"/><span>Paiement sécurisé</span></div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mt-6 space-y-6 sm:mt-8">
        <BoutonMoteur code="livraison_colis_vers_vehicule" className="group flex items-center gap-4 rounded-3xl border border-[#D4AF37]/45 bg-white p-5 shadow-[0_14px_34px_rgba(17,17,17,.08)] transition hover:border-[#D4AF37] hover:shadow-[0_18px_40px_rgba(212,175,55,.16)]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5F3EF]"><Truck size={21} className="text-[#D4AF37]" /></div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-base font-black text-[#111]">Faire livrer un véhicule ou un camion</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">Voiture, utilitaire, camion, engin, bus — devis d’acheminement réel</p>
          </div>
          <span className="hidden text-xs font-black text-[#B8962E] sm:block">Demander un devis →</span>
        </BoutonMoteur>

        <section className="grid gap-2 rounded-3xl border border-[#D4AF37]/30 bg-white p-3 shadow-[0_14px_34px_rgba(17,17,17,.06)] sm:grid-cols-3 sm:p-4">
          <div className="flex items-center gap-3 p-2"><ShieldCheck size={20} className="shrink-0 text-[#0d7391]"/><p className="text-xs font-semibold leading-5 text-slate-700">Commande confirmée avant toute demande de paiement.</p></div>
          <div className="flex items-center gap-3 border-y border-slate-100 p-2 sm:border-x sm:border-y-0"><Clock3 size={20} className="shrink-0 text-[#D4AF37]"/><p className="text-xs font-semibold leading-5 text-slate-700">Délais annoncés selon le service disponible, jamais inventés.</p></div>
          <div className="flex items-center gap-3 p-2"><Globe2 size={20} className="shrink-0 text-[#0d7391]"/><p className="text-xs font-semibold leading-5 text-slate-700">Pays, monnaie et réseau local pris en compte dans le devis.</p></div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,.92fr)] lg:items-start">
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,17,17,.06)] sm:p-6">
          <h2 className="text-xs font-black text-[#111] uppercase tracking-widest mb-6 flex items-center gap-2">
            <div className="h-1 w-4 bg-[#D4AF37] rounded-full"></div> Calculer un tarif
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-2 block">Pays de livraison</label>
              <select value={country ?? ""} onChange={(event) => setCountry(event.target.value)} className="w-full h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all" aria-label="Pays de livraison">
                <option value="">Sélectionner un pays</option>
                {WORLD_COUNTRIES.map((item) => <option key={item.code} value={item.code}>{item.flag} {item.name}</option>)}
              </select>
              {country ? <p className="mt-2 text-xs text-slate-500">{providers.isLoading ? "Recherche du réseau local…" : `${providers.data?.length ?? 0} partenaire${(providers.data?.length ?? 0) > 1 ? "s" : ""} de livraison dans ce pays.`}</p> : <p className="mt-2 text-xs text-slate-500">Choisissez un pays pour consulter uniquement son réseau de livraison.</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-2 block">Poids (kg)</label>
              <input type="number" className="w-full h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-5 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all" value={poids} onChange={(e) => setPoids(Number(e.target.value))} />
            </div>

            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-2 block">Dimensions (cm — L × l × h)</label>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" className="h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all text-center" value={longueur} onChange={(e) => setLongueur(Number(e.target.value))} />
                <input type="number" className="h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all text-center" value={largeur} onChange={(e) => setLargeur(Number(e.target.value))} />
                <input type="number" className="h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all text-center" value={hauteur} onChange={(e) => setHauteur(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-2 block">Distance (km)</label>
              <input type="number" className="w-full h-14 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-5 text-sm font-bold outline-none focus:border-[#D4AF37] transition-all" value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 group cursor-pointer">
                <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${heavyPart ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-white border-[#E5E7EB]"}`}>
                  {heavyPart && <CheckCircle size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={heavyPart} onChange={(e) => setHeavyPart(e.target.checked)} />
                <span className="text-xs font-bold text-[#374151] group-hover:text-[#111]">Pièce mécanique lourde (moteur, capot...)</span>
              </label>

              <label className="flex items-center gap-3 group cursor-pointer">
                <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${urgent ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-white border-[#E5E7EB]"}`}>
                  {urgent && <CheckCircle size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
                <span className="text-xs font-bold text-[#374151] group-hover:text-[#111]">Livraison urgente</span>
              </label>
            </div>

            {/* Bouton premium — Calculer le tarif */}
            <button
              onClick={handleCalculate}
              disabled={isCalculating || poids <= 0}
              aria-label="Calculer le tarif de livraison"
              className="w-full h-16 mt-3 rounded-2xl bg-gradient-to-br from-[#111] to-[#1f1f1f] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest text-[#D4AF37] active:scale-[0.97] transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-[#D4AF37]/30 disabled:opacity-50 disabled:cursor-not-allowed border border-[#D4AF37]/20"
            >
              {isCalculating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Calcul en cours…
                </>
              ) : quote.data ? (
                <>
                  <Calculator size={18} />
                  Recalculer le tarif
                </>
              ) : (
                <>
                  <Calculator size={18} />
                  Calculer le tarif
                </>
              )}
            </button>
          </div>
        </div>

        <div id="livraison-estimation" className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,17,17,.06)] sm:p-6 lg:sticky lg:top-6">
          <h2 className="text-xs font-black text-[#111] uppercase tracking-widest mb-6 flex items-center gap-2">
            <div className="h-1 w-4 bg-[#D4AF37] rounded-full"></div> Estimation
          </h2>

          {isCalculating && !quote.data ? (
            <div className="py-10 text-center">
              <div className="h-20 w-20 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
                <Loader2 size={36} className="text-[#D4AF37] animate-spin" />
              </div>
              <p className="text-[10px] font-bold text-[#111] uppercase tracking-widest">
                Calcul en cours…
              </p>
            </div>
          ) : quote.isError ? (
            <div className="py-10 text-center">
              <div className="h-20 w-20 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={36} className="text-red-500" />
              </div>
              <p className="text-[11px] font-bold text-red-700 uppercase tracking-widest mb-3">
                Erreur lors du calcul
              </p>
              <button
                onClick={handleCalculate}
                className="text-[10px] font-black text-[#D4AF37] underline uppercase tracking-widest"
              >
                Réessayer
              </button>
            </div>
          ) : quote.data ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#111] tracking-tighter italic sm:text-5xl">{quote.data.tarif == null ? "Tarif indisponible" : format(quote.data.tarif)}</span>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-[#F9FAFB] p-4 border border-[#E5E7EB]">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-[#E5E7EB] text-[#D4AF37]">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-[#6B7280] uppercase tracking-widest">Véhicule recommandé</p>
                    <p className="text-sm font-black text-[#111]">{quote.data.recommendedVehicleType}</p>
                  </div>
                </div>

                {!quote.data.motoAllowed && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                      {quote.data.reason
                        ? `${quote.data.reason} — moto impossible, ${quote.data.recommendedVehicleType} recommandé.`
                        : `Colis trop lourd/volumineux pour une moto — ${quote.data.recommendedVehicleType} requis.`}
                    </p>
                  </div>
                )}
              </div>
              
	              <div className="mt-8">
	                <button 
	                  disabled={quote.data.tarif == null}
	                  onClick={() => { if (quote.data.tarif != null) window.location.href = "/compte/validation?type=livraison&amount=" + quote.data.tarif; }}
	                  className="w-full h-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-sm font-black uppercase tracking-widest text-[#111] active:scale-[0.97] transition-all shadow-xl shadow-[#D4AF37]/20 hover:bg-[#B8962E]"
	                >
	                  Confirmer et commander la livraison
	                </button>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="h-px w-8 bg-[#E5E7EB]"></div>
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">Paiement sécurisé Finance+</p>
                  <div className="h-px w-8 bg-[#E5E7EB]"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="h-20 w-20 rounded-3xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4 text-[#E5E7EB]">
                <Truck size={40} />
              </div>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                Renseignez les informations du colis pour obtenir un tarif instantané.
              </p>
            </div>
          )}
        </div>
        </div>

        <section className="grid gap-4 rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,17,17,.06)] sm:grid-cols-3 sm:p-7">
          <div><MapPin size={22} className="text-[#D4AF37]"/><h2 className="mt-3 text-sm font-black text-[#111]">Adresse et accessibilité</h2><p className="mt-1 text-xs leading-5 text-slate-600">Vérifiez l’adresse, le pays, le code postal et les contraintes d’accès avant la commande.</p></div>
          <div><FileCheck2 size={22} className="text-[#0d7391]"/><h2 className="mt-3 text-sm font-black text-[#111]">Contenu déclaré</h2><p className="mt-1 text-xs leading-5 text-slate-600">Le poids, les dimensions et la nature de la pièce doivent correspondre à l’envoi réel.</p></div>
          <div><ShieldCheck size={22} className="text-[#D4AF37]"/><h2 className="mt-3 text-sm font-black text-[#111]">International</h2><p className="mt-1 text-xs leading-5 text-slate-600">Les documents et coûts de douane sont précisés lorsqu’une règle pays est disponible ; sinon la commande n’est pas présentée comme finalisée.</p></div>
        </section>
      </div>
      </main>
    </div>
  );
}
