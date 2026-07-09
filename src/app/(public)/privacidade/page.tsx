import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  ListChecks,
  Target,
  Cookie,
  Share2,
  UserCheck,
  Lock,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a FullBoost Race Parts coleta, usa, protege e compartilha seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).",
};

const LAST_UPDATE = "9 de julho de 2026";
const DPO_EMAIL = "privacidade@fullboostraceparts.com.br";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

const SECTIONS = [
  { id: "introducao", icon: ShieldCheck, label: "Introdução" },
  { id: "dados-coletados", icon: ListChecks, label: "Dados que coletamos" },
  { id: "finalidade", icon: Target, label: "Finalidade do tratamento" },
  { id: "cookies", icon: Cookie, label: "Cookies e rastreamento" },
  { id: "compartilhamento", icon: Share2, label: "Compartilhamento" },
  { id: "direitos", icon: UserCheck, label: "Direitos do titular" },
  { id: "seguranca", icon: Lock, label: "Segurança da informação" },
  { id: "contato", icon: Mail, label: "Encarregado (DPO)" },
] as const;

/** Cabeçalho de seção com número mono, ícone e título display. */
function SectionHeading({
  id,
  icon: Icon,
  index,
  children,
}: {
  id: string;
  icon: React.ElementType;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mt-14 flex scroll-mt-24 items-center gap-3 text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="font-mono text-sm text-muted-foreground">
        {String(index).padStart(2, "0")}
      </span>
      {children}
    </h2>
  );
}

