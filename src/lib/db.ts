// Typed database helper - wraps Supabase client with 'any' cast
// since the auto-generated types.ts doesn't include our migrated tables yet.
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export { supabase };
