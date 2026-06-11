"use client";

import { useEffect, useState } from "react";
import type { Order, FulfillmentStatus, SizeQuantities } from "@/types/order";

const FULFILLMENT_OPTIONS: FulfillmentStatus[] = [
  "EN PREPARACION",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
];

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSizes(sizes: SizeQuantities) {
  return (Object.entries(sizes) as [string, number][])
    .filter(([, qty]) => qty > 0)
    .map(([s, qty]) => `${s}:${qty}`)
    .join(" ");
}

function PaymentBadge({ status }: { status: Order["payment_status"] }) {
  const cls = {
    PENDIENTE: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40",
    PAGADO:    "bg-green-900/40  text-green-300  border-green-700/40",
    FALLIDO:   "bg-red-900/40    text-red-300    border-red-700/40",
  }[status];
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
}

function FulfillmentBadge({ status }: { status: Order["fulfillment_status"] }) {
  const cls = {
    "EN PREPARACION": "bg-blue-900/40   text-blue-300   border-blue-700/40",
    ENVIADO:          "bg-orange-900/40 text-orange-300 border-orange-700/40",
    ENTREGADO:        "bg-green-900/40  text-green-300  border-green-700/40",
    CANCELADO:        "bg-zinc-800      text-zinc-400   border-zinc-700",
  }[status];
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
}

interface RowEdit {
  fulfillment_status: FulfillmentStatus;
  notes: string;
}

interface Props {
  orders: Order[];
  token: string;
  onRefresh: () => void;
  onGeneratePaymentLink: (orderId: string) => void;
}

