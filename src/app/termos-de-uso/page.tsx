import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Termos de Uso | Cyber Informática",
  description:
    "Termos de Uso do site da Cyber Informática — regras para navegação, orçamentos, compras e uso dos serviços contratados.",
  alternates: { canonical: `${brand.url}/termos-de-uso` },
  robots: { index: true, follow: true },
};

export default function TermosDeUsoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)] pt-32 pb-20">
        <article className="container-narrow max-w-3xl">
          <span className="kicker">Documento Legal</span>
          <h1 className="display mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-3">
            Termos de Uso
          </h1>
          <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-10">
            Última atualização: julho de 2026
          </p>

          <div className="prose prose-invert max-w-none space-y-6 text-[var(--color-text-on-dark-muted)] leading-relaxed">
            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">1. Aceitação</h2>
              <p>
                Ao acessar e usar o site da <strong className="text-[var(--color-text-on-dark)]">Cyber Informática</strong>{" "}
                (cyberinformatica.tech e subdomínios), você concorda com estes Termos de Uso e com a nossa{" "}
                <a href="/politica-privacidade" className="text-[var(--color-cyber-blue)] hover:underline">Política de Privacidade</a>.
                Se não concordar, por favor não utilize o site.
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">2. Sobre a Cyber Informática</h2>
              <p>
                A Cyber Informática é uma loja técnica de PC, notebook e celular com sede em Bragança Paulista / SP.
                Oferecemos venda de equipamentos novos, montagem de PC sob medida, manutenção preventiva e corretiva,
                troca de componentes, acessórios e — em nossa unidade industrial — laminação OCA de displays para
                assistências técnicas e lojistas parceiros (telas.cyberinformatica.tech).
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">3. Uso do site</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Este site é informativo e comercial. Você pode navegar, solicitar orçamentos e entrar em contato conosco.</li>
                <li>É proibido usar o site para fins ilegais, enviar conteúdo malicioso, ou tentar acessar áreas restritas sem autorização.</li>
                <li>Nos reservamos o direito de suspender o acesso de usuários que violem estes termos.</li>
              </ul>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">4. Orçamentos e preços</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Orçamentos solicitados pelo site ou WhatsApp têm validade de 7 (sete) dias, salvo acordo em contrário.</li>
                <li>Preços podem ser alterados sem aviso prévio, mas o orçamento já confirmado tem o preço garantido pelo prazo de validade.</li>
                <li>Imagens de produtos são ilustrativas. Características finais devem ser confirmadas no momento da compra.</li>
                <li>Para laminação OCA industrial, valores definitivos são informados após análise técnica do display.</li>
              </ul>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">5. Garantia</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Produtos novos têm garantia do fabricante (prazo e condições especificados na nota fiscal).</li>
                <li>Serviços de manutenção têm garantia própria, informada no orçamento e na ordem de serviço (tipicamente 90 dias).</li>
                <li>Serviços de laminação OCA têm garantia de 90 dias contra delaminação ou falha de touch relacionada ao processo.</li>
                <li>Garantia não cobre mau uso, quedas, contato com líquidos ou alterações feitas por terceiros após o serviço.</li>
              </ul>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">6. Prazos de serviço</h2>
              <p>
                Prazos informados no orçamento e na ordem de serviço são estimativas baseadas na complexidade técnica e
                na disponibilidade de peças. Atrasos por fatores externos (falta de peça importada, demora de
                fornecedor, etc.) serão comunicados proativamente. Não nos responsabilizamos por perdas ou danos
                indiretos decorrentes de atrasos.
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">7. Pagamento</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Aceitamos dinheiro, PIX, cartão de débito, cartão de crédito (parcelamento conforme combinado) e transferência bancária.</li>
                <li>Para pessoa jurídica (parceiros B2B), oferecemos condições de faturamento a 14, 30 ou 60 dias conforme volume.</li>
                <li>Produtos e serviços só são entregues/considerados concluídos após confirmação do pagamento.</li>
              </ul>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">8. Propriedade intelectual</h2>
              <p>
                Todo o conteúdo deste site (textos, imagens, logos, layout, código) é de propriedade da Cyber Informática
                ou licenciado a ela. É proibida a reprodução total ou parcial sem autorização prévia por escrito.
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">9. Limitação de responsabilidade</h2>
              <p>
                Nos esforçamos para manter as informações do site atualizadas e precisas, mas não garantimos ausência
                total de erros. Nos reservamos o direito de corrigir preços, descrições e disponibilidade a qualquer
                momento, mediante comunicação ao cliente afetado.
              </p>
            </section>

            <section>
              <h2 className="display text-xl font-bold text-[var(--color-text-on-dark)] mb-3">10. Foro</h2>
              <p>
                Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de Bragança Paulista / SP
                para dirimir qualquer controvérsia, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
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