import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRight, ShoppingBag, Heart, Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Store invite code in sessionStorage for capture after signup
  useEffect(() => {
    if (code) {
      sessionStorage.setItem('invite_code', code);
    }
  }, [code]);

  // Try to find the org by matching the code pattern (slug-based or referral code)
  const { data: referrer, isLoading: loadingReferrer } = useQuery({
    queryKey: ['invite-referrer', code],
    queryFn: async () => {
      if (!code) return null;
      // Try as referral_code
      const { data } = await db
        .from('profiles')
        .select('id, display_name, avatar_url, referral_code')
        .eq('referral_code', code)
        .maybeSingle();
      return data;
    },
    enabled: !!code,
  });

  // Find orgs the referrer belongs to (for preview)
  const { data: referrerOrgs = [] } = useQuery({
    queryKey: ['invite-referrer-orgs', referrer?.id],
    queryFn: async () => {
      if (!referrer?.id) return [];
      const { data } = await db
        .from('organization_members')
        .select('organization_id, organizations(id, name, slug, logo_url, description, category, banner_url)')
        .eq('user_id', referrer.id)
        .limit(3);
      return (data || []).map((m: any) => m.organizations).filter(Boolean);
    },
    enabled: !!referrer?.id,
  });

  const handleJoin = () => {
    if (user) {
      navigate('/discover');
    } else {
      navigate(`/auth?tab=signup&invite=${code}`);
    }
  };

  if (loadingReferrer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Invitation — Siteviral" description="Rejoignez Siteviral et découvrez des ressources numériques exclusives." />
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/">
            <span className="text-xl font-extrabold tracking-tight text-foreground">Siteviral</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/auth">Connexion</Link></Button>
            <Button size="sm" asChild>
              <Link to={`/auth?tab=signup&invite=${code}`}>S'inscrire</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-14">
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="container max-w-2xl text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
              {referrer && (
                <div className="flex items-center justify-center gap-3 mb-4">
                  {referrer.avatar_url ? (
                    <img src={referrer.avatar_url} alt="" className="h-14 w-14 rounded-full border-2 border-primary object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {(referrer.display_name || 'U')[0]}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold">{referrer.display_name || 'Un membre'}</p>
                    <p className="text-sm text-muted-foreground">vous invite à rejoindre Siteviral</p>
                  </div>
                </div>
              )}

              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
                Rejoignez la communauté{' '}
                <span className="text-primary">Siteviral</span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                Découvrez des contenus exclusifs, accédez à des formations, et soutenez les organisations qui vous inspirent.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="px-8 h-13 text-base gap-2 w-full sm:w-auto"
                  onClick={handleJoin}
                >
                  {user ? 'Explorer les communautés' : 'Créer mon compte gratuit'} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
                {[
                  { icon: Play, label: 'Contenus vidéo' },
                  { icon: ShoppingBag, label: 'Ressources digitales' },
                  { icon: Heart, label: 'Dons sécurisés' },
                  { icon: Users, label: 'Communautés actives' },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border shadow-card">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <b.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{b.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Referrer's orgs preview */}
        {referrerOrgs.length > 0 && (
          <section className="py-12 px-4 bg-muted/30">
            <div className="container max-w-3xl">
              <h2 className="text-xl font-bold text-center mb-6">Communautés à découvrir</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {referrerOrgs.map((org: any) => (
                  <motion.div
                    key={org.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="bg-card rounded-2xl border border-border p-4 shadow-card hover:shadow-elevated transition-all cursor-pointer"
                    onClick={() => navigate(`/org/${org.slug}`)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                          {org.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{org.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{org.category}</Badge>
                      </div>
                    </div>
                    {org.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{org.description}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {!referrer && (
          <section className="py-12 px-4">
            <div className="container max-w-md text-center">
              <div className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-4">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                  <Users className="h-7 w-7 text-muted-foreground" />
                </div>
                <h2 className="font-bold text-lg">Code d'invitation</h2>
                <p className="text-sm text-muted-foreground">
                  {code ? `Code : ${code}` : 'Aucun code fourni.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ce code sera associé à votre compte lors de l'inscription.
                </p>
                <Button
                  className="w-full bg-primary text-primary-foreground"
                  onClick={handleJoin}
                >
                  {user ? 'Explorer' : 'S\'inscrire maintenant'}
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 px-4 bg-muted/20">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <SiteLogo size="sm" animate />
          <span>© {new Date().getFullYear()} Siteviral — Operated by HACKTUALIZ Inc.</span>
        </div>
      </footer>
    </div>
  );
}
