import { Upload, FileText, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MigrateState } from '../MigrateWizard';

interface Props {
  state: MigrateState;
  update: (patch: Partial<MigrateState>) => void;
  onNext: () => void;
}

export function MigrateUpload({ state, update, onNext }: Props) {
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    update({ files: [...state.files, ...newFiles] });
    // Auto-fill title from first file
    if (!state.title && newFiles[0]) {
      update({ title: newFiles[0].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') });
    }
  };

  const removeFile = (index: number) => {
    update({ files: state.files.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          📤 Importe ton contenu
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Tu as déjà un ebook, un PDF, un cours ? Importe-le et vends-le avec une <strong className="text-foreground">armée d'ambassadeurs</strong>.
        </p>
      </div>

      {/* Drop zone */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-10 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="font-bold text-sm">Glisse tes fichiers ici ou clique pour uploader</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, ZIP — Max 20 Mo par fichier</p>
        <input
          type="file"
          accept=".pdf,.docx,.doc,.txt,.zip,.epub"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </label>

      {/* File list */}
      {state.files.length > 0 && (
        <div className="space-y-2">
          {state.files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground">{(f.size / 1024 / 1024).toFixed(1)} Mo</p>
              </div>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Comparison table */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-bold text-center">Pourquoi vendre ici ?</p>
        <div className="grid grid-cols-4 text-[10px] text-center gap-y-2">
          <div className="font-bold text-muted-foreground" />
          <div className="font-bold text-primary">SiteViral</div>
          <div className="font-bold text-muted-foreground">Gumroad</div>
          <div className="font-bold text-muted-foreground">Direct</div>

          <div className="text-left font-medium">Ambassadeurs</div>
          <div className="text-emerald-500 font-bold">✅</div>
          <div className="text-destructive">❌</div>
          <div className="text-destructive">❌</div>

          <div className="text-left font-medium">Mobile Money</div>
          <div className="text-emerald-500 font-bold">✅</div>
          <div className="text-destructive">❌</div>
          <div className="text-destructive">❌</div>

          <div className="text-left font-medium">Protection</div>
          <div className="text-emerald-500 font-bold">✅</div>
          <div className="text-muted-foreground">~</div>
          <div className="text-destructive">❌</div>

          <div className="text-left font-medium">Commission</div>
          <div className="text-primary font-bold">10%</div>
          <div className="text-muted-foreground">10%+</div>
          <div className="text-muted-foreground">0%</div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          💡 Avec Gumroad = ventes seul. Avec SiteViral + 10 ambassadeurs = <strong>10x plus de ventes</strong>.
        </p>
      </div>

      <Button
        size="lg"
        className="w-full h-14 text-base gap-2"
        disabled={state.files.length === 0}
        onClick={onNext}
      >
        Continuer <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
