import { useMemo } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgLeaderboard, useMyPoints, useMyBadges, useOrgBadges } from '@/hooks/useGamificationEngine';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { BadgeShowcase } from '@/components/gamification/BadgeShowcase';

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { userOrgs } = useOrg();
  const { user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const orgId = userOrgs[0]?.id;

  const { data: leaderboard = [] } = useOrgLeaderboard(orgId);
  const { data: myPoints } = useMyPoints(orgId);
  const { data: myBadges = [] } = useMyBadges(orgId);
  const { data: orgBadges = [] } = useOrgBadges(orgId);

  const isFr = locale === 'fr';
  const myRank = leaderboard.findIndex((l: any) => l.user_id === user?.id) + 1;

  const earnedBadgeIds = useMemo(
    () => new Set<string>(myBadges.map((mb: any) => mb.badge_id as string)),
    [myBadges],
  );

  if (!orgId) {
    return (
      <EmptyState 
        title={isFr ? 'Rejoignez une organisation' : 'Join an organization'} 
        description={isFr ? 'Rejoignez une communauté pour voir le classement.' : 'Join a community to see the leaderboard.'}
        action={{ label: isFr ? 'Découvrir' : 'Discover', onClick: () => navigate('/discover') }}
      />
    );
  }

  return (
    <>
      <SEOHead title={isFr ? 'Classement & Badges' : 'Leaderboard & Badges'} />
      <div className="container max-w-2xl py-6 space-y-6">
        {/* XP progress */}
        <div className="relative">
          <XPProgressBar points={myPoints?.points || 0} />
          {myRank > 0 && (
            <Badge variant="outline" className="absolute top-4 right-4 text-xs">
              <Star className="h-3 w-3 mr-1" />
              {isFr ? 'Rang' : 'Rank'} #{myRank}
            </Badge>
          )}
        </div>

        {/* Badges */}
        <BadgeShowcase allBadges={orgBadges} earnedBadgeIds={earnedBadgeIds} />

        {/* Leaderboard */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            {isFr ? 'Classement' : 'Leaderboard'}
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">{isFr ? 'Aucun classement' : 'No rankings yet'}</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => {
                const isMe = entry.user_id === user?.id;
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl ${isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}
                  >
                    <span className="text-lg w-7 text-center">{RANK_ICONS[i] || `${i + 1}`}</span>
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {entry.profile?.avatar_url ? (
                        <img src={entry.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold">{(entry.profile?.display_name || '?')[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.profile?.display_name || 'User'}</p>
                      <p className="text-[10px] text-muted-foreground">{isFr ? 'Niveau' : 'Level'} {entry.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{entry.points.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
