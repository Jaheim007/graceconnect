import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Organization } from '@/types/database';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
      toast({ title: 'Failed to join', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Joined ${org.name}!`, description: 'You are now a member.' });
    }
  };

  return (
    <div
      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer hover:-translate-y-0.5 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
      onClick={() => navigate(`/org/${org.slug}`)}
    >
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        {org.banner_url ? (
          <img
            src={org.banner_url}
            alt={org.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full hero-gradient opacity-60" />
        )}

        {/* Logo */}
        <div className="absolute -bottom-5 left-4 h-10 w-10 rounded-xl border-2 border-card shadow-card overflow-hidden bg-card">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gold-gradient flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                {org.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Verified badge */}
        {org.is_verified && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="h-4 w-4 text-primary drop-shadow" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-7 px-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1">{org.name}</h3>
          <Badge
            variant="secondary"
            className={cn('text-[10px] px-1.5 py-0 shrink-0 border-0', categoryColors[org.category])}
          >
            {org.category}
          </Badge>
        </div>

        {org.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {org.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{org.country}</span>
          </div>
          <Button
            size="sm"
            variant={isMember ? 'secondary' : 'default'}
            onClick={handleJoin}
            disabled={joining || isMember}
            className={cn(
              'h-7 text-xs px-3',
              !isMember && 'gold-gradient text-primary-foreground border-0 shadow-gold hover:opacity-90'
            )}
          >
            {isMember ? '✓ Joined' : joining ? 'Joining...' : 'Join'}
          </Button>
        </div>
      </div>
    </div>
  );
}
