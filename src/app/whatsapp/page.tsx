import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAdmin } from "@/lib/auth";
import WhatsAppSender from "@/components/WhatsAppSender";

async function AuthGate({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/login");
  return <>{children}</>;
}

function Loading() {
  return <div className="container" style={{ paddingTop: 40 }}>Loading...</div>;
}

export default function WhatsAppPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthGate>
        <WhatsAppSender />
      </AuthGate>
    </Suspense>
  );
}
