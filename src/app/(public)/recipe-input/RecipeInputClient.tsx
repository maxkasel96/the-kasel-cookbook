"use client";

import { useRouter } from "next/navigation";

import RecipeImportPanel from "@/components/recipe-import-panel";
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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <RecipeImportPanel
        onUseDraft={handleUseDraft}
        useDraftButtonLabel="Use in Create Recipe"
        secondaryLinkHref="/admin/recipes/create"
        secondaryLinkLabel="Go to Create Recipe"
      />
    </main>
  );
}
