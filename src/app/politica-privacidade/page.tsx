import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Política de Privacidade | Cyber Informática",
  description:
    "Política de Privacidade da Cyber Informática — como coletamos, usamos e protegemos os dados pessoais de clientes e parceiros, em conformidade com a LGPD.",
  alternates: { canonical: `${brand.url}/politica-privacidade` },
  robots: { index: true, follow: true },
};

export default function PoliticaPrivacidadePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)] pt-32 pb-20">
        <article className="container-narrow max-w-3xl">
          <span className="kicker">Documento Legal</span>
          <h1 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-3">
            Política de Privacidade
          </h1>
          <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-10">
            Última atualização: julho de 2026
          </p>

          <div className="prose prose-invert max-w-none space-y-6 text-[var(--color-text-on-dark-muted)] leading-relaxed">
            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">1. Quem somos</h2>
              <p>
                A <strong className="text-[var(--color-text-on-dark)]">Cyber Informática</strong> (CNPJ sob
                consulta), com loja física em Rua Coronel Teófilo Leme, 967 — Bragança Paulista / SP, é a
                controladora dos dados pessoais coletados por meio deste site e dos nossos canais de atendimento
                (WhatsApp, telefone, e-mail, formulário de contato e credenciamento).
              </p>
              <p>
                Contato do encarregado de dados (DPO): <a href={`mailto:${brand.email}`} className="text-[var(--color-cyber-blue)] hover:underline">{brand.email}</a>.
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">2. Dados que coletamos</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong className="text-[var(--color-text-on-dark)]">Dados de identificação:</strong> nome, e-mail, telefone (com DDD), CPF ou CNPJ quando o atendimento envolver orçamento, venda ou credenciamento.</li>
                <li><strong className="text-[var(--color-text-on-dark)]">Dados de equipamento:</strong> tipo, marca, modelo, cor, IMEI/número de série e defeito relatado — fornecidos voluntariamente por você ao solicitar orçamento ou abrir ordem de serviço.</li>
                <li><strong className="text-[var(--color-text-on-dark)]">Dados de navegação:</strong> endereço IP, páginas visitadas, tempo na página, dispositivo, navegador, e — quando permitido por você — cookies de analytics e marketing.</li>
                <li><strong className="text-[var(--color-text-on-dark)]">Comunicações:</strong> conteúdo das mensagens trocadas conosco via WhatsApp, e-mail ou formulário.</li>
              </ul>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">3. Para que usamos seus dados</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Responder ao seu contato, orçamento ou pedido de parceria.</li>
                <li>Executar serviços de manutenção, venda, montagem ou laminação OCA contratados.</li>
                <li>Cumprir obrigações legais e fiscais (notas fiscais, garantia, histórico de serviço).</li>
                <li>Enviar comunicações sobre o andamento do serviço, promoções e novidades — somente se você consentir.</li>
                <li>Analisar o uso do site para melhorar a experiência (analytics, somente com seu consentimento via banner de cookies).</li>
              </ul>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">4. Compartilhamento</h2>
              <p>
                Não vendemos seus dados. Compartilhamos apenas o estritamente necessário com:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provedores de hospedagem, e-mail, banco de dados e mensageria (Vercel, Supabase, Resend, WhatsApp Business).</li>
                <li>Plataformas de analytics e marketing (Google Analytics, Google Ads, Meta Ads) — somente com seu consentimento.</li>
                <li>Autoridades fiscais, judiciais ou regulatórias quando exigido por lei.</li>
              </ul>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">5. Cookies</h2>
              <p>
                Usamos cookies para lembrar suas preferências (ex: manter logado no painel administrativo), medir o
                tráfego do site (Google Analytics, somente após seu consentimento) e medir campanhas de marketing
                (Google Ads, Meta Ads, somente após consentimento). Você pode recusar ou revogar o consentimento a
                qualquer momento pelo banner de cookies exibido no site.
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">6. Seus direitos (LGPD)</h2>
              <p>Você tem o direito de:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Confirmar a existência de tratamento de dados.</li>
                <li>Solicitar acesso, correção ou exclusão dos seus dados.</li>
                <li>Revogar consentimentos previamente dados.</li>
                <li>Solicitar portabilidade ou anonimização.</li>
                <li>Apresentar reclamação à ANPD.</li>
              </ul>
              <p>
                Para exercer qualquer desses direitos, envie um e-mail para <a href={`mailto:${brand.email}`} className="text-[var(--color-cyber-blue)] hover:underline">{brand.email}</a> com seu pedido e um documento de identificação. Responderemos em até 15 dias úteis.
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">7. Segurança</h2>
              <p>
                Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia em trânsito (HTTPS/TLS),
                controle de acesso por perfil (RLS no banco), autenticação forte no painel administrativo e backups
                automatizados. Nenhuma transmissão pela internet é 100% segura, mas trabalhamos continuamente para
                minimizar riscos.
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">8. Retenção</h2>
              <p>
                Mantemos seus dados pelo tempo necessário ao cumprimento das finalidades informadas e das obrigações
                legais (ex: registros fiscais por 5 anos, histórico de garantia durante o prazo da garantia estendida).
                Após esses prazos, os dados são anonimizados ou excluídos de forma segura.
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">9. Alterações nesta política</h2>
              <p>
                Podemos atualizar esta política periodicamente. Alterações relevantes serão comunicadas por e-mail ou
                aviso visível no site. A versão atual sempre estará disponível nesta página, com a data da última
                atualização.
              </p>
            </section>

            <section className="pt-6 border-t border-[var(--color-border-on-dark)]">
              <p className="text-sm">
                Dúvidas? Fale com a gente:{" "}
                <a href={`mailto:${brand.email}`} className="text-[var(--color-cyber-blue)] hover:underline">{brand.email}</a>
                {" · "}
                WhatsApp (11) 95436-9269.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}