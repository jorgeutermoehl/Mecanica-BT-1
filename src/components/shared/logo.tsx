import Link from "next/link";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

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
      aria-label={SITE.name}
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <Wrench className="size-5" strokeWidth={2.5} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-extrabold uppercase tracking-tight">
          {SITE.shortName}
          <span className="text-primary">.</span>
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Auto Peças
        </span>
      </span>
    </Link>
  );
}
