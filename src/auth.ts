import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import crypto from "crypto"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const tableId = "mt65n65nxm5n718";
          const projectId = process.env.NOCODB_TASHUB_PROJECT_ID || "p9wu4sik6ofg8ze";
          const url = `${process.env.NOCODB_URL}/api/v1/db/data/noco/${projectId}/${tableId}?where=(email,eq,${encodeURIComponent(credentials.email as string)})&limit=1`;
          
          const res = await fetch(url, {
            headers: {
              'xc-token': process.env.NOCODB_API_TOKEN as string,
              'Content-Type': 'application/json'
            }
          });

          if (!res.ok) {
            console.error("NocoDB Response not OK", await res.text());
            return null;
          }

          const result = await res.json();
          const list = result.list || [];
          const dbUser = list[0];

          if (!dbUser) {
            console.log("No user found in TAS HUB.");
            return null;
          }

          const inputHash = crypto.createHash('sha256').update(credentials.password as string).digest('hex');
          
          // Password matching
          if (dbUser.password_hash === inputHash) {
            if (dbUser.status !== 'Activo') {
               console.log("User is explicitly disabled via status field.");
               return null;
            }
            return {
              id: String(dbUser.Id),
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role_global,
            };
          }
          console.log("Password hash mismatch.");
          return null;
        } catch (error) {
          console.error("Auth Exception:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/', 
  }
})
