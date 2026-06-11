import { createClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client.
 * Supabase v2 persists the session in localStorage automatically.
 */
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
