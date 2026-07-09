import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MessageCircle, FileText } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { SITE, whatsappLink } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Termos de Uso | FullBoost Race Parts",
  description:
    "Termos e condições de uso da loja FullBoost Race Parts: cadastro, pedidos, pagamentos, entrega, trocas, devoluções e garantia das peças de performance.",
};

const UPDATED_AT = "9 de julho de 2026";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/** Índice de seções (âncoras) do documento. */
const SECTIONS = [
  { id: "aceitacao", label: "1. Aceitação dos termos" },
  { id: "cadastro", label: "2. Cadastro e conta" },
  { id: "pedidos", label: "3. Pedidos e pagamentos" },
  { id: "entrega", label: "4. Entrega" },
  { id: "trocas", label: "5. Trocas e devoluções" },
  { id: "garantia", label: "6. Garantia das peças" },
  { id: "propriedade", label: "7. Propriedade intelectual" },
  { id: "responsabilidade", label: "8. Limitação de responsabilidade" },
  { id: "foro", label: "9. Foro e legislação aplicável" },
] as const;

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 font-display text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl"
    >
      {children}
    </h2>
  );
}

export default function TermosPage() {
  return (
    <>
      {/* ===================== CABEÇALHO ===================== */}
      <section className="relative overflow-hidden border-b border-border bg-carbon">
        <span aria-hidden className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-64" />
        <Container className="relative py-14 sm:py-16">
          <div className="max-w-3xl">
            <Eyebrow>Jurídico · Documento oficial</Eyebrow>
            <h1 className="mt-5 text-balance text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl lg:text-5xl">
              Termos de <span className="text-boost">Uso</span>
            </h1>
            <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
              Estas condições regem a navegação e as compras na loja {SITE.name}. Ao acessar o
              site e finalizar um pedido, você concorda com todas as regras descritas abaixo.
              Leia com atenção antes de comprar.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <FileText className="size-3.5 text-primary" />
                Versão 1.0
              </span>
              <span>Última atualização: {UPDATED_AT}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== CONTEÚDO ===================== */}
      <section className="py-14 sm:py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            {/* Índice */}
            <nav
              aria-label="Índice dos termos"
              className="rounded-xl border border-border bg-card p-6"
            >
              <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Nesta página
              </p>
              <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="inline-flex items-center gap-2 text-sm text-foreground/90 transition-colors hover:text-primary"
                    >
                      <span aria-hidden className="h-px w-3 bg-primary/60" />
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Corpo do documento */}
            <div className="mt-12 space-y-12 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {/* 1 */}
              <article className="space-y-4">
                <SectionTitle id="aceitacao">1. Aceitação dos termos</SectionTitle>
                <p>
                  Ao acessar, navegar ou realizar compras em {SITE.name}, você declara ter lido,
                  compreendido e aceitado integralmente estes Termos de Uso, bem como a nossa
                  Política de Privacidade. Caso não concorde com qualquer condição aqui prevista,
                  recomendamos que não utilize a loja.
                </p>
                <p>
                  Estes termos podem ser atualizados a qualquer momento para refletir mudanças
                  legais, comerciais ou operacionais. A versão vigente é sempre a publicada nesta
                  página, com a respectiva data de atualização. O uso continuado do site após
                  alterações representa concordância com a nova versão.
                </p>
                <p>
                  A loja é destinada a maiores de 18 anos. Menores de idade só podem realizar
                  compras com autorização e supervisão de um responsável legal.
                </p>
              </article>

              {/* 2 */}
              <article className="space-y-4">
                <SectionTitle id="cadastro">2. Cadastro e conta</SectionTitle>
                <p>
                  Para finalizar pedidos, você deve criar uma conta informando dados verdadeiros,
                  completos e atualizados, incluindo nome, CPF ou CNPJ, e-mail e endereço de
                  entrega. Informações incorretas podem inviabilizar o processamento do pedido e a
                  emissão da nota fiscal.
                </p>
                <p>
                  A senha de acesso é pessoal e intransferível. Você é responsável por manter suas
                  credenciais em sigilo e por todas as atividades realizadas na sua conta.
                  Comunique-nos imediatamente qualquer uso não autorizado.
                </p>
                <p>
                  Reservamo-nos o direito de suspender ou encerrar contas que apresentem dados
                  fraudulentos, uso indevido da plataforma, tentativa de golpe ou violação destes
                  termos, sem prejuízo das medidas legais cabíveis.
                </p>
              </article>

              {/* 3 */}
              <article className="space-y-4">
                <SectionTitle id="pedidos">3. Pedidos e pagamentos</SectionTitle>
                <p>
                  Os preços, descrições, especificações técnicas e disponibilidade das peças são
                  exibidos na página de cada produto e podem ser alterados sem aviso prévio. Todos
                  os valores estão em reais (R$) e já contemplam impostos, salvo indicação em
                  contrário. O frete é calculado à parte, conforme o CEP de destino.
                </p>
                <p>
                  O pedido só é considerado confirmado após a aprovação do pagamento pela
                  operadora ou instituição financeira. Aceitamos cartão de crédito (à vista ou
                  parcelado), Pix e boleto bancário, conforme as opções disponíveis no checkout.
                  Pagamentos via Pix costumam ter confirmação em minutos; boletos podem levar até
                  dois dias úteis para compensar.
                </p>
                <p>
                  Podemos recusar ou cancelar pedidos em casos de indisponibilidade de estoque,
                  erro evidente de precificação, suspeita de fraude ou falha na análise de crédito.
                  Nessas hipóteses, você será informado e qualquer valor já pago será integralmente
                  estornado.
                </p>
                <p>
                  É de responsabilidade do cliente confirmar a compatibilidade da peça com o
                  veículo antes da compra (modelo, ano, motorização e código do fabricante). Em
                  caso de dúvida sobre a aplicação, fale com nosso time técnico antes de finalizar
                  o pedido.
                </p>
              </article>

              {/* 4 */}
              <article className="space-y-4">
                <SectionTitle id="entrega">4. Entrega</SectionTitle>
                <p>
                  Realizamos entregas para todo o Brasil por meio de transportadoras e serviços
                  postais parceiros. O prazo estimado é exibido no checkout, com base no CEP de
                  destino e na modalidade de frete escolhida, e passa a contar a partir da
                  confirmação do pagamento e do despacho do produto.
                </p>
                <p>
                  Os prazos são estimativas e podem sofrer variações por fatores externos, como
                  condições climáticas, greves, restrições de circulação e questões logísticas da
                  transportadora. Peças de encomenda ou sob demanda podem ter prazo diferenciado,
                  informado antes da finalização.
                </p>
                <p>
                  No recebimento, confira a integridade da embalagem e do produto na presença do
                  entregador. Havendo avaria aparente ou divergência, recuse a entrega ou registre
                  a ocorrência e comunique-nos em até 72 horas para agilizarmos a solução.
                </p>
              </article>

              {/* 5 */}
              <article className="space-y-4">
                <SectionTitle id="trocas">5. Trocas e devoluções</SectionTitle>
                <p>
                  Nos termos do Código de Defesa do Consumidor, você pode exercer o direito de
                  arrependimento e devolver o produto em até 7 dias corridos após o recebimento,
                  sem necessidade de justificativa. A peça deve estar sem uso ou instalação, em
                  perfeito estado, com a embalagem original, acessórios e nota fiscal.
                </p>
                <p>
                  Peças que apresentem sinais de instalação, montagem ou uso — como riscos,
                  marcas de aperto, remoção de lacres ou adaptação — não são elegíveis para troca
                  por arrependimento, uma vez que componentes de performance perdem a condição de
                  revenda após aplicação no veículo.
                </p>
                <p>
                  Em caso de defeito de fabricação, a troca segue as condições descritas na seção
                  de garantia. Após a análise e aprovação da solicitação, você pode optar pela
                  troca por item igual, crédito na loja ou reembolso, conforme disponibilidade.
                </p>
                <p>
                  Para iniciar uma troca ou devolução, entre em contato com o nosso atendimento
                  informando o número do pedido. Nas devoluções por arrependimento ou defeito, o
                  custo de envio de retorno é por nossa conta.
                </p>
              </article>

              {/* 6 */}
              <article className="space-y-4">
                <SectionTitle id="garantia">6. Garantia das peças</SectionTitle>
                <p>
                  Todas as peças comercializadas possuem garantia legal de 90 dias contra defeitos
                  de fabricação, contados a partir da data de recebimento. Quando aplicável, a
                  garantia contratual do fabricante é somada ao prazo legal e informada na página
                  do produto.
                </p>
                <p>
                  A garantia cobre exclusivamente defeitos de fabricação e não abrange desgaste
                  natural, uso em competição fora das especificações, instalação inadequada,
                  ausência de manutenção, superaquecimento, uso de combustível ou fluidos
                  incorretos, nem modificações que alterem a característica original da peça.
                </p>
                <p>
                  Recomendamos que a instalação de componentes de performance — como turbinas,
                  intercoolers, coilovers, injetores e sistemas de escape — seja realizada por
                  profissional qualificado. Instalações feitas fora de oficina especializada podem
                  implicar perda da garantia.
                </p>
                <p>
                  Para acionar a garantia, guarde a nota fiscal e entre em contato com o
                  atendimento. A peça poderá passar por análise técnica do fabricante para
                  confirmação do defeito antes da substituição ou reparo.
                </p>
              </article>

              {/* 7 */}
              <article className="space-y-4">
                <SectionTitle id="propriedade">7. Propriedade intelectual</SectionTitle>
                <p>
                  Todo o conteúdo do site {SITE.name} — incluindo marca, logotipo, layout, textos,
                  fotos, ilustrações, descrições técnicas e código-fonte — é protegido por direitos
                  autorais e de propriedade industrial, sendo de titularidade da loja ou de seus
                  parceiros licenciantes.
                </p>
                <p>
                  É proibida a reprodução, distribuição, cópia ou uso comercial de qualquer
                  material sem autorização prévia e por escrito. Marcas de fabricantes exibidas no
                  catálogo pertencem aos seus respectivos titulares e são apresentadas apenas para
                  fins de identificação e compatibilidade dos produtos.
                </p>
              </article>

              {/* 8 */}
              <article className="space-y-4">
                <SectionTitle id="responsabilidade">
                  8. Limitação de responsabilidade
                </SectionTitle>
                <p>
                  Empenhamo-nos para manter as informações do site precisas e atualizadas, mas não
                  garantimos que estejam livres de erros de digitação, imagens meramente
                  ilustrativas ou eventuais indisponibilidades técnicas. Em caso de divergência
                  evidente de preço ou especificação, prevalece a informação correta, com a
                  possibilidade de cancelamento do pedido e estorno.
                </p>
                <p>
                  A loja não se responsabiliza por danos decorrentes de instalação incorreta, uso
                  inadequado, aplicação da peça em veículo incompatível ou utilização em desacordo
                  com as recomendações do fabricante. Produtos de performance destinados a uso em
                  pista ou competição devem respeitar a legislação de trânsito aplicável ao uso em
                  via pública.
                </p>
                <p>
                  Na máxima extensão permitida pela legislação, nossa responsabilidade limita-se ao
                  valor do produto adquirido, não abrangendo lucros cessantes, danos indiretos ou
                  prejuízos causados por terceiros, como transportadoras e serviços de instalação.
                </p>
              </article>

              {/* 9 */}
              <article className="space-y-4">
                <SectionTitle id="foro">9. Foro e legislação aplicável</SectionTitle>
                <p>
                  Estes Termos de Uso são regidos pela legislação brasileira, em especial pelo
                  Código de Defesa do Consumidor (Lei nº 8.078/1990) e pelo Marco Civil da Internet
                  (Lei nº 12.965/2014).
                </p>
                <p>
                  Fica eleito o foro da comarca da sede da loja para dirimir eventuais controvérsias
                  decorrentes destes termos, com renúncia a qualquer outro, por mais privilegiado
                  que seja, ressalvado o direito do consumidor de acionar o foro de seu domicílio.
                </p>
                <p>
                  Dúvidas sobre estes termos podem ser encaminhadas para{" "}
                  <a
                    href={`mailto:${SITE.email}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {SITE.email}
                  </a>
                  .
                </p>
              </article>
            </div>

            {/* ===================== AJUDA / CTA ===================== */}
            <div className="mt-14 rounded-2xl border border-border bg-card/60 p-8 text-center">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight sm:text-xl">
                Ficou com alguma dúvida?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Nosso time técnico ajuda você a escolher a peça certa e esclarece qualquer ponto
                sobre pedidos, garantia e devoluções.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    Falar no WhatsApp
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link href="/contato">
                    Central de contato
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
