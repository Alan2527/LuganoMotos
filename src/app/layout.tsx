import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lugano Motos — Repuestos y accesorios para moto",
    template: "%s | Lugano Motos",
  },
  description:
    "Repuestos, accesorios y cascos para moto. Envíos a todo el país y retiro en Av. Riestra 6251, CABA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
