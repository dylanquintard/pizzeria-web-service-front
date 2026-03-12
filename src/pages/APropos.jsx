import { Link } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { SITE_URL } from "../config/env";

export default function APropos() {
  const companyName = "Pizza Truck";
  const title = `A propos | ${companyName}, camion pizza napolitaine en Moselle`;
  const description =
    `${companyName} est un camion pizza napolitaine artisanal en Moselle, actif autour de Metz et Thionville, avec commande en ligne et retrait sur emplacement.`;
  const rootUrl = new URL("/", `${SITE_URL}/`).toString();
  const menuUrl = new URL("/menu", `${SITE_URL}/`).toString();

  const localFoodTruckJsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodTruck",
    name: companyName,
    description:
      "Camion pizza napolitaine artisanal en Moselle, proche Metz & Thionville, proposant des pizzas a emporter cuites au feu de bois.",
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
          {companyName}, camion pizza napolitaine en Moselle proche Thionville et Metz
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          {companyName} est un camion pizza artisanal en Moselle, specialise dans la pizza napolitaine cuite au feu
          de bois.
        </p>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          Notre pizzeria mobile se deplace chaque semaine dans plusieurs communes en Moselle, notamment autour de
          Thionville et Metz, pour proposer des pizzas a emporter preparees a la minute.
        </p>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          Grace a notre tournee, vous pouvez profiter d'une pizza napolitaine artisanale pres de chez vous, directement
          depuis notre camion pizza.
        </p>
        <Link
          to="/planing"
          className="inline-flex rounded-full border border-saffron/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
        >
          Voir les emplacements et horaires
        </Link>
      </header>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Une pizzeria mobile en Moselle proche de Metz & Thionville</h2>
        <p className="mt-3 text-sm text-stone-300">
          {companyName} est ne d'une idee simple: proposer une pizza napolitaine artisanale accessible dans les
          villages et quartiers de Moselle, sans les contraintes d'un restaurant traditionnel.
        </p>
        <p className="mt-3 text-sm text-stone-300">Notre camion pizza itinerant circule principalement:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
          <li>en Moselle</li>
          <li>dans les communes proches de Thionville</li>
          <li>dans les secteurs proches de Metz</li>
        </ul>
        <p className="mt-3 text-sm text-stone-300">
          Chaque emplacement devient un rendez-vous local autour de la pizza, facile d'acces et convivial.
        </p>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">La tradition de la pizza napolitaine</h2>
        <p className="mt-3 text-sm text-stone-300">
          La pizza napolitaine est l'une des traditions culinaires italiennes les plus reconnues.
        </p>
        <p className="mt-3 text-sm text-stone-300">Elle se caracterise par:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
          <li>une pate legere et souple</li>
          <li>une cuisson rapide a tres haute temperature</li>
          <li>une attention particuliere au travail du pizzaiolo au four</li>
        </ul>
        <p className="mt-3 text-sm text-stone-300">
          Ce savoir-faire a ete reconnu comme patrimoine culturel immateriel de l'humanite par l'UNESCO.
        </p>
        <p className="mt-3 text-sm text-stone-300">
          Chez {companyName}, nous appliquons ces principes pour proposer une pizza napolitaine artisanale en Moselle,
          proche Metz/Thionville.
        </p>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Une pate maison fermentee lentement</h2>
        <p className="mt-3 text-sm text-stone-300">La qualite d'une pizza repose d'abord sur sa pate.</p>
        <p className="mt-3 text-sm text-stone-300">
          Chez {companyName}, nous preparons une pate maison avec fermentation longue, realisee en plusieurs etapes.
        </p>
        <p className="mt-3 text-sm text-stone-300">Cette methode permet d'obtenir:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
          <li>une pate plus digeste</li>
          <li>une texture moelleuse et alveolee</li>
          <li>un gout plus developpe</li>
        </ul>
        <p className="mt-3 text-sm text-stone-300">
          Ce travail garantit une pizza napolitaine artisanale constante sur toute la tournee du camion pizza en
          Moselle.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white">Une carte simple pour privilegier la qualite</h2>
          <p className="mt-3 text-sm text-stone-300">Notre carte reste volontairement courte.</p>
          <p className="mt-3 text-sm text-stone-300">Nous privilegions:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
            <li>des produits italiens selectionnes</li>
            <li>des recettes equilibrees</li>
            <li>des saveurs authentiques</li>
          </ul>
        </article>
        <article className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white">Commander votre pizza facilement</h2>
          <p className="mt-3 text-sm text-stone-300">
            Pour limiter l'attente et garantir la qualite de la pizza, {companyName} fonctionne avec des creneaux de
            retrait.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-stone-300">
            <li>Choisissez votre pizza</li>
            <li>Reservez votre creneau</li>
            <li>Recuperez votre commande au camion</li>
          </ol>
          <p className="mt-3 text-sm text-stone-300">
            Vous repartez avec une pizza napolitaine fraichement sortie du four, prete a etre degustee.
          </p>
        </article>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">Ou trouver notre camion pizza en Moselle ?</h2>
        <p className="mt-3 text-sm text-stone-300">
          {companyName} se deplace chaque semaine dans plusieurs communes en Moselle, autour de Thionville et proche de
          Metz.
        </p>
        <p className="mt-3 text-sm text-stone-300">
          La tournee permet de proposer une pizza napolitaine artisanale a emporter pres de chez vous, directement
          depuis notre camion pizza.
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
            Reserver votre pizza
          </Link>
        </div>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-white">
          Pizza napolitaine a emporter en Moselle, proche Metz / Thionville
        </h2>
        <p className="mt-3 text-sm text-stone-300">Notre camion pizza s'adresse aux habitants qui recherchent:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-300">
          <li>une pizza artisanale en Moselle</li>
          <li>une pizza napolitaine proche de Thionville</li>
          <li>une pizza a emporter proche de Metz</li>
          <li>un camion pizza pres de chez eux</li>
        </ul>
      </section>

      <section className="glass-panel p-6">
        <h2 className="font-display text-3xl uppercase tracking-wide text-white">
          FAQ camion pizza en Moselle proche Metz et Thionville
        </h2>
        <div className="mt-4 space-y-4">
          <article>
            <h3 className="text-base font-semibold text-white">Ou trouver {companyName} cette semaine ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Les emplacements du camion pizza en Moselle sont disponibles sur la page emplacements et horaires, avec
              les communes proches de Metz et Thionville.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Les pizzas sont-elles a emporter ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Oui, {companyName} est une pizzeria mobile a emporter uniquement, pour garantir une pizza servie au
              meilleur moment.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Faut-il commander a l'avance ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              La commande en ligne est recommandee, surtout aux heures de pointe, pour reserver votre creneau de retrait
              au camion pizza.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Combien de temps dure l'attente ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              L'objectif est une remise rapide en quelques minutes. La reservation d'un creneau reste la meilleure
              option.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Quels moyens de paiement acceptez-vous ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Selon l'organisation du camion: carte bancaire, especes et titres restaurant si applicable.
            </p>
          </article>
        </div>
      </section>

      <SeoInternalLinks />
    </div>
  );
}
