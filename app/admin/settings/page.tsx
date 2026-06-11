"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "../context";
import type { SizeQuantities } from "@/types/order";

const SIZES = ["S", "M", "L", "XL", "2XL"] as const;

const inputCls =
  "bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#3444DA] transition-colors w-full";
const labelCls =
  "text-zinc-500 text-[11px] uppercase tracking-widest font-semibold mb-1.5 block";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#111111] border border-[#222222] p-6">
      <div className="mb-5 pb-4 border-b border-[#222222]">
        <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
          {title}
        </h2>
        {description && (
          <p className="text-zinc-500 text-sm mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { token } = useAdmin();

  const [price,       setPrice]       = useState("49.99");
  const [stock,       setStock]       = useState<SizeQuantities>({
    S: 100, M: 100, L: 100, XL: 100, "2XL": 100,
  });
  const [storeActive, setStoreActive] = useState(true);
  const [storeNotice, setStoreNotice] = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/settings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setPrice((data.tshirt_price / 100).toFixed(2));
        setStock(data.stock);
        setStoreActive(data.store_active ?? true);
        setStoreNotice(data.store_notice ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleStockChange = (size: (typeof SIZES)[number], value: string) => {
    const n = Math.max(0, parseInt(value) || 0);
    setStock((s) => ({ ...s, [size]: n }));
  };

  const totalStock = SIZES.reduce((acc, s) => acc + stock[s], 0);

  const handleSave = async () => {
    const parsed = parseFloat(price);
    if (!parsed || parsed <= 0) {
      setError("El precio debe ser mayor a $0.00");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tshirt_price: Math.round(parsed * 100),
        stock,
        store_active: storeActive,
        store_notice: storeNotice,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-zinc-500 text-[11px] uppercase tracking-widest animate-pulse">
          Cargando...
        </p>
      </div>
    );
  }

  const priceCents = Math.round(parseFloat(price) * 100) || 0;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-white text-xl font-bold uppercase tracking-widest">
          Configuración
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Gestiona el precio y stock de la camiseta.
        </p>
      </div>

      {/* ── Price ── */}
      <Section
        title="Precio de la Camiseta"
        description="Precio que verán los clientes en la tienda. Incluye envío nacional."
      >
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className={labelCls}>Precio (USD)</label>
            <div className="flex">
              <span className="bg-[#111111] border border-r-0 border-[#2a2a2a] text-zinc-500 px-3 py-2 text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#3444DA] transition-colors"
              />
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#222222] px-4 py-2 shrink-0">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest">
              Almacenado como
            </p>
            <p className="text-white text-sm font-mono mt-0.5">
              {priceCents} centavos
            </p>
          </div>
        </div>
      </Section>

      {/* ── Stock ── */}
      <Section
        title="Stock por Talla"
        description="Unidades disponibles por talla. Los clientes no podrán pedir tallas con stock 0."
      >
        <div className="grid grid-cols-5 gap-3 mb-4">
          {SIZES.map((size) => {
            const qty = stock[size];
            const isOut = qty === 0;
            return (
              <div key={size} className="flex flex-col gap-1.5">
                <label className={labelCls + " text-center"}>{size}</label>
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => handleStockChange(size, e.target.value)}
                  className={`${inputCls} text-center tabular-nums`}
                />
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider text-center ${
                    isOut ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {isOut ? "Agotado" : "Disponible"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
          <p className="text-zinc-500 text-sm">
            Stock total:{" "}
            <span className="text-white font-semibold">{totalStock} unidades</span>
          </p>
          <button
            onClick={() =>
              setStock({ S: 0, M: 0, L: 0, XL: 0, "2XL": 0 })
            }
            className="text-xs text-zinc-600 hover:text-red-400 transition-colors uppercase tracking-widest"
          >
            Poner todo en 0
          </button>
        </div>
      </Section>

      {/* ── Store toggle + notice ── */}
      <Section
        title="Estado de la Tienda"
        description="Controla si los clientes pueden realizar pedidos y el mensaje que verán."
      >
        {/* Toggle */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white text-sm font-semibold">
              Formulario de pedidos
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {storeActive
                ? "Los clientes pueden hacer pedidos ahora mismo."
                : "El formulario está desactivado. Los clientes ven el aviso."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStoreActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              storeActive ? "bg-[#3444DA]" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                storeActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Notice message */}
        <div>
          <label className={labelCls}>
            Mensaje de aviso{" "}
            <span className="text-zinc-600 normal-case tracking-normal">
              (visible cuando el formulario está desactivado)
            </span>
          </label>
          <textarea
            rows={3}
            value={storeNotice}
            onChange={(e) => setStoreNotice(e.target.value)}
            placeholder="Ej: Nuevo lote disponible a partir del 20 de junio. ¡Vuelve pronto!"
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#3444DA] transition-colors w-full resize-none placeholder:text-zinc-700"
          />
        </div>
      </Section>

      {/* ── Save ── */}
      {error && (
        <p className="text-red-400 text-sm border border-red-900/50 bg-red-900/10 px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`
          w-full py-3.5 text-sm font-semibold uppercase tracking-widest transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${saved
            ? "bg-green-800 text-green-200 border border-green-700"
            : "bg-[#3444DA] text-white hover:bg-[#2a38c0]"
          }
        `}
      >
        {saving ? "Guardando..." : saved ? "✓ Cambios guardados" : "Guardar cambios"}
      </button>

      {/* Live preview */}
      <div className="bg-[#0d0d0d] border border-[#222222] p-4">
        <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-3">
          Vista previa en tienda
        </p>
        <div className="flex items-center gap-4">
          <p className="text-2xl font-bold text-white">
            ${parseFloat(price || "0").toFixed(2)}
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {SIZES.map((s) => (
              <span
                key={s}
                className={`px-2 py-0.5 text-xs font-semibold border ${
                  stock[s] === 0
                    ? "border-zinc-800 text-zinc-700 line-through"
                    : "border-[#3444DA]/40 text-[#3444DA]"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
