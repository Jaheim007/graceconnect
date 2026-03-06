import { motion } from 'framer-motion';
import { Share2, ArrowRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { buildShareUrlForPath } from '@/lib/shareMeta';

/**
 * Viral growth card — encourages sharing the referral/affiliate link.
 * Shows potential earnings and a 1-click share action.
 */
export function ViralLoopCard({ affiliateCode, commissionPercent = 15 }: { affiliateCode?: string; commissionPercent?: number }) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const shareUrl = affiliateCode
    ? buildShareUrlForPath(`/go/${affiliateCode}`)
    : buildShareUrlForPath('/gagner');

  const shareText = `🚀 J'utilise Siteviral pour vendre et gagner en partageant des produits numériques. Essaye aussi ! 👉 ${shareUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-card to-primary/5 p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <Share2 className="h-4.5 w-4.5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Partage & gagne 💰</p>
          <p className="text-[10px] text-muted-foreground">
            {commissionPercent}% sur chaque vente via ton lien
          </p>
        </div>
        <Badge className="bg-accent text-accent-foreground text-[10px]">
          {commissionPercent}%
        </Badge>
      </div>

      {/* Link preview */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 border border-border">
        <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{shareUrl}</span>
        <button onClick={handleCopy} className="shrink-0">
          {copied ? (
            <Check className="h-4 w-4 text-accent" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-9" onClick={handleWhatsApp}>
          💬 WhatsApp
        </Button>
        <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-9" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copié !' : 'Copier'}
        </Button>
      </div>
    </motion.div>
  );
}
