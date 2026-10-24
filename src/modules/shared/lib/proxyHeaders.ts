/**
 * Cabeceras con las que el front le pasa al backend la IP REAL del visitante.
 * Mismos nombres en `CercaTrova-Back/src/common/http/trusted-proxy.ts`.
 *
 * Por qué: el proxy de Railway reescribe `X-Forwarded-For` con la IP de quien
 * se le conecta, que para todo lo que pasa por `/api/*` es Vercel. Sin esto el
 * backend veía a todos los visitantes como unas pocas IPs y su rate limit
 * (100/min por IP) los contaba juntos → 429.
 *
 * `PROXY_SHARED_SECRET` es una variable SOLO de servidor (sin `NEXT_PUBLIC_`):
 * nunca llega al navegador. Si no está configurada, no se manda nada y el
 * backend se comporta como antes.
 */
export const PROXY_SECRET_HEADER = 'x-ct-proxy-secret';
export const CLIENT_IP_HEADER = 'x-ct-client-ip';
