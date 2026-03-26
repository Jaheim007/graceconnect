import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, MessageCircle, Share2, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Pre-written motivational viral messages users can copy & share.
 * Designed for WhatsApp, Facebook, TikTok captions.
 */

interface ViralMessage {
  emoji: string;
  text: string;
  category: 'beginner' | 'progress' | 'proof' | 'education';
}

export function ViralShareMessages() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const messages: ViralMessage[] = isFr ? [
    { emoji: '🔥', text: 'Je viens de faire ma première vente sur SiteViral ! Si moi j\'ai pu, toi aussi tu peux. Inscris-toi ici → siteviral.com', category: 'beginner' },
    { emoji: '💰', text: 'J\'ai retiré mon premier gain sur SiteViral. C\'est réel, c\'est rapide, c\'est simple. Commence maintenant → siteviral.com', category: 'proof' },
    { emoji: '🚀', text: 'Je ne croyais pas que c\'était possible… Maintenant je gagne de l\'argent juste en partageant des liens. Rejoinds-moi → siteviral.com', category: 'beginner' },
    { emoji: '📚', text: 'J\'ai écrit un livre en 5 minutes avec l\'IA de SiteViral et il se vend déjà ! Essaie toi aussi → siteviral.com/ecrire', category: 'education' },
    { emoji: '💪', text: 'Tu veux gagner de l\'argent en ligne sans rien créer ? Partage des produits et touche des commissions → siteviral.com/gagner', category: 'education' },
    { emoji: '⭐', text: 'Mon produit commence à bien marcher sur SiteViral ! Prochain objectif : doubler mes ventes ce mois. Tu peux aussi → siteviral.com', category: 'progress' },
    { emoji: '🎯', text: 'Voici ce que j\'ai gagné en 1 semaine en partageant sur WhatsApp. C\'est gratuit et ça marche → siteviral.com', category: 'proof' },
    { emoji: '🤝', text: 'Rejoins l\'armée qui gagne en partageant. Pas besoin de créer, juste de partager → siteviral.com/gagner', category: 'beginner' },
    { emoji: '✍️', text: 'Les mamans, vous avez tant de choses à écrire : votre vie, vos enfants, votre expérience. Écrivez et vendez → siteviral.com/ecrire', category: 'education' },
    { emoji: '⛪', text: 'Pasteurs, monétisez votre impact spirituel. Créez des ebooks et formations en 5 minutes → siteviral.com/ecrire', category: 'education' },
  ] : [
    { emoji: '🔥', text: 'I just made my first sale on SiteViral! If I could do it, so can you. Sign up here → siteviral.com', category: 'beginner' },
    { emoji: '💰', text: 'I withdrew my first earnings from SiteViral. It\'s real, it\'s fast, it\'s simple. Start now → siteviral.com', category: 'proof' },
    { emoji: '🚀', text: 'I didn\'t believe it was possible… Now I earn money just by sharing links. Join me → siteviral.com', category: 'beginner' },
    { emoji: '📚', text: 'I wrote a book in 5 minutes with SiteViral\'s AI and it\'s already selling! Try it → siteviral.com/ecrire', category: 'education' },
    { emoji: '💪', text: 'Want to earn money online without creating anything? Share products and earn commissions → siteviral.com/gagner', category: 'education' },
    { emoji: '⭐', text: 'My product is doing well on SiteViral! Next goal: double my sales. You can too → siteviral.com', category: 'progress' },
    { emoji: '🎯', text: 'Here\'s what I earned in 1 week sharing on WhatsApp. It\'s free and it works → siteviral.com', category: 'proof' },
    { emoji: '🤝', text: 'Join the army that earns by sharing. No need to create, just share → siteviral.com/gagner', category: 'beginner' },
    { emoji: '✍️', text: 'Moms, you have so much to write: your life, your kids, your experience. Write and sell → siteviral.com/ecrire', category: 'education' },
    { emoji: '⛪', text: 'Pastors, monetize your spiritual impact. Create ebooks and courses in 5 minutes → siteviral.com/ecrire', category: 'education' },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast({ title: isFr ? 'Copié !' : 'Copied!', description: isFr ? 'Colle ce message sur WhatsApp, Facebook ou TikTok' : 'Paste this message on WhatsApp, Facebook or TikTok' });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-extrabold">{isFr ? 'Messages prêts à partager' : 'Ready-to-share messages'}</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        {isFr ? 'Copie et colle ces messages sur WhatsApp, Facebook, TikTok ou Instagram pour attirer des clients.' : 'Copy and paste these messages on WhatsApp, Facebook, TikTok or Instagram to attract customers.'}
      </p>

      <div className="space-y-2">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
          >
            <p className="text-sm leading-relaxed mb-2">
              <span className="mr-1">{msg.emoji}</span>
              {msg.text}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1"
                onClick={() => handleCopy(msg.text, i)}
              >
                {copiedIdx === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedIdx === i ? (isFr ? 'Copié' : 'Copied') : (isFr ? 'Copier' : 'Copy')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={() => handleWhatsApp(msg.text)}
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
