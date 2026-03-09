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
    <div className="container max-w-2xl px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t('write.step_label')} {currentStep + 1}/{labels.length}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary">
            {labels[currentStep]}
          </span>
          {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground border-border/60">
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
          className={cn('h-full bg-primary rounded-full transition-all duration-500')}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
