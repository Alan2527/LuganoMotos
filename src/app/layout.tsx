import type { Metadata } from "next";
import { Barlow, Saira_Condensed } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const saira = Saira_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-saira",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lugano Motos — Repuestos y accesorios para moto",
    template: "%s | Lugano Motos",
  },
  description:
    "Repuestos, accesorios y cascos para moto. Más de 2.400 productos, envíos a todo el país y retiro en Av. Riestra 6251, CABA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${saira.variable} ${barlow.variable}`}>
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
