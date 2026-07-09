"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LogIn, UserPlus, Lock, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { whatsappLink } from "@/lib/constants";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {children}
    </span>
  );
}

/** Campo de senha com botão para mostrar/ocultar o valor digitado. */
function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-2.5 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint && <p className="font-mono text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function LoginPage() {
  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.info("Autenticação em breve");
  }

  function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.info("Autenticação em breve");
  }

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <span aria-hidden className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-72" />
      <Container className="relative">
        <div className="mx-auto max-w-md">
          {/* Cabeçalho */}
          <div className="text-center">
            <Eyebrow>Área do piloto</Eyebrow>
            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
              Acesse sua conta
            </h1>
            <p className="mt-3 text-pretty text-sm text-muted-foreground">
              Acompanhe pedidos, salve seus setups favoritos e finalize a compra
              com mais rapidez.
            </p>
          </div>

          {/* Painel de autenticação */}
          <div className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
            <span aria-hidden className="boost-glow pointer-events-none absolute inset-x-0 top-0 h-24" />
            <div className="relative p-6 sm:p-8">
              <Tabs defaultValue="entrar">
                <TabsList className="h-10 w-full">
                  <TabsTrigger value="entrar" className="gap-1.5">
                    <LogIn className="size-4" />
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="criar" className="gap-1.5">
                    <UserPlus className="size-4" />
                    Criar conta
                  </TabsTrigger>
                </TabsList>

                {/* ---------- ENTRAR ---------- */}
                <TabsContent value="entrar" className="mt-6">
                  <p className="mb-5 text-sm text-muted-foreground">
                    Bem-vindo de volta. Entre para continuar acelerando.
                  </p>
                  <form onSubmit={handleLogin} className="grid gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="voce@email.com"
                        required
                      />
                    </div>

                    <PasswordField
                      id="login-password"
                      label="Senha"
                      autoComplete="current-password"
                      placeholder="Sua senha"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <Label
                        htmlFor="login-remember"
                        className="gap-2 text-sm font-normal text-muted-foreground"
                      >
                        <Checkbox id="login-remember" name="remember" />
                        Lembrar de mim
                      </Label>
                      <Link
                        href="/recuperar-senha"
                        className="text-sm font-medium text-primary transition-colors hover:underline"
                      >
                        Esqueci minha senha
                      </Link>
                    </div>

                    <Button type="submit" size="lg" className="mt-1 w-full gap-2">
                      <LogIn className="size-4" />
                      Entrar
                    </Button>
                  </form>
                </TabsContent>

                {/* ---------- CRIAR CONTA ---------- */}
                <TabsContent value="criar" className="mt-6">
                  <p className="mb-5 text-sm text-muted-foreground">
                    Crie sua conta e agilize suas próximas compras de performance.
                  </p>
                  <form onSubmit={handleRegister} className="grid gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="register-name">Nome completo</Label>
                      <Input
                        id="register-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <Label htmlFor="register-email">E-mail</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="voce@email.com"
                        required
                      />
                    </div>

                    <PasswordField
                      id="register-password"
                      label="Senha"
                      autoComplete="new-password"
                      placeholder="Crie uma senha"
                      hint="Mínimo de 8 caracteres, com letras e números."
                    />

                    <PasswordField
                      id="register-confirm"
                      label="Confirmar senha"
                      autoComplete="new-password"
                      placeholder="Repita a senha"
                    />

                    <div className="flex items-start gap-2">
                      <Checkbox id="register-terms" name="terms" required className="mt-0.5" />
                      <Label
                        htmlFor="register-terms"
                        className="items-start text-xs font-normal leading-relaxed text-muted-foreground"
                      >
                        <span>
                          Li e aceito os{" "}
                          <Link href="/termos" className="text-primary hover:underline">
                            termos de uso
                          </Link>{" "}
                          e a{" "}
                          <Link href="/privacidade" className="text-primary hover:underline">
                            política de privacidade
                          </Link>
                          .
                        </span>
                      </Label>
                    </div>

                    <Button type="submit" size="lg" className="mt-1 w-full gap-2">
                      <UserPlus className="size-4" />
                      Criar conta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Rodapé de confiança */}
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <p className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              <Lock className="size-3.5" />
              Login protegido com criptografia de ponta a ponta
            </p>
            <p className="text-xs text-muted-foreground">
              Problemas para entrar?{" "}
              <a
                href={whatsappLink("Olá! Estou com dificuldade para acessar minha conta na FullBoost.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary transition-colors hover:underline"
              >
                <MessageCircle className="size-3.5" />
                Falar com o suporte
              </a>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
