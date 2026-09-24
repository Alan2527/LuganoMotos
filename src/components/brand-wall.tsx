import Image, { type StaticImageData } from "next/image";

import castrol from "@/assets/marcas/castrol.webp";
import diafra from "@/assets/marcas/diafra.webp";
import fox from "@/assets/marcas/fox.webp";
import frasle from "@/assets/marcas/frasle.webp";
import hawk from "@/assets/marcas/hawk.webp";
import hgoHonda from "@/assets/marcas/hgo-honda.webp";
import ipone from "@/assets/marcas/ipone.webp";
import ngk from "@/assets/marcas/ngk.webp";
import piton from "@/assets/marcas/piton.webp";
import power from "@/assets/marcas/power.webp";
import protaper from "@/assets/marcas/protaper.webp";
import riffel from "@/assets/marcas/riffel.webp";
import toxicshine from "@/assets/marcas/toxicshine.webp";
import wirtz from "@/assets/marcas/wirtz.webp";
import yamalube from "@/assets/marcas/yamalube.webp";
import yuasa from "@/assets/marcas/yuasa.webp";

/**
 * Muro de sponsors con las marcas que trabaja el local.
 *
 * Los logos se importan en vez de referenciarse por ruta: así el bundler
 * resuelve la URL final, que en GitHub Pages cuelga de un subdirectorio.
 * El arte viene en negro sobre transparente, y `.decal` lo pasa a blanco para
 * que funcione sobre el fondo oscuro, como los calcos de un carenado.
 */
const BRANDS: Array<{ src: StaticImageData; name: string }> = [
  { src: ngk, name: "NGK" },
  { src: castrol, name: "Castrol" },
  { src: ipone, name: "Ipone" },
  { src: yamalube, name: "Yamalube" },
  { src: hgoHonda, name: "Honda HGO" },
  { src: yuasa, name: "Yuasa" },
  { src: hawk, name: "Hawk" },
  { src: fox, name: "Fox" },
  { src: riffel, name: "Riffel" },
  { src: frasle, name: "Frasle" },
  { src: diafra, name: "Diafra" },
  { src: protaper, name: "ProTaper" },
  { src: piton, name: "Pitón" },
  { src: power, name: "Power" },
  { src: wirtz, name: "Wirtz" },
  { src: toxicshine, name: "Toxic Shine" },
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
              key={`${brand.name}-${index}`}
              src={brand.src}
              alt={brand.name}
              aria-hidden={index >= BRANDS.length}
              className="decal h-10 w-auto shrink-0 object-contain sm:h-12"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
