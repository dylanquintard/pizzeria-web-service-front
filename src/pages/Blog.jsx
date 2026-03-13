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
        <section className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`blog-skeleton-${index}`}
              className="glass-panel animate-pulse space-y-4 p-6"
            >
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="h-8 w-4/5 rounded bg-white/10" />
              <div className="h-16 rounded bg-white/10" />
              <div className="h-10 w-36 rounded-full bg-white/10" />
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
        <section className="grid gap-5 md:grid-cols-2">
          {articles.map((article) => (
            <article
              key={article.id}
              className="glass-panel group flex h-full flex-col overflow-hidden p-0"
            >
              {article.featuredImage?.imageUrl ? (
                <img
                  src={article.featuredImage.imageUrl}
                  alt={article.featuredImage.altText || article.featuredImage.caption || article.title}
                  className="h-56 w-full object-cover"
                />
              ) : null}

              <div className="p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {formatPublishDate(article.publishedAt || article.updatedAt) || "Article"}
                </span>
                <span className="rounded-full border border-saffron/30 px-3 py-1 text-saffron">
                  {article.paragraphCount} section{article.paragraphCount > 1 ? "s" : ""}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {article.imageCount || 0} visuel{article.imageCount > 1 ? "x" : ""}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-white transition group-hover:text-saffron">
                {article.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-stone-300">
                {article.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <code className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-stone-300">
                  /{article.slug}
                </code>
                <Link
                  to={`/${article.slug}`}
                  className="rounded-full border border-saffron/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
                >
                  Lire l'article
                </Link>
              </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <SeoInternalLinks />
    </div>
  );
}
