import { NextResponse } from "next/server";

import { ADMIN_ROLE, USER_ROLE, syncUserRoleToMetadata, type AppRole } from "@/lib/auth/roles";
import { ensureAdminRequest } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AssignRoleRequest = {
  email?: string;
  role?: AppRole;
};

const isValidRole = (value: unknown): value is AppRole =>
  value === ADMIN_ROLE || value === USER_ROLE;

export async function GET() {
  const adminCheck = await ensureAdminRequest();
  if (adminCheck.unauthorizedResponse) {
    return adminCheck.unauthorizedResponse;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = await Promise.all(
    (data.users ?? []).map(async (user) => {
      const role = (user.app_metadata?.role as AppRole | undefined) ?? USER_ROLE;
      return {
        id: user.id,
        email: user.email,
        role,
        lastSignInAt: user.last_sign_in_at,
      };
    })
  );

  return NextResponse.json({ users }, { status: 200 });
}

export async function POST(request: Request) {
  const adminCheck = await ensureAdminRequest();
  if (adminCheck.unauthorizedResponse) {
    return adminCheck.unauthorizedResponse;
  }

  const body = (await request.json()) as AssignRoleRequest;

  if (!body.email || !isValidRole(body.role)) {
    return NextResponse.json(
      { error: "A valid email and role are required." },
      { status: 400 }
    );
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const match = (usersData.users ?? []).find(
    (user) => user.email?.toLowerCase() === normalizedEmail
  );

  if (!match) {
    return NextResponse.json(
      {
        error:
          "User not found. Have the user sign in with Google at least once, then assign a role.",
      },
      { status: 404 }
    );
  }

  const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
    {
      user_id: match.id,
      role: body.role,
      updated_by: adminCheck.user?.id,
    },
    {
      onConflict: "user_id",
    }
  );

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  await syncUserRoleToMetadata(match.id);

  return NextResponse.json(
    {
      message: "User role updated.",
      user: {
        id: match.id,
        email: match.email,
        role: body.role,
      },
    },
    { status: 200 }
  );
}
