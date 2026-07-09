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
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const MAP: Record<IconKey, LucideIcon> = {
  turbo: Fan,
  motor: Cog,
  freios: Disc3,
  suspensao: ArrowDownUp,
  filtros: Filter,
  eletrica: Zap,
  oleos: Droplets,
  escape: Wind,
  bateria: BatteryCharging,
  acessorios: Package,
};

export function PartIcon({
  icon,
  className,
}: {
  icon: IconKey;
  className?: string;
}) {
  const Icon = MAP[icon] ?? Package;
  return <Icon className={cn("size-5", className)} />;
}
