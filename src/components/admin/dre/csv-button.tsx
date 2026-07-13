"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type CsvCell = string | number;

/**
 * Botão de exportação CSV genérico: recebe cabeçalho + linhas já formatadas
 * via props e gera o arquivo no navegador (BOM UTF-8 + separador ";" para
 * abrir direto no Excel pt-BR).
 */
export function CsvButton({
  filename,
  header,
  rows,
  label = "Exportar CSV",
}: {
  filename: string;
  header: string[];
  rows: CsvCell[][];
  label?: string;
}) {
  function handleExport() {
    if (rows.length === 0) {
      toast.info("Nada para exportar no período selecionado.");
      return;
    }

    const escapeCell = (cell: CsvCell) => {
      const s = String(cell);
      return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [header, ...rows].map((row) => row.map(escapeCell).join(";"));
    // BOM para o Excel reconhecer UTF-8 (acentuação correta).
    const blob = new Blob([String.fromCharCode(0xfeff) + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success(`CSV exportado — ${rows.length} linha${rows.length === 1 ? "" : "s"}.`);
  }

  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
      <Download aria-hidden />
      {label}
    </Button>
  );
}
