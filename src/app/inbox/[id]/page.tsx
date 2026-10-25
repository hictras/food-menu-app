import { Suspense } from "react";
import InboxDetailShell from "./InboxDetailShell";

export default function InboxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}>Loading…</div>}>
      <InboxDetailShell params={params} />
    </Suspense>
  );
}
