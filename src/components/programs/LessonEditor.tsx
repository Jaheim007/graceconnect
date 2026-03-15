import { useState, useEffect, useRef } from 'react';
import { AdminPageShell } from '@/pages/admin/AdminPageShell';
import { useLesson, useLessonAttachments, useLessonQuiz, useUpdateLesson, useCreateAttachment, useDeleteAttachment, useCreateQuiz, useCreateQuizQuestion, useUpdateQuizQuestion, useDeleteQuizQuestion } from '@/hooks/usePrograms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Save, Loader2, FileText, Video, Upload, Trash2,
  HelpCircle, Plus, CheckCircle2, XCircle, Paperclip, Clock, Eye
} from 'lucide-react';

interface LessonEditorProps {
  lessonId: string;
  programId: string;
  onBack: () => void;
  /** When true, renders inline without AdminPageShell wrapper */
  embedded?: boolean;
}

export function LessonEditor({ lessonId, programId, onBack }: LessonEditorProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();

  const { data: lesson, isLoading } = useLesson(lessonId);
  const { data: attachments = [] } = useLessonAttachments(lessonId);
  const { data: quiz } = useLessonQuiz(lessonId);

  const updateLesson = useUpdateLesson();
  const createAttachment = useCreateAttachment();
  const deleteAttachment = useDeleteAttachment();
  const createQuiz = useCreateQuiz();
  const createQuestion = useCreateQuizQuestion();
  const updateQuestion = useUpdateQuizQuestion();
  const deleteQuestion = useDeleteQuizQuestion();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  // Quiz state
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lesson) {
      setTitle((lesson as any).title || '');
      setContent((lesson as any).content || '');
      setVideoUrl((lesson as any).video_url || '');
      setDuration(String((lesson as any).duration_minutes || ''));
      setIsFreePreview((lesson as any).is_free_preview || false);
    }
  }, [lesson]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLesson.mutateAsync({
        id: lessonId,
        programId,
        title: title.trim(),
        content,
        video_url: videoUrl || undefined,
        duration_minutes: duration ? parseInt(duration) : undefined,
        is_free_preview: isFreePreview,
      });
      toast({ title: isFr ? '✅ Leçon enregistrée' : '✅ Lesson saved' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // File upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `lesson-attachments/${lessonId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      await createAttachment.mutateAsync({
        lesson_id: lessonId,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
      toast({ title: isFr ? '📎 Fichier ajouté' : '📎 File attached' });
    } catch (err: any) {
      toast({ title: isFr ? 'Erreur upload' : 'Upload error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachId: string) => {
    try {
      await deleteAttachment.mutateAsync({ id: attachId, lessonId });
    } catch { }
  };

  // Quiz
  const handleCreateQuiz = async () => {
    try {
      await createQuiz.mutateAsync({
        lesson_id: lessonId,
        title: isFr ? 'Quiz' : 'Quiz',
        passing_score: 70,
      });
      toast({ title: isFr ? '✅ Quiz créé' : '✅ Quiz created' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleAddQuestion = async () => {
    if (!quiz || !newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2) return;
    try {
      await createQuestion.mutateAsync({
        quiz_id: (quiz as any).id,
        question: newQuestion.trim(),
        options: newOptions.filter(o => o.trim()) as any,
        correct_index: newCorrectIndex,
        display_order: ((quiz as any).questions?.length || 0),
        lessonId,
      });
      setNewQuestion('');
      setNewOptions(['', '', '', '']);
      setNewCorrectIndex(0);
      toast({ title: isFr ? '✅ Question ajoutée' : '✅ Question added' });
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    try {
      await deleteQuestion.mutateAsync(qId);
    } catch { }
  };

  if (isLoading) {
    return (
      <AdminPageShell title="" backRoute="/admin/programs">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminPageShell>
    );
  }

  const contentType = (lesson as any)?.content_type || 'text';

  return (
    <AdminPageShell title={isFr ? 'Éditeur de leçon' : 'Lesson editor'} backRoute="/admin/programs">
      <div className="space-y-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> {isFr ? 'Retour au programme' : 'Back to program'}
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()} size="sm" className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isFr ? 'Enregistrer' : 'Save'}
          </Button>
        </div>

        {/* Title & meta */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs">{isFr ? 'Titre de la leçon' : 'Lesson title'}</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="h-9 text-base font-semibold" />
            </div>
            <div className="w-[100px]">
              <Label className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> {isFr ? 'Durée' : 'Duration'}</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="min" className="h-9" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={isFreePreview} onCheckedChange={setIsFreePreview} />
              <Label className="text-xs flex items-center gap-1">
                <Eye className="h-3 w-3" /> {isFr ? 'Aperçu gratuit' : 'Free preview'}
              </Label>
            </div>
            <Badge variant="outline" className="text-[10px]">{contentType}</Badge>
          </div>
        </div>

        {/* Content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="content" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> {isFr ? 'Contenu' : 'Content'}
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1.5 text-xs">
              <Video className="h-3.5 w-3.5" /> {isFr ? 'Vidéo' : 'Video'}
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-1.5 text-xs">
              <Paperclip className="h-3.5 w-3.5" /> {isFr ? 'Fichiers' : 'Files'}
              {(attachments as any[]).length > 0 && (
                <Badge variant="secondary" className="text-[9px] ml-1">{(attachments as any[]).length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1.5 text-xs">
              <HelpCircle className="h-3.5 w-3.5" /> Quiz
              {quiz && (quiz as any).questions?.length > 0 && (
                <Badge variant="secondary" className="text-[9px] ml-1">{(quiz as any).questions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── RICH TEXT CONTENT ─── */}
          <TabsContent value="content" className="mt-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <Label className="text-xs mb-2 block">{isFr ? 'Contenu de la leçon' : 'Lesson content'}</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder={isFr ? "Rédigez le contenu de cette leçon..." : "Write your lesson content..."}
              />
            </div>
          </TabsContent>

          {/* ─── VIDEO ─── */}
          <TabsContent value="video" className="mt-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div>
                <Label className="text-xs">{isFr ? 'URL de la vidéo' : 'Video URL'}</Label>
                <p className="text-[10px] text-muted-foreground mb-1.5">YouTube, Vimeo, {isFr ? 'ou lien direct' : 'or direct link'}</p>
                <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-9" />
              </div>
              {videoUrl && (
                <div className="rounded-xl overflow-hidden border border-border bg-muted aspect-video">
                  {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : videoUrl.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${extractVimeoId(videoUrl)}`}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={videoUrl} controls className="w-full h-full object-contain" />
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── ATTACHMENTS ─── */}
          <TabsContent value="attachments" className="mt-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{isFr ? 'Fichiers joints' : 'Attachments'}</h3>
                  <p className="text-[10px] text-muted-foreground">{isFr ? 'PDF, documents, ressources téléchargeables' : 'PDF, documents, downloadable resources'}</p>
                </div>
                <div>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt" />
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    {isFr ? 'Ajouter' : 'Add file'}
                  </Button>
                </div>
              </div>

              {(attachments as any[]).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">{isFr ? 'Aucun fichier joint' : 'No attachments yet'}</p>
              ) : (
                <div className="space-y-2">
                  {(attachments as any[]).map((att: any) => (
                    <div key={att.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 group">
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium flex-1 truncate">{att.file_name}</span>
                      {att.file_size && (
                        <span className="text-[10px] text-muted-foreground">{(att.file_size / 1024).toFixed(0)} KB</span>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDeleteAttachment(att.id)}>
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── QUIZ ─── */}
          <TabsContent value="quiz" className="mt-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              {!quiz ? (
                <div className="text-center py-8 space-y-3">
                  <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{isFr ? 'Aucun quiz pour cette leçon' : 'No quiz for this lesson'}</p>
                  <Button onClick={handleCreateQuiz} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> {isFr ? 'Créer un quiz' : 'Create quiz'}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Existing questions */}
                  {((quiz as any).questions || []).map((q: any, qi: number) => (
                    <div key={q.id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground mr-1.5">Q{qi + 1}.</span>
                          {q.question}
                        </p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => (
                          <div key={oi} className={`text-xs p-2 rounded-lg flex items-center gap-1.5 ${oi === q.correct_index ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                            {oi === q.correct_index ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0 opacity-30" />}
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Add question */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-border space-y-3">
                    <Label className="text-xs font-semibold">{isFr ? 'Ajouter une question' : 'Add question'}</Label>
                    <Input
                      value={newQuestion}
                      onChange={e => setNewQuestion(e.target.value)}
                      placeholder={isFr ? 'Votre question...' : 'Your question...'}
                      className="h-8 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {newOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setNewCorrectIndex(i)}
                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${i === newCorrectIndex ? 'border-primary bg-primary/20' : 'border-muted-foreground/30'}`}
                          >
                            {i === newCorrectIndex && <CheckCircle2 className="h-3 w-3 text-primary" />}
                          </button>
                          <Input
                            value={opt}
                            onChange={e => {
                              const updated = [...newOptions];
                              updated[i] = e.target.value;
                              setNewOptions(updated);
                            }}
                            placeholder={`${isFr ? 'Option' : 'Option'} ${i + 1}`}
                            className="h-7 text-[11px]"
                          />
                        </div>
                      ))}
                    </div>
                    <Button size="sm" onClick={handleAddQuestion}
                      disabled={!newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2}
                      className="gap-1.5 text-xs">
                      <Plus className="h-3 w-3" /> {isFr ? 'Ajouter' : 'Add'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageShell>
  );
}

// Helpers
function extractYoutubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match?.[1] || '';
}

function extractVimeoId(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] || '';
}
