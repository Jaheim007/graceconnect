import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import authBg from '@/assets/auth-bg.jpg';
import { cn } from '@/lib/utils';
import { isNativePlatform } from '@/lib/capacitor';
import { useTheme } from '@/contexts/ThemeContext';
import { resolvePostAuthRedirect } from '@/lib/authRedirect';
import { safeReturnTo, setPendingAction } from '@/lib/pendingAction';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState<'choose' | 'magic-link' | 'otp-verify'>('choose');
  
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithFacebook, signInWithLinkedin, signInWithMagicLink, verifyOtp, user } = useAuth();
  const { userOrgs } = useOrg();
  const { t } = useI18n();
  const nativeApp = isNativePlatform();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const returnTo = searchParams.get('returnTo');
  const inviteCode = searchParams.get('invite');
  const intent = searchParams.get('intent'); // 'ambassador' | 'creator'

  useEffect(() => {
    if (inviteCode) sessionStorage.setItem('sv_invite_code', inviteCode);
  }, [inviteCode]);

  // Coming back from a guest checkout: the email is known, go straight to the
  // magic-link step so claiming the purchase is a single tap.
  useEffect(() => {
    if (searchParams.get('email')) setMethod('magic-link');
  }, [searchParams]);


  // Store intent for post-login redirect
  useEffect(() => {
    if (intent === 'ambassador' || intent === 'creator' || intent === 'partner') {
      sessionStorage.setItem('sv_auth_intent', intent);
    }
  }, [intent]);

  useEffect(() => {
    if (!user) return;
    const savedIntent = sessionStorage.getItem('sv_auth_intent');
    if (savedIntent === 'ambassador' || savedIntent === 'creator') {
      sessionStorage.removeItem('sv_auth_intent');
      try { localStorage.setItem('sv_app_mode', savedIntent); } catch {}
      const safe = safeReturnTo(returnTo) || '/dashboard';
      navigate(safe, { replace: true });
      return;
    }
    const createdAt = new Date(user.created_at).getTime();
    const isNewUser = Date.now() - createdAt < 60_000;
    const target = resolvePostAuthRedirect({ isNewUser, explicitReturnTo: returnTo });
    navigate(target, { replace: true });
  }, [user, navigate, returnTo]);


  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const markOAuthPending = () => {
    try {
      sessionStorage.setItem('sv_oauth_pending_since', String(Date.now()));
      if (returnTo) sessionStorage.setItem('sv_auth_returnTo', returnTo);
    } catch {}
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    markOAuthPending();
    const { error: err } = await signInWithGoogle(returnTo || undefined);
    if (err) {
      try { sessionStorage.removeItem('sv_oauth_pending_since'); } catch {}
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const handleFacebook = async () => {
    setError('');
    setFacebookLoading(true);
    markOAuthPending();
    const { error: err } = await signInWithFacebook(returnTo || undefined);
    if (err) {
      try { sessionStorage.removeItem('sv_oauth_pending_since'); } catch {}
      setError(err.message);
      setFacebookLoading(false);
    }
  };

  const handleLinkedin = async () => {
    setError('');
    setLinkedinLoading(true);
    markOAuthPending();
    const { error: err } = await signInWithLinkedin(returnTo || undefined);
    if (err) {
      try { sessionStorage.removeItem('sv_oauth_pending_since'); } catch {}
      setError(err.message);
      setLinkedinLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setSending(true);
    const { error: err } = await signInWithMagicLink(email, returnTo || undefined);
    setSending(false);
    if (err) setError(err.message);
    else {
      setMethod('otp-verify');
      setOtpCode('');
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return;
    setError('');
    setVerifying(true);
    const { error: err } = await verifyOtp(email, otpCode);
    setVerifying(false);
    if (err) setError(err.message);
  };

  return (
    <div className={cn('relative flex text-foreground', isDark ? 'bg-[#08070f]' : 'bg-[#fbf7ef]', nativeApp ? 'native-auth-screen' : 'min-h-screen')}>
      <SEOHead title={document.documentElement.lang === 'fr' ? 'Connexion — Siteviral' : 'Sign in — Siteviral'} description={document.documentElement.lang === 'fr' ? 'Connectez-vous à Siteviral pour gérer votre plateforme, vos ressources et vos commissions.' : 'Sign in to Siteviral to manage your platform, resources, and commissions.'} noindex />

      {/* Premium certificate-grade backdrop: deep ink, gold aurora, engraved grid */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {nativeApp ? (
          <div className="native-auth-background absolute inset-0" />
        ) : (
          <img src={authBg} alt="" className={cn('h-full w-full object-cover', isDark ? 'opacity-[0.18]' : 'opacity-[0.07]')} />
        )}
        <div aria-hidden className={cn('absolute inset-0', isDark ? 'bg-[#08070f]/90' : 'bg-[#fbf7ef]/92')} />
        <motion.div
          aria-hidden
          className="absolute -top-1/3 -left-1/4 h-[70vh] w-[70vh] rounded-full blur-[120px]"
          style={{ background: isDark ? 'radial-gradient(circle, rgba(245,158,11,0.22), transparent 65%)' : 'radial-gradient(circle, rgba(217,119,6,0.16), transparent 65%)' }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-1/3 -right-1/4 h-[65vh] w-[65vh] rounded-full blur-[130px]"
          style={{ background: isDark ? 'radial-gradient(circle, rgba(56,89,255,0.18), transparent 65%)' : 'radial-gradient(circle, rgba(56,89,255,0.10), transparent 65%)' }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          aria-hidden
          className={cn('absolute inset-0', isDark ? 'opacity-[0.06]' : 'opacity-[0.10]')}
          style={{
            backgroundImage:
              isDark
                ? 'linear-gradient(to right, rgba(253,230,138,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(253,230,138,0.5) 1px, transparent 1px)'
                : 'linear-gradient(to right, rgba(146,64,14,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(146,64,14,0.35) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 72%)',
          }}
        />
        <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(252,211,77,0.5), transparent)' }} />
      </div>

      <div className={cn('hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10', nativeApp && 'lg:hidden')}>
        <SiteLogo size="xl" animate />
        <div className="space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-700 dark:text-amber-300/70">
            {document.documentElement.lang === 'fr' ? 'Accès sécurisé' : 'Secure access'}
          </p>
          <h1 className="font-heading text-5xl font-bold leading-[1.05]">
            {t('auth.sign_in_title')}{' '}
            <span
              className="italic"
              style={{ backgroundImage: isDark ? 'linear-gradient(120deg,#fef3c7,#fbbf24,#fef3c7)' : 'linear-gradient(120deg,#b45309,#f59e0b,#92400e)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
            >
              {t('auth.grow_together')}
            </span>
          </h1>
          <div className="h-px w-28" style={{ background: 'linear-gradient(90deg, rgba(252,211,77,0.8), transparent)' }} />
          <p className="max-w-md text-lg text-muted-foreground">{t('auth.infra_platform')}</p>
          <div className="mt-4 flex gap-2.5">
            {['Médias', 'Dons', 'Boutique', 'Ambassadeur'].map((tag) => (
              <span key={tag} className="rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/[0.07] dark:text-amber-200/90">{tag}</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Siteviral · Hacktualiz Inc.</p>
      </div>

      <div className={cn('flex-1 lg:w-1/2 flex items-center justify-center p-6 relative z-10', nativeApp && 'w-full items-start justify-center p-0')}>
        <div className={cn('w-full max-w-md', nativeApp && 'native-auth-card max-w-lg')}>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[28px] p-[1.5px] shadow-[0_40px_120px_-40px_rgba(250,204,21,0.35)]"
            style={{ background: 'linear-gradient(135deg, rgba(253,230,138,0.9), rgba(180,83,9,0.5) 35%, rgba(254,243,199,0.85) 55%, rgba(146,64,14,0.5) 80%, rgba(252,211,77,0.9))' }}
          >
            <motion.div
              aria-hidden
              initial={{ x: '-130%' }}
              animate={{ x: '150%' }}
              transition={{ duration: 2.6, delay: 0.6, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 z-20 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
            <div className={cn('relative rounded-[26px] backdrop-blur-xl p-7 space-y-6', isDark ? 'bg-[#0e0d16]/95' : 'bg-white/95', nativeApp && 'shadow-premium')}>

            {nativeApp && (
              <div className="flex items-center justify-center gap-3" aria-label="SiteViral">
                <SiteLogo size="lg" animate />
                <p className="text-xs text-muted-foreground">
                  {document.documentElement.lang === 'fr' ? 'Connexion sécurisée' : 'Secure sign in'}
                </p>
              </div>
            )}

            <div className={cn('flex lg:hidden items-center justify-center mb-2', nativeApp && 'hidden')}>
              <SiteLogo size="md" animate />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">{t('auth.welcome')}</h2>
              <p className="text-sm text-muted-foreground">{t('auth.sign_in_access')}</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {method === 'otp-verify' ? (
                <motion.div key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="text-center space-y-2">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Mail className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base">{t('auth.verify_email')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('auth.otp_sent')}<br /><strong className="text-foreground">{email}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">{t('auth.enter_code')}</p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP maxLength={8} value={otpCode} onChange={setOtpCode} onComplete={handleVerifyOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                        <InputOTPSlot index={6} />
                        <InputOTPSlot index={7} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    className="w-full h-11 bg-primary text-primary-foreground"
                    disabled={verifying || otpCode.length < 6}
                    onClick={handleVerifyOtp}
                  >
                    {verifying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('auth.verifying')}</> : t('auth.verify_code')}
                  </Button>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-muted-foreground">{t('auth.check_spam_otp')}</p>
                    <div className="flex gap-3">
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => { setMethod('magic-link'); setError(''); setOtpCode(''); }}>
                        <ArrowLeft className="h-3 w-3" /> {t('auth.change_email')}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={async () => {
                        setError('');
                        setSending(true);
                        const { error: err } = await signInWithMagicLink(email, returnTo || undefined);
                        setSending(false);
                        if (err) setError(err.message);
                      }} disabled={sending}>
                        {sending ? t('auth.sending') : t('auth.resend_code')}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : method === 'choose' ? (
                <motion.div key="choose" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-3">
                  <Button variant="outline" className="w-full h-12 gap-2.5 text-sm font-medium" onClick={handleGoogle} disabled={googleLoading}>
                    {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    {googleLoading ? t('auth.redirecting') : t('auth.continue_google')}
                  </Button>
                  <Button variant="outline" className="w-full h-12 gap-2.5 text-sm font-medium" onClick={handleFacebook} disabled={facebookLoading}>
                    {facebookLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    {facebookLoading ? t('auth.redirecting') : t('auth.continue_facebook')}
                  </Button>
                  <Button variant="outline" className="w-full h-12 gap-2.5 text-sm font-medium" onClick={handleLinkedin} disabled={linkedinLoading}>
                    {linkedinLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )}
                    {linkedinLoading ? t('auth.redirecting') : t('auth.continue_linkedin')}
                  </Button>
                  <Button variant="outline" className="w-full h-12 gap-2.5 text-sm font-medium" onClick={() => setMethod('magic-link')}>
                    <Mail className="h-5 w-5" /> {t('auth.continue_magic')}
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground pt-2">{t('auth.no_password')}</p>
                </motion.div>
              ) : (
                <motion.form key="magic" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <Label htmlFor="magic-email">{t('auth.your_email')}</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="magic-email" type="email" placeholder={document.documentElement.lang === 'fr' ? 'vous@exemple.com' : 'you@example.com'} className="pl-9 h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoCapitalize="none" autoCorrect="off" enterKeyHint="done" required autoFocus />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground" disabled={sending || !email}>
                    {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('auth.sending')}</> : t('auth.send_code')}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setMethod('choose')}>{t('auth.back_options')}</Button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-xs text-center text-muted-foreground">
              {t('auth.agree_terms')}{' '}
              <Link to="/terms" className="underline hover:text-foreground">{t('auth.terms_of_service')}</Link>{' '}{t('auth.and')}{' '}
              <Link to="/privacy" className="underline hover:text-foreground">{t('auth.privacy_policy')}</Link>.
            </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
