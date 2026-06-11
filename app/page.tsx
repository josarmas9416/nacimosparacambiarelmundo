import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Carousel from "@/components/Carousel";
import OrderForm from "@/components/OrderForm";
import Footer from "@/components/Footer";
import { supabaseAdmin } from "@/lib/supabase";
import type { SizeQuantities } from "@/types/order";

const DEFAULT_SETTINGS = {
  tshirt_price: 4999,
  stock: { S: 99, M: 99, L: 99, XL: 99, "2XL": 99 } as SizeQuantities,
  store_active: true,
  store_notice: "",
};

async function getSettings() {
  try {
    const { data } = await supabaseAdmin
      .from("settings")
      .select("tshirt_price, stock, store_active, store_notice")
      .single();
    return data ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const SIZE_TABLE = [
  { label: "TALLA S",   pecho: "50 cm", alto: "70 cm" },
  { label: "TALLA M",   pecho: "52 cm", alto: "72 cm" },
  { label: "TALLA L",   pecho: "54 cm", alto: "74 cm" },
  { label: "TALLA XL",  pecho: "56 cm", alto: "75 cm" },
  { label: "TALLA 2XL", pecho: "58 cm", alto: "76 cm" },
];

const HOW_IT_WORKS = [
  { num: "01", color: "text-ecu-yellow/30", title: "Elige",       body: "Selecciona tu talla y cantidad ideal." },
  { num: "02", color: "text-ecu-blue/30",   title: "Completa",    body: "Ingresa tus datos de envío en el formulario." },
  { num: "03", color: "text-ecu-red/30",    title: "Paga",        body: "Realiza tu pago de forma segura y rápida." },
  { num: "04", color: "text-primary/10",    title: "Confirmamos", body: "Recibe confirmación vía WhatsApp." },
];

export default async function Home() {
  const settings = await getSettings();
  return (
    <>
      <Header />

      <main className="pt-20">
        {/* ── Hero ── */}
        <section className="relative min-h-screen w-full flex items-end pb-16" id="hero">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image
              src="https://ajzbtmnyihqynsreailk.supabase.co/storage/v1/object/public/img/a1.jpeg"
              alt="Camiseta Ecuador 2026"
              fill
              className="object-cover object-center"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>

          <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop py-unit-xl max-w-container-max mx-auto text-white">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-unit-xs">
                <span className="bg-ecu-yellow text-black px-2 py-0.5 font-label-bold text-[14px] uppercase tracking-widest">
                  Tributo Nacional
                </span>
                <span className="bg-ecu-blue text-white px-2 py-0.5 font-label-bold text-[14px] uppercase tracking-widest">
                  Edición Limitada
                </span>
              </div>

              <h1 className="font-headline-xl text-headline-lg-mobile md:text-headline-xl uppercase mb-unit-sm leading-none">
                Camiseta<br />Ecuador 2026
              </h1>

              <p className="font-body-lg text-body-lg mb-unit-lg text-white/90">
                Lleva los colores de tu orgullo. Stock exclusivo para coleccionistas.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-unit-md mb-unit-sm">
                <p className="font-headline-lg text-headline-lg text-ecu-yellow">$49.99</p>
                <Link
                  href="#order"
                  className="bg-white text-black px-unit-xl py-4 font-label-bold text-label-bold uppercase text-center flex-1 sm:flex-none hover:bg-ecu-blue hover:text-white transition-all duration-300 shadow-xl"
                >
                  Comprar ahora
                </Link>
              </div>

              <p className="font-label-sm text-label-sm text-white/60 uppercase tracking-widest">
                ✓ Incluido envío dentro del Ecuador
              </p>
            </div>
          </div>
        </section>

        {/* ── Features + Carousel ── */}
        <section className="py-unit-xxl px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-xl items-center">
            <div className="order-2 md:order-1">
              <h2 className="font-headline-lg text-headline-lg uppercase mb-unit-lg">
                Calidad &amp; <span className="text-ecu-blue">Expresión</span>
              </h2>
              <ul className="space-y-unit-md mb-unit-xl">
                <li className="flex items-start gap-unit-md py-unit-sm border-b border-primary/10">
                  <span className="material-symbols-outlined text-ecu-blue mt-1">check_circle</span>
                  <div>
                    <p className="font-label-bold text-label-bold uppercase">Modern Fit Editorial</p>
                    <p className="font-body-md text-body-md text-secondary">
                      Diseñado para una silueta contemporánea y urbana.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-unit-md py-unit-sm border-b border-primary/10">
                  <span className="material-symbols-outlined text-ecu-blue mt-1">check_circle</span>
                  <div>
                    <p className="font-label-bold text-label-bold uppercase">Tejido Premium</p>
                    <p className="font-body-md text-body-md text-secondary">
                      Tela poliéster con textura de tela, acabado suave al tacto y durable.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-unit-md py-unit-sm border-b border-primary/10">
                  <span className="material-symbols-outlined text-ecu-blue mt-1">check_circle</span>
                  <div>
                    <p className="font-label-bold text-label-bold uppercase">Tallas Disponibles</p>
                    <div className="flex gap-unit-xs mt-unit-xs">
                      {(["S", "M", "L", "XL"] as const).map((s) => (
                        <span
                          key={s}
                          className="sharp-border px-3 py-1 font-label-sm text-label-sm hover:bg-ecu-yellow transition-colors cursor-default"
                        >
                          {s}
                        </span>
                      ))}
                      <span className="sharp-border px-3 py-1 font-label-sm text-label-sm text-white bg-ecu-blue">
                        2XL
                      </span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-unit-md py-unit-sm border-b border-primary/10">
                  <span className="material-symbols-outlined text-ecu-blue mt-1">local_shipping</span>
                  <div>
                    <p className="font-label-bold text-label-bold uppercase">Envío Nacional</p>
                    <p className="font-body-md text-body-md text-secondary">
                      Envíos rápidos a todo el país.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="order-1 md:order-2 relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-ecu-yellow/20 rounded-full blur-3xl -z-10" />
              <Carousel />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-ecu-red/10 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section
          className="bg-surface-container/50 border-y border-primary/5 py-unit-xl px-margin-mobile md:px-margin-desktop"
          id="how-it-works"
        >
          <div className="max-w-container-max mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-unit-lg">
              {HOW_IT_WORKS.map(({ num, color, title, body }) => (
                <div key={num} className="text-center md:text-left">
                  <span className={`font-headline-lg text-headline-lg ${color} block mb-unit-xs`}>
                    {num}
                  </span>
                  <h4 className="font-label-bold text-label-bold uppercase mb-unit-xs">{title}</h4>
                  <p className="font-body-md text-body-md text-secondary">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Size guide ── */}
        <section
          className="py-unit-xxl px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto border-t border-primary/5"
          id="size-guide"
        >
          <div className="text-center mb-unit-xl">
            <h2 className="font-headline-lg text-headline-lg uppercase mb-unit-sm">
              Guía de Tallas Unisex
            </h2>
            <p className="font-body-md text-body-md text-secondary">
              Medidas de la prenda terminada para un ajuste perfecto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-xl items-center">
            <div className="bg-white p-unit-md shadow-xl border border-primary/5">
              <Image
                src="https://ajzbtmnyihqynsreailk.supabase.co/storage/v1/object/public/img/camiseta%20web%202-01.jpeg"
                alt="Guía técnica de medidas"
                width={600}
                height={600}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-primary">
                    <th className="py-4 px-2 font-label-bold text-label-bold uppercase tracking-widest">Talla</th>
                    <th className="py-4 px-2 font-label-bold text-label-bold uppercase tracking-widest text-ecu-red">A Pecho</th>
                    <th className="py-4 px-2 font-label-bold text-label-bold uppercase tracking-widest text-ecu-blue">B Alto</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_TABLE.map(({ label, pecho, alto }) => (
                    <tr key={label} className="border-b border-primary/10 hover:bg-ecu-yellow/5 transition-colors">
                      <td className="py-4 px-2 font-body-md font-bold">{label}</td>
                      <td className="py-4 px-2 font-body-md">{pecho}</td>
                      <td className="py-4 px-2 font-body-md">{alto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Order ── */}
        <section
          className="py-unit-xxl px-margin-mobile md:px-margin-desktop max-w-2xl mx-auto"
          id="order"
        >
          <div className="text-center mb-unit-xl">
            <div className="inline-block h-1 w-12 bg-ecu-blue mb-4" />
            <h2 className="font-headline-lg text-headline-lg uppercase mb-unit-sm">Hacer pedido</h2>
            <p className="font-body-md text-body-md text-secondary italic">
              "Más que un uniforme, una expresión de identidad."
            </p>
          </div>

          {settings.store_active ? (
            <OrderForm tshirtPrice={settings.tshirt_price} stock={settings.stock} />
          ) : (
            <div className="flex items-start gap-unit-md bg-ecu-yellow/10 border border-ecu-yellow px-unit-md py-unit-md">
              <span className="material-symbols-outlined text-ecu-yellow text-2xl flex-shrink-0 mt-0.5">schedule</span>
              <p className="font-body-md text-body-md text-on-surface font-semibold">
                {settings.store_notice || "Los pedidos están temporalmente pausados. Vuelve pronto."}
              </p>
            </div>
          )}
        </section>

        {/* ── WhatsApp CTA ── */}
        <section className="border-t border-primary/10 py-unit-xl px-margin-mobile text-center bg-white">
          <h3 className="font-headline-lg text-headline-lg uppercase mb-unit-lg">¿Alguna duda?</h3>
          <a
            href="https://wa.me/593963281878"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-unit-sm font-label-bold text-label-bold uppercase border-b-2 border-ecu-red pb-2 hover:text-ecu-red transition-all"
          >
            Escribir por WhatsApp
            <span className="material-symbols-outlined">send</span>
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
