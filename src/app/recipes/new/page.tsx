import { redirect } from "next/navigation";
import { Suspense } from "react";
import RecipeForm from "@/components/RecipeForm";
import NewRecipeShell from "@/components/NewRecipeShell";
import { isAdmin } from "@/lib/auth";

async function AuthGate({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/login");
  return <>{children}</>;
}

function FormSkeleton() {
  return <div className="form-card" style={{ height: 400, opacity: 0.4 }} />;
}

export default function NewRecipePage() {
  return (
    <main className="container">
      <Suspense fallback={<FormSkeleton />}>
        <AuthGate>
          <NewRecipeShell>
            <RecipeForm />
          </NewRecipeShell>
        </AuthGate>
      </Suspense>
    </main>
  );
}
