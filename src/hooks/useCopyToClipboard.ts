import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseCopyOptions {
  /** Toast message on success */
  successMessage?: string;
  /** Duration before "copied" resets (ms) */
  resetDelay?: number;
}

/**
 * useCopyToClipboard — Copy text to clipboard with toast feedback.
 *
 * Usage:
 *   const { copy, copied } = useCopyToClipboard();
 *   <Button onClick={() => copy('https://...')}>
 *     {copied ? 'Copié ✓' : 'Copier'}
 *   </Button>
 */
export function useCopyToClipboard(options: UseCopyOptions = {}) {
  const { successMessage = 'Copié dans le presse-papiers !', resetDelay = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast({ title: successMessage });
        setTimeout(() => setCopied(false), resetDelay);
        return true;
      } catch (err) {
        // Fallback for older browsers
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopied(true);
          toast({ title: successMessage });
          setTimeout(() => setCopied(false), resetDelay);
          return true;
        } catch {
          toast({ title: 'Échec de la copie', variant: 'destructive' });
          return false;
        }
      }
    },
    [successMessage, resetDelay, toast],
  );

  return { copy, copied };
}
