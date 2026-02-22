import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Organization } from '@/types/database';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const categoryLabels: Record<string, string> = {
  church: 'Organisation',
  ministry: 'Association',
  leader: 'Leader',
  ngo: 'ONG',
  community: 'Communauté',
  other: 'Autre',
};

const categoryColors: Record<string, string> = {
  church: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  ministry: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  leader: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  ngo: 'bg-green-500/15 text-green-600 dark:text-green-400',
  community: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  other: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
};

interface OrgCardProps {
  org: Organization;
  index?: number;
}

export function OrgCard({ org, index = 0 }: OrgCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinOrg, isMemberOf } = useOrg();
  const { toast } = useToast();
  const [joining, setJoining] = useState(false);
  const isMember = isMemberOf(org.id);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate('/auth'); return; }
    if (isMember) return;
    setJoining(true);
    const { error } = await joinOrg(org.id);
    setJoining(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Vous avez rejoint ${org.name} !`, description: 'Bienvenue dans la communauté.' });
      navigate('/feed');
    }
  };

  return (
    <div
      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer hover:-translate-y-0.5 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
      onClick={() => navigate(`/org/${org.slug}`)}
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        {org.banner_url ? (
          <img
            src={org.banner_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full hero-gradient opacity-60" />
        )}
        {/* Verified badge */}
        {org.is_verified && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-4 w-4 text-primary drop-shadow" />
          </div>
        )}
        {/* Category badge on banner */}
        <div className="absolute bottom-2 right-2">
          <Badge
            variant="secondary"
            className={cn('text-[10px] px-1.5 py-0 border-0 backdrop-blur-sm', categoryColors[org.category])}
          >
            {categoryLabels[org.category] || org.category}
          </Badge>
        </div>
      </div>

      {/* Logo + Info row */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-start gap-3 mb-2">
          {/* Logo — fully visible, not overlapping */}
          <div className="h-14 w-14 rounded-xl border-2 border-border shadow-sm overflow-hidden bg-card shrink-0">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gold-gradient flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  {org.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name + description */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1 flex items-center gap-1">
              {org.name}
              {org.is_verified && (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 inline" />
              )}
            </h3>
            {org.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                {org.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Communauté sur Siteviral</p>
            )}
          </div>
        </div>

        {/* Footer: country + join */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          {org.country && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{org.country}</span>
            </div>
          )}
          {!org.country && <div />}
          <Button
            size="sm"
            variant={isMember ? 'secondary' : 'default'}
            onClick={handleJoin}
            disabled={joining || isMember}
            className={cn(
              'h-7 text-xs px-4 rounded-full',
              !isMember && 'gold-gradient text-primary-foreground border-0 shadow-gold hover:opacity-90'
            )}
          >
            {isMember ? '✓ Rejoint' : joining ? '...' : 'Rejoindre'}
          </Button>
        </div>
      </div>
    </div>
  );
}
