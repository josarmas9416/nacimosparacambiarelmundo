import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, validateSession } from '@/lib/supabase';
import type { SizeQuantities } from '@/types/order';

const DEFAULTS = {
  tshirt_price: 4999,
  stock: { S: 99, M: 99, L: 99, XL: 99, '2XL': 99 } as SizeQuantities,
  store_active: true,
  store_notice: '',
};

async function getSettings() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('tshirt_price, stock, store_active, store_notice')
    .single();
  return data ?? DEFAULTS;
}

/** Public — used by the storefront to display price & stock */
export async function GET() {
  try {
    return NextResponse.json(await getSettings());
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

/** Protected — admin only */
export async function PATCH(req: NextRequest) {
  if (!(await validateSession(req.headers.get('Authorization')))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tshirt_price, stock, store_active, store_notice } = await req.json() as {
      tshirt_price: number;
      stock: SizeQuantities;
      store_active: boolean;
      store_notice: string;
    };

    if (!tshirt_price || tshirt_price <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        id: 1,
        tshirt_price,
        stock,
        store_active,
        store_notice,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/settings]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
