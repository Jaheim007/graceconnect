import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Link2, Search, ShoppingBag, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MembersList from '@/components/admin/people/MembersList';
import AmbassadorsList from '@/components/admin/people/AmbassadorsList';
import BuyersList from '@/components/admin/people/BuyersList';
import DonorsList from '@/components/admin/people/DonorsList';

export default function AdminPeople() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
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

  // ═══ BUYERS: aggregate from product_purchases ═══
  const { data: buyers = [], isLoading: buyersLoading } = useQuery({
    queryKey: ['org-buyers', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data: purchases } = await db
        .from('product_purchases')
        .select('id, user_id, buyer_email, buyer_name, amount, currency, created_at, digital_products!inner(title, organization_id)')
        .eq('digital_products.organization_id', currentOrg.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (!purchases?.length) return [];

      // Aggregate by user_id or email
      const map = new Map<string, any>();
      for (const p of purchases as any[]) {
        const key = p.user_id || p.buyer_email || p.id;
        if (!map.has(key)) {
          map.set(key, {
            user_id: p.user_id,
            email: p.buyer_email,
            display_name: p.buyer_name,
            avatar_url: null,
            total_spent: 0,
            purchase_count: 0,
            last_purchase_at: p.created_at,
            products: [],
          });
        }
        const entry = map.get(key)!;
        entry.total_spent += p.amount || 0;
        entry.purchase_count += 1;
        if (p.digital_products?.title && !entry.products.includes(p.digital_products.title)) {
          entry.products.push(p.digital_products.title);
        }
      }

      // Enrich with profile data
      const userIds = [...new Set([...map.values()].filter(b => b.user_id).map(b => b.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await db
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);
        const profileMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
        for (const buyer of map.values()) {
          if (buyer.user_id && profileMap[buyer.user_id]) {
            buyer.display_name = profileMap[buyer.user_id].display_name || buyer.display_name;
            buyer.avatar_url = profileMap[buyer.user_id].avatar_url;
          }
        }
      }

      return [...map.values()].sort((a, b) => b.total_spent - a.total_spent);
    },
    enabled: !!currentOrg?.id,
  });

  // ═══ DONORS: aggregate from donations ═══
  const { data: donors = [], isLoading: donorsLoading } = useQuery({
    queryKey: ['org-donors', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data: donations } = await db
        .from('donations')
        .select('id, user_id, donor_email, donor_name, amount, currency, created_at, status')
        .eq('organization_id', currentOrg.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (!donations?.length) return [];

      const map = new Map<string, any>();
      for (const d of donations as any[]) {
        const key = d.user_id || d.donor_email || d.id;
        if (!map.has(key)) {
          map.set(key, {
            donor_key: key,
            user_id: d.user_id,
            email: d.donor_email,
            display_name: d.donor_name,
            avatar_url: null,
            total_donated: 0,
            donation_count: 0,
            last_donation_at: d.created_at,
          });
        }
        const entry = map.get(key)!;
        entry.total_donated += d.amount || 0;
        entry.donation_count += 1;
      }

      // Enrich with profile data
      const userIds = [...new Set([...map.values()].filter(d => d.user_id).map(d => d.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await db
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);
        const profileMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
        for (const donor of map.values()) {
          if (donor.user_id && profileMap[donor.user_id]) {
            donor.display_name = profileMap[donor.user_id].display_name || donor.display_name;
            donor.avatar_url = profileMap[donor.user_id].avatar_url;
          }
        }
      }

      return [...map.values()].sort((a, b) => b.total_donated - a.total_donated);
    },
    enabled: !!currentOrg?.id,
  });

  const filteredMembers = members.filter((m: any) => {
    if (m.user_id === user?.id) return false;
    if (!search) return true;
    const name = m.profiles?.display_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredAmbassadors = ambassadors.filter((a: any) => {
    if (!search) return true;
    const name = a.profile?.display_name || a.code || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredBuyers = buyers.filter((b: any) => {
    if (!search) return true;
    const name = b.display_name || b.email || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredDonors = donors.filter((d: any) => {
    if (!search) return true;
    const name = d.display_name || d.email || '';
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

      <Tabs defaultValue="buyers">
        <TabsList className="bg-muted/50 p-1 rounded-xl gap-1 flex-wrap h-auto">
          <TabsTrigger value="buyers" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
            <ShoppingBag className="h-3.5 w-3.5" />
            {isFr ? 'Acheteurs' : 'Buyers'} ({buyers.length})
          </TabsTrigger>
          <TabsTrigger value="donors" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
            <Heart className="h-3.5 w-3.5" />
            {isFr ? 'Donateurs' : 'Donors'} ({donors.length})
          </TabsTrigger>
          <TabsTrigger value="ambassadors" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
            <Link2 className="h-3.5 w-3.5" />
            {t('people.ambassadors')} ({ambassadors.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            {t('people.members')} ({members.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buyers" className="mt-5">
          <BuyersList
            buyers={filteredBuyers}
            isLoading={buyersLoading}
            currency={currency}
            isFr={isFr}
          />
        </TabsContent>

        <TabsContent value="donors" className="mt-5">
          <DonorsList
            donors={filteredDonors}
            isLoading={donorsLoading}
            currency={currency}
            isFr={isFr}
          />
        </TabsContent>

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
