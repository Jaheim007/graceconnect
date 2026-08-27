import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Shield, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WelcomeBannerProps {
  firstName: string;
  totalUsers: number;
  activeOrgs: number;
  pendingAlerts: number;
  platformFees: string;
}

export function WelcomeBanner({ firstName, totalUsers, activeOrgs, pendingAlerts, platformFees }: WelcomeBannerProps) {
  const quickInfo = [
    { label: 'Active Orgs', value: activeOrgs, icon: Shield },
    { label: 'Total Users', value: totalUsers, icon: Activity },
    { label: 'Pending Alerts', value: pendingAlerts, icon: Zap, highlight: pendingAlerts > 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent border border-primary/10 p-6 sm:p-8"
    >
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 bg-background/60 border-border/60">
              <Clock className="h-3 w-3" />
              {format(new Date(), 'dd MMM yyyy · HH:mm')}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening on <span className="font-semibold text-foreground">SiteViral</span> today · Revenue: <span className="font-semibold text-emerald-600">{platformFees}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {quickInfo.map((item) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl bg-background/70 border border-border/50 backdrop-blur-xs',
                item.highlight && 'border-amber-500/30 bg-amber-500/5'
              )}
            >
              <item.icon className={cn('h-3.5 w-3.5', item.highlight ? 'text-amber-500' : 'text-muted-foreground')} />
              <div>
                <p className={cn('text-sm font-bold leading-none', item.highlight && 'text-amber-600')}>{item.value}</p>
                <p className="text-[9px] text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
