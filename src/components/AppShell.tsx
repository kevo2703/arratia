"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  Package,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Inicio", Icon: LayoutDashboard },
  { href: "/cotizaciones", label: "Cotizaciones", Icon: FileText },
  { href: "/clientes", label: "Clientes", Icon: Users },
  { href: "/productos", label: "Productos", Icon: Package },
  { href: "/configuracion", label: "Configuración", Icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      {/* Topbar móvil (oculta en desktop) */}
      <header className="md:hidden bg-[var(--secondary)] text-[var(--secondary-foreground)] flex items-center justify-between px-4 h-14 sticky top-0 z-30 shadow-sm">
        <div>
          <span className="text-lg font-extrabold tracking-tight">ARRATIA</span>
          <span className="text-xs text-white/60 ml-2">Cotizador EPP</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 hover:bg-white/10 rounded-md"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Backdrop (solo móvil cuando drawer abierto) */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (drawer en móvil, fija en desktop) */}
      <aside
        className={cn(
          "w-64 bg-[var(--secondary)] text-[var(--secondary-foreground)] flex flex-col",
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out",
          "md:static md:translate-x-0 md:flex-shrink-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="text-xl font-extrabold tracking-tight">ARRATIA</div>
            <div className="text-xs text-white/60 mt-1">Cotizador EPP</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-1 hover:bg-white/10 rounded"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-white/10 transition-colors"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <LogoutButton className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-white/10 transition-colors">
            <LogOut size={18} /> Cerrar sesión
          </LogoutButton>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden min-w-0">{children}</main>
    </div>
  );
}
