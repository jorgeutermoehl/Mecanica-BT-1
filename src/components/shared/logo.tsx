"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Fan } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

/**
 * Logo FullBoost Race Parts, em destaque no canto superior esquerdo.
 * Usa a arte oficial em /logo-fullboost.png quando o arquivo existir em
 * `public/`; caso contrário, cai no wordmark tipográfico da marca.
 */
export function Logo({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string;
  size?: "md" | "lg";
}) {
  const [imageOk, setImageOk] = React.useState(true);
  const height = size === "lg" ? 56 : 44;

  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label={`${SITE.name} — página inicial`}
    >
      {imageOk ? (
        <Image
          src="/logo-fullboost.png"
          alt={SITE.name}
          width={Math.round(height * 2.4)}
          height={height}
          priority
          className="object-contain transition-transform group-hover:scale-[1.03]"
          style={{ height: "auto", maxHeight: height, width: "auto" }}
          onError={() => setImageOk(false)}
        />
      ) : (
        <>
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
        </>
      )}
    </Link>
  );
}
