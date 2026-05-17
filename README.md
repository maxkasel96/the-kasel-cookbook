This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Google OAuth setup (Supabase)

If you see `Error 400: redirect_uri_mismatch` on the Google sign-in page, make sure your Google OAuth client is configured with Supabase’s callback URL and your app’s redirect URLs are allowed.

1. In the Google Cloud Console, add this **Authorized redirect URI** to your OAuth client:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
2. In the Supabase dashboard (Authentication → URL Configuration), add your app’s URL(s) to **Redirect URLs**, for example:
   - `http://localhost:3000/auth/callback`
   - `https://<your-domain>/auth/callback`

The app uses the current site origin as the OAuth redirect target and routes it through `/auth/callback`, so both Supabase and Google must allow those URLs. `src/app/login/page.tsx` builds the redirect URL from `window.location.origin` and `/auth/callback`. `src/app/auth/callback/route.ts` exchanges the code and redirects back to `/`.

## Local auth bypass for testing

If you want to skip Google sign-in on your local machine while testing UI flows, add this to `.env.local`:

```bash
NEXT_PUBLIC_LOCAL_AUTH_BYPASS=true
```

This bypass is only honored outside production. It skips the middleware login redirect and treats local admin checks as authenticated so you can test admin UI flows such as recipe import and recipe creation.

Important: this does not create a real Supabase session or an `auth.users` record, so features that depend on authenticated database rows and row-level security, such as household membership and shopping list ownership, still need a real signed-in user.

## Recipe URL import setup

The `/recipe-input` page now uses a server route that:

1. Fetches the target recipe page HTML.
2. Extracts JSON-LD recipe schema and visible text from the page.
3. Sends that content to OpenAI to normalize it into the same draft shape used by `/admin/recipes/create`.
4. Stores the draft in browser local storage so the admin create form can hydrate from it.

Add these server-side environment variables anywhere the app runs:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_RECIPE_IMPORT_MODEL=gpt-4.1-mini
```

Notes:

- `OPENAI_API_KEY` is required for recipe imports and must only be configured on the server, not as a `NEXT_PUBLIC_` variable.
- `OPENAI_RECIPE_IMPORT_MODEL` is optional. The code defaults to `gpt-4.1-mini`, but you can swap in another supported OpenAI model if you want a different quality/cost tradeoff.
- In Vercel, add both variables under Project Settings -> Environment Variables for the environments you want (`Development`, `Preview`, and/or `Production`).
- For local development, place the variables in `.env.local`.
- Saving the imported draft as a real recipe still depends on the existing Supabase admin/server variables already used by `/api/admin/recipes`.
- `NEXT_PUBLIC_LOCAL_AUTH_BYPASS=true` can still be useful locally if you want to test the admin create flow without signing in, but do not set that bypass in production.

## Recipe JSON import

The admin create page now supports a structured JSON import flow at `/admin/recipes/create`.

1. Choose “Paste JSON” as the entry method.
2. Paste structured recipe JSON from ChatGPT or another source.
3. Click “Parse JSON” to validate and preview the imported draft.
4. Click “Use in Create Recipe” to populate the editor form and save the recipe.

A help panel is available in the JSON import card with:

- a short schema overview,
- a complete example JSON payload,
- a copy button to paste the example directly into the editor.

The expected JSON shape includes:

- `sourceUrl` (string)
- `title` (string)
- `description` (string)
- `servings` (string)
- `prepMinutes` (string)
- `cookMinutes` (string)
- `ingredients` (array of objects with `text`, `quantity`, `unit`, `note`, `optional`)
- `steps` (array of strings)
- `stepIngredientIndexes` (array of arrays of 1-based ingredient indexes)

The parser validates the JSON and displays human-readable errors when the payload does not match the expected shape.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Role-based admin access

Admin routes are protected with role-based access control:

- `/admin/**` pages are gated in `src/middleware.ts`.
- `/api/admin/**` endpoints verify authenticated admin users before allowing access.
- Roles are stored in `public.user_roles` and mirrored into Supabase Auth `app_metadata.role` at sign-in.

### Migration and bootstrap

1. Run Supabase migrations (including `supabase/migrations/20260314_create_user_roles.sql`).
2. Sign in with Google at least once for each user you want to manage.
3. Promote the first admin manually in SQL:

```sql
insert into public.user_roles (user_id, role)
values ('<auth-user-uuid>', 'admin')
on conflict (user_id)
do update set role = excluded.role;
```

After that, admins can manage access in the app at `/admin/access`.
