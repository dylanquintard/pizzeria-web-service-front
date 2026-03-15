import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../api/category.api";
import { getPublicGallery } from "../api/gallery.api";
import { getPublicWeeklySettings } from "../api/timeslot.api";
import { getAllProductsClient } from "../api/user.api";
import PageFaqSection from "../components/common/PageFaqSection";
import ContactPanel from "../components/contact/ContactPanel";
import PublicReviewsSection from "../components/reviews/PublicReviewsSection";
import SeoHead from "../components/seo/SeoHead";
import TrustHighlightsSection from "../components/trust/TrustHighlightsSection";
import { useLanguage } from "../context/LanguageContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useTheme } from "../context/ThemeContext";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import { DEFAULT_TOUR_CITIES } from "../seo/localLandingContent";
import { DEFAULT_SITE_SETTINGS, getLocalizedSiteText } from "../site/siteSettings";
import { getLocationDisplayName } from "../utils/location";

const paymentLogos = [
  {
    src: "/payments/cb.webp",
    fallbackSrc: "/payments/cb.webp",
    alt: "CB",
    width: 112,
    height: 63,
    className: "h-9 w-auto object-contain",
  },
  {
    src: "/payments/visa.webp",
    fallbackSrc: "/payments/visa.webp",
    alt: "VISA",
    width: 67,
    height: 63,
    className: "h-9 w-auto object-contain",
  },
  {
    src: "/payments/mastercard.webp",
    fallbackSrc: "/payments/mastercard.webp",
    alt: "MASTERCARD",
    width: 90,
    height: 63,
    className: "h-9 w-auto object-contain",
  },
  {
    src: "/payments/especes.webp",
    fallbackSrc: "/payments/especes.webp",
    alt: "Especes",
    width: 105,
    height: 105,
    className: "h-[60px] w-auto object-contain",
  },
];

function formatPrice(value) {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric.toFixed(2);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const DAY_LABELS = {
  MONDAY: { fr: "Lundi", en: "Monday" },
  TUESDAY: { fr: "Mardi", en: "Tuesday" },
  WEDNESDAY: { fr: "Mercredi", en: "Wednesday" },
  THURSDAY: { fr: "Jeudi", en: "Thursday" },
  FRIDAY: { fr: "Vendredi", en: "Friday" },
  SATURDAY: { fr: "Samedi", en: "Saturday" },
  SUNDAY: { fr: "Dimanche", en: "Sunday" },
};
const DEFAULT_HOME_BACKGROUND = "/pizza-background-1920.webp";
const HERO_AUTOPLAY_DELAY_MS = 5000;
const HERO_IMAGE_LIMIT = 5;

function formatLocationAddress(location, tr) {
  if (!location) return tr("Adresse non renseignee", "Address not available");
  const cityLine = `${location.postalCode || ""} ${location.city || ""}`.trim();
  return [location.addressLine1, cityLine].filter(Boolean).join(", ");
}

function getSeoLocationLabel(location) {
  return String(location?.name || location?.city || "").trim();
}

function formatHourValue(timeValue) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(timeValue || "").trim());
  if (!match) return "--";
  const hours = match[1];
  const minutes = match[2];
  return minutes === "00" ? `${hours}H` : `${hours}H${minutes}`;
}

function formatHourRange(startTime, endTime) {
  return `${formatHourValue(startTime)}-${formatHourValue(endTime)}`;
}

export default function Home() {
  const { language, tr } = useLanguage();
  const { settings: siteSettings } = useSiteSettings();
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [weeklySettings, setWeeklySettings] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchHomeData() {
      try {
        const [productData, categoryData, galleryData, weeklySettingsData] =
          await Promise.all([
            getAllProductsClient(),
            getCategories({ active: true, kind: "PRODUCT" }),
            getPublicGallery({ active: true }),
            getPublicWeeklySettings(),
          ]);

        if (!cancelled) {
          setProducts(Array.isArray(productData) ? productData : []);
          setCategories(Array.isArray(categoryData) ? categoryData : []);
          setGalleryImages(Array.isArray(galleryData) ? galleryData : []);
          setWeeklySettings(
            Array.isArray(weeklySettingsData) ? weeklySettingsData : []
          );
        }
      } catch (_err) {
        if (!cancelled) {
          setProducts([]);
          setCategories([]);
          setGalleryImages([]);
          setWeeklySettings([]);
        }
      }
    }

    fetchHomeData();
    return () => {
      cancelled = true;
    };
  }, []);

