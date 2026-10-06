import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { CONTACT_STATUS_LABEL, listContactMessages } from "@/server/contacts";
import { ContactStatusButtons } from "@/components/admin/mensagens/contact-status-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mensagens" };

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** Link wa.me a partir do telefone informado (assume Brasil se vier sem DDI). */
function waHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

export default async function MessagesPage() {
  const messages = await listContactMessages();
  const open = messages.filter((m) => m.status === "NEW").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Mensagens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contatos enviados pelo formulário do site · {open} {open === 1 ? "nova" : "novas"}.
        </p>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma mensagem recebida ainda.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const wa = m.phone ? waHref(m.phone) : null;
            return (
              <li key={m.id}>
                <Card className={m.status === "NEW" ? "border-primary/40" : undefined}>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {m.name}
                          {m.subject && <span className="text-muted-foreground"> · {m.subject}</span>}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {dateTime.format(new Date(m.createdAt))}
                          {m.handledBy && ` · por ${m.handledBy}`}
                        </p>
                      </div>
                      <Badge variant={m.status === "NEW" ? "default" : "secondary"}>
                        {CONTACT_STATUS_LABEL[m.status] ?? m.status}
                      </Badge>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{m.message}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                          <Mail className="size-3.5" />
                          {m.email}
                        </a>
                      )}
                      {m.phone && (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                          <Phone className="size-3.5" />
                          {m.phone}
                        </span>
                      )}
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <MessageCircle className="size-3.5" />
                          Responder no WhatsApp
                        </a>
                      )}
                    </div>
                    <ContactStatusButtons id={m.id} status={m.status} />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
