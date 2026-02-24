import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/database';

interface EventCalendarProps {
  events: Event[];
  onSelectEvent?: (event: Event) => void;
}

export function EventCalendar({ events, onSelectEvent }: EventCalendarProps) {
  const [current, setCurrent] = useState(new Date());

  const year = current.getFullYear();
  const month = current.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const eventsByDay = useMemo(() => {
    const map: Record<number, Event[]> = {};
    events.forEach((e) => {
      if (!e.event_date) return;
      const d = new Date(e.event_date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(e);
      }
    });
    return map;
  }, [events, year, month]);

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));

  const monthLabel = current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const dayHeaders = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prev} aria-label="Mois précédent">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold capitalize">{monthLabel}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={next} aria-label="Mois suivant">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-muted-foreground py-2 border-b border-border/50">
        {dayHeaders.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-px p-1">
        {cells.map((c, i) => {
          const dayEvents = c.day ? eventsByDay[c.day] || [] : [];
          return (
            <div key={i} className={cn(
              'min-h-[48px] p-1 rounded-lg text-xs',
              c.day ? 'hover:bg-muted/50 cursor-default' : '',
              isToday(c.day!) && 'bg-primary/5 ring-1 ring-primary/20'
            )}>
              {c.day && (
                <>
                  <span className={cn('text-[11px]', isToday(c.day) && 'font-bold text-primary')}>{c.day}</span>
                  {dayEvents.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => onSelectEvent?.(ev)}
                      className="w-full text-left text-[9px] bg-primary/10 text-primary rounded px-1 py-0.5 truncate mt-0.5 hover:bg-primary/20 transition-colors"
                    >
                      {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 2}</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
