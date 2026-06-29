import { PageShell, Skeleton } from "@/components/ui/primitives";

export default function MealDetailLoading() {
  return (
    <PageShell variant="default">
      <Skeleton className="h-56 w-full" />
      <section className="meal-detail-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-56 w-full" />
        ))}
      </section>
    </PageShell>
  );
}
