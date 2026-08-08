/**
 * Certificate template editor — Step A of the certificate feature.
 *
 * The creator turns certificates on in the completion rules, then designs the
 * template here: a wide cover strip, the certification badge (defaults to the
 * platform avatar), an optional signature image, the footer text (defaults to
 * the org name) and whether the lesson outline is printed on the certificate.
 *
 * Only presentation + persistence of the design; the PDF renderer consumes the
 * same shape (see src/lib/certificates.ts) in the next step.
 */
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Award, ExternalLink } from 'lucide-react';


export interface CertificateDesign {
  cover_image_url?: string | null;
  badge_image_url?: string | null;
  signature_image_url?: string | null;
  signature_label?: string | null;
  footer_text?: string | null;
}

interface Props {
  design: CertificateDesign;
  onChange: (patch: CertificateDesign) => void;
  courseTitle: string;
  orgName: string;
  orgLogo?: string | null;
  lessons: { title: string }[];
  learnerName?: string;
}

export function CertificateTemplateEditor({
  design, onChange, courseTitle, orgName, orgLogo, lessons, learnerName,
}: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const badge = design.badge_image_url || orgLogo || '';
  const footerText = design.footer_text ?? orgName;
  const name = learnerName || t('Nom de l’apprenant', 'Learner name');

  const openPublicPreview = () => {
    try {
      const payload = JSON.stringify({
        learner_name: name,
        course_title: courseTitle || t('Titre du cours', 'Course title'),
        organization_name: orgName,
        organization_logo_url: orgLogo || null,
        certificate_number: 'PREVIEW-0000',
        issued_at: new Date().toISOString(),
        program_cover_url: design.cover_image_url || null,
        lesson_titles: lessons.map((l) => l.title),
        certificate_design: design,
      });
      // localStorage: a new tab opened with noopener does not inherit sessionStorage.
      localStorage.setItem('certificate-preview', payload);
    } catch { /* storage unavailable — page falls back to "not found" */ }
    window.open('/verify/preview', '_blank', 'noopener');
  };


  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">{t('Modèle de certificat', 'Certificate template')}</h3>
            <p className="text-[11px] text-muted-foreground">
              {t('Ce que l’apprenant reçoit et peut imprimer à la fin du cours.',
                 'What the learner receives and can print at the end of the course.')}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={openPublicPreview}>
          <ExternalLink className="h-3.5 w-3.5" />
          {t('Aperçu de la page publique', 'Preview public page')}
        </Button>
      </div>


      {/* Live preview — a faithful miniature of the printed certificate */}
      <div className="mx-auto w-full max-w-[440px]">
        <div className="relative aspect-[1414/2000] w-full overflow-hidden rounded-lg bg-cert-paper shadow-elevated">
          {/* engraved guilloche + warm vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 48%, hsl(var(--cert-gold-soft) / 0.14) 0 1px, transparent 1px 26px), radial-gradient(circle at 50% 100%, hsl(var(--cert-paper-warm)) 0%, transparent 70%)',
              backgroundSize: '100% 100%, 100% 100%',
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-[46%] aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
            style={{
              background:
                'repeating-radial-gradient(circle, hsl(var(--cert-gold-soft) / 0.28) 0 0.5px, transparent 0.5px 11px)',
            }}
          />

          {/* double gold frame */}
          <div className="pointer-events-none absolute inset-[7px] border-[1.5px] border-cert-gold" />
          <div className="pointer-events-none absolute inset-[12px] border border-cert-gold-soft/70" />
          {/* corner brackets */}
          {[
            'left-[14px] top-[14px] border-l-2 border-t-2',
            'right-[14px] top-[14px] border-r-2 border-t-2',
            'left-[14px] bottom-[14px] border-l-2 border-b-2',
            'right-[14px] bottom-[14px] border-r-2 border-b-2',
          ].map((pos) => (
            <div key={pos} className={`pointer-events-none absolute h-6 w-6 border-cert-gold ${pos}`} />
          ))}

          <div className="relative flex h-full flex-col px-6 pb-5 pt-5">
            {/* header band */}
            <div className="relative h-[54px] w-full overflow-hidden border border-cert-gold/80">
              {design.cover_image_url ? (
                <>
                  <img
                    src={design.cover_image_url}
                    alt={t('Bannière du certificat', 'Certificate cover')}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-cert-ink/25" />
                </>
              ) : (
                <div className="grid h-full w-full place-items-center bg-cert-ink">
                  <span className="text-[8px] uppercase tracking-[0.35em] text-cert-gold-soft">{orgName}</span>
                </div>
              )}
            </div>
            <div className="mt-1 h-[1.5px] w-full bg-cert-gold" />

            {/* medallion */}
            <div className="relative mx-auto -mt-[26px] h-[62px] w-[62px]">
              <div
                className="absolute -inset-[7px] rounded-full opacity-90"
                style={{
                  background:
                    'repeating-conic-gradient(from 0deg, hsl(var(--cert-gold)) 0deg 1.2deg, transparent 1.2deg 10deg)',
                  mask: 'radial-gradient(circle, transparent 62%, #000 64%)',
                  WebkitMask: 'radial-gradient(circle, transparent 62%, #000 64%)',
                }}
              />
              <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-full border-2 border-cert-gold bg-cert-paper">
                {badge
                  ? <img src={badge} alt={t('Badge', 'Badge')} className="h-full w-full object-cover" loading="lazy" />
                  : <Award className="h-6 w-6 text-cert-gold" />}
              </div>
            </div>

            {/* title */}
            <p className="mt-3 text-center font-heading text-[15px] font-bold uppercase tracking-[0.3em] text-cert-ink">
              {t('Certificat', 'Certificate')}
            </p>
            <p className="mt-0.5 text-center text-[8px] font-semibold uppercase tracking-[0.32em] text-cert-gold">
              {t('de réussite', 'of completion')}
            </p>
            <div className="mx-auto mt-2 flex items-center gap-2">
              <span className="h-[1px] w-14 bg-cert-gold" />
              <span className="h-1.5 w-1.5 rotate-45 bg-cert-gold" />
              <span className="h-[1px] w-14 bg-cert-gold" />
            </div>

            {/* statement */}
            <p className="mt-3 text-center text-[9px] italic text-cert-muted">
              {t('Ce certificat atteste que', 'This certificate acknowledges that')}
            </p>
            <p className="mt-2 text-center font-heading text-lg font-bold leading-tight text-cert-ink">{name}</p>
            <div className="mx-auto mt-1.5 h-[1.5px] w-[62%] bg-cert-gold/70" />
            <p className="mt-2.5 text-center text-[9px] text-cert-muted">
              {t('a rempli avec succès les exigences du cours', 'has successfully fulfilled the requirements of the course')}
            </p>
            <p className="mt-1.5 line-clamp-2 text-center font-heading text-[13px] font-bold text-cert-ink">
              “{courseTitle || t('Titre du cours', 'Course title')}”
            </p>

            {/* meta chips */}
            <div className="mt-2.5 flex justify-center gap-1.5">
              <span className="border border-cert-gold-soft bg-cert-paper-warm px-2 py-[3px] text-[7.5px] font-semibold uppercase tracking-wider text-cert-gold">
                {new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="border border-cert-gold-soft bg-cert-paper-warm px-2 py-[3px] text-[7.5px] font-semibold uppercase tracking-wider text-cert-gold">
                {t('Réussi', 'Passed')}
              </span>
            </div>

            {/* outline */}
            {lessons.length > 0 && (
              <div className="mt-4">
                <p className="text-center text-[7px] font-semibold uppercase tracking-[0.3em] text-cert-muted">
                  {t('Programme suivi', 'Course outline')}
                </p>
                <div className="mx-auto mt-1 h-[1px] w-[75%] bg-cert-gold-soft/70" />
                <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-[3px]">
                  {lessons.slice(0, 10).map((l, i) => (
                    <li key={i} className="flex items-center gap-1 truncate text-[7.5px] text-cert-ink-soft">
                      <span className="h-1 w-1 shrink-0 rotate-45 bg-cert-gold" />
                      <span className="truncate">{l.title}</span>
                    </li>
                  ))}
                </ul>
                {lessons.length > 10 && (
                  <p className="mt-1 text-center text-[7px] italic text-cert-muted">
                    + {lessons.length - 10} {t('autres leçons', 'more lessons')}
                  </p>
                )}
              </div>
            )}

            {/* signature + verification */}
            <div className="mt-auto flex flex-col items-center pt-4">
              {design.signature_image_url && (
                <img
                  src={design.signature_image_url}
                  alt={t('Signature', 'Signature')}
                  className="mb-1 h-9 w-9 object-contain"
                  loading="lazy"
                />
              )}
              <div className="h-[1px] w-24 bg-cert-ink-soft/40" />
              <p className="mt-1 text-[7px] font-semibold uppercase tracking-[0.28em] text-cert-muted">
                {design.signature_label || t('Signé par', 'Signed by')}
              </p>
              <p className="mt-0.5 font-heading text-[10px] font-bold text-cert-ink">{footerText}</p>

              <div className="mt-3 h-[1px] w-[80%] bg-cert-gold-soft/70" />
              <span className="mt-2 bg-cert-ink px-3 py-1 text-[7px] font-semibold uppercase tracking-[0.22em] text-cert-paper">
                {t('Certificat n°', 'Certificate No.')} PREVIEW-0000
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <ImageUploader
            value={design.cover_image_url || ''}
            onChange={(url) => onChange({ cover_image_url: url || null })}
            folder="certificates"
            aspectRatio="banner"
            label={t('Bannière', 'Cover image')}
            hint={t('Recommandé : 1000×200 px', 'Recommended: 1000×200 px')}
          />
        </div>
        <div>
          <ImageUploader
            value={design.badge_image_url || ''}
            onChange={(url) => onChange({ badge_image_url: url || null })}
            folder="certificates"
            aspectRatio="square"
            label={t('Badge de certification', 'Certificate badge')}
            hint={t('Recommandé : 180×180 px — par défaut l’avatar de votre plateforme',
                    'Recommended: 180×180 px — defaults to your platform avatar')}
          />
        </div>
        <div>
          <ImageUploader
            value={design.signature_image_url || ''}
            onChange={(url) => onChange({ signature_image_url: url || null })}
            folder="certificates"
            aspectRatio="square"
            label={t('Image de signature', 'Signature image')}
            hint={t('Recommandé : 70×70 px', 'Recommended: 70×70 px')}
          />
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">{t('Signé par', 'Signed by')}</Label>
            <Input
              value={design.signature_label ?? ''}
              placeholder={t('Ex. Directeur pédagogique', 'e.g. Head of training')}
              onChange={(e) => onChange({ signature_label: e.target.value })}
              className="h-9 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">{t('Texte du pied de page', 'Footer text')}</Label>
            <Input
              value={design.footer_text ?? ''}
              placeholder={orgName}
              onChange={(e) => onChange({ footer_text: e.target.value })}
              className="h-9 mt-1"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('Vide = le nom de votre plateforme.', 'Empty = your platform name.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
