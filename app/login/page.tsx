"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-white text-2xl font-bold tracking-tighter uppercase font-headline-lg">
            ECUADOR<span className="text-[#3444DA]">2026</span>
          </span>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest font-label-sm">
            Admin Console
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111111] border border-[#222222] p-8 space-y-6"
        >
          <div className="flex flex-col gap-2">
            <label className="text-zinc-400 text-[11px] uppercase tracking-widest font-semibold">
              Correo electrónico
            </label>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              className="bg-[#1a1a1a] border border-[#2a2a2a] text-white px-4 py-3 text-sm outline-none focus:border-[#3444DA] transition-colors placeholder:text-zinc-700"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-zinc-400 text-[11px] uppercase tracking-widest font-semibold">
              Contraseña
            </label>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-[#1a1a1a] border border-[#2a2a2a] text-white px-4 py-3 text-sm outline-none focus:border-[#3444DA] transition-colors placeholder:text-zinc-700"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm border border-red-900/50 bg-red-900/10 px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3444DA] text-white py-3 text-sm font-semibold uppercase tracking-widest hover:bg-[#2a38c0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
