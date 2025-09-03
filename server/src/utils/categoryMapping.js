// src/utils/categoryMapping.js

const CATEGORY_MAP = {
  "Family & Kids Activities": {
    ticketmaster: { keywords: ["Children's Music and Theatre Tickets"] },
    eventfinda: { keywords: ["family", "kids", "children", "activities", "playground", "adventure", "family music", "kids music", "kids show"] }
  },
  "Community & Support": {
    eventfinda: { keywords: ["community", "support group", "mothers group", "fathers group", "single parent", "local community", "community event", "nog aid"] }
  },
  "Wellbeing & Parenting": {
    eventfinda: { keywords: ["wellbeing", "parenting", "mental health", "mindfulness", "meditation", "wellness", "self-care", "parenting skills", "parent support", "yoga", "fitness", "health"] }
  },
  "Learning & Development": {
     ticketmaster: { keywords: ["exhibition"] },
    eventfinda: { keywords: ["education", "child development", "early learning", "school readiness", "literacy", "numeracy", "STEM", "educational", "learning", "development", "skills", "workshop", "seminar"] }
  },
  "Arts & Entertainment": {
    ticketmaster: { keywords: ["theatre"] },
    eventfinda: { keywords: ["theatre", "show", "performance", "drama", "musical", "play", "art", "gallery", "craft"] }
  },
  "Markets & Local Events": {
    ticketmaster: { keywords: ["exhibition"] },
    eventfinda: { keywords: ["market", "local event", "community festival", "farmers market", "craft market", "cultural", "festival", "exhibition"] }
  }
};

module.exports = CATEGORY_MAP;
