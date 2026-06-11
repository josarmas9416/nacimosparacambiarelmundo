import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, validateSession } from '@/lib/supabase';
import type { FulfillmentStatus } from '@/types/order';

export async function PATCH(req: NextRequest) {
  if (!(await validateSession(req.headers.get('Authorization')))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      id: string;
      fulfillment_status?: FulfillmentStatus;
      notes?: string;
      payphone_transaction_id?: string;
    };

    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (rest.fulfillment_status !== undefined) {
      updates.fulfillment_status = rest.fulfillment_status;
    }
    if (rest.notes !== undefined) {
      updates.notes = rest.notes;
    }
    if (rest.payphone_transaction_id !== undefined) {
      updates.payphone_transaction_id = rest.payphone_transaction_id;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Fetch current order whenever fulfillment_status is being changed:
    // - block re-activation of cancelled orders
    // - get sizes to restore when cancelling
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
