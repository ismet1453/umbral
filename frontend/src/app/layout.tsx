import type { Metadata } from "next";
import { Cinzel, EB_Garamond } from "next/font/google";
import { AppWalletProvider } from "@/components/WalletProvider";
import "./globals.css";
import "./gothic-varek.css";
import "./cinematic-layout.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ),
  title: "UMBRAL — Idle Hunter",
  description:
    "Auto-battle idle RPG. Fight mobs, loot gear, enhance to +9. Web only — keep tab open to earn.",
  openGraph: {
    title: "UMBRAL — Idle Hunter",
    description: "Auto-battle idle RPG in your browser.",
    type: "website",
    images: ["/assets/kenney/rpg-ui/PNG/preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "UMBRAL — Idle Hunter",
    description: "Auto-battle idle RPG in your browser.",
    images: ["/assets/kenney/rpg-ui/PNG/preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${garamond.variable}`}>
      <body className={`${cinzel.variable} ${garamond.variable}`}>
        <AppWalletProvider>{children}</AppWalletProvider>
      </body>
    </html>
  );
}
