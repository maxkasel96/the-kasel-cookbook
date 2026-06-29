"use client";

import { useRouter } from "next/navigation";

import RecipeImportPanel from "@/components/recipe-import-panel";
import { PageHeader, PageShell } from "@/components/ui/primitives";
import {
  RECIPE_IMPORT_DRAFT_STORAGE_KEY,
  type ImportedRecipeDraft,
} from "@/lib/recipe-import";

export default function RecipeInputClient() {
  const router = useRouter();

  const handleUseDraft = (draft: ImportedRecipeDraft) => {
    window.localStorage.setItem(
      RECIPE_IMPORT_DRAFT_STORAGE_KEY,
      JSON.stringify(draft)
    );
    router.push("/admin/recipes/create");
  };

  return (
    <PageShell variant="default">
      <PageHeader title="Import a recipe" />
      <RecipeImportPanel
        onUseDraft={handleUseDraft}
        useDraftButtonLabel="Use in Create Recipe"
        secondaryLinkHref="/admin/recipes/create"
        secondaryLinkLabel="Go to Create Recipe"
      />
    </PageShell>
  );
}
