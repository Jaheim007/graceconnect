import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, BookOpen, Baby, Palette, GraduationCap, Church,
  Megaphone, ArrowRight, ArrowLeft, Check, Loader2, Wand2
} from 'lucide-react';

type ProjectType = 'ebook' | 'kids_book' | 'coloring_book' | 'course_pack' | 'sermon_pack' | 'bible_pack' | 'marketing_pack';

const TYPE_OPTIONS: { value: ProjectType; label: string; desc: string; icon: typeof BookOpen }[] = [
  { value: 'ebook', label: 'Ebook', desc: 'Livre numérique professionnel', icon: BookOpen },
  { value: 'kids_book', label: 'Livre Enfant', desc: 'Livre illustré pour enfants', icon: Baby },
  { value: 'coloring_book', label: 'Cahier de Coloriage', desc: 'Pages à colorier thématiques', icon: Palette },
  { value: 'course_pack', label: 'Cours / Formation', desc: 'Modules et leçons structurés', icon: GraduationCap },
  { value: 'sermon_pack', label: 'Pack Prédication', desc: 'Sermons structurés avec références', icon: Church },
  { value: 'bible_pack', label: 'Pack Bible', desc: 'Plans de lecture et études', icon: BookOpen },
  { value: 'marketing_pack', label: 'Pack Marketing', desc: 'Contenus promotionnels', icon: Megaphone },
];

const TONES = [
  { value: 'professional', label: 'Professionnel' },
  { value: 'friendly', label: 'Amical' },
  { value: 'academic', label: 'Académique' },
  { value: 'inspirational', label: 'Inspirant' },
  { value: 'conversational', label: 'Conversationnel' },
  { value: 'pastoral', label: 'Pastoral' },
];

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
];

