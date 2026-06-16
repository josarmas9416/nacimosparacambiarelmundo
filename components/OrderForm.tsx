"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { calculateShipping } from "@/lib/shipping";
import type { SizeQuantities } from "@/types/order";

const SIZES = ["S", "M", "L", "XL", "2XL"] as const;
type SizeKey = (typeof SIZES)[number];

function centsToDisplay(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Country / province data ──────────────────────────────────────────────────

const ECUADOR_PROVINCES = [
  "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi",
  "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja",
  "Los Ríos", "Manabí", "Morona Santiago", "Napo", "Orellana", "Pastaza",
  "Pichincha", "Santa Elena", "Santo Domingo de los Tsáchilas",
  "Sucumbíos", "Tungurahua", "Zamora Chinchipe",
];


const PHONE_CODES = [
  { label: "Ecuador", code: "+593" },
  { label: "Argentina", code: "+54" },
  { label: "Alemania", code: "+49" },
  { label: "Australia", code: "+61" },
  { label: "Bélgica", code: "+32" },
  { label: "Bolivia", code: "+591" },
  { label: "Brasil", code: "+55" },
  { label: "Canadá", code: "+1" },
  { label: "Chile", code: "+56" },
  { label: "China", code: "+86" },
  { label: "Colombia", code: "+57" },
  { label: "Corea del Sur", code: "+82" },
  { label: "Costa Rica", code: "+506" },
  { label: "Cuba", code: "+53" },
  { label: "El Salvador", code: "+503" },
  { label: "España", code: "+34" },
  { label: "Estados Unidos", code: "+1" },
  { label: "Francia", code: "+33" },
  { label: "Guatemala", code: "+502" },
  { label: "Haití", code: "+509" },
  { label: "Honduras", code: "+504" },
  { label: "Italia", code: "+39" },
  { label: "Japón", code: "+81" },
  { label: "México", code: "+52" },
  { label: "Nicaragua", code: "+505" },
  { label: "Países Bajos", code: "+31" },
  { label: "Panamá", code: "+507" },
  { label: "Paraguay", code: "+595" },
  { label: "Perú", code: "+51" },
  { label: "Portugal", code: "+351" },
  { label: "Puerto Rico", code: "+1787" },
  { label: "Reino Unido", code: "+44" },
  { label: "Rep. Dominicana", code: "+1809" },
  { label: "Rusia", code: "+7" },
  { label: "Suiza", code: "+41" },
  { label: "Uruguay", code: "+598" },
  { label: "Venezuela", code: "+58" },
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

// ── Cajita de Pagos widget ───────────────────────────────────────────────────

interface PayphoneConfig {
  orderId: string;
  total: number;  // centavos
  whatsapp: string;
  correo: string;
  cedula: string;
}

function buildPhone(code: string, number: string): string {
  const local = number.startsWith("0") ? number.slice(1) : number;
  return code + local;
}

function loadCajita(config: PayphoneConfig) {
  const SRC = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js";
  // Use new Function so webpack doesn't try to bundle the CDN URL
  const dynamicImport = new Function("url", "return import(url)");

  const initWidget = () => {
    const Ctor = (window as any).PPaymentButtonBox;
    if (typeof Ctor !== "function") return false;
    const payload = {
      token: process.env.NEXT_PUBLIC_PAYPHONE_TOKEN,
      clientTransactionId: config.orderId,
      amount: config.total,
      amountWithoutTax: config.total,
      amountWithTax: 0,
      tax: 0,
      service: 0,
      tip: 0,
      currency: "USD",
      storeId: process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID ?? "",
      reference: `Camiseta Ecuador 2026 - ${config.cedula}`,
      defaultMethod: "card",
      phoneNumber: config.whatsapp,
      email: config.correo,
      documentId: config.cedula,
      identificationType: /^\d{10}$/.test(config.cedula) ? 1 : 3,
      responseUrl: `${window.location.origin}/confirmar`,
    };
    new Ctor(payload).render("pp-button");
    return true;
  };

  // PPaymentButtonBox already on window (script loaded on a previous render)
  if (initWidget()) return;

  dynamicImport(SRC)
    .then(() => {
      if (!initWidget()) {
        console.error("[Cajita] PPaymentButtonBox not found on window after module load.");
      }
    })
    .catch((err: unknown) => console.error("[Cajita] Failed to load:", err));
}

// ────────────────────────────────────────────────────────────────────────────

interface Props {
  tshirtPrice?: number;
  stock?: SizeQuantities;
}

const DEFAULT_STOCK: SizeQuantities = { S: 99, M: 99, L: 99, XL: 99, "2XL": 99 };

type Step = "form" | "payment" | "international";

export default function OrderForm({
  tshirtPrice = 4999,
  stock = DEFAULT_STOCK,
}: Props) {
  const [quantities, setQuantities] = useState<SizeQuantities>({
    S: 0, M: 0, L: 0, XL: 0, "2XL": 0,
  });
  const [whatsappCode, setWhatsappCode] = useState("+593");
  const [whatsappCustomCode, setWhatsappCustomCode] = useState("");
  const [fields, setFields] = useState({
    nombre: "",
    cedula: "",
    whatsapp: "",
    correo: "",
    pais: "Ecuador",
    provincia: "",
    ciudad: "",
    direccion: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [paymentConfig, setPaymentConfig] = useState<PayphoneConfig | null>(null);
  const widgetRef = useRef(false);

  const isEcuador = fields.pais === "Ecuador";
  const totalUnits = SIZES.reduce((acc, s) => acc + quantities[s], 0);

  const shipping = useMemo(
    () => calculateShipping(fields.pais, fields.provincia, fields.ciudad),
    [fields.pais, fields.provincia, fields.ciudad]
  );

  const subtotalCents = totalUnits * tshirtPrice;

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
      pais: value,
      provincia: "",
      ciudad: "",
      direccion: "",
    }));
  };

  // Initialize the Cajita widget once the payment step is reached
  useEffect(() => {
    if (step !== "payment" || !paymentConfig || widgetRef.current) return;
    widgetRef.current = true;
    loadCajita(paymentConfig);
  }, [step, paymentConfig]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
        body: JSON.stringify({ ...fields, whatsapp: buildPhone(whatsappCode === "otro" ? whatsappCustomCode : whatsappCode, fields.whatsapp), sizes: quantities }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al procesar el pedido.");
        return;
      }

      if (data.international) {
        setStep("international");
        return;
      }

      // Ecuador — orderId + total returned, show Cajita widget
      setPaymentConfig({
        orderId: data.orderId,
        total: data.total,
        whatsapp: buildPhone(whatsappCode === "otro" ? whatsappCustomCode : whatsappCode, fields.whatsapp),
        correo: fields.correo,
        cedula: fields.cedula,
      });
      setStep("payment");
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = async (cancelOrder = false) => {
    if (cancelOrder && paymentConfig?.orderId) {
      await fetch("/api/cancel-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: paymentConfig.orderId }),
      }).catch(() => {}); // best-effort; don't block the UI reset
    }
    setStep("form");
    setPaymentConfig(null);
    widgetRef.current = false;
    setWhatsappCode("+593");
    setWhatsappCustomCode("");
    setFields({ nombre: "", cedula: "", whatsapp: "", correo: "", pais: "Ecuador", provincia: "", ciudad: "", direccion: "" });
    setQuantities({ S: 0, M: 0, L: 0, XL: 0, "2XL": 0 });
  };

  /* ── International success ── */
  if (step === "international") {
    return (
      <div className="bg-ecu-blue/10 border border-ecu-blue p-unit-xl text-center space-y-unit-md">
        <span className="material-symbols-outlined text-ecu-blue text-5xl block">check_circle</span>
        <h3 className="font-headline-lg text-headline-lg-mobile uppercase">¡Pedido recibido!</h3>
        <p className="font-body-lg text-body-lg text-secondary">
          Te contactaremos por WhatsApp para coordinar el pago y el envío
          internacional.
        </p>
        <button
          onClick={() => resetForm(false)}
          className="font-label-bold text-label-bold uppercase underline underline-offset-4 text-secondary hover:text-ecu-blue transition-colors"
        >
          Hacer otro pedido
        </button>
      </div>
    );
  }

  /* ── Cajita de Pagos widget ── */
  if (step === "payment") {
    return (
      <div className="space-y-unit-lg">
        <div className="bg-ecu-blue/5 border border-ecu-blue/30 p-unit-md">
          <p className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue mb-1">
            Pedido registrado
          </p>
          <p className="font-body-md text-body-md text-secondary text-sm">
            Completa el pago a continuación. Tienes 5 minutos antes de que
            la sesión expire.
          </p>
        </div>

        {/* Cajita widget mounts here */}
        <div id="pp-button" className="min-h-75" />

        <button
          onClick={() => resetForm(true)}
          className="text-xs text-secondary underline underline-offset-2 hover:text-ecu-blue transition-colors"
        >
          Cancelar y volver al formulario
        </button>
      </div>
    );
  }

  /* ── Order form ── */
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

      {/* Row 2: WhatsApp (full width) */}
      <div className="flex flex-col gap-1">
        <label className="font-label-bold text-label-bold uppercase text-[10px] text-ecu-blue">
          WhatsApp *
        </label>
        <div className="flex items-center border-b border-primary focus-within:border-ecu-blue transition-colors">
          <select
            value={whatsappCode}
            onChange={(e) => setWhatsappCode(e.target.value)}
            className="bg-transparent py-2 pr-2 outline-none cursor-pointer text-sm shrink-0"
          >
            {PHONE_CODES.map(({ label, code }) => (
              <option key={label} value={code}>{code} — {label}</option>
            ))}
            <option value="otro">Otro país…</option>
          </select>
          <span className="text-outline/30 select-none px-1 text-sm">|</span>
          {whatsappCode === "otro" && (
            <input
              type="text" placeholder="+XX"
              value={whatsappCustomCode}
              onChange={(e) => setWhatsappCustomCode(e.target.value)}
              className="w-16 bg-transparent py-2 pr-1 outline-none text-sm text-center placeholder:text-outline/50 shrink-0"
            />
          )}
          <input
            required type="tel" placeholder="992665224"
            value={fields.whatsapp}
            onChange={(e) => handleField("whatsapp", e.target.value)}
            className="flex-1 bg-transparent py-2 pl-1 placeholder:text-outline/50 outline-none"
          />
        </div>
      </div>

      {/* Row 3: Correo */}
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

      {/* Row 4: Tallas */}
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
                      <span className="text-[10px] text-outline/50 uppercase tracking-widest">Ag.</span>
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
            {LATAM_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="Otros países">
            {OTHER_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
                {ECUADOR_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
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

      {/* Price breakdown */}
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
            Pagarás de forma segura con tarjeta de crédito o débito. Tu
            pedido se procesa tras confirmar el pago.
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
