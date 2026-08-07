import { redirect } from 'next/navigation';

// Não existia página nenhuma exatamente em /admin (só nas sub-rotas
// como /admin/os, /admin/dashboard...) — Next.js dava 404 de verdade
// pra quem acessasse a raiz, seja digitando direto o bookmark, seja
// pelo redirect de compatibilidade /admin/crm -> /admin já existente
// no next.config.js. /admin/os é o "início" canônico (mesmo link do
// logo "Cyber ERP" no header).
export default function AdminRootPage() {
  redirect('/admin/os');
}
