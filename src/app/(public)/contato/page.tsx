"use client";

import { useState } from "react";
import {
  Headset,
  Mail,
  Phone,
  Clock,
  MapPin,
  MessageCircle,
  Send,
  ArrowRight,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE, whatsappLink } from "@/lib/constants";

/* Rótulo de seção padrão (mono vermelho com traço), igual às seções da home. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

type FieldName = "nome" | "telefone" | "email" | "assunto" | "mensagem";
type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;

const EMPTY: FormValues = {
  nome: "",
  telefone: "",
  email: "",
  assunto: "",
  mensagem: "",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.nome.trim()) {
    errors.nome = "Informe seu nome.";
  }
  if (!values.telefone.trim()) {
    errors.telefone = "Informe um telefone ou WhatsApp para retorno.";
  }
  if (!values.email.trim()) {
    errors.email = "Informe seu e-mail.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Digite um e-mail válido.";
  }
  if (!values.assunto.trim()) {
    errors.assunto = "Diga o assunto (ex.: compatibilidade de turbina).";
  }
  if (!values.mensagem.trim()) {
    errors.mensagem = "Escreva sua mensagem.";
  } else if (values.mensagem.trim().length < 10) {
    errors.mensagem = "Detalhe um pouco mais (mínimo de 10 caracteres).";
  }

  return errors;
}

/* Canais diretos exibidos na coluna da direita. */
const CHANNELS: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}[] = [
  {
    icon: Mail,
    label: "E-mail",
    value: SITE.email,
    href: `mailto:${SITE.email}`,
    mono: true,
  },
  {
    icon: Phone,
    label: "Telefone",
    value: SITE.phone,
    href: `tel:${SITE.phone.replace(/\D/g, "")}`,
    mono: true,
  },
  { icon: Clock, label: "Horário de atendimento", value: SITE.hours },
  { icon: MapPin, label: "Endereço", value: SITE.address },
];

const WHATSAPP_MESSAGE =
  "Olá! Vim pela página de contato da FullBoost e gostaria de falar com um especialista sobre uma peça de performance.";

const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SITE.name} ${SITE.address}`,
)}`;

