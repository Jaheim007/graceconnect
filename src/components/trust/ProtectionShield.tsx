import { Shield, Lock, Eye, CreditCard, UserCheck, RefreshCw, Scale, Bell, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const PROTECTIONS = [
  { icon: Lock, label: 'Chiffrement SSL/TLS', desc: 'Toutes les données sont chiffrées de bout en bout' },
  { icon: CreditCard, label: 'Paiement sécurisé', desc: 'Stripe & Paystack certifiés PCI-DSS' },
  { icon: UserCheck, label: 'KYC obligatoire', desc: 'Vérification d\'identité pour les vendeurs' },
  { icon: RefreshCw, label: 'Remboursement 7j', desc: 'Garantie satisfait ou remboursé' },
  { icon: Scale, label: 'Anti-fraude', desc: 'Détection automatique des transactions suspectes' },
  { icon: Eye, label: 'Transparence', desc: 'Commissions et frais clairement affichés' },
  { icon: Bell, label: 'Alertes en temps réel', desc: 'Notifications de chaque transaction' },
  { icon: FileCheck, label: 'Conformité RGPD', desc: 'Protection des données personnelles' },
];

export function ProtectionShield({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <Shield className="h-3.5 w-3.5 text-accent" />
        {['SSL', 'PCI-DSS', 'KYC', 'Anti-fraude', 'RGPD'].map(tag => (
          <span key={tag} className="font-medium">{tag}</span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-accent" />
        <h3 className="font-extrabold text-sm">8 couches de protection</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PROTECTIONS.map((p, i) => (
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
