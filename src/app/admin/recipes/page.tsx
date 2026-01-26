import Link from "next/link";

export default function AdminRecipesPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-2">
              Admin
            </p>
            <h1 className="text-3xl font-semibold">Recipes</h1>
          </div>
          <Link
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-danger"
            href="/admin/recipes/create"
          >
            Create recipe
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-8 text-text-muted">
          <p>Placeholder page. Wire up the table later.</p>
        </div>
      </div>
    </main>
  );
}
