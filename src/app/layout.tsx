import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HauntBackground from "@/components/HauntBackground";
import { DemoBanner } from "@/components/ui";
import { canSeeContent, getViewer } from "@/lib/viewer";
import ScrollHash from "@/components/ScrollHash";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import { getPopupPost, isDemo } from "@/lib/data";

const lato = Lato({ subsets: ["latin"], weight: ["400", "700", "900"], style: ["normal", "italic"], variable: "--font-lato" });

const SITE_URL = process.env.NEXTAUTH_URL || "https://necromancers.vercel.app";
const DESCRIPTION = "Portal do clã Necromancers de PokeTibia: avisos, sorteios comprovados, ranking de drops com prêmio e membros.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Necromancers", template: "%s · Necromancers" },
  description: DESCRIPTION,
  openGraph: { type: "website", siteName: "Necromancers", locale: "pt_BR", title: "Necromancers", description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: "Necromancers", description: DESCRIPTION },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const member = canSeeContent(viewer);
  const popup = await getPopupPost(member).catch(() => null);
  const nav = viewer
    ? { name: viewer.name, image: viewer.image, charName: viewer.member?.char_name ?? null, isAdmin: viewer.isAdmin, isMember: viewer.member?.status === "active" }
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
          <ScrollHash />
          {popup && <AnnouncementPopup post={popup} isMember={member} />}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
