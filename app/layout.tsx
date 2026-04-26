import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFS – Notary File System",
  description: "Official digital platform for notarial document management in Rwanda.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
