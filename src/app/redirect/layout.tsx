/**
 * Layout isolado para a página /redirect.
 * Não inclui o <Providers> global para evitar que o LeadModal
 * (e outros contextos como Cart) seja montado nessa rota.
 */
export default function RedirectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
