import { useState } from 'react';
import { DonationCampaign } from '@/types/database';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

interface DonateModalProps {
  campaign: DonationCampaign | null;
  open: boolean;
  onClose: () => void;
}

export function DonateModal({ campaign, open, onClose }: DonateModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!campaign) return null;

  const handleDonate = async () => {
    if (!amount || Number(amount) < 100) {
      toast({ title: 'Invalid amount', description: 'Minimum donation is 100 XOF.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    // Payment integration placeholder — Paystack would be initialized here
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    toast({
      title: '🙏 Thank you!',
      description: `Your donation of ${Number(amount).toLocaleString('fr-FR')} XOF has been received.`,
    });
    onClose();
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' XOF';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Donate to {campaign.title}
          </DialogTitle>
          <DialogDescription>
            Your contribution supports this campaign. Currency: {campaign.currency || 'XOF'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preset amounts */}
          <div>
            <Label className="text-xs mb-2 block">Choose amount</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_AMOUNTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className={`text-xs py-1.5 rounded-lg border transition-all ${
                    amount === String(p)
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {fmt(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <Label htmlFor="amount" className="text-xs">Or enter custom amount (XOF)</Label>
            <Input
              id="amount"
              type="number"
              min={100}
              placeholder="e.g. 3000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Donor info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dname" className="text-xs">Name (optional)</Label>
              <Input id="dname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="demail" className="text-xs">Email (optional)</Label>
              <Input id="demail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1.5" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Payments secured by Paystack
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleDonate}
            disabled={loading || !amount}
            className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold"
          >
            {loading ? 'Processing...' : `Donate ${amount ? fmt(Number(amount)) : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
