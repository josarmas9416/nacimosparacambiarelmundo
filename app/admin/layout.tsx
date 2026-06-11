"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-client";
import { AdminContext } from "./context";

const NAV = [
  { href: "/admin",          label: "Pedidos",        icon: "receipt_long" },
  { href: "/admin/settings", label: "Configuración",  icon: "settings"     },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [token,       setToken]       = useState("");
  const [loading,     setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setToken(session.access_token);
      setLoading(false);
    });

    const { data: { subscription } } =
      supabaseBrowser.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.push("/login");
        }
      });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-zinc-500 text-[11px] uppercase tracking-widest animate-pulse">
          Cargando...
        </p>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ token }}>
      <div className="flex min-h-screen bg-[#0a0a0a] text-white">

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed top-0 left-0 h-full z-40 flex flex-col w-56
            bg-[#0d0d0d] border-r border-[#222222]
            transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:static lg:h-auto lg:shrink-0
          `}
        >
          {/* Logo */}
          <div className="px-5 py-5 border-b border-[#222222]">
            <p className="font-bold text-base tracking-tighter uppercase">
              ECUADOR<span className="text-[#3444DA]">2026</span>
            </p>
            <p className="text-zinc-600 text-[9px] uppercase tracking-[0.15em] mt-0.5">
              Admin Console
            </p>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {NAV.map(({ href, label, icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                    border-l-2 transition-all duration-150
                    ${active
                      ? "bg-[#3444DA]/10 text-[#3444DA] border-[#3444DA]"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border-transparent"
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">
                    {icon}
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-[#222222]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-colors w-full text-left rounded-sm"
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                logout
              </span>
              Salir
            </button>
          </div>
        </aside>

        {/* ── Content area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <header className="lg:hidden flex items-center justify-between bg-[#0d0d0d] border-b border-[#222222] px-4 py-3 sticky top-0 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Abrir menú"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-bold tracking-tighter uppercase text-sm">
              ECUADOR<span className="text-[#3444DA]">2026</span>
            </span>
            <div className="w-8" />
          </header>

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
