import { connection } from "next/server";
import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import AnalyticsView from "./view";

// La période par défaut dépend de la date du jour : la page se calcule à chaque visite, jamais à l'avance.
async function Content() {
  await connection();
  return <AnalyticsView />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Content />
    </Suspense>
  );
}
