import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { allowLogin } from "@/lib/loginLimit";

// Login pelo Discord: é onde o clã já se organiza. O ID do Discord identifica o membro
// (o nome de exibição pode mudar a qualquer momento).
export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: { params: { scope: "identify" } },
      // O Discord devolve `iss` no callback (RFC 9207); sem issuer o openid-client recusa o login.
      issuer: "https://discord.com",
    }),
  ],
  // Erros de login (inclusive o limite por IP) caem numa página do próprio site
  pages: { error: "/login-erro" },
  callbacks: {
    // Limite contra spam: 2 contas diferentes por conexão a cada 15 min
    async signIn({ account }) {
      if (!account?.providerAccountId) return true;
      return allowLogin(account.providerAccountId);
    },
    async jwt({ token, account, profile }) {
      if (account) token.discordId = account.providerAccountId;
      if (profile) {
        const p = profile as { global_name?: string | null; username?: string; image_url?: string };
        token.name = p.global_name || p.username || token.name;
        if (p.image_url) token.picture = p.image_url;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.discordId = (token.discordId as string | undefined) ?? token.sub ?? "";
        session.user.name = token.name ?? session.user.name;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
