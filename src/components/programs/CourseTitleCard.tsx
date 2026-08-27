import { useServerFn } from '@tanstack/react-start';
import { aiSuggestTitles, aiGenerateDescription } from '@/lib/ai/textHelpers.functions';
/**
 * Title + description for a course, with optional AI help.
 *
 * Same idea as the book flow: the creator can write it himself, or ask the AI
 * for 3 title ideas and a sales description, then edit freely. AI uses credits.
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { Loader2, Wand2, Type, Check } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  tier?: 'standard' | 'premium';
  price?: number;
  currency?: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}
/** Ready-made tones so the creator picks in one tap instead of writing. */
const TONES = [
  { fr: 'Inspirant', en: 'Inspiring' },
  { fr: 'Professionnel', en: 'Professional' },
  { fr: 'Simple et direct', en: 'Simple and direct' },
  { fr: 'Chaleureux', en: 'Warm' },
  { fr: 'Spirituel', en: 'Spiritual' },
  { fr: 'Vendeur (urgence)', en: 'Persuasive (urgency)' },
];


/** Turn the AI's HTML description into something a plain textarea can hold. */
function htmlToText(html: string) {
  return html
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(p|li|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function CourseTitleCard({
  title, description, tier = 'standard', price = 0, currency = 'XOF',
  onTitleChange, onDescriptionChange,
}: Props) {
  const { locale } = useI18n();
  const suggestTitlesFn = useServerFn(aiSuggestTitles);
  const generateDescriptionFn = useServerFn(aiGenerateDescription);
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();

  const [titleIdeas, setTitleIdeas] = useState<string[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);
  // The AI should not invent the positioning: the creator says who he sells to
  // and how he wants to sound before anything is generated.
  const [briefOpen, setBriefOpen] = useState(false);
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [notes, setNotes] = useState('');


  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;
  };

  const suggestTitles = async () => {
    if (!title.trim() && !description.trim()) {
      toast({ title: isFr ? 'Écrivez d’abord le sujet du cours' : 'Write the course topic first' });
      return;
    }
    setLoadingTitles(true);
    try {
      const data: any = await suggestTitlesFn({
        data: { topic: title || description.slice(0, 200), style: 'course', language: locale, tier },
      });
      const list = ((data as any)?.titles || []) as string[];
      if (!list.length) throw new Error(isFr ? 'Aucune idée générée' : 'No ideas generated');
      setTitleIdeas(list);
      refreshCredits();
    } catch (e: any) {
      if (!handleAiError(e)) {
        toast({ title: isFr ? 'Génération échouée' : 'Generation failed', description: e?.message, variant: 'destructive' });
      }
    } finally {
      setLoadingTitles(false);
    }
  };

  const generateDescription = async () => {
    if (!title.trim() || title.trim().length < 3) {
      toast({ title: isFr ? 'Ajoutez d’abord un titre' : 'Add a title first' });
      return;
    }
    // First click opens the brief: never generate blind.
    if (!briefOpen && !audience.trim() && !tone.trim()) {
      setBriefOpen(true);
      return;
    }
    setLoadingDesc(true);
    try {
      const data: any = await generateDescriptionFn({
        data: {
          title, product_type: 'course', price, currency, language: locale, tier,
          audience: audience.trim() || undefined,
          tone: tone.trim() || undefined,
          extra_notes: notes.trim() || undefined,
          existing_description: description || undefined,
        },
      });

      const raw = (data as any)?.description || (data as any)?.html || '';
      if (!raw) throw new Error(isFr ? 'Aucune description générée' : 'No description generated');
      onDescriptionChange(htmlToText(String(raw)));
      refreshCredits();
      toast({ title: isFr ? 'Description générée' : 'Description generated' });
    } catch (e: any) {
      if (!handleAiError(e)) {
        toast({ title: isFr ? 'Génération échouée' : 'Generation failed', description: e?.message, variant: 'destructive' });
      }
    } finally {
      setLoadingDesc(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">{isFr ? 'Titre et description' : 'Title and description'}</p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {isFr
            ? 'C’est ce que le visiteur lit avant d’acheter. Écrivez-le vous-même ou laissez l’IA proposer, puis modifiez librement.'
            : 'This is what a visitor reads before buying. Write it yourself or let the AI propose, then edit freely.'}
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label className="text-[12px]">{isFr ? 'Titre du cours' : 'Course title'}</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={isFr ? 'Ex. Devenir un leader dans le Royaume' : 'e.g. Become a leader in the Kingdom'}
            className="h-9 flex-1 min-w-[220px]"
          />
          <Button size="sm" variant="outline" className="gap-1.5 h-9" onClick={suggestTitles} disabled={loadingTitles}>
            {loadingTitles ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {isFr ? '3 idées avec l’IA' : '3 ideas with AI'}
          </Button>
        </div>

        {titleIdeas.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-2.5">
            <p className="text-[11px] text-muted-foreground">
              {isFr ? 'Choisissez une idée (vous pourrez la modifier) :' : 'Pick an idea (you can still edit it):'}
            </p>
            {titleIdeas.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { onTitleChange(t); setTitleIdeas([]); }}
                className="flex w-full items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left text-[12px] hover:bg-muted/60"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{t}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-[12px]">{isFr ? 'Description' : 'Description'}</Label>
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={generateDescription} disabled={loadingDesc}>
            {loadingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {isFr ? 'Générer avec l’IA' : 'Generate with AI'}
          </Button>
        </div>

        {/* Brief: audience + tone, asked BEFORE generating */}
        {briefOpen && (
          <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 p-2.5">
            <p className="text-[11px] text-muted-foreground">
              {isFr
                ? 'Dites à l’IA à qui vous vendez et sur quel ton écrire. Elle écrira pour ces personnes.'
                : 'Tell the AI who you are selling to and how to sound. It will write for those people.'}
            </p>
            <div className="space-y-1.5">
              <Label className="text-[11px]">{isFr ? 'À quel public vendez-vous ?' : 'Who are you selling to?'}</Label>
              <Input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder={isFr
                  ? 'Ex. jeunes leaders d’église de 20-35 ans, débutants'
                  : 'e.g. young church leaders aged 20-35, beginners'}
                className="h-9 text-[12px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">{isFr ? 'Quel ton voulez-vous ?' : 'Which tone do you want?'}</Label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.en}
                    type="button"
                    onClick={() => setTone(isFr ? t.fr : t.en)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] ${
                      tone === (isFr ? t.fr : t.en)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:bg-muted/60'
                    }`}
                  >
                    {isFr ? t.fr : t.en}
                  </button>
                ))}
              </div>
              <Input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder={isFr ? 'Ou écrivez votre ton…' : 'Or type your own tone…'}
                className="h-9 text-[12px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">{isFr ? 'Précisions (optionnel)' : 'Anything else (optional)'}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={isFr
                  ? 'Ex. insister sur le certificat, mentionner le paiement Mobile Money…'
                  : 'e.g. highlight the certificate, mention Mobile Money payment…'}
                className="text-[12px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5 h-8" onClick={generateDescription} disabled={loadingDesc}>
                {loadingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {isFr ? 'Écrire la description' : 'Write the description'}
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setBriefOpen(false)}>
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={7}
          placeholder={isFr
            ? 'Ce que l’apprenant va apprendre, pour qui c’est fait, ce qu’il obtient à la fin…'
            : 'What the learner will learn, who it is for, what they get at the end…'}
          className="text-[12px] leading-relaxed"
        />
        <p className="text-[11px] text-muted-foreground">
          {isFr
            ? 'Écrire soi-même est gratuit. La génération par l’IA utilise des crédits.'
            : 'Writing it yourself is free. AI generation uses credits.'}
        </p>
      </div>
    </div>
  );
}
