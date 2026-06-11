import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — SERVER ONLY.
 * Never import this in client components.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Validates a Supabase access token from an Authorization header value. */
export async function validateSession(
  authHeader: string | null | undefined
): Promise<boolean> {
  const token = authHeader?.replace('Bearer ', '').trim();
  if (!token) return false;
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  return !!user;
}
