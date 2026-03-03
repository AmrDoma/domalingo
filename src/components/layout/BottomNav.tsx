"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/lessons", label: "Lessons", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Zap },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-pb">
      <div className="max-w-lg mx-auto px-2 flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-3 px-2 text-xs font-medium transition-colors",
                active
                  ? "text-indigo-600"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  active && "scale-110",
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
