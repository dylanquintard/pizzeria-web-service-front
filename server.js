const fs = require("fs");
const express = require("express");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const BUILD_DIR = path.join(__dirname, "build");
const INDEX_FILE = path.join(BUILD_DIR, "index.html");
const SEO_CACHE_TTL_MS = Number(process.env.SEO_CACHE_TTL_MS || 300000);
const SEO_FETCH_TIMEOUT_MS = Number(process.env.SEO_FETCH_TIMEOUT_MS || 6000);

const FIXED_CITY_CATALOG = [
  { slug: "thionville", label: "Thionville" },
  { slug: "metz", label: "Metz" },
  { slug: "moselle", label: "Moselle" },
];
const FIXED_CITY_SLUGS = new Set(FIXED_CITY_CATALOG.map((item) => item.slug));

const DEFAULT_SITE_SETTINGS = Object.freeze({
  siteName: "Pizza Truck",
  seo: {
    defaultMetaTitle: {
      fr: "Pizza Truck | Pizza napolitaine au feu de bois en Moselle",
    },
    defaultMetaDescription: {
      fr: "Pizza napolitaine au feu de bois en Moselle. Camion pizza artisanal autour de Thionville et Metz, commande en ligne et retrait rapide.",
    },
    defaultOgImageUrl: "",
    canonicalSiteUrl: "",
  },
  blog: {
    introTitle: {
      fr: "Farines, tomates, mozzarella & surtout la pizza !",
    },
    introText: {
      fr: "Ici on parle d'italie, de saveurs, de savoir faire et de qualite !",
    },
  },
  contact: {
    phone: "",
    email: "",
    address: "",
    mapsUrl: "",
    serviceArea: {
      fr: "Thionville, Metz et alentours",
    },
  },
  social: {
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
  },
});

const EXACT_SPA_ROUTES = new Set([
  "/",
  "/gallery",
  "/menu",
  "/planing",
  "/tournee",
  "/tournee-camion",
  "/a-propos",
  "/contact",
  "/blog",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-generales",
  "/pizza-napolitaine-thionville",
  "/pizza-napolitaine-metz",
  "/food-truck-pizza-moselle",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/register",
  "/verify-email",
  "/order",
  "/order/confirmation",
  "/profile",
  "/userorders",
]);

const PREFIX_SPA_ROUTES = ["/admin"];

const seoCache = {
  expiresAt: 0,
  citySlugs: new Set(FIXED_CITY_SLUGS),
  cityLabelsBySlug: new Map(FIXED_CITY_CATALOG.map((entry) => [entry.slug, entry.label])),
  citySlugByLocationId: new Map(),
  blogSlugs: new Set(),
  blogMetaBySlug: new Map(),
  siteSettings: JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS)),
};

let indexTemplate = "";

