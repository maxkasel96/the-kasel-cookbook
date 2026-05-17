"use client";

import { useEffect, useMemo, useState } from "react";

import RecipeEditorForm from "@/components/recipe-editor-form";
import RecipeImportPanel from "@/components/recipe-import-panel";
import RecipeJsonImport from "@/components/recipe-json-import";
import { trackAdminRecipeCreated } from "@/lib/analytics/track";
import {
  RECIPE_IMPORT_DRAFT_STORAGE_KEY,
  type ImportedRecipeDraft,
} from "@/lib/recipe-import";

type Ingredient = {
  id: string;
  ingredientText: string;
  quantity: string;
  unit: string;
  note: string;
  isOptional: boolean;
  assignedStepIds: string[];
};

type InstructionStep = {
  id: string;
  content: string;
};

type TagOption = {
  id: string;
  name: string;
  category?: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
};

type RecipeStartMode = "copy" | "custom" | "json" | null;

const createId = () => 
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `temp-${Date.now()}-${Math.random()}`;

const createEmptyIngredient = (): Ingredient => ({
  id: createId(),
  ingredientText: "",
  quantity: "",
  unit: "",
  note: "",
  isOptional: false,
  assignedStepIds: [],
});

const createEmptyStep = (): InstructionStep => ({
  id: createId(),
  content: "",
});

