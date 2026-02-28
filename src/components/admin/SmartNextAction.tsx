import { useOrg } from '@/contexts/OrgContext';
import { useOrgScore } from './OrgProgressScore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ImagePlus, FileText, Upload, Users, Shield, Share2, ShoppingBag,
  Megaphone, Rocket, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SmartAction {
  id: string;
  label: string;
  description: string;
  icon: typeof Rocket;
  route: string;
  color: string;
  urgency: 'high' | 'medium' | 'low';
}

function getNextActions(steps: { label: string; done: boolean }[], org: any): SmartAction[] {
  const actions: SmartAction[] = [];

  if (!org?.logo_url && !org?.banner_url) {
    actions.push({
      id: 'branding',
      label: 'Ajoutez votre identité visuelle',
      description: 'Un logo inspire confiance. Les organisations avec logo reçoivent 3x plus de visites.',
      icon: ImagePlus,
      route: '/admin/settings',
      color: 'text-violet-500',
      urgency: 'high',
    });
  }

  if (!org?.description || org.description.length <= 20) {
    actions.push({
      id: 'description',
      label: 'Décrivez votre mission',
      description: 'En 1 phrase, dites ce que vous offrez. Les visiteurs décident en 3 secondes.',
      icon: FileText,
      route: '/admin/settings',
      color: 'text-blue-500',
      urgency: 'high',
    });
  }

  const step = steps.find(s => s.label === 'Premier produit publié');
  if (step && !step.done) {
    actions.push({
      id: 'first-product',
      label: 'Publiez votre premier produit',
      description: 'Les organisations qui publient dans les 24h ont 5x plus de chances de réussir.',
      icon: Upload,
      route: '/admin/products/new',
      color: 'text-emerald-500',
      urgency: 'high',
    });
  }

  const kycStep = steps.find(s => s.label === 'KYC vérifié');
  if (kycStep && !kycStep.done && (org?.kyc_status === 'none' || org?.kyc_status === 'rejected')) {
    actions.push({
      id: 'kyc',
      label: 'Vérifiez votre identité (KYC)',
      description: 'Obligatoire pour recevoir vos paiements. 5 minutes suffisent.',
      icon: Shield,
      route: '/admin/kyc',
      color: 'text-amber-500',
      urgency: 'medium',
    });
  }

  const affStep = steps.find(s => s.label === 'Ambassadeurs actifs (3+)');
  if (affStep && !affStep.done) {
    actions.push({
      id: 'ambassadors',
      label: 'Activez vos ambassadeurs',
      description: 'Chaque ambassadeur peut vendre pour vous et toucher des commissions.',
      icon: Users,
      route: '/admin/settings',
      color: 'text-rose-500',
      urgency: 'medium',
    });
  }

  if (!org?.whatsapp && !org?.website) {
    actions.push({
      id: 'contact',
      label: 'Ajoutez un contact (WhatsApp/Site)',
      description: 'Les acheteurs veulent pouvoir vous contacter avant d\'acheter.',
      icon: Share2,
      route: '/admin/settings',
      color: 'text-teal-500',
      urgency: 'low',
    });
  }

  return actions;
}

export function SmartNextAction() {
  const { currentOrg } = useOrg();
  const { steps, score } = useOrgScore(currentOrg?.id);
  const navigate = useNavigate();

  const actions = getNextActions(steps, currentOrg);

  // If score is 100%, show congratulations
  if (score >= 100 || actions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">🎉 Organisation au top !</h3>
            <p className="text-xs text-muted-foreground">Toutes les étapes sont complétées. Continuez à publier et partager.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const primary = actions[0];
  const PrimaryIcon = primary.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        🎯 Prochaine étape recommandée
      </h3>

      {/* Primary action — large card */}
      <button
        onClick={() => navigate(primary.route)}
        className="w-full group bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/15 rounded-xl p-4 text-left hover:border-primary/30 transition-all hover:-translate-y-0.5 mb-3"
      >
        <div className="flex items-start gap-3">
          <div className={cn('h-10 w-10 rounded-xl bg-background/80 border flex items-center justify-center shrink-0', `border-current ${primary.color}`)}>
            <PrimaryIcon className={cn('h-5 w-5', primary.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{primary.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{primary.description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
        </div>
      </button>

      {/* Secondary actions — compact list */}
      {actions.length > 1 && (
        <div className="space-y-1">
          {actions.slice(1, 4).map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => navigate(action.route)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-muted/50 transition-colors group"
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', action.color)} />
                <span className="flex-1 text-left truncate">{action.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
