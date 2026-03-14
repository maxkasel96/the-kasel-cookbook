import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";

export type AppRole = typeof ADMIN_ROLE | typeof USER_ROLE;

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getRoleForUserId(userId: string): Promise<AppRole> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.role) {
    return USER_ROLE;
  }

  return data.role === ADMIN_ROLE ? ADMIN_ROLE : USER_ROLE;
}

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return getRoleForUserId(user.id);
}

export async function isCurrentUserAdmin() {
  const role = await getCurrentUserRole();
  return role === ADMIN_ROLE;
}

export async function syncUserRoleToMetadata(userId: string) {
  const role = await getRoleForUserId(userId);
  const supabaseAdmin = createSupabaseAdminClient();

  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      role,
    },
  });

  return role;
}
