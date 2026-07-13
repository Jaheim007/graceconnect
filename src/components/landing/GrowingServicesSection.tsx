import { Link } from 'react-router-dom';
import { Sparkles, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Honest positioning: services marketplace is growing.
 * No fabricated counts, testimonials, or supply claims.
 */
export function GrowingServicesSection() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  return (
    <section className="container max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-muted/40 to-background p-6 sm:p-10">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-4">
              <Sparkles className="h-3 w-3" />
              {fr ? 'En pleine croissance' : 'Growing'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {fr
                ? 'La marketplace de services grandit chaque semaine.'
                : 'Our services marketplace grows every week.'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              {fr
                ? "Des artisans, professionnels de la beauté, tuteurs, coachs, musiciens et créateurs rejoignent SiteViral. Certaines catégories sont déjà solides, d'autres se construisent — on préfère être honnête plutôt qu'inventer."
                : 'Artisans, beauty professionals, tutors, coaches, musicians and creators are joining SiteViral. Some categories are already strong, others are being built — we\'d rather be honest than invent supply.'}
            </p>
          </div>

          <div className="grid gap-3">
            <ActionRow
              icon={Send}
              title={fr ? 'Dites-nous ce que vous cherchez' : 'Tell us what you need'}
              text={fr ? 'On priorise les catégories les plus demandées.' : "We prioritise the most requested categories."}
              to="/looking-for"
              cta={fr ? 'Publier une demande' : 'Post a request'}
            />
            <ActionRow
              icon={Bell}
              title={fr ? 'Soyez alerté quand des pros arrivent' : 'Get notified when providers join'}
              text={fr ? 'On vous prévient dès qu\'un nouveau pro est disponible.' : "We'll let you know when a new pro is available."}
              to="/discover"
              cta={fr ? 'Explorer maintenant' : 'Explore now'}
            />
            <ActionRow
              icon={Sparkles}
              title={fr ? 'Vous êtes professionnel ?' : 'Are you a professional?'}
              text={fr ? 'Créez votre espace pro et commencez à recevoir des demandes.' : 'Create your workspace and start receiving enquiries.'}
              to="/start"
              cta={fr ? 'Proposer mes services' : 'Offer your services'}
              primary
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ActionRow({
  icon: Icon, title, text, to, cta, primary,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; text: string; to: string; cta: string; primary?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 ${primary ? 'border-primary/40 bg-primary/[0.04]' : 'border-border bg-card'}`}>
      <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${primary ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground/70'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold leading-tight">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{text}</div>
      </div>
      <Button asChild size="sm" variant={primary ? 'default' : 'outline'} className="shrink-0 h-9 font-semibold">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}
