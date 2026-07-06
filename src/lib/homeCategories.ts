// Shared Home Services categories — used in onboarding, services editor, discovery filters.
import {
  Wrench, Zap, Sparkles, Truck, Paintbrush, Snowflake,
  Hammer, Sprout, Bug, Cog, type LucideIcon,
} from "lucide-react";

export interface HomeCategory {
  id: string;
  fr: string;
  en: string;
  icon: LucideIcon;
}

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: "plumber", fr: "Plombier", en: "Plumber", icon: Wrench },
  { id: "electrician", fr: "Électricien", en: "Electrician", icon: Zap },
  { id: "cleaner", fr: "Ménage", en: "Cleaning", icon: Sparkles },
  { id: "mover", fr: "Déménagement", en: "Movers", icon: Truck },
  { id: "painter", fr: "Peinture", en: "Painter", icon: Paintbrush },
  { id: "ac_repair", fr: "Climatisation", en: "AC Repair", icon: Snowflake },
  { id: "handyman", fr: "Bricolage", en: "Handyman", icon: Hammer },
  { id: "gardener", fr: "Jardinier", en: "Gardener", icon: Sprout },
  { id: "pest_control", fr: "Anti-nuisibles", en: "Pest Control", icon: Bug },
  { id: "appliance_repair", fr: "Électroménager", en: "Appliance Repair", icon: Cog },
];

export const HOME_CATEGORY_IDS = HOME_CATEGORIES.map((c) => c.id);
export type HomeCategoryId = (typeof HOME_CATEGORY_IDS)[number];

export function homeCategoryLabel(id: string, locale: string): string {
  const c = HOME_CATEGORIES.find((x) => x.id === id);
  return c ? (locale === "fr" ? c.fr : c.en) : id;
}
