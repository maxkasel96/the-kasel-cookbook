"use client";

import { Clock, Heart, Users } from "lucide-react";
import Link from "next/link";

import type { FavoriteRecipe } from "@/lib/use-favorites";

type RecipeCardProps = {
  recipe: FavoriteRecipe;
  isFavorite: boolean;
  onToggleFavorite: (recipe: FavoriteRecipe) => void;
  href?: string;
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export default function RecipeCard({
  recipe,
  isFavorite,
  onToggleFavorite,
  href = `/recipes/${recipe.slug}`,
}: RecipeCardProps) {
  const totalTime =
    (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0) || null;

  return (
    <Link href={href} className="recipe-card group h-full">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleFavorite(recipe);
        }}
        className={`recipe-card__favorite ${
          isFavorite ? "recipe-card__favorite--active" : ""
        }`}
        aria-label={
          isFavorite
            ? `Remove ${recipe.title} from favorites`
            : `Add ${recipe.title} to favorites`
        }
      >
        <Heart aria-hidden="true" fill={isFavorite ? "currentColor" : "none"} />
      </button>

      <div className="recipe-card__content">
        <h2 className="recipe-card__title">{recipe.title}</h2>
        <p className="recipe-card__description">
          {recipe.description || "A saved recipe ready for the kitchen."}
        </p>
      </div>

      <div className="recipe-card__meta" aria-label="Recipe metadata">
        {totalTime ? (
          <span>
            <Clock aria-hidden="true" />
            {formatMinutes(totalTime)}
          </span>
        ) : null}
        {recipe.servings ? (
          <span>
            <Users aria-hidden="true" />
            {recipe.servings} servings
          </span>
        ) : null}
        {!totalTime && !recipe.servings ? <span>Ready to cook</span> : null}
      </div>

      <span className="recipe-card__footer">
        View recipe
      </span>
    </Link>
  );
}
