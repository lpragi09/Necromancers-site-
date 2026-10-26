import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HauntBackground from "@/components/HauntBackground";
import { DemoBanner } from "@/components/ui";
import { getViewer } from "@/lib/viewer";
import { isDemo } from "@/lib/data";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["500", "700", "900"], variable: "--font-cinzel" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Necromancers · Clã", template: "%s · Necromancers" },
  description: "Portal do clã Necromancers: avisos, sorteios, ranking de drops e membros.",
};

export const viewport: Viewport = { themeColor: "#05040a" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const nav = viewer
    ? { name: viewer.name, image: viewer.image, charName: viewer.member?.char_name ?? null, isAdmin: viewer.isAdmin }
    : null;

  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="antialiased">
        <Providers>
          <HauntBackground />
          <Navbar viewer={nav} />
          {isDemo() && <DemoBanner />}
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
