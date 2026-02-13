import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Power Praesentation",
  description: "Chat-first markdown to slide generation"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-100 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
