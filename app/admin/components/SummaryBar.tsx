import type { Order } from "@/types/order";

export interface SummaryStats {
  ordersToday: number;
  ordersThisMonth: number;
  revenueThisMonth: number; // centavos
  pendingOrders: number;
}

export function computeStats(orders: Order[]): SummaryStats {
  const now = new Date();
  const todayStr = now.toDateString();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const ordersToday = orders.filter(
    (o) => new Date(o.created_at).toDateString() === todayStr
  ).length;

  const monthOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const revenueThisMonth = monthOrders
    .filter((o) => o.payment_status === "PAGADO")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(
    (o) => o.payment_status === "PENDIENTE"
  ).length;

  return {
    ordersToday,
    ordersThisMonth: monthOrders.length,
    revenueThisMonth,
    pendingOrders,
  };
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-[#111111] border border-[#222222] p-5 flex flex-col gap-1">
      <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-semibold">
        {label}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${accent ?? "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

export default function SummaryBar({ stats }: { stats: SummaryStats }) {
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Pedidos hoy" value={String(stats.ordersToday)} />
      <StatCard label="Pedidos este mes" value={String(stats.ordersThisMonth)} />
      <StatCard
        label="Ingresos este mes"
        value={fmt(stats.revenueThisMonth)}
        accent="text-[#3444DA]"
      />
      <StatCard
        label="Pendientes de pago"
        value={String(stats.pendingOrders)}
        accent={stats.pendingOrders > 0 ? "text-yellow-400" : "text-white"}
      />
    </div>
  );
}
