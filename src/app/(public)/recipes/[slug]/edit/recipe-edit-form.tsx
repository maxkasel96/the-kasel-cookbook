"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import RecipeEditorForm from "@/components/recipe-editor-form";
import { trackAdminRecipeUpdated } from "@/lib/analytics/track";

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

type RecipeEditFormProps = {
  recipe: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    prepMinutes: number | null;
    cookMinutes: number | null;
    servings: number | null;
    ingredients: Ingredient[];
    steps: InstructionStep[];
    tags: TagOption[];
    categories: CategoryOption[];
  };
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `temp-${Date.now()}-${Math.random()}`;

const ensureIngredient = (ingredients: Ingredient[]) =>
  ingredients.length
    ? ingredients.map((ingredient) => ({
        ...ingredient,
        assignedStepIds: ingredient.assignedStepIds ?? [],
      }))
    : [
        {
          id: createId(),
          ingredientText: "",
          quantity: "",
          unit: "",
          note: "",
          isOptional: false,
          assignedStepIds: [],
        },
      ];

const ensureSteps = (steps: InstructionStep[]) =>
  steps.length ? steps : [{ id: createId(), content: "" }];

export default function RecipeEditForm({ recipe }: RecipeEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(recipe.title ?? "");
  const [prepMinutes, setPrepMinutes] = useState(
    recipe.prepMinutes ? String(recipe.prepMinutes) : ""
  );
  const [cookMinutes, setCookMinutes] = useState(
    recipe.cookMinutes ? String(recipe.cookMinutes) : ""
  );
  const [servings, setServings] = useState(
    recipe.servings ? String(recipe.servings) : ""
  );
  const [description, setDescription] = useState(recipe.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState(recipe.slug);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    ensureIngredient(recipe.ingredients)
  );
  const [steps, setSteps] = useState<InstructionStep[]>(
    ensureSteps(recipe.steps)
  );
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(
    recipe.tags ?? []
  );
  const [newTagName, setNewTagName] = useState("");
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [tagSelectValue, setTagSelectValue] = useState("");
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<CategoryOption[]>(
    recipe.categories ?? []
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categorySelectValue, setCategorySelectValue] = useState("");

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
          const fetched = payload.tags ?? [];
          setAvailableTags(
            fetched.concat(
              recipe.tags.filter(
                (tag) =>
                  !fetched.some(
                    (item) =>
                      item.name.trim().toLowerCase() ===
                      tag.name.trim().toLowerCase()
                  )
              )
            )
          );
        }
      } catch {
        if (isMounted) {
          setAvailableTags(recipe.tags);
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
  }, [recipe.tags]);

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
          const fetched = payload.categories ?? [];
          setAvailableCategories(
            fetched.concat(
              recipe.categories.filter(
                (category) =>
                  !fetched.some(
                    (item) =>
                      item.name.trim().toLowerCase() ===
                      category.name.trim().toLowerCase()
                  )
              )
            )
          );
        }
      } catch {
        if (isMounted) {
          setAvailableCategories(recipe.categories);
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
  }, [recipe.categories]);

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

    setAvailableTags((prev) => (existing ? prev : [...prev, tagToAdd]));
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
      prepMinutes: parseOptionalNumber(prepMinutes),
      cookMinutes: parseOptionalNumber(cookMinutes),
      servings: parseOptionalNumber(servings),
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
      const response = await fetch(`/api/admin/recipes/${recipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? "Unable to update recipe.");
      }

      const responsePayload = (await response.json()) as { slug?: string };
      const nextSlug = responsePayload.slug ?? currentSlug;

      trackAdminRecipeUpdated({
        recipe_id: recipe.id,
        recipe_title: payload.title,
        recipe_slug: nextSlug,
        publish_status: status,
      });

      setFormStatus(
        status === "published"
          ? "Recipe updated and published."
          : "Draft updated successfully."
      );

      if (nextSlug !== currentSlug) {
        setCurrentSlug(nextSlug);
        router.replace(`/recipes/${nextSlug}/edit`);
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to update recipe."
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
            Saved recipe
          </p>
          <h1 className="recipe-editor-page-title">Edit recipe</h1>
          <p className="recipe-editor-page-intro">
            Update the recipe details, ingredients, and preparation steps. Changes
            will immediately refresh the saved recipe entry.
          </p>
        </header>

        <RecipeEditorForm
          availableCategories={availableCategories}
          availableTags={availableTags}
          categorySearchTerm={categorySearchTerm}
          categorySelectValue={categorySelectValue}
          cookMinutes={cookMinutes}
          description={description}
          detailsHint={
            <>
              Slugs are generated automatically from the recipe title when you
              save.
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
          onCookMinutesChange={setCookMinutes}
          onDescriptionChange={setDescription}
          onHandleIngredientChange={handleIngredientChange}
          onHandleStepChange={handleStepChange}
          onNewCategoryNameChange={setNewCategoryName}
          onNewTagNameChange={setNewTagName}
          onPrepMinutesChange={setPrepMinutes}
          onPrimaryAction={() => handleSave("published")}
          onRemoveIngredient={removeIngredient}
          onRemoveSelectedCategory={removeSelectedCategory}
          onRemoveSelectedTag={removeSelectedTag}
          onRemoveStep={removeStep}
          onSelectCategory={handleSelectCategory}
          onSelectTag={handleSelectTag}
          onServingsChange={setServings}
          tagSearchTerm={tagSearchTerm}
          tagSelectValue={tagSelectValue}
          onTagSearchTermChange={setTagSearchTerm}
          onTagSelectValueChange={setTagSelectValue}
          onTitleChange={setTitle}
          onToggleIngredientStep={toggleIngredientStep}
          prepMinutes={prepMinutes}
          primaryActionLabel="Update recipe"
          primaryActionPendingLabel="Saving..."
          selectedCategories={selectedCategories}
          selectedTags={selectedTags}
          servings={servings}
          steps={steps}
          tertiaryAction={{
            href: `/recipes/${currentSlug}`,
            label: "View recipe",
          }}
          title={title}
        />
      </main>
    </div>
  );
}
