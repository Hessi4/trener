// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NEXUS",
  description: "Inteligentny asystent treningu i diety",
  applicationName: "NEXUS",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/apple-touch-icon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/apple-touch-icon.svg", type: "image/svg+xml" }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NEXUS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-white relative w-full overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
