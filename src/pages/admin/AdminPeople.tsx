import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Link2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminPeople() {
  const { currentOrg } = useOrg();
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  // Members
  const { data: members = [], isLoading: membersLoading } = useOrgMembers(currentOrg?.id);

  // Ambassadors (affiliate links for this org)
  const { data: ambassadors = [], isLoading: ambassadorsLoading } = useQuery({
    queryKey: ['org-ambassadors', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db
        .from('affiliate_links')
        .select('*, profiles:user_id(display_name, avatar_url, email)')
        .eq('organization_id', currentOrg.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const filteredMembers = members.filter((m: any) => {
    if (!search) return true;
    const name = m.profiles?.display_name || m.profiles?.email || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredAmbassadors = ambassadors.filter((a: any) => {
    if (!search) return true;
    const name = a.profiles?.display_name || a.profiles?.email || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t('people.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('people.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('people.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {t('people.members')} ({members.length})
          </TabsTrigger>
          <TabsTrigger value="ambassadors" className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            {t('people.ambassadors')} ({ambassadors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('people.no_members')}</p>
              <p className="text-xs mt-1">{t('people.no_members_desc')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member: any, i: number) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {member.profiles?.avatar_url ? (
                      <img src={member.profiles.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (member.profiles?.display_name?.[0] || '?').toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.profiles?.display_name || 'Membre'}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.profiles?.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn(
                      'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                      member.role === 'owner' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      member.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {member.role}
                    </span>
                    {member.joined_at && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(member.joined_at), 'dd/MM/yy')}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ambassadors" className="mt-4">
          {ambassadorsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : filteredAmbassadors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('people.no_ambassadors')}</p>
              <p className="text-xs mt-1">{t('people.no_ambassadors_desc')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAmbassadors.map((ambassador: any, i: number) => (
                <motion.div
                  key={ambassador.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-500 shrink-0">
                    {ambassador.profiles?.avatar_url ? (
                      <img src={ambassador.profiles.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (ambassador.profiles?.display_name?.[0] || '?').toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ambassador.profiles?.display_name || 'Ambassadeur'}</p>
                    <p className="text-xs text-muted-foreground truncate">Code: {ambassador.code}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-500">{ambassador.conversions || 0} <span className="text-xs font-normal text-muted-foreground">conv.</span></p>
                    <p className="text-[10px] text-muted-foreground">{ambassador.clicks || 0} clics</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
