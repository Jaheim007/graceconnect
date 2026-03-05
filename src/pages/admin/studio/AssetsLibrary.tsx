import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { FolderOpen, Download, Search, Image, FileText, Music } from 'lucide-react';

const ASSET_ICONS: Record<string, typeof Image> = {
  image: Image, cover: Image, preview: Image,
  pdf: FileText, audio: Music, text: FileText,
};

export default function AssetsLibrary() {
  const { currentOrg } = useOrg();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['studio-all-assets', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await db.from('ai_project_assets')
        .select('*, ai_content_projects!inner(title)')
        .eq('organization_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const filtered = assets?.filter((a: any) => {
    if (filterType !== 'all' && a.asset_type !== filterType) return false;
    if (search && !a.label?.toLowerCase().includes(search.toLowerCase()) && !a.ai_content_projects?.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FolderOpen className="h-6 w-6 text-primary" /> Bibliothèque d'assets
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
        </div>
        <div className="flex gap-1">
          {['all', 'image', 'pdf', 'audio'].map(t => (
            <Button key={t} variant={filterType === t ? 'default' : 'outline'} size="sm" onClick={() => setFilterType(t)} className="text-xs">
              {t === 'all' ? 'Tous' : t.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="py-8"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Aucun asset trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((asset: any) => {
            const Icon = ASSET_ICONS[asset.asset_type] || FileText;
            return (
              <Card key={asset.id} className="overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {['image', 'cover', 'preview'].includes(asset.asset_type) ? (
                    <img src={asset.file_url} alt={asset.label || ''} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <CardContent className="py-2 px-3">
                  <p className="text-xs font-medium truncate">{asset.label || asset.asset_type}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{asset.ai_content_projects?.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-[10px]">{asset.asset_type}</Badge>
                    <a href={asset.file_url} target="_blank" rel="noreferrer" download>
                      <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
