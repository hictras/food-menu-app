import InboxDetailClient from "./InboxDetailClient";

export default async function InboxDetailShell({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InboxDetailClient id={id} />;
}
