"use client";

import { useState } from "react";

interface Props {
  orderId: string;
  token: string;
  onClose: () => void;
}

export default function PaymentLinkModal({ orderId, token, onClose }: Props) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Ingresa un monto válido mayor a 0.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/create-payment-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId, custom_amount: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al generar el link.");
        return;
      }
      setLink(data.paymentLink);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (link) navigator.clipboard.writeText(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#111111] border border-[#222222] w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold uppercase tracking-widest text-sm">
            Generar Link de Pago
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <p className="text-zinc-500 text-sm">
          Ingresa el monto total en dólares (incluye envío internacional).
        </p>

        {!link ? (
          <div className="space-y-4">
            <div>
              <label className="text-zinc-500 text-[11px] uppercase tracking-widest font-semibold mb-1 block">
                Monto ($USD)
              </label>
              <div className="flex gap-2">
                <span className="bg-[#1a1a1a] border border-[#2a2a2a] border-r-0 text-zinc-500 px-3 py-2 text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="54.99"
                  className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white px-3 py-2 text-sm outline-none focus:border-[#3444DA] transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm border border-red-900/50 bg-red-900/10 px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-[#3444DA] text-white py-3 text-sm font-semibold uppercase tracking-widest hover:bg-[#2a38c0] transition-colors disabled:opacity-50"
            >
              {loading ? "Generando..." : "Generar link"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] p-3">
              <p className="text-zinc-400 text-[11px] uppercase tracking-widest font-semibold mb-2">
                Link de pago
              </p>
              <p className="text-white text-sm break-all">{link}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-300 py-2 text-sm font-semibold uppercase tracking-widest hover:border-zinc-500 hover:text-white transition-colors"
              >
                Copiar link
              </button>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#3444DA] text-white py-2 text-sm font-semibold uppercase tracking-widest text-center hover:bg-[#2a38c0] transition-colors"
              >
                Abrir link
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
