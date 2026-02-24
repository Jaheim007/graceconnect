import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgLeaderboard, useMyPoints, useMyBadges, useOrgBadges, getLevel } from '@/hooks/useGamificationEngine';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Medal, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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

  const lvl = getLevel(myPoints?.points || 0);
  const isFr = locale === 'fr';

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
        {/* My stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{isFr ? 'Niveau' : 'Level'} {lvl.level}</h2>
              <p className="text-xs text-muted-foreground">{myPoints?.points || 0} {isFr ? 'points' : 'points'}</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs">
              <Star className="h-3 w-3 mr-1" />
              {isFr ? 'Rang' : 'Rank'} #{(leaderboard.findIndex((l: any) => l.user_id === user?.id) + 1) || '—'}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{isFr ? 'Niveau' : 'Level'} {lvl.level}</span>
              <span>{isFr ? 'Niveau' : 'Level'} {lvl.level + 1}</span>
            </div>
            <Progress value={lvl.progress} className="h-2" />
            <p className="text-[10px] text-muted-foreground text-right">
              {lvl.nextMin - (myPoints?.points || 0)} {isFr ? 'pts restants' : 'pts remaining'}
            </p>
          </div>
        </motion.div>

        {/* My badges */}
        {(myBadges.length > 0 || orgBadges.length > 0) && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              {isFr ? 'Badges' : 'Badges'} ({myBadges.length}/{orgBadges.length})
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {orgBadges.map((badge: any) => {
                const earned = myBadges.some((mb: any) => mb.badge_id === badge.id);
                return (
                  <div key={badge.id} className={`text-center p-3 rounded-xl border transition-all ${earned ? 'border-primary bg-primary/5' : 'border-border opacity-40'}`}>
                    <span className="text-2xl">{badge.icon}</span>
                    <p className="text-[11px] font-medium mt-1 truncate">{badge.name}</p>
                    <p className="text-[9px] text-muted-foreground">{badge.condition_value} {badge.condition_type}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
