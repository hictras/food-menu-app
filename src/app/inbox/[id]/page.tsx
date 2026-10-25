import { Suspense } from "react";
import InboxDetailClient from "./InboxDetailClient";

export default async function InboxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}>Loading…</div>}>
      <InboxDetailClient id={id} />
    </Suspense>
  );
}
