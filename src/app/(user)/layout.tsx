// Route group sin uso actual (no tiene páginas). Layout passthrough mínimo
// para que el archivo sea un módulo válido — candidato a eliminarse.
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
