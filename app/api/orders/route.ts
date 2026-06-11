import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, validateSession } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  if (!(await validateSession(req.headers.get('Authorization')))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  let query = supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  const payment_status = searchParams.get('payment_status');
  if (payment_status && payment_status !== 'ALL') {
    query = query.eq('payment_status', payment_status);
  }

  const fulfillment_status = searchParams.get('fulfillment_status');
  if (fulfillment_status && fulfillment_status !== 'ALL') {
    query = query.eq('fulfillment_status', fulfillment_status);
  }

  const date_from = searchParams.get('date_from');
  if (date_from) {
    // Start of day in Ecuador time (UTC−5)
    query = query.gte('created_at', `${date_from}T00:00:00.000-05:00`);
  }

  const date_to = searchParams.get('date_to');
  if (date_to) {
    // End of day in Ecuador time (UTC−5) — inclusive
    query = query.lte('created_at', `${date_to}T23:59:59.999-05:00`);
  }

  const is_international = searchParams.get('is_international');
  if (is_international === 'true') {
    query = query.eq('is_international', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[GET /api/orders]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
