import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapCardProps {
  location?: string;
  mapUrl?: string;
}

function extractEmbedUrl(url: string): string | null {
  try {
    // If it's already an embed URL
    if (url.includes('/embed')) return url;
    
    // For place URLs like /maps/place/Name/@lat,lng
    const placeMatch = url.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(decodeURIComponent(placeMatch[1]))}&output=embed&z=15`;
    }

    // Handle maps.google.com/maps?q=
    const u = new URL(url);
    if (u.searchParams.has('q')) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(u.searchParams.get('q')!)}&output=embed&z=15`;
    }
    
    // For @lat,lng URLs
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed&z=15`;
    }
    
    // Fallback: use the full URL as query
    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed&z=15`;
  } catch {
    return null;
  }
}

export function GoogleMapCard({ location, mapUrl }: GoogleMapCardProps) {
  if (!mapUrl && !location) return null;

  const embedSrc = mapUrl 
    ? extractEmbedUrl(mapUrl) || `https://maps.google.com/maps?q=${encodeURIComponent(location || '')}&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(location || '')}&output=embed`;

  const directLink = mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || '')}`;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
      <div className="aspect-[16/9] w-full bg-muted">
        <iframe
          src={embedSrc}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Carte — ${location || 'Lieu'}`}
        />
      </div>
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">{location || 'Voir sur la carte'}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs shrink-0"
          onClick={() => window.open(directLink, '_blank')}
        >
          <ExternalLink className="h-3.5 w-3.5" /> Itinéraire
        </Button>
      </div>
    </div>
  );
}
