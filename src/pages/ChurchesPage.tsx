import { Link, useNavigate } from 'react-router-dom';
import {
  Church, Users, HandCoins, Radio, CalendarDays, MessageCircle, Bell, Wallet,
  Globe, ShieldCheck, ArrowRight, Check, FileText, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChurchNav } from '@/components/landing/church/ChurchNav';
import { ChurchFooter } from '@/components/landing/church/ChurchFooter';
import { Reveal } from '@/components/landing/Reveal';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';
import { setPendingAction } from '@/lib/pendingAction';

/**
 * Standalone public funnel: /churches
 * Its own header and footer — a pastor who receives this link never lands in the
 * generic SiteViral menus. Only real, currently shipping Church capabilities.
 */
export default function ChurchesPage() {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const navigate = useNavigate();
  const t = (a: string, b: string) => (fr ? a : b);

  const startChurch = () => {
    setIntent('provider', '/church/pro/onboarding');
    setPendingAction('create_organization', '/church/pro/onboarding', { kind: 'church' });
    navigate('/church/pro/onboarding');
  };

  const groups = [
    {
      icon: HandCoins,
      label: t('Dons & offrandes', 'Giving & offerings'),
      items: [
        t('Dons ponctuels ou récurrents', 'One-off or recurring gifts'),
        t('Wave, Orange Money, MTN, Moov, carte', 'Wave, Orange Money, MTN, Moov, card'),
        t('Reçus automatiques pour les donateurs', 'Automatic receipts for donors'),
        t('Campagnes de collecte avec objectif', 'Fundraising campaigns with a goal'),
      ],
    },
    {
      icon: Radio,
      label: t('Sermons & contenus', 'Sermons & content'),
      items: [
        t('Sermons audio publiés en ligne', 'Audio sermons published online'),
        t('PDF et ressources téléchargeables', 'Downloadable PDFs and resources'),
        t('Annonces et demandes de prière', 'Announcements and prayer requests'),
      ],
    },
    {
      icon: Users,
      label: t('Membres & événements', 'Members & events'),
      items: [
        t('Annuaire des membres et rôles', 'Member directory and roles'),
        t('Événements et inscriptions', 'Events and registrations'),
        t('Rendez-vous pastoraux', 'Pastoral appointments'),
        t('Équipe multi-rôles (pasteur, secrétariat, bénévoles)', 'Multi-role team (pastor, office, volunteers)'),
      ],
    },
    {
      icon: Wallet,
      label: t('Paiements & versements', 'Payments & payouts'),
      items: [
        t('Historique complet des transactions', 'Complete transaction history'),
        t('Exports pour votre comptabilité', 'Exports for your bookkeeping'),
        t('Versements sur le compte de l\'église', 'Payouts to the church account'),
      ],
    },
  ];

  const faq = [
    {
      q: t('Combien SiteViral prend sur les dons ?', 'How much does SiteViral take on giving?'),
      a: t(
        "Aucune marge. Sur les dons et les offrandes, SiteViral ne prélève rien pour lui-même : seul le coût exact du processeur de paiement est déduit (environ 1,5 % sur Wave, jusqu'à 3,5 % sur Mobile Money).",
        'No margin. On donations and offerings SiteViral keeps nothing for itself: only the exact payment processor cost is deducted (about 1.5% on Wave, up to 3.5% on Mobile Money).',
      ),
    },
    {
      q: t("Qui contrôle l'argent des dons ?", 'Who controls the giving money?'),
      a: t(
        "L'église. Les dons sont encaissés puis versés sur le compte que vous déclarez, au nom de l'église. Vous voyez chaque transaction dans votre espace.",
        'The church does. Gifts are collected then paid out to the account you declare, in the name of the church. You see every transaction in your space.',
      ),
    },
    {
      q: t('Faut-il des documents pour recevoir les versements ?', 'Do we need documents to receive payouts?'),
      a: t(
        "Oui, une vérification (KYB) est demandée avant le premier versement : pièce d'identité du responsable et un document de l'église. Vous pouvez publier votre page et recevoir des dons avant de la compléter.",
        'Yes, a verification (KYB) is required before the first payout: the leader\'s ID and a church document. You can publish your page and receive gifts before completing it.',
      ),
    },
    {
      q: t('Est-ce que nos membres doivent créer un compte pour donner ?', 'Do members need an account to give?'),
      a: t(
        "Non. Un membre ouvre votre page, choisit un montant, paie en Mobile Money et reçoit son reçu. Aucun compte requis.",
        'No. A member opens your page, picks an amount, pays with Mobile Money and gets a receipt. No account needed.',
      ),
    },
    {
      q: t('Combien de temps pour être en ligne ?', 'How long until we are online?'),
      a: t(
        "Quelques minutes. Vous créez l'espace église, vous ajoutez le nom, la ville et un moyen de recevoir les dons, et votre page publique est active.",
        'A few minutes. You create the church space, add the name, the city and a way to receive gifts, and your public page is live.',
      ),
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title={fr
          ? 'SiteViral pour les églises — Recevez les dons, publiez vos sermons'
          : 'SiteViral for churches — Receive giving, publish your sermons'}
        description={fr
          ? "Une page publique pour votre église : dons en Mobile Money sans marge SiteViral, sermons, membres, événements et versements — au même endroit."
          : 'A public page for your church: Mobile Money giving with no SiteViral margin, sermons, members, events and payouts — all in one place.'}
        canonicalUrl="https://siteviral.com/churches"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <ChurchNav onStart={startChurch} />

      {/* Hero — one promise, one action */}
      <main id="main-content">
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(65% 50% at 50% 0%, hsl(var(--primary)/0.13), transparent 70%)',
            }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-[110px] animate-glow-pulse" />
            <div className="absolute -top-10 right-1/5 h-64 w-64 rounded-full bg-accent/20 blur-[110px] animate-glow-pulse [animation-delay:2s]" />
          </div>
          <div className="container relative max-w-3xl px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
            <Reveal delay={0}>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {fr ? 'SiteViral pour les églises' : 'SiteViral for churches'}
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 text-[2rem] leading-[1.08] sm:text-6xl font-black tracking-tight text-balance">
                {fr ? 'Votre église reçoit les dons ' : 'Your church receives giving '}
                <span className="bg-[linear-gradient(110deg,hsl(var(--primary)),hsl(var(--accent)),hsl(var(--primary)))] bg-[length:220%_auto] bg-clip-text text-transparent animate-text-sheen">
                  {fr ? 'directement sur son téléphone.' : 'straight on its phone.'}
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mx-auto mt-5 max-w-xl text-sm sm:text-lg leading-relaxed text-muted-foreground text-pretty">
                {fr
                  ? "Une page publique pour votre église : dons en Wave, Orange Money et MTN, sermons, membres et événements. SiteViral ne prend aucune marge sur les dons."
                  : 'A public page for your church: giving via Wave, Orange Money and MTN, sermons, members and events. SiteViral takes no margin on giving.'}
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  onClick={startChurch}
                  className="group h-12 w-full rounded-xl px-6 font-bold gap-2 shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 sm:w-auto"
                >
                  {fr ? 'Créer mon espace église' : 'Create my church space'}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Link
                  to="/auth?mode=signin"
                  className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {fr ? 'Notre église est déjà inscrite' : 'Our church already has a space'}
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
                {[
                  fr ? '0 % de marge sur les dons' : '0% margin on giving',
                  fr ? 'Gratuit pour commencer' : 'Free to start',
                  fr ? 'Prêt en quelques minutes' : 'Live in minutes',
                ].map((x) => (
                  <li key={x} className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" /> {x}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>


        {/* What the public page looks like */}
        <section className="container max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <Reveal className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <div className="ml-3 flex-1 truncate rounded-md bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                siteviral.com/{fr ? 'votre-eglise' : 'your-church'}
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-3">
              {[
                {
                  icon: HandCoins,
                  title: fr ? 'Bouton "Faire un don"' : '"Give" button',
                  lines: fr
                    ? ['1 000 · 5 000 · 10 000 FCFA', 'Wave · Orange · MTN', 'Reçu envoyé automatiquement']
                    : ['1,000 · 5,000 · 10,000 FCFA', 'Wave · Orange · MTN', 'Receipt sent automatically'],
                },
                {
                  icon: Radio,
                  title: fr ? 'Sermons de la semaine' : "This week's sermons",
                  lines: fr
                    ? ['Audio du dimanche', 'PDF d\'étude biblique', 'Demandes de prière']
                    : ['Sunday audio', 'Bible study PDF', 'Prayer requests'],
                },
                {
                  icon: CalendarDays,
                  title: fr ? 'Prochains événements' : 'Upcoming events',
                  lines: fr
                    ? ['Culte de jeunesse', 'Séminaire des couples', 'Inscriptions en ligne']
                    : ['Youth service', 'Couples seminar', 'Online registrations'],
                },
              ].map((p) => (
                <div key={p.title} className="rounded-2xl border border-border bg-background p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <p.icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-4 text-base font-bold tracking-tight">{p.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {p.lines.map((l) => (
                      <li key={l} className="rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Capabilities, grouped */}
        <section className="border-y border-border bg-muted/30">
          <div className="container max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                {fr ? 'Ce que vous obtenez' : 'What you get'}
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-balance">
                {fr
                  ? "Tout ce qu'il faut pour gérer votre église, aujourd'hui."
                  : 'Everything you need to run your church, today.'}
              </h2>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {groups.map((g) => (
                <Reveal key={g.label} className="rounded-2xl border border-border bg-background p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <g.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-bold tracking-tight">{g.label}</h3>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {g.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Fees, said plainly */}
        <section className="container max-w-5xl px-4 sm:px-6 py-14 sm:py-20">
          <Reveal className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                {fr ? 'Les frais, sans détour' : 'Fees, said plainly'}
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-balance">
                {fr
                  ? 'SiteViral ne prend aucune marge sur vos dons.'
                  : 'SiteViral takes no margin on your giving.'}
              </h2>
              <p className="mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-muted-foreground">
                {fr
                  ? "Seul le coût exact du processeur de paiement est déduit — c'est lui qui transporte l'argent, pas nous. Si votre église vend un livre ou une formation, la règle est celle des créateurs : 10 % tout compris."
                  : 'Only the exact payment processor cost is deducted — they move the money, not us. If your church sells a book or a formation, the creator rule applies: 10% all-inclusive.'}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {fr ? 'Exemple sur un don de 10 000 FCFA' : 'Example on a 10,000 FCFA gift'}
              </p>
              <dl className="mt-4 space-y-2">
                {[
                  { k: fr ? 'Le fidèle donne' : 'The member gives', v: '10 000 FCFA' },
                  { k: fr ? 'Coût du processeur (Wave ~1,5 %)' : 'Processor cost (Wave ~1.5%)', v: '- 150 FCFA' },
                  { k: fr ? 'Marge SiteViral' : 'SiteViral margin', v: '0 FCFA' },
                  { k: fr ? "L'église reçoit" : 'The church receives', v: '9 850 FCFA', strong: true },
                ].map((r) => (
                  <div
                    key={r.k}
                    className={
                      r.strong
                        ? 'flex items-center justify-between gap-4 rounded-xl bg-primary/10 px-4 py-3'
                        : 'flex items-center justify-between gap-4 rounded-xl bg-muted/60 px-4 py-3'
                    }
                  >
                    <dt className={r.strong ? 'text-sm font-bold' : 'text-sm text-muted-foreground'}>{r.k}</dt>
                    <dd className={r.strong ? 'text-sm font-black text-primary' : 'text-sm font-semibold'}>{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </section>

        {/* Trust: verification, roles, payouts */}
        <section className="border-y border-border bg-muted/30">
          <div className="container max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: fr ? 'Vérification de l\'église (KYB)' : 'Church verification (KYB)',
                  text: fr
                    ? "Pièce d'identité du responsable et document de l'église, demandés avant le premier versement."
                    : "The leader's ID and a church document, requested before the first payout.",
                },
                {
                  icon: Users,
                  title: fr ? 'Rôles pour votre équipe' : 'Roles for your team',
                  text: fr
                    ? 'Pasteur, secrétariat, bénévoles : chacun voit uniquement ce dont il a besoin.'
                    : 'Pastor, office, volunteers: each person sees only what they need.',
                },
                {
                  icon: FileText,
                  title: fr ? 'Traçabilité des dons' : 'Traceable giving',
                  text: fr
                    ? 'Chaque don est enregistré, avec reçu pour le donateur et export pour votre comptabilité.'
                    : 'Every gift is recorded, with a receipt for the donor and an export for your bookkeeping.',
                },
              ].map((x) => (
                <div key={x.title} className="rounded-2xl border border-border bg-background p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <x.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold tracking-tight">{x.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to start */}
        <section className="container max-w-5xl px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-balance">
            {fr ? 'Comment démarrer' : 'How to start'}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Church,
                step: '1',
                title: fr ? 'Créez l\'espace église' : 'Create the church space',
                text: fr ? "Nom, ville, dénomination. C'est tout." : 'Name, city, denomination. That is all.',
              },
              {
                icon: Smartphone,
                step: '2',
                title: fr ? 'Activez les dons' : 'Turn on giving',
                text: fr
                  ? 'Choisissez les montants suggérés et le moyen de recevoir l\'argent.'
                  : 'Pick suggested amounts and how you receive the money.',
              },
              {
                icon: Globe,
                step: '3',
                title: fr ? 'Partagez votre page' : 'Share your page',
                text: fr
                  ? 'Un lien à envoyer dans le groupe WhatsApp de l\'église.'
                  : "One link to send in the church's WhatsApp group.",
              },
            ].map((s) => (
              <Reveal key={s.step} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {fr ? 'Étape' : 'Step'} {s.step}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-muted/30">
          <div className="container max-w-3xl px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center text-balance">
              {fr ? 'Les questions que les pasteurs nous posent' : 'The questions pastors ask us'}
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {faq.map((f, i) => (
                <AccordionItem key={f.q} value={`q${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container max-w-3xl px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-balance">
            {fr ? 'Votre page église peut être en ligne ce soir.' : 'Your church page can be live tonight.'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
            {fr
              ? 'Créez l\'espace, activez les dons, partagez le lien à votre assemblée.'
              : 'Create the space, turn on giving, share the link with your assembly.'}
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button onClick={startChurch} className="h-12 w-full rounded-xl px-6 font-bold gap-2 sm:w-auto">
              {fr ? 'Créer mon espace église' : 'Create my church space'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/contact" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              {fr ? 'Parler à quelqu\'un' : 'Talk to someone'}
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Bell className="h-3.5 w-3.5" />
            {fr
              ? 'Annonces, prières et rendez-vous inclus dans le même espace.'
              : 'Announcements, prayer and appointments included in the same space.'}
          </p>
          <p className="sr-only">
            <MessageCircle className="h-3 w-3" />
          </p>
        </section>
      </main>

      <ChurchFooter />
    </div>
  );
}
