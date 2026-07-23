import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * Returns the current app user, syncing the Supabase auth user into the
 * application database on first access. Cached per-request.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) return null;

  const name =
    (authUser.user_metadata?.full_name as string | undefined) ??
    (authUser.user_metadata?.name as string | undefined) ??
    null;
  const avatarUrl =
    (authUser.user_metadata?.avatar_url as string | undefined) ?? null;

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email: authUser.email,
      name,
      avatarUrl,
      settings: { create: {} },
    },
    update: { email: authUser.email, name, avatarUrl },
  });

  return user;
});

/** Like getCurrentUser but redirects to /login when unauthenticated. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For API routes: returns the user or null without redirecting. */
export async function getApiUser(): Promise<User | null> {
  return getCurrentUser();
}
