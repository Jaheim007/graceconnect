import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { buildCourseShareUrl } from '@/lib/coursePreview';
import { cn } from '@/lib/utils';
import { truncateWords } from '@/lib/truncateText';

interface ShareCourseMenuProps {
  programId: string;
  title: string;
  description?: string;
  variant?: 'button' | 'icon';
  className?: string;
}

/** Copy-link + share sheet for the canonical /program/:id URL. */
export function ShareCourseMenu({ programId, title, description = '', variant = 'button', className }: ShareCourseMenuProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = buildCourseShareUrl(programId);
  const text = `${title}${description ? ` — ${truncateWords(description, 120)}` : ''}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: isFr ? 'Lien copié' : 'Link copied', description: url });
    } catch {
      toast({ title: isFr ? 'Copie impossible' : 'Copy failed', variant: 'destructive' });
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch { /* user cancelled */ }
    }
    copy();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', className)}
            title={isFr ? 'Partager' : 'Share'}
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-3 w-3" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className={cn('gap-1.5 text-xs', className)}>
            <Share2 className="h-3.5 w-3.5" /> {isFr ? 'Partager' : 'Share'}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground break-all">{url}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copy} className="gap-2">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          {isFr ? 'Copier le lien' : 'Copy link'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={nativeShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          {isFr ? 'Partager…' : 'Share…'}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2">
          <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
            <Send className="h-4 w-4" /> Telegram
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
