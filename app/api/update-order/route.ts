import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, validateSession } from '@/lib/supabase';
import type { FulfillmentStatus, PaymentStatus } from '@/types/order';

export async function PATCH(req: NextRequest) {
  if (!(await validateSession(req.headers.get('Authorization')))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      id: string;
      fulfillment_status?: FulfillmentStatus;
      payment_status?: PaymentStatus;
      payment_reference?: string;
      notes?: string;
    };

    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    // Fetch current order whenever fulfillment_status is being changed
    let sizesToRestore: Record<string, number> | null = null;
    if (rest.fulfillment_status !== undefined) {
      const { data: current, error: fetchErr } = await supabaseAdmin
        .from('orders')
        .select('fulfillment_status, sizes')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;

      if (current.fulfillment_status === 'CANCELADO') {
        return NextResponse.json(
          { error: 'No se puede modificar un pedido cancelado' },
          { status: 400 }
        );
      }

      if (rest.fulfillment_status === 'CANCELADO') {
        sizesToRestore = current.sizes as Record<string, number>;
      }
    }

    const updates: Record<string, unknown> = {};
    if (rest.fulfillment_status !== undefined) updates.fulfillment_status = rest.fulfillment_status;
    if (rest.payment_status    !== undefined) updates.payment_status    = rest.payment_status;
    if (rest.payment_reference !== undefined) updates.payment_reference = rest.payment_reference;
    if (rest.notes             !== undefined) updates.notes             = rest.notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    if (sizesToRestore) {
      const { error: stockErr } = await supabaseAdmin.rpc('restore_stock', {
        size_quantities: sizesToRestore,
      });
      if (stockErr) {
        console.error('[PATCH /api/update-order] restore_stock failed', stockErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/update-order]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
