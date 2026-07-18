import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { SessionGate } from "@/components/SessionGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guardrail",
  description: "A trust layer for AI-generated code changes"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        <SessionGate>{children}</SessionGate>
      </body>
    </html>
  );
}
