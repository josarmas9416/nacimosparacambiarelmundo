import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, validateSession } from '@/lib/supabase';
import { createPayphoneLink } from '@/lib/payphone';

export async function POST(req: NextRequest) {
  if (!(await validateSession(req.headers.get('Authorization')))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { order_id, custom_amount } = await req.json() as {
      order_id: string;
      custom_amount: number; // in dollars, e.g. 54.99
    };

    if (!order_id || custom_amount == null) {
      return NextResponse.json(
        { error: 'Missing order_id or custom_amount' },
        { status: 400 }
      );
    }

    const amountCentavos = Math.round(Number(custom_amount) * 100);
    if (amountCentavos <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const clientTransactionId = Date.now().toString().slice(-15);
    const paymentLink = await createPayphoneLink(amountCentavos, clientTransactionId);

    await supabaseAdmin
      .from('orders')
      .update({ client_transaction_id: clientTransactionId })
      .eq('id', order_id);

    return NextResponse.json({ paymentLink });
  } catch (err) {
    console.error('[POST /api/create-payment-link]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