export default function ContatoPage() {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});

  function update(field: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Limpa o erro do campo assim que o usuário começa a corrigir.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Revise os campos destacados", {
        description: "Precisamos desses dados para retornar o contato.",
      });
      return;
    }

    toast.success("Mensagem enviada", {
      description: "Nossa equipe técnica responde em até um dia útil.",
    });
    setValues(EMPTY);
    setErrors({});
  }

  return (
    <>
      {/* ===================== CABEÇALHO ===================== */}
      <section className="relative overflow-hidden border-b border-border bg-carbon">
        <span
          aria-hidden
          className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-[320px]"
        />
        <Container className="relative py-16 lg:py-20">
          <Eyebrow>Atendimento · Suporte técnico</Eyebrow>
          <h1 className="mt-5 max-w-2xl text-balance text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl">
            Fale com um <span className="text-boost">especialista</span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
            Dúvidas de compatibilidade, potência, instalação ou orçamento? Envie sua
            mensagem ou chame no WhatsApp — nosso time monta o setup certo pro seu carro.
          </p>
        </Container>
      </section>

      {/* ===================== FORMULÁRIO + CANAIS ===================== */}
      <section className="py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* ---------- Coluna esquerda: formulário ---------- */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <Eyebrow>Envie uma mensagem</Eyebrow>
              <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight">
                Conte o que você procura
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Preencha os campos abaixo. Quanto mais detalhes do carro e do objetivo,
                mais precisa é a nossa indicação.
              </p>

              <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="nome"
                    label="Nome"
                    placeholder="Como podemos te chamar?"
                    autoComplete="name"
                    value={values.nome}
                    error={errors.nome}
                    onChange={(v) => update("nome", v)}
                  />
                  <Field
                    id="telefone"
                    label="Telefone / WhatsApp"
                    type="tel"
                    inputMode="tel"
                    placeholder="(47) 99999-0000"
                    autoComplete="tel"
                    value={values.telefone}
                    error={errors.telefone}
                    onChange={(v) => update("telefone", v)}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="email"
                    label="E-mail"
                    type="email"
                    inputMode="email"
                    placeholder="voce@email.com"
                    autoComplete="email"
                    value={values.email}
                    error={errors.email}
                    onChange={(v) => update("email", v)}
                  />
                  <Field
                    id="assunto"
                    label="Assunto"
                    placeholder="Ex.: turbina para Golf GTI"
                    value={values.assunto}
                    error={errors.assunto}
                    onChange={(v) => update("assunto", v)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mensagem">Mensagem</Label>
                  <Textarea
                    id="mensagem"
                    rows={5}
                    placeholder="Descreva o carro (modelo, ano, motor), a potência desejada e as peças que já tem instaladas."
                    value={values.mensagem}
                    onChange={(e) => update("mensagem", e.target.value)}
                    aria-invalid={errors.mensagem ? true : undefined}
                    aria-describedby={errors.mensagem ? "mensagem-error" : undefined}
                  />
                  {errors.mensagem && (
                    <p
                      id="mensagem-error"
                      className="font-mono text-xs text-destructive"
                      role="alert"
                    >
                      {errors.mensagem}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Ao enviar, você concorda em ser contatado pela nossa equipe.
                  </p>
                  <Button type="submit" size="lg" className="gap-2 sm:shrink-0">
                    <Send className="size-4" />
                    Enviar mensagem
                  </Button>
                </div>
              </form>
            </div>

            {/* ---------- Coluna direita: canais + mapa ---------- */}
            <div className="flex flex-col gap-6">
              <div>
                <Eyebrow>Canais de atendimento</Eyebrow>
                <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight">
                  Prefere falar agora?
                </h2>
              </div>

              {/* Destaque WhatsApp */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-carbon p-6">
                <span
                  aria-hidden
                  className="boost-glow pointer-events-none absolute inset-0"
                />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <MessageCircle className="size-5" />
                    </span>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Resposta na hora
                      </p>
                      <h3 className="mt-1 font-display text-lg font-bold uppercase tracking-tight text-foreground">
                        Atendimento no WhatsApp
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tire dúvidas de compatibilidade e feche o pedido pelo chat.
                      </p>
                    </div>
                  </div>
                  <Button asChild size="lg" className="gap-2 sm:shrink-0">
                    <a
                      href={whatsappLink(WHATSAPP_MESSAGE)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="size-4" />
                      Chamar no WhatsApp
                    </a>
                  </Button>
                </div>
              </div>

              {/* Grade de canais diretos */}
              <div className="grid gap-4 sm:grid-cols-2">
                {CHANNELS.map(({ icon: Icon, label, value, href, mono }) => {
                  const body = (
                    <>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                          {label}
                        </span>
                        <span
                          className={`mt-0.5 block text-sm font-semibold text-foreground ${
                            mono ? "font-mono" : ""
                          }`}
                        >
                          {value}
                        </span>
                      </span>
                    </>
                  );

                  return href ? (
                    <a
                      key={label}
                      href={href}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5"
                    >
                      {body}
                    </a>
                  ) : (
                    <div
                      key={label}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                    >
                      {body}
                    </div>
                  );
                })}
              </div>

              {/* Placeholder de mapa */}
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative flex aspect-[16/10] items-center justify-center bg-carbon">
                  <span
                    aria-hidden
                    className="boost-glow pointer-events-none absolute inset-0"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }}
                  />
                  <div className="relative flex flex-col items-center gap-3 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                      <MapPin className="size-6" />
                    </span>
                    <div>
                      <p className="font-display text-base font-bold uppercase tracking-tight text-foreground">
                        {SITE.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {SITE.address}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border p-4">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Headset className="size-4 text-primary" />
                    Loja física e retirada no balcão
                  </span>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer">
                      <Navigation className="size-4" />
                      Como chegar
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="pb-20">
        <Container>
          <div className="racing-clip relative overflow-hidden rounded-2xl bg-boost px-8 py-12 text-white">
            <span aria-hidden className="absolute inset-0 bg-carbon opacity-10" />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/80">
                  Ainda em dúvida?
                </p>
                <h2 className="mt-2 max-w-xl font-display text-2xl font-bold uppercase sm:text-3xl">
                  Nosso time monta o setup ideal pro seu carro
                </h2>
              </div>
              <Button asChild size="lg" variant="secondary" className="shrink-0 gap-2">
                <a
                  href={whatsappLink(WHATSAPP_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar com especialista
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/* Campo de formulário reutilizável: Label + Input + mensagem de erro acessível. */
function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  id: FieldName;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="font-mono text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
