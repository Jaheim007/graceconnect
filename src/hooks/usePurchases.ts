import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPurchase {
  id: string;
  product_id: string;
  amount: number;
  currency: string;
  status: string;
  completed_at: string | null;
  created_at: string;
  product: {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    file_url: string | null;
    external_link: string | null;
    product_type: string;
    organization_id: string;
  };
}

export function useMyPurchases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('product_purchases')
        .select('id, product_id, amount, currency, status, completed_at, created_at, digital_products(id, title, description, cover_image_url, file_url, external_link, product_type, organization_id)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        ...row,
        product: row.digital_products,
      })) as UserPurchase[];
    },
    enabled: !!user,
  });
}
