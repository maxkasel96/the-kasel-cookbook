import type { User } from "@supabase/supabase-js";

const LOCAL_BYPASS_USER_ID = "11111111-1111-4111-8111-111111111111";
const LOCAL_BYPASS_EMAIL = "local-dev@the-kasel-cookbook.test";
const LOCAL_BYPASS_CREATED_AT = "1970-01-01T00:00:00.000Z";

export function isLocalAuthBypassEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_LOCAL_AUTH_BYPASS === "true"
  );
}

export function getLocalAuthBypassUser(): User {
  return {
    id: LOCAL_BYPASS_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: LOCAL_BYPASS_EMAIL,
    email_confirmed_at: LOCAL_BYPASS_CREATED_AT,
    phone: "",
    confirmed_at: LOCAL_BYPASS_CREATED_AT,
    last_sign_in_at: LOCAL_BYPASS_CREATED_AT,
    app_metadata: {
      provider: "local-bypass",
      providers: ["local-bypass"],
      role: "admin",
    },
    user_metadata: {
      name: "Local Dev User",
    },
    identities: [],
    created_at: LOCAL_BYPASS_CREATED_AT,
    updated_at: LOCAL_BYPASS_CREATED_AT,
    is_anonymous: false,
  };
}
