import { useState } from "react";
import { Link } from "react-router-dom";
import { Car, Star, Search, MapPin, ArrowRight, Shield, Clock, Users, KeyRound } from "lucide-react";
import { trpc } from "../lib/trpc";
import VehicleCard from "../components/VehicleCard";

/* ── annonces VTC/Taxi démo ── */
const DEMO_VTC = [
  { id: 9201, titre: "Mercedes Classe E 220d", marque: "Mercedes", modele: "Classe E", annee: 2023, kilometrage: 15000, carburant: "Diesel", prix: 120, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 120, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=280&fit=crop" },
  { id: 9202, titre: "Tesla Model 3 Long Range", marque: "Tesla", modele: "Model 3", annee: 2024, kilometrage: 5000, carburant: "Électrique", prix: 135, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 135, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=280&fit=crop" },
  { id: 9203, titre: "Toyota Camry Hybride", marque: "Toyota", modele: "Camry", annee: 2023, kilometrage: 20000, carburant: "Hybride", prix: 95, type: "location", ville: "Lyon", vendeurType: "professionnel", prixJour: 95, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=280&fit=crop" },
  { id: 9204, titre: "BMW Série 5 530e Hybride", marque: "BMW", modele: "Série 5", annee: 2023, kilometrage: 12000, carburant: "Hybride", prix: 140, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 140, segmentLocation: "vtc_taxi", boosted: true, photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=280&fit=crop" },
  { id: 9205, titre: "Peugeot 508 GT Hybride", marque: "Peugeot", modele: "508", annee: 2024, kilometrage: 3000, carburant: "Hybride", prix: 110, type: "location", ville: "Marseille", vendeurType: "professionnel", prixJour: 110, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=280&fit=crop" },
  { id: 9206, titre: "Skoda Superb Combi", marque: "Skoda", modele: "Superb", annee: 2023, kilometrage: 18000, carburant: "Diesel", prix: 85, type: "location", ville: "Toulouse", vendeurType: "professionnel", prixJour: 85, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=280&fit=crop" },
  { id: 9207, titre: "Mercedes Classe V 250d", marque: "Mercedes", modele: "Classe V", annee: 2022, kilometrage: 25000, carburant: "Diesel", prix: 160, type: "location", ville: "Nice", vendeurType: "professionnel", prixJour: 160, segmentLocation: "vtc_taxi", boosted: true, photoPrincipale: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=280&fit=crop" },
  { id: 9208, titre: "Volkswagen ID.4 Pro", marque: "Volkswagen", modele: "ID.4", annee: 2024, kilometrage: 2000, carburant: "Électrique", prix: 115, type: "location", ville: "Bordeaux", vendeurType: "professionnel", prixJour: 115, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=280&fit=crop" },
  { id: 9209, titre: "Hyundai Ioniq 6", marque: "Hyundai", modele: "Ioniq 6", annee: 2024, kilometrage: 1000, carburant: "Électrique", prix: 130, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 130, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=280&fit=crop" },
];

const DEMO_TAXI = [
  { id: 9301, titre: "Peugeot e-208 Taxi", marque: "Peugeot", modele: "e-208", annee: 2024, kilometrage: 2000, carburant: "Électrique", prix: 90, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 90, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=280&fit=crop" },
  { id: 9302, titre: "Citroën ë-C4 Taxi", marque: "Citroën", modele: "ë-C4", annee: 2023, kilometrage: 10000, carburant: "Électrique", prix: 80, type: "location", ville: "Lyon", vendeurType: "professionnel", prixJour: 80, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop" },
  { id: 9303, titre: "Toyota Prius Taxi", marque: "Toyota", modele: "Prius", annee: 2023, kilometrage: 30000, carburant: "Hybride", prix: 75, type: "location", ville: "Marseille", vendeurType: "professionnel", prixJour: 75, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=280&fit=crop" },
  { id: 9304, titre: "Renault Mégane E-Tech Taxi", marque: "Renault", modele: "Mégane E-Tech", annee: 2024, kilometrage: 5000, carburant: "Électrique", prix: 95, type: "location", ville: "Bordeaux", vendeurType: "professionnel", prixJour: 95, segmentLocation: "vtc_taxi", boosted: true, photoPrincipale: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=400&h=280&fit=crop" },
  { id: 9305, titre: "Dacia Spring Taxi", marque: "Dacia", modele: "Spring", annee: 2024, kilometrage: 1000, carburant: "Électrique", prix: 55, type: "location", ville: "Lille", vendeurType: "professionnel", prixJour: 55, segmentLocation: "vtc_taxi", photoPrincipale: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=280&fit=crop" },
];

export default function VtcTaxi() {
  const [type, setType] = useState<"" | "vtc" | "taxi" | "mixte">("");
  const companies = trpc.transport.companies.useQuery({ type: type || undefined, limit: 40 });

  const filteredVtc = type === "taxi" ? [] : DEMO_VTC;
  const filteredTaxi = type === "vtc" ? [] : DEMO_TAXI;

  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-extrabold text-[#111]">VTC / TAXI — Location professionnelle</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Véhicules conformes VTC et Taxi. Location longue durée, gestion de flotte, contrats et documents professionnels.
      </p>

      {/* ── Avantages ── */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Shield, title: "Véhicules conformes", desc: "Normes VTC & Taxi respectées" },
          { icon: Clock, title: "Dispo immédiate", desc: "Véhicule prêt sous 48h" },
          { icon: Users, title: "Support dédié", desc: "Équipe pro 7j/7" },
          { icon: KeyRound, title: "Contrat flexible", desc: "Semaine, mois ou longue durée" },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.title} className="flex flex-col items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white p-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10">
                <Icon size={18} className="text-[#D4AF37]" />
              </div>
              <h3 className="text-xs font-bold text-[#111]">{a.title}</h3>
              <p className="text-[9px] text-[#6B7280]">{a.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filtres ── */}
      <div className="mt-6 flex gap-2">
        {(["", "vtc", "taxi", "mixte"] as const).map((t) => (
          <button
            key={t || "all"}
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${type === t ? "bg-[#111] text-[#D4AF37]" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"}`}
          >
            {t === "" ? "Tous" : t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Annonces VTC ── */}
      {filteredVtc.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#111]">Location VTC</h2>
            <span className="inline-flex items-center rounded-full bg-[#111] px-2.5 py-0.5 text-[9px] font-bold text-[#D4AF37] border border-[#D4AF37]">VTC</span>
          </div>
          <p className="mt-1 text-xs text-[#6B7280]">Véhicules haut de gamme pour chauffeurs VTC — Mercedes, BMW, Tesla</p>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {filteredVtc.map((v: any) => (
              <div key={v.id} className="w-[220px] shrink-0 snap-start">
                <VehicleCard v={v as any} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Annonces TAXI ── */}
      {filteredTaxi.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#111]">Location Taxi</h2>
            <span className="inline-flex items-center rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[9px] font-bold text-white">TAXI</span>
          </div>
          <p className="mt-1 text-xs text-[#6B7280]">Véhicules conformes Taxi — économiques et fiables</p>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {filteredTaxi.map((v: any) => (
              <div key={v.id} className="w-[220px] shrink-0 snap-start">
                <VehicleCard v={v as any} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sociétés partenaires (si DB) ── */}
      {companies.data && companies.data.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-[#111]">Sociétés partenaires</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {companies.data.map((c) => (
              <div key={c.id} className="rounded-xl border-2 border-[#111]/30 bg-white p-5" style={{boxShadow: '0 0 8px rgba(212,175,55,0.15)'}}>
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#D4AF37]/10"><Car size={18} className="text-[#D4AF37]" /></span>
                  <h3 className="font-bold text-[#111]">{c.nom}</h3>
                </div>
                <p className="mt-2 text-xs uppercase tracking-wide text-[#D4AF37]">{c.type}</p>
                {c.countryCode && <p className="mt-1 text-sm text-[#6B7280]">{c.countryCode}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <div className="mt-10 rounded-2xl border-2 border-[#D4AF37] bg-[#D4AF37]/5 p-6 text-center">
        <h2 className="text-xl font-bold text-[#111]">Vous êtes chauffeur VTC ou Taxi ?</h2>
        <p className="mt-2 text-sm text-[#6B7280]">Louez un véhicule conforme à votre activité. Contrats flexibles, assurance incluse, support 7j/7.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to="/louer?segment=vtc_taxi" className="inline-flex items-center gap-2 rounded-full bg-[#111] px-6 py-3 text-sm font-bold text-white hover:bg-[#333] transition">
            <Search size={16} /> Voir les véhicules disponibles
          </Link>
          <Link to="/demande-publicite" className="inline-flex items-center gap-2 rounded-full border-2 border-[#D4AF37] px-6 py-3 text-sm font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">
            Devenir partenaire <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