export default function ProjectWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectType>(
    (searchParams.get('type') as ProjectType) || 'ebook'
  );
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [language, setLanguage] = useState('fr');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [targetLength, setTargetLength] = useState<number>(10);
  const [styleNotes, setStyleNotes] = useState('');
  const [keywords, setKeywords] = useState('');
  // Kids specific
  const [ageRange, setAgeRange] = useState('3-6');
  const [artStyle, setArtStyle] = useState('');
  const [characters, setCharacters] = useState('');
  const [moral, setMoral] = useState('');
  const [lineArtStyle, setLineArtStyle] = useState('simple');
  // Sermon specific
  const [sermonTheme, setSermonTheme] = useState('');
  const [sermonText, setSermonText] = useState('');
  // Template
  const [templateId, setTemplateId] = useState<string | null>(null);

  const { data: templates } = useQuery({
    queryKey: ['studio-templates', currentOrg?.id, projectType],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await db.from('ai_templates')
        .select('*')
        .eq('project_type', projectType)
        .eq('is_active', true)
        .or(`is_global.eq.true,organization_id.eq.${currentOrg.id}`)
        .order('display_order');
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg || !user) throw new Error('Missing context');
      const { data, error } = await db.from('ai_content_projects').insert({
        organization_id: currentOrg.id,
        created_by: user.id,
        title,
        project_type: projectType,
        language,
        tone,
        target_audience: targetAudience || null,
        objective: objective || null,
        target_length: targetLength || null,
        style_notes: styleNotes || null,
        keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : null,
        template_id: templateId,
        // Kids/Coloring
        age_range: ['kids_book', 'coloring_book'].includes(projectType) ? ageRange : null,
        art_style: ['kids_book', 'coloring_book'].includes(projectType) ? artStyle : null,
        characters: projectType === 'kids_book' ? characters : null,
        moral: projectType === 'kids_book' ? moral : null,
        line_art_style: projectType === 'coloring_book' ? lineArtStyle : null,
        // Sermon
        sermon_theme: ['sermon_pack', 'bible_pack'].includes(projectType) ? sermonTheme : null,
        sermon_text: ['sermon_pack', 'bible_pack'].includes(projectType) ? sermonText : null,
      }).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studio-projects'] });
      queryClient.invalidateQueries({ queryKey: ['studio-stats'] });
      toast.success('Projet créé avec succès !');
      navigate(`/admin/studio/projects/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la création');
    },
  });

  const isKids = projectType === 'kids_book';
  const isColoring = projectType === 'coloring_book';
  const isSermon = projectType === 'sermon_pack' || projectType === 'bible_pack';

  const steps = [
    'Type de projet',
    'Informations',
    ...(templates?.length ? ['Template'] : []),
    ...(isKids || isColoring || isSermon ? ['Détails spécifiques'] : []),
    'Confirmation',
  ];

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return title.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === steps.length - 1) {
      createMutation.mutate();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" /> Nouveau projet
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Étape {step + 1} sur {steps.length} — {steps[step]}
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step 0: Type */}
      {step === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TYPE_OPTIONS.map(opt => (
            <Card
              key={opt.value}
              className={`cursor-pointer transition-all ${
                projectType === opt.value
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'hover:border-primary/30'
              }`}
              onClick={() => setProjectType(opt.value)}
            >
              <CardContent className="pt-5 pb-4 flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  projectType === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step 1: Info */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Titre du projet *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Guide complet du leadership" />
            </div>
            <div>
              <Label>Objectif</Label>
              <Textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="Qu'est-ce que le lecteur doit apprendre/ressentir ?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Langue</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ton</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Public cible</Label>
              <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="Ex: Pasteurs, leaders d'église, 25-45 ans" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre de pages/chapitres</Label>
                <Input type="number" min={1} max={200} value={targetLength} onChange={e => setTargetLength(Number(e.target.value))} />
              </div>
              <div>
                <Label>Mots-clés (séparés par virgule)</Label>
                <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="leadership, foi, croissance" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template step (conditional) */}
      {steps[step] === 'Template' && (
        <div className="space-y-3">
          <Card
            className={`cursor-pointer transition-all ${!templateId ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/30'}`}
            onClick={() => setTemplateId(null)}
          >
            <CardContent className="py-4 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Sans template</p>
                <p className="text-xs text-muted-foreground">Partir de zéro avec vos paramètres</p>
              </div>
            </CardContent>
          </Card>
          {templates?.map(t => (
            <Card
              key={t.id}
              className={`cursor-pointer transition-all ${templateId === t.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/30'}`}
              onClick={() => setTemplateId(t.id)}
            >
              <CardContent className="py-4 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{t.name}</p>
                    {t.is_global && <Badge variant="secondary" className="text-[10px]">Global</Badge>}
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Specific details step */}
      {steps[step] === 'Détails spécifiques' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {isKids && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tranche d'âge</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-3">0–3 ans</SelectItem>
                        <SelectItem value="3-6">3–6 ans</SelectItem>
                        <SelectItem value="6-9">6–9 ans</SelectItem>
                        <SelectItem value="9-12">9–12 ans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Style artistique</Label>
                    <Input value={artStyle} onChange={e => setArtStyle(e.target.value)} placeholder="Aquarelle, cartoon, réaliste…" />
                  </div>
                </div>
                <div>
                  <Label>Personnages</Label>
                  <Input value={characters} onChange={e => setCharacters(e.target.value)} placeholder="Noms et descriptions des personnages" />
                </div>
                <div>
                  <Label>Morale / Message</Label>
                  <Input value={moral} onChange={e => setMoral(e.target.value)} placeholder="La leçon que l'enfant doit retenir" />
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                  🛡️ <strong>Kids Safety Gate requis</strong> — Ce contenu sera soumis à une vérification de sécurité enfant avant publication.
                </div>
              </>
            )}
            {isColoring && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tranche d'âge</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3-6">3–6 ans</SelectItem>
                        <SelectItem value="6-9">6–9 ans</SelectItem>
                        <SelectItem value="9-12">9–12 ans</SelectItem>
                        <SelectItem value="all">Tout âge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Style de trait</Label>
                    <Select value={lineArtStyle} onValueChange={setLineArtStyle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple (gros traits)</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="detailed">Détaillé (traits fins)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Style artistique</Label>
                  <Input value={artStyle} onChange={e => setArtStyle(e.target.value)} placeholder="Animaux, nature, mandala…" />
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                  🛡️ <strong>Kids Safety Gate requis</strong> — Ce contenu sera soumis à une vérification de sécurité enfant avant publication.
                </div>
              </>
            )}
            {isSermon && (
              <>
                <div>
                  <Label>Thème du sermon</Label>
                  <Input value={sermonTheme} onChange={e => setSermonTheme(e.target.value)} placeholder="Ex: La grâce, Le pardon, La foi" />
                </div>
                <div>
                  <Label>Texte biblique de base</Label>
                  <Textarea value={sermonText} onChange={e => setSermonText(e.target.value)} placeholder="Ex: Jean 3:16 ou collez le texte" rows={3} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation step */}
      {steps[step] === 'Confirmation' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Résumé du projet</CardTitle>
            <CardDescription>Vérifiez les informations avant de créer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{TYPE_OPTIONS.find(t => t.value === projectType)?.label}</span>
              <span className="text-muted-foreground">Titre</span>
              <span className="font-medium">{title}</span>
              <span className="text-muted-foreground">Langue</span>
              <span>{LANGUAGES.find(l => l.value === language)?.label}</span>
              <span className="text-muted-foreground">Ton</span>
              <span>{TONES.find(t => t.value === tone)?.label}</span>
              {targetAudience && <>
                <span className="text-muted-foreground">Public cible</span>
                <span>{targetAudience}</span>
              </>}
              <span className="text-muted-foreground">Longueur</span>
              <span>{targetLength} pages/chapitres</span>
              {templateId && <>
                <span className="text-muted-foreground">Template</span>
                <span>{templates?.find(t => t.id === templateId)?.name || 'Sélectionné'}</span>
              </>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step === 0 ? navigate('/admin/studio') : setStep(s => s - 1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 0 ? 'Retour' : 'Précédent'}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canNext() || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : step === steps.length - 1 ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          {step === steps.length - 1 ? 'Créer le projet' : 'Suivant'}
        </Button>
      </div>
    </div>
  );
}
