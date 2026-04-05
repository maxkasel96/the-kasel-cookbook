"use client";

import { useState, type ReactNode } from "react";

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

type LinkAction = {
  href: string;
  label: string;
};

type RecipeEditorFormProps = {
  detailsHint?: ReactNode;
  formError: string | null;
  formStatus: string | null;
  isLoadingCategories: boolean;
  isLoadingTags: boolean;
  isSaving: boolean;
  availableCategories: CategoryOption[];
  availableTags: TagOption[];
  categorySearchTerm: string;
  categorySelectValue: string;
  cookMinutes: string;
  description: string;
  filteredCategories: CategoryOption[];
  filteredTags: TagOption[];
  ingredients: Ingredient[];
  newCategoryName: string;
  newTagName: string;
  onAddIngredient: () => void;
  onAddNewCategory: () => void;
  onAddNewTag: () => void;
  onAddStep: () => void;
  onCategorySearchTermChange: (value: string) => void;
  onCategorySelectValueChange: (value: string) => void;
  onCookMinutesChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onHandleIngredientChange: (
    id: string,
    field: keyof Ingredient,
    value: string | boolean
  ) => void;
  onHandleStepChange: (id: string, value: string) => void;
  onNewCategoryNameChange: (value: string) => void;
  onNewTagNameChange: (value: string) => void;
  onPrepMinutesChange: (value: string) => void;
  onPrimaryAction: () => void;
  onRemoveIngredient: (id: string) => void;
  onRemoveSelectedCategory: (category: CategoryOption) => void;
  onRemoveSelectedTag: (tag: TagOption) => void;
  onRemoveStep: (id: string) => void;
  onSelectCategory: (value: string) => void;
  onSelectTag: (value: string) => void;
  onServingsChange: (value: string) => void;
  tagSearchTerm: string;
  tagSelectValue: string;
  onTagSearchTermChange: (value: string) => void;
  onTagSelectValueChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onToggleIngredientStep: (ingredientId: string, stepId: string) => void;
  prepMinutes: string;
  primaryActionLabel: string;
  primaryActionPendingLabel: string;
  selectedCategories: CategoryOption[];
  selectedTags: TagOption[];
  servings: string;
  steps: InstructionStep[];
  tertiaryAction?: LinkAction;
  title: string;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const getNonEmptyIngredientCount = (ingredients: Ingredient[]) =>
  ingredients.filter((ingredient) => ingredient.ingredientText.trim()).length;

const getNonEmptyStepCount = (steps: InstructionStep[]) =>
  steps.filter((step) => step.content.trim()).length;

const getStepPreview = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) return "Tap to add instructions for this step.";
  return trimmed.length > 96 ? `${trimmed.slice(0, 96).trimEnd()}...` : trimmed;
};

