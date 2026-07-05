// Shared beauty categories — used in onboarding, services editor, search filters.
export const BEAUTY_CATEGORIES = [
  "Coiffure",
  "Tresses",
  "Locks",
  "Ongles",
  "Pédicure / Manucure",
  "Maquillage",
  "Soins visage",
  "Soins corps",
  "Extensions & cils",
  "Microblading",
  "Massage & spa",
  "Barbier",
  "Épilation",
  "Henné",
  "Enfants",
] as const;

export type BeautyCategory = typeof BEAUTY_CATEGORIES[number];