function ensureIndexTemplate() {
  if (!indexTemplate) {
    indexTemplate = fs.readFileSync(INDEX_FILE, "utf8");
  }
  return indexTemplate;
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getCanonicalBaseUrl(req) {
  const configured = normalizeBaseUrl(
    process.env.CANONICAL_SITE_URL || process.env.REACT_APP_SITE_URL || ""
  );
  if (configured) return configured;

  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  const proto = String(req.headers["x-forwarded-proto"] || "https").trim().toLowerCase();
  if (!host) return "https://localhost";
  return `${proto}://${host}`;
}

function buildBackendApiBaseUrl() {
  const configured = normalizeBaseUrl(
    process.env.SEO_BACKEND_API_URL || process.env.REACT_APP_API_BASE_URL || ""
  );
  if (!configured) return "";
  if (/\/api$/i.test(configured)) return configured;
  return `${configured}/api`;
}

function buildApiUrl(pathname) {
  const apiBase = buildBackendApiBaseUrl();
  if (!apiBase) return "";
  const suffix = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${apiBase}${suffix}`;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleizeSlug(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function getLocalizedValue(value, fallback = "") {
  if (value && typeof value === "object") {
    const frValue = String(value.fr || "").trim();
    const enValue = String(value.en || "").trim();
    return frValue || enValue || fallback;
  }
  return String(value || "").trim() || fallback;
}

function normalizeSiteSettings(payload) {
  const source = payload && typeof payload === "object" ? payload : {};

  return {
    siteName: String(source.siteName || "").trim() || DEFAULT_SITE_SETTINGS.siteName,
    seo: {
      defaultMetaTitle: {
        fr: getLocalizedValue(
          source.seo?.defaultMetaTitle,
          DEFAULT_SITE_SETTINGS.seo.defaultMetaTitle.fr
        ),
      },
      defaultMetaDescription: {
        fr: getLocalizedValue(
          source.seo?.defaultMetaDescription,
          DEFAULT_SITE_SETTINGS.seo.defaultMetaDescription.fr
        ),
      },
      defaultOgImageUrl:
        String(source.seo?.defaultOgImageUrl || "").trim() ||
        DEFAULT_SITE_SETTINGS.seo.defaultOgImageUrl,
      canonicalSiteUrl:
        String(source.seo?.canonicalSiteUrl || "").trim() ||
        DEFAULT_SITE_SETTINGS.seo.canonicalSiteUrl,
    },
    blog: {
      introTitle: {
        fr: getLocalizedValue(
          source.blog?.introTitle,
          DEFAULT_SITE_SETTINGS.blog.introTitle.fr
        ),
      },
      introText: {
        fr: getLocalizedValue(
          source.blog?.introText,
          DEFAULT_SITE_SETTINGS.blog.introText.fr
        ),
      },
    },
    contact: {
      phone: String(source.contact?.phone || "").trim(),
      email: String(source.contact?.email || "").trim(),
      address: String(source.contact?.address || "").trim(),
      mapsUrl: String(source.contact?.mapsUrl || "").trim(),
      serviceArea: {
        fr: getLocalizedValue(
          source.contact?.serviceArea,
          DEFAULT_SITE_SETTINGS.contact.serviceArea.fr
        ),
      },
    },
    social: {
      instagramUrl: String(source.social?.instagramUrl || "").trim(),
      facebookUrl: String(source.social?.facebookUrl || "").trim(),
      tiktokUrl: String(source.social?.tiktokUrl || "").trim(),
    },
  };
}

function normalizeSeoLocationCatalog(payload) {
  const source = Array.isArray(payload?.locations) ? payload.locations : [];
  if (!source.length) return [];

  const deduped = new Map();
  for (const row of source) {
    const slug = slugify(row?.slug);
    const locationId = Number(row?.locationId);
    const label = String(row?.label || "").trim();
    if (!slug) continue;

    const existing = deduped.get(slug) || {};
    deduped.set(slug, {
      slug,
      label: label || existing.label || titleizeSlug(slug),
      locationId:
        Number.isFinite(locationId) && locationId > 0
          ? locationId
          : Number.isFinite(existing.locationId)
            ? existing.locationId
            : null,
    });
  }

  return [...deduped.values()];
}

function normalizeSeoBlogArticleCatalog(payload) {
  const source = Array.isArray(payload?.articles) ? payload.articles : [];
  if (!source.length) return [];

  const deduped = new Map();
  for (const row of source) {
    const slug = slugify(row?.slug);
    if (!slug) continue;

    deduped.set(slug, {
      slug,
      title: String(row?.title || "").trim() || titleizeSlug(slug),
      description:
        String(row?.description || "").trim() ||
        "Article du blog Pizza Truck sur la pizza napolitaine artisanale.",
      image:
        String(row?.image?.imageUrl || row?.imageUrl || "").trim() || "",
    });
  }

  return [...deduped.values()];
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeHtmlAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

async function fetchJsonWithTimeout(url) {
  if (!url) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEO_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function refreshSeoCacheIfNeeded(options = {}) {
  const force = Boolean(options?.force);
  const now = Date.now();
  if (!force && seoCache.expiresAt > now) return seoCache;

  const nextCitySlugs = new Set(FIXED_CITY_SLUGS);
  const nextCityLabelsBySlug = new Map(FIXED_CITY_CATALOG.map((entry) => [entry.slug, entry.label]));
  const nextCitySlugByLocationId = new Map();
  const nextBlogSlugs = new Set();
  const nextBlogMetaBySlug = new Map();

  function addLocationSlugCandidates(source, preferredLabel = "") {
    const fromName = slugify(source?.name);
    const fromCity = slugify(source?.city);
    const sourceId = Number(source?.id);
    if (fromName) {
      nextCitySlugs.add(fromName);
      if (!nextCityLabelsBySlug.has(fromName)) {
        nextCityLabelsBySlug.set(fromName, String(preferredLabel || source?.name || "").trim() || titleizeSlug(fromName));
      }
      if (Number.isFinite(sourceId) && sourceId > 0 && !nextCitySlugByLocationId.has(sourceId)) {
        nextCitySlugByLocationId.set(sourceId, fromName);
      }
    }
    if (fromCity) {
      nextCitySlugs.add(fromCity);
      if (!nextCityLabelsBySlug.has(fromCity)) {
        nextCityLabelsBySlug.set(fromCity, String(preferredLabel || source?.city || "").trim() || titleizeSlug(fromCity));
      }
      if (Number.isFinite(sourceId) && sourceId > 0) {
        nextCitySlugByLocationId.set(sourceId, fromCity);
      }
    }
  }

  function addWeeklySettingsSlugs(weeklySettingsData) {
    if (!Array.isArray(weeklySettingsData)) return;
    for (const dayEntry of weeklySettingsData) {
      const services =
        Array.isArray(dayEntry?.services) && dayEntry.services.length > 0
          ? dayEntry.services
          : dayEntry?.isOpen && dayEntry?.location
            ? [{ location: dayEntry.location }]
            : [];

      for (const service of services) {
        addLocationSlugCandidates(service?.location || {});
      }
    }
  }

  function addSeoLocationCatalog(catalogPayload) {
    const entries = normalizeSeoLocationCatalog(catalogPayload);
    for (const entry of entries) {
      nextCitySlugs.add(entry.slug);
      if (entry.label) {
        nextCityLabelsBySlug.set(entry.slug, entry.label);
      }
      if (Number.isFinite(entry.locationId) && entry.locationId > 0) {
        nextCitySlugByLocationId.set(entry.locationId, entry.slug);
      }
    }
    return entries.length > 0;
  }

  function addSeoBlogCatalog(catalogPayload) {
    const entries = normalizeSeoBlogArticleCatalog(catalogPayload);
    for (const entry of entries) {
      nextBlogSlugs.add(entry.slug);
      nextBlogMetaBySlug.set(entry.slug, {
        title: entry.title,
        description: entry.description,
        image: entry.image,
      });
    }
  }

  try {
    const [seoLocationsData, blogArticlesData, siteSettingsData] = await Promise.all([
      fetchJsonWithTimeout(buildApiUrl("/seo/locations")),
      fetchJsonWithTimeout(buildApiUrl("/seo/blog-articles")),
      fetchJsonWithTimeout(buildApiUrl("/site-settings/public")),
    ]);

    const hasCatalogData = addSeoLocationCatalog(seoLocationsData);
    if (!hasCatalogData) {
      const [locationsData, weeklySettingsData] = await Promise.all([
        fetchJsonWithTimeout(buildApiUrl("/locations?active=true")),
        fetchJsonWithTimeout(buildApiUrl("/timeslots/public-weekly-settings")),
      ]);
      if (Array.isArray(locationsData)) {
        for (const location of locationsData) {
          addLocationSlugCandidates(location);
        }
      }
      addWeeklySettingsSlugs(weeklySettingsData);
    }

    addSeoBlogCatalog(blogArticlesData);

    seoCache.citySlugs = nextCitySlugs;
    seoCache.cityLabelsBySlug = nextCityLabelsBySlug;
    seoCache.citySlugByLocationId = nextCitySlugByLocationId;
    seoCache.blogSlugs = nextBlogSlugs;
    seoCache.blogMetaBySlug = nextBlogMetaBySlug;
    seoCache.siteSettings = normalizeSiteSettings(siteSettingsData);
    seoCache.expiresAt = now + SEO_CACHE_TTL_MS;
  } catch (_error) {
    // Keep fallback cache windows short so dynamic routes recover quickly
    // after transient API cold starts/timeouts.
    seoCache.siteSettings = seoCache.siteSettings || normalizeSiteSettings(null);
    seoCache.expiresAt = now + Math.min(SEO_CACHE_TTL_MS, 15000);
  }

  return seoCache;
}

function isDynamicSeoPath(pathname) {
  return (
    /^\/blog\/[^/]+$/.test(pathname) ||
    /^\/[a-z0-9-]+$/.test(pathname) ||
    /^\/pizza-[a-z0-9-]+$/.test(pathname) ||
    /^\/pizza\/[^/]+$/.test(pathname)
  );
}

function buildSeoMeta(pathname, cache) {
  const settings = normalizeSiteSettings(cache?.siteSettings);
  const siteName = String(settings.siteName || DEFAULT_SITE_SETTINGS.siteName).trim();
  const defaultTitle = getLocalizedValue(
    settings.seo?.defaultMetaTitle,
    DEFAULT_SITE_SETTINGS.seo.defaultMetaTitle.fr
  );
  const defaultDescription = getLocalizedValue(
    settings.seo?.defaultMetaDescription,
    DEFAULT_SITE_SETTINGS.seo.defaultMetaDescription.fr
  );
  const defaultImage =
    String(settings.seo?.defaultOgImageUrl || "").trim() || "/pizza-background-1920.webp";
  const canonicalBaseUrl = String(settings.seo?.canonicalSiteUrl || "").trim();
  const blogIntroText = getLocalizedValue(
    settings.blog?.introText,
    DEFAULT_SITE_SETTINGS.blog.introText.fr
  );
  const staticPageMeta = {
    "/": {
      title: defaultTitle,
      description: defaultDescription,
      image: defaultImage,
    },
    "/gallery": {
      title: `Galerie | ${siteName}`,
      description:
        "Photos du camion pizza, des cuissons et des pizzas napolitaines servies en Moselle.",
      image: defaultImage,
    },
    "/menu": {
      title: `Menu pizzas napolitaines | ${siteName}`,
      description:
        `Consultez la carte ${siteName}: pizzas napolitaines artisanales, ingredients italiens et cuisson au four a bois et gaz.`,
      image: defaultImage,
    },
    "/planing": {
      title: `Horaires & deplacements du camion pizza | ${siteName}`,
      description:
        "Retrouvez les horaires d'ouvertures, emplacements et deplacements du camion pizza napolitain.",
      image: defaultImage,
    },
    "/a-propos": {
      title: `A propos | ${siteName}`,
      description:
        `Decouvrez ${siteName}: pate maison, produits italiens, cuisson au four a bois et gaz et service a emporter.`,
      image: defaultImage,
    },
    "/contact": {
      title: `Contact | ${siteName}`,
      description:
        `Contactez ${siteName}. Informations de contact, reseaux et formulaire pour vos demandes.`,
      image: defaultImage,
    },
    "/blog": {
      title: `Blog | ${siteName}`,
      description:
        blogIntroText ||
        `Articles ${siteName}: pizza napolitaine, cuisson, ingredients italiens et savoir-faire artisanal.`,
      image: defaultImage,
    },
    "/mentions-legales": {
      title: `Mentions legales | ${siteName}`,
      description: `Mentions legales et informations de publication du site ${siteName}.`,
      image: defaultImage,
    },
    "/confidentialite": {
      title: `Confidentialite | ${siteName}`,
      description: `Politique de confidentialite du site ${siteName}.`,
      image: defaultImage,
    },
    "/conditions-generales": {
      title: `Conditions d'utilisation | ${siteName}`,
      description: `Conditions d'utilisation du site ${siteName}.`,
      image: defaultImage,
    },
    "/pizza-napolitaine-thionville": {
      title: `Pizza napolitaine proche de Thionville | ${siteName}`,
      description:
        "Camion pizza autour de Thionville: pate travaillee, cuisson bois-gaz, carte courte et retrait organise sur les points de passage.",
      image: defaultImage,
    },
    "/pizza-napolitaine-metz": {
      title: `Pizza napolitaine proche de Metz | ${siteName}`,
      description:
        "Camion pizza autour de Metz: recettes d inspiration napolitaine, ingredients selectionnes et retrait rapide sur planning hebdomadaire.",
      image: defaultImage,
    },
    "/food-truck-pizza-moselle": {
      title: `Food truck pizza en Moselle | ${siteName}`,
      description:
        "Food truck pizza en Moselle: carte courte, cuisson vive et passages hebdomadaires autour de Metz, Thionville et des communes voisines.",
      image: defaultImage,
    },
  };

  if (pathname === "/pizza") {
    return {
      title: "Redirection vers la page locale",
      description: "Choisissez un emplacement actif pour acceder a la page locale.",
      robots: "noindex,follow",
      ogType: "website",
      pathname,
      siteName,
      image: defaultImage,
      canonicalBaseUrl,
    };
  }

  if (staticPageMeta[pathname]) {
    return {
      ...staticPageMeta[pathname],
      robots: "index,follow",
      ogType: "website",
      pathname,
      siteName,
      canonicalBaseUrl,
    };
  }

  const blogMatch = /^\/([a-z0-9-]+)$/.exec(pathname);
  if (blogMatch) {
    const slug = slugify(blogMatch[1]);
    if (!cache.blogSlugs.has(slug)) return null;
    const articleMeta = cache.blogMetaBySlug.get(slug);
    return {
      title: articleMeta ? `${articleMeta.title} | ${siteName}` : `Article | ${siteName}`,
      description:
        articleMeta?.description ||
        `Article du blog ${siteName} sur la pizza napolitaine artisanale et les ingredients italiens.`,
      image: articleMeta?.image || defaultImage,
      robots: "index,follow",
      ogType: "article",
      pathname,
      siteName,
      canonicalBaseUrl,
    };
  }

  const pizzaDashMatch = /^\/pizza-([a-z0-9-]+)$/.exec(pathname);
  if (pizzaDashMatch) {
    const slug = slugify(pizzaDashMatch[1]);
    if (!cache.citySlugs.has(slug)) return null;
    const city = cache.cityLabelsBySlug.get(slug) || titleizeSlug(slug);
    return {
      title: `Pizza napolitaine a ${city} | ${siteName}`,
      description:
        `Pizza napolitaine artisanale a ${city}: ingredients italiens, cuisson au four a bois et gaz, service a emporter.`,
      robots: "index,follow",
      ogType: "website",
      pathname,
      siteName,
      image: defaultImage,
      canonicalBaseUrl,
    };
  }

  const legacyPizzaMatch = /^\/pizza\/([^/]+)$/.exec(pathname);
  if (legacyPizzaMatch) {
    const slug = slugify(legacyPizzaMatch[1]);
    if (!cache.citySlugs.has(slug)) return null;
    return {
      title: "Redirection vers la page locale",
      description: `Redirection vers la page locale officielle ${siteName}.`,
      robots: "noindex,follow",
      ogType: "website",
      pathname,
      siteName,
      image: defaultImage,
      canonicalBaseUrl,
    };
  }

  if (PREFIX_SPA_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return {
      title: `Backoffice | ${siteName}`,
      description: `Interface d'administration ${siteName}.`,
      robots: "noindex,nofollow",
      ogType: "website",
      pathname,
      siteName,
      image: defaultImage,
      canonicalBaseUrl,
    };
  }

  if (EXACT_SPA_ROUTES.has(pathname)) {
    return {
      title: defaultTitle,
      description: defaultDescription,
      robots: "index,follow",
      ogType: "website",
      pathname,
      siteName,
      image: defaultImage,
      canonicalBaseUrl,
    };
  }

  return null;
}

