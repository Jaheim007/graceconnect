import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, MousePointerClick, ShoppingCart, Search, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const EVENT_ICONS: Record<string, typeof Eye> = {
  experiment_exposure: Eye,
  experiment_click: MousePointerClick,
  experiment_conversion: ShoppingCart,
};

const EVENT_COLORS: Record<string, string> = {
  experiment_exposure: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  experiment_click: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  experiment_conversion: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export function ExperimentEventInspector() {
  const { isSuperadmin } = useAuth();
  const qc = useQueryClient();
  const [experimentFilter, setExperimentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [liveCount, setLiveCount] = useState(0);

  // Subscribe to Realtime for instant event feed
  useEffect(() => {
    const channel = supabase
      .channel('experiment-events-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'client_events' },
        (payload: any) => {
          const evt = payload.new;
          if (['experiment_exposure', 'experiment_click', 'experiment_conversion'].includes(evt?.event_name)) {
            qc.invalidateQueries({ queryKey: ['experiment-events-inspector'] });
            setLiveCount(c => c + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['experiment-events-inspector'],
    queryFn: async () => {
      const { data } = await db
        .from('client_events')
        .select('*')
        .in('event_name', ['experiment_exposure', 'experiment_click', 'experiment_conversion'])
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  if (!isSuperadmin) return null;

  const experimentNames = [...new Set(events.map((e: any) => e.event_data?.experimentId).filter(Boolean))];

  const filtered = events.filter((e: any) => {
    if (experimentFilter !== 'all' && e.event_data?.experimentId !== experimentFilter) return false;
    if (typeFilter !== 'all' && e.event_name !== typeFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSession = e.session_id?.toLowerCase().includes(searchLower);
      const matchesVariant = e.event_data?.variant?.toLowerCase().includes(searchLower);
      const matchesSlot = e.event_data?.slotKey?.toLowerCase().includes(searchLower);
      if (!matchesSession && !matchesVariant && !matchesSlot) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          🔍 Event Inspector
          <Badge variant="outline" className="text-[10px]">{filtered.length} events</Badge>
          {liveCount > 0 && (
            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 animate-pulse" variant="outline">
              <Zap className="h-2.5 w-2.5" />
              Live
            </Badge>
          )}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => { refetch(); setLiveCount(0); }} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={experimentFilter} onValueChange={setExperimentFilter}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder="All experiments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All experiments</SelectItem>
            {experimentNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="experiment_exposure">Exposure</SelectItem>
            <SelectItem value="experiment_click">Click</SelectItem>
            <SelectItem value="experiment_conversion">Conversion</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search session, variant, slot…"
            className="h-8 text-xs pl-7"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Experiment</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Variant</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Slot</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Session</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No events found</td></tr>
              )}
              {filtered.map((e: any) => {
                const Icon = EVENT_ICONS[e.event_name] || Eye;
                const colorClass = EVENT_COLORS[e.event_name] || '';
                return (
                  <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                      {format(new Date(e.created_at), 'HH:mm:ss')}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={cn('text-[10px] gap-1', colorClass)}>
                        <Icon className="h-3 w-3" />
                        {e.event_name.replace('experiment_', '')}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-medium truncate max-w-[120px]">{e.event_data?.experimentId || '—'}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold">{e.event_data?.variant?.toUpperCase() || '—'}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{e.event_data?.slotKey || '—'}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[80px]">
                      {e.session_id?.slice(0, 8) || '—'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">{e.page_url || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
