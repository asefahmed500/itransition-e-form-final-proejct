// app/auth/check-role/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function CheckRoleLogic() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "admin" || session?.user?.role === "super-admin") {
        router.replace("/admin/dashboard");
        return;
      }
      router.replace(callbackUrl);
    } else if (status === "unauthenticated") {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, session, router, callbackUrl]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function CheckRolePage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <CheckRoleLogic />
    </Suspense>
  );
}
