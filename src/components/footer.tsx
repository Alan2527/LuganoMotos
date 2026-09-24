import Image from "next/image";
import logo from "@/assets/brand/logo.webp";
import { Payments } from "./payments";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-carbon-800 bg-carbon-900">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Image
            src={logo}
            alt="Lugano Motos"
            className="h-9 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm text-steel-400">
            Repuestos, accesorios y cascos para moto. Más de 2.400 productos en stock.
          </p>
        </div>

        <div>
          <p className="race-label text-white">El local</p>
          <p className="mt-4 text-sm text-steel-400">
            Av. Riestra 6251
            <br />
            Villa Lugano, CABA
            <br />
            Lunes a sábado, 9 a 19 h
          </p>
        </div>

        <div>
          <p className="race-label text-white">Atención</p>
          <p className="mt-4 text-sm text-steel-400">
            Mandanos foto, modelo y año de tu moto por WhatsApp y te respondemos en menos de 10
            minutos.
          </p>
          <a
            href="https://wa.me/5491100000000"
            className="mt-3 inline-block text-sm font-semibold text-race-400 hover:underline"
          >
            Escribir por WhatsApp
          </a>
        </div>

        <div>
          <p className="race-label text-white">Medios de pago</p>
          <Payments className="mt-4" />
          <p className="mt-3 text-xs text-steel-400">Sin monto mínimo de compra.</p>
        </div>
      </div>

      <div className="border-t border-carbon-800 px-4 py-6 text-center text-xs text-steel-400/70">
        © {new Date().getFullYear()} Lugano Motos · Av. Riestra 6251, CABA
      </div>
    </footer>
  );
}
