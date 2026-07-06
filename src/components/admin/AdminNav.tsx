"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Басты бет", exact: true },
  { href: "/admin/codes", label: "Кодтар" },
  { href: "/admin/subjects", label: "Пәндер" },
  { href: "/admin/questions", label: "Сұрақтар" },
  { href: "/admin/statistics", label: "Статистика" },
];

export function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex w-56 flex-none flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <p className="text-sm font-bold text-gray-900">Online Test</p>
        <p className="text-xs text-gray-400">Админ панелі</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 p-3">
        <p className="px-2 pb-2 text-xs text-gray-400">👤 {username}</p>
        <button
          onClick={logout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Шығу
        </button>
      </div>
    </aside>
  );
}
