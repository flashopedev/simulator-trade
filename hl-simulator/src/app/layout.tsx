import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HL Simulator - Paper Trading",
  description: "Practice trading with simulated funds on Hyperliquid",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg antialiased">{children}</body>
    </html>
  );
}
