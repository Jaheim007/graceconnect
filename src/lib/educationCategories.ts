// Shared Education subjects — used in onboarding, subjects editor, discovery filters.
import {
  Calculator, Atom, Beaker, Globe2, BookOpen, PenTool,
  Code2, Languages, Music, Palette, Dumbbell, Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface EducationCategory {
  id: string;
  fr: string;
  en: string;
  icon: LucideIcon;
}

export const EDUCATION_CATEGORIES: EducationCategory[] = [
  { id: "math", fr: "Mathématiques", en: "Mathematics", icon: Calculator },
  { id: "physics", fr: "Physique", en: "Physics", icon: Atom },
  { id: "chemistry", fr: "Chimie", en: "Chemistry", icon: Beaker },
  { id: "biology", fr: "Biologie / SVT", en: "Biology", icon: Globe2 },
  { id: "french", fr: "Français", en: "French", icon: BookOpen },
  { id: "philosophy", fr: "Philosophie", en: "Philosophy", icon: PenTool },
  { id: "coding", fr: "Programmation", en: "Coding", icon: Code2 },
  { id: "english", fr: "Anglais", en: "English", icon: Languages },
  { id: "music", fr: "Musique", en: "Music", icon: Music },
  { id: "art", fr: "Arts & Dessin", en: "Art & Drawing", icon: Palette },
  { id: "sports", fr: "Sport & Coaching", en: "Sports coaching", icon: Dumbbell },
  { id: "business", fr: "Business & Éco", en: "Business & Econ", icon: Briefcase },
];

export const EDUCATION_LEVELS = [
  { id: "primary", fr: "Primaire", en: "Primary" },
  { id: "college", fr: "Collège", en: "Middle school" },
  { id: "lycee", fr: "Lycée", en: "High school" },
  { id: "bac", fr: "Bac / Terminale", en: "Senior year" },
  { id: "university", fr: "Université", en: "University" },
  { id: "adult", fr: "Adulte / Pro", en: "Adult / Pro" },
];

export const EDUCATION_MODES = [
  { id: "online", fr: "En ligne", en: "Online" },
  { id: "in_person", fr: "À domicile", en: "In-person" },
];

export function educationCategoryLabel(id: string, locale: string): string {
  const c = EDUCATION_CATEGORIES.find((x) => x.id === id);
  return c ? (locale === "fr" ? c.fr : c.en) : id;
}
