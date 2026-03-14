import { useEffect, useMemo, useState } from "react";
import { getPublicReviews } from "../../api/review.api";
import { useLanguage } from "../../context/LanguageContext";

function formatReviewDate(value, locale) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch (_err) {
    return "";
  }
}

function renderStars(rating) {
  const score = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, index) => (index < score ? "★" : "☆")).join("");
}

export default function PublicReviewsSection() {
  const { tr, locale } = useLanguage();
  const [payload, setPayload] = useState({ summary: { averageRating: 0, totalReviews: 0 }, reviews: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getPublicReviews({ limit: 6 })
      .then((data) => {
        if (!cancelled) {
          setPayload({
            summary: data?.summary || { averageRating: 0, totalReviews: 0 },
            reviews: Array.isArray(data?.reviews) ? data.reviews : [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPayload({ summary: { averageRating: 0, totalReviews: 0 }, reviews: [] });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const averageLabel = useMemo(() => {
    const average = Number(payload.summary?.averageRating || 0);
    if (!average) return "0.0";
    return average.toFixed(1);
  }, [payload.summary?.averageRating]);

  if (!loading && (!Array.isArray(payload.reviews) || payload.reviews.length === 0)) {
    return null;
  }

  return (
    <section className="section-shell space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.25em] text-saffron">
            {tr("Avis clients", "Customer reviews")}
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-wide text-white">
            {tr("Ce que disent les commandes finalisees", "What finalized orders are saying")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-300 sm:text-base">
            {tr(
              "Ces avis proviennent uniquement de clients ayant recupere une commande finalisee.",
              "These reviews only come from customers who completed a finalized order."
            )}
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-saffron/25 bg-saffron/10 px-5 py-4 text-right">
          <p className="text-[11px] uppercase tracking-[0.22em] text-saffron">
            {tr("Moyenne", "Average")}
          </p>
          <p className="mt-1 text-3xl font-bold text-white">{averageLabel}/5</p>
          <p className="mt-1 text-xs text-stone-300">
            {payload.summary?.totalReviews || 0} {tr("avis", "reviews")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {(loading ? Array.from({ length: 3 }, (_, index) => ({ id: `skeleton-${index}` })) : payload.reviews).map((review) => (
          <article
            key={review.id}
            className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5"
          >
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="h-14 rounded bg-white/10" />
                <div className="h-3 w-28 rounded bg-white/10" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg tracking-[0.18em] text-saffron">{renderStars(review.rating)}</p>
                  {review.locationLabel ? (
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-stone-300">
                      {review.locationLabel}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-sm leading-7 text-stone-200">{review.comment}</p>

                <div className="mt-4 border-t border-white/10 pt-4 text-xs text-stone-400">
                  <p className="font-semibold uppercase tracking-[0.16em] text-white">
                    {review.customerLabel}
                  </p>
                  <p className="mt-1">{formatReviewDate(review.createdAt, locale)}</p>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
