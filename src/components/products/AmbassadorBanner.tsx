import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AmbassadorBannerProps {
  orgSlug: string;
  orgName: string;
}

export function AmbassadorBanner({ orgSlug, orgName }: AmbassadorBannerProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-bold text-sm">Devenez ambassadeur et gagnez de l'argent</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Devenez ambassadeur de <strong>{orgName}</strong> : partagez ce produit et touchez une commission sur chaque vente. Aucun contenu à créer.
      </p>
      <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
        <Link to={`/org/${orgSlug}?tab=store`}>
          Devenir ambassadeur <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
