import { PageHeader, PageShell, Skeleton } from "@/components/ui/primitives";

export default function RecipesLoading() {
  return (
    <PageShell variant="wide">
      <PageHeader title="Recipes" />
      <Skeleton className="h-36 w-full" />
      <section className="recipe-grid sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-64 w-full" />
        ))}
      </section>
    </PageShell>
  );
}
