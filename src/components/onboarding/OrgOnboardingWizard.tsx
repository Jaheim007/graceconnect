import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Heart, BookOpen, Users, Check, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const GOALS = [
  { id: 'sell', icon: ShoppingBag, title: 'Vendre des produits', desc: 'Ebooks, formations, ressources digitales', route: '/admin/products/new', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30' },
  { id: 'donate', icon: Heart, title: 'Recevoir des dons', desc: 'Campagnes de collecte de fonds', route: '/admin/campaigns/new', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30' },
  { id: 'program', icon: BookOpen, title: 'Lancer un programme', desc: 'Formations structurées avec modules', route: '/admin/programs', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
  { id: 'affiliate', icon: Users, title: 'Activer l\'affiliation', desc: 'Permettre à vos membres de promouvoir', route: '/admin/affiliation', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' },
];

interface OrgOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

export function OrgOnboardingWizard({ open, onClose }: OrgOnboardingWizardProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleStart = () => {
    // Navigate to the first selected goal
    const first = GOALS.find(g => selected.includes(g.id));
    onClose();
    if (first) {
      navigate(first.route);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-3xl border border-border shadow-elevated max-w-lg w-full p-6 sm:p-8 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="h-12 w-12 mx-auto rounded-2xl gold-gradient flex items-center justify-center shadow-gold mb-4">
            <Check className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">🎉 Organisation créée !</h2>
          <p className="text-sm text-muted-foreground mt-1">Que souhaitez-vous faire en premier ?</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {GOALS.map(g => (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={cn(
                'p-4 rounded-2xl border-2 text-left transition-all space-y-2',
                selected.includes(g.id)
                  ? `bg-gradient-to-br ${g.color} border-primary shadow-card`
                  : 'border-border bg-card hover:border-muted-foreground/40'
              )}
            >
              <g.icon className={cn('h-5 w-5', selected.includes(g.id) ? 'text-primary' : 'text-muted-foreground')} />
              <p className="font-semibold text-sm">{g.title}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{g.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Plus tard
          </Button>
          <Button
            className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold gap-2"
            onClick={handleStart}
          >
            C'est parti <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
