/**
 * Medios de pago. Se dibujan como SVG en vez de usar imágenes externas: pesan
 * nada, se ven nítidos en cualquier pantalla y no dependen de un CDN ajeno.
 */
export function Payments({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <PaymentTile label="Visa">
        <svg viewBox="0 0 48 16" className="h-4" role="img" aria-label="Visa">
          <text
            x="24"
            y="13"
            textAnchor="middle"
            fill="#1434CB"
            fontFamily="Arial Black, Arial, sans-serif"
            fontSize="14"
            fontStyle="italic"
            fontWeight="900"
            letterSpacing="0.5"
          >
            VISA
          </text>
        </svg>
      </PaymentTile>

      <PaymentTile label="Mastercard">
        <svg viewBox="0 0 48 30" className="h-5" role="img" aria-label="Mastercard">
          <circle cx="19" cy="15" r="11" fill="#EB001B" />
          <circle cx="29" cy="15" r="11" fill="#F79E1B" />
          <path
            d="M24 6.6a11 11 0 0 0 0 16.8 11 11 0 0 0 0-16.8Z"
            fill="#FF5F00"
          />
        </svg>
      </PaymentTile>

      <PaymentTile label="Mercado Pago">
        <svg viewBox="0 0 108 16" className="h-4" role="img" aria-label="Mercado Pago">
          <text
            x="0"
            y="13"
            fill="#00A5DF"
            fontFamily="Arial, sans-serif"
            fontSize="14"
            fontWeight="700"
          >
            Mercado
          </text>
          <text
            x="62"
            y="13"
            fill="#2D3277"
            fontFamily="Arial, sans-serif"
            fontSize="14"
            fontWeight="700"
          >
            Pago
          </text>
        </svg>
      </PaymentTile>

      <span className="slant border border-race-500/60 bg-race-500/10 px-3 py-2">
        <span className="race-label text-race-400">Hasta 6 cuotas</span>
      </span>
    </div>
  );
}

function PaymentTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span
      title={label}
      className="flex h-9 items-center justify-center rounded-sm bg-white px-3 shadow-sm"
    >
      {children}
    </span>
  );
}
