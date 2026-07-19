import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { SessionGate } from "@/components/SessionGate";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Humanic Code",
  description: "A trust layer for AI-generated code changes"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AppHeader />
        <SessionGate>{children}</SessionGate>
      </body>
    </html>
  );
}

