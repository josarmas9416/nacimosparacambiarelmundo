"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "./context";
import type { Order } from "@/types/order";
import SummaryBar, { computeStats, type SummaryStats } from "./components/SummaryBar";
import Filters, { type FilterValues } from "./components/Filters";
import OrdersTable from "./components/OrdersTable";
import PaymentLinkModal from "./components/PaymentLinkModal";

export default function AdminPage() {
  const { token } = useAdmin();

  const [orders,        setOrders]        = useState<Order[]>([]);
  const [stats,         setStats]         = useState<SummaryStats | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [paymentModal,  setPaymentModal]  = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (params?: Partial<FilterValues>) => {
      if (!token) return [];
      const url = new URL("/api/orders", window.location.origin);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== "" && v !== false && v !== "ALL") {
            url.searchParams.set(k, String(v));
          }
        });
      }
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json() as Promise<Order[]>;
    },
    [token]
  );

  // Initial load: all orders → compute summary
  useEffect(() => {
    if (!token) return;
    fetchOrders().then((data) => {
      setStats(computeStats(data));
      setOrders(data);
      setLoading(false);
    });
  }, [token, fetchOrders]);

  const handleApplyFilters = async (filters: FilterValues) => {
    setFilterLoading(true);
    const data = await fetchOrders(filters);
    setOrders(data);
    setFilterLoading(false);
  };

  const handleRefresh = useCallback(async () => {
    const data = await fetchOrders();
    setOrders(data);
    setStats(computeStats(data));
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-zinc-500 text-[11px] uppercase tracking-widest animate-pulse">
          Cargando pedidos...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-bold uppercase tracking-widest">
            Pedidos
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {orders.length} resultado{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          title="Actualizar"
          className="text-zinc-400 hover:text-white transition-colors text-xl"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      {/* Summary */}
      {stats && <SummaryBar stats={stats} />}

      {/* Filters */}
      <Filters onApply={handleApplyFilters} loading={filterLoading} />

      {/* Table */}
      <OrdersTable
        orders={orders}
        token={token}
        onRefresh={handleRefresh}
        onGeneratePaymentLink={(id) => setPaymentModal(id)}
      />

      {/* Payment link modal */}
      {paymentModal && (
        <PaymentLinkModal
          orderId={paymentModal}
          token={token}
          onClose={() => setPaymentModal(null)}
        />
      )}
    </div>
  );
}
