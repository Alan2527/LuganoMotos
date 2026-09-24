import Image from "next/image";

/**
 * Muro de sponsors. Los logos son los que el cliente ya usa en su sitio, y
 * vienen en negro sobre transparente: `.decal` los pasa a blanco para que
 * funcionen sobre el fondo oscuro, como los calcos de un carenado.
 */
const BRANDS = [
  { file: "ngk", name: "NGK" },
  { file: "castrol", name: "Castrol" },
  { file: "ipone", name: "Ipone" },
  { file: "yamalube", name: "Yamalube" },
  { file: "hgo-honda", name: "Honda HGO" },
  { file: "yuasa", name: "Yuasa" },
  { file: "hawk", name: "Hawk" },
  { file: "fox", name: "Fox" },
  { file: "riffel", name: "Riffel" },
  { file: "frasle", name: "Frasle" },
  { file: "diafra", name: "Diafra" },
  { file: "protaper", name: "ProTaper" },
  { file: "piton", name: "Pitón" },
  { file: "power", name: "Power" },
  { file: "wirtz", name: "Wirtz" },
  { file: "toxicshine", name: "Toxic Shine" },
];

export function BrandWall() {
  return (
    <section className="carbon border-y border-carbon-800 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <p className="race-label text-steel-400">Las marcas que trabajamos</p>
      </div>

      <div className="mt-6 overflow-hidden" aria-label="Marcas que trabaja Lugano Motos">
        <div className="marquee-track flex w-max items-center gap-12 px-4">
          {[...BRANDS, ...BRANDS].map((brand, index) => (
            <Image
              key={`${brand.file}-${index}`}
              src={`/marcas/${brand.file}.webp`}
              alt={brand.name}
              width={400}
              height={200}
              aria-hidden={index >= BRANDS.length}
              className="decal h-10 w-auto shrink-0 object-contain sm:h-12"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
