import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/providers/app-providers";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Folio Health EMR: Hospital Information System",
    template: "%s · Folio Health EMR",
  },
  description:
    "Folio — the record that follows the patient. One connected system for reception, doctors, nurses, labs, pharmacy, and billing.",
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Folio",
  },
  openGraph: {
    title: "Folio — the record that follows the patient",
    description: "One record, every clinic. A connecting layer for Nigerian healthcare.",
    images: [{ url: "/folio-og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/folio-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0E443B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
