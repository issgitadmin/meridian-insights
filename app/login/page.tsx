import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Meridian Insights" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
