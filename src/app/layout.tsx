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

const SITE_URL = process.env.NEXTAUTH_URL || "https://necromancers.vercel.app";
const DESCRIPTION = "Portal do clã Necromancers de PokeTibia: avisos, sorteios comprovados, ranking de drops com prêmio e membros.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Necromancers · Clã de PokeTibia", template: "%s · Necromancers" },
  description: DESCRIPTION,
  openGraph: { type: "website", siteName: "Necromancers", locale: "pt_BR", title: "Necromancers · Clã de PokeTibia", description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: "Necromancers · Clã de PokeTibia", description: DESCRIPTION },
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
