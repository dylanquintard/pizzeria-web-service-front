import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createBlogArticle,
  deleteBlogArticle,
  getAdminBlogArticles,
  updateBlogArticle,
} from "../api/blog.api";
import { uploadGalleryImage } from "../api/gallery.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { slugify } from "../utils/slugify";

function createParagraph(seed = {}) {
  return {
    id: seed.id || `paragraph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: seed.title || "",
    content: seed.content || "",
  };
}

function createImage(seed = {}) {
  const legend = seed.caption || seed.altText || "";
  return {
    id: seed.id || `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageUrl: seed.imageUrl || "",
    thumbnailUrl: seed.thumbnailUrl || "",
    altText: legend,
    caption: legend,
    file: null,
    previewUrl: seed.imageUrl || "",
  };
}

function createEmptyArticleForm() {
  return {
    title: "",
    slug: "",
    description: "",
    published: true,
    paragraphs: [createParagraph()],
    images: [],
  };
}

function createArticleFormFromRecord(article) {
  return {
    title: article.title || "",
    slug: article.slug || "",
    description: article.description || "",
    published: Boolean(article.published),
    paragraphs:
      Array.isArray(article.paragraphs) && article.paragraphs.length > 0
        ? article.paragraphs.map((paragraph) => createParagraph(paragraph))
        : [createParagraph()],
    images:
      Array.isArray(article.images) && article.images.length > 0
        ? article.images.map((image) => createImage(image))
        : [],
  };
}

function formatArticleDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch (_err) {
    return "-";
  }
}

function validateArticleForm(form, tr) {
  if (!form.title.trim()) {
    return tr("Le titre de l'article est obligatoire.", "Article title is required.");
  }
  if (!form.description.trim()) {
    return tr("La description est obligatoire.", "Description is required.");
  }
  if (!Array.isArray(form.paragraphs) || form.paragraphs.length === 0) {
    return tr(
      "Ajoutez au moins un paragraphe a l'article.",
      "Add at least one paragraph to the article."
    );
  }

  for (const paragraph of form.paragraphs) {
    if (!paragraph.title.trim() || !paragraph.content.trim()) {
      return tr(
        "Chaque paragraphe doit avoir un titre et un contenu.",
        "Each paragraph needs a title and content."
      );
    }
  }

  for (const image of form.images || []) {
    if (!image.imageUrl && !image.file) {
      return tr(
        "Chaque image doit avoir un fichier ou une URL.",
        "Each image needs a file or image URL."
      );
    }
    if (!String(image.altText || image.caption || "").trim()) {
      return tr(
        "Chaque image doit avoir une legende d'image.",
        "Each image needs an image caption."
      );
    }
  }

  return "";
}

async function resolveImagesForSave(images, token) {
  const resolved = [];

  for (const image of images || []) {
    const legend = String(image.altText || image.caption || "").trim() || null;

    if (image.file) {
      const uploaded = await uploadGalleryImage(token, image.file);
      resolved.push({
        imageUrl: uploaded.imageUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
        altText: legend,
        caption: legend,
      });
      continue;
    }

    if (!String(image.imageUrl || "").trim()) {
      continue;
    }

    resolved.push({
      imageUrl: String(image.imageUrl || "").trim(),
      thumbnailUrl: String(image.thumbnailUrl || "").trim() || null,
      altText: legend,
      caption: legend,
    });
  }

  return resolved;
}

async function normalizeArticlePayload(form, token) {
  return {
    title: form.title.trim(),
    slug: slugify(form.slug || form.title),
    description: form.description.trim(),
    published: Boolean(form.published),
    paragraphs: form.paragraphs.map((paragraph) => ({
      title: paragraph.title.trim(),
      content: paragraph.content.trim(),
    })),
    images: await resolveImagesForSave(form.images, token),
  };
}

function EditorSectionTitle({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-saffron">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
      {description ? <p className="mt-2 max-w-3xl text-sm text-stone-300">{description}</p> : null}
    </div>
  );
}

