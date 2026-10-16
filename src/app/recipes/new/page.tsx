import RecipeForm from "@/components/RecipeForm";

export default function NewRecipePage() {
  return (
    <main className="container">
      <div className="page-head">
        <h1>New Recipe</h1>
      </div>
      <p className="page-sub">Fill in the details below.</p>
      <RecipeForm />
    </main>
  );
}