export default function AdminCreateRecipePage() {
  const [startMode, setStartMode] = useState<RecipeStartMode>(null);
  const [title, setTitle] = useState("");
  const [metadata, setMetadata] = useState({
    prepMinutes: "",
    cookMinutes: "",
    servings: "",
  });
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    createEmptyIngredient(),
  ]);
  const [steps, setSteps] = useState<InstructionStep[]>([createEmptyStep()]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [tagSelectValue, setTagSelectValue] = useState("");
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>(
    []
  );
  const [selectedCategories, setSelectedCategories] = useState<CategoryOption[]>(
    []
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categorySelectValue, setCategorySelectValue] = useState("");

  const applyImportedDraft = (
    importedDraft: ImportedRecipeDraft,
    statusMessage = "Imported recipe draft loaded. Review and save when ready."
  ) => {
    const importedTitle = importedDraft.title.trim();
    const importedSteps = importedDraft.steps
      .map((step) => ({
        id: createId(),
        content: step.trim(),
      }))
      .filter((step) => step.content);
    const importedIngredients = importedDraft.ingredients
      .map((ingredient, ingredientIndex) => ({
        id: createId(),
        ingredientText: ingredient.text?.trim() ?? "",
        quantity: ingredient.quantity?.trim() ?? "",
        unit: ingredient.unit?.trim() ?? "",
        note: ingredient.note?.trim() ?? "",
        isOptional: ingredient.optional ?? false,
        assignedStepIds: importedSteps
          .filter((step, stepIndex) =>
            importedDraft.stepIngredientIndexes?.[stepIndex]?.includes(
              ingredientIndex + 1
            )
          )
          .map((step) => step.id),
      }))
      .filter(
        (ingredient) =>
          ingredient.ingredientText ||
          ingredient.quantity ||
          ingredient.unit ||
          ingredient.note
      );

    if (importedTitle) {
      setTitle(importedTitle);
    }

    setMetadata({
      prepMinutes: importedDraft.prepMinutes?.trim() ?? "",
      cookMinutes: importedDraft.cookMinutes?.trim() ?? "",
      servings: importedDraft.servings?.trim() ?? "",
    });
    setDescription(importedDraft.description?.trim() ?? "");
    setSelectedTags([]);
    setSelectedCategories([]);

    setIngredients(
      importedIngredients.length > 0 ? importedIngredients : [createEmptyIngredient()]
    );
    setSteps(importedSteps.length > 0 ? importedSteps : [createEmptyStep()]);

    setFormError(null);
    setFormStatus(statusMessage);
    setStartMode("custom");
  };

  useEffect(() => {
    let isMounted = true;

    const fetchTags = async () => {
      setIsLoadingTags(true);

      try {
        const response = await fetch("/api/admin/tags");
        if (!response.ok) {
          throw new Error("Unable to load tags.");
        }
        const payload = (await response.json()) as { tags?: TagOption[] };
        if (isMounted) {
          setAvailableTags(payload.tags ?? []);
        }
      } catch {
        if (isMounted) {
          setAvailableTags([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingTags(false);
        }
      }
    };

    fetchTags();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const rawDraft = window.localStorage.getItem(RECIPE_IMPORT_DRAFT_STORAGE_KEY);
    if (!rawDraft) return;

    try {
      const importedDraft = JSON.parse(rawDraft) as ImportedRecipeDraft;
      applyImportedDraft(
        importedDraft,
        "Imported recipe draft loaded from Recipe Input."
      );
      window.localStorage.removeItem(RECIPE_IMPORT_DRAFT_STORAGE_KEY);
    } catch {
      setFormError("Unable to read imported recipe draft.");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setIsLoadingCategories(true);

      try {
        const response = await fetch("/api/admin/categories");
        if (!response.ok) {
          throw new Error("Unable to load categories.");
        }
        const payload = (await response.json()) as {
          categories?: CategoryOption[];
        };
        if (isMounted) {
          setAvailableCategories(payload.categories ?? []);
        }
      } catch {
        if (isMounted) {
          setAvailableCategories([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizeTag = (name: string) => name.trim().toLowerCase();

  const filteredTags = useMemo(() => {
    const normalizedSearch = normalizeTag(tagSearchTerm);
    if (!normalizedSearch) return availableTags;
    return availableTags.filter((tag) =>
      normalizeTag(tag.name).includes(normalizedSearch)
    );
  }, [availableTags, tagSearchTerm]);

  const handleSelectTag = (value: string) => {
    if (!value) return;
    const match = availableTags.find((tag) => tag.id === value);
    if (!match) return;
    setSelectedTags((prev) => {
      const isSelected = prev.some(
        (selected) => normalizeTag(selected.name) === normalizeTag(match.name)
      );
      return isSelected ? prev : [...prev, match];
    });
    setTagSelectValue("");
  };

  const addNewTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    const existing = availableTags.find(
      (tag) => normalizeTag(tag.name) === normalizeTag(trimmed)
    );

    const tagToAdd =
      existing ?? {
        id: `new-${createId()}`,
        name: trimmed,
      };

    setAvailableTags((prev) =>
      existing ? prev : [...prev, tagToAdd]
    );
    setSelectedTags((prev) => {
      const isSelected = prev.some(
        (tag) => normalizeTag(tag.name) === normalizeTag(tagToAdd.name)
      );
      return isSelected ? prev : [...prev, tagToAdd];
    });
    setNewTagName("");
  };

  const removeSelectedTag = (tagToRemove: TagOption) => {
    setSelectedTags((prev) =>
      prev.filter(
        (tag) => normalizeTag(tag.name) !== normalizeTag(tagToRemove.name)
      )
    );
  };

  const normalizeCategory = (name: string) => name.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    const normalizedSearch = normalizeCategory(categorySearchTerm);
    if (!normalizedSearch) return availableCategories;
    return availableCategories.filter((category) =>
      normalizeCategory(category.name).includes(normalizedSearch)
    );
  }, [availableCategories, categorySearchTerm]);

  const handleSelectCategory = (value: string) => {
    if (!value) return;
    const match = availableCategories.find((category) => category.id === value);
    if (!match) return;
    setSelectedCategories((prev) => {
      const isSelected = prev.some(
        (selected) =>
          normalizeCategory(selected.name) ===
          normalizeCategory(match.name)
      );
      return isSelected ? prev : [...prev, match];
    });
    setCategorySelectValue("");
  };

  const addNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const existing = availableCategories.find(
      (category) =>
        normalizeCategory(category.name) === normalizeCategory(trimmed)
    );

    const categoryToAdd =
      existing ?? {
        id: `new-${createId()}`,
        name: trimmed,
      };

    setAvailableCategories((prev) =>
      existing ? prev : [...prev, categoryToAdd]
    );
    setSelectedCategories((prev) => {
      const isSelected = prev.some(
        (category) =>
          normalizeCategory(category.name) ===
          normalizeCategory(categoryToAdd.name)
      );
      return isSelected ? prev : [...prev, categoryToAdd];
    });
    setNewCategoryName("");
  };

  const removeSelectedCategory = (categoryToRemove: CategoryOption) => {
    setSelectedCategories((prev) =>
      prev.filter(
        (category) =>
          normalizeCategory(category.name) !==
          normalizeCategory(categoryToRemove.name)
      )
    );
  };

  const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleIngredientChange = (
    id: string,
    field: keyof Ingredient,
    value: string | boolean
  ) => {
    setIngredients((prev) =>
      prev.map((ingredient) =>
        ingredient.id === id
          ? { ...ingredient, [field]: value }
          : ingredient
      )
    );
  };

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: createId(),
        ingredientText: "",
        quantity: "",
        unit: "",
        note: "",
        isOptional: false,
        assignedStepIds: [],
      },
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) =>
      prev.length > 1 ? prev.filter((ingredient) => ingredient.id !== id) : prev
    );
  };

  const handleStepChange = (id: string, value: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, content: value } : step))
    );
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { id: createId(), content: "" }]);
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((step) => step.id !== id));
    setIngredients((prev) =>
      prev.map((ingredient) => ({
        ...ingredient,
        assignedStepIds: ingredient.assignedStepIds.filter(
          (stepId) => stepId !== id
        ),
      }))
    );
  };

  const toggleIngredientStep = (ingredientId: string, stepId: string) => {
    setIngredients((prev) =>
      prev.map((ingredient) => {
        if (ingredient.id !== ingredientId) return ingredient;
        const isAssigned = ingredient.assignedStepIds.includes(stepId);
        return {
          ...ingredient,
          assignedStepIds: isAssigned
            ? ingredient.assignedStepIds.filter((id) => id !== stepId)
            : [...ingredient.assignedStepIds, stepId],
        };
      })
    );
  };

  const handleSave = async (status: "draft" | "published") => {
    setFormError(null);
    setFormStatus(null);

    if (!title.trim()) {
      setFormError("Add a recipe title before saving.");
      return;
    }

    const ingredientEntries = ingredients
      .map((ingredient) => ({
        id: ingredient.id,
        ingredientText: ingredient.ingredientText.trim(),
        quantity: ingredient.quantity.trim(),
        unit: ingredient.unit.trim(),
        note: ingredient.note.trim(),
        isOptional: ingredient.isOptional,
        assignedStepIds: ingredient.assignedStepIds,
      }))
      .filter(
        (ingredient) =>
          ingredient.ingredientText ||
          ingredient.quantity ||
          ingredient.unit ||
          ingredient.note
      );

    const ingredientPositionMap = new Map(
      ingredientEntries.map((ingredient, index) => [ingredient.id, index + 1])
    );

    const stepEntries = steps
      .map((step) => ({
        content: step.content.trim(),
        ingredientPositions: ingredientEntries
          .filter((ingredient) => ingredient.assignedStepIds.includes(step.id))
          .map((ingredient) => ingredientPositionMap.get(ingredient.id))
          .filter((position): position is number => typeof position === "number"),
      }))
      .filter((step) => step.content);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      prepMinutes: parseOptionalNumber(metadata.prepMinutes),
      cookMinutes: parseOptionalNumber(metadata.cookMinutes),
      servings: parseOptionalNumber(metadata.servings),
      status,
      tags: selectedTags.map((tag) => tag.name),
      categories: selectedCategories.map((category) => category.name),
      ingredients: ingredientEntries.map(
        ({
          ingredientText,
          quantity,
          unit,
          note,
          isOptional,
        }) => ({
          ingredientText,
          quantity,
          unit,
          note,
          isOptional,
        })
      ),
      steps: stepEntries,
    };

    if (payload.ingredients.length === 0) {
      setFormError("Add at least one ingredient before saving.");
      return;
    }

    if (payload.steps.length === 0) {
      setFormError("Add at least one preparation step before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? "Unable to save recipe.");
      }

      const responsePayload = (await response.json()) as {
        id?: string | number;
        slug?: string;
      };

      trackAdminRecipeCreated({
        ...(responsePayload.id ? { recipe_id: String(responsePayload.id) } : {}),
        ...(responsePayload.slug ? { recipe_slug: responsePayload.slug } : {}),
        recipe_title: payload.title,
        publish_status: status,
      });

      setFormStatus(
        status === "published"
          ? "Recipe saved and published."
          : "Draft saved successfully."
      );
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to save recipe."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-[88rem] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:gap-8 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-3">
          <p className="recipe-editor-page-kicker">
            Admin
          </p>
          <h1 className="recipe-editor-page-title">Create recipe</h1>
          <p className="recipe-editor-page-intro">
            Capture recipe descriptions, ingredient quantities, and preparation
            instructions before saving them to the database. You must be signed
            in with Google to access this page.
          </p>
        </header>

        <section className="recipe-start-selector">
          <button
            className={`recipe-start-option ${
              startMode === "copy"
                ? "recipe-start-option--active"
                : ""
            }`}
            type="button"
            onClick={() => {
              setFormError(null);
              setStartMode("copy");
            }}
          >
            <span className="recipe-start-option__indicator" aria-hidden="true" />
            <div className="recipe-start-option__body">
              <p className="recipe-start-option__eyebrow">Entry method</p>
              <h2 className="recipe-start-option__title">Copy from URL</h2>
              <p className="recipe-start-option__description">
                Paste a recipe page link and let OpenAI prefill ingredients,
                preparation steps, and ingredient matches for review.
              </p>
            </div>
          </button>

          <button
            className={`recipe-start-option ${
              startMode === "custom"
                ? "recipe-start-option--active"
                : ""
            }`}
            type="button"
            onClick={() => {
              setFormError(null);
              setFormStatus(null);
              setStartMode("custom");
            }}
          >
            <span className="recipe-start-option__indicator" aria-hidden="true" />
            <div className="recipe-start-option__body">
              <p className="recipe-start-option__eyebrow">Entry method</p>
              <h2 className="recipe-start-option__title">Custom recipe</h2>
              <p className="recipe-start-option__description">
                Start from a blank form and write the recipe manually.
              </p>
            </div>
          </button>

          <button
            className={`recipe-start-option ${
              startMode === "json" ? "recipe-start-option--active" : ""
            }`}
            type="button"
            onClick={() => {
              setFormError(null);
              setFormStatus(null);
              setStartMode("json");
            }}
          >
            <span className="recipe-start-option__indicator" aria-hidden="true" />
            <div className="recipe-start-option__body">
              <p className="recipe-start-option__eyebrow">Entry method</p>
              <h2 className="recipe-start-option__title">Paste JSON</h2>
              <p className="recipe-start-option__description">
                Paste structured recipe JSON (from ChatGPT or other tools) to
                prefill a draft that you can review and save.
              </p>
            </div>
          </button>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
          <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
            {startMode === null ? (
              <section className="recipe-editor-empty-state">
                Choose how you want to start this recipe. Import from a URL or
                jump straight into a custom draft.
              </section>
            ) : null}

            {startMode === "copy" ? (
              <RecipeImportPanel
                onUseDraft={(draft) => applyImportedDraft(draft)}
                useDraftButtonLabel="Use in Create Recipe"
                title="Copy Recipe from URL"
                description="Paste a recipe URL to generate a draft that will open directly in the Create Recipe form."
                headerActions={
                  <button
                    className="recipe-editor-inline-action"
                    type="button"
                    onClick={() => setStartMode("custom")}
                  >
                    Custom recipe
                  </button>
                }
              />
            ) : null}

              {startMode === "json" ? (
                <RecipeJsonImport
                  onUseDraft={(draft) => applyImportedDraft(draft)}
                  useDraftButtonLabel="Use in Create Recipe"
                  title="Paste Recipe JSON"
                  description="Paste structured recipe JSON (from ChatGPT) to generate a draft that opens in the Create Recipe form."
                  headerActions={
                    <button
                      className="recipe-editor-inline-action"
                      type="button"
                      onClick={() => setStartMode("custom")}
                    >
                      Custom recipe
                    </button>
                  }
                />
              ) : null}

            {startMode === "custom" ? (
              <RecipeEditorForm
                availableCategories={availableCategories}
                availableTags={availableTags}
                categorySearchTerm={categorySearchTerm}
                categorySelectValue={categorySelectValue}
                cookMinutes={metadata.cookMinutes}
                description={description}
                detailsHint={
                  <>
                    Slugs are generated automatically from the recipe title
                    when you save.
                  </>
                }
                filteredCategories={filteredCategories}
                filteredTags={filteredTags}
                formError={formError}
                formStatus={formStatus}
                ingredients={ingredients}
                isLoadingCategories={isLoadingCategories}
                isLoadingTags={isLoadingTags}
                isSaving={isSaving}
                newCategoryName={newCategoryName}
                newTagName={newTagName}
                onAddIngredient={addIngredient}
                onAddNewCategory={addNewCategory}
                onAddNewTag={addNewTag}
                onAddStep={addStep}
                onCategorySearchTermChange={setCategorySearchTerm}
                onCategorySelectValueChange={setCategorySelectValue}
                onCookMinutesChange={(value) =>
                  setMetadata((prev) => ({ ...prev, cookMinutes: value }))
                }
                onDescriptionChange={setDescription}
                onHandleIngredientChange={handleIngredientChange}
                onHandleStepChange={handleStepChange}
                onNewCategoryNameChange={setNewCategoryName}
                onNewTagNameChange={setNewTagName}
                onPrepMinutesChange={(value) =>
                  setMetadata((prev) => ({ ...prev, prepMinutes: value }))
                }
                onPrimaryAction={() => handleSave("published")}
                onRemoveIngredient={removeIngredient}
                onRemoveSelectedCategory={removeSelectedCategory}
                onRemoveSelectedTag={removeSelectedTag}
                onRemoveStep={removeStep}
                onSelectCategory={handleSelectCategory}
                onSelectTag={handleSelectTag}
                onServingsChange={(value) =>
                  setMetadata((prev) => ({ ...prev, servings: value }))
                }
                tagSearchTerm={tagSearchTerm}
                tagSelectValue={tagSelectValue}
                onTagSearchTermChange={setTagSearchTerm}
                onTagSelectValueChange={setTagSelectValue}
                onTitleChange={setTitle}
                onToggleIngredientStep={toggleIngredientStep}
                prepMinutes={metadata.prepMinutes}
                primaryActionLabel="Save recipe"
                primaryActionPendingLabel="Saving..."
                selectedCategories={selectedCategories}
                selectedTags={selectedTags}
                servings={metadata.servings}
                steps={steps}
                title={title}
              />
            ) : null}
          </div>

          <aside className="hidden xl:block">
            <div className="recipe-editor-side-note">
              <p className="recipe-editor-side-note__eyebrow">Desktop flow</p>
              <p className="recipe-editor-side-note__copy">
                The custom recipe form opens with a sticky save rail and a
                lighter structured editor. Switch to “Custom recipe” to work in
                the full two-column layout.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

