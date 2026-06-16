import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json() as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('fulfillment_status, payment_status, sizes')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Only allow cancelling orders that haven't been paid yet
    if (order.payment_status === 'PAGADO') {
      return NextResponse.json({ error: 'No se puede cancelar un pedido ya pagado' }, { status: 400 });
    }

    if (order.fulfillment_status === 'CANCELADO') {
      return NextResponse.json({ success: true }); // already cancelled, idempotent
    }

    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ fulfillment_status: 'CANCELADO', payment_status: 'FALLIDO' })
      .eq('id', orderId);

    if (updateErr) throw updateErr;

    const { error: stockErr } = await supabaseAdmin.rpc('restore_stock', {
      size_quantities: order.sizes,
    });

    if (stockErr) {
      console.error('[POST /api/cancel-order] restore_stock failed', stockErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/cancel-order]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
