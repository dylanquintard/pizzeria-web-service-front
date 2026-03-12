const fs = require("fs");
const express = require("express");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const BUILD_DIR = path.join(__dirname, "build");
const INDEX_FILE = path.join(BUILD_DIR, "index.html");
const SEO_CACHE_TTL_MS = Number(process.env.SEO_CACHE_TTL_MS || 300000);
const SEO_FETCH_TIMEOUT_MS = Number(process.env.SEO_FETCH_TIMEOUT_MS || 6000);

const FIXED_CITY_SLUGS = new Set(["thionville", "metz", "moselle"]);
const DEFAULT_BLOG_SLUGS = new Set([
  "pourquoi-la-pizza-napolitaine-est-differente",
  "la-cuisson-au-feu-de-bois",
  "les-ingredients-italiens-authentiques",
  "la-farine-nuvola-super",
  "tomates-san-marzano",
]);

const STATIC_PAGE_META = {
  "/": {
    title: "Pizza Truck | Pizza napolitaine au feu de bois en Moselle",
    description:
      "Pizza napolitaine au feu de bois en Moselle. Camion pizza artisanal autour de Thionville et Metz, commande en ligne et retrait rapide.",
  },
  "/menu": {
    title: "Menu pizzas napolitaines | Pizza Truck",
    description:
      "Consultez la carte Pizza Truck: pizzas napolitaines artisanales, ingredients italiens et cuisson au four a bois et gaz.",
  },
  "/planing": {
    title: "Horaires & deplacements du camion pizza | Pizza Truck",
    description:
      "Retrouvez les horaires d'ouvertures, emplacements et deplacements du camion pizza napolitain.",
  },
  "/a-propos": {
    title: "A propos | Pizza Truck",
    description:
      "Decouvrez Pizza Truck: pate maison, produits italiens, cuisson au four a bois et gaz et service a emporter.",
  },
  "/contact": {
    title: "Contact | Pizza Truck",
    description:
      "Contactez Pizza Truck pour toute question sur la commande, les horaires d'ouvertures et les emplacements du camion.",
  },
  "/blog": {
    title: "Blog pizza napolitaine | Pizza Truck",
    description:
      "Articles Pizza Truck: pizza napolitaine, cuisson, ingredients italiens et savoir-faire artisanal.",
  },
  "/pizza-napolitaine-thionville": {
    title: "Pizza napolitaine proche de Thionville | Camion pizza artisanal",
    description:
      "Pizza napolitaine artisanale proche de Thionville: cuisson bois-gaz, produits italiens selectionnes et retrait rapide.",
  },
  "/pizza-napolitaine-metz": {
    title: "Pizza napolitaine proche de Metz | Camion pizza artisanal",
    description:
      "Pizza napolitaine artisanale proche de Metz: camion pizza, produits italiens et cuisson au four a bois et gaz.",
  },
  "/food-truck-pizza-moselle": {
    title: "Food truck pizza en Moselle | Pizza napolitaine artisanale",
    description:
      "Food truck pizza en Moselle: pizzas napolitaines artisanales, ingredients italiens et retrait rapide.",
  },
};

const BLOG_META_BY_SLUG = {
  "pourquoi-la-pizza-napolitaine-est-differente": {
    title: "Pourquoi la pizza napolitaine est differente",
    description:
      "Comprendre ce qui distingue une pizza napolitaine artisanale: pate, cuisson, ingredients et texture.",
  },
  "la-cuisson-au-feu-de-bois": {
    title: "La cuisson au feu de bois",
    description:
      "Decouvrez pourquoi la cuisson au feu de bois apporte une texture legere et un gout typique a la pizza.",
  },
  "les-ingredients-italiens-authentiques": {
    title: "Les ingredients italiens authentiques",
    description:
      "Tour d'horizon des ingredients italiens utilises pour une pizza napolitaine artisanale.",
  },
  "la-farine-nuvola-super": {
    title: "La farine Nuvola Super",
    description:
      "Pourquoi la farine Nuvola Super est appreciee pour obtenir une pate napolitaine alveolee.",
  },
  "tomates-san-marzano": {
    title: "Tomates San Marzano",
    description:
      "Ce qu'apportent les tomates San Marzano dans la sauce d'une pizza napolitaine.",
  },
};

