export function mapActivityToPillarCategories(uitActivity) {
  const termLabels = uitActivity.terms
    .filter((t) => ["eventtype", "theme"].includes(t.domain))
    .map((t) => t.label.toLowerCase().trim());
  const text = `${uitActivity.title} ${uitActivity.description}`
    .toLowerCase()
    .trim()
    .split(" ");

  // Create single search string from title
  const fullText = `${uitActivity.title}`
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=_`~()]/g, "")
    .split(/\s+/);

  const matches = new Set();

  for (const mapping of CATEGORY_MAPPINGS) {
    let foundMatch = false;

    for (const keyword of mapping.labels) {
      // Match in term labels or full text
      if (
        termLabels.some((label) => label.includes(keyword)) ||
        text.some((word) => word.includes(keyword))
      ) {
        matches.add(
          JSON.stringify({ pillar: mapping.pillar, category: mapping.category })
        );
        foundMatch = true;
        break; // Avoid duplicate from same mapping
      }
    }

    // Only check text if no term match found
    if (!foundMatch) {
      for (const keyword of mapping.labels) {
        if (fullText.includes(keyword)) {
          matches.add(
            JSON.stringify({
              pillar: mapping.pillar,
              category: mapping.category,
            })
          );
          break;
        }
      }
    }
  }

  return Array.from(matches).map((m) => JSON.parse(m));
}

const CATEGORY_MAPPINGS = [
  // ------------------------
  // 🧘 Wellness & Growth
  // ------------------------
  {
    labels: [
      "meditatie",
      "mindfulness",
      "zen",
      "stiltewandeling",
      "stilte",
      "innerlijke rust",
      "ontspanning",
      "ademhaling",
      "stressreductie",
      "healing",
      "inner peace",
      "contemplatie",
    ],
    pillar: "Mindfulness",
    category: "Meditation",
  },
  {
    labels: [
      "dankbaarheid",
      "zingeving",
      "spiritualiteit",
      "zelfzorg",
      "persoonlijke groei",
      "persoonlijke ontwikkeling",
      "innerlijke groei",
      "bewustwording",
      "levensvragen",
    ],
    pillar: "Mindfulness",
    category: "Self-growth",
  },
  {
    labels: [
      "religie",
      "kerk",
      "gebed",
      "geloof",
      "bijbel",
      "doop",
      "mis",
      "boeddhisme",
      "moskee",
      "klooster",
      "interlevensbeschouwelijk",
    ],
    pillar: "Mindfulness",
    category: "Spiritual",
  },
  {
    labels: [
      "gezondheid",
      "wellness",
      "massages",
      "spa",
      "therapie",
      "therapeutisch",
      "natuurgeneeskunde",
      "holistisch",
      "balans",
      "mind-body",
      "alternatieve geneeskunde",
    ],
    pillar: "Mindfulness",
    category: "Wellness",
  },
  {
    labels: ["erfgoed"],
    pillar: "Mindfulness",
    category: "Culture",
  },
  {
    labels: ["tentoonstelling"],
    pillar: "Mindfulness",
    category: "Exhibition",
  },

  // ------------------------
  // 🏋️ Movement & Body
  // ------------------------
  {
    labels: [
      "sport",
      "sportdag",
      "workout",
      "training",
      "fit",
      "fitheid",
      "fitness",
      "hardlopen",
      "lopen",
      "wandelen",
      "trail",
      "tocht",
      "running",
      "spinning",
      "bootcamp",
      "bodyweight",
      "krachttraining",
      "cardio",
      "wandelroute",
    ],
    pillar: "Physical",
    category: "Exercise",
  },
  {
    labels: [
      "yoga",
      "qi gong",
      "tai chi",
      "stretching",
      "pilates",
      "body & mind",
      "slow movement",
      "lichte beweging",
      "balansoefeningen",
      "rustige sport",
      "ademhalingsoefeningen",
    ],
    pillar: "Physical",
    category: "Mindful Movement",
  },
  {
    labels: [
      "dans",
      "dance",
      "zumba",
      "salsa",
      "hiphop",
      "klassiek ballet",
      "dansles",
      "modern",
      "movement",
      "improvisatiedans",
      "choreografie",
    ],
    pillar: "Physical",
    category: "Dance",
  },
  {
    labels: [
      "natuurwandeling",
      "bosbad",
      "natuurbeleving",
      "outdoor",
      "buitensport",
      "klimmen",
      "survival",
      "kajakken",
      "fietstocht",
      "mountainbike",
      "buitenactiviteit",
      "avontuur",
      "geleide wandeling",
    ],
    pillar: "Physical",
    category: "Nature",
  },

  // ------------------------
  // 🎓 Learning & Skills
  // ------------------------
  {
    labels: [
      "illustratie",
      "tekenen",
      "schilderen",
      "fotografie",
      "creatief",
      "beeldende kunst",
      "kunst",
      "drama",
      "muziekles",
      "gitaarles",
      "zingen",
      "koor",
      "instrument",
      "muziekschool",
      "muziekatelier",
      "kunstenloket",
    ],
    pillar: "Skills",
    category: "Arts",
  },
  {
    labels: [
      "handwerk",
      "ambacht",
      "keramiek",
      "boetseren",
      "handwerken",
      "naaien",
      "breien",
      "vrij handwerken",
    ],
    pillar: "Skills",
    category: "Crafts",
  },
  {
    labels: [
      "lezing",
      "congres",
      "seminarie",
      "college",
      "talk",
      "presentatie",
      "infosessie",
    ],
    pillar: "Skills",
    category: "Talks",
  },
  {
    labels: [
      "taal",
      "talen",
      "frans",
      "engels",
      "duits",
      "nt2",
      "taalcursus",
      "taalinitiatie",
    ],
    pillar: "Skills",
    category: "Languages",
  },
  {
    labels: [
      "digitaal",
      "technologie",
      "computer",
      "it",
      "ai",
      "robotica",
      "webdesign",
      "digitale vaardigheden",
    ],
    pillar: "Skills",
    category: "Tech",
  },
  // catch leftovers
  {
    labels: ["lessenreeks"],
    pillar: "Skills",
    category: "Skills",
  },

  // ------------------------
  // 👥 Social & Events
  // ------------------------
  {
    labels: [
      "eten",
      "maaltijd",
      "diner",
      "aperitief",
      "kookactiviteit",
      "voedsel",
      "restaurant",
      "ontbijt",
      "eetfestijn",
      "drankfestijn",
    ],
    pillar: "Social",
    category: "Dining",
  },
  {
    labels: [
      "concert",
      "film",
      "komedie",
      "theater",
      "muziekoptreden",
      "comedy",
      "humor",
      "jazz",
      "blues",
      "klassieke muziek",
      "pop",
      "rock",
      "orkest",
      "optreden",
      "samenzang",
      "muziektheater",
      "cinema",
      "voorstelling",
    ],
    pillar: "Social",
    category: "Entertainment",
  },
  {
    labels: [
      "kinderen",
      "jongeren",
      "familie",
      "ouder-kind",
      "gezinsactiviteit",
      "peuters",
      "babies",
      "kinderworkshop",
      "jeugd",
      "tieners",
      "gezinsvriendelijk",
      "vakantieactiviteit",
      "kiekens",
    ],
    pillar: "Social",
    category: "Family",
  },
  {
    labels: [
      "festival",
      "markt",
      "braderie",
      "sinterklaas",
      "evenement",
      "toer",
      "feestelijk",
      "viering",
    ],
    pillar: "Social",
    category: "Festivals",
  },
  {
    labels: [
      "buurt",
      "wijk",
      "lokaal",
      "gemeente",
      "dorpsfeest",
      "buurtactiviteit",
      "burgerinitiatief",
      "participatie",
      "samenleven",
      "wijkwerking",
    ],
    pillar: "Social",
    category: "Community",
  },
  {
    labels: ["kamp", "vakantie", "zomerkamp", "speelplein", "retreat"],
    pillar: "Social",
    category: "Retreats",
  },
];
