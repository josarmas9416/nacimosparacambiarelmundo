"use client";

import { useState } from "react";

export interface FilterValues {
  payment_status: string;
  fulfillment_status: string;
  date_from: string;
  date_to: string;
  is_international: boolean;
}

const PAYMENT_STATUSES = ["ALL", "PENDIENTE", "PAGADO", "FALLIDO"];
const FULFILLMENT_STATUSES = [
  "ALL",
  "EN PREPARACION",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
];

const inputCls =
  "bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm px-3 py-2 outline-none focus:border-[#3444DA] transition-colors w-full";
const labelCls = "text-zinc-500 text-[11px] uppercase tracking-widest font-semibold mb-1 block";

export default function Filters({
  onApply,
  loading,
}: {
  onApply: (f: FilterValues) => void;
  loading: boolean;
}) {
  const [filters, setFilters] = useState<FilterValues>({
    payment_status: "ALL",
    fulfillment_status: "ALL",
    date_from: "",
    date_to: "",
    is_international: false,
  });

  const set = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const handleReset = () => {
    const empty: FilterValues = {
      payment_status: "ALL",
      fulfillment_status: "ALL",
      date_from: "",
      date_to: "",
      is_international: false,
    };
    setFilters(empty);
    onApply(empty);
  };

  return (
    <div className="bg-[#111111] border border-[#222222] p-5 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        {/* Payment status */}
        <div>
          <label className={labelCls}>Estado pago</label>
          <select
            value={filters.payment_status}
            onChange={(e) => set("payment_status", e.target.value)}
            className={inputCls}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Fulfillment status */}
        <div>
          <label className={labelCls}>Estado envío</label>
          <select
            value={filters.fulfillment_status}
            onChange={(e) => set("fulfillment_status", e.target.value)}
            className={inputCls}
          >
            {FULFILLMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Date from */}
        <div>
          <label className={labelCls}>Desde</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => set("date_from", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Date to */}
        <div>
          <label className={labelCls}>Hasta</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => set("date_to", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* International */}
        <div className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            id="intl-filter"
            checked={filters.is_international}
            onChange={(e) => set("is_international", e.target.checked)}
            className="accent-[#3444DA] w-4 h-4"
          />
          <label
            htmlFor="intl-filter"
            className="text-zinc-400 text-sm cursor-pointer select-none"
          >
            Internacionales
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onApply(filters)}
            disabled={loading}
            className="flex-1 bg-[#3444DA] text-white text-sm py-2 font-semibold uppercase tracking-widest hover:bg-[#2a38c0] transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Aplicar"}
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-3 bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-400 text-sm hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
