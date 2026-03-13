import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublishedBlogArticles } from "../api/blog.api";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";

function formatPublishDate(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch (_err) {
    return "";
  }
}

export default function Blog() {
  const title = "Blog pizza napolitaine | Pizza Truck";
  const description =
    "Analyses et articles sur la pate, la cuisson, les ingredients et les choix techniques qui structurent une pizza mieux executee.";

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBlogArticles() {
      try {
        setLoading(true);
        const data = await getPublishedBlogArticles();
        if (!cancelled) {
          setArticles(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setArticles([]);
          setError(
            err?.response?.data?.error || "Impossible de charger les articles du blog."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBlogArticles();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead title={title} description={description} pathname="/blog" />

      <header className="grid gap-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.18),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] p-6 sm:p-8 lg:grid-cols-[1.4fr_0.7fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-saffron">Blog</p>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
            Articles pizza napolitaine
          </h1>
          <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
            Des contenus clairs sur la pate, la cuisson, l organisation du service et les
            choix qui font une pizza plus nette en bouche.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/menu"
              className="rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
            >
              Voir le menu
            </Link>
            <Link
              to="/planing"
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              Voir les horaires
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Articles</p>
            <p className="mt-2 text-3xl font-bold text-white">{articles.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Format</p>
            <p className="mt-2 text-sm text-stone-200">Titres clairs, lecture rapide, pages SEO dediees.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Navigation</p>
            <p className="mt-2 text-sm text-stone-200">Chaque article a son URL courte et un acces depuis cette page.</p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`blog-skeleton-${index}`}
              className="glass-panel animate-pulse space-y-4 p-5"
            >
              <div className="h-3 w-28 rounded bg-white/10" />
              <div className="h-7 w-4/5 rounded bg-white/10" />
              <div className="h-20 rounded bg-white/10" />
              <div className="h-9 w-32 rounded-full bg-white/10" />
            </div>
          ))}
        </section>
      ) : articles.length === 0 ? (
        <section className="glass-panel space-y-3 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-saffron">Blog vide</p>
          <h2 className="text-2xl font-bold text-white">Aucun article publie pour le moment</h2>
          <p className="mx-auto max-w-2xl text-sm text-stone-300">
            Les prochains articles apparaitront ici automatiquement des qu ils seront
            publies depuis l espace administrateur.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group flex h-full flex-col rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 transition hover:border-saffron/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]"
            >
              {article.featuredImage?.imageUrl ? (
                <div className="mb-4 overflow-hidden rounded-[1.2rem] border border-white/10">
                  <img
                    src={article.featuredImage.imageUrl}
                    alt={article.featuredImage.altText || article.featuredImage.caption || article.title}
                    className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              ) : (
                <div className="mb-4 h-px w-16 bg-gradient-to-r from-saffron via-saffron/50 to-transparent" />
              )}

              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-stone-400">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {formatPublishDate(article.publishedAt || article.updatedAt) || "Article"}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold leading-tight text-white transition group-hover:text-saffron">
                {article.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-stone-300">
                {article.description}
              </p>

              <div className="mt-6">
                <Link
                  to={`/${article.slug}`}
                  className="inline-flex rounded-full border border-saffron/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
                >
                  Lire l'article
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      <SeoInternalLinks />
    </div>
  );
}