function ImageEditorCard({ image, index, total, onUpdate, onMove, onRemove, tr }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-saffron/35 bg-saffron/10 text-xs font-bold text-saffron">
            {index + 1}
          </span>
          <p className="text-sm font-semibold text-white">
            {tr("Image", "Image")} {index + 1}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
            className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {tr("Monter", "Move up")}
          </button>
          <button
            type="button"
            onClick={() => onMove(index, "down")}
            disabled={index === total - 1}
            className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {tr("Descendre", "Move down")}
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="rounded-full border border-red-300/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/10"
          >
            {tr("Supprimer", "Delete")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-charcoal/60">
          {image.previewUrl || image.imageUrl ? (
            <img
              src={image.previewUrl || image.imageUrl}
              alt={image.altText || image.caption || tr("Image du blog", "Blog image")}
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-56 items-center justify-center px-4 text-center text-sm text-stone-400">
              {tr("Aucune image selectionnee.", "No image selected.")}
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1 text-xs text-stone-300">
            <span>{tr("Uploader une image", "Upload image")}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (!file) return;
                const previewUrl = URL.createObjectURL(file);
                onUpdate(index, { file, previewUrl });
              }}
              className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white file:mr-3 file:rounded-full file:border-0 file:bg-saffron file:px-3 file:py-2 file:text-xs file:font-bold file:text-charcoal"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-300">
            <span>{tr("URL image", "Image URL")}</span>
            <input
              value={image.imageUrl}
              onChange={(event) =>
                onUpdate(index, {
                  imageUrl: event.target.value,
                  previewUrl: event.target.value,
                })
              }
              className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-300">
            <span>{tr("URL miniature", "Thumbnail URL")}</span>
            <input
              value={image.thumbnailUrl}
              onChange={(event) => onUpdate(index, { thumbnailUrl: event.target.value })}
              className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
            />
          </label>

          <label className="grid gap-1 text-xs text-stone-300">
            <span>{tr("Legende de l'image", "Image caption")}</span>
            <input
              value={image.altText || image.caption}
              onChange={(event) =>
                onUpdate(index, {
                  altText: event.target.value,
                  caption: event.target.value,
                })
              }
              className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              required
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ArticleEditor({
  form,
  setForm,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
  title,
  subtitle,
  tr,
}) {
  const publicPathPreview = `/${slugify(form.slug || form.title || "article") || "article"}`;

  const updateTitle = (value) => {
    setForm((prev) => {
      const previousAutoSlug = slugify(prev.title);
      const shouldSyncSlug = !prev.slug || prev.slug === previousAutoSlug;

      return {
        ...prev,
        title: value,
        slug: shouldSyncSlug ? slugify(value) : prev.slug,
      };
    });
  };

  const updateParagraph = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      paragraphs: prev.paragraphs.map((paragraph, paragraphIndex) =>
        paragraphIndex === index ? { ...paragraph, [field]: value } : paragraph
      ),
    }));
  };

  const addParagraph = () => {
    setForm((prev) => ({
      ...prev,
      paragraphs: [...prev.paragraphs, createParagraph()],
    }));
  };

  const removeParagraph = (index) => {
    setForm((prev) => {
      if (prev.paragraphs.length <= 1) {
        return prev;
      }

      return {
        ...prev,
        paragraphs: prev.paragraphs.filter((_, paragraphIndex) => paragraphIndex !== index),
      };
    });
  };

  const moveParagraph = (index, direction) => {
    setForm((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.paragraphs.length) {
        return prev;
      }

      const nextParagraphs = [...prev.paragraphs];
      const [current] = nextParagraphs.splice(index, 1);
      nextParagraphs.splice(targetIndex, 0, current);

      return {
        ...prev,
        paragraphs: nextParagraphs,
      };
    });
  };

  const updateImage = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((image, imageIndex) => {
        if (imageIndex !== index) return image;
        return {
          ...image,
          ...patch,
        };
      }),
    }));
  };

  const addImage = () => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, createImage()],
    }));
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const moveImage = (index, direction) => {
    setForm((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.images.length) {
        return prev;
      }

      const nextImages = [...prev.images];
      const [current] = nextImages.splice(index, 1);
      nextImages.splice(targetIndex, 0, current);

      return {
        ...prev,
        images: nextImages,
      };
    });
  };

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-saffron">{subtitle}</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">URL publique</p>
          <code className="mt-2 block text-sm text-saffron">{publicPathPreview}</code>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1 text-xs text-stone-300">
          <span>{tr("Titre de l'article", "Article title")}</span>
          <input
            value={form.title}
            onChange={(event) => updateTitle(event.target.value)}
            className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
          />
        </label>

        <label className="grid gap-1 text-xs text-stone-300">
          <span>{tr("Slug public", "Public slug")}</span>
          <div className="flex gap-2">
            <input
              value={form.slug}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))
              }
              className="flex-1 rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, slug: slugify(prev.title) }))}
              className="rounded-2xl border border-saffron/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
            >
              {tr("Generer", "Generate")}
            </button>
          </div>
        </label>

        <label className="grid gap-1 text-xs text-stone-300 lg:col-span-2">
          <span>{tr("Description / intro", "Description / intro")}</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            className="rounded-[1.5rem] border border-white/15 bg-charcoal/70 px-4 py-3 text-sm leading-7 text-white"
          />
        </label>
      </div>

      <label className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, published: event.target.checked }))
          }
        />
        <span>{tr("Publier cet article sur le site", "Publish this article on the site")}</span>
      </label>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EditorSectionTitle
            eyebrow={tr("Contenu", "Content")}
            title={tr("Paragraphes", "Paragraphs")}
            description={tr(
              "Chaque bloc devient une section de l'article avec son titre et son contenu.",
              "Each block becomes an article section with its own title and content."
            )}
          />
          <button
            type="button"
            onClick={addParagraph}
            className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/20"
          >
            {tr("Ajouter un paragraphe", "Add paragraph")}
          </button>
        </div>

        {form.paragraphs.map((paragraph, index) => (
          <div
            key={paragraph.id}
            className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-saffron/35 bg-saffron/10 text-xs font-bold text-saffron">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-white">
                  {tr("Paragraphe", "Paragraph")} {index + 1}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moveParagraph(index, "up")}
                  disabled={index === 0}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {tr("Monter", "Move up")}
                </button>
                <button
                  type="button"
                  onClick={() => moveParagraph(index, "down")}
                  disabled={index === form.paragraphs.length - 1}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {tr("Descendre", "Move down")}
                </button>
                <button
                  type="button"
                  onClick={() => removeParagraph(index)}
                  disabled={form.paragraphs.length === 1}
                  className="rounded-full border border-red-300/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {tr("Supprimer", "Delete")}
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1 text-xs text-stone-300">
                <span>{tr("Titre du paragraphe", "Paragraph title")}</span>
                <input
                  value={paragraph.title}
                  onChange={(event) => updateParagraph(index, "title", event.target.value)}
                  className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
                />
              </label>

              <label className="grid gap-1 text-xs text-stone-300">
                <span>{tr("Contenu", "Content")}</span>
                <textarea
                  rows={6}
                  value={paragraph.content}
                  onChange={(event) => updateParagraph(index, "content", event.target.value)}
                  className="rounded-[1.5rem] border border-white/15 bg-charcoal/70 px-4 py-3 text-sm leading-7 text-white"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EditorSectionTitle
            eyebrow={tr("Media", "Media")}
            title={tr("Images de l'article", "Article images")}
            description={tr(
              "Ajoutez une ou plusieurs images. La premiere image sert d'image principale sur la page et pour le partage social.",
              "Add one or more images. The first image is used as the main page image and for social sharing."
            )}
          />
          <button
            type="button"
            onClick={addImage}
            className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/20"
          >
            {tr("Ajouter une image", "Add image")}
          </button>
        </div>

        {form.images.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 p-6 text-sm text-stone-400">
            {tr(
              "Aucune image pour cet article pour le moment.",
              "No image for this article yet."
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {form.images.map((image, index) => (
              <ImageEditorCard
                key={image.id}
                image={image}
                index={index}
                total={form.images.length}
                onUpdate={updateImage}
                onMove={moveImage}
                onRemove={removeImage}
                tr={tr}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="rounded-full bg-saffron px-5 py-3 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? tr("Enregistrement...", "Saving...") : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/20 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
          >
            {tr("Annuler", "Cancel")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default function BlogAdmin() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();

  const [articles, setArticles] = useState([]);
  const [createForm, setCreateForm] = useState(createEmptyArticleForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyArticleForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const articleStats = useMemo(() => {
    const publishedCount = articles.filter((article) => article.published).length;
    const paragraphCount = articles.reduce(
      (total, article) => total + Number(article.paragraphCount || 0),
      0
    );
    const imageCount = articles.reduce(
      (total, article) => total + Number(article.imageCount || 0),
      0
    );

    return {
      articleCount: articles.length,
      publishedCount,
      paragraphCount,
      imageCount,
    };
  }, [articles]);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminBlogArticles(token);
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          tr("Impossible de charger le blog admin.", "Unable to load admin blog.")
      );
    } finally {
      setLoading(false);
    }
  }, [token, tr]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== "ADMIN") return;
    loadArticles();
  }, [authLoading, loadArticles, token, user]);

  const startEditing = (article) => {
    setEditingId(article.id);
    setEditForm(createArticleFormFromRecord(article));
    setMessage("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(createEmptyArticleForm());
  };

  const handleCreate = async () => {
    const validationMessage = validateArticleForm(createForm, tr);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      setSaving(true);
      const payload = await normalizeArticlePayload(createForm, token);
      await createBlogArticle(token, payload);
      setCreateForm(createEmptyArticleForm());
      setMessage(tr("Article cree avec succes.", "Article created successfully."));
      await loadArticles();
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          tr("Erreur lors de la creation de l'article.", "Error while creating article.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    const validationMessage = validateArticleForm(editForm, tr);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      setSaving(true);
      const payload = await normalizeArticlePayload(editForm, token);
      await updateBlogArticle(token, editingId, payload);
      setMessage(tr("Article mis a jour avec succes.", "Article updated successfully."));
      cancelEditing();
      await loadArticles();
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          tr("Erreur lors de la mise a jour.", "Error while updating article.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article) => {
    const confirmed = window.confirm(
      tr(
        `Supprimer l'article "${article.title}" ?`,
        `Delete the article "${article.title}"?`
      )
    );
    if (!confirmed) return;

    try {
      await deleteBlogArticle(token, article.id);
      if (editingId === article.id) {
        cancelEditing();
      }
      setMessage(tr("Article supprime.", "Article deleted."));
      await loadArticles();
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          tr("Erreur lors de la suppression.", "Error while deleting article.")
      );
    }
  };

  if (authLoading) {
    return <p>{tr("Chargement...", "Loading...")}</p>;
  }

  if (!token || user?.role !== "ADMIN") {
    return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.16),_transparent_36%),linear-gradient(135deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02))] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.25em] text-saffron">
              {tr("Administration blog", "Blog administration")}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              {tr("Creation d'articles", "Article creation")}
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              {tr(
                "Creez des articles avec plusieurs paragraphes, des meta SEO dediees et une ou plusieurs images en URL courte du type /la-pizza-italienne.",
                "Create multi-paragraph articles with dedicated SEO meta and one or more images using short URLs like /la-pizza-italienne."
              )}
            </p>
          </div>

          <div className="grid min-w-[240px] gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">
                {tr("Articles", "Articles")}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">{articleStats.articleCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">
                {tr("Publies", "Published")}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">{articleStats.publishedCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">
                {tr("Paragraphes", "Paragraphs")}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">{articleStats.paragraphCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">
                {tr("Images", "Images")}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">{articleStats.imageCount}</p>
            </div>
          </div>
        </div>
      </header>

      {message ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100">
          {message}
        </div>
      ) : null}

      <ArticleEditor
        form={createForm}
        setForm={setCreateForm}
        onSubmit={handleCreate}
        saving={saving && !editingId}
        submitLabel={tr("Creer l'article", "Create article")}
        title={tr("Nouvel article", "New article")}
        subtitle={tr("Creation", "Creation")}
        tr={tr}
      />

      {editingId ? (
        <ArticleEditor
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleUpdate}
          onCancel={cancelEditing}
          saving={saving && Boolean(editingId)}
          submitLabel={tr("Mettre a jour", "Update article")}
          title={tr("Edition de l'article", "Edit article")}
          subtitle={tr("Edition", "Edit")}
          tr={tr}
        />
      ) : null}

      <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-saffron">
              {tr("Articles existants", "Existing articles")}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {tr("Bibliotheque du blog", "Blog library")}
            </h3>
          </div>
          <Link
            to="/blog"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
          >
            {tr("Voir la page blog", "See blog page")}
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`blog-admin-skeleton-${index}`}
                className="animate-pulse rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
              >
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="mt-4 h-8 w-3/4 rounded bg-white/10" />
                <div className="mt-4 h-16 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 p-8 text-center">
            <p className="text-sm text-stone-300">
              {tr(
                "Aucun article n'a encore ete cree.",
                "No article has been created yet."
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {articles.map((article) => (
              <article
                key={article.id}
                className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
              >
                {article.featuredImage?.thumbnailUrl || article.featuredImage?.imageUrl ? (
                  <img
                    src={article.featuredImage.thumbnailUrl || article.featuredImage.imageUrl}
                    alt={article.featuredImage.altText || article.title}
                    className="mb-4 h-52 w-full rounded-[1.25rem] object-cover"
                  />
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em]">
                      <span
                        className={`rounded-full px-3 py-1 ${
                          article.published
                            ? "border border-emerald-300/30 bg-emerald-500/10 text-emerald-200"
                            : "border border-amber-300/30 bg-amber-500/10 text-amber-200"
                        }`}
                      >
                        {article.published
                          ? tr("Publie", "Published")
                          : tr("Brouillon", "Draft")}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-stone-300">
                        {article.paragraphCount} {tr("paragraphes", "paragraphs")}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-stone-300">
                        {article.imageCount || 0} {tr("images", "images")}
                      </span>
                    </div>
                    <h4 className="mt-4 text-xl font-bold text-white">{article.title}</h4>
                  </div>

                  <code className="rounded-full border border-white/10 bg-charcoal/60 px-3 py-1 text-xs text-saffron">
                    /{article.slug}
                  </code>
                </div>

                <p className="mt-4 text-sm leading-7 text-stone-300">{article.description}</p>

                <div className="mt-5 grid gap-2 text-xs text-stone-400 sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-stone-200">{tr("Mis a jour", "Updated")}: </span>
                    {formatArticleDate(article.updatedAt)}
                  </div>
                  <div>
                    <span className="font-semibold text-stone-200">{tr("Publie le", "Published on")}: </span>
                    {formatArticleDate(article.publishedAt)}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(article)}
                    className="rounded-full border border-saffron/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-saffron transition hover:bg-saffron/10"
                  >
                    {tr("Modifier", "Edit")}
                  </button>
                  <Link
                    to={`/${article.slug}`}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
                  >
                    {tr("Ouvrir", "Open")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(article)}
                    className="rounded-full border border-red-300/25 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/10"
                  >
                    {tr("Supprimer", "Delete")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
