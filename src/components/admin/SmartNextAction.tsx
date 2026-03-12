import { useOrg } from '@/contexts/OrgContext';
import { useOrgScore } from './OrgProgressScore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImagePlus, FileText, Upload, Users, Shield, Share2, ShoppingBag, Megaphone, Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface SmartAction {
  id: string;
  label: string;
  description: string;
  icon: typeof Rocket;
  route: string;
  color: string;
  urgency: 'high' | 'medium' | 'low';
}

function getNextActions(steps: { key: string; done: boolean }[], org: any, isFr: boolean): SmartAction[] {
  const actions: SmartAction[] = [];

  if (!org?.logo_url && !org?.banner_url) {
    actions.push({
      id: 'branding',
      label: isFr ? 'Ajoutez votre identité visuelle' : 'Add your visual identity',
      description: isFr ? 'Un logo inspire confiance. Les organisations avec logo reçoivent 3x plus de visites.' : 'A logo builds trust. Organizations with logos get 3x more visits.',
      icon: ImagePlus, route: '/admin/settings', color: 'text-violet-500', urgency: 'high',
    });
  }

  if (!org?.description || org.description.length <= 20) {
    actions.push({
      id: 'description',
      label: isFr ? 'Décrivez votre mission' : 'Describe your mission',
      description: isFr ? 'En 1 phrase, dites ce que vous offrez. Les visiteurs décident en 3 secondes.' : 'In 1 sentence, say what you offer. Visitors decide in 3 seconds.',
      icon: FileText, route: '/admin/settings', color: 'text-blue-500', urgency: 'high',
    });
  }

  const step = steps.find(s => s.key === 'first-product');
  if (step && !step.done) {
    actions.push({
      id: 'first-product',
      label: isFr ? 'Publiez votre premier produit' : 'Publish your first product',
      description: isFr ? 'Les organisations qui publient dans les 24h ont 5x plus de chances de réussir.' : 'Organizations that publish within 24h are 5x more likely to succeed.',
      icon: Upload, route: '/admin/products/new', color: 'text-emerald-500', urgency: 'high',
    });
  }

  const kycStep = steps.find(s => s.key === 'kyc');
  if (kycStep && !kycStep.done && (org?.kyc_status === 'none' || org?.kyc_status === 'rejected')) {
    actions.push({
      id: 'kyc',
      label: isFr ? 'Vérifiez votre identité' : 'Verify your identity',
      description: isFr ? 'Obligatoire pour recevoir vos paiements. 5 minutes suffisent.' : 'Required to receive payments. Takes only 5 minutes.',
      icon: Shield, route: '/admin/kyc', color: 'text-amber-500', urgency: 'medium',
    });
  }

  const affStep = steps.find(s => s.key === 'ambassadors');
  if (affStep && !affStep.done) {
    actions.push({
      id: 'ambassadors',
      label: isFr ? 'Activez vos ambassadeurs' : 'Activate your ambassadors',
      description: isFr ? 'Chaque ambassadeur peut vendre pour vous et toucher des commissions.' : 'Each ambassador can sell for you and earn commissions.',
      icon: Users, route: '/admin/settings', color: 'text-rose-500', urgency: 'medium',
    });
  }

  if (!org?.whatsapp && !org?.website) {
    actions.push({
      id: 'contact',
      label: isFr ? 'Ajoutez un contact (WhatsApp/Site)' : 'Add contact info (WhatsApp/Website)',
      description: isFr ? 'Les acheteurs veulent pouvoir vous contacter avant d\'acheter.' : 'Buyers want to contact you before purchasing.',
      icon: Share2, route: '/admin/settings', color: 'text-teal-500', urgency: 'low',
    });
  }

  return actions;
}

export function SmartNextAction() {
  const { currentOrg } = useOrg();
  const { steps, score } = useOrgScore(currentOrg?.id);
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const actions = getNextActions(steps, currentOrg, isFr);

  if (score >= 100 || actions.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{isFr ? '🎉 Organisation au top !' : '🎉 Organization on top!'}</h3>
            <p className="text-xs text-muted-foreground">{isFr ? 'Toutes les étapes sont complétées. Continuez à publier et partager.' : 'All steps completed. Keep publishing and sharing.'}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const primary = actions[0];
  const PrimaryIcon = primary.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 shadow-card">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        🎯 {isFr ? 'Prochaine étape recommandée' : 'Recommended next step'}
      </h3>

      <button onClick={() => navigate(primary.route)}
        className="w-full group bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/15 rounded-xl p-4 text-left hover:border-primary/30 transition-all hover:-translate-y-0.5 mb-3">
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

      {actions.length > 1 && (
        <div className="space-y-1">
          {actions.slice(1, 4).map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.id} onClick={() => navigate(action.route)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-muted/50 transition-colors group">
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
