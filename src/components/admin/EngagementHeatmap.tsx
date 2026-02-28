import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function EngagementHeatmap() {
  const { currentOrg } = useOrg();

  const { data: events = [] } = useQuery({
    queryKey: ['engagement-heatmap', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      // Get recent purchases and donations timestamps
      const [{ data: purchases }, { data: donations }] = await Promise.all([
        db.from('product_purchases')
          .select('created_at')
          .eq('organization_id', currentOrg.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(500),
        db.from('donations')
          .select('created_at')
          .eq('organization_id', currentOrg.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(500),
      ]);
      return [...(purchases || []), ...(donations || [])].map((e: any) => e.created_at);
    },
    enabled: !!currentOrg?.id,
  });

  const heatData = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;

    events.forEach(ts => {
      const d = new Date(ts);
      const day = (d.getDay() + 6) % 7; // Mon=0
      const hour = d.getHours();
      grid[day][hour]++;
      if (grid[day][hour] > max) max = grid[day][hour];
    });

    return { grid, max };
  }, [events]);

  if (events.length < 10) return null;

  const getColor = (val: number) => {
    if (val === 0) return 'bg-muted/30';
    const ratio = val / Math.max(heatData.max, 1);
    if (ratio > 0.75) return 'bg-primary/80';
    if (ratio > 0.5) return 'bg-primary/50';
    if (ratio > 0.25) return 'bg-primary/30';
    return 'bg-primary/15';
  };

  // Find peak hour
  let peakDay = 0, peakHour = 0, peakVal = 0;
  heatData.grid.forEach((row, d) => {
    row.forEach((val, h) => {
      if (val > peakVal) { peakVal = val; peakDay = d; peakHour = h; }
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Activity className="h-4 w-4 text-rose-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Carte d'engagement</h2>
          <p className="text-[10px] text-muted-foreground">
            Pic : {DAYS[peakDay]} à {peakHour}h ({peakVal} transactions)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {HOURS.filter(h => h % 3 === 0).map(h => (
              <span key={h} className="text-[9px] text-muted-foreground" style={{ width: `${100/8}%` }}>
                {h}h
              </span>
            ))}
          </div>

          {/* Grid */}
          {heatData.grid.map((row, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{DAYS[dayIdx]}</span>
              <div className="flex-1 flex gap-[2px]">
                {row.map((val, hourIdx) => (
                  <div
                    key={hourIdx}
                    className={`flex-1 h-4 rounded-[3px] ${getColor(val)} transition-colors`}
                    title={`${DAYS[dayIdx]} ${hourIdx}h: ${val} transactions`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="text-[9px] text-muted-foreground">Moins</span>
        {['bg-muted/30', 'bg-primary/15', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80'].map((c, i) => (
          <div key={i} className={`h-3 w-3 rounded-[2px] ${c}`} />
        ))}
        <span className="text-[9px] text-muted-foreground">Plus</span>
      </div>
    </motion.div>
  );
}
