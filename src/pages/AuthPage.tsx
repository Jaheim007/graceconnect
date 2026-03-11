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

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState<'choose' | 'magic-link' | 'otp-verify'>('choose');
  
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithFacebook, signInWithLinkedin, signInWithMagicLink, verifyOtp, user } = useAuth();
  const { userOrgs } = useOrg();
  const { t } = useI18n();

  const returnTo = searchParams.get('returnTo');
  const inviteCode = searchParams.get('invite');
  const intent = searchParams.get('intent'); // 'ambassador' | 'creator'

  useEffect(() => {
    if (inviteCode) sessionStorage.setItem('sv_invite_code', inviteCode);
  }, [inviteCode]);

  // Store intent for post-login redirect
  useEffect(() => {
    if (intent === 'ambassador' || intent === 'creator' || intent === 'partner') {
      sessionStorage.setItem('sv_auth_intent', intent);
    }
  }, [intent]);

  useEffect(() => {
    if (user) {
      const savedIntent = sessionStorage.getItem('sv_auth_intent');
      if (savedIntent === 'ambassador' || savedIntent === 'creator') {
        sessionStorage.removeItem('sv_auth_intent');
        // Import dynamically to avoid circular deps - just set localStorage directly
        const modeKey = 'sv_app_mode';
        try { localStorage.setItem(modeKey, savedIntent); } catch {}
        navigate(returnTo || '/dashboard', { replace: true });
      } else {
        navigate(returnTo || '/dashboard', { replace: true });
      }
    }
  }, [user, navigate, returnTo]);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    // Persist returnTo for Google OAuth (callback page will read it)
    if (returnTo) {
      try { sessionStorage.setItem('sv_auth_returnTo', returnTo); } catch {}
    }
    const { error: err } = await signInWithGoogle(returnTo || undefined);
    if (err) { setError(err.message); setGoogleLoading(false); }
  };

  const handleFacebook = async () => {
    setError('');
    setFacebookLoading(true);
    if (returnTo) {
      try { sessionStorage.setItem('sv_auth_returnTo', returnTo); } catch {}
    }
    const { error: err } = await signInWithFacebook(returnTo || undefined);
    if (err) { setError(err.message); setFacebookLoading(false); }
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
    <div className="min-h-screen relative flex">
      <SEOHead title="Connexion — Siteviral" description="Connectez-vous à Siteviral pour gérer votre plateforme, vos ressources et vos commissions." noindex />
      <div className="absolute inset-0 z-0">
        <img src={authBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      </div>

      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10">
        <SiteLogo size="xl" animate />
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            {t('auth.sign_in_title')}{' '}<span className="text-primary italic">{t('auth.grow_together')}</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">{t('auth.infra_platform')}</p>
          <div className="flex gap-3 mt-4">
            {['Médias', 'Dons', 'Boutique', 'Ambassadeur'].map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">{tag}</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Siteviral · Hacktualiz Inc.</p>
      </div>

      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-card/95 backdrop-blur-md rounded-3xl border border-border shadow-elevated p-7 space-y-6">
            <div className="flex lg:hidden items-center justify-center mb-2">
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
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">{t('auth.or')}</span><div className="h-px flex-1 bg-border" />
                  </div>
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
                      <Input id="magic-email" type="email" placeholder="you@example.com" className="pl-9 h-11" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
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
        </div>
      </div>
    </div>
  );
}
