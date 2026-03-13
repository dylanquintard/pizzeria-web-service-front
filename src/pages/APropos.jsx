import { Link } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { SITE_URL } from "../config/env";

export default function APropos() {
  const companyName = "Pizza Truck";
  const title = `A propos | ${companyName}, camion pizza napolitaine en Moselle`;
  const description =
    `${companyName} est un camion pizza en Moselle, actif autour de Metz et Thionville, avec une carte courte, une cuisson bois-gaz et un retrait organise.`;
  const rootUrl = new URL("/", `${SITE_URL}/`).toString();
  const menuUrl = new URL("/menu", `${SITE_URL}/`).toString();

  const localFoodTruckJsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodTruck",
    name: companyName,
    description:
      "Camion pizza en Moselle, proche Metz et Thionville, proposant des pizzas a emporter avec cuisson bois-gaz.",
    servesCuisine: "Pizza Napolitaine",
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "Moselle",
      },
      {
        "@type": "City",
        name: "Thionville",
      },
      {
        "@type": "City",
        name: "Metz",
      },
    ],
    priceRange: "EUR EUR",
    url: rootUrl,
    hasMenu: menuUrl,
  };

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={title}
        description={description}
        pathname="/a-propos"
        jsonLd={localFoodTruckJsonLd}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">A propos</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          {companyName}, un camion pizza pense pour bien servir la Moselle
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          {companyName} est une structure mobile qui travaille la pizza avec une logique simple: une pate preparee
          serieusement, une cuisson vive et un service organise pour le retrait.
        </p>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          Le camion se deplace chaque semaine autour de Thionville, Metz et d autres communes de Moselle pour proposer
          une offre plus nette que la restauration rapide standard.
        </p>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          L objectif n est pas d en faire trop. Il est de sortir une pizza reguliere, chaude et bien tenue au moment
          ou le client la recupere.
        </p>
        <Link
          to="/planing"
          className="inline-flex rounded-full border border-saffron/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
        >
          Voir les emplacements et horaires
        </Link>
      </header>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Une presence mobile, pas un point fixe</h2>
        <p className="mt-3 text-sm text-stone-300">
          Le camion n est pas pense comme une simple version roulante d une pizzeria classique. Le format mobile impose
          un autre rythme, une autre organisation et une autre lecture du service.
        </p>
        <p className="mt-3 text-sm text-stone-300">
          La tournee permet de venir au plus pres des clients, sans sacrifier la cuisson minute ni la qualite de
          sortie du four.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
          <li>passages hebdomadaires en Moselle</li>
          <li>secteurs proches de Thionville et Metz</li>
          <li>retrait direct sur les points annonces dans le planning</li>
        </ul>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Une inspiration napolitaine prise au serieux</h2>
        <p className="mt-3 text-sm text-stone-300">
          La reference napolitaine ne sert pas ici d emballage marketing. Elle guide surtout la maniere de travailler
          la pate, de doser la garniture et de gerer le four.
        </p>
        <p className="mt-3 text-sm text-stone-300">
          Cela passe par une pate souple, une cuisson courte, une bordure bien developpee et une recette qui reste
          lisible jusqu a la derniere bouchee.
        </p>
        <p className="mt-3 text-sm text-stone-300">
          Le but n est pas de reproduire un folklore. Le but est de garder un produit coherent, bien execute et
          regulier.
        </p>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Une pate preparee pour tenir le service</h2>
        <p className="mt-3 text-sm text-stone-300">
          La qualite d une pizza commence longtemps avant la cuisson. La pate est preparee en amont pour gagner en
          souplesse, en regularite et en confort de degustation.
        </p>
        <p className="mt-3 text-sm text-stone-300">
          Cette methode permet de garder un meilleur equilibre entre legerete, tenue et reactivite au four.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
          <li>texture plus aerienne</li>
          <li>faconnage plus stable</li>
          <li>meilleure regularite pendant la tournee</li>
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white">Une carte courte pour mieux tenir la qualite</h2>
          <p className="mt-3 text-sm text-stone-300">
            Une carte trop large fatigue la production et brouille le produit. Ici, le choix est inverse.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
            <li>produits italiens selectionnes pour leur tenue</li>
            <li>recettes construites avec plus de retenue</li>
            <li>execution plus fiable d un service a l autre</li>
          </ul>
        </article>
        <article className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white">Un retrait simple a suivre</h2>
          <p className="mt-3 text-sm text-stone-300">
            Le fonctionnement par creneaux permet de mieux organiser la cuisson et de limiter l attente autour du
            camion.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-stone-300">
            <li>Choisissez votre pizza</li>
            <li>Selectionnez votre creneau</li>
            <li>Recuperez la commande directement au camion</li>
          </ol>
          <p className="mt-3 text-sm text-stone-300">
            Ce format protege a la fois le rythme du service et la qualite de la pizza remise au client.
          </p>
        </article>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Ou trouver le camion en Moselle ?</h2>
        <p className="mt-3 text-sm text-stone-300">
          {companyName} se deplace chaque semaine sur plusieurs communes de Moselle, autour de Thionville, Metz et des
          secteurs voisins.
        </p>
        <p className="mt-3 text-sm text-stone-300">
          Les lieux de passage et les horaires ne sont pas figes. Ils suivent la tournee publiee sur le planning.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/planing"
            className="rounded-full border border-saffron/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
          >
            Voir la tournee de la semaine
          </Link>
          <Link
            to="/menu"
            className="rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
          >
            Voir le menu
          </Link>
        </div>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Ce que les clients viennent chercher</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
          <li>une pizza plus nette et moins standardisee</li>
          <li>un retrait simple sur les points de passage</li>
          <li>une cuisson minute qui reste reguliere</li>
          <li>une offre mobile serieuse autour de Metz et Thionville</li>
        </ul>
      </section>

      <section className="glass-panel p-6">
        <h2 className="font-display text-3xl uppercase tracking-wide text-white">
          Questions frequentes
        </h2>
        <div className="mt-4 space-y-4">
          <article>
            <h3 className="text-base font-semibold text-white">Ou trouver {companyName} cette semaine ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Les points de passage et les horaires sont publies sur la page planning. C est la reference a consulter
              avant de vous deplacer.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Les pizzas sont-elles a emporter ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Oui. Le service est pense pour l emporter uniquement, afin de garder un rythme plus propre et une pizza
              remise au bon moment.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Faut-il commander a l avance ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              C est recommande, surtout sur les creneaux charges. Cela permet de limiter l attente et de mieux caler la
              cuisson.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Combien de temps dure l attente ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Le systeme de creneaux sert justement a reduire l attente. La commande anticipee reste la solution la
              plus fluide.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Quels moyens de paiement acceptez-vous ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Les moyens de paiement disponibles sont indiques sur le site et peuvent inclure carte bancaire, especes
              et autres solutions selon l organisation du service.
            </p>
          </article>
        </div>
      </section>

      <SeoInternalLinks />
    </div>
  );
}
