import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { useActionCost } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useStartCourseDraft } from '@/hooks/useCourseDraft';
import { draftErrorMessage } from '@/lib/courseDraftErrors';
import { Zap, BookOpen, HelpCircle, Plus, ImageIcon, Users, GraduationCap, MessageSquare, Palette, BarChart3, Settings2, Globe, Target, AlertTriangle, Wand2 } from 'lucide-react';
import { CourseGenerationLoader } from './CourseGenerationLoader';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const SUGGESTIONS_FR = [
  { icon: BookOpen, text: 'Créer un cours de 10 minutes pour former le personnel au service client' },
  { icon: HelpCircle, text: 'Créer un quiz de 20 questions sur la sécurité au travail' },
  { icon: BookOpen, text: 'Créer un cours de 5 leçons sur le marketing digital' },
  { icon: HelpCircle, text: 'Créer un quiz de 5 minutes sur les réglementations alimentaires' },
  { icon: BookOpen, text: 'Négociation et influence dans le leadership' },
  { icon: BookOpen, text: 'Formation sur les bases de la comptabilité pour entrepreneurs' },
];

const SUGGESTIONS_EN = [
  { icon: BookOpen, text: 'Create a 10-minute course to train hotel staff on customer service etiquette' },
  { icon: HelpCircle, text: 'Create a 20-question quiz on machine safety in factories and warehouses' },
  { icon: BookOpen, text: 'Create a 2-lesson course about scaffolding safety' },
  { icon: HelpCircle, text: 'Create a 5-minute quiz on food regulations' },
  { icon: BookOpen, text: 'Negotiation and influence in leadership' },
  { icon: BookOpen, text: 'Introduction to financial literacy for small business owners' },
];

type AITier = 'standard' | 'premium';

