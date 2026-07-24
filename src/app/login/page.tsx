import { Suspense } from "react";
import LoginClient from "./login-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-[13px] text-muted-foreground" data-theme="dark">
          Loading…
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
