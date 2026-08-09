import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { MoreVertical, Save, Trash2, PenLine, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WriteProgressProps {
  currentStep: number;
  labels: string[];
  onSaveAndNew?: () => void;
  onDeleteAndNew?: () => void;
  onExit?: () => void;
}

export function WriteProgress({ currentStep, labels, onSaveAndNew, onDeleteAndNew, onExit }: WriteProgressProps) {
  const { t } = useI18n();
  const progress = ((currentStep) / (labels.length - 1)) * 100;

  const hasActions = onSaveAndNew || onDeleteAndNew || onExit;

  return (
    <div className="sticky top-14 z-30 -mt-2 mb-4 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-3xl px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <PenLine className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t('write.step_label')} {currentStep + 1}/{labels.length}
              </p>
              <p className="truncate text-sm font-bold sm:text-base">{labels[currentStep]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary sm:inline">
              {Math.round(progress)}%
            </span>
            {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground border-border/60">
                  <MoreVertical className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('write.actions_menu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {onSaveAndNew && (
                  <DropdownMenuItem onClick={onSaveAndNew} className="gap-2">
                    <Save className="h-4 w-4" />
                    {t('write.save_and_new')}
                  </DropdownMenuItem>
                )}
                {onDeleteAndNew && (
                  <DropdownMenuItem onClick={onDeleteAndNew} className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    {t('write.delete_and_new')}
                  </DropdownMenuItem>
                )}
                {(onSaveAndNew || onDeleteAndNew) && onExit && <DropdownMenuSeparator />}
                {onExit && (
                  <DropdownMenuItem onClick={onExit} className="gap-2">
                    <Home className="h-4 w-4" />
                    {t('write.exit_wizard')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            )}
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-700 ease-out')}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