const COURSE_GOALS = [
  { value: 'sell', emoji: '💰', labelFr: 'Vendre un produit ou service', labelEn: 'Sell a product or service' },
  { value: 'teach_skill', emoji: '🎓', labelFr: 'Enseigner une compétence', labelEn: 'Teach a skill' },
  { value: 'train_team', emoji: '🏢', labelFr: 'Former une équipe', labelEn: 'Train a team' },
  { value: 'educate', emoji: '📢', labelFr: 'Éduquer un public', labelEn: 'Educate an audience' },
  { value: 'faith', emoji: '✝️', labelFr: 'Enseigner la foi / spiritualité', labelEn: 'Teach faith or spirituality' },
  { value: 'authority', emoji: '🚀', labelFr: 'Bâtir son autorité / marque', labelEn: 'Build authority / personal brand' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (programId: string) => void;
}

export function CreateWithAIDialog({ open, onOpenChange, onCreated }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleAiError, refreshCredits } = useCreditGuard();
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState('');
  const [tier, setTier] = useState<AITier>('standard');
  const [generateImages, setGenerateImages] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<'generating' | 'saving' | 'done'>('generating');
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [courseGoal, setCourseGoal] = useState('teach_skill');
  const [audience, setAudience] = useState('general');
  const [level, setLevel] = useState('intermediate');
  const [teachingStyle, setTeachingStyle] = useState('structured');
  const [tone, setTone] = useState('professional');
  const [contentOrientation, setContentOrientation] = useState('neutral');
  const [contentLanguage, setContentLanguage] = useState(isFr ? 'fr' : 'en');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [depthLevel, setDepthLevel] = useState('standard');
  const [interactivityLevel, setInteractivityLevel] = useState('medium');

  const standardCost = useActionCost('ai_course_structure', 'standard');
  const premiumCost = useActionCost('ai_course_structure', 'premium');

  const navigate = useNavigate();
  const startDraft = useStartCourseDraft();

  const suggestions = isFr ? SUGGESTIONS_FR : SUGGESTIONS_EN;

  // Auto-set content orientation when faith goal is selected
  const handleGoalChange = (goal: string) => {
    setCourseGoal(goal);
    if (goal === 'faith' && contentOrientation === 'neutral') {
      setContentOrientation('christian');
    } else if (goal !== 'faith' && contentOrientation !== 'neutral') {
      // Don't force reset — user may have intentionally chosen
    }
  };

  const handleCreate = async (_generateImagesOverride?: boolean) => {
    if (!prompt.trim() || !currentOrg || !user) return;
    setGenerating(true);
    setGenerationPhase('generating');
    setGenerationError(null);
    try {
      // The pipeline produces a REVIEWABLE DRAFT; nothing is written to the
      // live course tables until the admin publishes it from the review screen.
      const result = await startDraft.mutateAsync({
        org_id: currentOrg.id,
        source: 'prompt',
        prompt: [
          prompt.trim(),
          courseGoal ? `Goal: ${courseGoal}` : '',
          audience ? `Audience: ${audience}` : '',
          level ? `Level: ${level}` : '',
          teachingStyle ? `Teaching style: ${teachingStyle}` : '',
          tone ? `Tone: ${tone}` : '',
          depthLevel ? `Depth: ${depthLevel}` : '',
          contentOrientation ? `Worldview: ${contentOrientation}` : '',
        ].filter(Boolean).join('\n'),
        title: prompt.trim().slice(0, 100),
        language: contentLanguage,
        tier,
      });

      refreshCredits();
      onOpenChange(false);
      setPrompt('');
      setGenerating(false);
      navigate(`/admin/programs/draft/${result.project_id}`);
      return;
    } catch (err: any) {
      const isCreditError = handleAiError(err);
      if (!isCreditError) {
        const errorMsg = draftErrorMessage(err, isFr);
        setGenerationError(errorMsg);
        toast({ title: isFr ? 'Erreur' : 'Error', description: errorMsg, variant: 'destructive' });
      }
    } finally {
      setGenerating(false);
    }
  };

  const selectedCost = tier === 'premium' ? premiumCost : standardCost;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!generating) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" hideCloseButton={generating}>
        {generating ? (
          <CourseGenerationLoader phase={generationPhase} mode="ai" />
        ) : generationError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">{isFr ? 'La génération a échoué' : 'Generation failed'}</p>
              <p className="text-xs text-muted-foreground max-w-sm">{generationError}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setGenerationError(null); onOpenChange(false); }}>
                {isFr ? 'Fermer' : 'Close'}
              </Button>
              <Button onClick={() => { setGenerationError(null); handleCreate(); }} className="gap-1.5">
                
                {isFr ? 'Réessayer' : 'Retry'}
              </Button>
              {generateImages && (
                <Button variant="secondary" onClick={() => { setGenerationError(null); setGenerateImages(false); void handleCreate(false); }} className="gap-1.5 text-xs">
                  {isFr ? 'Réessayer sans images' : 'Retry without images'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary shrink-0" />
                {isFr ? 'Créer avec l\'IA' : 'Create with AI'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {isFr
                  ? 'L\'IA génère la structure ET le contenu complet de chaque leçon.'
                  : 'AI generates the structure AND full content for each lesson.'}
              </p>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* 1. Course idea */}
              <Textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={isFr ? 'Décrivez ce que vous souhaitez créer...' : 'Describe what you\'d like to create...'}
                rows={4}
                className="resize-none"
              />

              {/* Suggestion chips */}
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(s.text)}
                      className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-left transition-colors group"
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">{s.text}</span>
                      <Plus className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-0.5 ml-auto" />
                    </button>
                  );
                })}
              </div>

              {/* 2. Course Goal (NEW PRIMARY FIELD) */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Objectif du cours' : 'Course goal'}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {COURSE_GOALS.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => handleGoalChange(g.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-all ${
                        courseGoal === g.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <span>{g.emoji}</span>
                      <span className="leading-tight">{isFr ? g.labelFr : g.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier selection */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{isFr ? 'Type de génération IA' : 'AI generation type'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTier('standard')}
                    className={`rounded-xl border p-3 text-left transition ${tier === 'standard' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <p className="text-xs font-semibold">Standard <span className="font-normal text-muted-foreground">· {standardCost ?? 8} {isFr ? 'crédits' : 'credits'}</span></p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      {isFr
                        ? 'Jusqu’à 10 leçons · 4 à 7 slides · 2 quiz · images sur les 4 premières leçons'
                        : 'Up to 10 lessons · 4-7 slides · 2 quizzes · images on the first 4 lessons'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTier('premium')}
                    className={`rounded-xl border p-3 text-left transition ${tier === 'premium' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <p className="text-xs font-semibold">Premium <span className="font-normal text-muted-foreground">· {premiumCost ?? 15} {isFr ? 'crédits' : 'credits'}</span></p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      {isFr
                        ? 'Jusqu’à 16 leçons · 7 à 10 slides · textes 2x plus développés · 4 quiz · une image par leçon · modèle IA avancé'
                        : 'Up to 16 lessons · 7-10 slides · 2x longer bodies · 4 quizzes · an image per lesson · advanced AI model'}
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Audience (WHO) */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Public cible' : 'Target audience'}
                </p>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{isFr ? '🌍 Grand public' : '🌍 General public'}</SelectItem>
                    <SelectItem value="students">{isFr ? '🎓 Étudiants' : '🎓 Students'}</SelectItem>
                    <SelectItem value="professionals">{isFr ? '💼 Professionnels' : '💼 Professionals'}</SelectItem>
                    <SelectItem value="entrepreneurs">{isFr ? '🚀 Entrepreneurs' : '🚀 Entrepreneurs'}</SelectItem>
                    <SelectItem value="teams">{isFr ? '👥 Équipes / Employés' : '👥 Teams / Employees'}</SelectItem>
                    <SelectItem value="creators">{isFr ? 'Créateurs' : 'Creators'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Level + 5. Teaching Style */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Niveau' : 'Level'}
                  </p>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{isFr ? '🌱 Débutant' : '🌱 Beginner'}</SelectItem>
                      <SelectItem value="intermediate">{isFr ? '📚 Intermédiaire' : '📚 Intermediate'}</SelectItem>
                      <SelectItem value="advanced">{isFr ? '🎯 Avancé' : '🎯 Advanced'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Style pédagogique' : 'Teaching style'}
                  </p>
                  <Select value={teachingStyle} onValueChange={setTeachingStyle}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="structured">{isFr ? '📐 Cours structuré' : '📐 Structured course'}</SelectItem>
                      <SelectItem value="practical">{isFr ? '🛠️ Cours pratique' : '🛠️ Practical course'}</SelectItem>
                      <SelectItem value="storytelling">{isFr ? '📖 Basé sur des cas' : '📖 Story-based'}</SelectItem>
                      <SelectItem value="interactive">{isFr ? '🎮 Cours interactif' : '🎮 Interactive course'}</SelectItem>
                      <SelectItem value="corporate">{isFr ? '🏢 Formation entreprise' : '🏢 Corporate training'}</SelectItem>
                      <SelectItem value="fast">{isFr ? '⚡ Apprentissage rapide' : '⚡ Fast learning'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 6. Tone */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Ton' : 'Tone'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'professional', label: isFr ? 'Professionnel' : 'Professional' },
                    { value: 'friendly', label: isFr ? 'Amical' : 'Friendly' },
                    { value: 'motivational', label: isFr ? 'Motivant' : 'Motivational' },
                    { value: 'academic', label: isFr ? 'Académique' : 'Academic' },
                    { value: 'conversational', label: isFr ? 'Conversationnel' : 'Conversational' },
                  ].map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        tone === t.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Content Language */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Langue du contenu' : 'Content language'}
                </p>
                <Select value={contentLanguage} onValueChange={setContentLanguage}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="pt">🇧🇷 Português</SelectItem>
                    <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                    <SelectItem value="sw">🇰🇪 Kiswahili</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 8. Content Orientation */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Orientation du contenu' : 'Content orientation'}
                </p>
                <Select value={contentOrientation} onValueChange={setContentOrientation}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">{isFr ? '🌍 Neutre / Séculier' : '🌍 Neutral / Secular'}</SelectItem>
                    <SelectItem value="christian">{isFr ? '✝️ Chrétien' : '✝️ Christian'}</SelectItem>
                    <SelectItem value="islamic">{isFr ? '☪️ Islamique' : '☪️ Islamic'}</SelectItem>
                    <SelectItem value="interfaith">{isFr ? '🕊️ Interconfessionnel' : '🕊️ Interfaith'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors w-full"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    {isFr ? 'Options avancées' : 'Advanced options'}
                    <span className={`ml-auto transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Depth */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" /> {isFr ? 'Profondeur' : 'Depth'}
                        </p>
                        <Select value={depthLevel} onValueChange={setDepthLevel}>
                          <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lightweight">{isFr ? '⚡ Léger' : '⚡ Lightweight'}</SelectItem>
                            <SelectItem value="standard">{isFr ? '📘 Standard' : '📘 Standard'}</SelectItem>
                            <SelectItem value="detailed">{isFr ? '📚 Détaillé' : '📚 Detailed'}</SelectItem>
                            <SelectItem value="masterclass">{isFr ? '🏆 Masterclass' : '🏆 Masterclass'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Interactivity */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3" /> {isFr ? 'Interactivité' : 'Interactivity'}
                        </p>
                        <Select value={interactivityLevel} onValueChange={setInteractivityLevel}>
                          <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{isFr ? '📖 Faible' : '📖 Low'}</SelectItem>
                            <SelectItem value="medium">{isFr ? '⚡ Moyen' : '⚡ Medium'}</SelectItem>
                            <SelectItem value="high">{isFr ? '🎮 Élevé' : '🎮 High'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Image generation option */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium">{isFr ? 'Générer des images par leçon' : 'Generate images per lesson'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isFr ? 'Images basées sur le contenu (crédits additionnels)' : 'Images based on content (additional credits)'}
                    </p>
                  </div>
                </div>
                <Switch checked={generateImages} onCheckedChange={setGenerateImages} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-muted-foreground">
                {isFr ? 'Coût estimé' : 'Estimated cost'}: <span className="font-medium text-foreground">{selectedCost ?? (tier === 'premium' ? 15 : 8)} {isFr ? 'crédits' : 'credits'}</span>
                {generateImages && <span className="text-primary"> + {isFr ? 'images' : 'images'}</span>}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {isFr ? 'Annuler' : 'Cancel'}
                </Button>
                <Button onClick={() => void handleCreate()} disabled={!prompt.trim()} className="gap-1.5">
                  
                  {isFr ? 'Créer' : 'Create'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
