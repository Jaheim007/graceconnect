import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

export function OrgActivationChecklist() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: media = [] } = useOrgMedia(currentOrg?.id, false);
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const { data: members = [] } = useOrgMembers(currentOrg?.id);

  const steps = [
    { key: 'logo', label: isFr ? 'Logo & bannière ajoutés' : 'Logo & banner added', tip: isFr ? 'Un bon visuel inspire confiance dès le premier regard.' : 'A good visual builds trust at first glance.', done: !!(currentOrg?.logo_url || currentOrg?.banner_url), route: '/admin/settings' },
    { key: 'desc', label: isFr ? 'Description renseignée' : 'Description added', tip: isFr ? 'En 1 phrase, dites ce que vous offrez.' : 'In 1 sentence, say what you offer.', done: !!(currentOrg?.description && currentOrg.description.length > 10), route: '/admin/settings' },
    { key: 'content', label: isFr ? 'Premier contenu publié' : 'First content published', tip: isFr ? 'Publiez une vidéo, un audio ou un article pour attirer vos premiers visiteurs.' : 'Publish a video, audio, or article to attract your first visitors.', done: media.some(m => m.is_published), route: '/admin/media/new' },
    { key: 'product', label: isFr ? 'Premier produit ou campagne' : 'First product or campaign', tip: isFr ? 'Créez un ebook gratuit ou une campagne de dons pour commencer à monétiser.' : 'Create a free ebook or donation campaign to start monetizing.', done: products.length > 0, route: '/admin/products/new' },
    { key: 'members', label: isFr ? 'Au moins 2 membres' : 'At least 2 members', tip: isFr ? 'Invitez un collaborateur — ensemble, vous irez plus vite !' : 'Invite a collaborator — together, you\'ll go faster!', done: members.length >= 2, route: '/admin/members' },
    { key: 'kyc', label: isFr ? 'Vérification KYC' : 'KYC Verification', tip: isFr ? 'Obligatoire pour recevoir vos paiements. 5 minutes suffisent.' : 'Required to receive payments. Takes only 5 minutes.', done: currentOrg?.kyc_status === 'level1' || currentOrg?.kyc_status === 'level2', route: '/admin/kyc' },
  ];

  const completed = steps.filter(s => s.done).length;
  const total = steps.length;
  const percent = Math.round((completed / total) * 100);

  if (completed === total) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-sm">{isFr ? 'Préparez votre organisation' : 'Set up your organization'}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{completed}/{total} {isFr ? 'étapes complétées' : 'steps completed'}</p>
        </div>
        <div className="text-sm font-bold text-primary">{percent}%</div>
      </div>

      <div className="h-2 rounded-full bg-muted mb-4 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="space-y-1.5">
        {steps.map((step) => (
          <button
            key={step.key}
            onClick={() => !step.done && navigate(step.route)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm transition-colors',
              step.done
                ? 'text-muted-foreground'
                : 'hover:bg-primary/5 text-foreground cursor-pointer'
            )}
            disabled={step.done}
          >
            {step.done ? (
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className={cn(step.done && 'line-through')}>{step.label}</span>
              {!step.done && step.tip && (
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{step.tip}</p>
              )}
            </div>
            {!step.done && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
