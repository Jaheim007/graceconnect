import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

interface AmbassadorBannerProps {
  orgSlug: string;
  orgName: string;
}

export function AmbassadorBanner({ orgSlug, orgName }: AmbassadorBannerProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        
        <h3 className="font-bold text-sm">{isFr ? 'Devenez ambassadeur et gagnez de l\'argent' : 'Become an ambassador and earn money'}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {isFr
          ? <>Devenez ambassadeur de <strong>{orgName}</strong> : partagez ce produit et touchez une commission sur chaque vente. Aucun contenu à créer.</>
          : <>Become an ambassador for <strong>{orgName}</strong>: share this product and earn a commission on every sale. No content to create.</>}
      </p>
      <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
        <Link to={`/org/${orgSlug}?tab=store`}>
          {isFr ? 'Devenir ambassadeur' : 'Become an ambassador'} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
