import { cn } from "@/lib/cn";

/* ── Root ── */
function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto rounded-lg border border-border">
      <table className={cn("w-full text-sm text-foreground", className)} {...props} />
    </div>
  );
}

/* ── Head ── */
function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-surface border-b border-border", className)} {...props} />;
}

/* ── Body ── */
function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

/* ── Row ── */
function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("hover:bg-surface transition-colors duration-100", className)}
      {...props}
    />
  );
}

/* ── Header cell ── */
function TableTh({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide",
        className
      )}
      {...props}
    />
  );
}

/* ── Data cell ── */
function TableTd({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 text-sm", className)} {...props} />;
}

export { Table, TableHead, TableBody, TableRow, TableTh, TableTd };
