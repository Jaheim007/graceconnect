// Shared Events categories — used in onboarding, packages editor, discovery filters.
import {
  Camera, Video, Music, Mic2, UtensilsCrossed, Sparkles,
  Building2, Speaker, Shield, ChefHat, CalendarHeart, Armchair,
  type LucideIcon,
} from "lucide-react";

export interface EventsCategory {
  id: string;
  fr: string;
  en: string;
  icon: LucideIcon;
}

export const EVENTS_CATEGORIES: EventsCategory[] = [
  { id: "photographer", fr: "Photographe", en: "Photographer", icon: Camera },
  { id: "videographer", fr: "Vidéaste", en: "Videographer", icon: Video },
  { id: "dj", fr: "DJ", en: "DJ", icon: Music },
  { id: "mc", fr: "Animateur / MC", en: "MC / Host", icon: Mic2 },
  { id: "caterer", fr: "Traiteur", en: "Caterer", icon: ChefHat },
  { id: "decorator", fr: "Décoration", en: "Decorator", icon: Sparkles },
  { id: "venue", fr: "Salle / Lieu", en: "Venue", icon: Building2 },
  { id: "sound_light", fr: "Son & Lumière", en: "Sound & Light", icon: Speaker },
  { id: "security", fr: "Sécurité", en: "Security", icon: Shield },
  { id: "food_truck", fr: "Restauration", en: "Food service", icon: UtensilsCrossed },
  { id: "planner", fr: "Wedding planner", en: "Planner", icon: CalendarHeart },
  { id: "rental", fr: "Location matériel", en: "Rentals", icon: Armchair },
];

export const EVENTS_CATEGORY_IDS = EVENTS_CATEGORIES.map((c) => c.id);
export type EventsCategoryId = (typeof EVENTS_CATEGORY_IDS)[number];

export function eventsCategoryLabel(id: string, locale: string): string {
  const c = EVENTS_CATEGORIES.find((x) => x.id === id);
  return c ? (locale === "fr" ? c.fr : c.en) : id;
}
