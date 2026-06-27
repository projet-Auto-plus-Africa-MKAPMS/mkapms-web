export default function Mission() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-12 pt-16 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-[#111] sm:text-5xl">
          Pourquoi l'Automobile&nbsp;?
        </h1>
        <div className="mx-auto h-1 w-20 rounded bg-[#D4AF37]" />
      </section>

      {/* Corps du texte */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <p className="mb-8 text-lg leading-relaxed text-[#374151]">
          L'automobile est bien plus qu'un moyen de transport.
        </p>
        <p className="mb-8 text-lg leading-relaxed text-[#374151]">
          Depuis toujours, elle relie les personnes, les familles, les entreprises et les opportunités.
          Elle accompagne les déplacements du quotidien, le travail, les voyages, les projets
          et parfois même les rêves.
        </p>
        <p className="mb-8 text-lg leading-relaxed text-[#374151]">
          C'est pour cette raison que l'automobile est devenue le <strong className="text-[#111]">premier pilier de MKA.P-MS</strong>.
        </p>
        <p className="mb-10 text-lg leading-relaxed text-[#374151]">
          Nous avons choisi de commencer par ce secteur parce qu'il touche la vie de millions de personnes chaque jour.
        </p>

        {/* Actions clés */}
        <div className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Acheter un véhicule",
            "Vendre un véhicule",
            "Réparer un véhicule",
            "Trouver une pièce",
            "Louer un véhicule",
            "Développer une activité professionnelle",
          ].map((t) => (
            <div key={t} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-sm text-white">✓</span>
              <span className="text-sm font-medium text-[#111]">{t}</span>
            </div>
          ))}
        </div>

        <p className="mb-8 text-lg leading-relaxed text-[#374151]">
          Toutes ces étapes font partie d'un même écosystème.
        </p>

        {/* Constat */}
        <blockquote className="mb-10 border-l-4 border-[#D4AF37] pl-6">
          <p className="text-lg font-medium italic text-[#111]">
            Notre constat était simple&nbsp;: les services existent, mais ils sont souvent dispersés.
            Les utilisateurs doivent multiplier les plateformes, les démarches et les interlocuteurs.
          </p>
        </blockquote>

        <p className="mb-8 text-lg leading-relaxed text-[#374151]">
          <strong className="text-[#111]">MKA.P-MS</strong> est né avec l'ambition de réunir ces services dans un environnement unique, organisé et évolutif.
        </p>
        <p className="mb-10 text-lg leading-relaxed text-[#374151]">
          Notre objectif n'est pas uniquement de faciliter les transactions.
          Nous voulons <strong className="text-[#111]">simplifier l'expérience globale de l'automobile</strong>.
        </p>

        {/* Écosystème */}
        <h2 className="mb-6 text-2xl font-bold text-[#111]">Un écosystème complet</h2>
        <div className="mb-12 grid gap-3 sm:grid-cols-2">
          {[
            { icon: "🚗", label: "Vente de véhicules" },
            { icon: "🔑", label: "Location" },
            { icon: "🔧", label: "Garage+" },
            { icon: "⚙", label: "Pièces automobiles" },
            { icon: "🚚", label: "Livraison" },
            { icon: "🆘", label: "Dépannage" },
            { icon: "📋", label: "Démarches administratives" },
            { icon: "📊", label: "Historique véhicule" },
            { icon: "💼", label: "Services professionnels" },
            { icon: "🌍", label: "Solutions internationales" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-4 py-3">
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-medium text-[#111]">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="mb-12 rounded-2xl bg-[#111] px-8 py-10 text-center">
          <p className="text-lg leading-relaxed text-white/80">
            L'automobile est notre point de départ.
          </p>
          <p className="mt-4 text-xl font-bold text-[#D4AF37]">
            Mais notre véritable mission est plus large&nbsp;:
          </p>
          <p className="mt-3 text-lg leading-relaxed text-white">
            Créer des services utiles, fiables et accessibles qui accompagnent les utilisateurs dans leurs projets et leur quotidien.
          </p>
        </div>

        <p className="mb-8 text-lg leading-relaxed text-[#374151]">
          Nous avançons étape par étape, avec une vision de long terme.
        </p>
        <p className="text-lg leading-relaxed text-[#374151]">
          Parce que les grandes réalisations commencent souvent par une première passion,
          puis grandissent grâce au travail, à la confiance et à la persévérance.
        </p>

        {/* Signature */}
        <div className="mt-16 border-t border-[#E5E7EB] pt-8 text-center">
          <div className="mx-auto h-1 w-12 rounded bg-[#D4AF37]" />
          <p className="mt-4 text-lg font-bold text-[#111]">MKA.P-MS</p>
          <p className="mt-1 text-sm tracking-widest text-[#D4AF37]">LA MARKETPLACE AUTOMOBILE</p>
        </div>
      </section>
    </div>
  );
}
