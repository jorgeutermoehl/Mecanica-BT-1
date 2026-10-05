import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Host do Supabase Storage (fotos de produto em produção), se configurado.
const supabaseHost = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : null;
  } catch {
    return null;
  }
})();

const imgSources = [
  "'self'",
  "data:",
  "blob:",
  "https://images.unsplash.com",
  "https://placehold.co",
  ...(supabaseHost ? [`https://${supabaseHost}`] : []),
].join(" ");

// CSP: Next injeta scripts inline (hidratação, next-themes) → 'unsafe-inline'
// em script-src; 'unsafe-eval' só no dev (React Refresh). Fontes via next/font
// são self-hosted. frame-ancestors 'none' bloqueia clickjacking.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSources}`,
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // Fixa a raiz do workspace neste projeto (havia um package-lock.json solto
  // em C:\Users\jorge que confundia a detecção automática do Turbopack).
  turbopack: {
    root: __dirname,
  },
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
