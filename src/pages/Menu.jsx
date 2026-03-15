import { useEffect, useMemo, useState } from "react";
import { getCategories } from "../api/category.api";
import { useLanguage } from "../context/LanguageContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getAllProductsClient } from "../api/user.api";
import PageFaqSection from "../components/common/PageFaqSection";
import SeoHead from "../components/seo/SeoHead";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import { DEFAULT_SITE_SETTINGS } from "../site/siteSettings";

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

export default function Menu() {
  const { tr } = useLanguage();
  const { settings } = useSiteSettings();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchMenu = async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          getAllProductsClient(),
          getCategories({ active: true, kind: "PRODUCT" }),
        ]);

        if (!cancelled) {
          setProducts(Array.isArray(productData) ? productData : []);
          setCategories(Array.isArray(categoryData) ? categoryData : []);
        }
      } catch (_err) {
        if (!cancelled) {
          setMessage(tr("Erreur lors du chargement du menu", "Error while loading menu"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMenu();
    return () => {
      cancelled = true;
    };
  }, [tr]);

  const groupedByCategory = useMemo(() => {
    const grouped = categories.map((category) => ({
      key: `category-${category.id}`,
      title: category.name,
      description: category.description,
      items: products.filter((product) => product.categoryId === category.id),
    }));

    const uncategorized = products.filter((product) => !product.categoryId);
    if (uncategorized.length > 0) {
      grouped.push({
        key: "category-uncategorized",
        title: tr("Autres", "Others"),
        description: "",
        items: uncategorized,
      });
    }

    if (grouped.length === 0 && products.length > 0) {
      grouped.push({
        key: "category-default",
        title: tr("Carte", "Menu"),
        description: "",
        items: products,
      });
    }

    const visibleGroups = grouped.filter((bucket) => bucket.items.length > 0);

    return visibleGroups
      .map((bucket, index) => ({ bucket, index }))
      .sort((left, right) => {
        const leftPriority = normalizeText(left.bucket.title).includes("pizza") ? 0 : 1;
        const rightPriority = normalizeText(right.bucket.title).includes("pizza") ? 0 : 1;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
        return left.index - right.index;
      })
      .map(({ bucket }) => bucket);
  }, [products, categories, tr]);

  const siteName = settings.siteName || DEFAULT_SITE_SETTINGS.siteName;

  if (loading) {
    return (
      <div className="section-shell py-12">
        <p className="text-sm text-stone-300">{tr("Chargement du menu...", "Loading menu...")}</p>
      </div>
    );
  }

  if (message) {
    return (
      <div className="section-shell py-12">
        <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{message}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="section-shell py-12">
        <p className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-stone-300">{tr("Aucun plat disponible.", "No dish available.")}</p>
      </div>
    );
  }

  return (
    <div className="section-shell space-y-10 pb-20 pt-12 sm:pt-14">
      <SeoHead
        title={tr(
          `Menu | ${siteName}`,
          `Menu | ${siteName}`
        )}
        description={tr(
          `Consultez le menu pizza napolitaine artisanal de ${siteName} en Moselle. Recettes, ingredients et prix.`,
          `Browse ${siteName}'s handmade Neapolitan pizza menu in Moselle. Recipes, ingredients and prices.`
        )}
        pathname="/menu"
        jsonLd={buildBaseFoodEstablishmentJsonLd({
          pagePath: "/menu",
          pageName: tr("Menu pizza napolitaine", "Neapolitan pizza menu"),
          description: tr(
            `Consultez le menu pizza napolitaine artisanal de ${siteName} en Moselle. Recettes, ingredients et prix.`,
            `Browse ${siteName}'s handmade Neapolitan pizza menu in Moselle. Recipes, ingredients and prices.`
          ),
          siteName,
        })}
      />
      <header className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-saffron">{tr("Menu restaurant", "Restaurant menu")}</p>
        <h1 className="font-display text-5xl uppercase tracking-[0.08em] text-white sm:text-6xl">{tr("Notre carte", "Our menu")}</h1>
        <p className="mx-auto max-w-2xl text-sm text-stone-300 sm:text-base">
          {tr(
            "Pizzas au four a bois et produits frais, presentes comme une vraie carte de restaurant.",
            "Wood-fired pizzas and fresh products, displayed like a real restaurant menu."
          )}
        </p>
      </header>

      <div className="space-y-8">
        {groupedByCategory.map((group) => (
          <section key={group.key} className="rounded-3xl border border-white/10 bg-charcoal/35 p-4 sm:p-7">
            <div className="mb-4 border-b border-white/10 pb-3">
              <h3 className="font-display text-2xl uppercase tracking-[0.08em] text-crust sm:text-4xl">{group.title}</h3>
              {group.description && <p className="mt-1 text-sm text-stone-400">{group.description}</p>}
            </div>

            <div>
              {group.items.map((product) => (
                <article key={product.id} className="border-b border-white/10 py-3 last:border-b-0 sm:py-4">
                  <div className="flex flex-wrap items-start gap-2 sm:gap-3">
                    <h4 className="min-w-0 flex-1 text-sm font-semibold uppercase tracking-wide text-white sm:text-lg">{product.name}</h4>
                    <div className="mt-3 hidden h-px flex-1 border-t border-dashed border-stone-500/70 sm:block" />
                    <span className="whitespace-nowrap text-xs font-extrabold uppercase tracking-wide text-saffron sm:text-base">
                      {formatPrice(product.basePrice)} EUR
                    </span>
                  </div>

                  {product.description && <p className="mt-1 text-sm text-stone-300">{product.description}</p>}

                  {product.ingredients?.length > 0 && (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-stone-400 sm:text-xs sm:tracking-[0.14em]">
                      {product.ingredients.map((pi) => pi.ingredient.name).join(" - ")}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <PageFaqSection
        pathname="/menu"
        title={tr("Questions frequentes sur le menu", "Frequently asked questions about the menu")}
        intro={tr(
          "Ajoute ici les reponses les plus utiles sur les pizzas, les ingredients et la commande.",
          "Add here the most useful answers about pizzas, ingredients and ordering."
        )}
      />
    </div>
  );
}
