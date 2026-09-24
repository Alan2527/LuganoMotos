import Link from "next/link";

const NAV = [
  { href: "/categoria/motores", label: "Motor" },
  { href: "/categoria/sistema-de-frenos", label: "Frenos" },
  { href: "/categoria/transmision", label: "Transmisión" },
  { href: "/categoria/cascos", label: "Cascos" },
  { href: "/categoria/accesorios", label: "Accesorios" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-carbon-800 bg-carbon-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4">
        <Link href="/" className="headline text-xl text-white">
          Lugano<span className="text-ignition-500">Motos</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ash-400 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <form action="/buscar" className="ml-auto flex-1 md:max-w-sm">
          <input
            name="q"
            placeholder="Buscar repuesto, marca o modelo"
            className="w-full rounded-full border border-carbon-700 bg-carbon-900 px-4 py-2 text-sm text-white outline-none placeholder:text-ash-400/60 focus:border-ignition-500"
          />
        </form>

        <a
          href="https://wa.me/5491100000000"
          className="hidden rounded-full bg-ignition-500 px-4 py-2 text-sm font-semibold text-carbon-950 transition hover:bg-ignition-400 sm:block"
        >
          WhatsApp
        </a>
      </div>
    </header>
  );
}
