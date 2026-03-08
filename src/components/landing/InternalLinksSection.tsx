import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface RelatedPage {
  path: string;
  label: string;
}

const PERSONA_PAGES: RelatedPage[] = [
  { path: '/pour/eglises', label: 'Églises' },
  { path: '/pour/ong', label: 'ONG' },
  { path: '/pour/formateurs', label: 'Formateurs' },
  { path: '/pour/coaches', label: 'Coachs' },
  { path: '/pour/auteurs', label: 'Auteurs' },
  { path: '/pour/musiciens', label: 'Musiciens' },
  { path: '/pour/podcasters', label: 'Podcasters' },
  { path: '/pour/designers', label: 'Designers' },
  { path: '/pour/consultants', label: 'Consultants' },
  { path: '/pour/etudiants', label: 'Étudiants' },
  { path: '/pour/entrepreneurs', label: 'Entrepreneurs' },
  { path: '/pour/diaspora', label: 'Diaspora' },
  { path: '/pour/femmes-entrepreneures', label: 'Femmes entrepreneures' },
  { path: '/pour/createurs-video', label: 'Créateurs vidéo' },
  { path: '/pour/associations', label: 'Associations' },
  { path: '/pour/influenceurs', label: 'Influenceurs' },
  { path: '/pour/blogueurs', label: 'Blogueurs' },
  { path: '/pour/photographes', label: 'Photographes' },
  { path: '/pour/centres-formation', label: 'Centres de formation' },
  { path: '/pour/medias', label: 'Médias' },
];

const CTA_LINKS: RelatedPage[] = [
  { path: '/ecrire', label: '✍️ Écrire un livre' },
  { path: '/gagner', label: '💰 Gagner en partageant' },
  { path: '/vendre', label: '🛒 Vendre mes produits' },
  { path: '/calculateur', label: '📊 Calculer mes revenus' },
];

interface InternalLinksSectionProps {
  currentPath?: string;
  maxLinks?: number;
}

export function InternalLinksSection({ currentPath, maxLinks = 6 }: InternalLinksSectionProps) {
  const related = PERSONA_PAGES
    .filter(p => p.path !== currentPath)
    .sort(() => Math.random() - 0.5)
    .slice(0, maxLinks);

  return (
    <section className="py-16 px-4 border-t border-border bg-muted/20">
      <div className="container max-w-5xl space-y-8">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold">Découvrez aussi</h2>
          <p className="text-sm text-muted-foreground mt-1">Siteviral pour tous les profils</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {related.map(p => (
            <Link key={p.path} to={p.path}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm font-medium group">
              {p.label}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary ml-auto transition-colors" />
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {CTA_LINKS.map(c => (
            <Link key={c.path} to={c.path}
              className="px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors">
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
