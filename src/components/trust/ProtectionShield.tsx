import { Shield, Lock, Eye, CreditCard, UserCheck, RefreshCw, Scale, Bell, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

const PROTECTIONS = {
  fr: [
    { icon: Lock, label: 'Chiffrement SSL/TLS', desc: 'Toutes les données sont chiffrées de bout en bout' },
    { icon: CreditCard, label: 'Paiement sécurisé', desc: 'Stripe & Paystack certifiés PCI-DSS' },
    { icon: UserCheck, label: 'Identité vérifiée', desc: 'Vérification d\'identité pour les vendeurs' },
    { icon: RefreshCw, label: 'Remboursement 7j', desc: 'Garantie satisfait ou remboursé' },
    { icon: Scale, label: 'Anti-fraude', desc: 'Détection automatique des transactions suspectes' },
    { icon: Eye, label: 'Transparence', desc: 'Commissions et frais clairement affichés' },
    { icon: Bell, label: 'Alertes en temps réel', desc: 'Notifications de chaque transaction' },
    { icon: FileCheck, label: 'Conformité RGPD', desc: 'Protection des données personnelles' },
  ],
  en: [
    { icon: Lock, label: 'SSL/TLS Encryption', desc: 'All data is encrypted end-to-end' },
    { icon: CreditCard, label: 'Secure Payment', desc: 'Stripe & Paystack PCI-DSS certified' },
    { icon: UserCheck, label: 'Verified Identity', desc: 'Identity verification for sellers' },
    { icon: RefreshCw, label: '7-day Refund', desc: 'Money-back guarantee' },
    { icon: Scale, label: 'Anti-fraud', desc: 'Automatic detection of suspicious transactions' },
    { icon: Eye, label: 'Transparency', desc: 'Commissions and fees clearly displayed' },
    { icon: Bell, label: 'Real-time Alerts', desc: 'Notifications for every transaction' },
    { icon: FileCheck, label: 'GDPR Compliant', desc: 'Personal data protection' },
  ],
};

export function ProtectionShield({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const items = isFr ? PROTECTIONS.fr : PROTECTIONS.en;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <Shield className="h-3.5 w-3.5 text-accent" />
        {['SSL', 'PCI-DSS', isFr ? 'ID Vérifié' : 'ID Verified', 'Anti-fraud', isFr ? 'RGPD' : 'GDPR'].map(tag => (
          <span key={tag} className="font-medium">{tag}</span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-accent" />
        <h3 className="font-extrabold text-sm">{isFr ? '8 couches de protection' : '8 layers of protection'}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card"
          >
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <p.icon className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xs font-bold">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
