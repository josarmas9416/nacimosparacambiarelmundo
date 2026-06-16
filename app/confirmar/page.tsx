"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "approved" | "cancelled" | "error";

function ConfirmarContent() {
  const searchParams  = useSearchParams();
  const id            = searchParams.get("id");               // Payphone transaction id
  const clientTxId    = searchParams.get("clientTransactionId"); // our order UUID
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!id || !clientTxId) {
      setStatus("error");
      return;
    }

    fetch("/api/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, clientTransactionId: clientTxId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.approved)   setStatus("approved");
        else if (data.cancelled) setStatus("cancelled");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [id, clientTxId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-ecu-blue text-5xl block animate-spin">
            progress_activity
          </span>
          <p className="font-label-bold text-label-bold uppercase tracking-widest text-secondary">
            Confirmando pago…
          </p>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-unit-lg">
          <span className="material-symbols-outlined text-ecu-blue text-6xl block">
            check_circle
          </span>
          <h1 className="font-headline-lg text-headline-lg-mobile uppercase">
            ¡Pago confirmado!
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Tu pedido fue registrado y pagado exitosamente. Recibirás una
            confirmación por WhatsApp cuando tu camiseta esté en camino.
          </p>
          <Link
            href="/"
            className="inline-block bg-ecu-blue text-white px-unit-xl py-4 font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-unit-lg">
          <span className="material-symbols-outlined text-ecu-red text-6xl block">
            cancel
          </span>
          <h1 className="font-headline-lg text-headline-lg-mobile uppercase">
            Pago cancelado
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Tu pago no se completó. El pedido quedó registrado — puedes
            intentarlo de nuevo o contactarnos por WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/#order"
              className="inline-block bg-black text-white px-unit-xl py-4 font-label-bold text-label-bold uppercase hover:bg-ecu-blue transition-colors"
            >
              Intentar de nuevo
            </Link>
            <a
              href="https://wa.me/593963281878"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-primary text-primary px-unit-xl py-4 font-label-bold text-label-bold uppercase hover:border-ecu-blue hover:text-ecu-blue transition-colors"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-unit-lg">
        <span className="material-symbols-outlined text-ecu-red text-6xl block">
          error
        </span>
        <h1 className="font-headline-lg text-headline-lg-mobile uppercase">
          Error al confirmar
        </h1>
        <p className="font-body-lg text-body-lg text-secondary">
          No pudimos confirmar el estado de tu pago. Por favor contáctanos
          por WhatsApp con tu número de pedido.
        </p>
        <a
          href="https://wa.me/593963281878"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-ecu-blue text-white px-unit-xl py-4 font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity"
        >
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <span className="material-symbols-outlined text-ecu-blue text-5xl animate-spin">
            progress_activity
          </span>
        </div>
      }
    >
      <ConfirmarContent />
    </Suspense>
  );
}
