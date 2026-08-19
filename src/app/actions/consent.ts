"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { consentSchema } from "@/lib/validations";

/**
 * Registra o consentimento de cookies (LGPD) com os dados de origem da
 * visita que o próprio navegador fornece: referrer (ex.: instagram.com),
 * UTMs do link da bio, idioma e fuso — nada de rastreamento sem aceite.
 */
export async function saveConsentAction(input: unknown): Promise<{ ok: boolean }> {
  const parsed = consentSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const h = await headers();
  const ip =
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const userAgent = h.get("user-agent");

  const d = parsed.data;
  const origin = [
    d.referrer && `ref=${d.referrer}`,
    d.utmSource && `utm_source=${d.utmSource}`,
    d.utmMedium && `utm_medium=${d.utmMedium}`,
    d.utmCampaign && `utm_campaign=${d.utmCampaign}`,
    d.locale && `locale=${d.locale}`,
    d.timezone && `tz=${d.timezone}`,
  ]
    .filter(Boolean)
    .join(" | ");

  await prisma.cookieConsent.create({
    data: {
      sessionId: d.sessionId,
      necessary: true,
      analytics: d.analytics,
      marketing: d.marketing,
      utmSource: d.utmSource || null,
      utmMedium: d.utmMedium || null,
      utmCampaign: d.utmCampaign || null,
      consentVersion: d.consentVersion,
      ip,
      // userAgent guarda também a origem consolidada (referrer/locale/tz).
      userAgent: [userAgent, origin].filter(Boolean).join(" || ").slice(0, 900) || null,
    },
  });

  return { ok: true };
}
