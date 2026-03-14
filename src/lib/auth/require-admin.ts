import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ROLE } from "@/lib/auth/roles";

export async function ensureAdminRequest() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      unauthorizedResponse: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  if (user.app_metadata?.role !== ADMIN_ROLE) {
    return {
      user,
      unauthorizedResponse: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      ),
    };
  }

  return { user, unauthorizedResponse: null };
}
