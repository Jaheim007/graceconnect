import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUploader } from '@/components/ui/FileUploader';
import { Loader2, XCircle, ImagePlus, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RejectPreset {
  id: string;
  group: string;
  fr: string;
  en: string;
}

/** Canonical rejection motives — bilingual, actionable (tells them what to redo). */
export const REJECT_PRESETS: RejectPreset[] = [
  // Pièce d'identité
  { id: 'doc_blurry', group: 'Pièce d\'identité', fr: "La photo de la pièce d'identité est floue ou illisible. Reprenez-la à plat, bien éclairée, sans reflet.", en: 'The ID photo is blurry or unreadable. Retake it flat, well lit, without glare.' },
  { id: 'doc_cropped', group: 'Pièce d\'identité', fr: "Le document est coupé : les quatre coins doivent être visibles.", en: 'The document is cropped: all four corners must be visible.' },
  { id: 'doc_expired', group: 'Pièce d\'identité', fr: "La pièce d'identité est expirée. Envoyez un document en cours de validité.", en: 'The ID document has expired. Upload a currently valid document.' },
  { id: 'doc_wrong_type', group: 'Pièce d\'identité', fr: "Le type de document envoyé n'est pas accepté. Utilisez une CNI, un passeport ou un permis de conduire.", en: 'The document type is not accepted. Use a national ID, passport or driver\'s license.' },
  { id: 'doc_back_missing', group: 'Pièce d\'identité', fr: "Le verso du document manque. Envoyez le recto ET le verso.", en: 'The back of the document is missing. Upload both front and back.' },
  // Selfie
  { id: 'selfie_missing', group: 'Selfie', fr: "Le selfie est manquant. Ajoutez une photo récente de vous tenant votre pièce d'identité.", en: 'The selfie is missing. Add a recent photo of you holding your ID document.' },
  { id: 'selfie_quality', group: 'Selfie', fr: "Le selfie est trop sombre ou flou. Reprenez-le en pleine lumière, visage entièrement visible, sans lunettes ni casquette.", en: 'The selfie is too dark or blurry. Retake it in good light, face fully visible, no glasses or cap.' },
  { id: 'selfie_mismatch', group: 'Selfie', fr: "Le visage du selfie ne correspond pas à la photo de la pièce d'identité.", en: 'The face on the selfie does not match the photo on the ID document.' },
  { id: 'selfie_id_unreadable', group: 'Selfie', fr: "Sur le selfie, la pièce d'identité n'est pas lisible. Tenez-la bien à plat près de votre visage.", en: 'On the selfie, the ID document is not readable. Hold it flat next to your face.' },
  // Informations
  { id: 'name_mismatch', group: 'Informations', fr: "Le nom déclaré ne correspond pas au nom figurant sur la pièce d'identité.", en: 'The declared name does not match the name on the ID document.' },
  { id: 'info_incomplete', group: 'Informations', fr: "Des informations obligatoires sont incomplètes ou incorrectes.", en: 'Some required information is incomplete or incorrect.' },
  { id: 'payout_mismatch', group: 'Informations', fr: "Le compte de paiement n'est pas au même nom que la personne vérifiée.", en: 'The payout account is not in the same name as the verified person.' },
  // Organisation (KYB)
  { id: 'org_doc_missing', group: 'Organisation (KYB)', fr: "Le document d'enregistrement légal de l'organisation est manquant ou illisible.", en: 'The legal registration document of the organization is missing or unreadable.' },
  { id: 'org_statutes_missing', group: 'Organisation (KYB)', fr: "Les statuts de l'organisation sont manquants.", en: 'The organization\'s bylaws/statutes are missing.' },
  { id: 'org_name_mismatch', group: 'Organisation (KYB)', fr: "Le nom de l'organisation ne correspond pas au document officiel fourni.", en: 'The organization name does not match the official document provided.' },
  { id: 'org_rep_proof', group: 'Organisation (KYB)', fr: "Rien ne prouve que vous êtes autorisé à représenter cette organisation.", en: 'There is no proof that you are authorized to represent this organization.' },
  // Fraude
  { id: 'suspected_edit', group: 'Autre', fr: "Le document semble modifié ou n'est pas un original.", en: 'The document appears edited or is not an original.' },
  { id: 'duplicate', group: 'Autre', fr: "Ces documents ont déjà été utilisés pour un autre compte.", en: 'These documents were already used for another account.' },
];

const GROUPS = Array.from(new Set(REJECT_PRESETS.map(p => p.group)));

export function buildRejectionReason(ids: string[], note: string, images: string[]): string {
  const picked = REJECT_PRESETS.filter(p => ids.includes(p.id));
  const fr = picked.map(p => `• ${p.fr}`);
  const en = picked.map(p => `• ${p.en}`);
  const parts: string[] = [];
  if (fr.length) parts.push(fr.join('\n'));
  if (note.trim()) parts.push(note.trim());
  if (en.length) parts.push(`[EN]\n${en.join('\n')}`);
  if (images.length) parts.push(images.join('\n'));
  return parts.join('\n\n');
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orgName: string;
  orgId: string;
  submitting?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
}

export default function KycRejectDialog({ open, onOpenChange, orgName, orgId, submitting, onConfirm }: Props) {
  const [ids, setIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [pendingImage, setPendingImage] = useState('');

  const reason = useMemo(() => buildRejectionReason(ids, note, images), [ids, note, images]);
  const canSubmit = (ids.length > 0 || note.trim().length >= 5) && !submitting;

  const toggle = (id: string) =>
    setIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const addImage = (url: string) => {
    if (!url) return;
    setImages(prev => (prev.includes(url) ? prev : [...prev, url]));
    setPendingImage('');
  };

  const reset = () => { setIds([]); setNote(''); setImages([]); setPendingImage(''); };

  return (
    <Dialog
      open={open}
      onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}
    >
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <XCircle className="h-4 w-4" />
            </span>
            Refuser la vérification
          </DialogTitle>
          <DialogDescription>
            {orgName} — cochez les motifs exacts. Ce texte est envoyé tel quel par e-mail et affiché
            dans l'assistant de vérification pour qu'ils sachent quoi corriger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {GROUPS.map(group => (
            <div key={group} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
              <div className="grid gap-2">
                {REJECT_PRESETS.filter(p => p.group === group).map(p => {
                  const active = ids.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors',
                        active ? 'border-destructive/40 bg-destructive/5' : 'border-border hover:bg-accent/40',
                      )}
                    >
                      <Checkbox checked={active} onCheckedChange={() => toggle(p.id)} className="mt-0.5" />
                      <span className="leading-snug">{p.fr}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="kyc-reject-note">Précisions (optionnel)</Label>
            <Textarea
              id="kyc-reject-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Ex : la date de naissance sur la CNI ne correspond pas au profil."
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              Captures d'écran / annotations (optionnel)
            </Label>
            <p className="text-xs text-muted-foreground">
              Ajoutez une image entourant le problème — elle apparaîtra dans l'e-mail de refus.
            </p>
            <FileUploader
              value={pendingImage}
              onChange={addImage}
              bucket="org-uploads"
              folder={`kyc-reviews/${orgId}`}
              accept="image/*"
              label="Image"
              hint="PNG, JPG ou WebP"
            />
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map(url => (
                  <div key={url} className="group relative overflow-hidden rounded-lg border border-border">
                    <img src={url} alt="Capture annotée du problème de vérification" className="h-20 w-full object-cover" />
                    <div className="absolute inset-0 hidden items-center justify-center gap-1 bg-background/80 group-hover:flex">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(url, '_blank')}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setImages(prev => prev.filter(u => u !== url))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Aperçu du message reçu</Label>
            <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              {reason || 'Sélectionnez au moins un motif…'}
            </pre>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button variant="destructive" disabled={!canSubmit} onClick={() => onConfirm(reason)}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            Refuser et notifier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
