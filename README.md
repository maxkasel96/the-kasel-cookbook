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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
