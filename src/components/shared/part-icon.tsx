import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ícones automotivos próprios da FullBoost — desenhados no padrão do lucide
 * (viewBox 24, stroke 2, currentColor) para representar cada categoria de
 * peça com clareza: roda com raios, turbina em espiral, pistão, disco de
 * freio ventilado, ponteira de escape, mola de suspensão, filtro cônico,
 * vela de ignição, gota de óleo e bateria.
 */

type SvgProps = React.SVGProps<SVGSVGElement>;

const base = (props: SvgProps) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

/** Roda esportiva: aro + cubo + 5 raios. */
function WheelIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 9.6V4.5" />
      <path d="M14.2 13.1l4.4 2.6" />
      <path d="M9.8 13.1l-4.4 2.6" />
      <path d="M13.8 10.4l4.1-3" />
      <path d="M10.2 10.4l-4.1-3" />
    </svg>
  );
}

/** Turbina: caracol com pá central e saída. */
function TurboIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="13" r="3" />
      <path d="M11 5a8 8 0 1 1-8 8" />
      <path d="M11 5h8" />
      <path d="M11 10.2c1.9-.7 3.4-.4 4.6.8" />
    </svg>
  );
}

/** Pistão com biela. */
function PistonIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <rect x="7" y="3" width="10" height="7" rx="1" />
      <path d="M9 6.5h.01M15 6.5h.01" />
      <path d="M12 10v3" />
      <circle cx="12" cy="15.5" r="2.5" />
      <path d="M13.8 17.3L16 21" />
    </svg>
  );
}

/** Disco de freio ventilado com pinça. */
function BrakeIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 5.4v1.8M18.6 12h-1.8M12 18.6v-1.8M5.4 12h1.8" />
      <path d="M16.6 3.6a9.5 9.5 0 0 1 3.8 3.8" />
    </svg>
  );
}

/** Ponteira dupla de escape. */
function ExhaustIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 9h9l3 1.5V7l6 2.5v5L15 17v-3.5L12 15H3z" />
      <path d="M3 12h9" />
    </svg>
  );
}

/** Mola de suspensão (coilover). */
function SpringIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4h14" />
      <path d="M5 20h14" />
      <path d="M8 6.2c8 1 8 2.2 0 3.2 8 1 8 2.2 0 3.2 8 1 8 2.2 0 3.2 8 1 8 1.4 8 1.4" />
    </svg>
  );
}

/** Filtro de ar cônico. */
function FilterConeIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <ellipse cx="12" cy="6" rx="6" ry="2.5" />
      <path d="M6 6l2 12h8l2-12" />
      <path d="M8.5 10.5h7M9.2 14.5h5.6" />
    </svg>
  );
}

/** Vela de ignição com faísca. */
function SparkIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 3h4v4l-1 1v4h-2V8l-1-1z" />
      <path d="M9 12h6l-1 4h-4z" />
      <path d="M12 16v2" />
      <path d="M8 20.5L10 19M16 20.5L14 19M12 22v-2" />
    </svg>
  );
}

/** Gota de óleo. */
function OilIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
      <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" />
    </svg>
  );
}

/** Bateria com polos. */
function BatteryIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M6.5 8V5.5h3V8M14.5 8V5.5h3V8" />
      <path d="M6.5 13.5h4M8.5 11.5v4M13.5 13.5h4" />
    </svg>
  );
}

/** Chave de boca (peças gerais / acessórios). */
function WrenchIcon(props: SvgProps) {
  return (
    <svg {...base(props)}>
      <path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.8L3 17.8V21h3.2l5.7-5.7a4.5 4.5 0 0 0 5.8-6L14.5 12l-2.5-2.5z" />
    </svg>
  );
}

const MAP: Record<string, (props: SvgProps) => React.JSX.Element> = {
  rodas: WheelIcon,
  turbo: TurboIcon,
  motor: PistonIcon,
  freios: BrakeIcon,
  escape: ExhaustIcon,
  suspensao: SpringIcon,
  filtros: FilterConeIcon,
  eletrica: SparkIcon,
  oleos: OilIcon,
  bateria: BatteryIcon,
  acessorios: WrenchIcon,
};

export function PartIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = MAP[icon];
  if (!Icon) return <Package className={cn("size-5", className)} />;
  return <Icon className={cn("size-5", className)} aria-hidden />;
}
