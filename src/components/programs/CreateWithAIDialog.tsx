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
import { useCreateProgram, useCreateModule, useCreateLesson } from '@/hooks/usePrograms';
import { queueDeferredCourseLessonImages } from '@/lib/programImageGeneration';
import { Sparkles, BookOpen, HelpCircle, Plus, ImageIcon, Users, GraduationCap, MessageSquare, Palette, BarChart3, Zap, Settings2, Globe, Target } from 'lucide-react';
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
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [courseGoal, setCourseGoal] = useState('teach_skill');
  const [audience, setAudience] = useState('general');
  const [level, setLevel] = useState('intermediate');
  const [teachingStyle, setTeachingStyle] = useState('structured');
  const [tone, setTone] = useState('professional');
  const [contentOrientation, setContentOrientation] = useState('neutral');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [depthLevel, setDepthLevel] = useState('standard');
  const [interactivityLevel, setInteractivityLevel] = useState('medium');

  const standardCost = useActionCost('ai_course_structure', 'standard');
  const premiumCost = useActionCost('ai_course_structure', 'premium');

  const createProgram = useCreateProgram();
  const createModule = useCreateModule();
  const createLesson = useCreateLesson();

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

  const handleCreate = async (generateImagesOverride?: boolean) => {
    if (!prompt.trim() || !currentOrg || !user) return;
    const shouldGenerateImages = generateImagesOverride ?? generateImages;
    setGenerating(true);
    setGenerationError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(isFr ? 'Session expirée. Reconnectez-vous.' : 'Session expired. Please log in again.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300_000);

      let data: any;
      let error: any;
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const resp = await fetch(`${supabaseUrl}/functions/v1/ai-generate-course`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            title: prompt.trim(),
            language: isFr ? 'fr' : 'en',
            tier,
            module_count: depthLevel === 'masterclass' ? 7 : depthLevel === 'detailed' ? 6 : 5,
            generate_images: shouldGenerateImages,
            course_goal: courseGoal,
            audience,
            audience_level: level,
            worldview: contentOrientation,
            pedagogical_style: teachingStyle,
            tone,
            depth_level: depthLevel,
            interactivity_level: interactivityLevel,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        data = await resp.json();
        if (!resp.ok) {
          error = new Error(data?.error || `HTTP ${resp.status}`);
          (error as any).status = resp.status;
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error(isFr ? 'La génération a pris trop de temps. Réessayez.' : 'Generation timed out. Please try again.');
        }
        const msg = fetchErr?.message || '';
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
          throw new Error(
            isFr
              ? 'La connexion au serveur a échoué. Réessayez.'
              : 'Server connection failed. Please retry.'
          );
        }
        throw fetchErr;
      }

      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error);
        (err as any).status = data.status;
        throw err;
      }

      refreshCredits();

      const courseTitle = data?.course_title || prompt.trim().slice(0, 100);
      const courseDescription = data?.course_description || prompt.trim();
      const deferredImageJobs: Array<{ id: string; title: string; imagePrompt: string }> = [];

      const result = await createProgram.mutateAsync({
        organization_id: currentOrg.id,
        title: courseTitle,
        description: courseDescription,
        created_by: user.id,
      });

      if (data?.modules) {
        for (let mi = 0; mi < data.modules.length; mi++) {
          const mod = data.modules[mi];
          const modResult = await createModule.mutateAsync({
            program_id: result.id,
            title: mod.title,
            description: mod.description,
            display_order: mi,
          });
          for (let li = 0; li < (mod.lessons || []).length; li++) {
            const lesson = mod.lessons[li];
            const lessonResult = await createLesson.mutateAsync({
              module_id: modResult.id,
              title: lesson.title,
              content_type: lesson.content_type || 'text',
              content: lesson.content || '',
              duration_minutes: lesson.duration_minutes,
              display_order: li,
              programId: result.id,
            });

            if (shouldGenerateImages && lesson?.image_prompt && lessonResult?.data?.id) {
              deferredImageJobs.push({
                id: lessonResult.data.id,
                title: lesson.title,
                imagePrompt: lesson.image_prompt,
              });
            }
          }
        }

        if (data?.final_assessment?.questions?.length > 0) {
          const assessmentModule = await createModule.mutateAsync({
            program_id: result.id,
            title: data.final_assessment.title || (isFr ? 'Évaluation finale' : 'Final Assessment'),
            description: data.final_assessment.description || '',
            display_order: data.modules.length,
          });

          const quizComments = data.final_assessment.questions
            .map((q: any) => `<!-- QUIZ:${JSON.stringify(q)} -->`)
            .join('\n');

          await createLesson.mutateAsync({
            module_id: assessmentModule.id,
            title: isFr ? 'Évaluation finale' : 'Final Assessment',
            content_type: 'text',
            content: `<h2>${isFr ? '🏆 Évaluation finale' : '🏆 Final Assessment'}</h2><p>${isFr ? 'Testez vos connaissances sur le cours complet.' : 'Test your knowledge of the entire course.'}</p>${quizComments}`,
            duration_minutes: 15,
            display_order: 0,
            programId: result.id,
          });
        }
      }

      if (shouldGenerateImages && deferredImageJobs.length > 0) {
        void queueDeferredCourseLessonImages({
          programId: result.id,
          lessonJobs: deferredImageJobs,
          sessionToken: session.access_token,
          tier,
        }).then(async ({ error: imageError, data: imageData }) => {
          const generatedLessonIds = Array.isArray(imageData?.generated_lesson_ids)
            ? imageData.generated_lesson_ids
            : [];

          if (imageData?.images_generated > 0) {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['program', result.id] }),
              queryClient.invalidateQueries({ queryKey: ['program-modules', result.id] }),
              ...generatedLessonIds.map((lessonId: string) =>
                queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
              ),
            ]);
          }

          if (imageError || imageData?.error) {
            toast({
              title: isFr ? 'Cours créé, mais les images de leçon ont échoué' : 'Course created, but lesson images failed',
              description: isFr ? 'Le contenu du cours est prêt. Vous pouvez relancer les visuels plus tard.' : 'The course content is ready. You can retry the visuals later.',
              variant: 'destructive',
            });
            return;
          }

          if (imageData?.images_generated > 0 && !imageData?.failed) {
            toast({
              title: isFr ? 'Images de leçon générées' : 'Lesson images generated',
              description: isFr
                ? `${imageData.images_generated} visuel(x) ont été ajoutés au cours.`
                : `${imageData.images_generated} visual(s) were added to the course.`,
            });
            return;
          }

          if (imageData?.images_generated > 0) {
            toast({
              title: isFr ? 'Images partiellement générées' : 'Images partially generated',
              description: isFr
                ? `${imageData.images_generated} visuel(x) ajoutés, ${imageData.failed || 0} échec(s).`
                : `${imageData.images_generated} visual(s) added, ${imageData.failed || 0} failed.`,
              variant: 'destructive',
            });
            return;
          }

          toast({
            title: isFr ? 'Cours créé, mais aucune image n’a été ajoutée' : 'Course created, but no images were added',
            description: isFr ? 'Le contenu du cours est prêt, mais les visuels devront être relancés.' : 'The course content is ready, but the visuals will need to be retried.',
            variant: 'destructive',
          });
        }).catch(() => {
          toast({
            title: isFr ? 'Cours créé, mais les images n’ont pas pu être finalisées' : 'Course created, but images could not be finalized',
            description: isFr ? 'Le cours a bien été créé. Les visuels pourront être régénérés plus tard.' : 'The course was created successfully. Visuals can be regenerated later.',
            variant: 'destructive',
          });
        });
      }

      toast({
        title: isFr ? '✅ Cours créé avec l\'IA !' : '✅ Course created with AI!',
        description: shouldGenerateImages
          ? (isFr ? 'Les images des leçons se génèrent maintenant en arrière-plan.' : 'Lesson images are now generating in the background.')
          : undefined,
      });
      onOpenChange(false);
      setPrompt('');
      onCreated(result.id);
    } catch (err: any) {
      const isCreditError = handleAiError(err);
      if (!isCreditError) {
        const errorMsg = err.message || (isFr ? 'Erreur inconnue' : 'Unknown error');
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
          <CourseGenerationLoader />
        ) : generationError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-destructive" />
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
                <Sparkles className="h-3.5 w-3.5" />
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
                <Sparkles className="h-5 w-5 text-primary" />
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
                  <Button type="button" variant={tier === 'standard' ? 'default' : 'outline'} onClick={() => setTier('standard')} className="text-xs">
                    Standard
                    <span className="ml-1 text-[10px] opacity-90">({standardCost ?? 8} {isFr ? 'crédits' : 'credits'})</span>
                  </Button>
                  <Button type="button" variant={tier === 'premium' ? 'default' : 'outline'} onClick={() => setTier('premium')} className="text-xs">
                    Premium
                    <span className="ml-1 text-[10px] opacity-90">({premiumCost ?? 15} {isFr ? 'crédits' : 'credits'})</span>
                  </Button>
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
                    <SelectItem value="creators">{isFr ? '✨ Créateurs' : '✨ Creators'}</SelectItem>
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

              {/* 7. Content Orientation (VISIBLE, not hidden) */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Orientation du contenu' : 'Content orientation'}
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
                <Button onClick={handleCreate} disabled={!prompt.trim()} className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
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
