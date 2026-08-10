import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { COURSE_LANGUAGES } from '@/hooks/useDuplicateCourse';
import { useActionCost } from '@/hooks/useCredits';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  /** Current language of the course, used to pre-exclude it from the picker. */
  sourceLanguage?: string | null;
  loading?: boolean;
  onConfirm: (opts: { translate: boolean; targetLanguage: string | null }) => Promise<void>;
}

export function DuplicateCourseDialog({
  open, onOpenChange, courseTitle, sourceLanguage, loading, onConfirm,
}: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [translate, setTranslate] = useState(true);
  const [lang, setLang] = useState<string | null>(null);
  const cost = useActionCost('translate_course');

  const srcCode = (sourceLanguage || '').slice(0, 2).toLowerCase();
  const srcLang = COURSE_LANGUAGES.find((l) => l.code === srcCode) || null;
  const languages = COURSE_LANGUAGES;


  const canConfirm = !loading && (!translate || !!lang);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    await onConfirm({ translate, targetLanguage: translate ? lang : null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-primary" />
            {isFr ? 'Dupliquer le cours' : 'Duplicate course'}
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{courseTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-xs">
            <span className="text-muted-foreground">{isFr ? 'Langue actuelle' : 'Current language'}</span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-semibold">
              <span className="text-base leading-none">{srcLang?.flag ?? '🌐'}</span>
              {srcLang ? (isFr ? srcLang.fr : srcLang.en) : (isFr ? 'Non définie' : 'Not set')}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <Languages className="h-3.5 w-3.5 text-primary" />
                {isFr ? 'Traduire dans une autre langue' : 'Translate into another language'}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {isFr
                  ? 'Leçons, slides, quiz et flashcards sont traduits par l’IA.'
                  : 'Lessons, slides, quizzes and flashcards are translated by AI.'}
              </p>
            </div>
            <Switch checked={translate} onCheckedChange={setTranslate} disabled={loading} />
          </div>

          {translate && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {isFr ? 'Langue cible' : 'Target language'}
              </Label>
              <div className="grid max-h-[42vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                {languages.map((l) => {
                  const isSource = l.code === srcCode;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      disabled={loading || isSource}
                      onClick={() => setLang(l.code)}
                      title={isSource ? (isFr ? 'Langue actuelle du cours' : 'Current course language') : undefined}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all',
                        isSource
                          ? 'cursor-not-allowed border-dashed border-border/60 text-muted-foreground opacity-60'
                          : lang === l.code
                            ? 'border-primary bg-primary/10 font-semibold'
                            : 'border-border hover:bg-muted/50',
                      )}
                    >
                      <span className="text-base leading-none">{l.flag}</span>
                      <span className="truncate">{isFr ? l.fr : l.en}</span>
                      {isSource && (
                        <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wide">
                          {isFr ? 'actuelle' : 'current'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {cost != null && (
                <p className="text-[11px] text-muted-foreground">
                  {isFr ? 'Coût estimé :' : 'Estimated cost:'}{' '}
                  <Badge variant="secondary" className="text-[10px]">{cost} {isFr ? 'crédits' : 'credits'}</Badge>
                </p>
              )}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            {isFr
              ? 'La copie est créée en brouillon non publié. Le cours original reste intact.'
              : 'The copy is created as an unpublished draft. The original course stays untouched.'}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {isFr ? 'Annuler' : 'Cancel'}
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            {loading
              ? (isFr ? 'Duplication…' : 'Duplicating…')
              : translate
                ? (isFr ? 'Dupliquer & traduire' : 'Duplicate & translate')
                : (isFr ? 'Dupliquer' : 'Duplicate')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
