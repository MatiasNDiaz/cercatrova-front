/**
 * Declaraciones para los imports de CSS de Swiper.
 *
 * Swiper 12 expone sus estilos como `swiper/css`, `swiper/css/effect-fade`, etc.
 * Son archivos .css reales (están en el `exports` de su package.json) y Turbopack
 * los resuelve sin problema, pero TypeScript con `moduleResolution: "bundler"`
 * exige una declaración para los imports de efecto secundario (error TS2882).
 *
 * El wildcard cubre todos los submódulos de estilos de una sola vez.
 */
declare module 'swiper/css';
declare module 'swiper/css/*';