function TaxonomyColumn({
  addButtonLabel,
  emptyFilteredLabel,
  emptyLabel,
  inputPlaceholder,
  isLoading,
  newItemName,
  onAddItem,
  onNewItemNameChange,
  onRemoveItem,
  onSearchTermChange,
  onSelectItem,
  onSelectValueChange,
  searchPlaceholder,
  searchTerm,
  selectPlaceholder,
  selectValue,
  selectedItems,
  title,
  availableItems,
  filteredItems,
}: {
  addButtonLabel: string;
  emptyFilteredLabel: string;
  emptyLabel: string;
  inputPlaceholder: string;
  isLoading: boolean;
  newItemName: string;
  onAddItem: () => void;
  onNewItemNameChange: (value: string) => void;
  onRemoveItem: (item: { id: string; name: string }) => void;
  onSearchTermChange: (value: string) => void;
  onSelectItem: (value: string) => void;
  onSelectValueChange: (value: string) => void;
  searchPlaceholder: string;
  searchTerm: string;
  selectPlaceholder: string;
  selectValue: string;
  selectedItems: Array<{ id: string; name: string }>;
  title: string;
  availableItems: Array<{ id: string; name: string }>;
  filteredItems: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="recipe-editor-subsection">
      <div className="recipe-editor-subsection__header">
        <div>
          <h3 className="recipe-editor-subsection__title">{title}</h3>
          <p className="recipe-editor-subsection__meta">
            {selectedItems.length} selected
          </p>
        </div>
      </div>

      <div className="recipe-editor-taxonomy-controls">
        <input
          className="recipe-editor-input"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />

        {isLoading ? (
          <p className="recipe-editor-helper">Loading {title.toLowerCase()}...</p>
        ) : availableItems.length ? (
          filteredItems.length ? (
            <select
              className="recipe-editor-select"
              value={selectValue}
              onChange={(event) => {
                const value = event.target.value;
                onSelectValueChange(value);
                onSelectItem(value);
              }}
            >
              <option value="">{selectPlaceholder}</option>
              {filteredItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="recipe-editor-helper">{emptyFilteredLabel}</p>
          )
        ) : (
          <p className="recipe-editor-helper">{emptyLabel}</p>
        )}

        <div className="recipe-editor-inline-field">
          <input
            className="recipe-editor-input"
            placeholder={inputPlaceholder}
            value={newItemName}
            onChange={(event) => onNewItemNameChange(event.target.value)}
          />
          <button
            className="recipe-editor-inline-action"
            type="button"
            onClick={onAddItem}
          >
            {addButtonLabel}
          </button>
        </div>
      </div>

      {selectedItems.length ? (
        <div className="recipe-editor-chip-set">
          {selectedItems.map((item) => (
            <button
              key={item.id}
              className="recipe-editor-chip"
              type="button"
              onClick={() => onRemoveItem(item)}
            >
              <span>{item.name}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="recipe-editor-helper">No {title.toLowerCase()} selected yet.</p>
      )}
    </div>
  );
}

export default function RecipeEditorForm({
  detailsHint,
  formError,
  formStatus,
  isLoadingCategories,
  isLoadingTags,
  isSaving,
  availableCategories,
  availableTags,
  categorySearchTerm,
  categorySelectValue,
  cookMinutes,
  description,
  filteredCategories,
  filteredTags,
  ingredients,
  newCategoryName,
  newTagName,
  onAddIngredient,
  onAddNewCategory,
  onAddNewTag,
  onAddStep,
  onCategorySearchTermChange,
  onCategorySelectValueChange,
  onCookMinutesChange,
  onDescriptionChange,
  onHandleIngredientChange,
  onHandleStepChange,
  onNewCategoryNameChange,
  onNewTagNameChange,
  onPrepMinutesChange,
  onPrimaryAction,
  onRemoveIngredient,
  onRemoveSelectedCategory,
  onRemoveSelectedTag,
  onRemoveStep,
  onSelectCategory,
  onSelectTag,
  onServingsChange,
  tagSearchTerm,
  tagSelectValue,
  onTagSearchTermChange,
  onTagSelectValueChange,
  onTitleChange,
  onToggleIngredientStep,
  prepMinutes,
  primaryActionLabel,
  primaryActionPendingLabel,
  selectedCategories,
  selectedTags,
  servings,
  steps,
  tertiaryAction,
  title,
}: RecipeEditorFormProps) {
  const ingredientCount = getNonEmptyIngredientCount(ingredients);
  const stepCount = getNonEmptyStepCount(steps);
  const [mobileTaxonomyOpen, setMobileTaxonomyOpen] = useState(false);
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
  const [activeStepIdState, setActiveStepId] = useState<string | null>(
    steps[0]?.id ?? null
  );
  const activeStepId = steps.some((step) => step.id === activeStepIdState)
    ? activeStepIdState
    : steps[0]?.id ?? null;

  const summaryItems = [
    { label: "Title", value: title.trim() || "Untitled recipe" },
    { label: "Servings", value: servings.trim() || "Not set" },
    {
      label: "Ingredients",
      value: `${ingredientCount} item${ingredientCount === 1 ? "" : "s"}`,
    },
    { label: "Steps", value: `${stepCount} step${stepCount === 1 ? "" : "s"}` },
  ];

  return (
    <div className="recipe-editor-shell">
      {formError ? (
        <p className="recipe-editor-alert recipe-editor-alert--error">{formError}</p>
      ) : null}

      {formStatus ? (
        <p className="recipe-editor-alert recipe-editor-alert--success">
          {formStatus}
        </p>
      ) : null}

      {tertiaryAction ? (
        <div className="lg:hidden">
          <a className="recipe-editor-tertiary-link" href={tertiaryAction.href}>
            {tertiaryAction.label}
          </a>
        </div>
      ) : null}

      <div className="recipe-editor-layout">
        <div className="recipe-editor-main">
          <section className="recipe-editor-section">
            <div className="recipe-editor-section__header">
              <div>
                <p className="recipe-editor-section__eyebrow">Recipe details</p>
                <h2 className="recipe-editor-section__title">
                  Start with the core details
                </h2>
              </div>
              {detailsHint ? (
                <div className="recipe-editor-details-hint">{detailsHint}</div>
              ) : null}
            </div>

            <div className="recipe-editor-fields">
              <label className="recipe-editor-field recipe-editor-field--title">
                <span className="recipe-editor-label">Title</span>
                <input
                  className="recipe-editor-input recipe-editor-input--title"
                  placeholder="Citrus herb chicken"
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                />
              </label>

              <div className="recipe-editor-metadata-row">
                <label className="recipe-editor-field">
                  <span className="recipe-editor-label">Prep minutes</span>
                  <input
                    className="recipe-editor-input"
                    inputMode="numeric"
                    placeholder="20"
                    value={prepMinutes}
                    onChange={(event) => onPrepMinutesChange(event.target.value)}
                  />
                </label>

                <label className="recipe-editor-field">
                  <span className="recipe-editor-label">Cook minutes</span>
                  <input
                    className="recipe-editor-input"
                    inputMode="numeric"
                    placeholder="45"
                    value={cookMinutes}
                    onChange={(event) => onCookMinutesChange(event.target.value)}
                  />
                </label>

                <label className="recipe-editor-field">
                  <span className="recipe-editor-label">Servings</span>
                  <input
                    className="recipe-editor-input"
                    inputMode="numeric"
                    placeholder="4"
                    value={servings}
                    onChange={(event) => onServingsChange(event.target.value)}
                  />
                </label>
              </div>

              <label className="recipe-editor-field">
                <span className="recipe-editor-label">Description</span>
                <textarea
                  className="recipe-editor-textarea"
                  placeholder="Bright, savory chicken with citrus zest and herbs."
                  value={description}
                  onChange={(event) => onDescriptionChange(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="recipe-editor-section recipe-editor-section--soft">
            <button
              className="recipe-editor-section-toggle lg:hidden"
              type="button"
              onClick={() => setMobileTaxonomyOpen((prev) => !prev)}
            >
              <div>
                <p className="recipe-editor-section__eyebrow">Tags & categories</p>
                <h2 className="recipe-editor-section__title">Organize the recipe</h2>
                <p className="recipe-editor-section__summary">
                  {selectedTags.length + selectedCategories.length} selected
                </p>
              </div>
              <span className="recipe-editor-section-toggle__text">
                {mobileTaxonomyOpen ? "Hide" : "Show"}
              </span>
            </button>

            <div className="recipe-editor-section__header hidden lg:flex">
              <div>
                <p className="recipe-editor-section__eyebrow">Tags & categories</p>
                <h2 className="recipe-editor-section__title">Organize the recipe</h2>
              </div>
              <p className="recipe-editor-section__summary">
                Keep tags and categories lightweight and easy to scan.
              </p>
            </div>

            <div
              className={cx(
                "recipe-editor-taxonomy-grid",
                mobileTaxonomyOpen ? "grid" : "hidden lg:grid"
              )}
            >
              <TaxonomyColumn
                addButtonLabel="Add tag"
                availableItems={availableTags}
                emptyFilteredLabel="No tags match your search."
                emptyLabel="No existing tags found."
                filteredItems={filteredTags}
                inputPlaceholder="Seasonal"
                isLoading={isLoadingTags}
                newItemName={newTagName}
                onAddItem={onAddNewTag}
                onNewItemNameChange={onNewTagNameChange}
                onRemoveItem={onRemoveSelectedTag}
                onSearchTermChange={onTagSearchTermChange}
                onSelectItem={onSelectTag}
                onSelectValueChange={onTagSelectValueChange}
                searchPlaceholder="Search tags"
                searchTerm={tagSearchTerm}
                selectPlaceholder="Select a tag"
                selectValue={tagSelectValue}
                selectedItems={selectedTags}
                title="Tags"
              />

              <TaxonomyColumn
                addButtonLabel="Add category"
                availableItems={availableCategories}
                emptyFilteredLabel="No categories match your search."
                emptyLabel="No existing categories found."
                filteredItems={filteredCategories}
                inputPlaceholder="Dinner"
                isLoading={isLoadingCategories}
                newItemName={newCategoryName}
                onAddItem={onAddNewCategory}
                onNewItemNameChange={onNewCategoryNameChange}
                onRemoveItem={onRemoveSelectedCategory}
                onSearchTermChange={onCategorySearchTermChange}
                onSelectItem={onSelectCategory}
                onSelectValueChange={onCategorySelectValueChange}
                searchPlaceholder="Search categories"
                searchTerm={categorySearchTerm}
                selectPlaceholder="Select a category"
                selectValue={categorySelectValue}
                selectedItems={selectedCategories}
                title="Categories"
              />
            </div>
          </section>

          <section className="recipe-editor-section">
            <div className="recipe-editor-section__header">
              <div>
                <p className="recipe-editor-section__eyebrow">Ingredients</p>
                <h2 className="recipe-editor-section__title">Build the ingredient list</h2>
              </div>
              <div className="recipe-editor-section__actions">
                <p className="recipe-editor-section__summary">
                  {ingredientCount} ingredient{ingredientCount === 1 ? "" : "s"} listed
                </p>
                <button
                  className="recipe-editor-inline-action"
                  type="button"
                  onClick={onAddIngredient}
                >
                  Add ingredient
                </button>
              </div>
            </div>

            <div className="recipe-editor-ingredient-head">
              <span>#</span>
              <span>Ingredient</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Note</span>
              <span>Optional</span>
              <span className="text-right">Remove</span>
            </div>

            <div className="recipe-editor-ingredient-list">
              {ingredients.map((ingredient, index) => (
                <div
                  key={ingredient.id}
                  className="recipe-editor-ingredient-row"
                  data-has-value={ingredient.ingredientText.trim() ? "true" : "false"}
                >
                  <div className="recipe-editor-ingredient-row__mobile-head lg:hidden">
                    <span className="recipe-editor-row-number">Ingredient {index + 1}</span>
                    <button
                      className="recipe-editor-remove"
                      type="button"
                      onClick={() => onRemoveIngredient(ingredient.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="recipe-editor-ingredient-index hidden lg:flex">
                    <span className="recipe-editor-row-badge">{index + 1}</span>
                  </div>

                  <label className="recipe-editor-field">
                    <span className="recipe-editor-label lg:sr-only">Ingredient</span>
                    <input
                      className="recipe-editor-input"
                      placeholder="Chicken thighs"
                      value={ingredient.ingredientText}
                      onChange={(event) =>
                        onHandleIngredientChange(
                          ingredient.id,
                          "ingredientText",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <div className="recipe-editor-ingredient-inline">
                    <label className="recipe-editor-field">
                      <span className="recipe-editor-label lg:sr-only">Quantity</span>
                      <input
                        className="recipe-editor-input"
                        inputMode="decimal"
                        placeholder="1.5"
                        value={ingredient.quantity}
                        onChange={(event) =>
                          onHandleIngredientChange(
                            ingredient.id,
                            "quantity",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label className="recipe-editor-field">
                      <span className="recipe-editor-label lg:sr-only">Unit</span>
                      <input
                        className="recipe-editor-input"
                        placeholder="lbs"
                        value={ingredient.unit}
                        onChange={(event) =>
                          onHandleIngredientChange(
                            ingredient.id,
                            "unit",
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </div>

                  <label className="recipe-editor-field recipe-editor-ingredient-note">
                    <span className="recipe-editor-label lg:sr-only">Note</span>
                    <input
                      className="recipe-editor-input"
                      placeholder="Finely chopped"
                      value={ingredient.note}
                      onChange={(event) =>
                        onHandleIngredientChange(
                          ingredient.id,
                          "note",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="recipe-editor-checkbox">
                    <input
                      type="checkbox"
                      checked={ingredient.isOptional}
                      onChange={(event) =>
                        onHandleIngredientChange(
                          ingredient.id,
                          "isOptional",
                          event.target.checked
                        )
                      }
                    />
                    <span>Optional</span>
                  </label>

                  <button
                    className="recipe-editor-remove hidden lg:inline-flex"
                    type="button"
                    onClick={() => onRemoveIngredient(ingredient.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="recipe-editor-section recipe-editor-section--steps">
            <button
              className="recipe-editor-section-toggle lg:hidden"
              type="button"
              onClick={() => setMobileStepsOpen((prev) => !prev)}
            >
              <div>
                <p className="recipe-editor-section__eyebrow">Preparation steps</p>
                <h2 className="recipe-editor-section__title">Build the method</h2>
                <p className="recipe-editor-section__summary">
                  {stepCount} step{stepCount === 1 ? "" : "s"} ready to edit
                </p>
              </div>
              <span className="recipe-editor-section-toggle__text">
                {mobileStepsOpen ? "Hide" : "Show"}
              </span>
            </button>

            <div className="recipe-editor-section__header hidden lg:flex">
              <div>
                <p className="recipe-editor-section__eyebrow">Preparation steps</p>
                <h2 className="recipe-editor-section__title">Build the method</h2>
              </div>
              <div className="recipe-editor-section__actions">
                <p className="recipe-editor-section__summary">
                  Focus on one step at a time on mobile.
                </p>
                <button
                  className="recipe-editor-inline-action"
                  type="button"
                  onClick={onAddStep}
                >
                  Add step
                </button>
              </div>
            </div>

            <div
              className={cx(
                "recipe-editor-step-list",
                mobileStepsOpen ? "flex" : "hidden lg:flex"
              )}
            >
              {steps.map((step, index) => {
                const isActive = activeStepId === step.id;

                return (
                  <div
                    key={step.id}
                    className={cx(
                      "recipe-editor-step-card",
                      isActive && "recipe-editor-step-card--active"
                    )}
                  >
                    <button
                      className="recipe-editor-step-toggle"
                      type="button"
                      onClick={() =>
                        setActiveStepId((prev) => (prev === step.id ? null : step.id))
                      }
                    >
                      <span className="recipe-editor-step-number">{index + 1}</span>
                      <span className="recipe-editor-step-toggle__content">
                        <span className="recipe-editor-step-toggle__label">
                          Step {index + 1}
                        </span>
                        <span className="recipe-editor-step-toggle__preview">
                          {getStepPreview(step.content)}
                        </span>
                      </span>
                      <span className="recipe-editor-step-toggle__action lg:hidden">
                        {isActive ? "Hide" : "Edit"}
                      </span>
                    </button>

                    <div className={cx(!isActive && "hidden lg:block")}>
                      <div className="recipe-editor-step-toolbar">
                        <button
                          className="recipe-editor-remove"
                          type="button"
                          onClick={() => onRemoveStep(step.id)}
                        >
                          Remove step
                        </button>
                      </div>

                      <label className="recipe-editor-field">
                        <span className="recipe-editor-label sr-only">Step content</span>
                        <textarea
                          className="recipe-editor-textarea recipe-editor-textarea--step"
                          placeholder="Describe the prep work for this step."
                          value={step.content}
                          onChange={(event) =>
                            onHandleStepChange(step.id, event.target.value)
                          }
                        />
                      </label>

                      <div className="recipe-editor-step-ingredients">
                        <div className="recipe-editor-step-ingredients__header">
                          <p className="recipe-editor-step-ingredients__title">
                            Assigned ingredients
                          </p>
                          <p className="recipe-editor-step-ingredients__summary">
                            Keep this secondary and only link what the step uses.
                          </p>
                        </div>

                        {ingredientCount ? (
                          <div className="recipe-editor-step-ingredients__grid">
                            {ingredients.map((ingredient, ingredientIndex) => {
                              const label = ingredient.ingredientText.trim()
                                ? ingredient.ingredientText.trim()
                                : `Ingredient ${ingredientIndex + 1}`;

                              return (
                                <label
                                  key={ingredient.id}
                                  className="recipe-editor-checkbox recipe-editor-checkbox--subtle"
                                >
                                  <input
                                    type="checkbox"
                                    checked={ingredient.assignedStepIds.includes(step.id)}
                                    onChange={() =>
                                      onToggleIngredientStep(ingredient.id, step.id)
                                    }
                                  />
                                  <span>{label}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="recipe-editor-helper">
                            Add ingredients above to assign them to this step.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="recipe-editor-sidebar">
          <div className="recipe-editor-sidebar-card">
            <p className="recipe-editor-section__eyebrow">Save</p>
            <div className="recipe-editor-sidebar-actions">
              <button
                className="recipe-editor-action recipe-editor-action--primary"
                type="button"
                onClick={onPrimaryAction}
                disabled={isSaving}
              >
                {isSaving ? primaryActionPendingLabel : primaryActionLabel}
              </button>
              {tertiaryAction ? (
                <a className="recipe-editor-tertiary-link" href={tertiaryAction.href}>
                  {tertiaryAction.label}
                </a>
              ) : null}
            </div>
          </div>

          <div className="recipe-editor-sidebar-card">
            <p className="recipe-editor-section__eyebrow">Summary</p>
            <div className="recipe-editor-summary-list">
              {summaryItems.map((item) => (
                <div key={item.label} className="recipe-editor-summary-list__item">
                  <span className="recipe-editor-summary-list__label">
                    {item.label}
                  </span>
                  <span className="recipe-editor-summary-list__value">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="recipe-editor-mobile-bar">
        <button
          className="recipe-editor-action recipe-editor-action--primary"
          type="button"
          onClick={onPrimaryAction}
          disabled={isSaving}
        >
          {isSaving ? primaryActionPendingLabel : primaryActionLabel}
        </button>
      </div>
    </div>
  );
}
