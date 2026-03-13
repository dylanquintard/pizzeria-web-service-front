export const DEFAULT_TOUR_CITIES = ["Thionville", "Metz"];

const SPECIAL_CITY_PATHS = {
  thionville: "/pizza-napolitaine-thionville",
  metz: "/pizza-napolitaine-metz",
  moselle: "/food-truck-pizza-moselle",
};

export const FIXED_LOCAL_CITY_SLUGS = Object.freeze(Object.keys(SPECIAL_CITY_PATHS));

export function slugifyCity(city) {
  return String(city || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getFixedCityPathBySlug(citySlug) {
  return SPECIAL_CITY_PATHS[slugifyCity(citySlug)] || "";
}

export function getCityPath(city) {
  const slug = slugifyCity(city);
  if (!slug) return "/food-truck-pizza-moselle";
  return SPECIAL_CITY_PATHS[slug] || `/pizza-${slug}`;
}

export const SEO_KEYWORDS_SENTENCES = [
  "pizza napolitaine artisanale",
  "pizza napolitaine feu de bois",
  "camion pizza napolitaine",
  "pizza italienne traditionnelle",
  "pizza a emporter",
  "camion pizza thionville",
  "pizza artisanale moselle",
  "pizza napolitaine metz",
  "pizza feu de bois thionville",
  "pizza produits italiens",
];

export const LOCAL_PAGE_CONTENT = {
  thionville: {
    pathname: "/pizza-napolitaine-thionville",
    title: "Pizza napolitaine proche de Thionville | Camion pizza artisanal",
    description:
      "Camion pizza autour de Thionville: pate travaillee, cuisson bois-gaz, carte courte et retrait organise sur les points de passage.",
    h1: "Pizza napolitaine artisanale autour de Thionville",
    intro:
      "Autour de Thionville, le camion propose une pizza d inspiration napolitaine pensee pour le retrait: une pate souple, une cuisson vive et des recettes tenues sans surcharge.",
    sections: [
      {
        heading: "Une execution plus serieuse qu un simple effet de style",
        paragraphs: [
          "La base repose sur une fermentation preparee en amont et une cuisson minute au camion, afin de garder une pizza souple, lisible et reguliere.",
          "Les produits restent volontairement choisis avec retenue: farine Nuvola Super, tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et quelques charcuteries italiennes selon les recettes.",
        ],
      },
      {
        heading: "Des passages organises autour de Thionville",
        paragraphs: [
          "Le camion se deplace sur plusieurs points de passage autour de Thionville selon le planning de la semaine.",
          "Les adresses et horaires varient en fonction de la tournee publiee. Le principe reste simple: commande, creneau, puis retrait sur place.",
        ],
      },
      {
        heading: "Un format pense pour le retrait sans perte de qualite",
        paragraphs: [
          "Le service est entierement tourne vers l emporter pour garder un rythme fluide et une cuisson bien cadree.",
          "Vous pouvez commander en ligne ou sur place selon disponibilite, puis recuperer votre pizza chaude au moment prevu.",
        ],
      },
    ],
  },
  metz: {
    pathname: "/pizza-napolitaine-metz",
    title: "Pizza napolitaine proche de Metz | Camion pizza artisanal",
    description:
      "Camion pizza autour de Metz: recettes d inspiration napolitaine, ingredients selectionnes et retrait rapide sur planning hebdomadaire.",
    h1: "Pizza napolitaine artisanale autour de Metz",
    intro:
      "Autour de Metz, le camion sert une pizza travaillee avec une vraie logique de produit: pate preparee en avance, four bois-gaz et recettes qui vont a l essentiel.",
    sections: [
      {
        heading: "Une pizza pensee pour rester nette du four a la degustation",
        paragraphs: [
          "La pate est preparee pour offrir une base souple, une bordure aerienne et un ensemble lisible en bouche.",
          "Les ingredients sont choisis pour leur regularite et leur tenue au service: farine Nuvola Super, tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et charcuteries italiennes.",
        ],
      },
      {
        heading: "Une tournee qui couvre Metz et ses alentours",
        paragraphs: [
          "Notre camion pizza se deplace dans differents secteurs proches de Metz et du nord mosellan.",
          "Chaque semaine, le planning precise les points de retrait et les horaires disponibles.",
        ],
      },
      {
        heading: "Retrait rapide, cuisson minute",
        paragraphs: [
          "Les pizzas sont preparees a la commande pour garder la bonne temperature et une sortie de four propre.",
          "Le retrait se fait directement au camion, sur creneau clair, avec peu d attente lorsque la commande est anticipee.",
        ],
      },
    ],
  },
  moselle: {
    pathname: "/food-truck-pizza-moselle",
    title: "Food truck pizza en Moselle | Pizza napolitaine artisanale",
    description:
      "Food truck pizza en Moselle: carte courte, cuisson vive et passages hebdomadaires autour de Metz, Thionville et des communes voisines.",
    h1: "Food truck pizza en Moselle",
    intro:
      "Le camion circule dans plusieurs communes de Moselle avec une offre construite pour l emporter: une pate tenue, un four bois-gaz et un retrait simple a suivre.",
    sections: [
      {
        heading: "Une tournee locale plutot qu un point fixe",
        paragraphs: [
          "La tournee passe par differents points autour de Thionville, Metz et d autres communes voisines selon la semaine.",
          "Les emplacements et horaires sont mis a jour regulierement pour rendre la commande et le retrait faciles a suivre.",
        ],
      },
      {
        heading: "Une carte courte, plus facile a tenir",
        paragraphs: [
          "Chaque pizza est preparee a la commande avec une base de produits italiens selectionnes et une construction volontairement lisible.",
          "Le format camion aide a garder un service plus fluide, une cuisson plus reguliere et un retrait plus rapide.",
        ],
      },
      {
        heading: "Un fonctionnement simple pour commander",
        paragraphs: [
          "Commande en ligne ou sur place selon disponibilite, puis retrait dans le creneau choisi.",
          "L objectif reste le meme: une pizza chaude, bien cuite et remise sans attente inutile.",
        ],
      },
    ],
  },
};

function withCity(text, city) {
  return String(text || "").replaceAll("{city}", city);
}

function hashToIndex(value, modulo) {
  if (!modulo || modulo <= 0) return 0;

  let hash = 0;
  const source = String(value || "");
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 2147483647;
  }

  return Math.abs(hash) % modulo;
}

const DYNAMIC_CITY_VARIANTS = [
  {
    title: "Pizza napolitaine a {city} | Camion pizza artisanal",
    h1: "Pizza napolitaine artisanale a {city}",
    description:
      "Camion pizza a {city}: recettes d inspiration napolitaine, cuisson bois-gaz et retrait organise sur les passages de la semaine.",
    intro: [
      "Vous cherchez une pizza a {city} sans tomber sur une offre standardisee ?",
      "Le camion propose une pizza d inspiration napolitaine avec une pate preparee en amont, une cuisson vive et des recettes volontairement lisibles.",
      "Le four bois-gaz permet de garder une sortie de cuisson rapide et reguliere, adaptee au retrait.",
      "Les passages a {city} dependent du planning en ligne et des points de retrait ouverts sur la semaine.",
    ],
    sections: [
      {
        heading: "Une pizza construite autour de peu d ingredients, mais bien tenus",
        paragraphs: [
          "La carte repose sur quelques produits reperes pour leur regularite: farine Nuvola Super, tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et, selon les recettes, des charcuteries italiennes.",
          "La pate est travaillee pour rester souple, aerienne et facile a lire en bouche.",
          "Le resultat cherche davantage l equilibre que la surcharge.",
        ],
      },
      {
        heading: "Le camion pizza passe a {city} selon la tournee active",
        paragraphs: [
          "Le camion dessert regulierement {city}, mais pas en point fixe permanent.",
          "Les emplacements changent selon la tournee hebdomadaire et les points de retrait ouverts.",
          "Chaque pizza est preparee sur place pour garder une qualite stable jusqu a la remise.",
        ],
      },
      {
        heading: "Un format pense pour l emporter a {city}",
        paragraphs: [
          "Les pizzas sont disponibles uniquement a emporter directement au camion.",
          "Chaque commande est lancee pour le retrait afin de remettre une pizza chaude, cuite minute et prete a repartir.",
        ],
      },
    ],
  },
  {
    title: "Pizza artisanale a {city} | Camion pizza napolitain",
    h1: "Pizza italienne artisanale a {city}",
    description:
      "Pizza artisanale a {city}: pate preparee avec soin, produits selectionnes et cuisson bois-gaz pour le retrait.",
    intro: [
      "Le camion pizza dessert {city} avec une carte artisanale inspiree des codes napolitains, sans chercher l effet de catalogue.",
      "Chaque pizza est preparee avec une pate maison et des produits choisis pour leur tenue au four comme pour leur gout.",
      "La cuisson bois-gaz donne une pizza souple, vive et plus nette a la degustation.",
    ],
    sections: [
      {
        heading: "Une base de travail claire et sans surcharge",
        paragraphs: [
          "La pate suit un protocole de fermentation qui privilegie la souplesse et une bordure bien ouverte.",
          "Les ingredients restent simples, mais choisis avec rigueur: tomates San Marzano, mozzarella fior di latte, parmigiano reggiano et huile d olive selon les recettes.",
          "Cette sobriete donne une pizza plus lisible qu une recette surchargee.",
        ],
      },
      {
        heading: "Le camion pizza se deplace a {city} selon le planning",
        paragraphs: [
          "Le camion pizza passe a {city} selon le planning hebdomadaire publie.",
          "Les points de retrait peuvent varier, mais l objectif reste identique: servir une pizza preparee sur place, dans un format simple a recuperer.",
        ],
      },
      {
        heading: "Une pizza a emporter lancee au bon moment",
        paragraphs: [
          "Chaque pizza est preparee au moment de la commande pour rester au plus juste sur la cuisson et la remise.",
          "Le service est uniquement a emporter directement au camion.",
        ],
      },
    ],
  },
  {
    title: "Pizza feu de bois a {city} | Camion pizza",
    h1: "Pizza feu de bois artisanale a {city}",
    description:
      "Pizza feu de bois a {city}: cuisson vive, produits bien choisis et retrait direct au camion.",
    intro: [
      "A {city}, le camion propose des pizzas cuites dans un four bois-gaz pour garder une cuisson rapide et une pate plus aerienne.",
      "Le travail ne se limite pas a la flamme: il repose aussi sur une pate bien tenue et des recettes qui restent lisibles.",
      "Chaque pizza est preparee sur place au moment du service.",
    ],
    sections: [
      {
        heading: "Des ingredients choisis pour tenir la cuisson",
        paragraphs: [
          "La qualite d une pizza vient autant de la cuisson que de la tenue des produits au four.",
          "La base de travail inclut notamment farine Nuvola Super, tomates San Marzano, mozzarella fior di latte et parmigiano reggiano.",
          "L objectif est de garder un gout clair, pas de multiplier les ingredients sans necessite.",
        ],
      },
      {
        heading: "Le camion pizza suit une tournee a {city}",
        paragraphs: [
          "Le camion pizza se deplace a {city} selon les emplacements definis dans le planning.",
          "Les pizzas sont preparees directement au camion afin de garder une sortie de four propre et fraiche.",
        ],
      },
      {
        heading: "Retrait pizza a {city}",
        paragraphs: [
          "Les pizzas sont disponibles uniquement a emporter.",
          "Le retrait se fait directement au camion lors du passage a {city}, sur creneau quand la commande est anticipee.",
        ],
      },
    ],
  },
  {
    title: "Camion pizza a {city} | Pizza napolitaine artisanale",
    h1: "Camion pizza napolitaine a {city}",
    description:
      "Camion pizza a {city}: pizza d inspiration napolitaine, cuisson bois-gaz et organisation simple pour le retrait.",
    intro: [
      "Le camion pizza dessert {city} selon la tournee hebdomadaire.",
      "Chaque pizza est preparee avec une pate maison et des ingredients choisis pour rester coherents de la cuisson a la degustation.",
      "La cuisson se fait dans un four bois-gaz pour garder un service rapide et une texture plus juste.",
    ],
    sections: [
      {
        heading: "Une pizza plus tenue qu une simple offre de passage",
        paragraphs: [
          "La pizza napolitaine est surtout affaire de methode: une pate souple, une cuisson tres vive et une garniture tenue.",
          "Les recettes s appuient sur quelques produits clefs comme les tomates San Marzano, la mozzarella fior di latte et le parmigiano reggiano.",
          "Le but n est pas de surcharger la pizza, mais de sortir un produit net et regulier.",
        ],
      },
      {
        heading: "Ou retrouver le camion pizza a {city}",
        paragraphs: [
          "Le camion pizza passe a {city} selon les emplacements prevus dans la tournee.",
          "Les horaires et points de retrait sont consultables sur la page planning.",
        ],
      },
      {
        heading: "Pizza artisanale a emporter",
        paragraphs: [
          "Chaque pizza est preparee a la commande afin de garder une cuisson maitrisee.",
          "Le service est uniquement a emporter.",
        ],
      },
    ],
  },
  {
    title: "Pizza napolitaine traditionnelle a {city} | Camion pizza",
    h1: "Pizza napolitaine traditionnelle a {city}",
    description:
      "Pizza napolitaine traditionnelle a {city}: travail de pate, cuisson vive et retrait au camion.",
    intro: [
      "Vous cherchez une pizza napolitaine traditionnelle a {city} ?",
      "Le camion pizza propose des pizzas preparees avec une pate artisanale, une cuisson bois-gaz et une lecture plus serieuse du produit.",
      "Le resultat recherche est une pizza souple, bien cuite et claire en bouche.",
    ],
    sections: [
      {
        heading: "Une pizza artisanale preparee avec une base simple",
        paragraphs: [
          "Chaque pizza s appuie sur quelques ingredients reconnus pour leur regularite: farine Nuvola Super, tomates San Marzano, mozzarella fior di latte et parmigiano reggiano.",
          "Cette base courte laisse plus de place a la cuisson et a l equilibre general.",
        ],
      },
      {
        heading: "Le camion pizza a {city}",
        paragraphs: [
          "Le camion pizza se deplace a {city} selon les emplacements annonces dans la tournee.",
          "Les pizzas sont preparees sur place afin de garantir leur fraicheur et une sortie de four propre.",
        ],
      },
      {
        heading: "Pizza a emporter",
        paragraphs: [
          "Les pizzas sont disponibles uniquement a emporter directement au camion, dans un format concu pour limiter l attente.",
        ],
      },
    ],
  },
];

const DYNAMIC_NEARBY_VARIANTS = [
  {
    heading: "Villes proches et emplacements autour de {city}",
    lead: "Voici quelques points de retrait actifs a {city} et dans les communes voisines.",
    footer: "Consultez la page planning pour verifier les prochains passages du camion.",
  },
  {
    heading: "Prochains passages proches de {city}",
    lead: "Les emplacements suivants proviennent du planning actuellement publie.",
    footer: "Les jours et horaires peuvent evoluer selon la tournee de la semaine.",
  },
  {
    heading: "Points de retrait disponibles a {city}",
    lead: "Retrouvez ci-dessous quelques emplacements ou le camion peut passer.",
    footer: "Pour la version complete et mise a jour, consultez la page planning du camion pizza.",
  },
  {
    heading: "Emplacements actuellement visibles pour {city}",
    lead: "Ces adresses sont mises a jour automatiquement depuis la configuration admin.",
    footer: "Pensez a verifier le planning avant de vous deplacer.",
  },
  {
    heading: "Retrait pizza autour de {city}",
    lead: "Selection de points de retrait disponibles selon les derniers creneaux ouverts.",
    footer: "Tous les details de passage restent centralises sur la page planning.",
  },
];

const DYNAMIC_FAQ_VARIANTS = [
  [
    {
      question: "Ou trouver le camion pizza a {city} ?",
      answer:
        "Le camion pizza passe a {city} selon le planning hebdomadaire. Les prochains passages et horaires sont indiques sur la page planning du site.",
    },
    {
      question: "Les pizzas sont-elles disponibles sur place ?",
      answer: "Les pizzas sont disponibles uniquement a emporter directement au camion pizza.",
    },
    {
      question: "Quel type de pizza proposez-vous a {city} ?",
      answer:
        "Nous proposons des pizzas napolitaines artisanales preparees avec des ingredients italiens et une cuisson au four a bois et gaz.",
    },
  ],
  [
    {
      question: "Le camion pizza passe-t-il a {city} chaque semaine ?",
      answer:
        "Le passage du camion pizza a {city} depend de la tournee et des emplacements disponibles. Les horaires et jours de passage sont indiques dans la page planning.",
    },
    {
      question: "Peut-on commander une pizza a l'avance ?",
      answer:
        "Selon les creneaux disponibles, il est possible de commander votre pizza et de venir la recuperer directement au camion.",
    },
    {
      question: "Les pizzas sont-elles faites maison ?",
      answer:
        "Oui. La pate est preparee maison et les pizzas sont realisees avec des ingredients italiens selectionnes.",
    },
  ],
  [
    {
      question: "Ou acheter une pizza napolitaine a {city} ?",
      answer:
        "Le camion pizza propose des pizzas napolitaines artisanales a {city} selon les emplacements prevus dans le planning.",
    },
    {
      question: "Comment fonctionne le retrait des pizzas ?",
      answer:
        "Les pizzas sont preparees a la commande et disponibles a emporter directement au camion pizza.",
    },
    {
      question: "Quels ingredients utilisez-vous ?",
      answer:
        "Les pizzas sont preparees avec des ingredients italiens comme la mozzarella fior di latte, les tomates San Marzano et la farine Nuvola.",
    },
  ],
  [
    {
      question: "Quand trouver le camion pizza a {city} ?",
      answer:
        "Le camion pizza passe regulierement a {city} selon le planning hebdomadaire. Consultez la page planning pour connaitre les prochains passages.",
    },
    {
      question: "Les pizzas sont-elles cuites au feu de bois ?",
      answer:
        "Les pizzas sont cuites dans un four a bois et gaz afin d'obtenir une cuisson rapide et une pate legere.",
    },
    {
      question: "Le service est-il uniquement a emporter ?",
      answer: "Oui, les pizzas sont proposees uniquement a emporter directement au camion pizza.",
    },
  ],
  [
    {
      question: "Le camion pizza propose-t-il des pizzas napolitaines a {city} ?",
      answer:
        "Oui, le camion pizza propose regulierement des pizzas napolitaines artisanales a {city} selon les emplacements disponibles sur la tournee.",
    },
    {
      question: "Combien de temps faut-il attendre pour une pizza ?",
      answer:
        "Les pizzas sont preparees a la commande et la cuisson est generalement tres rapide grace au four a haute temperature.",
    },
    {
      question: "Quels types de pizzas sont disponibles ?",
      answer:
        "Le menu propose differentes pizzas napolitaines avec des ingredients italiens selectionnes.",
    },
  ],
];

export function buildDynamicCityFaq(cityValue) {
  const city = String(cityValue || "").trim() || "Moselle";
  const slug = slugifyCity(city) || "moselle";
  const faqVariantIndex = hashToIndex(`${slug}-faq`, DYNAMIC_FAQ_VARIANTS.length);
  const faqVariant = DYNAMIC_FAQ_VARIANTS[faqVariantIndex];

  return faqVariant.map((item) => ({
    question: withCity(item.question, city),
    answer: withCity(item.answer, city),
  }));
}

export function buildDynamicCityContent(cityValue, options = {}) {
  const city = String(cityValue || "").trim() || "Moselle";
  const slug = slugifyCity(city) || "moselle";
  const variantIndex = hashToIndex(slug, DYNAMIC_CITY_VARIANTS.length);
  const nearbyVariantIndex = hashToIndex(`${slug}-nearby`, DYNAMIC_NEARBY_VARIANTS.length);
  const variant = DYNAMIC_CITY_VARIANTS[variantIndex];
  const nearbyVariant = DYNAMIC_NEARBY_VARIANTS[nearbyVariantIndex];
  const locationHighlights = Array.isArray(options.locationHighlights)
    ? options.locationHighlights.filter(Boolean).slice(0, 3)
    : [];
  const introParagraphs = variant.intro.map((paragraph) => withCity(paragraph, city));
  const sections = variant.sections.map((section) => ({
    heading: withCity(section.heading, city),
    paragraphs: section.paragraphs.map((paragraph) => withCity(paragraph, city)),
  }));
  const faq = buildDynamicCityFaq(city);

  return {
    pathname: `/pizza-${slug}`,
    title: withCity(variant.title, city),
    description: withCity(variant.description, city),
    h1: withCity(variant.h1, city),
    intro: introParagraphs.join(" "),
    introParagraphs,
    sections,
    faq,
    nearbySection: {
      heading: withCity(nearbyVariant.heading, city),
      lead: withCity(nearbyVariant.lead, city),
      footer: withCity(nearbyVariant.footer, city),
    },
    locationHighlights,
  };
}

