import ContactPanel from "../components/contact/ContactPanel";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { useLanguage } from "../context/LanguageContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import { getLocalizedSiteText } from "../site/siteSettings";

export default function ContactPage() {
  const { language, tr } = useLanguage();
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || "Pizza Truck";
  const siteDescription = getLocalizedSiteText(
    settings.siteDescription,
    language,
    tr(
      "Camion pizza artisanal autour de Thionville et Metz, commande en ligne et retrait rapide.",
      "Artisan pizza truck around Thionville and Metz with online ordering and quick pickup."
    )
  );
  const contactPageTitle = getLocalizedSiteText(
    settings.contactPage?.pageTitle,
    language,
    tr("Nous contacter", "Get in touch")
  );
  const contactPageIntro = getLocalizedSiteText(
    settings.contactPage?.introText,
    language,
    siteDescription
  );
  const contactHelperText = getLocalizedSiteText(
    settings.contactPage?.helperText,
    language,
    ""
  );
  const title = tr(
    `Contact | ${siteName}`,
    `Contact | ${siteName}`
  );
  const description = tr(
    `Contactez ${siteName}. Informations de contact, reseaux et formulaire pour vos demandes.`,
    `Get in touch with ${siteName}. Contact details, social links and a contact form for your questions.`
  );

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={title}
        description={description}
        pathname="/contact"
        jsonLd={buildBaseFoodEstablishmentJsonLd({
          pagePath: "/contact",
          pageName: title,
          description,
        })}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">{tr("Contact", "Contact")}</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          {contactPageTitle}
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          {contactPageIntro}
        </p>
        {contactHelperText ? (
          <p className="max-w-3xl text-sm text-stone-400 sm:text-base">{contactHelperText}</p>
        ) : null}
      </header>

      <ContactPanel />

      <SeoInternalLinks />
    </div>
  );
}
