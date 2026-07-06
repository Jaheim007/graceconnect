import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Church, HandHeart, Mic, Sparkles, Globe, ArrowRight, Users, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

export default function ChurchLanding() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  useEffect(() => {
    document.title = fr
      ? 'SiteViral Church — La plateforme des églises africaines'
      : 'SiteViral Church — The platform for African churches';
    const meta = document.querySelector('meta[name="description"]');
    const desc = fr
      ? 'Recevez dîmes et offrandes en Mobile Money, transformez vos prédications audio en livres et articles, connectez votre diaspora — sans compétence technique.'
      : 'Receive tithes and offerings via Mobile Money, turn your sermon audios into books and articles, connect your diaspora — no tech skills needed.';
    if (meta) meta.setAttribute('content', desc);
  }, [fr]);

  const pillars = [
    { icon: Mic, title: fr ? 'Bibliothèque de prédications' : 'Sermon library', desc: fr ? 'Uploadez vos audios chaque dimanche. Transcription automatique.' : 'Upload your audio every Sunday. Auto transcription.' },
    { icon: Sparkles, title: fr ? 'Audio → Livre, article, reel' : 'Audio → book, article, reel', desc: fr ? "Une prédication devient un chapitre d'ebook, un article, un devotional WhatsApp." : 'One sermon becomes an ebook chapter, a blog article, a WhatsApp devotional.' },
    { icon: HandHeart, title: fr ? 'Dîmes & offrandes' : 'Tithes & offerings', desc: fr ? 'Mobile Money local, carte pour la diaspora. Reçus automatiques.' : 'Local Mobile Money, card for the diaspora. Automatic receipts.' },
    { icon: Users, title: fr ? 'Communauté & prière' : 'Community & prayer', desc: fr ? 'Événements, live, boîte de prière privée pour le pasteur.' : 'Events, live streaming, private prayer inbox for the pastor.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary mb-6">
            <Church className="h-3.5 w-3.5" />
            {fr ? 'SiteViral Church' : 'SiteViral Church'}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            {fr ? (
              <>Votre église, <span className="text-primary">connectée</span> à l'Afrique et à la diaspora.</>
            ) : (
              <>Your church, <span className="text-primary">connected</span> to Africa and the diaspora.</>
            )}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            {fr
              ? 'La plateforme tout-en-un pensée pour les églises : prédications audio, transformation IA en livres et articles, dîmes en Mobile Money & carte, communauté et prière.'
              : 'The all-in-one platform built for churches: audio sermons, AI transformation into books and articles, tithes via Mobile Money & card, community and prayer.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="text-base">
              <Link to="/church/pro/onboarding">
                {fr ? 'Créer mon église gratuitement' : 'Create my church for free'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/church/discover">
                <PlayCircle className="mr-2 h-4 w-4" />
                {fr ? 'Découvrir les églises' : 'Discover churches'}
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> {fr ? "Orange Money · MTN · Wave · Visa · Mastercard — 150+ pays" : 'Orange Money · MTN · Wave · Visa · Mastercard — 150+ countries'}
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">
          {fr ? 'Tout ce dont votre église a besoin.' : 'Everything your church needs.'}
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diaspora bridge */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border text-xs mb-4">
                🌍 {fr ? 'Pont diaspora' : 'Diaspora bridge'}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {fr ? 'Vos fidèles à l\'étranger donnent en 1 clic.' : 'Your members abroad give in 1 click.'}
              </h2>
              <p className="text-muted-foreground">
                {fr
                  ? 'Aux États-Unis, en France, au Canada : vos frères et sœurs donnent par carte bancaire en dollars, euros, livres. L\'argent arrive dans votre compte Mobile Money local, en FCFA.'
                  : 'In the US, France, Canada: your brothers and sisters give by card in dollars, euros, pounds. The money lands in your local Mobile Money account, in local currency.'}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-xs text-muted-foreground">{fr ? 'Fidèle à New York' : 'Member in New York'}</span>
                <span className="text-xs font-mono">💳 Visa</span>
              </div>
              <div className="py-4 text-3xl font-bold">50,00 $</div>
              <ArrowRight className="mx-auto my-3 h-5 w-5 text-primary" />
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{fr ? 'Église à Abidjan' : 'Church in Abidjan'}</span>
                  <span className="text-xs font-mono">📱 Orange</span>
                </div>
                <div className="pt-2 text-2xl font-bold text-primary">30 000 FCFA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {fr ? 'Prêt à digitaliser votre église ?' : 'Ready to digitize your church?'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {fr ? 'Gratuit. 2 minutes. Aucune compétence technique requise.' : 'Free. 2 minutes. No technical skills required.'}
          </p>
          <Button asChild size="lg" className="text-base">
            <Link to="/church/pro/onboarding">
              {fr ? 'Créer mon église' : 'Create my church'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
