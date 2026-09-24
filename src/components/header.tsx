import Image from "next/image";
import logo from "@/assets/brand/logo.webp";
import Link from "next/link";

const NAV = [
  { href: "/categoria/motor", label: "Motor" },
  { href: "/categoria/sistema-de-frenos", label: "Frenos" },
  { href: "/categoria/kit-completo-transmision", label: "Transmisión" },
  { href: "/categoria/cascos", label: "Cascos" },
  { href: "/categoria/aceites-lubricantes", label: "Aceites" },
  { href: "/categoria/accesorios", label: "Accesorios" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-carbon-800 bg-carbon-950/92 backdrop-blur">
      {/* Franja de carrera: rojo, blanco y cuadros. */}
      <div className="flex h-1">
        <span className="w-1/2 bg-race-500" />
        <span className="checker w-1/4 bg-carbon-700" />
        <span className="w-1/4 bg-steel-200" />
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3">
        <Link href="/" className="shrink-0">
          <Image
            src={logo}
            alt="Lugano Motos"
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="slant race-label px-3 py-2 text-steel-400 transition hover:bg-race-500 hover:text-white"
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <form action="/buscar" className="ml-auto min-w-0 flex-1 lg:max-w-xs">
          <input
            name="q"
            aria-label="Buscar productos"
            placeholder="Buscá repuesto, marca o modelo"
            className="w-full border border-carbon-700 bg-carbon-900 px-4 py-2 text-sm text-white outline-none placeholder:text-steel-400/70 focus:border-race-500"
          />
        </form>

        <a
          href="https://wa.me/5491100000000"
          className="slant hidden bg-race-500 px-5 py-2.5 transition hover:bg-race-400 sm:block"
        >
          <span className="race-label text-white">WhatsApp</span>
        </a>
      </div>
    </header>
  );
}