const EXACT_SPA_ROUTES = new Set([
  "/",
  "/menu",
  "/planing",
  "/tournee",
  "/tournee-camion",
  "/a-propos",
  "/contact",
  "/blog",
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
  blogSlugs: new Set(DEFAULT_BLOG_SLUGS),
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

async function refreshSeoCacheIfNeeded() {
  const now = Date.now();
  if (seoCache.expiresAt > now) return seoCache;

  const nextCitySlugs = new Set(FIXED_CITY_SLUGS);
  const nextBlogSlugs = new Set(DEFAULT_BLOG_SLUGS);

  try {
    const [locationsData, blogSlugsData] = await Promise.all([
      fetchJsonWithTimeout(buildApiUrl("/locations?active=true")),
      fetchJsonWithTimeout(buildApiUrl("/seo/blog-slugs")),
    ]);

    if (Array.isArray(locationsData)) {
      for (const location of locationsData) {
        const fromName = slugify(location?.name);
        const fromCity = slugify(location?.city);
        if (fromName) nextCitySlugs.add(fromName);
        if (fromCity) nextCitySlugs.add(fromCity);
      }
    }

    if (Array.isArray(blogSlugsData?.slugs)) {
      nextBlogSlugs.clear();
      for (const slug of blogSlugsData.slugs) {
        const normalized = slugify(slug);
        if (normalized) nextBlogSlugs.add(normalized);
      }
      if (nextBlogSlugs.size === 0) {
        DEFAULT_BLOG_SLUGS.forEach((slug) => nextBlogSlugs.add(slug));
      }
    }

    seoCache.citySlugs = nextCitySlugs;
    seoCache.blogSlugs = nextBlogSlugs;
    seoCache.expiresAt = now + SEO_CACHE_TTL_MS;
  } catch (_error) {
    seoCache.expiresAt = now + Math.min(SEO_CACHE_TTL_MS, 60000);
  }

  return seoCache;
}

function buildSeoMeta(pathname, cache) {
  if (STATIC_PAGE_META[pathname]) {
    return {
      ...STATIC_PAGE_META[pathname],
      robots: "index,follow",
      ogType: "website",
      pathname,
    };
  }

  const blogMatch = /^\/blog\/([^/]+)$/.exec(pathname);
  if (blogMatch) {
    const slug = slugify(blogMatch[1]);
    if (!cache.blogSlugs.has(slug)) return null;
    const articleMeta = BLOG_META_BY_SLUG[slug];
    return {
      title: articleMeta ? `${articleMeta.title} | Blog Pizza Truck` : "Article | Blog Pizza Truck",
      description:
        articleMeta?.description ||
        "Article du blog Pizza Truck sur la pizza napolitaine artisanale et les ingredients italiens.",
      robots: "index,follow",
      ogType: "article",
      pathname,
    };
  }

  const pizzaDashMatch = /^\/pizza-([a-z0-9-]+)$/.exec(pathname);
  if (pizzaDashMatch) {
    const slug = slugify(pizzaDashMatch[1]);
    if (!cache.citySlugs.has(slug)) return null;
    const city = titleizeSlug(slug);
    return {
      title: `Pizza napolitaine a ${city} | Camion pizza artisanal`,
      description:
        `Pizza napolitaine artisanale a ${city}: ingredients italiens, cuisson au four a bois et gaz, service a emporter.`,
      robots: "index,follow",
      ogType: "website",
      pathname,
    };
  }

  const legacyPizzaMatch = /^\/pizza\/([^/]+)$/.exec(pathname);
  if (legacyPizzaMatch) {
    const slug = slugify(legacyPizzaMatch[1]);
    if (!cache.citySlugs.has(slug)) return null;
    return {
      title: "Redirection vers la page locale",
      description: "Redirection vers la page locale officielle Pizza Truck.",
      robots: "noindex,follow",
      ogType: "website",
      pathname,
    };
  }

  if (PREFIX_SPA_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return {
      title: "Backoffice | Pizza Truck",
      description: "Interface d'administration Pizza Truck.",
      robots: "noindex,nofollow",
      ogType: "website",
      pathname,
    };
  }

  if (EXACT_SPA_ROUTES.has(pathname)) {
    return {
      title: "Pizza Truck",
      description: "Pizza napolitaine artisanale et commande a emporter.",
      robots: "index,follow",
      ogType: "website",
      pathname,
    };
  }

  return null;
}

function renderHtmlWithSeo(req, meta) {
  const template = ensureIndexTemplate();
  const safeMeta = meta || STATIC_PAGE_META["/"];
  const baseUrl = getCanonicalBaseUrl(req);
  const pathname = safeMeta.pathname || req.path || "/";
  const canonical = `${baseUrl}${pathname}`;
  const image = `${baseUrl}/pizza-background-1920.webp`;

  const titleTag = `<title>${escapeHtml(safeMeta.title)}</title>`;
  const descriptionTag = `<meta name="description" content="${escapeHtmlAttr(safeMeta.description)}" />`;
  const robotsTag = `<meta name="robots" content="${escapeHtmlAttr(safeMeta.robots || "index,follow")}" />`;
  const canonicalTag = `<link rel="canonical" href="${escapeHtmlAttr(canonical)}" />`;
  const ogTags = [
    `<meta property="og:type" content="${escapeHtmlAttr(safeMeta.ogType || "website")}" />`,
    '<meta property="og:site_name" content="Pizza Truck" />',
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
  res.status(200).set("Content-Type", "text/html; charset=utf-8").send(html);
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
