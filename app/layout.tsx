import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Ecuador 2026 | Tributo Nacional",
  description:
    "Camiseta oficial de tributo Ecuador 2026. Edición limitada para coleccionistas. Envío nacional incluido.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${montserrat.variable} scroll-smooth`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link
          rel="stylesheet"
          href="https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css"
        />
      </head>
      <body className="bg-surface text-on-surface font-body-md selection:bg-ecu-blue selection:text-white">
        {children}
      </body>
    </html>
  );
}
