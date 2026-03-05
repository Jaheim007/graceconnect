import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Image, Download, Star } from 'lucide-react';

export default function ProjectAssets() {
  const { id } = useParams<{ id: string }>();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['studio-project-assets', id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await db.from('ai_project_assets')
        .select('*')
        .eq('project_id', id)
        .order('display_order');
      return data || [];
    },
    enabled: !!id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/admin/studio/projects/${id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Projet</Link>
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" /> Assets du projet
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="py-8"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : !assets?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Aucun asset</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les images, PDF et audio générés apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map(asset => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {asset.asset_type === 'image' || asset.asset_type === 'cover' || asset.asset_type === 'preview' ? (
                  <img src={asset.file_url} alt={asset.label || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{asset.asset_type === 'pdf' ? '📄' : asset.asset_type === 'audio' ? '🎵' : '📝'}</span>
                )}
                {asset.is_cover && (
                  <Badge className="absolute top-2 left-2 text-[10px]"><Star className="h-3 w-3 mr-1" />Cover</Badge>
                )}
              </div>
              <CardContent className="py-2 px-3">
                <p className="text-xs font-medium truncate">{asset.label || asset.asset_type}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="secondary" className="text-[10px]">{asset.asset_type}</Badge>
                  <a href={asset.file_url} target="_blank" rel="noreferrer">
                    <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
