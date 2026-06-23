import Link from "next/link";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import DeleteRecipeButton from "./delete-recipe-button";

export const dynamic = "force-dynamic";

export default async function AdminRecipesPage() {
  const supabase = createSupabaseAdminClient();
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, title, slug, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-2">
              Admin
            </p>
            <h1 className="text-3xl font-semibold">Recipes</h1>
          </div>
          <Link
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            href="/admin/recipes/create"
          >
            Create recipe
          </Link>
        </div>
        {recipes?.length ? (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <ul className="divide-y divide-border">
              {recipes.map((recipe) => (
                <li
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  key={recipe.id}
                >
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">
                      {recipe.title}
                    </h2>
                    <p className="text-sm capitalize text-text-muted">
                      {recipe.status ?? "draft"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {recipe.status === "published" ? (
                      <Link
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-surface-muted"
                        href={`/recipes/${recipe.slug}`}
                      >
                        View
                      </Link>
                    ) : null}
                    <Link
                      className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-surface-muted"
                      href={`/recipes/${recipe.slug}/edit`}
                    >
                      Edit
                    </Link>
                    <DeleteRecipeButton
                      recipeId={String(recipe.id)}
                      recipeTitle={recipe.title}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-surface p-8 text-text-muted">
            <p>No recipes yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