const truckTourSchedule = useMemo(
  () => {
    const rows = (Array.isArray(weeklySettings) ? weeklySettings : []).flatMap(
      (entry, dayIndex) => {
        const services =
          Array.isArray(entry?.services) && entry.services.length > 0
            ? entry.services
            : entry?.isOpen && entry?.location
              ? [
                  {
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    locationId: entry.locationId,
                    location: entry.location,
                  },
                ]
              : [];

        return services
          .filter((service) => service?.location && entry?.dayOfWeek)
          .map((service, serviceIndex) => {
            const locationName = getLocationDisplayName(service.location, tr("Emplacement", "Location"));
            const address = formatLocationAddress(service.location, tr);
            const locationKey =
              service.locationId ||
              `${locationName.toLowerCase()}-${address.toLowerCase()}`;

            return {
              groupKey: `${entry.dayOfWeek}-${locationKey}`,
              sortKey: `${dayIndex}-${serviceIndex}`,
              locationName,
              address,
              dayLabel: tr(
                DAY_LABELS[entry.dayOfWeek]?.fr || entry.dayOfWeek,
                DAY_LABELS[entry.dayOfWeek]?.en || entry.dayOfWeek
              ),
              hours: formatHourRange(service.startTime, service.endTime),
            };
          });
      }
    );

    const grouped = new Map();
    for (const row of rows) {
      if (!grouped.has(row.groupKey)) {
        grouped.set(row.groupKey, {
          key: row.groupKey,
          sortKey: row.sortKey,
          locationName: row.locationName,
          address: row.address,
          dayLabel: row.dayLabel,
          hours: [],
        });
      }

      const current = grouped.get(row.groupKey);
      if (!current.hours.includes(row.hours)) {
        current.hours.push(row.hours);
      }
    }

    return [...grouped.values()]
      .sort((left, right) => String(left.sortKey).localeCompare(String(right.sortKey)))
      .map((entry) => ({
        key: entry.key,
        locationName: entry.locationName,
        address: entry.address,
        dayLabel: entry.dayLabel,
        hours: entry.hours,
      }));
  },
  [weeklySettings, tr]
);

  const truckTourCities = useMemo(() => {
    const source = Array.isArray(weeklySettings) ? weeklySettings : [];
    const dynamicLocations = source.flatMap((entry) => {
      const services =
        Array.isArray(entry?.services) && entry.services.length > 0
          ? entry.services
          : entry?.isOpen && entry?.location
            ? [{ location: entry.location }]
            : [];

      return services
        .map((service) => getSeoLocationLabel(service?.location))
        .filter(Boolean);
    });

    return [...new Set([...DEFAULT_TOUR_CITIES, ...dynamicLocations])];
  }, [weeklySettings]);

  const siteName = siteSettings.siteName || DEFAULT_SITE_SETTINGS.siteName;
  const canonicalSiteUrl = String(siteSettings.seo?.canonicalSiteUrl || "").trim();
  const defaultOgImageUrl = String(siteSettings.seo?.defaultOgImageUrl || "").trim();
  const socialUrls = [
    siteSettings.social?.instagramUrl,
    siteSettings.social?.facebookUrl,
    siteSettings.social?.tiktokUrl,
  ].filter(Boolean);

  const menuByCategory = useMemo(() => {
    const grouped = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      items: products.filter((product) => product.categoryId === category.id),
    }));

    const uncategorized = products.filter((product) => !product.categoryId);
    if (uncategorized.length > 0) {
      grouped.push({
        id: "uncategorized",
        name: tr("Nos creations", "Our creations"),
        description: tr("Selections artisanales", "Craft selections"),
        items: uncategorized,
      });
    }

    if (grouped.length === 0 && products.length > 0) {
      grouped.push({
        id: "default",
        name: tr("Le menu", "Menu"),
        description: tr("Pizzas napolitaines", "Neapolitan pizzas"),
        items: products,
      });
    }

    const visibleGroups = grouped.filter((entry) => entry.items.length > 0);

    return visibleGroups
      .map((entry, index) => ({ entry, index }))
      .sort((left, right) => {
        const leftPriority = normalizeText(left.entry.name).includes("pizza") ? 0 : 1;
        const rightPriority = normalizeText(right.entry.name).includes("pizza") ? 0 : 1;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
        return left.index - right.index;
      })
      .map(({ entry }) => entry);
  }, [categories, products, tr]);

  const heroGalleryImages = useMemo(() => {
    const validImages = galleryImages.filter((image) => image?.imageUrl);

    if (validImages.length === 0) {
      return [{ id: "fallback-hero", imageUrl: DEFAULT_HOME_BACKGROUND }];
    }

    return [...validImages].sort((left, right) => {
      const leftPriority = left?.isHomeBackground ? 0 : 1;
      const rightPriority = right?.isHomeBackground ? 0 : 1;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;

      const leftOrder = Number(left?.sortOrder ?? 0);
      const rightOrder = Number(right?.sortOrder ?? 0);
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;

      return String(left?.id ?? "").localeCompare(String(right?.id ?? ""));
    }).slice(0, HERO_IMAGE_LIMIT);
  }, [galleryImages]);

  const heroOverlay = theme === "light"
    ? "linear-gradient(118deg, rgba(246,235,221,0.90) 6%, rgba(246,235,221,0.68) 42%, rgba(58,38,28,0.48) 100%)"
    : "linear-gradient(120deg, rgba(18,16,13,0.88) 5%, rgba(18,16,13,0.62) 40%, rgba(18,16,13,0.92) 100%)";

  const siteMetaTitle = getLocalizedSiteText(
    siteSettings.seo?.defaultMetaTitle,
    language,
    tr(
      `Pizza napolitaine au feu de bois en Moselle | ${siteName}`,
      `Wood-fired Neapolitan pizza in Moselle | ${siteName}`
    )
  );
  const siteMetaDescription = getLocalizedSiteText(
    siteSettings.seo?.defaultMetaDescription,
    language,
    tr(
      "Pizza napolitaine au feu de bois en Moselle. Commande en ligne et retrait rapide.",
      "Wood-fired Neapolitan pizza in Moselle. Online ordering and quick pickup."
    )
  );
  const heroTitle = getLocalizedSiteText(
    siteSettings.home?.heroTitle,
    language,
    tr(
      "Pizza napolitaine au feu de bois en Moselle",
      "Wood-fired Neapolitan pizza in Moselle"
    )
  );
  const heroSubtitle = getLocalizedSiteText(
    siteSettings.home?.heroSubtitle,
    language,
    tr(
      "Une pizza travaillee pour l emporter: pate souple, cuisson vive et recettes nettes a recuperer en Moselle.",
      "Pizza built for pickup: supple dough, lively baking and cleaner recipes to collect in Moselle."
    )
  );
  const siteTaglineText = getLocalizedSiteText(
    siteSettings.siteTagline,
    language,
    ""
  );
  const heroPrimaryCtaLabel = getLocalizedSiteText(
    siteSettings.home?.primaryCtaLabel,
    language,
    tr("Commander", "Order now")
  );
  const heroSecondaryCtaLabel = getLocalizedSiteText(
    siteSettings.home?.secondaryCtaLabel,
    language,
    tr("Voir le menu", "See menu")
  );
  const heroReassuranceText = getLocalizedSiteText(
    siteSettings.home?.reassuranceText,
    language,
    tr(
      "Commande en ligne, retrait rapide, cuisson minute",
      "Online ordering, quick pickup, baked to order"
    )
  );

  const trustHighlights = useMemo(
    () => [
      {
        kicker: tr("Produit", "Product"),
        title: tr("Une pate pensee pour le retrait", "Dough designed for pickup"),
        text: tr(
          "La pizza est travaillee pour rester souple, chaude et nette au moment ou elle quitte le camion.",
          "Each pizza is worked so it stays supple, hot and clean when it leaves the truck."
        ),
      },
      {
        kicker: tr("Service", "Service"),
        title: tr("Un retrait simple a suivre", "A simple pickup flow"),
        text: tr(
          "Commande, creneau, puis retrait sur le point de passage actif sans attente inutile.",
          "Order, choose a timeslot, then collect from the active stop without unnecessary waiting."
        ),
      },
      {
        kicker: tr("Selection", "Selection"),
        title: tr("Des produits italiens bien choisis", "Well-chosen Italian products"),
        text: tr(
          "Farine, tomates, mozzarella et charcuteries sont choisis pour leur tenue au four et leur equilibre en bouche.",
          "Flour, tomatoes, mozzarella and charcuterie are chosen for oven balance and clean flavor."
        ),
      },
    ],
    [tr]
  );

  const homeJsonLd = useMemo(() => {
    const base = buildBaseFoodEstablishmentJsonLd({
      pagePath: "/",
      pageName: heroTitle,
      description: siteMetaDescription,
      siteName,
      siteUrl: canonicalSiteUrl || undefined,
      phone: siteSettings.contact?.phone,
      email: siteSettings.contact?.email,
      address: siteSettings.contact?.address,
      mapUrl: siteSettings.contact?.mapsUrl,
      image: defaultOgImageUrl,
      socialUrls,
    });

    const payload = {
      ...base,
      areaServed: truckTourCities,
    };

    return payload;
  }, [
    canonicalSiteUrl,
    defaultOgImageUrl,
    heroTitle,
    siteMetaDescription,
    siteName,
    siteSettings.contact?.address,
    siteSettings.contact?.email,
    siteSettings.contact?.mapsUrl,
    siteSettings.contact?.phone,
    socialUrls,
    truckTourCities,
  ]);

  useEffect(() => {
    setActiveHeroIndex((prev) => {
      if (heroGalleryImages.length === 0) return 0;
      return prev % heroGalleryImages.length;
    });
  }, [heroGalleryImages.length]);

  useEffect(() => {
    if (heroGalleryImages.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroGalleryImages.length);
    }, HERO_AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(intervalId);
  }, [heroGalleryImages.length]);

  return (
    <div className="space-y-20 pb-24">
      <SeoHead
        title={siteMetaTitle}
        description={siteMetaDescription}
        pathname="/"
        jsonLd={homeJsonLd}
      />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {heroGalleryImages.map((image, index) => (
            <img
              key={image.id || `${image.imageUrl}-${index}`}
              src={image.imageUrl}
              alt=""
              aria-hidden="true"
              fetchPriority={index === 0 ? "high" : undefined}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                index === activeHeroIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: heroOverlay,
            }}
          />
        </div>
        <div className="section-shell relative py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            {siteTaglineText ? (
              <p
                className={`mb-4 text-xs font-semibold uppercase tracking-[0.28em] ${
                  isLightTheme ? "text-[#3A261C]/70" : "text-saffron"
                }`}
              >
                {siteTaglineText}
              </p>
            ) : null}
            <h1
              className={`font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl lg:text-7xl ${
                isLightTheme ? "text-[#3A261C]" : "theme-light-keep-white text-white"
              }`}
            >
              {heroTitle}
            </h1>
            <p
              className={`mt-6 max-w-2xl text-base sm:text-lg ${
                isLightTheme ? "text-[#1A1817]/80" : "theme-light-keep-white text-stone-200"
              }`}
            >
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/order"
                className="rounded-full bg-saffron px-6 py-3 text-sm font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
              >
                {heroPrimaryCtaLabel}
              </Link>
              <a
                href="#menu"
                className={`rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition ${
                  isLightTheme
                    ? "border border-[#3A261C]/15 bg-white/70 text-[#3A261C] hover:bg-white"
                    : "theme-light-keep-white border border-white/30 text-white hover:bg-white/10"
                }`}
              >
                {heroSecondaryCtaLabel}
              </a>
            </div>
            {heroReassuranceText ? (
              <p
                className={`mt-4 text-xs font-semibold uppercase tracking-[0.22em] ${
                  isLightTheme ? "text-[#3A261C]/70" : "text-stone-300"
                }`}
              >
                {heroReassuranceText}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section id="menu" className="section-shell space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="theme-light-keep-dark text-4xl uppercase tracking-[0.25em] text-saffron">{tr("Le Menu", "Menu")}</p>
          </div>
          <span className="rounded-full border border-saffron/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-saffron">
            {tr("Carte artisanale", "Craft menu")}
          </span>
        </div>

        {menuByCategory.length === 0 ? (
          <div className="glass-panel p-6 text-stone-300">{tr("Le menu sera disponible ici.", "The menu will be available here.")}</div>
        ) : (
          <div className="space-y-8">
            {menuByCategory.map((group) => (
              <article key={group.id} className="rounded-3xl border border-white/10 bg-charcoal/35 p-5 sm:p-7">
                <div className="mb-4 border-b border-white/10 pb-3">
                  <h3 className="font-display text-3xl uppercase tracking-[0.08em] text-crust sm:text-4xl">{group.name}</h3>
                  {group.description && <p className="mt-1 text-sm text-stone-400">{group.description}</p>}
                </div>

                <div>
                  {group.items.map((product) => (
                    <div key={product.id} className="border-b border-white/10 py-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <h4 className="text-base font-semibold uppercase tracking-wide text-white sm:text-lg">{product.name}</h4>
                        <div className="mt-3 hidden h-px flex-1 border-t border-dashed border-stone-500/70 sm:block" />
                        <span className="whitespace-nowrap text-sm font-extrabold uppercase tracking-wide text-saffron sm:text-base">
                          {formatPrice(product.basePrice)} EUR
                        </span>
                      </div>

                      {product.description && <p className="mt-1 text-sm text-stone-300">{product.description}</p>}

                      {product.ingredients?.length > 0 && (
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-400">
                          {product.ingredients.map((entry) => entry.ingredient.name).join(" - ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="emplacements" className="section-shell space-y-6">
        <div>
          <p className="theme-light-keep-dark text-sm uppercase tracking-[0.25em] text-saffron">{tr("Emplacements & horaires d'ouverture", "Locations & opening hours")}</p>
          <h2 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Emplacements du camion pizza", "Pizza truck locations")}</h2>
          <p className="mt-2 text-sm text-stone-400">
            {tr(
              "Le planning hebdomadaire indique les points de passage, les horaires et les creneaux de retrait actuellement ouverts.",
              "The weekly schedule shows the current stops, hours and pickup slots."
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
{truckTourSchedule.length === 0 ? (
  <div className="glass-panel p-5 text-sm text-stone-300">
    {tr("Aucun horaire disponible pour le moment.", "No opening hours available for now.")}
  </div>
) : (
  truckTourSchedule.map((location) => (
    <div key={location.key} className="glass-panel p-5">
      <p className="text-[11px] uppercase tracking-wider text-saffron">{tr("Nom", "Name")}</p>
      <p className="mt-1 text-lg font-bold text-white">{location.locationName}</p>

      <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">{tr("Adresse", "Address")}</p>
      <p className="mt-1 text-sm text-stone-200">{location.address}</p>

      <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">{tr("Jour d'ouverture", "Opening day")}</p>
      <p className="mt-1 text-sm text-stone-200">{location.dayLabel}</p>

      <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">{tr("Horaires", "Hours")}</p>
      <div className="mt-1 space-y-1 text-sm text-stone-200">
        {(Array.isArray(location.hours) ? location.hours : []).map((hour) => (
          <p key={hour}>{hour}</p>
        ))}
      </div>
    </div>
  ))
)}
        </div>
      </section>

      <section id="services" className="section-shell space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-saffron">{tr("Nos services", "Our services")}</p>
          <h2 className="font-display text-4xl uppercase tracking-wide text-white">{tr("A emporter uniquement", "Takeaway only")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-panel p-6">
            <p className="text-xl font-bold text-white">{tr("Commande rapide", "Fast ordering")}</p>
            <p className="mt-2 text-sm text-stone-300">
              {tr(
                "Commandez, choisissez votre creneau, puis recuperez votre pizza au camion sans attente inutile.",
                "Order, pick your slot, then collect your pizza at the truck without unnecessary waiting."
              )}
            </p>
          </div>
          <div className="glass-panel p-6">
            <p className="text-xl font-bold text-white">{tr("Qualite constante", "Consistent quality")}</p>
            <p className="mt-2 text-sm text-stone-300">
              {tr(
                "Une pate preparee en amont, des produits bien calibres et une cuisson minute pour garder un resultat plus stable.",
                "Prepared dough, well-calibrated ingredients and minute baking for a more reliable result."
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell space-y-6">
        <div className="grid gap-5 xl:grid-cols-12">
          <article className="glass-panel p-6 sm:p-8 xl:col-span-7">
            <p className="text-xs uppercase tracking-[0.2em] text-saffron">
              {tr("Camion pizza Moselle", "Moselle pizza truck")}
            </p>
            <h2 className="mt-2 font-display text-3xl uppercase tracking-wide text-white">
              {tr(
                "Une pizza pensee pour etre bonne au moment du retrait",
                "Pizza made to be at its best at pickup time"
              )}
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
              {tr(
                "Le camion circule dans le nord de la Moselle avec une carte courte et une cuisson vive, pour servir une pizza propre plutot qu une offre standardisee.",
                "The truck moves around northern Moselle with a short menu and lively baking, so each pizza stays focused instead of feeling standardized."
              )}
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              {tr(
                "Le planning change selon la semaine, mais la ligne reste la meme: une organisation simple, un retrait rapide et une execution reguliere.",
                "The weekly route changes, but the approach stays the same: simple organization, fast pickup and steady execution."
              )}
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              {tr(
                "Les pizzas sont preparees avec une pate travaillee, une garniture tenue et un four bois-gaz qui donne du rythme au service.",
                "Each pizza is built around a well-worked dough, balanced toppings and a wood-and-gas oven that keeps service moving."
              )}
            </p>
          </article>

          <article className="glass-panel p-6 sm:p-8 xl:col-span-5">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              {tr(
                "Des produits choisis pour leur tenue, pas pour remplir la carte",
                "Ingredients chosen for balance, not just to pad out the menu"
              )}
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-300 sm:text-base">
              {tr(
                "La base produit reste volontairement courte pour garder des recettes plus nettes:",
                "The ingredient list stays intentionally short to keep the recipes clear:"
              )}
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-stone-200 sm:grid-cols-2">
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">{tr("farine Nuvola Super", "Nuvola Super flour")}</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">{tr("tomates San Marzano", "San Marzano tomatoes")}</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">{tr("mozzarella fior di latte", "fior di latte mozzarella")}</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">{tr("parmigiano reggiano", "Parmigiano Reggiano")}</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">{tr("jambon de Parme", "Parma ham")}</li>
              <li className="rounded-lg border border-white/20 bg-stone-200/20 px-3 py-2">{tr("prosciutto italien", "Italian prosciutto")}</li>
            </ul>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-saffron">
              {tr(
                "pate travaillee | ingredients bien choisis | cuisson minute",
                "worked dough | carefully chosen ingredients | baked to order"
              )}
            </p>
          </article>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="glass-panel p-6 sm:p-8">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              {tr("Cuisson au four a bois et gaz", "Wood-and-gas oven baking")}
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-300 sm:text-base">
              {tr(
                "Le four sert a garder une cuisson courte et lisible: un bord qui se developpe, une base qui tient et une pizza qui ne seche pas.",
                "The oven keeps the bake short and clean: a risen crust, a base that holds and a pizza that does not dry out."
              )}
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              {tr(
                "Chaque pizza est lancee a la commande pour sortir au bon moment, pas pour attendre sur le cote.",
                "Every pizza goes in to order so it comes out at the right moment, not to sit waiting on the side."
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-[11px] uppercase tracking-wide text-saffron">
                {tr("pizza napolitaine feu de bois", "wood-fired Neapolitan pizza")}
              </span>
              <span className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-[11px] uppercase tracking-wide text-saffron">
                {tr("pizza feu de bois thionville", "wood-fired pizza Thionville")}
              </span>
              <span className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-[11px] uppercase tracking-wide text-saffron">
                {tr("pizza artisanale moselle", "artisan pizza Moselle")}
              </span>
              <span className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-[11px] uppercase tracking-wide text-saffron">
                {tr("camion pizza napolitaine", "Neapolitan pizza truck")}
              </span>
            </div>
          </article>

          <article className="glass-panel p-6 sm:p-8">
            <h2 className="font-display text-3xl uppercase tracking-wide text-white">
              {tr("Ou trouver notre camion pizza", "Where to find our pizza truck")}
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-300 sm:text-base">
              {tr(
                "Le camion passe sur plusieurs points autour de Thionville et dans les communes voisines de Moselle.",
                "The truck stops at several pickup points around Thionville and nearby towns across Moselle."
              )}
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              {tr(
                "Les emplacements changent selon la tournee hebdomadaire.",
                "Locations change with the weekly route."
              )}
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-300 sm:text-base">
              {tr(
                "Consultez le planning pour connaitre les horaires et les points de retrait ouverts.",
                "Check the schedule to see opening hours and available pickup points."
              )}
            </p>
            <Link
              to="/planing"
              className="mt-5 inline-flex rounded-full border border-saffron/60 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
            >
              {tr("Voir les horaires d'ouverture", "See opening hours")}
            </Link>
          </article>
        </div>
      </section>

      <section id="paiements" className="section-shell space-y-6">
        <div>
          <p className="theme-light-keep-dark text-sm uppercase tracking-[0.25em] text-saffron">{tr("Moyens de paiement acceptes", "Accepted payment methods")}</p>
          <h2 className="font-display text-4xl uppercase tracking-wide text-white">{tr("Simple et rapide", "Simple and fast")}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 lg:gap-10">
          {paymentLogos.map((logo) => (
            <picture key={logo.alt}>
              <source srcSet={logo.src} type="image/webp" />
              <img
                src={logo.fallbackSrc}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                loading="lazy"
                decoding="async"
                className={logo.className}
              />
            </picture>
          ))}
        </div>
      </section>

      <PublicReviewsSection />

      <TrustHighlightsSection
        eyebrow={tr("Ce qui fait revenir", "Why people come back")}
        title={tr("Une pizza claire, un retrait fluide, un service mobile serieux", "Clear pizza, smooth pickup, serious mobile service")}
        intro={tr(
          "Sans inventer de faux avis, on met en avant les points de confiance qui comptent le plus pour un client local avant de commander.",
          "Without inventing fake reviews, we highlight the trust points that matter most to local customers before they order."
        )}
        items={trustHighlights}
      />

      <ContactPanel sectionId="contact" sectionClassName="section-shell" />

      <PageFaqSection
        pathname="/"
        className="section-shell"
        eyebrow={tr("Questions frequentes", "Frequently asked questions")}
        title={tr("Ce qu'il faut savoir avant de commander", "What to know before ordering")}
        intro={tr(
          "Voici les reponses les plus utiles pour commander rapidement et recuperer votre pizza sans surprise.",
          "Here are the most useful answers to order quickly and pick up your pizza without surprises."
        )}
      />
    </div>
  );
}

