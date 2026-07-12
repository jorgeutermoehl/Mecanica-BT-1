import {
  Fan,
  Cog,
  Disc3,
  ArrowDownUp,
  Filter,
  Zap,
  Droplets,
  Wind,
  BatteryCharging,
  Package,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Ícones automotivos por chave de categoria (fallback: Package). */
const MAP: Record<string, LucideIcon> = {
  turbo: Fan,
  motor: Cog,
  freios: Disc3,
  suspensao: ArrowDownUp,
  filtros: Filter,
  eletrica: Zap,
  oleos: Droplets,
  escape: Wind,
  bateria: BatteryCharging,
  rodas: LifeBuoy,
  acessorios: Package,
};

export function PartIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = MAP[icon] ?? Package;
  return <Icon className={cn("size-5", className)} />;
}
