import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { AuthenticatedShell } from "@/components/authenticated-shell";

export const metadata: Metadata = {
  title: "Productivity Audit",
  description: "Daily activity logging and pattern recognition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          <AuthenticatedShell>{children}</AuthenticatedShell>
        </SessionProvider>
      </body>
    </html>
  );
}
