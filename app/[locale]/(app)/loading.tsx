import { getTranslations } from "next-intl/server";
import { CardSkeleton, Skeleton } from "@/components/ui/states";

/** Designed loading state for every app screen (no spinners). */
export default async function Loading() {
  const t = await getTranslations("common");
  return (
    <div className="flex flex-col gap-8" aria-busy>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <CardSkeleton label={t("loading")} />
      <CardSkeleton label={t("loading")} />
    </div>
  );
}
