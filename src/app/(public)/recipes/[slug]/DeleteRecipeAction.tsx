"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/primitives";

type DeleteRecipeActionProps = {
  recipeId: string;
  recipeTitle: string;
};

export default function DeleteRecipeAction({
  recipeId,
  recipeTitle,
}: DeleteRecipeActionProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openConfirmation = () => {
    setError(null);
    dialogRef.current?.showModal();
  };

  const closeConfirmation = () => {
    if (!isDeleting) {
      dialogRef.current?.close();
    }
  };

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

      dialogRef.current?.close();
      router.replace("/recipes");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete recipe."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="recipe-delete-action">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="recipe-delete-action__trigger"
        onClick={openConfirmation}
      >
        <Trash2 aria-hidden="true" />
        Delete recipe
      </Button>

      <dialog
        ref={dialogRef}
        className="recipe-delete-dialog"
        aria-labelledby="delete-recipe-title"
        aria-describedby="delete-recipe-description"
        onCancel={(event) => {
          if (isDeleting) {
            event.preventDefault();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeConfirmation();
          }
        }}
      >
        <div className="recipe-delete-dialog__content" aria-busy={isDeleting}>
          <div className="recipe-delete-dialog__icon" aria-hidden="true">
            <Trash2 />
          </div>
          <div>
            <h2 id="delete-recipe-title">Delete this recipe?</h2>
            <p id="delete-recipe-description">
              “{recipeTitle}” will be permanently removed from the cookbook,
              meals, and favorites. This cannot be undone.
            </p>
          </div>

          {error ? (
            <p className="recipe-delete-dialog__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="recipe-delete-dialog__actions">
            <Button
              type="button"
              variant="ghost"
              disabled={isDeleting}
              onClick={closeConfirmation}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isDeleting}
              onClick={deleteRecipe}
            >
              {isDeleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
