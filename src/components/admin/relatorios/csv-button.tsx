"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Célula do CSV — números saem com vírgula decimal (padrão Excel pt-BR). */
export type CsvCell = string | number | null | undefined;

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  // Números com vírgula decimal para o Excel brasileiro.
  const text = typeof value === "number" ? String(value).replace(".", ",") : String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Botão de exportação CSV (client-only): recebe as linhas já filtradas via
 * props do server component e gera o arquivo no navegador.
 * BOM + separador ";" para o Excel pt-BR abrir com acentos e colunas corretos.
 */
export function CsvButton({
  filename,
  headers,
  rows,
  label = "Exportar CSV",
}: {
  filename: string;
  headers: string[];
  rows: CsvCell[][];
  label?: string;
}) {
  function handleExport() {
    const lines = [headers, ...rows].map((cells) => cells.map(escapeCell).join(";"));
    // BOM (U+FEFF) faz o Excel reconhecer o UTF-8 (acentos corretos).
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Arquivo CSV gerado", { description: link.download });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleExport}
      disabled={rows.length === 0}
    >
      <Download className="size-3.5" aria-hidden />
      {label}
    </Button>
  );
}
