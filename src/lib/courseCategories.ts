/**
 * Course catalog categories.
 *
 * Courses have no dedicated `category` column: they carry an optional
 * `themes` text[]. A course is matched to a catalog category when one of its
 * themes matches, otherwise by keyword detection on title + description.
 */
export interface CourseCategory {
  key: string;
  labelFr: string;
  labelEn: string;
  regex?: RegExp;
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  { key: 'all', labelFr: 'Tout', labelEn: 'All' },
  { key: 'faith', labelFr: 'Foi & Spiritualité', labelEn: 'Faith & Spirituality', regex: /bible|église|church|pray|prière|spirit|dieu|god|faith|foi|worship|sermon|gospel|christ|pasteur|pastor/i },
  { key: 'business', labelFr: 'Business & Marketing', labelEn: 'Business & Marketing', regex: /\b(business|market|vend|sell|entrep|freelan|copywrite|brand|commerce|funnel|startup|stratégi)\b/i },
  { key: 'tech', labelFr: 'Tech & IA', labelEn: 'Tech & AI', regex: /\b(tech|cod(e|ing)|dev|software|data|machine.?learn|prompt|ia|ai|saas|python|javascript|cyber|no.?code)\b/i },
  { key: 'finance', labelFr: 'Finance', labelEn: 'Finance', regex: /\b(financ|invest|trading|crypto|bourse|budget|comptab|épargne)\b/i },
  { key: 'creative', labelFr: 'Créatif & Design', labelEn: 'Creative & Design', regex: /\b(art|design|photo|music|musique|dessin|illustr|graphi|vidéo|video|montage)\b/i },
  { key: 'wellness', labelFr: 'Santé & Bien-être', labelEn: 'Health & Wellness', regex: /\b(health|santé|bien.?être|wellness|fitness|yoga|méditat|nutrit|mental|coach)\b/i },
  { key: 'education', labelFr: 'Éducation & Langues', labelEn: 'Education & Languages', regex: /\b(cours|school|école|math|langue|language|english|anglais|français|french|exam|bac|révis)\b/i },
];

export function categorizeCourse(course: { title?: string | null; description?: string | null; themes?: string[] | null }): string {
  const themes = (course.themes || []).map((t) => t.toLowerCase());
  const matchedTheme = COURSE_CATEGORIES.slice(1).find((c) => themes.includes(c.key));
  if (matchedTheme) return matchedTheme.key;

  const text = `${course.title || ''} ${(course.description || '').replace(/<[^>]*>/g, '')}`;
  const matched = COURSE_CATEGORIES.slice(1).find((c) => c.regex?.test(text));
  return matched?.key || 'all';
}
