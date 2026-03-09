// Typed database helper – re-exports the fully typed Supabase client.
// Legacy alias kept for backward compat: `import { db } from '@/lib/db'`
import { supabase } from '@/integrations/supabase/client';

export const db = supabase;

export { supabase };
