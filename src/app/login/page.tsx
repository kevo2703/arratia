import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Entrar · Arratia Cotizador" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--primary)]">
            ARRATIA
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            Cotizador EPP — inicia sesión con tu correo
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
