import { useEffect, useState } from "react";
import { getCategories } from "../api/category.api";
import { useLanguage } from "../context/LanguageContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getAllProductsClient } from "../api/user.api";
import PageFaqSection from "../components/common/PageFaqSection";
import MenuBoard from "../components/menu/MenuBoard";
import SeoHead from "../components/seo/SeoHead";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import { DEFAULT_SITE_SETTINGS } from "../site/siteSettings";

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

      <MenuBoard
        products={products}
        categories={categories}
        tr={tr}
        variant="default"
        emptyMessage={tr("Aucun plat disponible.", "No dish available.")}
      />

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
