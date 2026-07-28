// Shared helpers for turning a document template (HTML with {{placeholders}})
// into a filled, human-readable document — used by the dossier wizard preview
// and the dossier detail view.

function fmtFee(n?: number | null): string {
  return `${(n ?? 0).toLocaleString("en-RW")} RWF`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export interface TemplateValueSource {
  fields?: Record<string, string> | null;
  clientName?: string;
  clientNationalId?: string;
  clientPhone?: string;
  serviceName?: string | null;
  officialFee?: number | null;
  notaryFee?: number | null;
  totalFee?: number | null;
  notaryName?: string;
  date?: Date;
}

/** Build the full set of {{key}} → value replacements for a template. */
export function templateValues(src: TemplateValueSource): Record<string, string> {
  const date = src.date ?? new Date();
  return {
    clientName: src.clientName ?? "",
    nationalId: src.clientNationalId ?? "",
    clientNationalId: src.clientNationalId ?? "",
    phone: src.clientPhone ?? "",
    serviceName: src.serviceName ?? "",
    officialFee: fmtFee(src.officialFee),
    notaryFee: fmtFee(src.notaryFee),
    totalFee: fmtFee(src.totalFee),
    notaryName: src.notaryName ?? "",
    date: fmtDate(date),
    // Notary-filled fields win over any defaults above.
    ...(src.fields ?? {}),
  };
}

/**
 * Replace every {{key}} in `content` with its value. Any placeholder left
 * without a value is rendered as a subtle blank so the gap is visible.
 */
export function mergeTemplate(
  content: string | null | undefined,
  values: Record<string, string>,
): string {
  let html = content ?? "";
  for (const [key, val] of Object.entries(values)) {
    html = html.replaceAll(`{{${key}}}`, val ?? "");
  }
  return html.replace(
    /\{\{\s*[\w.]+\s*\}\}/g,
    '<span style="color:#9ca3af">______</span>',
  );
}

/** Open a print-ready window for the merged document HTML. */
export function openPrintWindow(bodyHtml: string, title: string): void {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt;
      line-height: 1.6; padding: 48px; color: #111; max-width: 800px; margin: 0 auto; }
    h1,h2,h3 { font-family: inherit; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ccc; padding: 6px 8px; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
}