export default function PrivacidadePage() {
  return (
    <>
      {/* ===================== CABEÇALHO ===================== */}
      <section className="relative overflow-hidden border-b border-border bg-carbon">
        <span
          aria-hidden
          className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-[320px]"
        />
        <Container className="relative py-16 lg:py-20">
          <div className="max-w-3xl">
            <Eyebrow>Privacidade · LGPD</Eyebrow>
            <h1 className="mt-5 text-balance text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl">
              Política de <span className="text-boost">Privacidade</span>
            </h1>
            <p className="mt-5 text-pretty text-lg text-muted-foreground">
              Na FullBoost Race Parts levamos a proteção dos seus dados tão a
              sério quanto a procedência das nossas peças. Este documento explica
              o que coletamos, por que coletamos e como você mantém o controle,
              em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
              13.709/2018).
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Última atualização: {LAST_UPDATE}
            </p>
          </div>
        </Container>
      </section>

      {/* ===================== CONTEÚDO ===================== */}
      <section className="py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
            {/* Índice lateral */}
            <nav
              aria-label="Nesta página"
              className="hidden lg:block"
            >
              <div className="sticky top-24">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Nesta página
                </p>
                <ul className="mt-4 space-y-1 border-l border-border">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Texto da política */}
            <article className="max-w-3xl">
              {/* 01 — Introdução */}
              <SectionHeading id="introducao" icon={ShieldCheck} index={1}>
                Introdução
              </SectionHeading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Esta Política de Privacidade descreve como a{" "}
                  <strong className="font-semibold text-foreground">
                    {SITE.name}
                  </strong>{" "}
                  trata os dados pessoais de clientes, visitantes e demais
                  usuários da loja online e dos canais de atendimento. Ao navegar
                  no site, criar uma conta ou finalizar uma compra, você declara
                  estar ciente das práticas aqui descritas.
                </p>
                <p>
                  Atuamos como{" "}
                  <strong className="font-semibold text-foreground">
                    controladora
                  </strong>{" "}
                  dos seus dados, ou seja, somos responsáveis pelas decisões
                  sobre o tratamento das informações coletadas. Tratamos apenas
                  os dados necessários para vender peças de performance, entregar
                  seu pedido e oferecer suporte técnico — sempre com base legal
                  adequada e pelo tempo estritamente necessário.
                </p>
              </div>

              {/* 02 — Dados coletados */}
              <SectionHeading id="dados-coletados" icon={ListChecks} index={2}>
                Dados que coletamos
              </SectionHeading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Coletamos diferentes categorias de dados conforme a sua
                  interação com a loja:
                </p>
                <ul className="space-y-3">
                  {[
                    {
                      t: "Dados cadastrais",
                      d: "Nome completo, CPF ou CNPJ, e-mail, telefone e data de nascimento — informados na criação da conta e no checkout.",
                    },
                    {
                      t: "Dados de entrega e cobrança",
                      d: "CEP, endereço completo e dados fiscais necessários para emitir a nota e despachar o pedido para todo o Brasil.",
                    },
                    {
                      t: "Dados de pagamento",
                      d: "Processados por gateways certificados (PCI-DSS). Não armazenamos o número completo do cartão em nossos servidores.",
                    },
                    {
                      t: "Dados do veículo e do pedido",
                      d: "Modelo, ano e setup do carro que você informa para checarmos compatibilidade das peças, além do histórico de compras.",
                    },
                    {
                      t: "Dados de navegação",
                      d: "Endereço IP, tipo de dispositivo, páginas visitadas, produtos vistos e identificadores de cookies (ver seção 4).",
                    },
                  ].map((item) => (
                    <li key={item.t} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      />
                      <span>
                        <strong className="font-semibold text-foreground">
                          {item.t}:
                        </strong>{" "}
                        {item.d}
                      </span>
                    </li>
                  ))}
                </ul>
                <p>
                  Não coletamos intencionalmente dados de crianças e
                  adolescentes, nem dados pessoais sensíveis (como origem racial,
                  convicção religiosa ou dados de saúde), pois não são necessários
                  para a venda de peças automotivas.
                </p>
              </div>

              {/* 03 — Finalidade */}
              <SectionHeading id="finalidade" icon={Target} index={3}>
                Finalidade do tratamento
              </SectionHeading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Usamos os seus dados para finalidades específicas e legítimas,
                  sempre amparadas por uma base legal da LGPD:
                </p>
                <ul className="space-y-3">
                  {[
                    {
                      t: "Executar a compra",
                      d: "Processar pedidos, emitir nota fiscal, cobrar, entregar e gerenciar trocas, devoluções e garantia (execução de contrato).",
                    },
                    {
                      t: "Atendimento e suporte técnico",
                      d: "Responder dúvidas de compatibilidade, potência e instalação pelos nossos canais, inclusive WhatsApp (execução de contrato / legítimo interesse).",
                    },
                    {
                      t: "Segurança e prevenção à fraude",
                      d: "Validar transações e proteger a loja e os clientes contra uso indevido (legítimo interesse / obrigação legal).",
                    },
                    {
                      t: "Comunicação e ofertas",
                      d: "Enviar novidades, lançamentos e promoções de performance quando você consente em recebê-los (consentimento).",
                    },
                    {
                      t: "Obrigações legais e fiscais",
                      d: "Guardar documentos fiscais e contábeis pelos prazos exigidos pela legislação brasileira (obrigação legal).",
                    },
                  ].map((item) => (
                    <li key={item.t} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      />
                      <span>
                        <strong className="font-semibold text-foreground">
                          {item.t}:
                        </strong>{" "}
                        {item.d}
                      </span>
                    </li>
                  ))}
                </ul>
                <p>
                  Mantemos os dados apenas pelo tempo necessário a cada
                  finalidade. Concluída a relação de compra, os dados fiscais são
                  retidos pelos prazos legais e, findos esses prazos, são
                  anonimizados ou eliminados de forma segura.
                </p>
              </div>

              {/* 04 — Cookies */}
              <SectionHeading id="cookies" icon={Cookie} index={4}>
                Cookies e rastreamento
              </SectionHeading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Cookies são pequenos arquivos gravados no seu navegador que nos
                  ajudam a fazer a loja funcionar e a melhorar sua experiência de
                  compra. Utilizamos três tipos:
                </p>
                <ul className="space-y-3">
                  {[
                    {
                      t: "Essenciais",
                      d: "Mantêm sua sessão ativa, o carrinho preenchido e o checkout seguro. Sem eles a loja não funciona; por isso não podem ser desativados.",
                    },
                    {
                      t: "De desempenho e análise",
                      d: "Medem, de forma agregada, quais páginas e produtos são mais acessados para aprimorarmos o catálogo e a navegação.",
                    },
                    {
                      t: "De marketing",
                      d: "Permitem exibir ofertas de peças relevantes ao seu setup dentro e fora do site. Só são ativados com o seu consentimento.",
                    },
                  ].map((item) => (
                    <li key={item.t} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      />
                      <span>
                        <strong className="font-semibold text-foreground">
                          {item.t}:
                        </strong>{" "}
                        {item.d}
                      </span>
                    </li>
                  ))}
                </ul>
                <p>
                  Você pode gerenciar ou bloquear cookies a qualquer momento nas
                  configurações do seu navegador. Ao desativar cookies não
                  essenciais, algumas funções — como recomendações personalizadas
                  — podem deixar de operar corretamente.
                </p>
              </div>

              {/* 05 — Compartilhamento */}
              <SectionHeading id="compartilhamento" icon={Share2} index={5}>
                Compartilhamento de dados
              </SectionHeading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Nós{" "}
                  <strong className="font-semibold text-foreground">
                    não vendemos
                  </strong>{" "}
                  seus dados pessoais. Compartilhamos informações apenas com
                  parceiros indispensáveis para operar a loja, e somente na medida
                  necessária:
                </p>
                <ul className="space-y-3">
                  {[
                    {
                      t: "Meios de pagamento",
                      d: "Gateways e adquirentes que processam cartões, Pix e boletos com segurança.",
                    },
                    {
                      t: "Transportadoras e Correios",
                      d: "Para calcular o frete, despachar e permitir o rastreamento da sua encomenda.",
                    },
                    {
                      t: "Prestadores de tecnologia",
                      d: "Hospedagem, armazenamento em nuvem e ferramentas de análise que atuam sob contrato e sob nossas instruções.",
                    },
                    {
                      t: "Autoridades públicas",
                      d: "Quando houver obrigação legal, ordem judicial ou requisição de órgão competente.",
                    },
                  ].map((item) => (
                    <li key={item.t} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      />
                      <span>
                        <strong className="font-semibold text-foreground">
                          {item.t}:
                        </strong>{" "}
                        {item.d}
                      </span>
                    </li>
                  ))}
                </ul>
                <p>
                  Todos os parceiros são obrigados, por contrato, a proteger os
                  dados e a utilizá-los exclusivamente para as finalidades
                  contratadas. Eventuais transferências internacionais ocorrem
                  apenas com garantias adequadas previstas na LGPD.
                </p>
              </div>

              {/* 06 — Direitos do titular */}
              <SectionHeading id="direitos" icon={UserCheck} index={6}>
                Direitos do titular
              </SectionHeading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  A LGPD garante a você, titular dos dados, uma série de direitos.
                  Basta solicitar pelos canais indicados na seção 8 que
                  responderemos dentro dos prazos legais:
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Confirmar a existência de tratamento dos seus dados",
                    "Acessar os dados que mantemos sobre você",
                    "Corrigir dados incompletos, inexatos ou desatualizados",
                    "Solicitar anonimização, bloqueio ou eliminação de dados desnecessários",
                    "Requerer a portabilidade a outro fornecedor",
                    "Revogar o consentimento a qualquer momento",
                    "Ser informado com quem compartilhamos seus dados",
                    "Opor-se a tratamentos feitos com base no legítimo interesse",
                  ].map((right) => (
                    <li
                      key={right}
                      className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm text-foreground/90"
                    >
                      <UserCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{right}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  O exercício desses direitos é gratuito. Caso não fiquemos de
                  acordo, você também pode peticionar à Autoridade Nacional de
                  Proteção de Dados (ANPD).
                </p>
              </div>

              {/* 07 — Segurança */}
              <SectionHeading id="seguranca" icon={Lock} index={7}>
                Segurança da informação
              </SectionHeading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Adotamos medidas técnicas e organizacionais para proteger seus
                  dados contra acessos não autorizados, perda, alteração ou
                  divulgação indevida. Entre elas:
                </p>
                <ul className="space-y-3">
                  {[
                    "Criptografia de ponta a ponta (TLS/HTTPS) em todo o site e no checkout;",
                    "Controle de acesso restrito e baseado em função para a equipe interna;",
                    "Ambientes de hospedagem monitorados, com backups e trilhas de auditoria;",
                    "Processamento de pagamentos em provedores certificados PCI-DSS.",
                  ].map((measure) => (
                    <li key={measure} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      />
                      <span>{measure}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  Nenhum sistema é totalmente imune a riscos. Caso ocorra um
                  incidente de segurança que possa acarretar risco relevante aos
                  seus direitos, comunicaremos você e a ANPD conforme exigido pela
                  legislação.
                </p>
              </div>

              {/* 08 — Contato / DPO */}
              <SectionHeading id="contato" icon={Mail} index={8}>
                Encarregado (DPO) e contato
              </SectionHeading>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Dúvidas sobre esta política ou pedidos relacionados aos seus
                  dados? Fale com o nosso Encarregado pelo Tratamento de Dados
                  Pessoais (DPO). Responderemos no menor prazo possível.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Encarregado de Dados · {SITE.name}
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 shrink-0 text-primary" />
                    <dt className="sr-only">E-mail</dt>
                    <dd>
                      <a
                        href={`mailto:${DPO_EMAIL}`}
                        className="font-mono text-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        {DPO_EMAIL}
                      </a>
                    </dd>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 shrink-0 text-primary" />
                    <dt className="sr-only">Telefone</dt>
                    <dd className="font-mono text-foreground">{SITE.phone}</dd>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <dt className="sr-only">Endereço</dt>
                    <dd className="text-foreground">{SITE.address}</dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="sm" className="gap-2">
                    <a href={`mailto:${DPO_EMAIL}`}>
                      <Mail className="size-4" />
                      Falar com o Encarregado
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/contato">Ir para a página de contato</Link>
                  </Button>
                </div>
              </div>

              <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
                Podemos atualizar esta Política de Privacidade para refletir
                mudanças legais ou operacionais. Sempre que isso ocorrer, a data
                de última atualização no topo desta página será revisada. Ao
                continuar usando a loja após alterações, você concorda com a
                versão vigente.
              </p>
            </article>
          </div>
        </Container>
      </section>
    </>
  );
}
