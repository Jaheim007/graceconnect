import { useState, useMemo } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgProducts } from '@/hooks/useMonetization';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Target, Share2, Image, Tag, MessageSquare, Users, Zap, Gift, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

interface Mission {
  id: string;
  label: string;
  description: string;
  icon: typeof Target;
  check: () => boolean;
  route?: string;
}

// Deterministic weekly seed based on ISO week
function getWeekSeed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return weekNum * 7 + now.getFullYear();
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function WeeklyMissions() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const { data: media = [] } = useOrgMedia(orgId, false);
  const { data: products = [] } = useOrgProducts(orgId, false);

  // Recent activity counts for this week
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { data: weekMedia = 0 } = useQuery({
    queryKey: ['week-media', orgId, weekStart],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await db.from('media_content')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', weekStart);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: weekSales = 0 } = useQuery({
    queryKey: ['week-sales', orgId, weekStart],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await db.from('product_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId).eq('status', 'completed')
        .gte('created_at', weekStart);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: weekMembers = 0 } = useQuery({
    queryKey: ['week-members', orgId, weekStart],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await db.from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('joined_at', weekStart);
      return count || 0;
    },
    enabled: !!orgId,
  });

  // All possible missions
  const allMissions: Mission[] = useMemo(() => [
    {
      id: 'publish-content',
      label: 'Publiez un contenu cette semaine',
      description: 'Vidéo, audio ou reel — gardez votre audience engagée.',
      icon: Zap,
      check: () => weekMedia > 0,
      route: '/admin/media/new',
    },
    {
      id: 'share-whatsapp',
      label: 'Partagez un produit sur WhatsApp',
      description: 'Le partage WhatsApp convertit 4x mieux que les autres canaux.',
      icon: Share2,
      check: () => false,
    },
    {
      id: 'add-preview',
      label: 'Ajoutez des images de preview',
      description: 'Les produits avec images de preview se vendent 30% mieux.',
      icon: Image,
      check: () => products.some(p => (p as any).preview_images?.length > 0),
      route: '/admin/products',
    },
    {
      id: 'get-sale',
      label: 'Obtenez une vente cette semaine',
      description: 'Chaque vente renforce votre crédibilité et votre classement.',
      icon: Tag,
      check: () => weekSales > 0,
    },
    {
      id: 'get-member',
      label: 'Gagnez un nouveau membre',
      description: 'Plus de membres = plus de portée pour votre contenu.',
      icon: Users,
      check: () => weekMembers > 0,
    },
    {
      id: 'update-description',
      label: 'Améliorez une description produit',
      description: 'Ajoutez des détails, des bénéfices et des emojis pour convertir.',
      icon: MessageSquare,
      check: () => products.some(p => (p.description?.length || 0) > 100),
      route: '/admin/products',
    },
    {
      id: 'create-bundle',
      label: 'Créez un bundle ou promotion',
      description: 'Les bundles augmentent le panier moyen de 25%.',
      icon: Gift,
      check: () => products.some(p => (p as any).is_bundle),
      route: '/admin/products/new',
    },
  ], [weekMedia, weekSales, weekMembers, products]);

  // Pick 4 missions for this week (deterministic)
  const weekMissions = useMemo(() => {
    return shuffleWithSeed(allMissions, getWeekSeed()).slice(0, 4);
  }, [allMissions]);

  const completed = weekMissions.filter(m => m.check()).length;
  const total = weekMissions.length;

  // Calculate days left in week
  const daysLeft = 7 - new Date().getDay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Objectifs de la semaine</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {daysLeft}j restants
          </span>
          <span className="text-xs font-bold text-primary">{completed}/{total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${(completed / total) * 100}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      <div className="space-y-1.5">
        {weekMissions.map((mission) => {
          const Icon = mission.icon;
          const done = mission.check();
          return (
            <div
              key={mission.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                done ? 'bg-primary/5' : 'hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                done ? 'bg-primary/15' : 'bg-muted'
              )}>
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Icon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', done && 'line-through text-muted-foreground')}>{mission.label}</p>
                {!done && (
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{mission.description}</p>
                )}
              </div>
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {completed === total && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-amber-500/10 border border-primary/20 text-center"
        >
          <p className="text-xs font-bold text-primary">🏆 Tous les objectifs accomplis ! Bravo !</p>
        </motion.div>
      )}
    </motion.div>
  );
}
