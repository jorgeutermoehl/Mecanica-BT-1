"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { saveConsentAction } from "@/app/actions/consent";

/**
 * Banner de cookies (LGPD): aparece uma vez, registra a escolha no servidor
 * junto com a origem da visita (referrer/UTM — ex.: veio do Instagram).
 */

const STORAGE_KEY = "fb-consent-v1";

function getSessionId(): string {
  const existing = localStorage.getItem("fb-session-id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("fb-session-id", id);
  return id;
}

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);
  const [showPrefs, setShowPrefs] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);

  React.useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  async function decide(opts: { analytics: boolean; marketing: boolean }) {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...opts, at: Date.now() }));

    const params = new URLSearchParams(window.location.search);
    try {
      await saveConsentAction({
        sessionId: getSessionId(),
        necessary: true,
        analytics: opts.analytics,
        marketing: opts.marketing,
        referrer: document.referrer ?? "",
        utmSource: params.get("utm_source") ?? "",
        utmMedium: params.get("utm_medium") ?? "",
        utmCampaign: params.get("utm_campaign") ?? "",
        locale: navigator.language ?? "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
      });
    } catch {
      // consentimento local já registrado; falha de rede não bloqueia o uso
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/85"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cookie className="size-4" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            Usamos cookies para o funcionamento da loja e, com a sua permissão, para
            entender de onde você veio (ex.: Instagram) e melhorar sua experiência.
            Saiba mais na nossa{" "}
            <Link href="/privacidade" className="text-primary underline-offset-2 hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>

        {showPrefs ? (
          <div className="grid gap-2 rounded-lg border border-border bg-background/60 p-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked disabled aria-label="Cookies necessários (sempre ativos)" />
              Necessários <span className="text-xs text-muted-foreground">(sempre)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={analytics}
                onCheckedChange={(v) => setAnalytics(v === true)}
                aria-label="Cookies de análise"
              />
              Análise de uso
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={marketing}
                onCheckedChange={(v) => setMarketing(v === true)}
                aria-label="Cookies de marketing"
              />
              Marketing
            </label>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowPrefs((s) => !s)}
          >
            {showPrefs ? "Ocultar preferências" : "Configurar preferências"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              void decide(showPrefs ? { analytics, marketing } : { analytics: false, marketing: false })
            }
          >
            {showPrefs ? "Salvar escolhas" : "Somente necessários"}
          </Button>
          <Button className="w-full" onClick={() => void decide({ analytics: true, marketing: true })}>
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
