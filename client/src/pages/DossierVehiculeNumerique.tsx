import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Car, Plus, FileText, Camera, Calendar,
  Wrench, Shield, Fuel, Gauge, Eye, Clock, CheckCircle,
  AlertTriangle, Download, ChevronRight, Search, Settings
} from "lucide-react";
import { DocumentView, buildFactureData } from "../components/DocumentPDF";

/* ══════════════════════════════════════════════════════════════════════════
   DOSSIER VEHICULE NUMERIQUE — Carnet de sante du vehicule
   Vidanges, freins, pneus, embrayage, distribution, CT, factures, photos
   Relie a Vente, Location, Garage. Historique complet pour revente.
   ══════════════════════════════════════════════════════════════════════════ */

type DVTab = "resume" | "entretiens" | "reparations" | "ct" | "factures" | "photos";

interface Entretien {
  id: number;
  type: string;
  date: string;
  km: string;
  garage: string;
  montant: string;
  details: string;
  statut: "fait" | "a_prevoir" | "en_retard";
}

const DEMO_VEHICLE = {
  marque: "Peugeot", modele: "3008 GT Hybrid", annee: 2024, plaque: "AB-123-CD",
  vin: "VF3MCYHZRML123456", km: "15 200 km", energie: "Hybride", boite: "Automatique",
  puissance: "225 ch", couleur: "Gris Artense", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&h=300&fit=crop",
  prochainCT: "15/03/2026", prochainEntretien: "25 000 km ou 12/2024",
};

const ENTRETIENS: Entretien[] = [
  { id: 1, type: "Vidange moteur + filtres", date: "20/05/2024", km: "15 000 km", garage: "Garage Auto Express", montant: "189 EUR", details: "Huile 5W30 Total Quartz + filtre huile + filtre air + filtre habitacle", statut: "fait" },
  { id: 2, type: "Plaquettes de freins avant", date: "15/04/2024", km: "14 200 km", garage: "Garage Auto Express", montant: "185 EUR", details: "Plaquettes ATE ceramique + verification disques OK", statut: "fait" },
  { id: 3, type: "Pneus ete x4", date: "01/04/2024", km: "14 000 km", garage: "Garage Pneus+", montant: "480 EUR", details: "Michelin Primacy 4+ 225/55 R18", statut: "fait" },
  { id: 4, type: "Revision 30 000 km", date: "-", km: "30 000 km", garage: "-", montant: "-", details: "Vidange + filtres + bougies + liquide frein + controle general", statut: "a_prevoir" },
  { id: 5, type: "Courroie de distribution", date: "-", km: "120 000 km ou 5 ans", garage: "-", montant: "-", details: "Courroie + galet tendeur + pompe a eau", statut: "a_prevoir" },
];

const REPARATIONS = [
  { id: 1, type: "Capteur de pression pneu", date: "10/03/2024", km: "13 500 km", garage: "Garage Auto Express", montant: "95 EUR", details: "Remplacement capteur roue AVG" },
  { id: 2, type: "Essuie-glaces avant", date: "15/01/2024", km: "12 000 km", garage: "Self-service", montant: "35 EUR", details: "Bosch Aerotwin A638S" },
];

const CT_HISTORY = [
  { id: 1, date: "15/03/2024", resultat: "Favorable", centre: "Centre CT Vincennes", validite: "15/03/2026", defauts: "0 defaut majeur, 1 defaut mineur (eclairage)", remarque: "Usure pneus AR 3mm — surveiller" },
];

const FACTURES = [
  { id: 1, ref: "FAC-2024-0542", objet: "Revision + freins", montant: "374 EUR", date: "20/05/2024", garage: "Garage Auto Express" },
  { id: 2, ref: "FAC-2024-0398", objet: "Pneus ete x4", montant: "480 EUR", date: "01/04/2024", garage: "Garage Pneus+" },
  { id: 3, ref: "FAC-2024-0287", objet: "Capteur pression", montant: "95 EUR", date: "10/03/2024", garage: "Garage Auto Express" },
  { id: 4, ref: "FAC-2024-0105", objet: "Essuie-glaces", montant: "35 EUR", date: "15/01/2024", garage: "Self-service" },
];

