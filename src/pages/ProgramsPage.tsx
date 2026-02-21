import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Users } from 'lucide-react';

export default function ProgramsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['public-programs'],
    queryFn: async () => {
      const { data } = await db.from('programs').select('*, organizations(name, slug, logo_url)')
        .eq('is_published', true).order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('program_enrollments').select('program_id, status')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const enrolledIds = new Set(enrollments.map((e: any) => e.program_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Programmes de formation</h1>
          <p className="text-xs text-muted-foreground">Apprenez avec les meilleurs leaders</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : programs.length === 0 ? (
        <EmptyState variant="generic" title="Aucun programme" description="Les programmes de formation seront bientôt disponibles." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-card transition-all group">
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt={p.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 gold-gradient opacity-40" />
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {p.organizations?.logo_url && (
                    <img src={p.organizations.logo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                  )}
                  <span className="text-[10px] text-muted-foreground">{p.organizations?.name}</span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2">{p.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {p.is_free ? 'Gratuit' : `${p.price?.toLocaleString('fr-FR')} ${p.currency}`}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Users className="h-3 w-3" /> {p.enrollment_count || 0}
                    </span>
                  </div>
                  {enrolledIds.has(p.id) ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => navigate(`/programs/${p.id}`)}>
                      <BookOpen className="h-3 w-3" /> Continuer
                    </Button>
                  ) : (
                    <Button size="sm" className="h-7 text-xs gold-gradient text-primary-foreground border-0 shadow-gold"
                      onClick={() => navigate(`/programs/${p.id}`)}>
                      Voir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
