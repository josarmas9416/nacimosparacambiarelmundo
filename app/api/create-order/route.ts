import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateShipping } from '@/lib/shipping';
import type { SizeQuantities } from '@/types/order';

const BASE_REQUIRED = ['nombre', 'cedula', 'whatsapp', 'correo', 'pais'] as const;
const ECUADOR_REQUIRED = ['provincia', 'ciudad', 'direccion'] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      nombre: string;
      cedula: string;
      whatsapp: string;
      correo: string;
      pais: string;
      provincia: string;
      ciudad: string;
      direccion: string;
      sizes: SizeQuantities;
    };

    // Validate required fields (province/city/address only needed for Ecuador)
    const isEcuador = body.pais?.trim().toLowerCase() === 'ecuador';
    const missing = [
      ...BASE_REQUIRED.filter((f) => !body[f]?.trim()),
      ...(isEcuador ? ECUADOR_REQUIRED.filter((f) => !body[f]?.trim()) : []),
    ];
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Campos requeridos: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const total_units = (Object.values(body.sizes) as number[]).reduce(
      (acc, n) => acc + Math.max(0, Number(n) || 0),
      0
    );

    if (total_units === 0) {
      return NextResponse.json(
        { error: 'Selecciona al menos una prenda' },
        { status: 400 }
      );
    }

    const { data: settingsRow } = await supabaseAdmin
      .from('settings')
      .select('tshirt_price')
      .single();
    const tshirtPrice = settingsRow?.tshirt_price ?? 4999;

    const subtotal = tshirtPrice * total_units;
    const { cost: shipping_cost, isInternational } = calculateShipping(
      body.pais,
      body.provincia,
      body.ciudad
    );
    const total = subtotal + shipping_cost;

    // Atomically validate and decrement stock (row-locked inside the SQL function)
    const { error: stockError } = await supabaseAdmin.rpc('decrement_stock', {
      size_quantities: body.sizes,
    });

    if (stockError) {
      const msg = stockError.message?.includes('STOCK_INSUFICIENTE')
        ? `Stock insuficiente — talla ${stockError.message.split(':')[1]?.trim().split(' ')[0]} agotada`
        : 'Stock insuficiente para completar el pedido';
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    const { data: order, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        nombre:    body.nombre,
        cedula:    body.cedula,
        whatsapp:  body.whatsapp,
        correo:    body.correo,
        pais:      body.pais,
        provincia: body.provincia,
        ciudad:    body.ciudad,
        direccion: body.direccion,
        sizes:     body.sizes,
        total_units,
        subtotal,
        shipping_cost,
        total,
        is_international: isInternational,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    if (isInternational) {
      return NextResponse.json({ international: true });
    }

    // Return order id and total so the frontend can initialize the Cajita widget
    return NextResponse.json({ orderId: order.id, total });
  } catch (err) {
    console.error('[POST /api/create-order]', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
