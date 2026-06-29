import { PageShell, Skeleton } from "@/components/ui/primitives";

export default function RecipeDetailLoading() {
  return (
    <PageShell variant="detail">
      <Skeleton className="h-72 w-full" />
      <section className="recipe-cook-layout">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </section>
      <Skeleton className="h-80 w-full" />
    </PageShell>
  );
}
