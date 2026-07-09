import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

// Extend the session/user/JWT with our RBAC fields.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: Role;
  }
}
