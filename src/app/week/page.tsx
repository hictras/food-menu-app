import { Suspense } from "react";
import WeekClient from "./WeekClient";
import Spinner from "@/components/Spinner";


export default function WeekPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <WeekClient />
    </Suspense>
  );
}
