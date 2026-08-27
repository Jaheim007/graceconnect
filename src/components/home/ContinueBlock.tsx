import { Link } from '@/lib/router-compat';
import { BookOpen, GraduationCap, ArrowRight, Play } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { markSurfaceVisit } from '@/lib/siteviral/lastSurface';
import type { ContinueItem } from '@/hooks/useUserCapabilities';

/**
 * "Reprendre" — the single most relevant thing the user can resume.
 * One primary action, no choice paralysis.
 */
export function ContinueBlock({ item }: { item: ContinueItem }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const isCourse = item.kind === 'course';
  const Icon = isCourse ? GraduationCap : BookOpen;
  const progress = Math.max(0, Math.min(100, Math.round(item.progressPercent ?? 0)));
  const to = isCourse && item.programId ? `/program/${item.programId}` : '/my-purchases';

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {isFr ? 'Reprendre' : 'Continue'}
      </h2>
      <Link
        to={to}
        onClick={() => markSurfaceVisit('learn')}
        className="group relative block overflow-hidden rounded-3xl border border-primary/25 glass-premium p-4 sm:p-5 transition hover:border-primary/50"
      >
        <div className="pointer-events-none absolute -top-20 -right-12 h-48 w-48 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-primary/10 grid place-items-center">
            {item.coverUrl ? (
              <img src={item.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <Icon className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {isCourse
                ? isFr ? 'Ta formation' : 'Your course'
                : isFr ? 'Ton achat' : 'Your purchase'}
            </p>
            <p className="truncate text-base font-extrabold leading-tight">{item.title}</p>
            {isCourse && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground">{progress}% {isFr ? 'complété' : 'complete'}</p>
              </div>
            )}
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow transition group-hover:scale-105">
            {isCourse ? <Play className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
          </span>
        </div>
        <p className="relative mt-3 text-xs font-semibold text-primary">
          {isCourse
            ? isFr ? 'Continuer la formation' : 'Continue the course'
            : isFr ? 'Ouvrir dans ma bibliothèque' : 'Open in my library'}
        </p>
      </Link>
    </section>
  );
}
