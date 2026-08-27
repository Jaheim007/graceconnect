import { useMemo, useState } from 'react';
import { Link } from '@/lib/router-compat';
import {
  Activity, Users, TrendingUp, Wallet, Handshake, AlertTriangle, ClipboardList, Globe, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAcquisitionConsole } from '@/hooks/useAcquisitionConsole';
import { downloadCSV } from '@/lib/csvExport';

const RANGES = [7, 30, 90] as const;

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string | number; hint?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 font-heading text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Bars({ rows, labelKey, valueKey }: { rows: any[]; labelKey: string; valueKey: string }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey]) || 0));
  if (!rows.length) return <p className="text-xs text-muted-foreground">No data yet</p>;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={`${r[labelKey]}-${i}`} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate pr-2">{String(r[labelKey])}</span>
            <span className="tabular-nums text-muted-foreground">{Number(r[valueKey]).toLocaleString()}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(Number(r[valueKey]) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-bold tracking-tight">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function SuperadminAcquisition() {
  const [days, setDays] = useState<number>(30);
  const [excludeInternal, setExcludeInternal] = useState(true);
  const { overview, funnel, health, affiliates, money } = useAcquisitionConsole(days, excludeInternal);

  const surveys = useQuery({
    queryKey: ['acq-surveys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_surveys')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const surveyBreakdown = useMemo(() => {
    const rows = surveys.data ?? [];
    const count = (field: string) => {
      const m = new Map<string, number>();
      rows.forEach((r: any) => {
        const v = r[field];
        if (!v) return;
        m.set(v, (m.get(v) ?? 0) + 1);
      });
      return [...m.entries()].map(([k, v]) => ({ label: k, count: v })).sort((a, b) => b.count - a.count);
    };
    return {
      main_goal: count('main_goal'),
      content_type: count('content_type'),
      biggest_blocker: count('biggest_blocker'),
      found_via: count('found_via'),
      price_expectation: count('price_expectation'),
      audience_size: count('audience_size'),
    };
  }, [surveys.data]);

  const o = overview.data;
  const f = funnel.data;
  const h = health.data;
  const a = affiliates.data;
  const m = money.data;

  const pct = (num?: number, den?: number) =>
    !den || !num ? '0%' : `${Math.round((num / den) * 100)}%`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight">Acquisition</h1>
          <p className="text-xs text-muted-foreground">Where users come from, where they stall, and what it costs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
            <Switch id="excl" checked={excludeInternal} onCheckedChange={setExcludeInternal} />
            <Label htmlFor="excl" className="text-xs">Exclude internal & mentor</Label>
          </div>
          <div className="flex rounded-xl border border-border bg-card p-1">
            {RANGES.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={days === r ? 'secondary' : 'ghost'}
                className="h-7 rounded-lg px-3 text-xs"
                onClick={() => setDays(r)}
              >
                {r}d
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="sources">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="firstsale">First sale</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="money">Money</TabsTrigger>
          <TabsTrigger value="survey">Survey</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Page views" value={(o?.page_views ?? 0).toLocaleString()} icon={Activity} />
            <Stat label="Visitors" value={(o?.visitors ?? 0).toLocaleString()} icon={Users} />
            <Stat label="Signups" value={(o?.signups ?? 0).toLocaleString()} hint={`${pct(o?.signups, o?.visitors)} of visitors`} icon={TrendingUp} />
            <Stat label="Top source" value={o?.by_source?.[0]?.source ?? '—'} hint={o?.by_source?.[0] ? `${o.by_source[0].views} views` : undefined} icon={Globe} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Traffic by source"><Bars rows={o?.by_source ?? []} labelKey="source" valueKey="views" /></Panel>
            <Panel title="Signups by first-touch source"><Bars rows={o?.signup_sources ?? []} labelKey="source" valueKey="signups" /></Panel>
            <Panel title="Top pages"><Bars rows={o?.top_pages ?? []} labelKey="path" valueKey="views" /></Panel>
            <Panel title="Devices"><Bars rows={o?.by_device ?? []} labelKey="device" valueKey="views" /></Panel>
            <Panel title="Views by hour (UTC)">
              <div className="flex h-24 items-end gap-1">
                {Array.from({ length: 24 }, (_, hh) => {
                  const row = o?.by_hour?.find((x) => Number(x.hour) === hh);
                  const max = Math.max(1, ...(o?.by_hour ?? []).map((x) => x.views));
                  const v = row?.views ?? 0;
                  return (
                    <div key={hh} className="flex-1" title={`${hh}h · ${v}`}>
                      <div className="rounded-t bg-primary/70" style={{ height: `${(v / max) * 88}px` }} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>0h</span><span>12h</span><span>23h</span></div>
            </Panel>
            <Panel title="Views per day"><Bars rows={o?.by_day ?? []} labelKey="day" valueKey="views" /></Panel>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Workspaces" value={(f?.workspaces ?? 0).toLocaleString()} icon={Users} />
            <Stat label="With a product" value={(f?.with_product ?? 0).toLocaleString()} hint={pct(f?.with_product, f?.workspaces)} icon={ClipboardList} />
            <Stat label="Published" value={(f?.with_published ?? 0).toLocaleString()} hint={pct(f?.with_published, f?.workspaces)} icon={TrendingUp} />
            <Stat label="Made a sale" value={(f?.with_sale ?? 0).toLocaleString()} hint={pct(f?.with_sale, f?.workspaces)} icon={Wallet} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Median time to milestone">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">To first product</span><span className="tabular-nums">{f?.median_hours_to_product != null ? `${f.median_hours_to_product}h` : '—'}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">To publish</span><span className="tabular-nums">{f?.median_hours_to_publish != null ? `${f.median_hours_to_publish}h` : '—'}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">To first sale</span><span className="tabular-nums">{f?.median_hours_to_sale != null ? `${f.median_hours_to_sale}h` : '—'}</span></div>
              </div>
            </Panel>
            <Panel title="By workspace type"><Bars rows={f?.by_type ?? []} labelKey="type" valueKey="workspaces" /></Panel>
            <Panel title="By country"><Bars rows={f?.by_country ?? []} labelKey="country" valueKey="workspaces" /></Panel>
          </div>
        </TabsContent>

        <TabsContent value="firstsale" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Published products" value={(h?.published_total ?? 0).toLocaleString()} icon={ClipboardList} />
            <Stat label="Never sold" value={(h?.never_sold_total ?? 0).toLocaleString()} hint={pct(h?.never_sold_total, h?.published_total)} icon={AlertTriangle} />
            <Stat label="Dormant sellers (30d)" value={(h?.dormant_sellers?.length ?? 0).toLocaleString()} icon={Clock} />
          </div>
          <Panel
            title="Never sold"
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-7 rounded-lg text-xs"
                onClick={() => downloadCSV((h?.never_sold ?? []) as any[], 'never-sold-products')}
              >
                Export CSV
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Seller</th>
                    <th className="py-2 pr-3">Price</th>
                    <th className="py-2 pr-3">Days live</th>
                    <th className="py-2">Missing</th>
                  </tr>
                </thead>
                <tbody>
                  {(h?.never_sold ?? []).map((p) => (
                    <tr key={p.product_id} className="border-b border-border/60">
                      <td className="py-2 pr-3 max-w-[220px] truncate">{p.title}</td>
                      <td className="py-2 pr-3">
                        <Link to={`/${p.org_slug}`} className="hover:underline">{p.org_name}</Link>
                      </td>
                      <td className="py-2 pr-3 tabular-nums">{p.price ?? 0} {p.currency ?? ''}</td>
                      <td className="py-2 pr-3 tabular-nums">{p.days_live}</td>
                      <td className="py-2">
                        <span className="flex flex-wrap gap-1">
                          {p.missing_cover && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">cover</span>}
                          {p.missing_description && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">description</span>}
                          {p.no_commission && <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">no commission</span>}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!(h?.never_sold ?? []).length && (
                    <tr><td colSpan={5} className="py-3 text-muted-foreground">Nothing here.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel
            title="Dormant sellers"
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-7 rounded-lg text-xs"
                onClick={() => downloadCSV((h?.dormant_sellers ?? []) as any[], 'dormant-sellers')}
              >
                Export CSV
              </Button>
            }
          >
            <div className="space-y-1.5">
              {(h?.dormant_sellers ?? []).map((d) => (
                <div key={d.org_id} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-xs">
                  <Link to={`/${d.org_slug}`} className="truncate hover:underline">{d.org_name}</Link>
                  <span className="text-muted-foreground">
                    {d.days_since_last_sale != null ? `${d.days_since_last_sale}d since last sale` : 'never sold'}
                  </span>
                </div>
              ))}
              {!(h?.dormant_sellers ?? []).length && <p className="text-xs text-muted-foreground">Nothing here.</p>}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="affiliates" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Ambassadors" value={(a?.ambassadors ?? 0).toLocaleString()} hint={`${a?.active_ambassadors ?? 0} active`} icon={Handshake} />
            <Stat label="Clicks" value={(a?.clicks ?? 0).toLocaleString()} icon={Activity} />
            <Stat label="Conversions" value={(a?.conversions ?? 0).toLocaleString()} hint={pct(a?.conversions, a?.clicks)} icon={TrendingUp} />
            <Stat label="Commissions paid out" value={(a?.commission_total ?? 0).toLocaleString()} hint={`on ${(a?.gross_total ?? 0).toLocaleString()} gross`} icon={Wallet} />
          </div>
          <Panel title="Top ambassadors">
            <Bars rows={a?.top_ambassadors ?? []} labelKey="name" valueKey="commission" />
          </Panel>
        </TabsContent>

        <TabsContent value="money" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Orders" value={(m?.orders ?? 0).toLocaleString()} icon={Activity} />
            <Stat label="GMV" value={(m?.gmv ?? 0).toLocaleString()} icon={TrendingUp} />
            <Stat label="Platform fees" value={(m?.platform_fees ?? 0).toLocaleString()} hint={`sellers received ${(m?.seller_payouts ?? 0).toLocaleString()}`} icon={Wallet} />
            <Stat
              label="Cost per paying seller"
              value={m?.cost_per_paying_seller != null ? m.cost_per_paying_seller.toLocaleString() : '—'}
              hint={`${(m?.marketing_spend ?? 0).toLocaleString()} spend · ${m?.paying_sellers ?? 0} paying sellers`}
              icon={Users}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="GMV by currency"><Bars rows={m?.by_currency ?? []} labelKey="currency" valueKey="gmv" /></Panel>
            <Panel title="GMV by gateway"><Bars rows={m?.by_gateway ?? []} labelKey="gateway" valueKey="gmv" /></Panel>
            <Panel title="Marketing spend by channel"><Bars rows={m?.spend_by_channel ?? []} labelKey="channel" valueKey="amount" /></Panel>
          </div>
        </TabsContent>

        <TabsContent value="survey" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Survey answers" value={(surveys.data?.length ?? 0).toLocaleString()} icon={ClipboardList} />
            <Stat label="Top blocker" value={surveyBreakdown.biggest_blocker[0]?.label ?? '—'} icon={AlertTriangle} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Main goal"><Bars rows={surveyBreakdown.main_goal} labelKey="label" valueKey="count" /></Panel>
            <Panel title="Content type"><Bars rows={surveyBreakdown.content_type} labelKey="label" valueKey="count" /></Panel>
            <Panel title="Biggest blocker"><Bars rows={surveyBreakdown.biggest_blocker} labelKey="label" valueKey="count" /></Panel>
            <Panel title="Found via"><Bars rows={surveyBreakdown.found_via} labelKey="label" valueKey="count" /></Panel>
            <Panel title="Price expectation"><Bars rows={surveyBreakdown.price_expectation} labelKey="label" valueKey="count" /></Panel>
            <Panel title="Audience size"><Bars rows={surveyBreakdown.audience_size} labelKey="label" valueKey="count" /></Panel>
          </div>
          <Panel
            title="Free-text notes"
            action={
              <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => downloadCSV((surveys.data ?? []) as any[], 'seller-surveys')}>
                Export CSV
              </Button>
            }
          >
            <div className="space-y-2">
              {(surveys.data ?? []).filter((s: any) => s.note).slice(0, 30).map((s: any) => (
                <p key={s.id} className="rounded-xl border border-border px-3 py-2 text-xs">{s.note}</p>
              ))}
              {!(surveys.data ?? []).some((s: any) => s.note) && <p className="text-xs text-muted-foreground">No notes yet.</p>}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
