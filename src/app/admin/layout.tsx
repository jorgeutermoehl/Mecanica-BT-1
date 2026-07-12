/**
 * Layout raiz do segmento /admin — intencionalmente mínimo.
 * O guard de sessão vive no grupo (panel); /admin/login precisa
 * permanecer acessível sem autenticação.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
