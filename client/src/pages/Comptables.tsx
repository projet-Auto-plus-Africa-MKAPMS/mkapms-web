/**
 * MKA.P-MS — Centre comptable public.
 * L'annuaire reste isolé de la comptabilité interne : seuls les profils
 * externes publiés après vérification humaine sont recherchés ici.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Calculator, CalendarClock, CheckCircle2, FileCheck2, Info, Languages, Loader2, MapPin, Search, Send, ShieldCheck, Star } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const SPECIALITES = [
  { code: "tva", label: "TVA" },
  { code: "bilan", label: "Bilan & clôture" },
  { code: "paie", label: "Paie" },
  { code: "creation_entreprise", label: "Création d'entreprise" },
  { code: "fiscalite_auto", label: "Fiscalité automobile" },
  { code: "audit", label: "Audit" },
];
const LANGUES = [
  { code: "fr", label: "Français" }, { code: "en", label: "Anglais" }, { code: "ar", label: "Arabe" }, { code: "es", label: "Espagnol" },
];
const PAYS = [
  { code: "FR", label: "France" }, { code: "BE", label: "Belgique" }, { code: "ES", label: "Espagne" }, { code: "MA", label: "Maroc" }, { code: "TN", label: "Tunisie" }, { code: "SN", label: "Sénégal" }, { code: "CI", label: "Côte d’Ivoire" }, { code: "ML", label: "Mali" }, { code: "GN", label: "Guinée" },
];

export default function Comptables() {
  const { user } = useAuth();
  const [countryCode, setCountryCode] = useState("FR");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [language, setLanguage] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const results = trpc.accountingMarketplace.search.useQuery({ countryCode, city: city.trim() || undefined, specialty: specialty || undefined, language: language || undefined, availableOnly: availableOnly || undefined });
  const request = trpc.accountingMarketplace.requestAccountant.useMutation({ onSuccess: (_result, variables) => setSent(variables.accountantId ?? 0) });

  const chooseSpecialty = (code: string) => {
    setSpecialty(code);
    document.getElementById("annuaire-comptable")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F5F3EF] pb-16 text-[#111827]">
      <section className="relative isolate overflow-hidden bg-[#101824] px-4 pb-28 pt-8 text-white sm:px-6 sm:pb-32 sm:pt-12">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_75%_12%,rgba(56,189,248,.38),transparent_29%),radial-gradient(circle_at_20%_85%,rgba(212,175,55,.18),transparent_34%)]" />
        <div className="absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full border border-sky-300/20" />
        <div className="absolute -right-10 top-2 -z-10 h-72 w-72 rounded-full border border-sky-300/10" />
        <div className="mx-auto max-w-6xl">
          <Link to="/services" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white/85 backdrop-blur transition hover:border-[#EACD64] hover:bg-white/15"><ArrowRight size={14} className="rotate-180" /> Retour aux services</Link>
          <div className="grid items-center gap-8 pt-12 lg:grid-cols-[1.25fr_.75fr] lg:pt-16">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EACD64]/55 bg-[#D4AF37]/15 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-[#F4DC82]"><Calculator size={14} /> Centre comptable MKA.P-MS</div>
              <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-[1.03] tracking-tight sm:text-6xl lg:mx-0">Le bon cabinet, pour la bonne décision.</h1>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base lg:mx-0">Recherchez des comptables indépendants et des cabinets vérifiés selon votre pays, votre ville, votre besoin et votre langue. Une mise en relation claire, sans donner accès à vos données MKA.P-MS.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-2 text-xs font-bold text-white/90 lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2"><ShieldCheck size={14} className="text-[#F4DC82]" /> Fiches vérifiées</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2"><Languages size={14} className="text-[#7DD3FC]" /> Recherche par langue</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2"><FileCheck2 size={14} className="text-[#F4DC82]" /> Demande centralisée</span>
              </div>
            </div>
            <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 text-center shadow-[0_24px_60px_rgba(0,0,0,.2)] backdrop-blur sm:p-6">
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#F4DC82]">Un centre, plusieurs besoins</p>
              <div className="mt-5 space-y-4">{["Créer ou structurer une activité", "Suivre TVA, bilan ou paie", "Être accompagné sur votre activité automobile"].map((item, index) => <div key={item} className="flex items-center justify-center gap-3 text-sm font-semibold text-white/90"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-black text-[#7DD3FC]">0{index + 1}</span>{item}</div>)}</div>
              <a href="#annuaire-comptable" className="mx-auto mt-6 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#0284C7] px-4 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(14,165,233,.28)] transition hover:from-[#0EA5E9] hover:to-[#0369A1]">Trouver mon comptable <ArrowRight size={17} /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-4 sm:-mt-20 sm:px-6" id="annuaire-comptable">
        <div className="rounded-[30px] border border-white/85 bg-white p-5 shadow-[0_24px_60px_rgba(5,12,22,.18)] sm:p-7">
          <div className="flex flex-col items-center gap-4 border-b border-slate-100 pb-5 text-center"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.14em] text-[#0d7391]">Annuaire vérifié</p><h2 className="mt-1 text-2xl font-black tracking-tight text-[#111827]">Affinez votre recherche</h2><p className="mt-1 text-sm leading-6 text-slate-500">Choisissez ce qui compte pour vous. Les résultats se mettent à jour automatiquement.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0d7391]/10 px-3 py-2 text-xs font-bold text-[#0d7391]"><Search size={14} /> {results.data?.length ?? 0} résultat{(results.data?.length ?? 0) > 1 ? "s" : ""}</span></div>
          <div className="mt-5 grid grid-cols-1 gap-4 min-[500px]:grid-cols-2 lg:grid-cols-4">
            <label className="min-w-0 text-center text-sm font-bold text-slate-700 min-[500px]:text-left"><span className="mb-2 block">Pays</span><select className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-3 text-center font-semibold text-[#111827] outline-none transition focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/15 min-[500px]:text-left" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{PAYS.map((country) => <option key={country.code} value={country.code}>{country.label}</option>)}</select></label>
            <label className="text-sm font-bold text-slate-700"><span className="mb-2 block">Ville</span><input className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-3 text-center font-semibold text-[#111827] outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/15 min-[500px]:text-left" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Toutes les villes" /></label>
            <label className="text-sm font-bold text-slate-700"><span className="mb-2 block">Spécialité</span><select className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-3 font-semibold text-[#111827] outline-none transition focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/15" value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">Toutes les spécialités</option>{SPECIALITES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
            <label className="text-sm font-bold text-slate-700"><span className="mb-2 block">Langue</span><select className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-3 font-semibold text-[#111827] outline-none transition focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/15" value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">Toutes les langues</option>{LANGUES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
          </div>
          <label className="mx-auto mt-4 flex w-full max-w-sm cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:border-[#38BDF8]/50"><input type="checkbox" className="h-4 w-4 accent-[#0d7391]" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> Disponibles seulement</label>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10" aria-live="polite">
        {results.isLoading && <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-[#0d7391]" /> Recherche des fiches vérifiées…</div>}
        {results.data && results.data.length === 0 && <div className="rounded-[28px] border border-[#EACD64]/65 bg-[#FFFCED] p-6 text-center shadow-[0_12px_28px_rgba(17,17,17,.04)] sm:p-8"><div className="flex flex-col items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D4AF37]/15 text-[#B8860B]"><Info size={23} /></span><div className="max-w-2xl"><h3 className="text-xl font-black text-[#111827]">Aucun comptable vérifié pour cette recherche.</h3><p className="mt-2 text-sm leading-6 text-slate-600">L’annuaire ne présente que des fiches contrôlées. Élargissez la ville ou la spécialité, plutôt que d’afficher un résultat non vérifié.</p></div><button type="button" onClick={() => { setCity(""); setSpecialty(""); setLanguage(""); setAvailableOnly(false); }} className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border border-[#38BDF8]/45 bg-white px-4 py-3 text-center text-sm font-black text-[#0d7391] shadow-[0_8px_18px_rgba(14,165,233,.08)] transition hover:border-[#38BDF8] hover:bg-[#EFFBFF]"><Search size={16} /> Élargir la recherche</button></div></div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.data?.map((accountant) => <article key={accountant.id} className="flex flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(17,17,17,.05)] transition hover:-translate-y-0.5 hover:border-[#38BDF8]/45 hover:shadow-[0_18px_36px_rgba(14,165,233,.12)]"><div className="flex items-start justify-between gap-3"><div><p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.13em] text-[#0d7391]"><CheckCircle2 size={13} /> Fiche vérifiée</p><h3 className="mt-2 text-lg font-black text-[#111827]">{accountant.displayName}</h3><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} /> {[accountant.city, accountant.countryCode].filter(Boolean).join(", ")}</p></div>{accountant.noteAffichable !== null ? <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-black text-[#8A6807]"><Star className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" /> {accountant.noteAffichable} <span className="font-medium text-slate-400">({accountant.ratingCount})</span></span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">Nouveau profil</span>}</div>{accountant.specialties.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{accountant.specialties.map((item) => <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{SPECIALITES.find((known) => known.code === item)?.label ?? item}</span>)}</div>}<div className="mt-4 grid grid-cols-2 gap-2 text-xs"><span className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-600"><Languages className="mr-1 inline h-3.5 w-3.5 text-[#0d7391]" />{accountant.languages.join(", ")}</span><span className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-600">{accountant.tarif ?? "Sur devis"}</span></div><p className="mt-3 text-xs font-bold text-[#0d7391]">{accountant.availability === "disponible" ? "Disponible" : accountant.availability === "complet" ? "Complet" : "Sur rendez-vous"}</p>{accountant.bio && <p className="mt-3 text-sm leading-6 text-slate-600">{accountant.bio}</p>}{user ? <button type="button" disabled={request.isPending} onClick={() => request.mutate({ accountantId: accountant.id, countryCode, city: city.trim() || undefined, specialty: specialty || undefined })} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#0284C7] px-4 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(14,165,233,.24)] transition hover:from-[#0EA5E9] hover:to-[#0369A1] disabled:opacity-50"><Send size={16} /> {sent === accountant.id ? "Demande envoyée" : "Contacter ce cabinet"}</button> : <Link to="/connexion" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#0284C7] px-4 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(14,165,233,.24)] transition hover:from-[#0EA5E9] hover:to-[#0369A1]"><Send size={16} /> Se connecter pour contacter</Link>}</article>)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6"><div className="grid gap-3 md:grid-cols-3">{SPECIALITES.map((item) => <button key={item.code} type="button" onClick={() => chooseSpecialty(item.code)} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-[0_8px_20px_rgba(17,17,17,.04)] transition hover:border-[#38BDF8]/50 hover:shadow-[0_12px_26px_rgba(14,165,233,.1)]"><span className="font-black text-[#111827]">{item.label}</span><ArrowRight size={17} className="text-[#0d7391] transition group-hover:translate-x-1" /></button>)}</div></section>

      <section className="border-y border-[#D4AF37]/20 bg-white px-4 py-10 sm:px-6"><div className="mx-auto max-w-6xl"><div className="grid gap-4 md:grid-cols-3"><TrustCard icon={<ShieldCheck size={21} />} title="Confiance avant tout" text="Une fiche n’apparaît dans l’annuaire qu’après vérification humaine." tone="blue" /><TrustCard icon={<CalendarClock size={21} />} title="Recherche sans détour" text="Pays, ville, spécialité, langue et disponibilité pour cibler le bon interlocuteur." tone="gold" /><TrustCard icon={<Building2 size={21} />} title="Cabinets & indépendants" text="Des profils pensés pour les particuliers, professionnels et activités automobiles." tone="blue" /></div><div className="mt-8 flex flex-col items-center gap-5 rounded-[28px] bg-[#101824] p-6 text-center text-white sm:p-8"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.14em] text-[#F4DC82]">Vous êtes comptable ?</p><h2 className="mt-2 text-2xl font-black">Présentez votre cabinet sur MKA.P-MS.</h2><p className="mt-2 text-sm leading-6 text-white/70">Choisissez l’activité Cabinet Comptable dans l’espace professionnel pour préparer votre dossier.</p></div><Link to="/espace-pro" className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#0284C7] px-5 py-3 text-center text-sm font-black text-white shadow-[0_10px_24px_rgba(14,165,233,.28)] transition hover:from-[#0EA5E9] hover:to-[#0369A1]">Référencer mon cabinet <ArrowRight size={17} /></Link></div></div></section>

      <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="grid gap-8 border-b border-slate-200 pb-8 md:grid-cols-[1.3fr_1fr_1fr]"><div><p className="text-lg font-black">MKA.P-MS <span className="text-[#B8860B]">Comptabilité</span></p><p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">Un point d’entrée public pour trouver un interlocuteur comptable vérifié, sans confusion avec les données internes de la plateforme.</p></div><div><p className="text-sm font-black text-[#111827]">Explorer</p><div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600"><a href="#annuaire-comptable" className="hover:text-[#0d7391]">Trouver un comptable</a><Link to="/pres-de-moi?service=comptable" className="hover:text-[#0d7391]">Comptable près de moi</Link><Link to="/espace-pro" className="hover:text-[#0d7391]">Référencer mon cabinet</Link></div></div><div><p className="text-sm font-black text-[#111827]">Confiance & aide</p><div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600"><Link to="/confiance" className="hover:text-[#0d7391]">Centre de confiance</Link><Link to="/confidentialite" className="hover:text-[#0d7391]">Confidentialité</Link><Link to="/aide" className="hover:text-[#0d7391]">Aide & questions</Link></div></div></div><p className="pt-6 text-xs font-semibold text-slate-500">Les prestations, délais et conditions sont définis par chaque professionnel. MKA.P-MS ne remplace pas un conseil comptable, fiscal ou juridique.</p></footer>
    </main>
  );
}

function TrustCard({ icon, title, text, tone }: { icon: React.ReactNode; title: string; text: string; tone: "blue" | "gold" }) {
  return <div className="rounded-3xl border border-slate-100 p-6 text-center"><span className={`mx-auto grid h-11 w-11 place-items-center rounded-2xl ${tone === "blue" ? "bg-[#0d7391]/10 text-[#0d7391]" : "bg-[#D4AF37]/12 text-[#B8860B]"}`}>{icon}</span><h2 className="mt-4 text-base font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>;
}
