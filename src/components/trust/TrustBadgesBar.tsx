import { motion } from 'framer-motion';
import { Shield, Lock, CreditCard, Fingerprint, HeadphonesIcon } from 'lucide-react';

const BADGES = [
  { icon: Shield, label: 'Paiements sécurisés', desc: 'SSL 256-bit' },
  { icon: Lock, label: 'Données protégées', desc: 'Conformité RGPD' },
  { icon: CreditCard, label: 'Mobile Money', desc: 'Orange, MTN, Wave' },
  { icon: Fingerprint, label: 'Anti-fraude', desc: 'Triple vérification' },
  { icon: HeadphonesIcon, label: 'Support réactif', desc: 'Réponse < 24h' },
];

/**
 * TrustBadgesBar — horizontal scroll of trust signals.
 * Used on landing pages, checkout, and product pages.
 */
export function TrustBadgesBar({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="overflow-x-auto scrollbar-hide"
    >
      <div className={`flex gap-3 ${compact ? 'justify-center flex-wrap' : 'min-w-max'}`}>
        {BADGES.map(b => (
          <div
            key={b.label}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card/50 shrink-0"
          >
            <b.icon className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-[11px] font-bold leading-tight">{b.label}</p>
              {!compact && <p className="text-[9px] text-muted-foreground">{b.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
