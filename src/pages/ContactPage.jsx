import FaqSection from "../components/common/FaqSection";
import ContactPanel from "../components/contact/ContactPanel";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { useLanguage } from "../context/LanguageContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { buildBaseFoodEstablishmentJsonLd, buildFaqJsonLd } from "../seo/jsonLd";
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
  const canonicalSiteUrl = String(settings.seo?.canonicalSiteUrl || "").trim();
  const defaultOgImageUrl = String(settings.seo?.defaultOgImageUrl || "").trim();
  const socialUrls = [
    settings.social?.instagramUrl,
    settings.social?.facebookUrl,
    settings.social?.tiktokUrl,
  ].filter(Boolean);
  const contactFaqItems = [
    {
      question: tr(
        "Comment vous contacter rapidement ?",
        "What is the fastest way to contact you?"
      ),
      answer: tr(
        "Le plus simple est d'utiliser le telephone ou le formulaire de contact selon votre besoin. Pour une commande, le parcours de commande reste a privilegier.",
        "The easiest option is to use the phone number or the contact form depending on your request. For an order, the ordering flow remains the best choice."
      ),
    },
    {
      question: tr(
        "Ou trouver les horaires du camion ?",
        "Where can I find the truck schedule?"
      ),
      answer: tr(
        "Les jours, emplacements et horaires actifs sont visibles sur la page horaires d'ouvertures du site.",
        "Active days, stops and opening hours are listed on the website schedule page."
      ),
    },
    {
      question: tr(
        "Recevez-vous les demandes professionnelles ?",
        "Do you handle business inquiries?"
      ),
      answer: tr(
        "Oui, le formulaire de contact permet aussi d'envoyer une demande plus generale, partenariats compris.",
        "Yes, the contact form can also be used for broader requests, including partnerships."
      ),
    },
  ];
  const contactJsonLd = [
    buildBaseFoodEstablishmentJsonLd({
      pagePath: "/contact",
      pageName: title,
      description,
      siteName,
      siteUrl: canonicalSiteUrl || undefined,
      phone: settings.contact?.phone,
      email: settings.contact?.email,
      address: settings.contact?.address,
      mapUrl: settings.contact?.mapsUrl,
      image: defaultOgImageUrl,
      socialUrls,
      areaServed: [
        getLocalizedSiteText(
          settings.contact?.serviceArea,
          language,
          tr("Moselle", "Moselle")
        ),
      ],
    }),
    buildFaqJsonLd(contactFaqItems),
  ].filter(Boolean);

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={title}
        description={description}
        pathname="/contact"
        jsonLd={contactJsonLd}
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

      <FaqSection
        title={tr("Questions frequentes", "Frequently asked questions")}
        intro={tr(
          "Quelques reponses utiles avant de nous ecrire ou de nous appeler.",
          "A few useful answers before you write to us or call us."
        )}
        items={contactFaqItems}
      />

      <SeoInternalLinks />
    </div>
  );
}
