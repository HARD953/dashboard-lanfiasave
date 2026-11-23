import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import AnalyticsView from "./view";

// La période par défaut dépend de la date du jour : la page se calcule à chaque visite.
export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AnalyticsView />
    </Suspense>
  );
}
