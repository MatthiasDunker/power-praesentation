import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markdown2Slides - Chat-first markdown to slide generation",
  description: "Chat-first markdown to slide generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f2f1ed] text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
