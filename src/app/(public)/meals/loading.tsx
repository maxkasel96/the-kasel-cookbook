import { PageHeader, PageShell, Skeleton } from "@/components/ui/primitives";

export default function MealsLoading() {
  return (
    <PageShell variant="wide">
      <PageHeader title="Meals" />
      <section className="meal-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-72 w-full" />
        ))}
      </section>
    </PageShell>
  );
}
