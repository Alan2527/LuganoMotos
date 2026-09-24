export function Footer() {
  return (
    <footer className="mt-24 border-t border-carbon-800 bg-carbon-900">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="headline text-lg text-white">
            Lugano<span className="text-ignition-500">Motos</span>
          </p>
          <p className="mt-3 text-sm text-ash-400">
            Repuestos y accesorios para moto. Av. Riestra 6251, CABA.
          </p>
        </div>

        <div className="text-sm text-ash-400">
          <p className="font-semibold text-white">Atención</p>
          <p className="mt-3">Lunes a sábado, 9 a 19 h</p>
          <p>Respondemos por WhatsApp en menos de 10 minutos</p>
        </div>

        <div className="text-sm text-ash-400">
          <p className="font-semibold text-white">Medios de pago</p>
          <p className="mt-3">Visa · Mastercard · Mercado Pago</p>
          <p>Sin monto mínimo de compra</p>
        </div>
      </div>

      <div className="border-t border-carbon-800 px-4 py-6 text-center text-xs text-ash-400/70">
        © {new Date().getFullYear()} Lugano Motos
      </div>
    </footer>
  );
}
