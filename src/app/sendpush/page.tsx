import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAdmin } from "@/lib/auth";
import AdminSender from "@/components/AdminSender";

async function AuthGate({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/login");
  return <>{children}</>;
}

function Loading() {
  return <div className="container" style={{ paddingTop: 40 }}>Loading...</div>;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthGate>
        <AdminSender />
      </AuthGate>
    </Suspense>
  );
}
