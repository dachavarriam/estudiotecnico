import NextAuth from "next-auth"
import Slack from "next-auth/providers/slack"
import { nocodb } from "@/lib/nocodb"
import { NOCODB_TABLES } from "@/lib/constants"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Slack({
      clientId: process.env.AUTH_SLACK_ID,
      clientSecret: process.env.AUTH_SLACK_SECRET,
      authorization: {
        params: {
          scope: "openid profile email", 
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        // 1. Check if user exists in NocoDB
        // We fetch all users because we can't easily filter by email in API sometimes without proper indexes or URL encoding issues
        // Given the small team size ( < 100), fetching all is fine for now.
        const result = await nocodb.list(NOCODB_TABLES.users, { limit: 100 }) as any;
        const list = result.list || result || [];
        
        const dbUser = list.find((u: any) => u.email === user.email);

        if (dbUser) {
            // Attach role to the user object temporarily so we can use it in JWT
            (user as any).role = dbUser.Role;
            (user as any).nocodb_id = dbUser.Id;
            (user as any).slack_id = dbUser["Slack ID"];
            return true;
        } else {
             console.log(`Access Denied: Email ${user.email} not found in NocoDB.`);
             return false; // Register new users manually in NocoDB first
        }
      } catch (error) {
        console.error("Auth Error checking NocoDB:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).nocodb_id;
        token.slack_id = (user as any).slack_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).slack_id = token.slack_id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // Custom sign-in page (our home page)
  }
})
