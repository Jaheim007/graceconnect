import { Loader2, Building2, BookMarked, FileCheck2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

type PublishingStage = 'preparing' | 'org' | 'book' | 'pdf' | 'finalizing';

interface Props {
  stage: PublishingStage;
  willCreateOrg: boolean;
}

export function StepPublishing({ stage, willCreateOrg }: Props) {
  const { t } = useI18n();

  const stages: { key: PublishingStage; icon: typeof Loader2; label: string }[] = [
    { key: 'preparing', icon: Loader2, label: t('write.publish_stage_preparing') },
    { key: 'org', icon: Building2, label: willCreateOrg ? t('write.publish_stage_org_create') : t('write.publish_stage_org_check') },
    { key: 'book', icon: BookMarked, label: t('write.publish_stage_book') },
    { key: 'pdf', icon: FileCheck2, label: t('write.publish_stage_pdf') },
    { key: 'finalizing', icon: FileCheck2, label: t('write.publish_stage_finalizing') },
  ];

  const activeIndex = stages.findIndex((item) => item.key === stage);

  return (
    <div className="space-y-8 pt-12">
      <div className="text-center space-y-3">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t('write.publishing')}</h2>
        <p className="text-sm text-muted-foreground">
          {willCreateOrg ? t('write.publish_org_notice') : t('write.publish_org_existing_notice')}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        {stages.map((item, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;
          const Icon = item.icon;

          return (
            <div key={item.key} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary animate-spin' : isDone ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <p className={`text-sm ${isActive || isDone ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
