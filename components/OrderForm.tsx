"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { calculateShipping } from "@/lib/shipping";
import type { SizeQuantities } from "@/types/order";

const SIZES = ["S", "M", "L", "XL", "2XL"] as const;
type SizeKey = (typeof SIZES)[number];

function centsToDisplay(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

type SuccessType = "local" | "international";

// ── Country / province data ──────────────────────────────────────────────────

const ECUADOR_PROVINCES = [
  "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi",
  "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja",
  "Los Ríos", "Manabí", "Morona Santiago", "Napo", "Orellana", "Pastaza",
  "Pichincha", "Santa Elena", "Santo Domingo de los Tsáchilas",
  "Sucumbíos", "Tungurahua", "Zamora Chinchipe",
];

const LATAM_COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
  "Cuba", "El Salvador", "Guatemala", "Haití", "Honduras", "México",
  "Nicaragua", "Panamá", "Paraguay", "Perú", "Puerto Rico",
  "República Dominicana", "Uruguay", "Venezuela",
];

const OTHER_COUNTRIES = [
  "Alemania", "Australia", "Bélgica", "Canadá", "China", "Corea del Sur",
  "España", "Estados Unidos", "Francia", "Italia", "Japón", "Países Bajos",
  "Portugal", "Reino Unido", "Rusia", "Suiza",
];

// ────────────────────────────────────────────────────────────────────────────

interface Props {
  tshirtPrice?: number;
  stock?: SizeQuantities;
}

const DEFAULT_STOCK: SizeQuantities = { S: 99, M: 99, L: 99, XL: 99, "2XL": 99 };

