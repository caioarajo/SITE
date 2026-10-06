const HEIC_BRANDS = new Set(["heic", "heix", "heim", "heis", "hevc", "hevx", "hevm", "hevs", "mif1", "msf1"]);

/**
 * Detecta HEIC/HEIF pelos primeiros bytes do arquivo (box "ftyp" do
 * ISO-BMFF), não pela extensão nem pelo content-type — um HEIC renomeado
 * para ".jpg" (comum em fotos de iPhone compartilhadas sem "Mais
 * Compatível") ainda reporta type "image/jpeg" no navegador, então
 * confiar na extensão não pega esse caso.
 */
export function isHeicSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const boxType = String.fromCharCode(...bytes.slice(4, 8));
  if (boxType !== "ftyp") return false;
  const brand = String.fromCharCode(...bytes.slice(8, 12));
  return HEIC_BRANDS.has(brand);
}
