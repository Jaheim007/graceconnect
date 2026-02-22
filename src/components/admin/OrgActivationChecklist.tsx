import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function OrgActivationChecklist() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { data: media = [] } = useOrgMedia(currentOrg?.id, false);
  const { data: products = [] } = useOrgProducts(currentOrg?.id, false);
  const { data: members = [] } = useOrgMembers(currentOrg?.id);

  const steps = [
    { label: 'Logo & bannière ajoutés', done: !!(currentOrg?.logo_url || currentOrg?.banner_url), route: '/admin/settings' },
    { label: 'Description renseignée', done: !!(currentOrg?.description && currentOrg.description.length > 10), route: '/admin/settings' },
    { label: 'Premier contenu publié', done: media.some(m => m.is_published), route: '/admin/media/new' },
    { label: 'Premier produit ou campagne', done: products.length > 0, route: '/admin/products/new' },
    { label: 'Au moins 2 membres', done: members.length >= 2, route: '/admin/members' },
    { label: 'Vérification KYC', done: currentOrg?.kyc_status === 'level1' || currentOrg?.kyc_status === 'level2', route: '/admin/kyc' },
  ];

  const completed = steps.filter(s => s.done).length;
  const total = steps.length;
  const percent = Math.round((completed / total) * 100);

  // Hide if all done
  if (completed === total) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-sm">Préparez votre organisation</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{completed}/{total} étapes complétées</p>
        </div>
        <div className="text-sm font-bold text-primary">{percent}%</div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted mb-4 overflow-hidden">
        <motion.div
          className="h-full rounded-full gold-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="space-y-1.5">
        {steps.map((step) => (
          <button
            key={step.label}
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
            <span className={cn(step.done && 'line-through')}>{step.label}</span>
            {!step.done && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
