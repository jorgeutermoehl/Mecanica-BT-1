import Link from "next/link";
import { Fan } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

/**
 * Wordmark FullBoost Race Parts. Tipografia usinada (font-display),
 * "BOOST" com gradiente de boost (vermelho→laranja). Adapta a ambos os temas.
 */
export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label={`${SITE.name} — página inicial`}
    >
      <span className="relative flex size-9 -skew-x-6 items-center justify-center overflow-hidden rounded-md bg-boost shadow-sm shadow-black/30 transition-transform group-hover:scale-105">
        <Fan className="size-5 skew-x-6 text-white" strokeWidth={2.4} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold uppercase leading-none tracking-tight">
          Full<span className="text-boost">Boost</span>
        </span>
        <span className="mt-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.34em] text-muted-foreground">
          {SITE.tagline}
        </span>
      </span>
    </Link>
  );
}
