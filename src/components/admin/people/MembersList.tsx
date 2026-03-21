import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface Props {
  members: any[];
  isLoading: boolean;
  isFr: boolean;
}

const roleConfig: Record<string, { bg: string; text: string }> = {
  owner: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  admin: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
  editor: { bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400' },
  member: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

export default function MembersList({ members, isLoading, isFr }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[72px] rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Users className="h-7 w-7 opacity-40" />
        </div>
        <p className="text-sm font-semibold">{isFr ? 'Aucun membre' : 'No members yet'}</p>
        <p className="text-xs mt-1 max-w-xs mx-auto opacity-70">
          {isFr ? 'Les membres apparaîtront ici lorsqu\'ils rejoindront votre communauté.' : 'Members will appear here when they join your community.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member: any, i: number) => {
        const role = member.role || 'member';
        const config = roleConfig[role] || roleConfig.member;
        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 30 }}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            {/* Avatar */}
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden ring-2 ring-background shadow-sm">
              {member.profiles?.avatar_url ? (
                <img src={member.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (member.profiles?.display_name?.[0] || '?').toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {member.profiles?.display_name || (isFr ? 'Membre' : 'Member')}
              </p>
              {member.joined_at && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isFr ? 'Rejoint le' : 'Joined'} {format(new Date(member.joined_at), 'dd/MM/yyyy')}
                </p>
              )}
            </div>

            {/* Role badge */}
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg shrink-0',
              config.bg, config.text
            )}>
              {role}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
