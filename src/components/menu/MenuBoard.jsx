import { useMemo } from "react";

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

function getCategoryWeight(category) {
  return category.items?.length || category.products?.length || 1;
}

function buildMenuColumns(categories) {
  if (!categories?.length) {
    return { left: [], right: [] };
  }

  const left = categories.slice(0, 2);
  const right = [];

  let leftWeight = left.reduce((sum, category) => sum + getCategoryWeight(category), 0);
  let rightWeight = 0;

  for (const category of categories.slice(2)) {
    const weight = getCategoryWeight(category);

    if (rightWeight <= leftWeight) {
      right.push(category);
      rightWeight += weight;
    } else {
      left.push(category);
      leftWeight += weight;
    }
  }

  return { left, right };
}

function buildMenuGroups(categories, products, tr) {
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
}

function CategorySection({ group, variant = "default" }) {
  const isCompact = variant === "compact";

  return (
    <section
      className={`rounded-3xl border border-white/10 bg-charcoal/35 ${
        isCompact ? "p-4 sm:p-6" : "p-4 sm:p-7"
      }`}
    >
      <div className={`border-b border-white/10 ${isCompact ? "mb-3 pb-3" : "mb-4 pb-3"}`}>
        <h3
          className={`font-display uppercase tracking-[0.08em] text-crust ${
            isCompact ? "text-2xl sm:text-3xl" : "text-2xl sm:text-4xl"
          }`}
        >
          {group.title}
        </h3>
        {group.description ? (
          <p className={`mt-1 text-stone-400 ${isCompact ? "text-xs sm:text-sm" : "text-sm"}`}>
            {group.description}
          </p>
        ) : null}
      </div>

      <div>
        {group.items.map((product) => (
          <article
            key={product.id}
            className={`border-b border-white/10 last:border-b-0 ${isCompact ? "py-3" : "py-3 sm:py-4"}`}
          >
            <div className={`flex flex-wrap items-start gap-2 ${isCompact ? "sm:gap-2.5" : "sm:gap-3"}`}>
              <h4
                className={`min-w-0 flex-1 font-semibold uppercase tracking-wide text-white ${
                  isCompact ? "text-sm sm:text-base" : "text-sm sm:text-lg"
                }`}
              >
                {product.name}
              </h4>
              <div className="mt-3 hidden h-px flex-1 border-t border-dashed border-stone-500/70 sm:block" />
              <span
                className={`whitespace-nowrap font-extrabold uppercase tracking-wide text-saffron ${
                  isCompact ? "text-xs sm:text-sm" : "text-xs sm:text-base"
                }`}
              >
                {formatPrice(product.basePrice)} EUR
              </span>
            </div>

            {product.description ? (
              <p className={`mt-1 text-stone-300 ${isCompact ? "text-xs sm:text-sm" : "text-sm"}`}>
                {product.description}
              </p>
            ) : null}

            {product.ingredients?.length > 0 ? (
              <p
                className={`mt-2 uppercase text-stone-400 ${
                  isCompact ? "text-[10px] tracking-[0.12em]" : "text-[10px] sm:text-xs sm:tracking-[0.14em]"
                }`}
              >
                {product.ingredients.map((pi) => pi.ingredient.name).join(" - ")}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function MenuBoard({
  products = [],
  categories = [],
  tr,
  variant = "default",
  emptyMessage,
}) {
  const groupedByCategory = useMemo(
    () => buildMenuGroups(categories, products, tr),
    [categories, products, tr]
  );
  const menuColumns = useMemo(
    () => buildMenuColumns(groupedByCategory),
    [groupedByCategory]
  );

  if (groupedByCategory.length === 0) {
    return (
      <div className={`glass-panel text-stone-300 ${variant === "compact" ? "p-5" : "p-6"}`}>
        {emptyMessage || tr("Le menu sera disponible ici.", "The menu will be available here.")}
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 lg:hidden ${variant === "compact" ? "" : "sm:space-y-8"}`}>
        {groupedByCategory.map((group) => (
          <CategorySection key={group.key} group={group} variant={variant} />
        ))}
      </div>

      <div className={`hidden grid-cols-2 lg:grid lg:items-start ${variant === "compact" ? "gap-5" : "gap-8"}`}>
        <div className={variant === "compact" ? "space-y-5" : "space-y-8"}>
          {menuColumns.left.map((group) => (
            <CategorySection key={group.key} group={group} variant={variant} />
          ))}
        </div>
        <div className={variant === "compact" ? "space-y-5" : "space-y-8"}>
          {menuColumns.right.map((group) => (
            <CategorySection key={group.key} group={group} variant={variant} />
          ))}
        </div>
      </div>
    </>
  );
}
