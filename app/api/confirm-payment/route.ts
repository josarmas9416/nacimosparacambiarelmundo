import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { id, clientTransactionId } = await req.json() as {
      id: string;              // Payphone's own transaction id (from redirect URL)
      clientTransactionId: string; // our order UUID
    };

    if (!id || !clientTransactionId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Confirm with Payphone server-side — token stays secret on the server
    const ppRes = await fetch(
      'https://paymentbox.payphonetodoesposible.com/api/confirm',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYPHONE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, clientTxId: clientTransactionId }),
      }
    );

    if (!ppRes.ok) {
      console.error('[confirm-payment] Payphone error', ppRes.status, await ppRes.text());
      return NextResponse.json({ error: 'Payphone error' }, { status: 502 });
    }

    const ppData = await ppRes.json();
    const { statusCode, transactionId } = ppData;

    if (statusCode === 3) {
      // Approved
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'PAGADO',
          payment_reference: String(transactionId),
        })
        .eq('id', clientTransactionId);

      return NextResponse.json({ approved: true, transactionId });
    }

    if (statusCode === 2) {
      // Cancelled / reversed
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'FALLIDO' })
        .eq('id', clientTransactionId);

      return NextResponse.json({ cancelled: true });
    }

    // Unknown status — leave DB unchanged and let caller decide
    return NextResponse.json({ statusCode });
  } catch (err) {
    console.error('[POST /api/confirm-payment]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