const PHOTOS_CAT = [
  { cat: "Exterieur", count: 8, thumb: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=200&h=150&fit=crop" },
  { cat: "Interieur", count: 5, thumb: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=150&fit=crop" },
  { cat: "Moteur", count: 3, thumb: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=200&h=150&fit=crop" },
  { cat: "Entretien", count: 4, thumb: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=200&h=150&fit=crop" },
  { cat: "CT / Documents", count: 2, thumb: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=150&fit=crop" },
  { cat: "Dommages", count: 1, thumb: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=200&h=150&fit=crop" },
];

export default function DossierVehiculeNumerique() {
  const [tab, setTab] = useState<DVTab>("resume");
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [viewFactureDV, setViewFactureDV] = useState<{ ref: string; objet: string; montant: string; date: string; garage: string } | null>(null);
  const v = DEMO_VEHICLE;

  const tabItems: { id: DVTab; label: string; icon: typeof Car }[] = [
    { id: "resume", label: "Resume", icon: Car },
    { id: "entretiens", label: "Entretiens", icon: Wrench },
    { id: "reparations", label: "Reparations", icon: Settings },
    { id: "ct", label: "CT", icon: Shield },
    { id: "factures", label: "Factures", icon: FileText },
    { id: "photos", label: "Photos", icon: Camera },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Hero vehicule */}
      <div className="relative">
        <img src={v.photo} alt={`${v.marque} ${v.modele}`} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link to="/compte" className="flex items-center gap-1 text-sm text-white/80"><ChevronLeft size={14} /> Mon compte</Link>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-black text-white">{v.marque} {v.modele}</h1>
          <p className="text-sm text-white/80">{v.plaque} . {v.annee} . {v.km}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {tabItems.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        {/* Resume */}
        {tab === "resume" && (
          <div className="space-y-3">
            {/* Fiche technique */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <h3 className="text-sm font-bold text-[#111] mb-3">Fiche technique</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Marque", v.marque], ["Modele", v.modele], ["Annee", String(v.annee)],
                  ["Energie", v.energie], ["Boite", v.boite], ["Puissance", v.puissance],
                  ["Couleur", v.couleur], ["Kilometrage", v.km], ["Plaque", v.plaque],
                  ["VIN", v.vin],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-1 border-b border-[#F3F4F6]">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-bold text-[#111]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prochaines echeances */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <h3 className="text-sm font-bold text-[#111] mb-3">Prochaines echeances</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                  <Shield size={16} className="text-green-600" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#111]">Controle technique</p>
                    <p className="text-[10px] text-slate-500">Prochain: {v.prochainCT}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">OK</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3">
                  <Wrench size={16} className="text-amber-600" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#111]">Prochain entretien</p>
                    <p className="text-[10px] text-slate-500">{v.prochainEntretien}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">Bientot</span>
                </div>
              </div>
            </div>

            {/* Resume entretiens */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <h3 className="text-sm font-bold text-[#111] mb-2">Historique rapide</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[#F5F3EF] p-3">
                  <p className="text-lg font-black text-[#D4AF37]">{ENTRETIENS.filter((e) => e.statut === "fait").length}</p>
                  <p className="text-[10px] text-slate-500">Entretiens</p>
                </div>
                <div className="rounded-lg bg-[#F5F3EF] p-3">
                  <p className="text-lg font-black text-[#D4AF37]">{REPARATIONS.length}</p>
                  <p className="text-[10px] text-slate-500">Reparations</p>
                </div>
                <div className="rounded-lg bg-[#F5F3EF] p-3">
                  <p className="text-lg font-black text-[#D4AF37]">{FACTURES.length}</p>
                  <p className="text-[10px] text-slate-500">Factures</p>
                </div>
              </div>
            </div>

            {/* Avantage revente */}
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#222] p-4">
              <h3 className="text-sm font-bold text-[#D4AF37] mb-1">Avantage revente</h3>
              <p className="text-xs text-white/70">Quand vous revendez ce vehicule, l'acheteur verra immediatement tout l'historique, les factures et les entretiens. Le vehicule inspire plus confiance.</p>
            </div>
          </div>
        )}

        {/* Entretiens */}
        {tab === "entretiens" && (
          <div className="space-y-2">
            <button className="w-full rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 p-3 flex items-center justify-center gap-2 text-sm font-bold text-[#D4AF37]">
              <Plus size={16} /> Ajouter un entretien
            </button>
            {ENTRETIENS.map((e) => (
              <div key={e.id} className={`rounded-xl bg-white border overflow-hidden ${e.statut === "en_retard" ? "border-red-300" : e.statut === "a_prevoir" ? "border-amber-200" : "border-[#E5E7EB]"}`}>
                <button onClick={() => setExpandedItem(expandedItem === e.id ? null : e.id)} className="w-full text-left p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#111] flex items-center gap-2">
                        {e.type}
                        {e.statut === "fait" && <CheckCircle size={14} className="text-green-500" />}
                        {e.statut === "a_prevoir" && <Clock size={14} className="text-amber-500" />}
                        {e.statut === "en_retard" && <AlertTriangle size={14} className="text-red-500" />}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{e.details}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{e.garage !== "-" ? `${e.garage} · ` : ""}{e.date !== "-" ? e.date : ""} · {e.km}</p>
                    </div>
                    {e.montant !== "-" && <p className="text-sm font-bold text-[#D4AF37]">{e.montant}</p>}
                  </div>
                </button>
                {expandedItem === e.id && (
                  <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Type</span><p className="font-bold text-[#111]">{e.type}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Garage</span><p className="font-bold text-[#111]">{e.garage}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Km</span><p className="font-bold text-[#111]">{e.km}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Montant</span><p className="font-bold text-[#D4AF37]">{e.montant}</p></div>
                    </div>
                    <button onClick={() => setViewFactureDV({ ref: `FAC-ENT-${e.id}`, objet: e.type, montant: e.montant, date: e.date, garage: e.garage })} className="w-full rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Voir facture</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reparations */}
        {tab === "reparations" && (
          <div className="space-y-2">
            <button className="w-full rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 p-3 flex items-center justify-center gap-2 text-sm font-bold text-[#D4AF37]">
              <Plus size={16} /> Ajouter une reparation
            </button>
            {REPARATIONS.map((r) => (
              <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <button onClick={() => setExpandedItem(expandedItem === r.id + 100 ? null : r.id + 100)} className="w-full text-left p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#111]">{r.type}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.details}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{r.garage} · {r.date} · {r.km}</p>
                    </div>
                    <p className="text-sm font-bold text-[#D4AF37]">{r.montant}</p>
                  </div>
                </button>
                {expandedItem === r.id + 100 && (
                  <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Reparation</span><p className="font-bold text-[#111]">{r.type}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Garage</span><p className="font-bold text-[#111]">{r.garage}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Km</span><p className="font-bold text-[#111]">{r.km}</p></div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Montant</span><p className="font-bold text-[#D4AF37]">{r.montant}</p></div>
                    </div>
                    <button onClick={() => setViewFactureDV({ ref: `FAC-REP-${r.id}`, objet: r.type, montant: r.montant, date: r.date, garage: r.garage })} className="w-full rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Voir facture</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CT */}
        {tab === "ct" && (
          <div className="space-y-3">
            <button className="w-full rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 p-3 flex items-center justify-center gap-2 text-sm font-bold text-[#D4AF37]">
              <Plus size={16} /> Ajouter un controle technique
            </button>
            {CT_HISTORY.map((ct) => (
              <div key={ct.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#111]">CT du {ct.date}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ct.resultat === "Favorable" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{ct.resultat}</span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-slate-500">Centre: {ct.centre}</p>
                  <p className="text-slate-500">Validite: {ct.validite}</p>
                  <p className="text-slate-500">Defauts: {ct.defauts}</p>
                  {ct.remarque && <p className="text-amber-600 font-semibold">Remarque: {ct.remarque}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Factures */}
        {tab === "factures" && (
          <div className="space-y-2">
            <button className="w-full rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 p-3 flex items-center justify-center gap-2 text-sm font-bold text-[#D4AF37]">
              <Plus size={16} /> Ajouter une facture
            </button>
            {FACTURES.map((f) => (
              <div key={f.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#111]">{f.objet}</p>
                  <p className="text-xs text-slate-500">{f.ref} . {f.garage}</p>
                  <p className="text-[10px] text-slate-400">{f.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#D4AF37]">{f.montant}</p>
                  <button onClick={() => setViewFactureDV({ ref: f.ref, objet: f.objet, montant: f.montant, date: f.date, garage: f.garage })} className="rounded-lg bg-[#F5F3EF] p-1.5"><Download size={14} className="text-slate-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photos */}
        {tab === "photos" && (
          <div className="space-y-3">
            <button className="w-full rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 p-3 flex items-center justify-center gap-2 text-sm font-bold text-[#D4AF37]">
              <Camera size={16} /> Ajouter des photos
            </button>
            <div className="grid grid-cols-2 gap-2">
              {PHOTOS_CAT.map((p) => (
                <div key={p.cat} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <img src={p.thumb} alt={p.cat} className="w-full h-24 object-cover" />
                  <div className="p-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111]">{p.cat}</span>
                    <span className="text-[10px] text-slate-400">{p.count} photos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {viewFactureDV && (
        <DocumentView
          doc={buildFactureData({ ref: viewFactureDV.ref, objet: viewFactureDV.objet, client: `${v.marque} ${v.modele} — ${v.plaque}`, montant: viewFactureDV.montant, date: viewFactureDV.date, statut: "Paye", type: "Entretien" })}
          onClose={() => setViewFactureDV(null)}
        />
      )}
    </div>
  );
}
