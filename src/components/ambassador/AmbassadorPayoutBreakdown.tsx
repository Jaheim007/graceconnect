import { Button } from '@/components/ui/button';
import { DashboardSection } from '@/components/ui/DashboardSection';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { formatCurrency } from '@/lib/currency';
import { ArrowRight, Wallet, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const MIN_PAYOUT_XOF = 10000;

export interface AmbassadorPayoutEntry {
  orgId: string;
  orgName: string;
  amount: number;
  currency: string;
  salesCount: number;
}

interface AmbassadorPayoutBreakdownProps {
  entries: AmbassadorPayoutEntry[];
  isFr: boolean;
  locale: string;
  requestingPayout: string | null;
  onRequestPayout: (orgId: string) => void;
  onOpenDetails: () => void;
}

export function AmbassadorPayoutBreakdown({
  entries,
  isFr,
  locale,
  requestingPayout,
  onRequestPayout,
  onOpenDetails,
}: AmbassadorPayoutBreakdownProps) {
  if (!entries.length) return null;

  const hasMultipleOrganizations = entries.length > 1;

  return (
    <DashboardSection
      title={isFr ? 'Retirer mes gains' : 'Withdraw earnings'}
      icon={Wallet}
      subtitle={
        hasMultipleOrganizations
          ? isFr
            ? 'Le solde affiché est juste, mais il est réparti entre plusieurs organisations. Chaque retrait est envoyé séparément.'
            : 'The displayed balance is correct, but it is split across multiple organizations. Each withdrawal is submitted separately.'
          : isFr
            ? 'Votre solde disponible est prêt à être retiré.'
            : 'Your available balance is ready to be withdrawn.'
      }
    >
      {hasMultipleOrganizations && (
        <PremiumCard variant="default" className="border-border bg-muted/40">
          <p className="text-xs text-muted-foreground">
            {isFr
              ? 'Exemple : si votre total est de 1 000 XOF et qu’il vient de deux organisations (600 + 400), vous verrez bien 1 000 XOF au total, mais il faudra faire deux demandes distinctes.'
              : 'Example: if your total is 1,000 XOF and it comes from two organizations (600 + 400), you will correctly see 1,000 XOF in total, but you must submit two separate requests.'}
          </p>
        </PremiumCard>
      )}

      <div className="space-y-2">
        {entries.map((entry) => {
          const minThreshold = MIN_PAYOUT_XOF; // TODO: convert if currency !== XOF
          const belowMin = entry.amount < minThreshold;
          const progressPct = Math.min(100, Math.round((entry.amount / minThreshold) * 100));

          return (
            <PremiumCard key={entry.orgId} variant="default" noPadding className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold truncate">{entry.orgName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(entry.amount, entry.currency, locale)}
                    {' · '}
                    {entry.salesCount}{' '}
                    {isFr
                      ? entry.salesCount > 1
                        ? 'commissions prêtes'
                        : 'commission prête'
                      : entry.salesCount > 1
                        ? 'commissions ready'
                        : 'commission ready'}
                  </p>
                  {belowMin && (
                    <div className="space-y-1">
                      <Progress value={progressPct} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        {isFr
                          ? `Min. ${minThreshold.toLocaleString('fr-FR')} ${entry.currency} · ${progressPct}%`
                          : `Min. ${minThreshold.toLocaleString('en')} ${entry.currency} · ${progressPct}%`}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={requestingPayout === entry.orgId || belowMin}
                  onClick={() => onRequestPayout(entry.orgId)}
                >
                  {requestingPayout === entry.orgId
                    ? isFr
                      ? 'Envoi…'
                      : 'Sending…'
                    : isFr
                      ? 'Retirer'
                      : 'Withdraw'}
                </Button>
              </div>
            </PremiumCard>
          );
        })}
      </div>

      {hasMultipleOrganizations && (
        <Button variant="outline" className="w-full gap-2" onClick={onOpenDetails}>
          {isFr ? 'Voir tous les détails' : 'View full details'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </DashboardSection>
  );
}