function renderHtmlWithSeo(req, meta) {
  const template = ensureIndexTemplate();
  const safeMeta = meta || {
    title: DEFAULT_SITE_SETTINGS.seo.defaultMetaTitle.fr,
    description: DEFAULT_SITE_SETTINGS.seo.defaultMetaDescription.fr,
  };
  const baseUrl = normalizeBaseUrl(safeMeta.canonicalBaseUrl) || getCanonicalBaseUrl(req);
  const pathname = safeMeta.pathname || req.path || "/";
  const canonical = `${baseUrl}${pathname}`;
  const image = String(safeMeta.image || "/pizza-background-1920.webp").startsWith("http")
    ? String(safeMeta.image || "/pizza-background-1920.webp")
    : `${baseUrl}${String(safeMeta.image || "/pizza-background-1920.webp").startsWith("/") ? String(safeMeta.image || "/pizza-background-1920.webp") : `/${String(safeMeta.image || "/pizza-background-1920.webp")}`}`;

  const titleTag = `<title>${escapeHtml(safeMeta.title)}</title>`;
  const descriptionTag = `<meta name="description" content="${escapeHtmlAttr(safeMeta.description)}" />`;
  const robotsTag = `<meta name="robots" content="${escapeHtmlAttr(safeMeta.robots || "index,follow")}" />`;
  const canonicalTag = `<link rel="canonical" href="${escapeHtmlAttr(canonical)}" />`;
  const ogTags = [
    `<meta property="og:type" content="${escapeHtmlAttr(safeMeta.ogType || "website")}" />`,
    `<meta property="og:site_name" content="${escapeHtmlAttr(safeMeta.siteName || DEFAULT_SITE_SETTINGS.siteName)}" />`,
    '<meta property="og:locale" content="fr_FR" />',
    `<meta property="og:title" content="${escapeHtmlAttr(safeMeta.title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(safeMeta.description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtmlAttr(image)}" />`,
  ].join("\n    ");
  const twitterTags = [
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtmlAttr(safeMeta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(safeMeta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtmlAttr(image)}" />`,
  ].join("\n    ");

  const dynamicSeoBlock = `<!-- dynamic-seo-start -->
    ${descriptionTag}
    ${robotsTag}
    ${canonicalTag}
    ${ogTags}
    ${twitterTags}
    <!-- dynamic-seo-end -->`;

  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, titleTag);
  html = html.replace(/<meta\s+name="description"[\s\S]*?>/i, "");
  html = html.replace(/<!-- dynamic-seo-start -->[\s\S]*?<!-- dynamic-seo-end -->/i, "");
  html = html.replace("</head>", `  ${dynamicSeoBlock}\n  </head>`);

  return html;
}

