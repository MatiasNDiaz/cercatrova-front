/**
 * Generador de archivos ZIP, mínimo y sin dependencias.
 *
 * ── Por qué escrito a mano y no `jszip` ─────────────────────────────────────
 * El único uso es "descargar todas las fotos" de la ficha compartible. `jszip`
 * pesa ~100 kB minificado y trae compresión DEFLATE completa — que acá no sirve
 * de nada: las fotos ya vienen en JPEG/WebP, o sea que YA están comprimidas.
 * Volver a comprimirlas gasta CPU y no baja el peso (suele subirlo un poco).
 *
 * Por eso este generador usa el método **`store` (0)**: mete los bytes tal cual
 * dentro del contenedor ZIP. Es el caso de uso exacto y son ~60 líneas.
 *
 * ── Formato implementado ────────────────────────────────────────────────────
 * Es el ZIP clásico (APPNOTE de PKWARE), en su forma más simple:
 *   [local file header + datos] × N  →  [central directory] × N  →  [EOCD]
 *
 * ⚠️ NO implementa ZIP64. El límite es 4 GB por archivo y 65535 entradas; una
 * ficha tiene como mucho 10 fotos de unos pocos MB, así que no se acerca. Si
 * alguna vez se usa para otra cosa, hay que revisar esto.
 */

/** Tabla de CRC-32 (polinomio 0xEDB88320), calculada una sola vez. */
const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(datos: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Fecha y hora en formato MS-DOS, que es lo que guarda el ZIP.
 *
 * Son dos enteros de 16 bits con los campos empaquetados a nivel de bit: la
 * hora tiene resolución de 2 segundos y el año se cuenta desde 1980 (por eso el
 * `- 1980`). No es un timestamp Unix.
 */
function fechaDos(d: Date): { hora: number; fecha: number } {
  return {
    hora: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2)),
    fecha: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export interface ArchivoZip {
  /** Nombre dentro del ZIP, con extensión. */
  nombre: string;
  datos: Uint8Array;
}

/**
 * Arma un ZIP con los archivos dados y lo devuelve como `Blob`, listo para
 * `URL.createObjectURL()`.
 */
export function crearZip(archivos: ArchivoZip[], fecha: Date = new Date()): Blob {
  const { hora, fecha: dosFecha } = fechaDos(fecha);
  const codificador = new TextEncoder();

  const partes: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;

  for (const archivo of archivos) {
    const nombre = codificador.encode(archivo.nombre);
    const crc = crc32(archivo.datos);
    const tam = archivo.datos.length;

    // ── Local file header (30 bytes + nombre) ──
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // firma
    local.setUint16(4, 20, true);         // versión necesaria (2.0)
    local.setUint16(6, 0, true);          // flags
    local.setUint16(8, 0, true);          // método: 0 = store
    local.setUint16(10, hora, true);
    local.setUint16(12, dosFecha, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, tam, true);       // tamaño comprimido  = sin comprimir
    local.setUint32(22, tam, true);       // tamaño sin comprimir
    local.setUint16(26, nombre.length, true);
    local.setUint16(28, 0, true);         // extra
    partes.push(local.buffer, nombre, archivo.datos as unknown as BlobPart);

    // ── Central directory header (46 bytes + nombre) ──
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);    // firma
    cd.setUint16(4, 20, true);            // versión del creador
    cd.setUint16(6, 20, true);            // versión necesaria
    cd.setUint16(8, 0, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, hora, true);
    cd.setUint16(14, dosFecha, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, tam, true);
    cd.setUint32(24, tam, true);
    cd.setUint16(28, nombre.length, true);
    cd.setUint16(30, 0, true);            // extra
    cd.setUint16(32, 0, true);            // comentario
    cd.setUint16(34, 0, true);            // disco
    cd.setUint16(36, 0, true);            // atributos internos
    cd.setUint32(38, 0, true);            // atributos externos
    cd.setUint32(42, offset, true);       // dónde empieza su local header
    central.push(cd.buffer, nombre);

    offset += 30 + nombre.length + tam;
  }

  const tamCentral = central.reduce(
    (a, p) => a + (p instanceof ArrayBuffer ? p.byteLength : (p as Uint8Array).length),
    0,
  );

  // ── End of central directory (22 bytes) ──
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);                    // nº de disco
  eocd.setUint16(6, 0, true);                    // disco del directorio central
  eocd.setUint16(8, archivos.length, true);      // entradas en este disco
  eocd.setUint16(10, archivos.length, true);     // entradas totales
  eocd.setUint32(12, tamCentral, true);
  eocd.setUint32(16, offset, true);              // offset del directorio central
  eocd.setUint16(20, 0, true);                   // comentario

  return new Blob([...partes, ...central, eocd.buffer], { type: 'application/zip' });
}
