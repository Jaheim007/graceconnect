import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

/**
 * QuickShareWidget — shows the user's active affiliate links
 * with 1-click copy for instant sharing. Appears on /gagner.
 */
export function QuickShareWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['my-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_links')
        .select('id, code, clicks, conversions, total_earned, organization_id, product_id, organizations(name, slug, logo_url)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('total_earned', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  if (!user || isLoading || links.length === 0) return null;

  const copyLink = async (code: string, id: string) => {
    const url = `https://siteviral.com/go/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('Lien copié ! Partage-le maintenant 🚀');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-accent/20 bg-card p-5"
    >
      <h3 className="text-sm font-extrabold flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-accent" /> Tes liens actifs — Partage vite !
      </h3>

      <div className="space-y-3">
        {links.map((link: any) => {
          const org = link.organizations;
          return (
            <div
              key={link.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:border-accent/30 transition-colors"
            >
              {org?.logo_url && (
                <img src={org.logo_url} alt="" className="h-8 w-8 rounded-full shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{org?.name}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                  <span>{link.clicks || 0} clics</span>
                  <span>{link.conversions || 0} ventes</span>
                  {(link.total_earned || 0) > 0 && (
                    <span className="text-accent font-bold">
                      {formatCurrency(link.total_earned, DEFAULT_CURRENCY)} gagné
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={copiedId === link.id ? 'default' : 'outline'}
                className="h-8 gap-1.5 text-xs shrink-0"
                onClick={() => copyLink(link.code, link.id)}
              >
                {copiedId === link.id ? (
                  <><Check className="h-3.5 w-3.5" /> Copié</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copier</>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-3 text-xs gap-1.5"
        onClick={() => {
          const tabsEl = document.getElementById('gagner-tabs');
          if (tabsEl) {
            tabsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const mesLiensTab = tabsEl.querySelector<HTMLButtonElement>('[value="earnings"]');
            if (mesLiensTab) setTimeout(() => mesLiensTab.click(), 400);
          }
        }}
      >
        Voir tous mes liens <ExternalLink className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
}
