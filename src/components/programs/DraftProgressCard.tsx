/**
 * Auto-saved AI course draft row.
 *
 * When the draft is still generating it shows a live, animated progress bar
 * with a real percentage so the creator can tell the work is still running
 * server-side even after leaving and coming back to the page.
 */
import { motion } from 'framer-motion';
import { Loader2, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CourseDraftSummary } from '@/hooks/useCourseDraft';

interface DraftProgressCardProps {
  draft: CourseDraftSummary;
  isFr: boolean;
  onResume: () => void;
  onDelete: () => void;
}

export function DraftProgressCard({ draft, isFr, onResume, onDelete }: DraftProgressCardProps) {
  const generating = draft.status === 'generating' || draft.job_status === 'running' || draft.job_status === 'queued';
  const percent = Math.min(99, Math.max(2, Math.round(draft.progress ?? 0)));

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-4 sm:p-5 space-y-3 transition-colors',
        generating ? 'border-primary/40 bg-primary/[0.03]' : 'border-border',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'h-11 w-11 rounded-xl flex items-center justify-center shrink-0',
            generating ? 'bg-primary/10' : 'bg-muted',
          )}
        >
          {generating ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-snug break-words">{draft.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {draft.lessons} {isFr ? 'leçons' : 'lessons'} · {draft.slides} slides
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant={generating ? 'default' : 'outline'} className="h-9 text-sm" onClick={onResume}>
            {generating ? (isFr ? 'Suivre' : 'Follow') : isFr ? 'Reprendre' : 'Resume'}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-destructive"
            onClick={onDelete}
            aria-label={isFr ? 'Supprimer' : 'Delete'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {generating && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {isFr ? 'Génération en cours…' : 'Generating…'}
            </span>
            <span className="text-sm font-bold tabular-nums text-primary">{percent}%</span>
          </div>
          <div
            className="h-2.5 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <motion.div
              className="h-full rounded-full bg-primary relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent animate-pulse" />
            </motion.div>
          </div>
          <p className="text-xs text-muted-foreground">
            {isFr
              ? 'Vous pouvez quitter cette page — la génération continue sur nos serveurs.'
              : 'You can leave this page — generation keeps running on our servers.'}
          </p>
        </div>
      )}
    </div>
  );
}
