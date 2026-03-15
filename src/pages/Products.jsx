import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  activateIngredient,
  createIngredient,
  createProduct,
  deleteIngredient,
  deleteProduct,
  getAllIngredients,
  getAllProducts,
  updateIngredient,
} from "../api/admin.api";
import {
  activateCategory,
  createCategory,
  getCategories,
  updateCategory,
} from "../api/category.api";
import {
  ActionIconButton,
  CheckIcon,
  DeleteIcon,
  EditIcon,
  StatusToggle,
} from "../components/ui/AdminActions";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const KIND = {
  MENU: "PRODUCT",
  INGREDIENT: "INGREDIENT",
};

function toMoney(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function sortCategories(list) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => {
    const orderDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    if (orderDiff !== 0) return orderDiff;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function sortByName(list) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );
}

function moveOpenedCategoryToTop(list, openedId) {
  if (!openedId) return list;

  const openedEntry = list.find((entry) => String(entry.id) === String(openedId));
  if (!openedEntry) return list;

  return [
    openedEntry,
    ...list.filter((entry) => String(entry.id) !== String(openedId)),
  ];
}

function parseSortOrder(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function normalizeIngredient(ingredient) {
  return {
    ...ingredient,
    isEditing: false,
    tempName: ingredient.name || "",
    tempPrice: ingredient.price ?? "",
    tempIsExtra: Boolean(ingredient.isExtra),
    tempIsBaseIngredient: Boolean(ingredient.isBaseIngredient),
    active: ingredient.active !== false,
  };
}

function AccordionChevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m5 7 5 6 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CategoryTable({ title, categories, token, tr, onRefresh, onError, kind }) {
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const patchLocal = (id, patch) => {
    onRefresh((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );
  };

  const saveRow = async (category) => {
    setBusyId(category.id);
    try {
      await updateCategory(token, category.id, {
        name: String(category.name || "").trim(),
        description: category.description || null,
        sortOrder: parseSortOrder(category.sortOrder),
        active: Boolean(category.active),
        customerCanCustomize:
          kind === KIND.MENU ? Boolean(category.customerCanCustomize) : false,
        kind: category.kind,
      });
      await onRefresh();
      setEditingId(null);
    } catch (err) {
      onError?.(
        err?.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating")
      );
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (category) => {
    try {
      await activateCategory(token, category.id, !category.active);
      await onRefresh();
    } catch (err) {
      onError?.(
        err?.response?.data?.error ||
          tr("Erreur lors du changement de statut", "Error while changing status")
      );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-charcoal/40 p-3">
      <p className="mb-2 text-sm font-semibold text-white">{title}</p>
      <table>
        <thead>
          <tr>
            <th>{tr("Nom", "Name")}</th>
            {kind === KIND.MENU ? (
              <th>{tr("Modifiable client", "Customer customizable")}</th>
            ) : null}
            <th>{tr("Visible menu", "Visible in menu")}</th>
            <th>{tr("Actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={kind === KIND.MENU ? 4 : 3}>{tr("Aucune categorie", "No category")}</td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr key={category.id}>
                <td>
                  {editingId === category.id ? (
                    <input
                      value={category.name || ""}
                      onChange={(event) => patchLocal(category.id, { name: event.target.value })}
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">{category.name}</span>
                  )}
                </td>
                {kind === KIND.MENU ? (
                  <td>
                    <label className="flex items-center gap-2 text-xs text-stone-200">
                      <span className="sr-only">{tr("Personnalisation client", "Customer customization")}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(category.customerCanCustomize)}
                        disabled={editingId !== category.id}
                        onChange={(event) =>
                          patchLocal(category.id, {
                            customerCanCustomize: event.target.checked,
                          })
                        }
                      />
                    </label>
                  </td>
                ) : null}
                <td>
                  <StatusToggle
                    checked={Boolean(category.active)}
                    onChange={() => toggleActive(category)}
                    labelOn={tr("Masquer", "Hide")}
                    labelOff={tr("Afficher", "Show")}
                    disabled={busyId === category.id}
                  />
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {editingId === category.id ? (
                      <button
                        type="button"
                        onClick={() => saveRow(category)}
                        disabled={busyId === category.id}
                      >
                        {tr("Sauvegarder", "Save")}
                      </button>
                    ) : (
                      <ActionIconButton
                        onClick={() => setEditingId(category.id)}
                        label={tr("Modifier", "Edit")}
                      >
                        <EditIcon />
                      </ActionIconButton>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Products() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const navigate = useNavigate();

  const [menuCategories, setMenuCategories] = useState([]);
  const [ingredientCategories, setIngredientCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  const [activePanel, setActivePanel] = useState("");
  const [selectedMenuCategoryId, setSelectedMenuCategoryId] = useState("");
  const [selectedIngredientCategoryId, setSelectedIngredientCategoryId] = useState("");
  const [openMenuListingCategoryId, setOpenMenuListingCategoryId] = useState("");
  const [openIngredientListingCategoryId, setOpenIngredientListingCategoryId] = useState("");

  const [newMenuCategoryName, setNewMenuCategoryName] = useState("");
  const [newIngredientCategoryName, setNewIngredientCategoryName] = useState("");

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientPrice, setNewIngredientPrice] = useState("");
  const [newIngredientIsExtra, setNewIngredientIsExtra] = useState(true);
  const [newIngredientIsBaseIngredient, setNewIngredientIsBaseIngredient] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const [menuCats, ingCats, productsData, ingredientsData] = await Promise.all([
      getCategories({ kind: KIND.MENU }),
      getCategories({ kind: KIND.INGREDIENT }),
      getAllProducts(token),
      getAllIngredients(token),
    ]);

    const nextMenuCats = sortCategories(menuCats);
    const nextIngCats = sortCategories(ingCats);

    setMenuCategories(nextMenuCats);
    setIngredientCategories(nextIngCats);
    setProducts(sortByName(productsData));
    setIngredients(sortByName(ingredientsData).map(normalizeIngredient));

    setSelectedMenuCategoryId((prev) => {
      const exists = nextMenuCats.some((entry) => String(entry.id) === String(prev));
      return exists ? prev : "";
    });
    setSelectedIngredientCategoryId((prev) => {
      const exists = nextIngCats.some((entry) => String(entry.id) === String(prev));
      return exists ? prev : "";
    });
  }, [token]);

  useEffect(() => {
    if (authLoading || !token || user?.role !== "ADMIN") return;

    setLoading(true);
    fetchAll()
      .then(() => setMessage(""))
      .catch((err) => {
        setMessage(
          err.response?.data?.error ||
            tr("Erreur lors du chargement des donnees du menu", "Error while loading menu data")
        );
      })
      .finally(() => setLoading(false));
  }, [authLoading, token, user, fetchAll, tr]);

  const refreshAfterAction = async (successMessage = "") => {
    await fetchAll();
    setMessage(successMessage);
  };

  const createCategoryByKind = async (kind) => {
    const name =
      kind === KIND.MENU
        ? String(newMenuCategoryName || "").trim()
        : String(newIngredientCategoryName || "").trim();

    if (!name) {
      setMessage(tr("Le nom de categorie est obligatoire", "Category name is required"));
      return;
    }

    try {
      await createCategory(token, {
        name,
        description: null,
        sortOrder: 0,
        active: true,
        customerCanCustomize: false,
        kind,
      });
      if (kind === KIND.MENU) {
        setNewMenuCategoryName("");
      }
      if (kind === KIND.INGREDIENT) {
        setNewIngredientCategoryName("");
      }
      await refreshAfterAction(tr("Categorie creee avec succes", "Category created successfully"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    }
  };

  const createMenuProduct = async () => {
    const name = String(newProductName || "").trim();
    if (!name) {
      setMessage(tr("Le nom du plat est obligatoire", "Dish name is required"));
      return;
    }
    if (!newProductPrice) {
      setMessage(tr("Le prix est obligatoire", "Price is required"));
      return;
    }
    if (!selectedMenuCategoryId) {
      setMessage(tr("Selectionnez une categorie menu", "Select a menu category"));
      return;
    }

    try {
      const created = await createProduct(token, {
        name,
        description: "",
        basePrice: Number(newProductPrice),
        categoryId: Number(selectedMenuCategoryId),
      });
      setNewProductName("");
      setNewProductPrice("");
      setMessage(tr("Plat ajoute au menu", "Dish added to menu"));
      navigate(`/admin/editproduct/${created.id}`);
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    }
  };

  const removeMenuProduct = async (productId) => {
    if (!window.confirm(tr("Supprimer ce plat ?", "Delete this dish?"))) return;
    try {
      await deleteProduct(token, productId);
      await refreshAfterAction(tr("Plat supprime", "Dish deleted"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  const createMenuIngredient = async () => {
    const name = String(newIngredientName || "").trim();
    if (!name) {
      setMessage(tr("Le nom de l'ingredient est obligatoire", "Ingredient name is required"));
      return;
    }
    if (!newIngredientPrice) {
      setMessage(tr("Le prix est obligatoire", "Price is required"));
      return;
    }
    if (!selectedIngredientCategoryId) {
      setMessage(
        tr("Selectionnez une categorie Ingredients & Extras", "Select an Ingredients & Extras category")
      );
      return;
    }

    try {
      await createIngredient(token, {
        name,
        price: Number(newIngredientPrice),
        isExtra: Boolean(newIngredientIsExtra),
        isBaseIngredient: Boolean(newIngredientIsBaseIngredient),
        categoryId: Number(selectedIngredientCategoryId),
      });
      setNewIngredientName("");
      setNewIngredientPrice("");
      setNewIngredientIsExtra(true);
      setNewIngredientIsBaseIngredient(false);
      await refreshAfterAction(tr("Ingredient ajoute avec succes", "Ingredient added successfully"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    }
  };

  const patchIngredient = (ingredientId, patch) => {
    setIngredients((prev) =>
      prev.map((entry) => (entry.id === ingredientId ? { ...entry, ...patch } : entry))
    );
  };

  const toggleIngredientEdit = (ingredient) => {
    patchIngredient(ingredient.id, {
      isEditing: !ingredient.isEditing,
      tempName: ingredient.name || "",
      tempPrice: ingredient.price ?? "",
      tempIsExtra: Boolean(ingredient.isExtra),
      tempIsBaseIngredient: Boolean(ingredient.isBaseIngredient),
    });
  };

  const saveIngredient = async (ingredient) => {
    try {
      const updated = await updateIngredient(token, ingredient.id, {
        name: String(ingredient.tempName || "").trim(),
        price: Number(ingredient.tempPrice),
        isExtra: Boolean(ingredient.tempIsExtra),
        isBaseIngredient: Boolean(ingredient.tempIsBaseIngredient),
      });
      setIngredients((prev) =>
        prev.map((entry) => (entry.id === ingredient.id ? normalizeIngredient(updated) : entry))
      );
      setMessage(tr("Ingredient mis a jour", "Ingredient updated"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating"));
    }
  };

  const toggleIngredientActive = async (ingredient) => {
    try {
      const updated = await activateIngredient(token, ingredient.id, !ingredient.active);
      setIngredients((prev) =>
        prev.map((entry) => (entry.id === ingredient.id ? normalizeIngredient(updated) : entry))
      );
      setMessage(
        updated.active
          ? tr("Ingredient affiche", "Ingredient shown")
          : tr("Ingredient masque", "Ingredient hidden")
      );
    } catch (err) {
      setMessage(
        err.response?.data?.error ||
          tr("Erreur lors du changement de statut", "Error while changing status")
      );
    }
  };

  const removeIngredient = async (ingredientId) => {
    if (!window.confirm(tr("Supprimer cet ingredient ?", "Delete this ingredient?"))) return;
    try {
      await deleteIngredient(token, ingredientId);
      await refreshAfterAction(tr("Ingredient supprime", "Ingredient deleted"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  const productsByCategory = useMemo(() => {
    const grouped = {};
    for (const category of menuCategories) {
      grouped[String(category.id)] = [];
    }
    grouped.uncategorized = [];

    for (const product of products) {
      const key = product.categoryId ? String(product.categoryId) : "uncategorized";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(product);
    }

    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortByName(grouped[key]);
    });

    return grouped;
  }, [menuCategories, products]);

  const ingredientsByCategory = useMemo(() => {
    const grouped = {};
    for (const category of ingredientCategories) {
      grouped[String(category.id)] = [];
    }
    grouped.uncategorized = [];

    for (const ingredient of ingredients) {
      const key = ingredient.categoryId ? String(ingredient.categoryId) : "uncategorized";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ingredient);
    }

    Object.keys(grouped).forEach((key) => {
      grouped[key] = sortByName(grouped[key]);
    });

    return grouped;
  }, [ingredientCategories, ingredients]);

  const hasSelectedMenuCategory = Boolean(selectedMenuCategoryId);
  const hasSelectedIngredientCategory = Boolean(selectedIngredientCategoryId);
  const hasSelectedCategory =
    activePanel === KIND.MENU
      ? hasSelectedMenuCategory
      : activePanel === KIND.INGREDIENT
        ? hasSelectedIngredientCategory
        : false;

  const menuCategoryListForUi = useMemo(
    () => [...menuCategories, { id: "uncategorized", name: tr("Sans categorie", "Uncategorized") }],
    [menuCategories, tr]
  );

  const ingredientCategoryListForUi = useMemo(
    () => [
      ...ingredientCategories,
      { id: "uncategorized", name: tr("Sans categorie", "Uncategorized") },
    ],
    [ingredientCategories, tr]
  );

  const orderedMenuCategoryListForUi = useMemo(
    () => moveOpenedCategoryToTop(menuCategoryListForUi, openMenuListingCategoryId),
    [menuCategoryListForUi, openMenuListingCategoryId]
  );

  const orderedIngredientCategoryListForUi = useMemo(
    () => moveOpenedCategoryToTop(ingredientCategoryListForUi, openIngredientListingCategoryId),
    [ingredientCategoryListForUi, openIngredientListingCategoryId]
  );

  useEffect(() => {
    if (activePanel !== KIND.MENU || !selectedMenuCategoryId) return;

    setOpenMenuListingCategoryId(String(selectedMenuCategoryId));
  }, [activePanel, selectedMenuCategoryId]);

  useEffect(() => {
    if (activePanel !== KIND.INGREDIENT || !selectedIngredientCategoryId) return;

    setOpenIngredientListingCategoryId(String(selectedIngredientCategoryId));
  }, [activePanel, selectedIngredientCategoryId]);

  if (authLoading || loading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") {
    return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{tr("Gestion du menu", "Menu management")}</h2>
        <p className="mt-1 text-sm text-stone-300">
          {tr(
            "Bienvenue dans la page de gestion du menu, choisir une modification :",
            "Welcome to menu management, choose what to change:"
          )}
        </p>
      </div>

      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-100">
          {message}
        </p>
      )}

      <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-lg font-semibold text-white">{tr("Element 1 - Categories", "Step 1 - Categories")}</h3>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActivePanel((prev) => (prev === KIND.MENU ? "" : KIND.MENU))}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
              activePanel === KIND.MENU
                ? "border-saffron bg-saffron text-charcoal"
                : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
            }`}
          >
            {tr("Ajouter un plat au menu", "Add a dish to menu")}
          </button>
          <button
            type="button"
            onClick={() => setActivePanel((prev) => (prev === KIND.INGREDIENT ? "" : KIND.INGREDIENT))}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
              activePanel === KIND.INGREDIENT
                ? "border-saffron bg-saffron text-charcoal"
                : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
            }`}
          >
            {tr("Ajouter un ingredient", "Add ingredient")}
          </button>
        </div>

        {activePanel === KIND.MENU && (
          <div>
            <p className="mb-2 text-sm font-semibold text-stone-100">
              {tr("Listing categories menu :", "Menu category listing:")}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {menuCategories.map((category) => {
                const isSelected = String(selectedMenuCategoryId) === String(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setSelectedMenuCategoryId((prev) =>
                        String(prev) === String(category.id) ? "" : String(category.id)
                      )
                    }
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                      isSelected
                        ? "border-saffron bg-saffron text-charcoal"
                        : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activePanel === KIND.INGREDIENT && (
          <div>
            <p className="mb-2 text-sm font-semibold text-stone-100">
              {tr(
                "Listing categories Ingredients & Extras :",
                "Ingredients & Extras category listing:"
              )}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ingredientCategories.map((category) => {
                const isSelected = String(selectedIngredientCategoryId) === String(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setSelectedIngredientCategoryId((prev) =>
                        String(prev) === String(category.id) ? "" : String(category.id)
                      )
                    }
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                      isSelected
                        ? "border-saffron bg-saffron text-charcoal"
                        : "border-white/20 bg-black/20 text-stone-100 hover:bg-white/10"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activePanel === KIND.MENU && !hasSelectedMenuCategory && (
          <>
            <div className="rounded-xl border border-white/10 bg-charcoal/40 p-3">
              <p className="mb-2 text-sm font-semibold text-white">
                {tr("Categorie non disponible ? Ajouter une categorie :", "Missing category? Create one:")}
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    value={newMenuCategoryName}
                    onChange={(event) => setNewMenuCategoryName(event.target.value)}
                    placeholder={tr("Nom categorie menu", "Menu category name")}
                  />
                </div>
                <button type="button" onClick={() => createCategoryByKind(KIND.MENU)}>
                  {tr("Creer", "Create")}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">
                {tr("Liste categories plats", "Dish category list")}
              </p>
              <CategoryTable
                title={tr("Liste categorie menu", "Menu category list")}
                categories={menuCategories}
                kind={KIND.MENU}
                token={token}
                tr={tr}
                onRefresh={async (updater) => {
                  if (typeof updater === "function") {
                    setMenuCategories((prev) => updater(prev));
                    return;
                  }
                  await refreshAfterAction();
                }}
                onError={setMessage}
              />
            </div>
          </>
        )}

        {activePanel === KIND.INGREDIENT && !hasSelectedIngredientCategory && (
          <>
            <div className="rounded-xl border border-white/10 bg-charcoal/40 p-3">
              <p className="mb-2 text-sm font-semibold text-white">
                {tr(
                  "Categorie Ingredients & Extras non disponible ? Ajouter une categorie :",
                  "Missing Ingredients & Extras category? Create one:"
                )}
              </p>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    value={newIngredientCategoryName}
                    onChange={(event) => setNewIngredientCategoryName(event.target.value)}
                    placeholder={tr("Nom categorie ingredients", "Ingredient category name")}
                  />
                </div>
                <button type="button" onClick={() => createCategoryByKind(KIND.INGREDIENT)}>
                  {tr("Creer", "Create")}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">
                {tr("Liste categories ingredients", "Ingredient category list")}
              </p>
              <CategoryTable
                title={tr("Liste categorie ingredients", "Ingredients category list")}
                categories={ingredientCategories}
                kind={KIND.INGREDIENT}
                token={token}
                tr={tr}
                onRefresh={async (updater) => {
                  if (typeof updater === "function") {
                    setIngredientCategories((prev) => updater(prev));
                    return;
                  }
                  await refreshAfterAction();
                }}
                onError={setMessage}
              />
            </div>
          </>
        )}

      </section>

      {hasSelectedCategory && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <h3 className="text-lg font-semibold text-white">
            {activePanel === KIND.MENU
              ? tr("Element 2 - Gestion du contenu", "Step 2 - Content management")
              : tr("Gestion ingredients", "Ingredient management")}
          </h3>

          {activePanel === KIND.MENU ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-charcoal/40 p-3">
                <p className="mb-2 text-sm font-semibold text-white">{tr("Ajouter un plat au menu", "Add a dish to menu")}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    placeholder={tr("Nom du plat", "Dish name")}
                    value={newProductName}
                    onChange={(event) => setNewProductName(event.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={tr("Prix", "Price")}
                    value={newProductPrice}
                    onChange={(event) => setNewProductPrice(event.target.value)}
                  />
                  <button type="button" onClick={createMenuProduct}>{tr("Ajouter au menu", "Add to menu")}</button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">{tr("Listing complet du menu", "Full menu listing")}</p>
                {orderedMenuCategoryListForUi.map((category) => {
                  const rows = productsByCategory[String(category.id)] || [];
                  const isOpen = String(openMenuListingCategoryId) === String(category.id);
                  return (
                    <div
                      key={category.id}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-charcoal/35"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuListingCategoryId((prev) =>
                            String(prev) === String(category.id) ? "" : String(category.id)
                          )
                        }
                        className="flex w-full items-center justify-between gap-3 bg-charcoal/35 px-4 py-3 text-left transition hover:bg-charcoal/50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold uppercase tracking-wide text-saffron">{category.name}</p>
                          <p className="mt-1 text-xs text-stone-400">
                            {rows.length > 0
                              ? `${rows.length} ${tr("plat(s)", "dish(es)")}`
                              : tr("Aucun produit", "No product")}
                          </p>
                        </div>
                        <span className="shrink-0 text-stone-300">
                          <AccordionChevron open={isOpen} />
                        </span>
                      </button>

                      {isOpen ? (
                        <div className="border-t border-white/10 bg-black/10 p-3">
                          {rows.length === 0 ? (
                            <p className="text-xs text-stone-400">{tr("Aucun produit", "No product")}</p>
                          ) : (
                            <div className="space-y-2">
                              {rows.map((product) => (
                                <div key={product.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                                    <p className="text-xs text-stone-300">{toMoney(product.basePrice)} EUR</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Link to={`/admin/editproduct/${product.id}`}>
                                      <button type="button">{tr("Modifier", "Edit")}</button>
                                    </Link>
                                    <ActionIconButton onClick={() => removeMenuProduct(product.id)} label={tr("Supprimer", "Delete")} variant="danger">
                                      <DeleteIcon />
                                    </ActionIconButton>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-charcoal/40 p-3">
                <p className="mb-2 text-sm font-semibold text-white">{tr("Ajouter un ingredient", "Add ingredient")}</p>
                <div className="grid gap-2 sm:grid-cols-5">
                  <input
                    placeholder={tr("Nom ingredient", "Ingredient name")}
                    value={newIngredientName}
                    onChange={(event) => setNewIngredientName(event.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={tr("Prix", "Price")}
                    value={newIngredientPrice}
                    onChange={(event) => setNewIngredientPrice(event.target.value)}
                  />
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-stone-100">
                    <input
                      type="checkbox"
                      checked={newIngredientIsExtra}
                      onChange={(event) => setNewIngredientIsExtra(event.target.checked)}
                    />
                    <span>{tr("Supplement", "Extra")}</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-stone-100">
                    <input
                      type="checkbox"
                      checked={newIngredientIsBaseIngredient}
                      onChange={(event) => setNewIngredientIsBaseIngredient(event.target.checked)}
                    />
                    <span>{tr("Ingredient de base", "Base ingredient")}</span>
                  </label>
                  <button type="button" onClick={createMenuIngredient}>{tr("Ajouter un ingredient", "Add ingredient")}</button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">{tr("Listing complet ingredients", "Full ingredients listing")}</p>
                {orderedIngredientCategoryListForUi.map((category) => {
                  const rows = ingredientsByCategory[String(category.id)] || [];
                  const isOpen = String(openIngredientListingCategoryId) === String(category.id);
                  return (
                    <div
                      key={category.id}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-charcoal/35"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenIngredientListingCategoryId((prev) =>
                            String(prev) === String(category.id) ? "" : String(category.id)
                          )
                        }
                        className="flex w-full items-center justify-between gap-3 bg-charcoal/35 px-4 py-3 text-left transition hover:bg-charcoal/50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold uppercase tracking-wide text-saffron">{category.name}</p>
                          <p className="mt-1 text-xs text-stone-400">
                            {rows.length > 0
                              ? `${rows.length} ${tr("ingredient(s)", "ingredient(s)")}`
                              : tr("Aucun ingredient", "No ingredient")}
                          </p>
                        </div>
                        <span className="shrink-0 text-stone-300">
                          <AccordionChevron open={isOpen} />
                        </span>
                      </button>

                      {isOpen ? (
                        <div className="border-t border-white/10 bg-black/10 p-3">
                          {rows.length === 0 ? (
                            <p className="text-xs text-stone-400">{tr("Aucun ingredient", "No ingredient")}</p>
                          ) : (
                            <div className="space-y-2">
                              {rows.map((ingredient) => (
                                <div key={ingredient.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                  <div className="min-w-0">
                                    {ingredient.isEditing ? (
                                      <div className="grid gap-2 sm:grid-cols-4">
                                        <input
                                          value={ingredient.tempName}
                                          onChange={(event) => patchIngredient(ingredient.id, { tempName: event.target.value })}
                                        />
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={ingredient.tempPrice}
                                          onChange={(event) => patchIngredient(ingredient.id, { tempPrice: event.target.value })}
                                        />
                                        <label className="flex items-center gap-2 text-xs text-stone-200">
                                          <input
                                            type="checkbox"
                                            checked={ingredient.tempIsExtra}
                                            onChange={(event) => patchIngredient(ingredient.id, { tempIsExtra: event.target.checked })}
                                          />
                                          <span>{tr("Supplement", "Extra")}</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-xs text-stone-200">
                                          <input
                                            type="checkbox"
                                            checked={ingredient.tempIsBaseIngredient}
                                            onChange={(event) =>
                                              patchIngredient(ingredient.id, {
                                                tempIsBaseIngredient: event.target.checked,
                                              })
                                            }
                                          />
                                          <span>{tr("Ingredient de base", "Base ingredient")}</span>
                                        </label>
                                      </div>
                                    ) : (
                                      <div>
                                        <p className="truncate text-sm font-semibold text-white">{ingredient.name}</p>
                                        <p className="text-xs text-stone-300">
                                          {toMoney(ingredient.price)} EUR - {ingredient.isExtra ? tr("Supplement", "Extra") : tr("Standard", "Standard")}
                                          {ingredient.isBaseIngredient
                                            ? ` - ${tr("Ingredient de base", "Base ingredient")}`
                                            : ""}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <StatusToggle
                                      checked={Boolean(ingredient.active)}
                                      onChange={() => toggleIngredientActive(ingredient)}
                                      labelOn={tr("Masquer", "Hide")}
                                      labelOff={tr("Afficher", "Show")}
                                    />
                                    {ingredient.isEditing ? (
                                      <ActionIconButton onClick={() => saveIngredient(ingredient)} label={tr("Valider", "Validate")} variant="success">
                                        <CheckIcon />
                                      </ActionIconButton>
                                    ) : (
                                      <ActionIconButton onClick={() => toggleIngredientEdit(ingredient)} label={tr("Modifier", "Edit")}>
                                        <EditIcon />
                                      </ActionIconButton>
                                    )}

                                    {ingredient.isEditing && (
                                      <button type="button" onClick={() => toggleIngredientEdit(ingredient)}>
                                        {tr("Annuler", "Cancel")}
                                      </button>
                                    )}

                                    <ActionIconButton onClick={() => removeIngredient(ingredient.id)} label={tr("Supprimer", "Delete")} variant="danger">
                                      <DeleteIcon />
                                    </ActionIconButton>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

    </div>
  );
}
