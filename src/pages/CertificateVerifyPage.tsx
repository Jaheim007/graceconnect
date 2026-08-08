import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  Award, BadgeCheck, XCircle, Loader2, Link2, Check,
  Linkedin, Twitter, Facebook, MessageCircle, ExternalLink, GraduationCap,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type Design = {
  cover_image_url?: string | null;
  badge_image_url?: string | null;
  signature_image_url?: string | null;
  signature_label?: string | null;
  footer_text?: string | null;
};

export default function CertificateVerifyPage() {
  const { certNumber } = useParams();
  const { locale } = useI18n();
  const { toast } = useToast();
  const isFr = locale === 'fr';
  const dateLoc = isFr ? fr : enUS;
  const [copied, setCopied] = useState(false);

  // Preview mode: /verify/preview renders a sample certificate from the design
  // the creator is currently editing (stored in sessionStorage). No DB read.
  const isPreview = certNumber === 'preview';
  const previewData = (() => {
    if (!isPreview || typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('certificate-preview');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  // Public verification runs through the read-only RPC: the certificates table
  // itself is not readable by anonymous visitors.
  const { data: fetched, isLoading: fetching } = useQuery({
    queryKey: ['verify-certificate', certNumber],
    queryFn: async () => {
      if (!certNumber) return null;
      const { data, error } = await supabase.rpc('verify_program_certificate', {
        _certificate_number: certNumber,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as any;
    },
    enabled: !!certNumber && !isPreview,
  });

  const certData = isPreview ? previewData : fetched;
  const isLoading = isPreview ? false : fetching;


  const isValid = !!certData;
  const recipientName = certData?.learner_name || (isFr ? 'Apprenant' : 'Learner');
  const programTitle = certData?.course_title || '';
  const orgName = certData?.organization_name || '';
  const orgLogo = certData?.organization_logo_url as string | undefined;
  const orgSlug = certData?.organization_slug as string | undefined;
  const design: Design = (certData?.certificate_design || {}) as Design;
  const cover = design.cover_image_url || (certData?.program_cover_url as string | undefined);
  const badge = design.badge_image_url || orgLogo;
  const lessons: string[] = Array.isArray(certData?.lesson_titles) ? certData.lesson_titles : [];
  const score = certData?.assessment_score;
  const total = certData?.assessment_total;
  const issuedAt = certData?.issued_at
    ? format(new Date(certData.issued_at), 'dd MMMM yyyy', { locale: dateLoc })
    : '';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = isFr
    ? `${recipientName} a obtenu un certificat pour « ${programTitle} »`
    : `${recipientName} earned a certificate for “${programTitle}”`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: isFr ? 'Lien copié' : 'Link copied' });
    } catch {
      toast({ title: isFr ? 'Copie impossible' : 'Could not copy', variant: 'destructive' });
    }
  };

  const socials = [
    { icon: Linkedin, label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
    { icon: Twitter, label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` },
    { icon: Facebook, label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { icon: MessageCircle, label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}` },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0a12] text-white">
      <SEOHead
        title={isValid
          ? (isFr ? `Certificat vérifié — ${recipientName}` : `Certificate verified — ${recipientName}`)
          : (isFr ? 'Vérification de certificat' : 'Certificate verification')}
        description={isValid
          ? (isFr ? `${recipientName} a complété la formation « ${programTitle} » sur Siteviral.` : `${recipientName} completed the “${programTitle}” program on Siteviral.`)
          : (isFr ? 'Vérifiez un certificat Siteviral.' : 'Verify a Siteviral certificate.')}
      />

      {/* Cinematic backdrop */}
      <div className="pointer-events-none absolute inset-0">
        {cover ? (
          <img src={cover} alt="" aria-hidden className="h-full w-full object-cover opacity-25 blur-2xl scale-110" />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 45% at 50% 0%, rgba(250,204,21,0.22), transparent 70%), radial-gradient(55% 40% at 85% 90%, rgba(168,85,247,0.20), transparent 70%), radial-gradient(50% 40% at 10% 80%, rgba(56,189,248,0.16), transparent 70%), linear-gradient(180deg, rgba(11,10,18,0.55) 0%, #0b0a12 65%)',
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        {isLoading ? (
          <div className="py-32 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-300" />
            <p className="mt-3 text-sm text-white/60">{isFr ? 'Vérification en cours…' : 'Verifying…'}</p>
          </div>
        ) : !isValid ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="font-heading text-xl font-bold">{isFr ? 'Certificat introuvable' : 'Certificate not found'}</h1>
            <p className="mt-2 text-sm text-white/60">
              {isFr
                ? <>Le numéro <span className="font-mono font-semibold text-white/80">{certNumber}</span> n'existe pas dans notre système.</>
                : <>The number <span className="font-mono font-semibold text-white/80">{certNumber}</span> does not exist in our system.</>}
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <a href="/">{isFr ? 'Retour à Siteviral' : 'Back to Siteviral'}</a>
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Verified banner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur"
            >
              <BadgeCheck className="h-4 w-4" />
              {isPreview
                ? (isFr ? 'Aperçu — voici ce que vos apprenants partageront' : 'Preview — this is what your learners will share')
                : (isFr ? 'Certificat authentique et vérifié' : 'Authentic, verified certificate')}

            </motion.div>

            {/* The certificate */}
            <motion.article
              initial={{ opacity: 0, y: 24, rotateX: 6 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-[28px] p-[1.5px] shadow-[0_40px_120px_-30px_rgba(250,204,21,0.35)]"
              style={{ background: 'linear-gradient(135deg, #fde68a, #b45309 35%, #fef3c7 55%, #92400e 80%, #fcd34d)' }}
            >
              <div className="relative overflow-hidden rounded-[26px] bg-[#0e0d16]">
                {/* Shine sweep */}
                <motion.div
                  aria-hidden
                  initial={{ x: '-120%' }}
                  animate={{ x: '140%' }}
                  transition={{ duration: 2.4, delay: 0.5, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/12 to-transparent"
                />

                {/* Cover strip */}
                <div className="relative h-32 sm:h-40 w-full overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={programTitle} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ background: 'linear-gradient(120deg,#78350f,#b45309,#f59e0b)' }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d16] via-[#0e0d16]/40 to-transparent" />
                </div>

                {/* Badge */}
                <div className="-mt-12 flex justify-center">
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-full p-[2px] shadow-[0_10px_40px_-8px_rgba(250,204,21,0.6)]"
                    style={{ background: 'linear-gradient(135deg,#fde68a,#b45309,#fcd34d)' }}
                  >
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0e0d16]">
                      {badge ? (
                        <img src={badge} alt={orgName} className="h-full w-full object-cover" />
                      ) : (
                        <Award className="h-10 w-10 text-amber-300" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-10 pt-6 text-center sm:px-12">
                  <p className="font-heading text-[11px] uppercase tracking-[0.35em] text-amber-300/80">
                    {isFr ? 'Certificat de réussite' : 'Certificate of completion'}
                  </p>
                  <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

                  <p className="mt-6 text-sm italic text-white/50">
                    {isFr ? 'Ce certificat atteste que' : 'This certificate acknowledges that'}
                  </p>
                  <h1
                    className="font-heading mt-2 text-3xl font-bold sm:text-5xl"
                    style={{ backgroundImage: 'linear-gradient(135deg,#fef3c7,#fbbf24,#fef3c7)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
                  >
                    {recipientName}
                  </h1>

                  <p className="mt-5 text-sm text-white/50">
                    {isFr ? 'a rempli avec succès les exigences de la formation' : 'has successfully fulfilled the requirements of the course'}
                  </p>
                  <h2 className="font-heading mt-2 text-xl font-semibold text-white sm:text-2xl">“{programTitle}”</h2>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">{issuedAt}</span>
                    {score != null && total ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
                        {isFr ? 'Score' : 'Score'} {Math.round((score / total) * 100)}%
                      </span>
                    ) : null}
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 font-mono text-amber-200">
                      N° {certData?.certificate_number || certNumber}
                    </span>
                  </div>

                  {/* Course outline */}
                  {lessons.length > 0 && (
                    <div className="mt-9 text-left">
                      <p className="text-center font-heading text-[10px] uppercase tracking-[0.3em] text-white/40">
                        {isFr ? 'Programme suivi' : 'Course outline'}
                      </p>
                      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {lessons.slice(0, 16).map((t, i) => (
                          <li key={i} className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[13px] text-white/70">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                            <span className="min-w-0 break-words">{t}</span>
                          </li>
                        ))}
                      </ul>
                      {lessons.length > 16 && (
                        <p className="mt-3 text-center text-xs italic text-white/40">
                          {isFr ? `+ ${lessons.length - 16} autres leçons` : `+ ${lessons.length - 16} more lessons`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Signature */}
                  <div className="mt-10 flex flex-col items-center gap-2">
                    {design.signature_image_url ? (
                      <img src={design.signature_image_url} alt="" className="h-12 object-contain" />
                    ) : null}
                    <div className="h-px w-40 bg-white/15" />
                    <p className="text-xs font-medium text-white/70">{design.signature_label || (isFr ? 'Signé par' : 'Signed by')}</p>
                    <p className="font-heading text-sm text-white">{design.footer_text || orgName}</p>
                  </div>
                </div>
              </div>
            </motion.article>

            {/* Share + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6"
            >
              <p className="text-center text-sm font-medium text-white/80">
                {isFr ? 'Partagez cette réussite' : 'Share this achievement'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button onClick={copyLink} className="bg-amber-400 text-[#0b0a12] hover:bg-amber-300">
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Link2 className="mr-2 h-4 w-4" />}
                  {copied ? (isFr ? 'Lien copié' : 'Link copied') : (isFr ? 'Copier le lien' : 'Copy link')}
                </Button>
                {socials.map((s) => (
                  <Button key={s.label} asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <a href={s.href} target="_blank" rel="noreferrer">
                      <s.icon className="mr-2 h-4 w-4" />{s.label}
                    </a>
                  </Button>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-5">
                {orgSlug ? (
                  <Button asChild variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                    <a href={`/org/${orgSlug}`}>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      {isFr ? `Voir ${orgName}` : `View ${orgName}`}
                    </a>
                  </Button>
                ) : null}
                <Button asChild variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                  <a href="/">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {isFr ? 'Découvrir Siteviral' : 'Discover Siteviral'}
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-center text-[11px] text-white/35">
                {isFr ? 'Vérifié par Siteviral — siteviral.com' : 'Verified by Siteviral — siteviral.com'}
              </p>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
