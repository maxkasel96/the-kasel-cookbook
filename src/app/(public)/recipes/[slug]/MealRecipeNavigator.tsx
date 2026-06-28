import Link from 'next/link'

type MealRecipeNavigationItem = {
  slug: string
  title: string
}

type MealRecipeNavigatorProps = {
  meal: {
    slug: string
    title: string
  }
  currentIndex: number
  recipes: MealRecipeNavigationItem[]
}

const getRecipeHref = (recipeSlug: string, mealSlug: string) =>
  `/recipes/${recipeSlug}?meal=${encodeURIComponent(mealSlug)}`

export default function MealRecipeNavigator({
  meal,
  currentIndex,
  recipes,
}: MealRecipeNavigatorProps) {
  const recipeCount = recipes.length
  const previousRecipe = currentIndex > 0 ? recipes[currentIndex - 1] : null
  const nextRecipe =
    currentIndex < recipeCount - 1 ? recipes[currentIndex + 1] : null

  return (
    <nav
      className="meal-recipe-navigator"
      aria-label={`Recipes in ${meal.title}`}
    >
      <div className="meal-recipe-navigator__context">
        <Link
          href={`/meals/${meal.slug}`}
          className="meal-recipe-navigator__back"
        >
          Back to meal
        </Link>
        <div className="meal-recipe-navigator__meta">
          <span className="meal-recipe-navigator__meal">{meal.title}</span>
          <span className="meal-recipe-navigator__position">
            Recipe {currentIndex + 1} of {recipeCount}
          </span>
        </div>
      </div>

      <div className="meal-recipe-navigator__actions">
        {previousRecipe ? (
          <Link
            href={getRecipeHref(previousRecipe.slug, meal.slug)}
            className="meal-recipe-navigator__link"
            aria-label={`Previous recipe: ${previousRecipe.title}`}
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </Link>
        ) : (
          <span
            className="meal-recipe-navigator__link meal-recipe-navigator__link--disabled"
            aria-disabled="true"
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </span>
        )}

        {nextRecipe ? (
          <Link
            href={getRecipeHref(nextRecipe.slug, meal.slug)}
            className="meal-recipe-navigator__link meal-recipe-navigator__link--primary"
            aria-label={`Next recipe: ${nextRecipe.title}`}
          >
            <span>Next</span>
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span
            className="meal-recipe-navigator__link meal-recipe-navigator__link--disabled"
            aria-disabled="true"
          >
            <span>Next</span>
            <span aria-hidden="true">→</span>
          </span>
        )}
      </div>
    </nav>
  )
}
