import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { getLocalizedSiteText } from "../../site/siteSettings";

const VARIANT_CLASSNAME = {
  info: "border-sky-300/35 bg-sky-500/10 text-sky-100",
  alert: "border-red-400/40 bg-red-500/10 text-red-100",
  success: "border-emerald-300/35 bg-emerald-500/10 text-emerald-100",
};

export default function SiteAnnouncement() {
  const location = useLocation();
  const { language, tr } = useLanguage();
  const { settings } = useSiteSettings();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const announcementText = getLocalizedSiteText(
    settings.announcement?.text,
    language,
    ""
  ).trim();

  if (isAdminRoute || !settings.announcement?.enabled || !announcementText) {
    return null;
  }

  const linkUrl = String(settings.announcement?.linkUrl || "").trim();
  const variant = String(settings.announcement?.variant || "info").trim().toLowerCase();
  const wrapperClassName = VARIANT_CLASSNAME[variant] || VARIANT_CLASSNAME.info;

  return (
    <div className={`section-shell mb-6 rounded-2xl border px-4 py-3 text-sm ${wrapperClassName}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium">{announcementText}</p>
        {linkUrl ? (
          /^(https?:)?\/\//i.test(linkUrl) ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-current/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition hover:bg-white/10"
            >
              {tr("En savoir plus", "Learn more")}
            </a>
          ) : (
            <Link
              to={linkUrl}
              className="rounded-full border border-current/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition hover:bg-white/10"
            >
              {tr("En savoir plus", "Learn more")}
            </Link>
          )
        ) : null}
      </div>
    </div>
  );
}
