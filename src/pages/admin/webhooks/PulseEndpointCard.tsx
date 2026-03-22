import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Webhook, Copy, CheckCircle, Trash2, Play, Pause, Eye, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EndpointCardProps {
  webhook: any;
  lastDelivery: any | null;
  isFr: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
  onCopySecret: () => void;
  onViewDetails: () => void;
  copiedId: string;
}

export function PulseEndpointCard({
  webhook: wh,
  lastDelivery,
  isFr,
  onToggle,
  onDelete,
  onCopyUrl,
  onCopySecret,
  onViewDetails,
  copiedId,
}: EndpointCardProps) {
  const statusConfig = wh.is_active
    ? { dot: 'bg-emerald-500', label: isFr ? 'Actif' : 'Active', variant: 'default' as const }
    : { dot: 'bg-muted-foreground', label: isFr ? 'Inactif' : 'Inactive', variant: 'secondary' as const };

  const lastStatus = lastDelivery
    ? lastDelivery.status === 'delivered'
      ? { color: 'text-emerald-600', text: `HTTP ${lastDelivery.response_code || 200}` }
      : lastDelivery.status === 'failed'
        ? { color: 'text-destructive', text: `HTTP ${lastDelivery.response_code || '—'}` }
        : { color: 'text-amber-500', text: isFr ? 'En cours...' : 'Retrying...' }
    : null;

  const timeAgo = lastDelivery
    ? formatDistanceToNow(new Date(lastDelivery.created_at), { addSuffix: true, locale: isFr ? fr : enUS })
    : null;

  return (
    <div className="group rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 duration-200">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left info */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <Webhook className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{wh.name}</p>
                  <span className="flex items-center gap-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${statusConfig.dot}`} />
                    <span className="text-[10px] text-muted-foreground font-medium">{statusConfig.label}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[11px] text-muted-foreground truncate font-mono max-w-[280px]">{wh.url}</p>
                  <button onClick={onCopyUrl} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copiedId === `url-${wh.id}` ? (
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Events tags */}
            {wh.events?.length > 0 ? (
              <div className="flex flex-wrap gap-1 pl-11">
                {wh.events.slice(0, 4).map((e: string) => (
                  <Badge key={e} variant="outline" className="text-[9px] font-mono bg-muted/30 border-border/60">{e}</Badge>
                ))}
                {wh.events.length > 4 && (
                  <Badge variant="outline" className="text-[9px] bg-muted/30">+{wh.events.length - 4}</Badge>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground pl-11 italic">{isFr ? 'Tous les événements' : 'All events'}</p>
            )}

            {/* Last delivery */}
            {lastStatus && (
              <div className="flex items-center gap-2 pl-11 text-[10px] text-muted-foreground">
                <span>{isFr ? 'Dernier envoi' : 'Last sent'}: {timeAgo}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className={lastStatus.color}>{lastStatus.text}</span>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onViewDetails}>
              <Eye className="h-3 w-3" /> {isFr ? 'Détails' : 'Details'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={onCopySecret} className="text-xs gap-2">
                  <Copy className="h-3 w-3" /> {isFr ? 'Copier le secret' : 'Copy secret'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggle} className="text-xs gap-2">
                  {wh.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {wh.is_active ? (isFr ? 'Mettre en pause' : 'Pause') : (isFr ? 'Activer' : 'Resume')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-xs gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-3 w-3" /> {isFr ? 'Supprimer' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
