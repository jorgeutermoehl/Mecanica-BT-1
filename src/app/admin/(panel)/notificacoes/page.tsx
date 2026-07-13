import Link from "next/link";
import { ArrowRight, BellOff, Mail, ShoppingCart, TriangleAlert } from "lucide-react";
import { getNotifications, type AdminNotification } from "@/server/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Notificações" };

/** Tempo relativo curto em pt-BR (ex.: "há 5 min", "há 2 h", "há 3 dias"). */
function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? "mês" : "meses"}`;
}

const KIND_STYLE: Record<
  AdminNotification["kind"],
  { icon: React.ComponentType<{ className?: string }>; chip: string }
> = {
  low_stock: { icon: TriangleAlert, chip: "bg-warning/15 text-warning" },
  order: { icon: ShoppingCart, chip: "bg-info/15 text-info" },
  contact: { icon: Mail, chip: "bg-primary/10 text-primary" },
};

function NotificationCard({ item }: { item: AdminNotification }) {
  const { icon: Icon, chip } = KIND_STYLE[item.kind];
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-4">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${chip}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          {relativeTime(item.at)}
        </span>
        <Button asChild variant="outline" size="sm" className="shrink-0 gap-1">
          <Link href={item.href}>
            Resolver
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationGroup({
  title,
  items,
}: {
  title: string;
  items: AdminNotification[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title} ({items.length})
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export default async function NotificationsPage() {
  const { items, count } = await getNotifications();

  const lowStock = items.filter((i) => i.kind === "low_stock");
  const orders = items.filter((i) => i.kind === "order");
  const contacts = items.filter((i) => i.kind === "contact");

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Notificações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alertas de estoque, pedidos aguardando ação e mensagens de clientes — atualizados em
          tempo real a cada acesso.
        </p>
      </div>

      {count === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
              <BellOff className="size-7" />
            </span>
            <p className="font-display text-lg font-semibold">Tudo em dia — nenhuma pendência.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Nenhum produto abaixo do estoque mínimo, nenhum pedido aguardando ação e nenhuma
              mensagem nova de clientes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <NotificationGroup title="Estoque baixo" items={lowStock} />
          <NotificationGroup title="Pedidos aguardando ação" items={orders} />
          <NotificationGroup title="Mensagens" items={contacts} />
        </div>
      )}

      {/* Rodapé informativo */}
      <Card size="sm">
        <CardContent className="text-sm text-muted-foreground">
          Estas notificações derivam do estado atual do sistema: resolver a pendência remove o
          alerta automaticamente.
        </CardContent>
      </Card>
    </div>
  );
}
