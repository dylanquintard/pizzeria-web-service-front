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

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
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
  if (seoCache.expiresAt > now) {
    return seoCache;
  }

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
    // Keep existing cache values if refresh fails; retry soon.
    seoCache.expiresAt = now + Math.min(SEO_CACHE_TTL_MS, 60000);
  }

  return seoCache;
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

function serveSpa(res) {
  res.sendFile(INDEX_FILE);
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

  if (EXACT_SPA_ROUTES.has(pathname)) {
    return serveSpa(res);
  }

  if (PREFIX_SPA_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return serveSpa(res);
  }

  const blogMatch = /^\/blog\/([^/]+)$/.exec(pathname);
  if (blogMatch) {
    const cache = await refreshSeoCacheIfNeeded();
    const blogSlug = slugify(blogMatch[1]);
    if (cache.blogSlugs.has(blogSlug)) {
      return serveSpa(res);
    }
    return sendNoindex404(res);
  }

  const pizzaDashMatch = /^\/pizza-([a-z0-9-]+)$/.exec(pathname);
  if (pizzaDashMatch) {
    const cache = await refreshSeoCacheIfNeeded();
    const slug = slugify(pizzaDashMatch[1]);
    if (cache.citySlugs.has(slug)) {
      return serveSpa(res);
    }
    return sendNoindex404(res);
  }

  const legacyPizzaMatch = /^\/pizza\/([^/]+)$/.exec(pathname);
  if (legacyPizzaMatch) {
    const cache = await refreshSeoCacheIfNeeded();
    const slug = slugify(legacyPizzaMatch[1]);
    if (cache.citySlugs.has(slug)) {
      return serveSpa(res);
    }
    return sendNoindex404(res);
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