export default function OrdersTable({
  orders,
  token,
  onRefresh,
  onGeneratePaymentLink,
}: Props) {
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, RowEdit> = {};
    orders.forEach((o) => {
      initial[o.id] = {
        fulfillment_status: o.fulfillment_status,
        notes: o.notes ?? "",
      };
    });
    setEdits(initial);
  }, [orders]);

  const setEdit = <K extends keyof RowEdit>(
    id: string,
    key: K,
    value: RowEdit[K]
  ) => {
    setEdits((e) => ({ ...e, [id]: { ...e[id], [key]: value } }));
  };

  const handleSave = async (id: string) => {
    setSaving((s) => ({ ...s, [id]: true }));
    setSaved((s) => ({ ...s, [id]: false }));

    const order = orders.find((o) => o.id === id);
    const isCancelled = order?.fulfillment_status === "CANCELADO";

    try {
      await fetch("/api/update-order", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          // Don't send fulfillment_status for cancelled orders — API would reject it
          ...(isCancelled ? {} : { fulfillment_status: edits[id]?.fulfillment_status }),
          notes: edits[id]?.notes,
        }),
      });
      setSaved((s) => ({ ...s, [id]: true }));
      onRefresh();
      setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 2000);
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-[#111111] border border-[#222222] p-12 text-center text-zinc-500 text-sm">
        No hay pedidos que coincidan con los filtros.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#222222]">
      <table className="w-full text-sm text-left border-collapse min-w-[1400px]">
        <thead>
          <tr className="bg-[#0f0f0f] border-b border-[#222222]">
            {[
              "Fecha", "Nombre", "Cédula", "WhatsApp", "Correo",
              "País", "Ciudad", "Tallas", "Uds.", "Subtotal",
              "Envío", "Total", "Pago", "Despacho", "Acciones",
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-3 text-zinc-500 font-semibold uppercase tracking-widest text-[10px] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => {
            const edit = edits[order.id];
            const isSaving = saving[order.id];
            const wasSaved = saved[order.id];

            return (
              <tr
                key={order.id}
                className={`border-b border-[#1a1a1a] ${
                  i % 2 === 0 ? "bg-[#0d0d0d]" : "bg-[#0a0a0a]"
                } hover:bg-[#131320]/60 transition-colors`}
              >
                {/* Date */}
                <td className="px-3 py-3 text-zinc-400 whitespace-nowrap text-[12px]">
                  {fmtDate(order.created_at)}
                </td>
                {/* Nombre */}
                <td className="px-3 py-3 text-white whitespace-nowrap">
                  {order.nombre}
                </td>
                {/* Cédula */}
                <td className="px-3 py-3 text-zinc-400">
                  {order.cedula ?? "—"}
                </td>
                {/* WhatsApp */}
                <td className="px-3 py-3">
                  <a
                    href={`https://wa.me/${order.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3444DA] hover:underline whitespace-nowrap"
                  >
                    {order.whatsapp}
                  </a>
                </td>
                {/* Correo */}
                <td className="px-3 py-3 text-zinc-400 max-w-[160px] truncate">
                  {order.correo ?? "—"}
                </td>
                {/* País */}
                <td className="px-3 py-3 text-zinc-300 whitespace-nowrap">
                  {order.is_international ? (
                    <span className="text-orange-400">{order.pais} 🌐</span>
                  ) : (
                    order.pais
                  )}
                </td>
                {/* Ciudad */}
                <td className="px-3 py-3 text-zinc-400 whitespace-nowrap">
                  {order.ciudad ?? "—"}
                </td>
                {/* Tallas */}
                <td className="px-3 py-3 text-zinc-300 font-mono text-[12px] whitespace-nowrap">
                  {order.sizes ? formatSizes(order.sizes) : "—"}
                </td>
                {/* Total units */}
                <td className="px-3 py-3 text-zinc-300 text-center">
                  {order.total_units}
                </td>
                {/* Subtotal */}
                <td className="px-3 py-3 text-zinc-300 tabular-nums whitespace-nowrap">
                  {fmt(order.subtotal)}
                </td>
                {/* Shipping */}
                <td className="px-3 py-3 text-zinc-300 tabular-nums whitespace-nowrap">
                  {order.is_international ? (
                    <span className="text-orange-400">Por confirmar</span>
                  ) : (
                    fmt(order.shipping_cost)
                  )}
                </td>
                {/* Total */}
                <td className="px-3 py-3 text-white font-semibold tabular-nums whitespace-nowrap">
                  {order.is_international ? (
                    <span className="text-orange-400">—</span>
                  ) : (
                    fmt(order.total)
                  )}
                </td>
                {/* Payment status */}
                <td className="px-3 py-3">
                  <PaymentBadge status={order.payment_status} />
                </td>
                {/* Fulfillment status */}
                <td className="px-3 py-3">
                  <FulfillmentBadge status={order.fulfillment_status} />
                </td>

                {/* Actions */}
                <td className="px-3 py-3">
                  {edit && (
                    <div className="flex flex-col gap-2 min-w-[280px]">
                      {/* Fulfillment dropdown — locked once cancelled */}
                      <div className="flex gap-2">
                        {order.fulfillment_status === "CANCELADO" ? (
                          <span className="flex-1 bg-[#111] border border-[#2a2a2a] text-zinc-500 text-xs px-2 py-1 italic">
                            Pedido cancelado — no editable
                          </span>
                        ) : (
                          <select
                            value={edit.fulfillment_status}
                            onChange={(e) =>
                              setEdit(
                                order.id,
                                "fulfillment_status",
                                e.target.value as FulfillmentStatus
                              )
                            }
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs px-2 py-1 outline-none focus:border-[#3444DA] flex-1"
                          >
                            {FULFILLMENT_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={edit.notes}
                          onChange={(e) =>
                            setEdit(order.id, "notes", e.target.value)
                          }
                          placeholder="Notas internas..."
                          className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs px-2 py-1 outline-none focus:border-[#3444DA] placeholder:text-zinc-700 min-w-0"
                        />
                        <button
                          onClick={() => handleSave(order.id)}
                          disabled={isSaving}
                          className={`text-xs px-3 py-1 font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                            wasSaved
                              ? "bg-green-800 text-green-200 border border-green-700"
                              : "bg-[#3444DA] text-white hover:bg-[#2a38c0] disabled:opacity-50"
                          }`}
                        >
                          {isSaving ? "..." : wasSaved ? "✓ Guardado" : "Guardar"}
                        </button>
                      </div>

                      {/* Payment link for international */}
                      {order.is_international && (
                        <button
                          onClick={() => onGeneratePaymentLink(order.id)}
                          className="text-xs px-3 py-1 bg-orange-900/30 border border-orange-700/40 text-orange-300 hover:bg-orange-900/50 transition-colors uppercase tracking-wider font-semibold text-left"
                        >
                          Generar Link de Pago
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
