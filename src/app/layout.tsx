import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HauntBackground from "@/components/HauntBackground";
import { DemoBanner } from "@/components/ui";
import { getViewer } from "@/lib/viewer";
import { isDemo } from "@/lib/data";

const lato = Lato({ subsets: ["latin"], weight: ["400", "700", "900"], style: ["normal", "italic"], variable: "--font-lato" });

export const metadata: Metadata = {
  title: { default: "Necromancers · Clã", template: "%s · Necromancers" },
  description: "Portal do clã Necromancers: avisos, sorteios, ranking de drops e membros.",
};

export const viewport: Viewport = { themeColor: "#000000" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const nav = viewer
    ? { name: viewer.name, image: viewer.image, charName: viewer.member?.char_name ?? null, isAdmin: viewer.isAdmin }
    : null;

  return (
    <html lang="pt-BR" className={lato.variable}>
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