export default function OrderForm({
  tshirtPrice = 4999,
  stock = DEFAULT_STOCK,
}: Props) {
  const [quantities, setQuantities] = useState<SizeQuantities>({
    S: 0, M: 0, L: 0, XL: 0, "2XL": 0,
  });
  const [fields, setFields] = useState({
    nombre:    "",
    cedula:    "",
    whatsapp:  "",
    correo:    "",
    pais:      "Ecuador",
    provincia: "",
    ciudad:    "",
    direccion: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessType | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  const isEcuador = fields.pais === "Ecuador";
  const totalUnits = SIZES.reduce((acc, s) => acc + quantities[s], 0);

  const shipping = useMemo(
    () => calculateShipping(fields.pais, fields.provincia, fields.ciudad),
    [fields.pais, fields.provincia, fields.ciudad]
  );

  const subtotalCents = totalUnits * tshirtPrice;
  const totalCents    = subtotalCents + (shipping.isInternational ? 0 : shipping.cost);

  const handleQty = (size: SizeKey, value: string) => {
    const n = Math.min(
      Math.max(0, parseInt(value) || 0),
      stock[size] > 0 ? stock[size] : 0
    );
    setQuantities((q) => ({ ...q, [size]: n }));
  };

  const handleField = (key: keyof typeof fields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
  };

  const handleCountryChange = (value: string) => {
    setFields((f) => ({
      ...f,
      pais:      value,
      provincia: "",
      ciudad:    "",
      direccion: "",
    }));
  };

  const resetForm = () => {
    setSuccess(null);
    setPaymentLink(null);
    setFields({ nombre:"",cedula:"",whatsapp:"",correo:"",pais:"Ecuador",provincia:"",ciudad:"",direccion:"" });
    setQuantities({ S:0, M:0, L:0, XL:0, "2XL":0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totalUnits === 0) {
      setError("Selecciona al menos una prenda.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, sizes: quantities }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al procesar el pedido.");
        return;
      }

      if (data.international) {
        setSuccess("international");
        return;
      }

      if (data.paymentLink) {
        setPaymentLink(data.paymentLink);
        setSuccess("local");
        window.open(data.paymentLink, "_blank", "noopener,noreferrer");
        return;
      }

      if (data.success) {
        setSuccess("local");
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screens ── */
  if (success === "international") {
    return (
      <div className="bg-ecu-blue/10 border border-ecu-blue p-unit-xl text-center space-y-unit-md">
        <span className="material-symbols-outlined text-ecu-blue text-5xl block">check_circle</span>
        <h3 className="font-headline-lg text-headline-lg-mobile uppercase">¡Pedido recibido!</h3>
        <p className="font-body-lg text-body-lg text-secondary">
          Te contactaremos por WhatsApp para confirmar el costo de envío y
          procesar tu pedido.
        </p>
        <button
          onClick={resetForm}
          className="font-label-bold text-label-bold uppercase underline underline-offset-4 text-secondary hover:text-ecu-blue transition-colors"
        >
          Hacer otro pedido
        </button>
      </div>
    );
  }

  if (success === "local") {
    return (
      <div className="bg-ecu-blue/10 border border-ecu-blue p-unit-xl text-center space-y-unit-md">
        <span className="material-symbols-outlined text-ecu-blue text-5xl block">check_circle</span>
        <h3 className="font-headline-lg text-headline-lg-mobile uppercase">¡Pedido recibido!</h3>
        {paymentLink ? (
          <>
            <p className="font-body-lg text-body-lg text-secondary">
              Se abrió la página de pago en una nueva ventana.
            </p>
            <div className="space-y-unit-sm">
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                Si no se abrió automáticamente:
              </p>
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-ecu-blue text-white px-unit-xl py-3 font-label-bold text-label-bold uppercase hover:opacity-90 transition-opacity"
              >
                Ir a pagar
              </a>
            </div>
          </>
        ) : (
          <p className="font-body-lg text-body-lg text-secondary">
            Tu pedido fue registrado. Te contactaremos pronto para confirmar el pago.
          </p>
        )}
        <button
          onClick={resetForm}
          className="block font-label-bold text-label-bold uppercase underline underline-offset-4 text-secondary hover:text-ecu-blue transition-colors mx-auto"
        >
          Hacer otro pedido
        </button>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <form onSubmit={handleSubmit} className="space-y-unit-lg">
      {/* Row 1: Nombre + Cédula */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-lg">
        <div className="flex flex-col gap-1">
          <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
            Nombre Completo *
          </label>
          <input
            required type="text" placeholder="Ej: Juan Pérez"
            value={fields.nombre}
            onChange={(e) => handleField("nombre", e.target.value)}
            className="w-full bg-transparent border-b border-primary p-2 placeholder:text-outline/50 outline-none focus:border-ecu-blue transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
            Cédula / Pasaporte *
          </label>
          <input
            required type="text" placeholder="Ej: 1712345678"
            value={fields.cedula}
            onChange={(e) => handleField("cedula", e.target.value)}
            className="w-full bg-transparent border-b border-primary p-2 placeholder:text-outline/50 outline-none focus:border-ecu-blue transition-colors"
          />
        </div>
      </div>

      {/* Row 2: WhatsApp + Correo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-lg">
        <div className="flex flex-col gap-1">
          <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
            WhatsApp *
          </label>
          <input
            required type="tel" placeholder="+593 ..."
            value={fields.whatsapp}
            onChange={(e) => handleField("whatsapp", e.target.value)}
            className="w-full bg-transparent border-b border-primary p-2 placeholder:text-outline/50 outline-none focus:border-ecu-blue transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
            Correo *
          </label>
          <input
            required type="email" placeholder="Ej: juan@correo.com"
            value={fields.correo}
            onChange={(e) => handleField("correo", e.target.value)}
            className="w-full bg-transparent border-b border-primary p-2 placeholder:text-outline/50 outline-none focus:border-ecu-blue transition-colors"
          />
        </div>
      </div>

      {/* Row 3: Tallas + stock */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
            Tallas y Cantidades *
          </label>
          <Link
            href="#size-guide"
            className="text-[10px] font-label-bold uppercase text-secondary underline underline-offset-2 hover:text-ecu-blue transition-colors"
          >
            Ver guía de tallas
          </Link>
        </div>
        <div className="flex items-start gap-3 mt-1">
          <div className="flex gap-2 flex-1">
            {SIZES.map((size) => {
              const soldOut = stock[size] === 0;
              return (
                <div key={size} className="flex flex-col items-center gap-1">
                  <span className="font-label-bold text-[10px] uppercase text-on-surface-variant">
                    {size}
                  </span>
                  {soldOut ? (
                    <div className="w-full border-b border-primary/30 p-1 text-center">
                      <span className="text-[10px] text-outline/50 uppercase tracking-widest">
                        Ag.
                      </span>
                    </div>
                  ) : (
                    <input
                      type="number" min={0} max={stock[size]}
                      value={quantities[size]}
                      onChange={(e) => handleQty(size, e.target.value)}
                      className="w-full bg-transparent border-b border-primary p-1 text-center tabular-nums outline-none focus:border-ecu-blue transition-colors"
                    />
                  )}
                  {soldOut && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-ecu-red">
                      Agotado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-1 border-l border-primary/10 pl-3 shrink-0">
            <span className="font-label-bold text-[10px] uppercase text-ecu-blue">Total</span>
            <span className="font-label-bold text-[14px] text-ecu-blue tabular-nums leading-[1.4] pb-1">
              {totalUnits}
            </span>
          </div>
        </div>
      </div>

      {/* Row 4: País */}
      <div className="flex flex-col gap-1">
        <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
          País *
        </label>
        <select
          required
          value={fields.pais}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="w-full bg-transparent border-b border-primary p-2 outline-none focus:border-ecu-blue transition-colors appearance-none cursor-pointer"
        >
          <option value="Ecuador">Ecuador</option>
          <optgroup label="América Latina">
            {LATAM_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </optgroup>
          <optgroup label="Otros países">
            {OTHER_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Ecuador: Provincia + Ciudad + Dirección */}
      {isEcuador && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-lg">
            <div className="flex flex-col gap-1">
              <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
                Provincia *
              </label>
              <select
                required
                value={fields.provincia}
                onChange={(e) => handleField("provincia", e.target.value)}
                className="w-full bg-transparent border-b border-primary p-2 outline-none focus:border-ecu-blue transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>Selecciona una provincia</option>
                {ECUADOR_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
                Ciudad *
              </label>
              <input
                required type="text" placeholder="Ej: Quito"
                value={fields.ciudad}
                onChange={(e) => handleField("ciudad", e.target.value)}
                className="w-full bg-transparent border-b border-primary p-2 placeholder:text-outline/50 outline-none focus:border-ecu-blue transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
              Dirección Exacta *
            </label>
            <input
              required type="text" placeholder="Calle principal, secundaria y numeración"
              value={fields.direccion}
              onChange={(e) => handleField("direccion", e.target.value)}
              className="w-full bg-transparent border-b border-primary p-2 placeholder:text-outline/50 outline-none focus:border-ecu-blue transition-colors"
            />
          </div>
        </>
      )}

      {/* International notice */}
      {!isEcuador && (
        <div className="bg-ecu-blue/5 p-unit-md flex items-start gap-unit-md border-l-4 border-ecu-blue">
          <span className="material-symbols-outlined text-ecu-blue mt-1">info</span>
          <p className="font-body-md text-body-md text-secondary text-sm">
            Para envíos internacionales te contactaremos por WhatsApp para
            coordinar el envío y confirmar el costo.
          </p>
        </div>
      )}

      {/* Live price breakdown */}
      {totalUnits > 0 && (
        <div className="border border-primary/10 p-unit-md space-y-2 bg-surface-container-low">
          <div className="flex justify-between font-body-md text-body-md">
            <span className="text-secondary">
              Subtotal ({totalUnits} prenda{totalUnits !== 1 ? "s" : ""})
            </span>
            <span>{centsToDisplay(subtotalCents)}</span>
          </div>
          <div className="flex justify-between font-body-md text-body-md">
            <span className="text-secondary">Envío</span>
            <span className="text-secondary italic text-sm">
              {shipping.isInternational
                ? "Por confirmar vía WhatsApp"
                : "Calculado al confirmar el pedido"}
            </span>
          </div>
        </div>
      )}

      {/* Info box (Ecuador only) */}
      {isEcuador && (
        <div className="bg-ecu-blue/5 p-unit-md flex items-start gap-unit-md border-l-4 border-ecu-blue">
          <span className="material-symbols-outlined text-ecu-blue mt-1">info</span>
          <p className="font-body-md text-body-md text-secondary text-sm">
            Tu pedido se procesa únicamente después de confirmar el pago. Recibirás
            confirmación por WhatsApp.
          </p>
        </div>
      )}

      {error && (
        <p className="font-body-md text-body-md text-ecu-red border border-ecu-red/30 bg-ecu-red/5 px-unit-md py-unit-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-6 font-label-bold text-label-bold uppercase tracking-widest hover:bg-ecu-blue transition-colors mt-unit-lg active:scale-[0.98] duration-150 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? "Procesando..."
          : totalUnits > 0
            ? `Hacer pedido • ${centsToDisplay(subtotalCents)} + envío`
            : "Hacer pedido"}
      </button>
    </form>
  );
}
