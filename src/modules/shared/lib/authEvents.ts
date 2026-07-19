// Puente entre el interceptor de axios y el AuthContext, sin dependencia circular:
// axios.ts no puede importar AuthContext (AuthContext importa auth.service → axios),
// así que el AuthProvider registra acá un callback al montar y el interceptor lo invoca.

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/** Registrado por el AuthProvider al montar. Pasar null al desmontar. */
export function setOnUnauthorized(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

/** Invocado por el interceptor de axios ante un 401 de sesión expirada. */
export function emitUnauthorized() {
  onUnauthorized?.();
}
