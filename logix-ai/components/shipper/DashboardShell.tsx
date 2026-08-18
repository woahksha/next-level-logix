"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PackagePlus, ListOrdered, LogOut } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { useShipper } from "@/hooks/useShipper";

const NAV_ITEMS = [
  {
    href: "/shipper/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) => pathname === "/shipper/dashboard",
  },
  {
    href: "/shipper/orders/new",
    label: "Post Order",
    icon: PackagePlus,
    isActive: (pathname: string) => pathname === "/shipper/orders/new",
  },
  {
    href: "/shipper/orders",
    label: "My Orders",
    icon: ListOrdered,
    isActive: (pathname: string) => pathname === "/shipper/orders" || (pathname.startsWith("/shipper/orders/") && !pathname.startsWith("/shipper/orders/new")),
  },
];

export function ShipperDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useShipper();

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-surface-border bg-white">
        <Container className="flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-navy-800">{profile?.name}</p>
              <p className="text-xs text-neutral-500">{profile?.companyName}</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/shipper");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-surface-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </Container>
      </header>

      <Container className="grid gap-6 py-6 lg:grid-cols-[220px_1fr] lg:py-10">
        <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV_ITEMS.map((item) => {
            const isActive = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-navy-700 text-white shadow-soft"
                    : "text-neutral-600 hover:bg-white hover:text-navy-800"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0">{children}</main>
      </Container>
    </div>
  );
}
