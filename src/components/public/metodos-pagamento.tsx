import { cn } from "@/lib/utils";

/* "Chip" branco que segura cada marca — legível sobre o rodapé escuro. */
function Chip({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className="flex h-7 w-11 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/5"
    >
      {children}
    </span>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 40 24" className="h-4 w-auto" aria-hidden>
      <circle cx="16" cy="12" r="8" fill="#EB001B" />
      <circle cx="24" cy="12" r="8" fill="#F79E1B" />
      <path d="M20 5.9a8 8 0 0 1 0 12.2 8 8 0 0 1 0-12.2z" fill="#FF5F00" />
    </svg>
  );
}

function BoletoMark() {
  return (
    <svg viewBox="0 0 40 24" className="h-4 w-auto" fill="#1a1a1a" aria-hidden>
      {[4, 7, 9.5, 13.5, 16, 19.5, 22, 26, 28.5, 31.5, 34].map((x, i) => (
        <rect key={i} x={x} y="4" width={i % 3 === 0 ? 2 : 1} height="16" />
      ))}
    </svg>
  );
}

export function PaymentMethods({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Chip label="Pix">
        <span className="text-[13px] font-bold tracking-tight text-[#00A99D]">
          Pix
        </span>
      </Chip>
      <Chip label="Visa">
        <span className="text-[13px] font-bold italic tracking-tight text-[#1434CB]">
          VISA
        </span>
      </Chip>
      <Chip label="Mastercard">
        <MastercardMark />
      </Chip>
      <Chip label="Elo">
        <span className="text-[13px] font-extrabold lowercase tracking-tight text-[#111]">
          elo
        </span>
      </Chip>
      <Chip label="Boleto">
        <BoletoMark />
      </Chip>
    </div>
  );
}