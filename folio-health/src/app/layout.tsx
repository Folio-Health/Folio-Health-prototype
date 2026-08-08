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
    "Internal hospital information system for reception, doctors, nurses, labs, pharmacy, and billing.",
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Folio",
  },
  // Internal system — no public surface to index or share socially.
  robots: {
    index: false,
    follow: false,
    nocache: true,
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
      {/* Browser extensions (password managers, ColorZilla's `cz-shortcut-listen`,
          Grammarly) inject attributes onto <body> before React hydrates, which
          React reports as a hydration mismatch the app cannot fix. Suppressing
          here covers only this element's own attributes — mismatches inside the
          tree are still reported. */}
      <body className="min-h-full" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
