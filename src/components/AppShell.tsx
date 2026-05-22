import Link from "next/link";
import { FileText, Users, Package, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const nav = [
  { href: "/", label: "Inicio", Icon: LayoutDashboard },
  { href: "/cotizaciones", label: "Cotizaciones", Icon: FileText },
  { href: "/clientes", label: "Clientes", Icon: Users },
  { href: "/productos", label: "Productos", Icon: Package },
  { href: "/configuracion", label: "Configuración", Icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-[var(--secondary)] text-[var(--secondary-foreground)] flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="text-xl font-extrabold tracking-tight">ARRATIA</div>
          <div className="text-xs text-white/60 mt-1">Cotizador EPP</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-white/10 transition-colors"
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
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
