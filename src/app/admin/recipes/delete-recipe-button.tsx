"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteRecipeButtonProps = {
  recipeId: string;
  recipeTitle: string;
};

export default function DeleteRecipeButton({
  recipeId,
  recipeTitle,
}: DeleteRecipeButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRecipe = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to delete recipe.");
      }

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete recipe."
      );
      setIsDeleting(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="max-w-xs text-right text-sm text-text-muted">
          Permanently delete “{recipeTitle}”?
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            className="ui-button ui-button--ghost ui-button--sm disabled:opacity-60"
            type="button"
            disabled={isDeleting}
            onClick={() => {
              setIsConfirming(false);
              setError(null);
            }}
          >
            Cancel
          </button>
          <button
            className="ui-button ui-button--danger ui-button--sm disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isDeleting}
            onClick={deleteRecipe}
          >
            {isDeleting ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
        {error ? (
          <p className="max-w-xs text-right text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      className="ui-button ui-button--danger ui-button--sm"
      type="button"
      onClick={() => setIsConfirming(true)}
    >
      Delete
    </button>
  );
}