function sendNoindex404(res) {
  res
    .status(404)
    .set("Content-Type", "text/html; charset=utf-8")
    .set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    .set("Pragma", "no-cache")
    .set("Expires", "0")
    .set("X-Robots-Tag", "noindex, nofollow")
    .send(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>404 - Page introuvable</title>
    <meta name="robots" content="noindex,nofollow" />
  </head>
  <body style="font-family: Arial, sans-serif; background:#111827; color:#f3f4f6; margin:0; padding:32px;">
    <main style="max-width:720px; margin:0 auto;">
      <h1 style="font-size:28px; margin-bottom:12px;">404 - Page introuvable</h1>
      <p style="line-height:1.6;">Cette URL n'est pas disponible.</p>
      <p><a href="/" style="color:#fbbf24;">Retour a l'accueil</a></p>
    </main>
  </body>
</html>`);
}

function sendSpaWithSeo(req, res, meta) {
  const html = renderHtmlWithSeo(req, meta);
  res
    .status(200)
    .set("Content-Type", "text/html; charset=utf-8")
    .set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    .set("Pragma", "no-cache")
    .set("Expires", "0")
    .send(html);
}

app.disable("x-powered-by");
app.use(express.static(BUILD_DIR, { index: false, maxAge: "7d" }));

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendNoindex404(res);
  }

  const pathname = req.path || "/";

  if (pathname.length > 1 && pathname.endsWith("/")) {
    const normalizedPath = pathname.replace(/\/+$/, "");
    const queryIndex = req.url.indexOf("?");
    const search = queryIndex >= 0 ? req.url.slice(queryIndex) : "";
    return res.redirect(301, `${normalizedPath}${search}`);
  }

  const legacyBlogMatch = /^\/blog\/([a-z0-9-]+)$/.exec(pathname.toLowerCase());
  if (legacyBlogMatch) {
    const requestedSlug = slugify(legacyBlogMatch[1]);
    const cache = await refreshSeoCacheIfNeeded();
    if (cache.blogSlugs.has(requestedSlug)) {
      return res.redirect(301, `/${requestedSlug}`);
    }

    const forcedCache = await refreshSeoCacheIfNeeded({ force: true });
    if (forcedCache.blogSlugs.has(requestedSlug)) {
      return res.redirect(301, `/${requestedSlug}`);
    }

    return sendNoindex404(res);
  }

  if (pathname === "/pizza") {
    const locationIdParam = String(
      req.query?.locationId || req.query?.locationID || req.query?.locationid || ""
    ).trim();
    if (!locationIdParam) {
      return sendNoindex404(res);
    }

    const locationId = Number(locationIdParam);
    if (!Number.isFinite(locationId) || locationId <= 0) {
      return sendNoindex404(res);
    }

    const cache = await refreshSeoCacheIfNeeded();
    const slug = cache.citySlugByLocationId.get(locationId);
    if (slug) {
      return res.redirect(302, `/pizza-${slug}`);
    }

    const forcedCache = await refreshSeoCacheIfNeeded({ force: true });
    const forcedSlug = forcedCache.citySlugByLocationId.get(locationId);
    if (forcedSlug) {
      return res.redirect(302, `/pizza-${forcedSlug}`);
    }

    return sendNoindex404(res);
  }

  if (
    EXACT_SPA_ROUTES.has(pathname) ||
    PREFIX_SPA_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    const cache = await refreshSeoCacheIfNeeded();
    const meta = buildSeoMeta(pathname, cache);
    return sendSpaWithSeo(req, res, meta);
  }

  const cache = await refreshSeoCacheIfNeeded();
  const dynamicMeta = buildSeoMeta(pathname, cache);
  if (dynamicMeta) {
    return sendSpaWithSeo(req, res, dynamicMeta);
  }

  if (isDynamicSeoPath(pathname)) {
    const forcedCache = await refreshSeoCacheIfNeeded({ force: true });
    const forcedDynamicMeta = buildSeoMeta(pathname, forcedCache);
    if (forcedDynamicMeta) {
      return sendSpaWithSeo(req, res, forcedDynamicMeta);
    }
  }

  return sendNoindex404(res);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Web service front running on port ${PORT}`);
  });
}

module.exports = {
  app,
};
