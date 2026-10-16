import RecipeForm from "@/components/RecipeForm";
import NewRecipeShell from "@/components/NewRecipeShell";

export default function NewRecipePage() {
  return (
    <main className="container">
      <NewRecipeShell>
        <RecipeForm />
      </NewRecipeShell>
    </main>
  );
}
