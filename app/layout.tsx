import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export const metadata: Metadata = {
  title: "NFS – Notary File System",
  description: "Official digital platform for notarial document management in Rwanda.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
