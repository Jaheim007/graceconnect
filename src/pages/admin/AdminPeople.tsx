import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Link2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/currency';
import MembersList from '@/components/admin/people/MembersList';
import AmbassadorsList from '@/components/admin/people/AmbassadorsList';

export default function AdminPeople() {
  const { currentOrg } = useOrg();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const [search, setSearch] = useState('');
  const currency = currentOrg?.currency || 'XOF';

  const { data: members = [], isLoading: membersLoading } = useOrgMembers(currentOrg?.id);

  const { data: ambassadors = [], isLoading: ambassadorsLoading } = useQuery({
    queryKey: ['org-ambassadors', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data } = await db
        .from('affiliate_links')
        .select('id, code, user_id, clicks, conversions, total_earned, is_active, created_at')
        .eq('organization_id', currentOrg.id)
        .order('total_earned', { ascending: false });

      if (!data?.length) return [];

      const userIds = [...new Set(data.map((l: any) => l.user_id))];
      const { data: profiles } = await db
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

      return data.map((l: any) => ({
        ...l,
        profile: profileMap[l.user_id] || null,
      }));
    },
    enabled: !!currentOrg?.id,
  });

  const filteredMembers = members.filter((m: any) => {
    if (!search) return true;
    const name = m.profiles?.display_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredAmbassadors = ambassadors.filter((a: any) => {
    if (!search) return true;
    const name = a.profile?.display_name || a.code || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t('people.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('people.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('people.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-card border-border/50 rounded-xl"
        />
      </div>

      <Tabs defaultValue="ambassadors">
        <TabsList className="bg-muted/50 p-1 rounded-xl gap-1">
          <TabsTrigger value="ambassadors" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
            <Link2 className="h-3.5 w-3.5" />
            {t('people.ambassadors')} ({ambassadors.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
            <Users className="h-3.5 w-3.5" />
            {t('people.members')} ({members.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ambassadors" className="mt-5">
          <AmbassadorsList
            ambassadors={filteredAmbassadors}
            isLoading={ambassadorsLoading}
            currency={currency}
            isFr={isFr}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-5">
          <MembersList
            members={filteredMembers}
            isLoading={membersLoading}
            isFr={isFr}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
