export function getRecipeImage(recipe: {
  imageUrl: string | null;
  latestImageUrl?: string | null;
  useLatestImage?: boolean | null;
}) {
  if (recipe.useLatestImage && recipe.latestImageUrl) {
    return recipe.latestImageUrl;
  }
  return recipe.imageUrl;
}
