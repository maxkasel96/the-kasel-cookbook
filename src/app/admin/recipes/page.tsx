import Link from "next/link";

import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  PageShell,
  Panel,
} from "@/components/ui/primitives";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import DeleteRecipeButton from "./delete-recipe-button";

export const dynamic = "force-dynamic";

const formatDate = (value: string | null) => {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

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
    <PageShell variant="wide">
      <PageHeader
        title="Recipes"
        actions={
          <Button as={Link} href="/admin/recipes/create" variant="primary">
            Create recipe
          </Button>
        }
      />

      {recipes?.length ? (
        <Panel className="admin-recipe-list">
          <ul>
            {recipes.map((recipe) => {
              const status = recipe.status ?? "draft";
              const isPublished = status === "published";

              return (
                <li className="admin-recipe-row" key={recipe.id}>
                  <div className="admin-recipe-row__main">
                    <Badge variant={isPublished ? "success" : "warning"}>
                      {status}
                    </Badge>
                    <div className="min-w-0">
                      <h2>{recipe.title}</h2>
                      <p>Created {formatDate(recipe.created_at)}</p>
                    </div>
                  </div>
                  <div className="admin-recipe-row__actions">
                    {isPublished ? (
                      <Button
                        as={Link}
                        href={`/recipes/${recipe.slug}`}
                        size="sm"
                        variant="ghost"
                      >
                        View
                      </Button>
                    ) : null}
                    <Button
                      as={Link}
                      href={`/recipes/${recipe.slug}/edit`}
                      size="sm"
                    >
                      Edit
                    </Button>
                    <DeleteRecipeButton
                      recipeId={String(recipe.id)}
                      recipeTitle={recipe.title}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : (
        <EmptyState title="No recipes yet">
          <p>Create your first recipe to start building the archive.</p>
        </EmptyState>
      )}
    </PageShell>
  );
}
