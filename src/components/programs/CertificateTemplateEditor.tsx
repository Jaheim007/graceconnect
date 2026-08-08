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
import { Award } from 'lucide-react';

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
      sessionStorage.setItem('certificate-preview', JSON.stringify({
        learner_name: name,
        course_title: courseTitle || t('Titre du cours', 'Course title'),
        organization_name: orgName,
        organization_logo_url: orgLogo || null,
        certificate_number: 'PREVIEW-0000',
        issued_at: new Date().toISOString(),
        program_cover_url: design.cover_image_url || null,
        lesson_titles: lessons.map((l) => l.title),
        certificate_design: design,
      }));
    } catch { /* sessionStorage unavailable — page falls back to "not found" */ }
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


      {/* Live preview */}
      <div className="mx-auto w-full max-w-[420px] rounded-xl border border-border overflow-hidden bg-background aspect-[1414/2000] flex flex-col">
        {design.cover_image_url ? (
          <img
            src={design.cover_image_url}
            alt={t('Bannière du certificat', 'Certificate cover')}
            className="w-full h-[88px] object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-[88px] bg-gradient-to-r from-primary/25 via-primary/10 to-transparent" />
        )}

        <div className="flex-1 flex flex-col px-6 pb-6 -mt-8 text-center space-y-3 overflow-hidden">
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-background bg-muted overflow-hidden grid place-items-center">
            {badge
              ? <img src={badge} alt={t('Badge', 'Badge')} className="h-full w-full object-cover" loading="lazy" />
              : <Award className="h-6 w-6 text-muted-foreground" />}
          </div>

          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {t('Certificat de réussite', 'Certificate of completion')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('Ce certificat atteste que', 'This certificate acknowledges that')}
          </p>
          <p className="font-heading text-xl font-bold">{name}</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {t('a rempli avec succès les exigences du cours', 'has successfully fulfilled the requirements of the course')}
            {' '}<span className="font-semibold text-foreground">{courseTitle || t('Titre du cours', 'Course title')}</span>
            {' · '}{new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {lessons.length > 0 && (
            <div className="text-left mx-auto max-w-md pt-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {t('Programme suivi', 'Course outline')}
              </p>
              <ul className="grid gap-0.5">
                {lessons.slice(0, 6).map((l, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground truncate">• {l.title}</li>
                ))}
                {lessons.length > 6 && (
                  <li className="text-[11px] text-muted-foreground">
                    + {lessons.length - 6} {t('autres', 'more')}
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-auto pt-3 flex flex-col items-center gap-1">
            {design.signature_image_url && (
              <img
                src={design.signature_image_url}
                alt={t('Signature', 'Signature')}
                className="h-10 w-10 object-contain"
                loading="lazy"
              />
            )}
            <p className="text-[11px] font-medium">{design.signature_label || t('Signé par', 'Signed by')}</p>
            <p className="text-[11px] text-muted-foreground">{footerText}</p>
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
