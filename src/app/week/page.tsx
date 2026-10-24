import { Suspense } from "react";
import WeekClient from "./WeekClient";

function WeekSkeleton() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 760 }}>
      <div className="week-summary" style={{ opacity: 0.4 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="week-day">
            <div className="week-day-name" style={{ background: "var(--line)", borderRadius: 4, height: 12 }} />
            <div className="week-day-meals">
              <div style={{ height: 14, background: "var(--line)", borderRadius: 4, width: "40%" }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function WeekPage() {
  return (
    <Suspense fallback={<WeekSkeleton />}>
      <WeekClient />
    </Suspense>
  );
}
